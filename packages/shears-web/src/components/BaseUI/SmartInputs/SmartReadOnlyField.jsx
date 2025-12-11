// src/components/SmartInputs/SmartReadOnlyField.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function SmartReadOnlyField({ label, value }) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 1 }}>
      {/* Label */}
      <Typography
        variant="subtitle1"
        sx={{
          color: theme.palette.primary.main,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>

      {/* Value */}
      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.primary,
          lineHeight: 1.6,
          p: 1.2,
          borderRadius: 1,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : theme.palette.grey[100],
          border: `1px solid ${theme.palette.divider}`,
          whiteSpace: "pre-line",
        }}
      >
        {value && value.toString().trim() !== "" ? (
          value.toString()
        ) : (
          <span
            style={{
              color: theme.palette.text.disabled,
              fontStyle: "italic",
            }}
          >
            Not set
          </span>
        )}
      </Typography>
    </Box>
  );
}
