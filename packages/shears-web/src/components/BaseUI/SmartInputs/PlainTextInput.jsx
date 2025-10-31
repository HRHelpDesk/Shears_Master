import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

export default function PlainTextInput({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  placeholder,
  mode,
}) {
  const theme = useTheme();

  const getInputType = () => {
    switch (keyboardType) {
      case 'email-address':
        return 'email';
      case 'numeric':
      case 'number-pad':
      case 'decimal-pad':
        return 'number';
      case 'phone-pad':
        return 'tel';
      default:
        return 'text';
    }
  };

  /** READ MODE */
  if (mode === 'read') {
    return (
      <Box sx={{ my: 1 }}>
        <Typography variant="subtitle2" color="text.primary">
          {label}
        </Typography>
        <Typography
          variant={multiline ? 'body2' : 'body1'}
          sx={{
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.grey[100],
            borderRadius: 1,
            p: 1,
            mt: 0.5,
            color: theme.palette.text.primary,
            whiteSpace: multiline ? 'pre-wrap' : 'normal',
          }}
        >
          {value || <em style={{ color: theme.palette.text.secondary }}>—</em>}
        </Typography>
      </Box>
    );
  }

  /** EDIT MODE */
  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="subtitle2" color="text.primary">
        {label}
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        type={getInputType()}
        value={value?.toString() || ''}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder || `Enter ${label}`}
        multiline={multiline}
        sx={{
          mt: 0.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : theme.palette.background.paper,
            '& fieldset': {
              borderColor: theme.palette.divider,
            },
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: 1,
            },
          },
        }}
        InputProps={{
          sx: {
            py: multiline ? 1 : 0.5,
            fontSize: '0.95rem',
            color: theme.palette.text.primary,
          },
        }}
      />
    </Box>
  );
}
