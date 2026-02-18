// src/components/SmartInputs/SmartLivesScheduleWidget.jsx
import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Switch,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ExpandMore, ExpandLess, EventNote } from '@mui/icons-material';
import { DateTime } from 'luxon';
import { AuthContext } from '../../../../context/AuthContext';
import { getRecords, updateRecord } from 'shears-shared/src/Services/Authentication';
import { useRefreshVersion } from '../../../../context/RefreshContext';

/* ============================================================
   Time + Timezone Formatting
============================================================ */
function formatTimeWithZone(value) {
  if (value?.start && value?.timezone) {
    try {
      const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [hour, minute] = value.start.split(':').map(Number);
      return DateTime.fromObject({ hour, minute }, { zone: value.timezone })
        .setZone(viewerTZ).toFormat('h:mm a');
    } catch { return value.start; }
  }
  if (value?.time && value?.timezone) {
    try {
      const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [hour, minute] = value.time.split(':').map(Number);
      return DateTime.fromObject({ hour, minute }, { zone: value.timezone })
        .setZone(viewerTZ).toFormat('h:mm a');
    } catch { return value.time; }
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
    const [endHour, endMin]     = timeZoneTime.end.split(':').map(Number);
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (totalMinutes <= 0) return null;
    return { hours: Math.floor(totalMinutes / 60) || '', minutes: totalMinutes % 60 || '' };
  } catch { return null; }
}

function formatDuration(duration) {
  if (!duration) return '—';
  const h = duration.hours   ? `${duration.hours}h`   : '';
  const m = duration.minutes ? `${duration.minutes}m` : '';
  return [h, m].filter(Boolean).join(' ') || '—';
}

