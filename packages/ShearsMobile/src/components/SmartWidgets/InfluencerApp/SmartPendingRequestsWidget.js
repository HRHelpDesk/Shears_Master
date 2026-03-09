// src/components/SmartInputs/SmartPendingRequestsWidget.js
import React, { useState, useContext, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput as RNTextInput,
} from 'react-native';
import { useTheme, Divider, Chip, Button, Switch, Portal, Dialog } from 'react-native-paper';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords, updateRecord, saveCalendarAndNotification, sendRejectionNotification } from 'shears-shared/src/Services/Authentication';
import { DateTime } from 'luxon';
import { GlassActionButton } from '../../UI/GlassActionButton';
import { formatDateRange, formatDateValue } from 'shears-shared/src/utils/stringHelpers';

import {
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useRefreshVersion } from '../../../context/RefreshContext';

/* ============================================================
   Time + Timezone Formatting
============================================================ */
function formatTimeWithZone(value) {
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
   Duration Formatting
============================================================ */
function formatDuration(duration) {
  if (!duration) return '—';
  
  const h = duration.hours ? `${duration.hours}h` : '';
  const m = duration.minutes ? `${duration.minutes}m` : '';
  
  const result = [h, m].filter(Boolean).join(' ');
  return result || '—';
}

/* ============================================================
   Date Formatting
============================================================ */


/* ============================================================
   Status Colors
============================================================ */
const getStatusColor = (status, theme) => {
  switch (status) {
    case "Approved":
      return theme.colors.success || "#4CAF50";
    case "Rejected":
      return theme.colors.error || "#F44336";
    case "Completed":
      return theme.colors.tertiary || "#9C27B0";
    default:
      return theme.colors.warning || "#FF9800";
  }
};

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Completed"];

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function SmartPendingRequestsWidget({
  title = "Pending Requests",
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  const refreshVersion = useRefreshVersion('dashboard-data');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Status dialog state
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [notify, setNotify] = useState(true);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  const bottomSheetModalRef = useRef(null);

  const snapPoints = useMemo(() => ['60%', '90%'], []);

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

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshVersion]);

  const pendingRequests = useMemo(() => {
    return data
      .filter((item) => {
        const fd = item.fieldsData || item;
        const innerFd = fd.fieldsData || fd;
        const status = innerFd.status || fd.status || 'Pending';
        return status === 'Pending';
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // newest first
      });
  }, [data]);

  const handlePresentModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismissModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

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
    const products = innerFd.products || fd.products || [];
    if (products.length === 0) return [];
    return products.map(
      (p) => p.name || p.productName || p.raw?.productName || 'Unnamed Product'
    );
  };

  const getPlatforms = (item) => {
    const fd = item.fieldsData || item;
    const innerFd = fd.fieldsData || fd;
    const platforms = innerFd.socialMediaPlatforms || fd.socialMediaPlatforms || [];
    return platforms.map((p) => p.platform).filter(Boolean);
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

      // Get the current fieldsData (flattened)
      const currentFieldsData = getFieldsData(selectedItem);
      const dates = getRequestDates(selectedItem);

      // Create updated fieldsData with new status
      const updatedFieldsData = {
        ...currentFieldsData,
        status: selectedStatus,
      };

      // Add rejection message if rejecting
      if (selectedStatus === "Rejected" && rejectionMessage.trim() !== "") {
        updatedFieldsData.rejectionMessage = rejectionMessage.trim();
        
        // Send rejection notification
        await sendRejectionNotification(
          { ...selectedItem, fieldsData: updatedFieldsData },
          user,
          token,
          rejectionMessage.trim()
        );
      }

      // Update the record with ONLY fieldsData
      await updateRecord(selectedItem._id, updatedFieldsData, token);

      // If approved, create calendar entry and send notification
      if (selectedStatus === "Approved" && dates.length > 0) {
        const message = `Your request for ${formatDateRange(dates)} has been approved. Please check your calendar for the details.`;
console.log("selectedItem for calendar:", selectedItem);
        await saveCalendarAndNotification(
          updatedFieldsData,
          user,
          token,
          notify,
          message
        );
      }

      // Close dialog and refresh data
      handleCloseStatusDialog();
      fetchData();

    } catch (err) {
      console.error("Status update failed:", err);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.toggleButton, { borderColor: theme.colors.primary }]}
        onPress={handlePresentModal}
        disabled={loading}
      >
        <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
          {title} ({pendingRequests.length})
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text style={[styles.toggleIcon, { color: theme.colors.primary }]}>📋</Text>
        )}
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableDismissOnClose={true}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
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
        <View style={styles.sheetHeader}>
          <View style={styles.headerContent}>
            <Text style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
              {title} ({pendingRequests.length})
            </Text>
            <GlassActionButton
              icon="close"
              onPress={handleDismissModal}
              color={theme.colors.onSurface}
              theme={theme}
              statusBarTranslucent={true}
            />
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </View>
        )}

        <BottomSheetScrollView
          contentContainerStyle={styles.requestsContent}
          showsVerticalScrollIndicator={true}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : pendingRequests.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No pending requests
            </Text>
          ) : (
            pendingRequests.map((item, index) => {
              const influencerName = getInfluencerName(item);
              const avatar = getInfluencerAvatar(item);
              const initials = influencerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              const platforms = getPlatforms(item);
              const products = getProducts(item);
              const timeData = getTimeData(item);
              const duration = getDuration(item);
              const dates = getRequestDates(item);
              const status = getStatus(item);
              const notes = getNotes(item);

              return (
                <View key={item._id || index}>
                  <View style={[styles.requestCard, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.influencerRow}>
                        {avatar ? (
                          <Image
                            source={{ uri: avatar }}
                            style={styles.avatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.avatarPlaceholder,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.avatarText,
                                { color: theme.colors.onPrimary },
                              ]}
                            >
                              {initials}
                            </Text>
                          </View>
                        )}
                        <View style={styles.influencerInfo}>
                          <Text
                            style={[
                              styles.influencerName,
                              { color: theme.colors.onSurface },
                            ]}
                          >
                            {influencerName}
                          </Text>
                        <Text
                          style={[
                            styles.dateText,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          {formatDateRange(dates)}
                        </Text>


                        </View>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          Time
                        </Text>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: theme.colors.onSurface },
                          ]}
                        >
                          {formatTimeWithZone(timeData)}
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          Duration
                        </Text>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: theme.colors.onSurface },
                          ]}
                        >
                          {formatDuration(duration)}
                        </Text>
                      </View>
                    </View>

                    {platforms.length > 0 && (
                      <View style={styles.platformsContainer}>
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          Platforms
                        </Text>
                        <View style={styles.platformsRow}>
                          {platforms.map((platform, idx) => (
                            <Chip
                              key={idx}
                              mode="flat"
                              style={styles.chip}
                              textStyle={styles.chipText}
                            >
                              {platform}
                            </Chip>
                          ))}
                        </View>
                      </View>
                    )}

                    {products.length > 0 && (
                      <View style={styles.productsContainer}>
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          Requested Products ({products.length})
                        </Text>
                        {products.map((productName, idx) => (
                          <Text
                            key={idx}
                            style={[
                              styles.productText,
                              { color: theme.colors.onSurface },
                            ]}
                          >
                            • {productName}
                          </Text>
                        ))}
                      </View>
                    )}

                    {notes && (
                      <View style={styles.notesContainer}>
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          Notes
                        </Text>
                        <Text
                          style={[
                            styles.notesText,
                            { color: theme.colors.onSurface },
                          ]}
                        >
                          {notes}
                        </Text>
                      </View>
                    )}

                    <View style={styles.statusWidgetContainer}>
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        Request Status
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.statusButton,
                          { 
                            borderColor: getStatusColor(status, theme),
                            backgroundColor: `${getStatusColor(status, theme)}10`,
                          }
                        ]}
                        onPress={() => handleOpenStatusDialog(item)}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: getStatusColor(status, theme) },
                          ]}
                        >
                          {status}
                        </Text>
                        <Text style={[styles.statusButtonIcon, { color: getStatusColor(status, theme) }]}>
                          ⌄
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {index < pendingRequests.length - 1 && (
                    <Divider style={{ marginVertical: 12 }} />
                  )}
                </View>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Status Update Dialog */}
      <Portal>
        <Dialog
          visible={statusDialogVisible}
          onDismiss={handleCloseStatusDialog}
          style={{ backgroundColor: theme.colors.surface, borderRadius:5 }}
        >
          <Dialog.Title>Update Status</Dialog.Title>
          <Dialog.Content>
            <View style={{ marginBottom: 16 }}>
              {STATUS_OPTIONS.map((statusOption) => (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor:
                        statusOption === selectedStatus
                          ? `${theme.colors.primary}15`
                          : 'transparent',
                      borderColor:
                        statusOption === selectedStatus
                          ? theme.colors.primary
                          : theme.colors.outline,
                    },
                  ]}
                  onPress={() => setSelectedStatus(statusOption)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      {
                        color:
                          statusOption === selectedStatus
                            ? theme.colors.primary
                            : theme.colors.onSurface,
                        fontWeight: statusOption === selectedStatus ? '600' : '400',
                      },
                    ]}
                  >
                    {statusOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedStatus === 'Rejected' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ marginBottom: 6, fontWeight: '500' }}>
                  Rejection Message
                </Text>
                <RNTextInput
                  placeholder="Enter message..."
                  value={rejectionMessage}
                  onChangeText={setRejectionMessage}
                  editable={!updating}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                    borderRadius: 8,
                    padding: 10,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    backgroundColor: theme.colors.background,
                  }}
                  multiline
                />
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={{ flex: 1 }}>Send notification?</Text>
              <Switch
                value={notify}
                onValueChange={setNotify}
                disabled={updating}
                color={theme.colors.primary}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseStatusDialog} disabled={updating}>
              Cancel
            </Button>
            <Button onPress={handleConfirmStatus} disabled={updating} loading={updating}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleIcon: {
    fontSize: 20,
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
  requestsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 48,
    fontSize: 15,
  },
  requestCard: {
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  influencerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  influencerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  influencerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 24,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  platformsContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  platformsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
  },
  productsContainer: {
    marginBottom: 16,
  },
  productText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  statusWidgetContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusButtonIcon: {
    fontSize: 18,
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusOptionText: {
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});