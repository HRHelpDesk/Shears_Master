import React, { useContext, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Switch,
  Typography,
  IconButton,
  useTheme,
  Box,
  TextField,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  updateRecord,
  saveCalendarAndNotification,
  sendRejectionNotification,
} from "shears-shared/src/Services/Authentication";

import { AuthContext } from "../../../context/AuthContext";
import { formatDateValue } from "shears-shared/src/utils/stringHelpers";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Completed"];

export default function SmartStatusWidgetWeb({
  label = "Status",
  value,
  item,
  mode = "read",
  onChangeText,
  onStatusUpdated,
}) {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(value || "Pending");
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");

  const openModal = () => setOpen(true);
  const closeModal = () => {
    if (!loading) setOpen(false);
  };

  /* ---------------------------------------------------------
     MAIN STATUS CONFIRM LOGIC (WEB)
  --------------------------------------------------------- */
  const handleConfirm = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const updatedItem = {
        ...item.fieldsData,
        status,
      };

      if (status === "Rejected" && rejectionMessage.trim()) {
        updatedItem.rejectionMessage = rejectionMessage.trim();

        await sendRejectionNotification(
          item,
          user,
          token,
          rejectionMessage.trim()
        );
      }

      // 1️⃣ Update DB
      await updateRecord(item._id, updatedItem, token);

      // 2️⃣ Update UI
      if (onStatusUpdated) onStatusUpdated(status);
      if (onChangeText) onChangeText(status);

      // 3️⃣ Calendar + Notification
      if (status === "Approved") {
        const formattedDates = Array.isArray(item.date)
          ? item.date.map((d) => formatDateValue(d)).join(", ")
          : formatDateValue(item.date);

        const message = `Your request for ${formattedDates} has been approved. Please check your calendar for the details.`;

        await saveCalendarAndNotification(
          item,
          user,
          token,
          notify,
          message
        );
      }

      setOpen(false);
    } catch (err) {
      console.error("❌ Status update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={openModal} sx={{ mt: 1 }}>
        {label}: {value || "Pending"}
      </Button>

      <Dialog
        open={open}
        onClose={closeModal}
        fullWidth
        maxWidth="xs"
        disableEscapeKeyDown={loading}
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          Update Status
          <IconButton onClick={closeModal} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            Choose a new status:
          </Typography>

          <Stack spacing={1}>
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt}
                variant={opt === status ? "contained" : "outlined"}
                color={opt === "Rejected" ? "error" : "primary"}
                disabled={loading}
                onClick={() => setStatus(opt)}
              >
                {opt}
              </Button>
            ))}
          </Stack>

          {/* Rejection Message */}
          {status === "Rejected" && (
            <TextField
              fullWidth
              multiline
              minRows={3}
              sx={{ mt: 3 }}
              label="Rejection Message"
              value={rejectionMessage}
              disabled={loading}
              onChange={(e) => setRejectionMessage(e.target.value)}
            />
          )}

          {/* Notification Switch */}
          <Box sx={{ mt: 3 }}>
            <Typography>Email / App Notification?</Typography>
            <Switch
              checked={notify}
              disabled={loading}
              onChange={(e) => setNotify(e.target.checked)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={loading}
          >
            Save Status
          </Button>
        </DialogActions>

        {/* SPLASH LOADER OVERLAY */}
        <Backdrop
          open={loading}
          sx={{
            position: "absolute",
            zIndex: theme.zIndex.modal + 1,
            color: "#fff",
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress color="inherit" />
            <Typography>Updating Status...</Typography>
          </Stack>
        </Backdrop>
      </Dialog>
    </>
  );
}
