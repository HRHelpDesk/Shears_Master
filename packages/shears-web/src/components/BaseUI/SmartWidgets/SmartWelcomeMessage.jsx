// src/components/Dashboard/SmartWelcomeMessage.jsx
import React, { useContext, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../../context/AuthContext';

export default function SmartWelcomeMessage() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const formattedDate = useMemo(() => {
    const today = new Date();

    const dayName   = today.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = today.toLocaleDateString('en-US', { month: 'long' });
    const day       = today.getDate();
    const year      = today.getFullYear();

    const getOrdinal = (n) => {
      if (n > 3 && n < 21) return 'th';
      switch (n % 10) {
        case 1:  return 'st';
        case 2:  return 'nd';
        case 3:  return 'rd';
        default: return 'th';
      }
    };

    return `${dayName} ${monthName} ${day}${getOrdinal(day)}, ${year}`;
  }, []);

  if (!user) return null;

  return (
    <Box sx={{ px: 0.25, pt: 1.5, pb: 1 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: theme.palette.primary.main }}
      >
        Welcome {user.firstName}!
      </Typography>

      <Typography
        variant="body1"
        sx={{ mt: 0.5, opacity: 0.9, color: theme.palette.text.secondary }}
      >
        {formattedDate}
      </Typography>
    </Box>
  );
}