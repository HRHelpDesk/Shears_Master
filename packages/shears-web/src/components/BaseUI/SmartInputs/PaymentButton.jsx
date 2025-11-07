// src/components/SmartInputs/PaymentButton.web.jsx
import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  useTheme,
} from "@mui/material";

export default function PaymentButton({
  label = "Pay Now",
  onStatusChange,
  mode = "edit",
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

//   if (mode === "read") {
//     return (
//       <Button variant="contained" disabled sx={{ mt: 1 }}>
//         {label}
//       </Button>
//     );
//   }

  return (
    <>
      <Button
        variant="contained"
        sx={{
          mt: 1,
          background: theme.palette.primary.main,
          "&:hover": {
            background: theme.palette.primary.dark,
          },
        }}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Payment Status</DialogTitle>

        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Select a new status:
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              sx={{ background: theme.palette.primary.main }}
              onClick={() => {
                onStatusChange?.("Paid");
                setOpen(false);
              }}
            >
              Mark as Paid
            </Button>

            <Button
              variant="contained"
              sx={{ background: theme.palette.secondary.main }}
              onClick={() => {
                onStatusChange?.("Unpaid");
                setOpen(false);
              }}
            >
              Mark as Unpaid
            </Button>

            <Button
              variant="contained"
              sx={{ background: theme.palette.error.main }}
              onClick={() => {
                onStatusChange?.("Canceled");
                setOpen(false);
              }}
            >
              Mark as Canceled
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
