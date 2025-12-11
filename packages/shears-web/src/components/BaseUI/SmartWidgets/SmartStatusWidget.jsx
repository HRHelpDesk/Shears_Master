import React, { useContext, useState } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  updateRecord,
  saveCalendarAndNotification,
} from "shears-shared/src/Services/Authentication";

import { AuthContext } from "../../../context/AuthContext";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Completed"];

export default function SmartStatusWidgetWeb({
  label = "Status",
  value,
  item,
  mode = "read",
  onChangeText,
  onStatusUpdated, // optional update hook
}) {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(value || "Pending");
  const [notify, setNotify] = useState(true);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  /* ---------------------------------------------------------
     MAIN STATUS CONFIRM LOGIC (WEB)
  --------------------------------------------------------- */
  const handleConfirm = async () => {
    console.log("📌 WEB Status update:", { item, status, notify });

    try {
      // 1️⃣ Update DB
      await updateRecord(item._id, { ...item.fieldsData, status }, token);

      // 2️⃣ Update UI
      if (onStatusUpdated) onStatusUpdated(status);
      if (onChangeText) onChangeText(status);

      // 3️⃣ Calendar + Notification
      if (status === "Approved") {
        await saveCalendarAndNotification(item, user, token, notify);
      }

    } catch (err) {
      console.error("❌ Status update failed:", err);
    }

    closeModal();
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={openModal}
        sx={{ mt: 1 }}
      >
        {label}: {value || "Pending"}
      </Button>

      <Dialog open={open} onClose={closeModal} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          Update Status
          <IconButton onClick={closeModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Choose a new status:
          </Typography>

          <Stack spacing={1}>
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt}
                variant={opt === status ? "contained" : "outlined"}
                color={opt === "Rejected" ? "error" : "primary"}
                onClick={() => setStatus(opt)}
              >
                {opt}
              </Button>
            ))}
          </Stack>

          {/* Notification Switch */}
          <Box sx={{ mt: 3 }}>
            <Typography>Email / App Notification?</Typography>
            <Switch
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={handleConfirm}>
            Save Status
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
