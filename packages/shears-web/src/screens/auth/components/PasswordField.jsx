import React, { useState } from "react";
import { Box, TextField } from "@mui/material";

export default function PasswordField({ field, value, onChange }) {
  const [confirm, setConfirm] = useState("");

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <TextField
        fullWidth
        type="password"
        label="Password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <TextField
        fullWidth
        type="password"
        label="Confirm Password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
    </Box>
  );
}
