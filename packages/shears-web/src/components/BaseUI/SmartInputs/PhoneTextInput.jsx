// src/components/SmartInputs/PhoneTextInput.jsx
import React, { useState } from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { formatPhoneNumber } from 'shears-shared/src/utils/stringHelpers';

const INPUT_PADDING = '13px';

/**
 * PhoneTextInput – formats input as (XXX) XXX-XXXX while typing.
 */
export default function PhoneTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode = 'edit',
  error,
  helperText,
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  /** Handle changes with formatted value */
  const handleTextChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChangeText(formatted);
  };

  /** 🧾 READ MODE */
  if (mode === 'read') {
    return (
      <Box sx={{ mb: 0.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: theme.palette.primary.main,
            mb: 0.5,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.primary,
            lineHeight: 1.6,
          }}
        >
          {value && value.toString().trim() !== '' ? (
            value
          ) : (
            <span style={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}>
              Not set
            </span>
          )}
        </Typography>
      </Box>
    );
  }

  /** ✏️ EDIT MODE */
  const borderColor = error
    ? theme.palette.error.main
    : isFocused
    ? theme.palette.primary.main
    : theme.palette.divider;

  return (
    <Box sx={{ mb: 0.5 }}>
      {/* Label */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          color: error ? theme.palette.error.main : theme.palette.text.primary,
          mb: 0.75,
        }}
      >
        {label}
      </Typography>

      {/* Input Field */}
      <TextField
        fullWidth
        variant="outlined"
        type="tel"
        value={value || ''}
        onChange={handleTextChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || '(555) 555-5555'}
        error={!!error}
        inputProps={{
          maxLength: 14, // matches (XXX) XXX-XXXX
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            backgroundColor: theme.palette.background.paper,
            minHeight: '48px',
            transition: 'border-color 150ms ease-in-out, border-width 150ms ease-in-out',
            '& fieldset': {
              borderColor: borderColor,
              borderWidth: isFocused ? '2px' : '1px',
              transition: 'border-color 150ms ease-in-out, border-width 150ms ease-in-out',
            },
            '&:hover fieldset': {
              borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
              borderWidth: '2px',
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: INPUT_PADDING,
            fontSize: '16px',
            color: theme.palette.text.primary,
          },
          '& .MuiOutlinedInput-input::placeholder': {
            color: theme.palette.text.disabled,
            opacity: 1,
          },
        }}
      />

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <Typography
          variant="caption"
          sx={{
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            mt: 0.5,
            ml: 0.25,
            display: 'block',
          }}
        >
          {error || helperText}
        </Typography>
      )}
    </Box>
  );
}