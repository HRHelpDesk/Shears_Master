// src/components/SmartInputs/SmartLivesScheduleWidget.js
import React, { useState, useContext, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTheme, Divider, Chip, Switch } from 'react-native-paper';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords, updateRecord } from 'shears-shared/src/Services/Authentication';
import { DateTime } from 'luxon';
import { GlassActionButton } from '../../UI/GlassActionButton';

import {
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useRefreshVersion } from '../../../context/RefreshContext';

/* ============================================================
   Time + Timezone Formatting (handles both structures)
============================================================ */
function formatTimeWithZone(value) {
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
  
  const h = duration.hours ? `${duration.hours}h` : '';
  const m = duration.minutes ? `${duration.minutes}m` : '';
  
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
   MAIN COMPONENT – Using BottomSheetModal
============================================================ */
export default function SmartLivesScheduleWidget({
  targetDate = null,
  title = "Today's Scheduled Lives",
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  const refreshVersion = useRefreshVersion('dashboard-data');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(new Set());

  const bottomSheetModalRef = useRef(null);

  const snapPoints = useMemo(() => ['60%', '90%'], []);

const dateToShow = useMemo(() => {
  if (targetDate) return targetDate;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return DateTime.now().setZone(tz).toISODate();
}, [targetDate]);


  useEffect(() => {
    const fetchData = async () => {
      if (!user?.subscriberId || !token) return;

      setLoading(true);
      setError(null);

      try {
        const res = await getRecords({
          recordType:   'calendar',
          subscriberId: user.subscriberId,
          startDate:    dateToShow,
          endDate:      dateToShow,
          token,
          limit: 200,          // was 500
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
  return [...data].sort((a, b) => {
    const fd_a = a.fieldsData || a;
    const fd_b = b.fieldsData || b;
    const timeA = fd_a.timeZoneTime?.start || fd_a.startTimeWithZone?.time || '';
    const timeB = fd_b.timeZoneTime?.start || fd_b.startTimeWithZone?.time || '';
    return timeA.localeCompare(timeB);
  });
}, [data]);

  const handlePresentModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismissModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleFlashSalesToggle = useCallback(async (item) => {
    const itemId = item._id;
    const currentValue = item.fieldsData?.flashSales || false;
    const newValue = !currentValue;

    // Add to updating set
    setUpdatingIds(prev => new Set(prev).add(itemId));

    try {
      // Update the record
      const updatedFieldsData = {
        ...item.fieldsData,
        flashSales: newValue,
      };

      await updateRecord(itemId,  updatedFieldsData, token);

      // Update local state
      setData(prevData =>
        prevData.map(dataItem =>
          dataItem._id === itemId
            ? {
                ...dataItem,
                fieldsData: {
                  ...dataItem.fieldsData,
                  flashSales: newValue,
                },
              }
            : dataItem
        )
      );
    } catch (err) {
      console.error('Failed to update flashSales:', err);
      setError('Failed to update flash sales status.');
    } finally {
      // Remove from updating set
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [token]);

  const getInfluencerName = (item) => {
    const fd = item.fieldsData || item;
    return (
      fd.influencerName?.name ||
      fd.influencerName?.raw?.fullName ||
      (fd.influencerName?.raw?.firstName + ' ' + fd.influencerName?.raw?.lastName) ||
      'Unknown'
    );
  };

  const getInfluencerAvatar = (item) => {
    const fd = item.fieldsData || item;
    return fd.influencerName?.raw?.avatar || null;
  };

  const getProducts = (item) => {
    const fd = item.fieldsData || item;
    const products = fd.products || [];
    if (products.length === 0) return [];
    return products.map(
      (p) => p.name || p.productName || p.raw?.productName || 'Unnamed Product'
    );
  };

  const getPlatforms = (item) => {
    const fd = item.fieldsData || item;
    const platforms = fd.platforms || fd.socialMediaPlatforms || [];
    return platforms.map((p) => p.platform).filter(Boolean);
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

  return (
    <>
      <TouchableOpacity
        style={[styles.toggleButton, { borderColor: theme.colors.primary }]}
        onPress={handlePresentModal}
        disabled={loading}
      >
        <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
          {title} ({filteredLives.length})
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text style={[styles.toggleIcon, { color: theme.colors.primary }]}>📅</Text>
        )}
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}                        // opens to first snap point
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
              {title} ({filteredLives.length})
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
          contentContainerStyle={styles.livesContent}
          showsVerticalScrollIndicator={true}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : filteredLives.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No scheduled lives for {formatDate(dateToShow)}
            </Text>
          ) : (
            filteredLives.map((item, index) => {
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
              const isUpdating = updatingIds.has(item._id);

              return (
                <View key={item._id || index}>
                  <View style={[styles.liveCard, { backgroundColor: theme.colors.background }]}>
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
                            {formatDate(fd.date)}
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

                    {/* Flash Sales Toggle */}
                    <View style={styles.flashSalesContainer}>
                      <View style={styles.flashSalesRow}>
                        <Text
                          style={[
                            styles.flashSalesLabel,
                            { color: theme.colors.onSurface },
                          ]}
                        >
                          Flash Sales
                        </Text>
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                          <Switch
                            value={fd.flashSales || false}
                            onValueChange={() => handleFlashSalesToggle(item)}
                            color={theme.colors.primary}
                          />
                        )}
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
                          Flash Sale Products ({products.length})
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
                  </View>

                  {index < filteredLives.length - 1 && (
                    <Divider style={{ marginVertical: 12 }} />
                  )}
                </View>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
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
  livesContent: {
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
  liveCard: {
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
  flashSalesContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  flashSalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flashSalesLabel: {
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
    marginTop: 4,
  },
  productText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
});