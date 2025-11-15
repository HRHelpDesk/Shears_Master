// src/components/BaseUI/SmartInputs/SmartSwitchInput.jsx
import React, { useState } from 'react';
import { Box, Typography, Switch } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function SmartSwitchInput({
  label,
  value = false,
  onChangeText,
  mode = "edit",
  error,
  helperText,
  inputConfig = {},   // ✅ added
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // ✅ Pull labels from inputConfig with fallback hierarchy
  const onLabel =
    inputConfig.onLabel ||
    "Active";

  const offLabel =
    inputConfig.offLabel ||
    "Inactive";


  const readOnLabel = inputConfig.readOnLabel || onLabel || "Yes";
  const readOffLabel = inputConfig.readOffLabel || offLabel || "No";

  /* --------------------------------------------- */
  /* ✅ READ MODE                                  */
  /* --------------------------------------------- */
  if (mode === 'read') {
    return (
      <Box sx={{ mb: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
        >
          {label}
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }}
        >
          {value === true
            ? readOnLabel
            : value === false
            ? readOffLabel
            : (
              <span style={{ color: theme.palette.text.disabled, fontStyle: "italic" }}>
                Not set
              </span>
            )}
        </Typography>
      </Box>
    );
  }

  /* --------------------------------------------- */
  /* ✅ EDIT MODE                                  */
  /* --------------------------------------------- */
  return (
    <Box sx={{ mb: 1 }}>
      {/* Label */}
      <Typography
        variant="subtitle1"
        sx={{
          color: theme.palette.primary.main,
          fontWeight: 500,
          mb: 0.5,
        }}
      >
        {label}
      </Typography>

      {/* Switch */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 1,
          borderRadius: 1,
          border: "1px solid",
          borderColor: isFocused
            ? theme.palette.primary.main
            : theme.palette.divider,
          backgroundColor: theme.palette.background.paper,
          transition: "border-color 150ms ease-in-out",
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <Switch
          checked={!!value}
          onChange={(e) => onChangeText(e.target.checked)}
          color="primary"
        />
        <Typography variant="body1">
          {value ? onLabel : offLabel}
        </Typography>
      </Box>

      {/* Helper / Error */}
      {(error || helperText) && (
        <Typography
          variant="caption"
          sx={{
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            mt: 0.5,
            ml: 0.25,
            display: "block",
          }}
        >
          {error || helperText}
        </Typography>
      )}
    </Box>
  );
}
