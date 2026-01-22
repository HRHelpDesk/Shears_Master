// src/components/SmartInputs/SmartCommentWidget.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme, IconButton, Badge, Avatar, Divider } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { updateRecord } from 'shears-shared/src/Services/Authentication';
import { format } from 'date-fns';

export default function SmartCommentWidget({
  comments = [],           // initial comments array
  mode,                    // "read" | "edit" | "add"
  item,                    // full record (needs _id for save)
  onCommentAdded,          // optional callback after add
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [localComments, setLocalComments] = useState(comments);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync with parent if comments change externally
  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // Sort newest → oldest
  const sortedComments = [...localComments].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const userDisplayName =
    user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.name ||
        user.email?.split('@')[0] ||
        'You'
      : 'Guest';

  const currentUserAvatar = user?.avatar;

  const handleAddComment = async () => {
    if (!newCommentText.trim() || saving) return;

    setSaving(true);
    setError(null);

    const optimisticComment = {
      user: {
        _id: user?._id || user?.userId,
        name: userDisplayName,
        avatar: currentUserAvatar,
      },
      text: newCommentText.trim(),
      date: new Date().toISOString(),
    };

    const updated = [optimisticComment, ...localComments];
    setLocalComments(updated);
    setNewCommentText('');

    // Save to backend only if record exists and not in add mode
    if (item?._id && mode !== 'add') {
      try {
        const updatedRecord = { ...item, comments: updated };
        await updateRecord(item._id, updatedRecord, token);
        onCommentAdded?.(updated);
      } catch (err) {
        console.error('Failed to post comment:', err);
        setError('Failed to post comment. Try again.');
        setLocalComments(comments); // revert
      }
    }

    setSaving(false);
  };

  const formatDate = (isoString) => {
    try {
      return format(new Date(isoString), 'MMM d, yyyy • h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <View style={styles.container}>
      {/* Toggle Header */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowComments(!showComments)}
      >
        <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
          Comments ({localComments.length})
        </Text>
        <IconButton
          icon={showComments ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {showComments && (
        <View style={[styles.commentsSection, { borderColor: theme.colors.outline }]}>
          {/* Error */}
          {error && (
            <Text style={{ color: theme.colors.error, marginBottom: 8 }}>
              {error}
            </Text>
          )}

          {/* Comments List */}
          {sortedComments.length === 0 ? (
            <Text style={styles.emptyText}>
              No comments yet. Be the first!
            </Text>
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {sortedComments.map((comment, index) => {
                const commentUser = comment.user || {};
                const avatarUrl = commentUser.avatar || (commentUser._id === user?._id ? currentUserAvatar : null);
                const initials = commentUser.name?.charAt(0)?.toUpperCase() || '?';

                return (
                  <View key={index} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Avatar.Image
                        size={36}
                        source={avatarUrl ? { uri: avatarUrl } : null}
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        {!avatarUrl && initials}
                      </Avatar.Image>

                      <View style={styles.commentInfo}>
                        <Text style={styles.commentAuthor}>
                          {commentUser.name || 'Anonymous'}
                        </Text>
                        <Text style={styles.commentDate}>
                          {formatDate(comment.date)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.commentText}>{comment.text}</Text>

                    {index < sortedComments.length - 1 && (
                      <Divider style={{ marginVertical: 12 }} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Add Comment Form */}
          <View style={styles.addForm}>
            <TextInput
              style={[
                styles.input,
                { borderColor: theme.colors.outline, color: theme.colors.onSurface },
              ]}
              placeholder="Write your comment..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              value={newCommentText}
              onChangeText={setNewCommentText}
              editable={!saving}
            />

            <TouchableOpacity
              style={[
                styles.postButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: !newCommentText.trim() || saving ? 0.6 : 1,
                },
              ]}
              onPress={handleAddComment}
              disabled={!newCommentText.trim() || saving || (mode !== 'add' && !item?._id)}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentsSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff', // adjust for dark mode if needed
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 24,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  addForm: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  postButton: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});