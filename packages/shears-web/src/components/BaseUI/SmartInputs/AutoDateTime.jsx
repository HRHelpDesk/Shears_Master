// src/components/SmartInputs/AutoDateTime.jsx
import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date)) return value;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month   = date.toLocaleDateString('en-US', { month: 'long' });
  const day     = date.getDate();
  const year    = date.getFullYear();

  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  let hours  = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${dayName}, ${month} ${day}${suffix} ${year} ${hours}:${mins} ${ampm}`;
}

export default function AutoDateTime({
  label,
  value,
  onChangeText,
  mode = 'edit',
}) {
  const theme = useTheme();
  const nowRef = useRef(new Date().toISOString());
  const hasStamped = useRef(false);

  useEffect(() => {
    if (!hasStamped.current && (mode === 'edit' || mode === 'add') && !value) {
      hasStamped.current = true;
      onChangeText?.(nowRef.current);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayValue = formatDateTime(value || nowRef.current);

  /* READ MODE */
  if (mode === 'read') {
    return (
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }}>
          {displayValue ?? (
            <span style={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}>Not set</span>
          )}
        </Typography>
      </Box>
    );
  }

  /* EDIT / ADD MODE */
  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box
        sx={{
          borderRadius: 1,
          border: '1px solid',
          borderColor: theme.palette.divider,
          backgroundColor: theme.palette.action.disabledBackground,
          px: '13px',
          py: '13px',
          opacity: 0.75,
        }}
      >
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          {displayValue}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{ color: theme.palette.text.secondary, mt: 0.5, ml: 0.25, display: 'block', fontStyle: 'italic' }}
      >
        Auto-filled — cannot be edited
      </Typography>
    </Box>
  );
}