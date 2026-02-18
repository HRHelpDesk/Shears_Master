// src/components/SmartInputs/SmartPendingRequestsWidget.jsx
import React, { useState, useMemo, useEffect, useCallback, useContext } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Paper,
  Collapse,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close, Assignment, ExpandMore, ExpandLess } from '@mui/icons-material';
import { DateTime } from 'luxon';
import { AuthContext } from '../../../../context/AuthContext';
import {
  getRecords,
  updateRecord,
  saveCalendarAndNotification,
  sendRejectionNotification,
} from 'shears-shared/src/Services/Authentication';
import { formatDateValue } from 'shears-shared/src/utils/stringHelpers';
import { useRefreshVersion } from '../../../../context/RefreshContext';

/* ============================================================
   Time + Timezone Formatting
============================================================ */
function formatTimeWithZone(value) {
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
   Duration Formatting
============================================================ */
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
   Status Helpers
============================================================ */
const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'Completed'];

const STATUS_COLORS = {
  Approved:  { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  Rejected:  { bg: '#FFEBEE', border: '#F44336', text: '#C62828' },
  Completed: { bg: '#F3E5F5', border: '#9C27B0', text: '#6A1B9A' },
  Pending:   { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' },
};

function getStatusColors(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.Pending;
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function SmartPendingRequestsWidget({ title = 'Pending Requests' }) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  const refreshVersion = useRefreshVersion('dashboard-data');

  const [expanded, setExpanded]                   = useState(true);
  const [data, setData]                           = useState([]);
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState(null);

  // Status update dialog
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [selectedItem, setSelectedItem]           = useState(null);
  const [selectedStatus, setSelectedStatus]       = useState('Pending');
  const [notify, setNotify]                       = useState(true);
  const [rejectionMessage, setRejectionMessage]   = useState('');
  const [updating, setUpdating]                   = useState(false);

  /* ----------------------------------------------------------
     Data Fetching
  ---------------------------------------------------------- */
  const fetchData = useCallback(async () => {
    if (!user?.subscriberId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getRecords({
        recordType: 'requests',
        subscriberId: user.subscriberId,
        token,
        limit: 500,
      });
      setData(res || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  }, [user?.subscriberId, token]);

  useEffect(() => { fetchData(); }, [fetchData, refreshVersion]);

  /* ----------------------------------------------------------
     Derived Data
  ---------------------------------------------------------- */
  const pendingRequests = useMemo(() => {
    return data
      .filter((item) => {
        const fd = item.fieldsData || item;
        const innerFd = fd.fieldsData || fd;
        return (innerFd.status || fd.status || 'Pending') === 'Pending';
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [data]);

  /* ----------------------------------------------------------
     Field Accessors
  ---------------------------------------------------------- */
  const getInfluencerName = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return (
      innerFd.influencerName?.name ||
      innerFd.influencerName?.raw?.fullName ||
      (innerFd.influencerName?.raw?.firstName && innerFd.influencerName?.raw?.lastName
        ? `${innerFd.influencerName.raw.firstName} ${innerFd.influencerName.raw.lastName}`
        : null) ||
      fd.influencerName?.name ||
      fd.influencerName?.raw?.fullName ||
      'Unknown'
    );
  };
  const getInfluencerAvatar = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return innerFd.influencerName?.raw?.avatar || fd.influencerName?.raw?.avatar || null;
  };
  const getProducts = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return (innerFd.products || fd.products || [])
      .map((p) => p.name || p.productName || p.raw?.productName || 'Unnamed Product');
  };
  const getPlatforms = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return (innerFd.socialMediaPlatforms || fd.socialMediaPlatforms || [])
      .map((p) => p.platform).filter(Boolean);
  };
  const getTimeData = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return innerFd.startTimeWithZone || fd.startTimeWithZone;
  };
  const getDuration = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return innerFd.duration || fd.duration || null;
  };
  const getRequestDates = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return innerFd.date || fd.date || [];
  };
  const getStatus = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return innerFd.status || fd.status || 'Pending';
  };
  const getNotes = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    return innerFd.notes || fd.notes || '';
  };
  const getFieldsData = (item) => {
    const fd = item.fieldsData || item;
    return fd.fieldsData || fd;
  };

  /* ----------------------------------------------------------
     Status Dialog Handlers
  ---------------------------------------------------------- */
  const handleOpenStatusDialog = (item) => {
    setSelectedItem(item);
    setSelectedStatus(getStatus(item));
    setNotify(true);
    setRejectionMessage('');
    setStatusDialogVisible(true);
  };
  const handleCloseStatusDialog = () => {
    setStatusDialogVisible(false);
    setSelectedItem(null);
    setRejectionMessage('');
  };
  const handleConfirmStatus = async () => {
    if (!selectedItem || updating) return;
    try {
      setUpdating(true);
      const currentFieldsData = getFieldsData(selectedItem);
      const dates = getRequestDates(selectedItem);
      const updatedFieldsData = { ...currentFieldsData, status: selectedStatus };

      if (selectedStatus === 'Rejected' && rejectionMessage.trim()) {
        updatedFieldsData.rejectionMessage = rejectionMessage.trim();
        await sendRejectionNotification(
          { ...selectedItem, fieldsData: updatedFieldsData },
          user, token, rejectionMessage.trim()
        );
      }

      await updateRecord(selectedItem._id, updatedFieldsData, token);

      if (selectedStatus === 'Approved' && dates.length > 0) {
        const message = `Your request for ${dates.map((d) => formatDateValue(d)).join(', ')} has been approved. Please check your calendar for the details.`;
        await saveCalendarAndNotification(updatedFieldsData, user, token, notify, message);
      }

      handleCloseStatusDialog();
      fetchData();
    } catch (err) {
      console.error('Status update failed:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  /* ----------------------------------------------------------
     Section label helper (shared style)
  ---------------------------------------------------------- */
  const SectionLabel = ({ children }) => (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: 'text.secondary',
        display: 'block',
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */
  return (
    <>
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
          {/* Left: icon + title + count badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Assignment sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={14} />
            ) : (
              <Chip
                label={pendingRequests.length}
                size="small"
                color={pendingRequests.length > 0 ? 'warning' : 'default'}
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
              />
            )}
          </Box>

          {/* Right: chevron */}
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.secondary }}
            onClick={(e) => { e.stopPropagation(); setExpanded((prev) => !prev); }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* ── Accordion Body ── */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : pendingRequests.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 6, fontStyle: 'italic' }}
            >
              No pending requests
            </Typography>
          ) : (
            <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {pendingRequests.map((item, index) => {
                const influencerName = getInfluencerName(item);
                const avatar         = getInfluencerAvatar(item);
                const initials       = influencerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                const platforms      = getPlatforms(item);
                const products       = getProducts(item);
                const timeData       = getTimeData(item);
                const duration       = getDuration(item);
                const dates          = getRequestDates(item);
                const status         = getStatus(item);
                const notes          = getNotes(item);
                const statusColors   = getStatusColors(status);

                return (
                  <React.Fragment key={item._id || index}>
                    <Box sx={{ py: 2.5 }}>
                      {/* Card Header — Avatar + Name + Dates */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={avatar}
                            alt={influencerName}
                            sx={{
                              width: 42, height: 42,
                              bgcolor: avatar ? 'transparent' : theme.palette.primary.main,
                            }}
                          >
                            {!avatar && initials}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                              {influencerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dates.map((d) => formatDate(d)).join(', ')}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Status badge — right-aligned in the header */}
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenStatusDialog(item)}
                          endIcon={<span style={{ fontSize: 11, lineHeight: 1 }}>▾</span>}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            borderColor: statusColors.border,
                            color: statusColors.text,
                            backgroundColor: statusColors.bg,
                            '&:hover': { borderColor: statusColors.border, backgroundColor: statusColors.bg, opacity: 0.85 },
                          }}
                        >
                          {status}
                        </Button>
                      </Box>

                      {/* Time + Duration */}
                      <Box sx={{ display: 'flex', gap: 4, mb: 1.5 }}>
                        <Box>
                          <SectionLabel>Time</SectionLabel>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatTimeWithZone(timeData) || '—'}
                          </Typography>
                        </Box>
                        <Box>
                          <SectionLabel>Duration</SectionLabel>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatDuration(duration)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Platforms */}
                      {platforms.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <SectionLabel>Platforms</SectionLabel>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {platforms.map((platform, idx) => (
                              <Chip key={idx} label={platform} size="small"
                                sx={{ height: 22, fontSize: '0.7rem' }} />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Products */}
                      {products.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <SectionLabel>Requested Products ({products.length})</SectionLabel>
                          <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {products.map((name, idx) => (
                              <Box component="li" key={idx}
                                sx={{ mb: idx < products.length - 1 ? 0.25 : 0 }}>
                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{name}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Notes */}
                      {notes && (
                        <Box>
                          <SectionLabel>Notes</SectionLabel>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                            {notes}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {index < pendingRequests.length - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                );
              })}
            </Box>
          )}
        </Collapse>
      </Paper>

      {/* ── Status Update Dialog (kept as dialog — focused task) ── */}
      <Dialog
        open={statusDialogVisible}
        onClose={handleCloseStatusDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3, px: 3, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Update Status</Typography>
          <IconButton onClick={handleCloseStatusDialog} size="small" sx={{ color: theme.palette.text.secondary }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {STATUS_OPTIONS.map((statusOption) => {
              const colors     = getStatusColors(statusOption);
              const isSelected = statusOption === selectedStatus;
              return (
                <Button
                  key={statusOption}
                  variant="outlined"
                  fullWidth
                  onClick={() => setSelectedStatus(statusOption)}
                  sx={{
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    fontWeight: isSelected ? 700 : 400,
                    fontSize: '0.95rem',
                    py: 1.25,
                    borderColor: isSelected ? colors.border : theme.palette.divider,
                    color: isSelected ? colors.text : theme.palette.text.primary,
                    backgroundColor: isSelected ? colors.bg : 'transparent',
                    '&:hover': { borderColor: colors.border, backgroundColor: colors.bg },
                  }}
                >
                  {statusOption}
                </Button>
              );
            })}
          </Box>

          {selectedStatus === 'Rejected' && (
            <TextField
              label="Rejection Message"
              placeholder="Enter message..."
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              disabled={updating}
              sx={{ mb: 2 }}
            />
          )}

          <FormControlLabel
            control={
              <Switch
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                disabled={updating}
                color="primary"
              />
            }
            label="Send notification?"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={handleCloseStatusDialog} disabled={updating} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmStatus}
            disabled={updating}
            startIcon={updating ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}