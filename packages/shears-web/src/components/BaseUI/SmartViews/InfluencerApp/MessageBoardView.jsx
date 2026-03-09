// src/components/Views/MessageBoardView.jsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Fab,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { DateTime } from 'luxon';
import { AuthContext } from '../../../../context/AuthContext';
import { getRecords, deleteRecord } from 'shears-shared/src/Services/Authentication';
import ListItemDetail from '../../ListItemDetail';

/* -------------------------------------------------------------------------- */
/* ⏱ Relative time helper                                                     */
/* -------------------------------------------------------------------------- */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const dt = DateTime.fromISO(dateStr).isValid
    ? DateTime.fromISO(dateStr)
    : DateTime.fromFormat(dateStr, 'yyyy-MM-dd');
  if (!dt.isValid) return '';

  const diff = DateTime.now().diff(dt, ['hours', 'minutes']);
  const totalHours = diff.hours + diff.minutes / 60;

  if (totalHours >= 12) return dt.toFormat('MMM d, h:mm a');
  if (totalHours >= 1)  return `${Math.floor(totalHours)}h ago`;
  if (diff.minutes >= 1) return `${Math.floor(diff.minutes)}m ago`;
  return 'Just now';
}

/* -------------------------------------------------------------------------- */
/* 🏷 Category pill colors                                                    */
/* -------------------------------------------------------------------------- */
const CATEGORY_COLORS = {
  General:          { bg: '#E8F4FD', text: '#1A7DC4' },
  Announcements:    { bg: '#FFF3E0', text: '#E65100' },
  'Tips & Tricks':  { bg: '#E8F5E9', text: '#2E7D32' },
  'Product Updates':{ bg: '#F3E5F5', text: '#6A1B9A' },
  'Q&A':            { bg: '#FCE4EC', text: '#B71C1C' },
};

function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] || { bg: '#F0F0F0', text: '#555' };
}

/* -------------------------------------------------------------------------- */
/* 🗂 Normalise                                                               */
/* -------------------------------------------------------------------------- */
function normalise(record) {
  return record.fieldsData
    ? { ...record.fieldsData, _id: record._id, recordType: record.recordType, createdById: record.createdById }
    : record;
}