/* ============================================================
   Date Formatting
============================================================ */
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function SmartLivesScheduleWidget({
  targetDate = null,
  title = "Today's Scheduled Lives",
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  const refreshVersion = useRefreshVersion('dashboard-data');

  const [expanded, setExpanded]       = useState(true);
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [updatingIds, setUpdatingIds] = useState(new Set());

  const dateToShow = useMemo(() => {
    if (targetDate) return targetDate;
    return DateTime.now().setZone(Intl.DateTimeFormat().resolvedOptions().timeZone).toISODate();
  }, [targetDate]);

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
  }, [user?.subscriberId, token, refreshVersion]);

  const filteredLives = useMemo(() => {
    return data
      .filter((item) => (item.fieldsData?.date || item.date) === dateToShow)
      .sort((a, b) => {
        const fd_a = a.fieldsData || a;
        const fd_b = b.fieldsData || b;
        const timeA = fd_a.timeZoneTime?.start || fd_a.startTimeWithZone?.time || '';
        const timeB = fd_b.timeZoneTime?.start || fd_b.startTimeWithZone?.time || '';
        return timeA.localeCompare(timeB);
      });
  }, [data, dateToShow]);

  /* ----------------------------------------------------------
     Flash Sales Toggle
  ---------------------------------------------------------- */
  const handleFlashSalesToggle = useCallback(async (item) => {
    const itemId   = item._id;
    const newValue = !(item.fieldsData?.flashSales || false);

    setUpdatingIds((prev) => new Set(prev).add(itemId));
    try {
      await updateRecord(itemId, { ...item.fieldsData, flashSales: newValue }, token);
      setData((prev) =>
        prev.map((d) =>
          d._id === itemId
            ? { ...d, fieldsData: { ...d.fieldsData, flashSales: newValue } }
            : d
        )
      );
    } catch (err) {
      console.error('Failed to update flashSales:', err);
      setError('Failed to update flash sales status.');
    } finally {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(itemId); return n; });
    }
  }, [token]);

  /* ----------------------------------------------------------
     Field Accessors
  ---------------------------------------------------------- */
  const getInfluencerName = (item) => {
    const fd = item.fieldsData || item;
    return fd.influencerName?.name || fd.influencerName?.raw?.fullName ||
      fd.influencerName?.raw?.firstName + ' ' + fd.influencerName?.raw?.lastName || 'Unknown';
  };
  const getInfluencerAvatar = (item) => (item.fieldsData || item).influencerName?.raw?.avatar || null;
  const getProducts = (item) => {
    const products = (item.fieldsData || item).products || [];
    return products.map((p) => p.name || p.productName || p.raw?.productName || 'Unnamed Product');
  };
  const getPlatforms = (item) => {
    const fd = item.fieldsData || item;
    return (fd.platforms || fd.socialMediaPlatforms || []).map((p) => p.platform).filter(Boolean);
  };
  const getTimeData = (item) => {
    const fd = item.fieldsData || item;
    return fd.timeZoneTime || fd.startTimeWithZone;
  };
  const getDuration = (item) => {
    const fd = item.fieldsData || item;
    if (fd.duration) return fd.duration;
    if (fd.timeZoneTime) return calculateDuration(fd.timeZoneTime);
    return null;
  };

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */
  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {/* ── Accordion Header ── */}
      <Box
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          cursor: 'pointer',
          borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: theme.palette.action.hover },
        }}
      >
        {/* Left side: icon + title + count badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EventNote sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {loading ? (
            <CircularProgress size={14} />
          ) : (
            <Chip
              label={filteredLives.length}
              size="small"
              color={filteredLives.length > 0 ? 'primary' : 'default'}
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
            />
          )}
        </Box>

        {/* Right side: date label + chevron */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {formatDate(dateToShow)}
          </Typography>
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.secondary }}
            onClick={(e) => { e.stopPropagation(); setExpanded((prev) => !prev); }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* ── Accordion Body ── */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredLives.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ py: 6, fontStyle: 'italic' }}
          >
            No scheduled lives for {formatDate(dateToShow)}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, px: 3 }}>Influencer</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, px: 2 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, px: 2 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, px: 2 }}>Flash Sales</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, px: 2 }}>Platforms</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, px: 2 }}>Flash Sale Products</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLives.map((item, index) => {
                  const influencerName = getInfluencerName(item);
                  const avatar         = getInfluencerAvatar(item);
                  const initials       = influencerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  const fd             = item.fieldsData || item;
                  const platforms      = getPlatforms(item);
                  const products       = getProducts(item);
                  const timeData       = getTimeData(item);
                  const duration       = getDuration(item);
                  const isUpdating     = updatingIds.has(item._id);
                  const flashSales     = fd.flashSales || false;

                  return (
                    <TableRow
                      key={item._id || index}
                      hover
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      {/* Influencer */}
                      <TableCell sx={{ px: 3, py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={avatar}
                            alt={influencerName}
                            sx={{
                              width: 34, height: 34, fontSize: '0.8rem',
                              bgcolor: avatar ? 'transparent' : theme.palette.primary.main,
                            }}
                          >
                            {!avatar && initials}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {influencerName}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Time */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatTimeWithZone(timeData) || '—'}
                        </Typography>
                      </TableCell>

                      {/* Duration */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <Typography variant="body2">{formatDuration(duration)}</Typography>
                      </TableCell>

                      {/* Flash Sales */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        {isUpdating ? (
                          <CircularProgress size={18} />
                        ) : (
                          <Switch
                            checked={flashSales}
                            onChange={() => handleFlashSalesToggle(item)}
                            color="primary"
                            size="small"
                          />
                        )}
                      </TableCell>

                      {/* Platforms */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {platforms.length > 0 ? (
                            platforms.map((platform, idx) => (
                              <Chip key={idx} label={platform} size="small"
                                sx={{ height: 22, fontSize: '0.7rem' }} />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Products */}
                      <TableCell sx={{ px: 2, py: 2, minWidth: 260 }}>
                        {products.length > 0 ? (
                          <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {products.map((name, idx) => (
                              <Box component="li" key={idx}
                                sx={{ mb: idx < products.length - 1 ? 0.5 : 0 }}>
                                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                                  {name}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Collapse>
    </Paper>
  );
}