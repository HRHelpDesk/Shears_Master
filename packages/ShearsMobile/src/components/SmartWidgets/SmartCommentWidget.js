// src/components/SmartInputs/SmartCommentWidget.js
import React, { useState, useContext, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useTheme, Avatar, Divider, IconButton } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { updateRecord } from 'shears-shared/src/Services/Authentication';
import { format } from 'date-fns';
import { GlassActionButton } from '../UI/GlassActionButton';

import {
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function SmartCommentWidget({
  comments = [],
  mode,
  item,
  onCommentAdded,
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const [newCommentText, setNewCommentText] = useState('');
  const [localComments, setLocalComments] = useState(comments);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const bottomSheetModalRef = useRef(null);
  const insets = useSafeAreaInsets(); // Add this

  // Snap points – adjust percentages if needed (e.g. ['50%', '85%'])
  const snapPoints = useMemo(() => ['60%', '100%'], []);

  // Sync local comments when prop changes
  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // Sorted comments (newest first)
  const sortedComments = useMemo(
    () => [...localComments].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [localComments]
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

  const handlePresent = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetModalRef.current?.dismiss();
  }, []);

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
        console.error('Failed to post comment:', err);
        setError('Failed to post comment. Try again.');
        setLocalComments(comments); // revert
      }
    }

    setSaving(false);
    Keyboard.dismiss();
  };

  const handleDeleteComment = async (commentToDelete) => {
    if (!canDeleteComment(commentToDelete) || saving) return;

    setSaving(true);
    setError(null);

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
    <>
      {/* Toggle Button */}
      <TouchableOpacity style={styles.toggleButton} onPress={handlePresent}>
        <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
          Comments ({localComments.length})
        </Text>
        <IconButton
          icon="comment-outline"
          size={20}
          iconColor={theme.colors.primary}
        />
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={['100%']}
        index={0}
        animateOnMount={true}
        enablePanDownToClose={true}
        enableDismissOnClose={true}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
        enableDynamicSizing={false}


        stackBehavior="push"
        style={{ zIndex: 9999 }} // Add high z-index
        topInset={insets.top} // Add this - respects safe area

        modalProps={{ presentationStyle: 'overFullScreen' }}

        backgroundStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.onSurfaceVariant,
          width: 40,
          height: 4,
        }}
        handleStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerContent}>
            <Text style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
              Comments ({localComments.length})
            </Text>
            <GlassActionButton
              icon="close"
              onPress={handleDismiss}
              color={theme.colors.onSurface}
              theme={theme}
              statusBarTranslucent={true}
            />
          </View>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </View>
        )}

        {/* Comments list */}
        <BottomSheetScrollView
          contentContainerStyle={styles.commentsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {sortedComments.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No comments yet. Be the first!
            </Text>
          ) : (
            sortedComments.map((comment, index) => {
              const commentUser = comment.user || {};
              const avatarUrl =
                commentUser.avatar ||
                (commentUser._id === currentUserId ? currentUserAvatar : null);
              const initials = commentUser.name?.charAt(0)?.toUpperCase() || '?';
              const canDelete = canDeleteComment(comment);

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
                      <View style={styles.commentTopRow}>
                        <Text
                          style={[styles.commentAuthor, { color: theme.colors.onSurface }]}
                        >
                          {commentUser.name || 'Anonymous'}
                        </Text>
                        {canDelete && (
                          <IconButton
                            icon="delete-outline"
                            size={18}
                            iconColor={theme.colors.error}
                            onPress={() => handleDeleteComment(comment)}
                            disabled={saving}
                            style={styles.deleteButton}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.commentDate,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {formatDate(comment.date)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.commentText, { color: theme.colors.onSurface }]}>
                    {comment.text}
                  </Text>

                  {index < sortedComments.length - 1 && (
                    <Divider style={{ marginVertical: 12 }} />
                  )}
                </View>
              );
            })
          )}
        </BottomSheetScrollView>

        {/* Input form – fixed at bottom */}
        <View style={[styles.addForm, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.outline,
                color: theme.colors.onSurface,
                backgroundColor: theme.colors.background,
              },
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
            disabled={
              !newCommentText.trim() || saving || (mode !== 'add' && !item?._id)
            }
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
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
  sheetHeader: {
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // extra padding so input doesn't cover last comment
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 48,
    fontSize: 15,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  commentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
  },
  commentDate: {
    fontSize: 13,
    marginTop: 2,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 48,
  },
  deleteButton: {
    margin: 0,
    marginLeft: 8,
  },
  addForm: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  postButton: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 12,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});