/* -------------------------------------------------------------------------- */
/* 📰 Single Post Card                                                         */
/* -------------------------------------------------------------------------- */
function PostCard({ item, theme, fields, appConfig, name, modes, user, token, onRecordDeleted, onCardClick }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const body         = item.messageBody  || item.description || '';
  const category     = item.category     || null;
  const imageArr     = item.messageImage || item.image || null;
  const imageUrl     = Array.isArray(imageArr) ? imageArr[0]?.url : imageArr;
  const dateStr      = item.date         || item.createdAt || '';
  const author       = item.postedBy?.raw?.fullName || item.postedBy?.name || 'Admin';
  const avatarUrl    = item.postedBy?.raw?.avatar || null;
  const catStyle     = category ? getCategoryStyle(category) : null;
  const commentCount = Array.isArray(item?.comments) ? item.comments.length : 0;
  const canDelete    = user?.role === 'admin' || user?.userId === item.createdById;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    try {
      setDeleting(true);
      await deleteRecord(item._id, token);
      onRecordDeleted?.();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Box
      onClick={() => onCardClick(item)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        px: 2,
        pt: 1.75,
        pb: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        backgroundColor: 'background.paper',
        '&:hover': { backgroundColor: 'action.hover' },
        transition: 'background-color 150ms ease',
      }}
    >
      {/* ── Header row ── */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {/* Avatar + thread line */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44, flexShrink: 0 }}>
          <Avatar
            src={avatarUrl || undefined}
            sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontSize: 16, fontWeight: 700 }}
          >
            {!avatarUrl && author.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, width: 2, mt: 0.75, borderRadius: 1, minHeight: 24, bgcolor: 'divider' }} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, pb: 1.75 }}>
          {/* Author + timestamp */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.1 }}>
              {author}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {timeAgo(dateStr)}
            </Typography>
          </Box>

          {/* Category pill */}
          {catStyle && category && (
            <Chip
              label={category}
              size="small"
              sx={{
                mb: 0.75,
                height: 20,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                backgroundColor: catStyle.bg,
                color: catStyle.text,
                borderRadius: '10px',
              }}
            />
          )}

          {/* Body */}
          {!!body && (
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 1 }}>
              {body.length > 200 ? (
                <>
                  {body.slice(0, 200)}
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {' ... Read more'}
                  </Box>
                </>
              ) : (
                body
              )}
            </Typography>
          )}

          {/* Image */}
          {!!imageUrl && (
            <Box
              component="img"
              src={imageUrl}
              sx={{ width: '100%', height: 200, borderRadius: 2, objectFit: 'cover', mt: 0.5, mb: 1 }}
            />
          )}
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, pb: 1 }}>
        {/* Delete */}
        {canDelete && (
          <Box onClick={(e) => { e.stopPropagation(); handleDelete(); }} sx={{ display: 'flex', alignItems: 'center' }}>
            {deleting ? (
              <CircularProgress size={16} color="error" />
            ) : (
              <IconButton size="small"  color={confirmDelete ? 'error' : 'default'}>
                <DeleteOutlineIcon color='error' fontSize="small" />
              </IconButton>
            )}
            {confirmDelete && (
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                Click again to confirm
              </Typography>
            )}
          </Box>
        )}

        {/* Comment count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CommentOutlinedIcon
            fontSize="small"
            sx={{ color: commentCount > 0 ? 'primary.main' : 'text.disabled', fontSize: 18 }}
          />
          {commentCount > 0 && (
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
              {commentCount}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* 📋 MAIN COMPONENT — MessageBoardView                                       */
/* -------------------------------------------------------------------------- */
export default function MessageBoardView({
  name       = 'Message Board',
  recordType = 'messageBoard',
  fields     = [],
  appConfig,
  modes      = ['add', 'read'],
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerMode, setDrawerMode] = useState('read');

  /* ── Fetch ── */
  const loadData = useCallback(async (isRefresh = false) => {
    if (!token || !user?.subscriberId) return;
    if (isRefresh) setRefreshing(true);
console.log('Loading MessageBoardView data with params:', { recordType, subscriberId: user.subscriberId });
const lowerRecordType = recordType.toLowerCase();
    try {
      const res = await getRecords({
        recordType: lowerRecordType,
        subscriberId: user.subscriberId,
        token,
        limit: 100,
      });
      console.log('MessageBoardView fetch:', res);
      const raw = Array.isArray(res) ? res : res?.records || [];
      setData(raw.map(normalise));
    } catch (err) {
      console.error('🔥 MessageBoardView fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.subscriberId, recordType]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setDrawerMode('read');
    setDrawerOpen(true);
  };

  const handleNewPost = () => {
    setSelectedItem(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    loadData(true);
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Feed Header ── */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.3 }}>
          Message Board
        </Typography>
      </Box>

      {/* ── Feed ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 10 }}>
        {data.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 1.5 }}>
            <Typography fontSize={48}>📋</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              No posts yet.{'\n'}Be the first to post!
            </Typography>
          </Box>
        ) : (
          data.map((item) => (
            <PostCard
              key={item._id}
              item={item}
              theme={theme}
              fields={fields}
              appConfig={appConfig}
              name={name}
              modes={modes}
              user={user}
              token={token}
              onRecordDeleted={() => loadData(true)}
              onCardClick={handleCardClick}
            />
          ))
        )}
      </Box>

      {/* ── FAB ── */}
      <Fab
        color="primary"
        onClick={handleNewPost}
        sx={{ position: 'absolute', bottom: 24, right: 24 }}
      >
        <AddIcon />
      </Fab>

      {/* ── Detail Drawer ── */}
      {drawerOpen && (
        <ListItemDetail
          open={drawerOpen}
          onClose={handleDrawerClose}
          item={selectedItem || {}}
          name={name}
          mode={drawerMode}
          modes={modes}
          recordType={recordType}
          fields={fields}
          appConfig={appConfig}
        />
      )}
    </Box>
  );
}