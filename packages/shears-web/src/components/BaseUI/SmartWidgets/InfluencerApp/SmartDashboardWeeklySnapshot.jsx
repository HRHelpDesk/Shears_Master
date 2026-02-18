// src/components/Dashboard/SmartDashboardWeeklySnapshot.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../../../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';
import { DateTime } from 'luxon';
import { useRefreshVersion } from '../../../../context/RefreshContext';

export default function SmartDashboardWeeklySnapshot() {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);
  const refreshVersion = useRefreshVersion('dashboard-data');

  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [weekLabel, setWeekLabel]           = useState('');
  const [totalScheduled, setTotalScheduled] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [outstandingCount, setOutstandingCount] = useState(0);

  useEffect(() => {
    if (!user || !token) return;
    fetchWeeklyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.subscriberId, token, refreshVersion]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const raw = await getRecords({
        recordType: 'calendar',
        subscriberId: user.subscriberId,
        page: 1,
        limit: 300,
        token,
      });

      const records = Array.isArray(raw)
        ? raw
        : raw?.records || raw?.items || raw?.data || [];

      const results = computeWeeklyStats(records);

      setWeekLabel(results.weekLabel);
      setTotalScheduled(results.totalScheduled);
      setCompletedCount(results.completedCount);
      setOutstandingCount(results.outstandingCount);
    } catch (err) {
      console.error('Weekly snapshot error:', err);
      setError('Unable to load weekly data');
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------
     HELPERS (unchanged logic)
  -------------------------------------------------------- */
  const getStartAndEndOfWeek = () => {
    const today = new Date();

    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const getRecordDate = (rec) => {
    const rawDate = rec?.fieldsData?.date;
    if (!rawDate) return null;

    const dateStr = Array.isArray(rawDate) ? rawDate[0] : rawDate;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const isCompleted = (rec) => {
    const fd = rec?.fieldsData;
    if (!fd) return false;

    // If explicitly marked completed, respect that
    const status = fd.status || fd.appointmentStatus || rec?.status;
    if (status && String(status).toLowerCase() === 'completed') return true;

    // Otherwise check if the scheduled end time has passed
    const date = fd.date;
    const timeZoneTime = fd.timeZoneTime;

    if (!date || !timeZoneTime?.end || !timeZoneTime?.timezone) return false;

    try {
      const dateStr = Array.isArray(date) ? date[0] : date;
      const [endHour, endMin] = timeZoneTime.end.split(':').map(Number);

      // Build the end datetime in the record's timezone
      const endDateTime = DateTime.fromObject(
        { year: parseInt(dateStr.slice(0, 4)), month: parseInt(dateStr.slice(5, 7)), day: parseInt(dateStr.slice(8, 10)), hour: endHour, minute: endMin },
        { zone: timeZoneTime.timezone }
      );

      return endDateTime.isValid && endDateTime < DateTime.now();
    } catch {
      return false;
    }
  };

  const computeWeeklyStats = (records) => {
    const { start, end } = getStartAndEndOfWeek();
    const format = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    let totalScheduled = 0;
    let completedCount = 0;

    for (const rec of records) {
      const date = getRecordDate(rec);
      if (!date) continue;

      if (date >= start && date <= end) {
        totalScheduled++;
        if (isCompleted(rec)) completedCount++;
      }
    }

    return {
      weekLabel: `${format(start)} - ${format(end)}`,
      totalScheduled,
      completedCount,
      outstandingCount: totalScheduled - completedCount,
    };
  };

  /* --------------------------------------------------------
     RENDER
  -------------------------------------------------------- */
  if (!user || !token) {
    return (
      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'center' }}>
        <Typography color="text.secondary">Sign in to view weekly analytics.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={32} />
        <Typography color="text.secondary">Loading weekly snapshot…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ px: 2, py: 1 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const STATS = [
    { count: totalScheduled,   label: 'Scheduled' },
    { count: completedCount,   label: 'Completed' },
    { count: outstandingCount, label: 'Upcoming'  },
  ];

  return (
    <Box sx={{ px: 2, py: 2 }}>
      {/* Week Range Label */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'text.secondary',
          mb: 2,
        }}
      >
        Week of {weekLabel}
      </Typography>

      {/* Stat Cards Row */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {STATS.map(({ count, label }) => (
          <Card
            key={label}
            elevation={1}
            sx={{
              flex: 1,
              borderRadius: 3,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
                p: '16px !important',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  lineHeight: 1,
                  mb: 1,
                }}
              >
                {count}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                {label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}