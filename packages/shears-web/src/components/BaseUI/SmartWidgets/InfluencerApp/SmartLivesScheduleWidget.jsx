// src/components/SmartInputs/SmartLivesScheduleWidget.jsx
import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close, EventNote, FiberManualRecord } from '@mui/icons-material';
import { DateTime } from 'luxon';
import { AuthContext } from '../../../../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';

/* ============================================================
   Time + Timezone Formatting (handles both structures)
============================================================ */
function formatTimeWithZone(value) {
  // Handle timeZoneTime structure (calendar records)
  if (value?.start && value?.timezone) {
    try {
      const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [hour, minute] = value.start.split(':').map(Number);

      return DateTime.fromObject(
        { hour, minute },
        { zone: value.timezone }
      )
        .setZone(viewerTZ)
        .toFormat('h:mm a');
    } catch {
      return value.start;
    }
  }

  // Handle startTimeWithZone structure (request records)
  if (value?.time && value?.timezone) {
    try {
      const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [hour, minute] = value.time.split(':').map(Number);

      return DateTime.fromObject(
        { hour, minute },
        { zone: value.timezone }
      )
        .setZone(viewerTZ)
        .toFormat('h:mm a');
    } catch {
      return value.time;
    }
  }

  return '';
}

/* ============================================================
   Duration Formatting & Calculation
============================================================ */
function calculateDuration(timeZoneTime) {
  if (!timeZoneTime?.start || !timeZoneTime?.end) return null;

  try {
    const [startHour, startMin] = timeZoneTime.start.split(':').map(Number);
    const [endHour, endMin] = timeZoneTime.end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;

    if (totalMinutes <= 0) return null;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours: hours || '', minutes: minutes || '' };
  } catch {
    return null;
  }
}

function formatDuration(duration) {
  if (!duration) return '—';
  
  const h = duration.hours
    ? `${duration.hours}h`
    : '';
  const m = duration.minutes
    ? `${duration.minutes}m`
    : '';
  
  const result = [h, m].filter(Boolean).join(' ');
  return result || '—';
}

