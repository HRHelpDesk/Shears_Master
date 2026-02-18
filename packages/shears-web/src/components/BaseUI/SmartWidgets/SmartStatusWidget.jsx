import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Switch,
  FormControlLabel,
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

/* ============================================================
   Status Helpers
============================================================ */
const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Completed"];

const STATUS_COLORS = {
  Approved:  { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32" },
  Rejected:  { bg: "#FFEBEE", border: "#F44336", text: "#C62828" },
  Completed: { bg: "#F3E5F5", border: "#9C27B0", text: "#6A1B9A" },
  Pending:   { bg: "#FFF3E0", border: "#FF9800", text: "#E65100" },
};

function getStatusColors(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.Pending;
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
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

  const [open, setOpen]                         = useState(false);
  const [status, setStatus]                     = useState(value || "Pending");
  const [notify, setNotify]                     = useState(true);
  const [loading, setLoading]                   = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");

  const openModal  = () => setOpen(true);
  const closeModal = () => { if (!loading) setOpen(false); };

  const triggerColors = getStatusColors(value || "Pending");

  /* ---------------------------------------------------------
     CONFIRM HANDLER (unchanged logic)
  --------------------------------------------------------- */
  const handleConfirm = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const updatedItem = { ...item.fieldsData, status };

      if (status === "Rejected" && rejectionMessage.trim()) {
        updatedItem.rejectionMessage = rejectionMessage.trim();
        await sendRejectionNotification(item, user, token, rejectionMessage.trim());
      }

      await updateRecord(item._id, updatedItem, token);

      if (onStatusUpdated) onStatusUpdated(status);
      if (onChangeText) onChangeText(status);

      if (status === "Approved") {
        const formattedDates = Array.isArray(item.date)
          ? item.date.map((d) => formatDateValue(d)).join(", ")
          : formatDateValue(item.date);

        const message = `Your request for ${formattedDates} has been approved. Please check your calendar for the details.`;
        await saveCalendarAndNotification(item, user, token, notify, message);
      }

      setOpen(false);
    } catch (err) {
      console.error("❌ Status update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */
  return (
    <>
      {/* ── Trigger Button ── */}
      <Button
        variant="outlined"
        size="small"
        onClick={openModal}
        endIcon={<span style={{ fontSize: 11, lineHeight: 1 }}>▾</span>}
        sx={{
          mt: 1,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9rem",
          borderColor: triggerColors.border,
          color: triggerColors.text,
          backgroundColor: triggerColors.bg,
          "&:hover": {
            borderColor: triggerColors.border,
            backgroundColor: triggerColors.bg,
            opacity: 0.85,
          },
        }}
      >
        {label}: {value || "Pending"}
      </Button>

      {/* ── Status Dialog ── */}
      <Dialog
        open={open}
        onClose={closeModal}
        fullWidth
        maxWidth="xs"
        disableEscapeKeyDown={loading}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 3,
            px: 3,
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Update Status
          </Typography>
          <IconButton onClick={closeModal} disabled={loading} size="small"
            sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          {/* Status Options */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            {STATUS_OPTIONS.map((opt) => {
              const colors     = getStatusColors(opt);
              const isSelected = opt === status;
              return (
                <Button
                  key={opt}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  onClick={() => setStatus(opt)}
                  sx={{
                    textTransform: "none",
                    justifyContent: "flex-start",
                    fontWeight: isSelected ? 700 : 400,
                    fontSize: "0.95rem",
                    py: 1.25,
                    borderColor: isSelected ? colors.border : theme.palette.divider,
                    color: isSelected ? colors.text : theme.palette.text.primary,
                    backgroundColor: isSelected ? colors.bg : "transparent",
                    "&:hover": {
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                    },
                  }}
                >
                  {opt}
                </Button>
              );
            })}
          </Box>

          {/* Rejection Message */}
          {status === "Rejected" && (
            <TextField
              fullWidth
              multiline
              minRows={3}
              sx={{ mb: 2 }}
              label="Rejection Message"
              value={rejectionMessage}
              disabled={loading}
              onChange={(e) => setRejectionMessage(e.target.value)}
            />
          )}

          {/* Notification Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={notify}
                disabled={loading}
                onChange={(e) => setNotify(e.target.checked)}
                color="primary"
              />
            }
            label="Send notification?"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={closeModal}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Save Status
          </Button>
        </DialogActions>

        {/* Loading Overlay */}
        <Backdrop
          open={loading}
          sx={{
            position: "absolute",
            zIndex: theme.zIndex.modal + 1,
            color: "#fff",
            borderRadius: 2,
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress color="inherit" />
            <Typography>Updating Status…</Typography>
          </Stack>
        </Backdrop>
      </Dialog>
    </>
  );
}