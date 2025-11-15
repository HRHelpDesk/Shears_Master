import React, { useState } from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { formatCurrency, cleanCurrencyString } from 'shears-shared/src/utils/stringHelpers';

export default function SmartCurrencyInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode = 'edit',
  error,
  helperText
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    const formatted = formatCurrency(e.target.value);
    onChangeText(formatted);     // store formatted string
  };

  /** READ MODE */
  if (mode === 'read') {
    return (
      <Box sx={{ mb: 0.5 }}>
      <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>    
          {label}
        </Typography>

        <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
          {value ? value : <span style={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}>Not set</span>}
        </Typography>
      </Box>
    );
  }

  const borderColor = error
    ? theme.palette.error.main
    : isFocused
    ? theme.palette.primary.main
    : theme.palette.divider;

  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>    
        {label}
      </Typography>

      <TextField
        fullWidth
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder || '$0.00'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        error={!!error}
        variant="outlined"
        inputProps={{
          inputMode: 'decimal'
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            backgroundColor: theme.palette.background.paper,
            minHeight: '48px',
            '& fieldset': {
              borderColor,
              borderWidth: isFocused ? 2 : 1,
              transition: 'border 150ms ease-in-out'
            },
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main
            }
          },
          '& .MuiOutlinedInput-input': {
            padding: '13px',
            fontSize: '16px'
          }
        }}
      />

      {(helperText || error) && (
        <Typography variant="caption" sx={{ color: error ? theme.palette.error.main : theme.palette.text.secondary }}>
          {error || helperText}
        </Typography>
      )}
    </Box>
  );
}
