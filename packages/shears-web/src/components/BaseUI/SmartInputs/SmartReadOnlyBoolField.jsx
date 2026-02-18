import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function SmartReadOnlyBool({
  label,
  value = false,          // boolean | undefined | null
  mode = "edit",          // "read" | "edit"
  error,
  helperText,
  inputConfig = {},       // { onLabel?: string, offLabel?: string }
}) {
  const theme = useTheme();

  // Normalize value for display
  const displayText =
    value === true
      ? inputConfig.onLabel ?? "Enabled"
      : value === false
      ? inputConfig.offLabel ?? "Disabled"
      : (
        <Typography
          component="span"
          sx={{
            color: theme.palette.text.secondary,
            fontStyle: "italic",
          }}
        >
          Not set
        </Typography>
      );

  // Label styles
  const labelVariant = mode === "read" ? "h6" : "subtitle2";

  const labelColor =
    mode === "read"
      ? theme.palette.primary.main
      : error
      ? theme.palette.error.main
      : theme.palette.text.primary;

  return (
    <Box
      sx={{
        mb: mode === "read" ? 1 : 1.5,
      }}
    >
      <Typography
        variant={labelVariant}
        sx={{
          fontWeight: 500,
          mb: 0.5,
          color: labelColor,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          lineHeight: 1.6,
          color: theme.palette.text.primary,
        }}
      >
        {displayText}
      </Typography>

      {mode === "edit" && (error || helperText) && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            ml: 0.25,
            display: "block",
            color: error
              ? theme.palette.error.main
              : theme.palette.text.secondary,
          }}
        >
          {error || helperText}
        </Typography>
      )}
    </Box>
  );
}
