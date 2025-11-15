import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

export default function SmartTextAreaInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode,
  minRows = 3,
  maxRows = 6,
}) {
  const theme = useTheme();

  /** READ MODE */
  if (mode === 'read') {
    return (
      <Box sx={{ my: 1 }}>
        <Typography variant="subtitle2" color="text.primary">
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.grey[100],
            borderRadius: 1,
            p: 1,
            mt: 0.5,
            color: theme.palette.text.primary,
            whiteSpace: 'pre-wrap',
            minHeight: `${minRows * 1.5}em`,
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
<Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>    
      
        {label}
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        multiline
        minRows={minRows}
        maxRows={maxRows}
        value={value?.toString() || ''}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder || `Enter ${label}`}
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
            fontSize: '0.95rem',
            lineHeight: 1.5,
            py: 1,
            color: theme.palette.text.primary,
          },
        }}
      />
    </Box>
  );
}