/* ============================================================
   Date Formatting
============================================================ */
function formatDate(dateString) {
  if (!dateString) return '';
  
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function SmartLivesScheduleWidget({
  targetDate = null, // ISO date string (YYYY-MM-DD), defaults to today
  title = "Today's Scheduled Lives",
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default to today if no targetDate provided
  const dateToShow = useMemo(() => {
    if (targetDate) return targetDate;
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }, [targetDate]);

  // Fetch calendar records
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.subscriberId || !token) return;

      setLoading(true);
      setError(null);

      try {
        const res = await getRecords({
          recordType: 'calendar',
          subscriberId: user.subscriberId,
          token,
          limit: 500,
        });

        setData(res || []);
      } catch (err) {
        console.error('Failed to fetch calendar records:', err);
        setError('Failed to load scheduled lives.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.subscriberId, token]);

  // Filter data for the target date
  const filteredLives = useMemo(() => {
    return data.filter((item) => {
      const itemDate = item.fieldsData?.date || item.date;
      return itemDate === dateToShow;
    }).sort((a, b) => {
      // Sort by start time
      const fd_a = a.fieldsData || a;
      const fd_b = b.fieldsData || b;
      
      const timeA = fd_a.timeZoneTime?.start || fd_a.startTimeWithZone?.time || '';
      const timeB = fd_b.timeZoneTime?.start || fd_b.startTimeWithZone?.time || '';
      
      return timeA.localeCompare(timeB);
    });
  }, [data, dateToShow]);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Get influencer name
  const getInfluencerName = (item) => {
    const fd = item.fieldsData || item;
    return (
      fd.influencerName?.name ||
      fd.influencerName?.raw?.fullName ||
      fd.influencerName?.raw?.firstName + ' ' + fd.influencerName?.raw?.lastName ||
      'Unknown'
    );
  };

  // Get influencer avatar
  const getInfluencerAvatar = (item) => {
    const fd = item.fieldsData || item;
    return fd.influencerName?.raw?.avatar || null;
  };

  // Get products array with names
  const getProducts = (item) => {
    const fd = item.fieldsData || item;
    const products = fd.products || [];
    
    if (products.length === 0) return [];
    
    return products.map(p => 
      p.name || 
      p.productName || 
      p.raw?.productName || 
      'Unnamed Product'
    );
  };

  // Get platforms (handles both field names)
  const getPlatforms = (item) => {
    const fd = item.fieldsData || item;
    const platforms = fd.platforms || fd.socialMediaPlatforms || [];
    return platforms.map(p => p.platform).filter(Boolean);
  };

  // Get time data (handles both structures)
  const getTimeData = (item) => {
    const fd = item.fieldsData || item;
    return fd.timeZoneTime || fd.startTimeWithZone;
  };

  // Get duration (calculate from timeZoneTime or use existing duration)
  const getDuration = (item) => {
    const fd = item.fieldsData || item;
    
    // If duration already exists, use it
    if (fd.duration) return fd.duration;
    
    // Otherwise calculate from timeZoneTime
    if (fd.timeZoneTime) {
      return calculateDuration(fd.timeZoneTime);
    }
    
    return null;
  };

  return (
    <Box sx={{ my: 2 }}>
      {/* Toggle Button */}
      <Button
        variant="outlined"
        size="medium"
        onClick={handleOpenDialog}
        startIcon={loading ? <CircularProgress size={20} /> : <EventNote />}
        disabled={loading}
        sx={{ 
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        {title} ({filteredLives.length})
      </Button>

      {/* Dialog Modal */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        PaperProps={{
            sx: {
                borderRadius: 2,
                maxHeight: '90vh',
                position: 'absolute',
                top: '5%',
            },
            }}
                

      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            pt: 3,
            px: 4,
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title} ({filteredLives.length})
          </Typography>
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        {/* Content */}
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 8,
              }}
            >
              <CircularProgress />
            </Box>
          ) : filteredLives.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 8, fontStyle: 'italic' }}
            >
              No scheduled lives for {formatDate(dateToShow)}
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, px: 2, py: 2 }}>Influencer</TableCell>
                    <TableCell sx={{ fontWeight: 700, px: 2, py: 2 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, px: 2, py: 2 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, px: 2, py: 2 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700, px: 2, py: 2 }}>Platforms</TableCell>
                    <TableCell sx={{ fontWeight: 700, px: 2, py: 2 }}>Flash Sale Products</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredLives.map((item, index) => {
                    const influencerName = getInfluencerName(item);
                    const avatar = getInfluencerAvatar(item);
                    const initials = influencerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    const fd = item.fieldsData || item;
                    const platforms = getPlatforms(item);
                    const products = getProducts(item);
                    const timeData = getTimeData(item);
                    const duration = getDuration(item);

                    return (
                      <TableRow key={item._id || index} hover>
                        {/* Influencer with Avatar */}
                        <TableCell sx={{ px: 2, py: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={avatar}
                              alt={influencerName}
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: avatar ? 'transparent' : theme.palette.primary.main,
                              }}
                            >
                              {!avatar && initials}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {influencerName}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Date */}
                        <TableCell sx={{ px: 2, py: 2.5 }}>
                          <Typography variant="body2">
                            {formatDate(fd.date)}
                          </Typography>
                        </TableCell>

                        {/* Time */}
                        <TableCell sx={{ px: 2, py: 2.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatTimeWithZone(timeData)}
                          </Typography>
                        </TableCell>

                        {/* Duration */}
                        <TableCell sx={{ px: 2, py: 2.5 }}>
                          <Typography variant="body2">
                            {formatDuration(duration)}
                          </Typography>
                        </TableCell>

                        {/* Platforms */}
                        <TableCell sx={{ px: 2, py: 2.5 }}>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {platforms.length > 0 ? (
                              platforms.map((platform, idx) => (
                                <Chip
                                  key={idx}
                                  label={platform}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    fontSize: '0.75rem',
                                  }}
                                />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* Products - Full List */}
                        <TableCell sx={{ px: 2, py: 2.5, minWidth: 300 }}>
                          {products.length > 0 ? (
                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                              {products.map((productName, idx) => (
                                <Box
                                  component="li"
                                  key={idx}
                                  sx={{
                                    mb: idx < products.length - 1 ? 1 : 0,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {productName}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}