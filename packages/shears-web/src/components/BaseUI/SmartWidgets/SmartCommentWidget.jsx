// src/components/SmartInputs/SmartCommentWidget.jsx
import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../../context/AuthContext';
import { updateRecord } from 'shears-shared/src/Services/Authentication';
import { DeleteOutline, Close, CommentOutlined } from '@mui/icons-material';

export default function SmartCommentWidget({
  comments = [],
  mode,
  item,
  onCommentAdded,
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [localComments, setLocalComments] = useState(comments);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const sortedComments = [...localComments].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  const userDisplayName =
    user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.name ||
        user.email?.split('@')[0] ||
        'You'
      : 'Guest';

  const currentUserAvatar = user?.avatar;
  const isAdmin = user?.role === 'admin';
  const currentUserId = user?._id || user?.userId;

  const canDeleteComment = (comment) => {
    if (!currentUserId) return false;
    const commentUserId = comment.user?._id || comment.user?.userId;
    return isAdmin || commentUserId === currentUserId;
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewCommentText('');
    setError(null);
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || saving) return;

    setSaving(true);
    setError(null);

    const optimisticComment = {
      user: {
        _id: currentUserId,
        name: userDisplayName,
        avatar: currentUserAvatar,
      },
      text: newCommentText.trim(),
      date: new Date().toISOString(),
    };

    const updated = [optimisticComment, ...localComments];
    setLocalComments(updated);
    setNewCommentText('');

    if (item?._id && mode !== 'add') {
      try {
        const updatedRecord = { ...item, comments: updated };
        await updateRecord(item._id, updatedRecord, token);
        onCommentAdded?.(updated);
      } catch (err) {
        console.error('Failed to save comment:', err);
        setError('Failed to post comment. It may save when you submit the form.');
        setLocalComments(comments);
      }
    }

    setSaving(false);
  };

  const handleDeleteComment = async (commentToDelete) => {
    if (!canDeleteComment(commentToDelete) || saving) return;

    const updated = localComments.filter(
      (c) => c.date !== commentToDelete.date
    );
    setLocalComments(updated);

    if (item?._id && mode !== 'add') {
      try {
        const updatedRecord = { ...item, comments: updated };
        await updateRecord(item._id, updatedRecord, token);
        onCommentAdded?.(updated);
      } catch (err) {
        console.error('Failed to delete comment:', err);
        setError('Failed to delete comment.');
        setLocalComments(comments);
      }
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ my: 3, marginTop: 0 }}>
      {/* Toggle Button */}
      <Button
        variant="outlined"
        size="small"
        onClick={handleOpenDialog}
        startIcon={<CommentOutlined />}
        sx={{ textTransform: 'none' }}
      >
        Comments ({localComments.length})
      </Button>

      {/* Dialog Modal */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh',
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
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Comments ({localComments.length})
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
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Comments List */}
          {sortedComments.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 6, fontStyle: 'italic' }}
            >
              No comments yet. Be the first to comment!
            </Typography>
          ) : (
            <Box>
              {sortedComments.map((comment, index) => {
                const commentUser = comment.user || {};
                const avatarUrl =
                  commentUser.avatar ||
                  (commentUser._id === currentUserId ? currentUserAvatar : null);
                const initials = commentUser.name?.charAt(0)?.toUpperCase() || '?';
                const canDelete = canDeleteComment(comment);

                return (
                  <Box key={index} sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        src={avatarUrl}
                        alt={commentUser.name || 'User'}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: avatarUrl ? 'transparent' : theme.palette.primary.main,
                        }}
                      >
                        {!avatarUrl && initials}
                      </Avatar>

                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 0.5,
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {commentUser.name || 'Anonymous'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(comment.date)}
                            </Typography>
                            {canDelete && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteComment(comment)}
                                disabled={saving}
                                sx={{ p: 0.5 }}
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                        >
                          {comment.text}
                        </Typography>
                      </Box>
                    </Box>

                    {index < sortedComments.length - 1 && <Divider sx={{ mt: 2.5 }} />}
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>

        {/* Add Comment Form */}
        <DialogActions
          sx={{
            flexDirection: 'column',
            alignItems: 'stretch',
            px: 3,
            py: 2,
            gap: 1.5,
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Write your comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            variant="outlined"
            size="small"
            disabled={saving || !token}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              size="medium"
              onClick={handleCloseDialog}
              disabled={saving}
            >
              Close
            </Button>
            <Button
              variant="contained"
              size="medium"
              onClick={handleAddComment}
              disabled={!newCommentText.trim() || saving || (mode !== 'add' && !item?._id)}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Posting...' : 'Post Comment'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}