// src/components/SmartInputs/SmartDateAndTimeInputs.jsx
import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { formatAsLocalDate } from 'shears-shared/src/utils/stringHelpers';

/* ------------------------------------------------------------------
   📅 SmartDateInput
------------------------------------------------------------------ */
export function SmartDateInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode,
}) {
  const theme = useTheme();

  // format date for display
const formatDateDisplay = (val) => {
  if (!val) return '';

  // ✅ Handle plain YYYY-MM-DD strings — NO timezone shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-').map(Number);

    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  // ✅ Fallback for full timestamps
  const date = new Date(val);
  return !isNaN(date)
    ? date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : val;
};


  /** READ MODE */
  if (mode === 'read') {
    return (
      <Box sx={{ my: 1 }}>
        <Typography variant="subtitle2" color="text.primary">
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.grey[100],
            borderRadius: 1,
            p: 1,
            mt: 0.5,
            color: theme.palette.text.primary,
          }}
        >
          {value ? (
            formatDateDisplay(value)
          ) : (
            <em style={{ color: theme.palette.text.secondary }}>—</em>
          )}
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
        type="date"
        value={value ? formatAsLocalDate(value) : ''}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder || `Select ${label}`}
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
            py: 0.5,
            fontSize: '0.95rem',
            color: theme.palette.text.primary,
          },
        }}
      />
    </Box>
  );
}

/* ------------------------------------------------------------------
   ⏰ SmartTimeInput
------------------------------------------------------------------ */
export function SmartTimeInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode,
}) {
  const theme = useTheme();

  // format time for display
  const formatTimeDisplay = (val) => {
    if (!val) return '';
    const date = new Date(`1970-01-01T${val}`);
    return !isNaN(date)
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : val;
  };

  /** READ MODE */
  if (mode === 'read') {
    return (
      <Box sx={{ my: 1 }}>
        <Typography variant="subtitle2" color="text.primary">
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.grey[100],
            borderRadius: 1,
            p: 1,
            mt: 0.5,
            color: theme.palette.text.primary,
          }}
        >
          {value ? (
            formatTimeDisplay(value)
          ) : (
            <em style={{ color: theme.palette.text.secondary }}>—</em>
          )}
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
        type="time"
        value={value || ''}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder || `Select ${label}`}
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
            py: 0.5,
            fontSize: '0.95rem',
            color: theme.palette.text.primary,
          },
        }}
      />
    </Box>
  );
}
