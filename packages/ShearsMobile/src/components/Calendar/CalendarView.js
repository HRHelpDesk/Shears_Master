// src/components/CalendarView.js
import React, { useState, useMemo, useCallback, useEffect, useContext, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { IconButton, useTheme, Surface, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
} from 'date-fns';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import HourlyView from './InfluencerApp/HourlyView';
import AppointmentsHourlyView from './Shear/AppointmentsHourlyView';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { canSeeCalendarEvent, getRecords } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';

const WINDOW_WIDTH = Dimensions.get('window').width;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseYMD = (value) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [_, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
};

const getMonthKey = (date) => format(date, 'yyyy-MM');
const toDateKey  = (date) => format(date, 'yyyy-MM-dd');

/* -------------------------------------------------------
   Memoized day cell
------------------------------------------------------- */
const DayCell = memo(({
  day, daySize, dayHeight, today, inMonth, eventCount, onPress,
  primaryContainer, onPrimaryContainer, onSurface, onSurfaceVariant, primary, onPrimary,
}) => {
  const circleSize = Math.min(36, Math.floor(daySize * 0.72));
  return (
    <TouchableOpacity
      style={[styles.dayCell, { width: daySize, height: dayHeight }]}
      onPress={onPress}
      activeOpacity={eventCount > 0 ? 0.7 : 1}
    >
      <View style={[
        styles.dayCircle,
        today && { backgroundColor: primaryContainer, width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
      ]}>
        <Text style={[styles.dayText, {
          color: today ? onPrimaryContainer : inMonth ? onSurface : onSurfaceVariant,
          fontWeight: today ? '700' : '400',
        }]}>
          {format(day, 'd')}
        </Text>
      </View>
      {eventCount > 0 && (
        <View style={[styles.eventBadge, { backgroundColor: primary }]}>
          <Text style={[styles.eventBadgeText, { color: onPrimary }]}>{eventCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

/* -------------------------------------------------------
   Main component
------------------------------------------------------- */
export default function CalendarView({
  data = [],
  appConfig,
  onRefresh,
  recordType = null,
  modes,
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [containerWidth, setContainerWidth] = useState(WINDOW_WIDTH - 20);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const translateX = useMemo(() => new Animated.Value(0), []);
  const [localData, setLocalData] = useState(data);
  const [refreshing, setRefreshing] = useState(false);

  const monthCache = useRef({});

  const daySize         = Math.floor(containerWidth / 7);
  const leftover        = containerWidth - daySize * 7;
  const gridPaddingLeft = Math.round(leftover / 2);
  const dayHeight       = Math.floor(daySize * 1.15);

  const { token, user } = useContext(AuthContext);

  const { primaryContainer, onPrimaryContainer, onSurface, onSurfaceVariant, primary, onPrimary } = theme.colors;

  /* -------------------------------------------------------
     FETCH — scoped to a single month, with cache
  ------------------------------------------------------- */
  const loadCalendarData = useCallback(async (date, force = false) => {
    if (!token || !user?.subscriberId) return;

    const key = getMonthKey(date);

    if (!force && monthCache.current[key]) {
      setLocalData(monthCache.current[key]);
      return;
    }

    const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
    const endDate   = format(endOfMonth(date),   'yyyy-MM-dd');

    try {
      const res = await getRecords({
        recordType: recordType || 'calendar',
        token,
        subscriberId: user.subscriberId,
        startDate,
        endDate,
        limit: 200,
      });

      if (res) {
        monthCache.current[key] = res;
        setLocalData(res);
      }
    } catch (err) {
      console.error('Failed to load calendar:', err);
    }
  }, [token, user?.subscriberId, recordType]);

  useEffect(() => {
    loadCalendarData(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------
     PULL-TO-REFRESH
  ------------------------------------------------------- */
  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCalendarData(currentDate, true);
      if (onRefresh) onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [currentDate, loadCalendarData, onRefresh]);

  /* -------------------------------------------------------
     RECORD DELETED
     Called by HourlyView/AppointmentsHourlyView when a
     record is deleted inside ListItemDetail.
     - Instantly removes from localData (no spinner)
     - Updates the month cache so nav away+back stays correct
  ------------------------------------------------------- */
  const handleRecordDeleted = useCallback((deletedId) => {
    setLocalData(prev => {
      const updated = prev.filter(r => r._id !== deletedId);
      const key = getMonthKey(currentDate);
      monthCache.current[key] = updated;
      return updated;
    });
  }, [currentDate]);

  /* -------------------------------------------------------
     PRE-COMPUTED EVENT MAP  { "yyyy-MM-dd": count }
  ------------------------------------------------------- */
  const eventCountMap = useMemo(() => {
    const map = {};
    for (const event of localData) {
      if (!canSeeCalendarEvent(event, user)) continue;
      const raw = event.fieldsData?.date;
      if (!raw) continue;
      const parsed = parseYMD(raw);
      if (!parsed) continue;
      const key = toDateKey(parsed);
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [localData, user]);

  /* -------------------------------------------------------
     MONTH GRID
  ------------------------------------------------------- */
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end   = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 0 });
    const result = [];
    let cur = start;
    while (cur <= end) { result.push(cur); cur = addDays(cur, 1); }
    while (result.length < 42) result.push(addDays(result[result.length - 1], 1));
    return result;
  }, [currentDate]);

  /* -------------------------------------------------------
     MONTH NAVIGATION
  ------------------------------------------------------- */
  const animateMonthChange = useCallback((newDate, direction) => {
    Animated.timing(translateX, {
      toValue: direction * containerWidth, duration: 200, useNativeDriver: true,
    }).start(() => {
      setCurrentDate(newDate);
      translateX.setValue(-direction * containerWidth);
      Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  }, [translateX, containerWidth]);

  const handlePrevMonth = useCallback(() => {
    const newDate = subMonths(currentDate, 1);
    animateMonthChange(newDate, 1);
    loadCalendarData(newDate);
  }, [currentDate, animateMonthChange, loadCalendarData]);

  const handleNextMonth = useCallback(() => {
    const newDate = addMonths(currentDate, 1);
    animateMonthChange(newDate, -1);
    loadCalendarData(newDate);
  }, [currentDate, animateMonthChange, loadCalendarData]);

  /* -------------------------------------------------------
     MODAL
  ------------------------------------------------------- */
  const openDayModal = useCallback((day) => {
    if (!eventCountMap[toDateKey(day)]) return;
    setSelectedDay(day);
    setModalVisible(true);
  }, [eventCountMap]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedDay(null);
  }, []);

  /* -------------------------------------------------------
     PAN RESPONDER
  ------------------------------------------------------- */
  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50) handlePrevMonth();
        else if (g.dx < -50) handleNextMonth();
      },
    }),
    [handlePrevMonth, handleNextMonth]
  );

  /* -------------------------------------------------------
     VIEW CONFIG
  ------------------------------------------------------- */
  const viewData = useMemo(() => {
    if (!appConfig?.mainNavigation) return null;
    return appConfig.mainNavigation.find(
      r => r.name?.toLowerCase() === 'calendar' || r.displayName?.toLowerCase() === 'calendar'
    ) || null;
  }, [appConfig]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <Surface
      style={[styles.surface, { backgroundColor: theme.colors.surface }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            colors={[primary]}
            tintColor={primary}
            title="Refreshing calendar..."
            titleColor={onSurfaceVariant}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="chevron-left" onPress={handlePrevMonth} size={24} iconColor={primary} />
          <Text style={[styles.headerTitle, { color: onSurface }]}>
            {format(currentDate, 'MMMM yyyy')}
          </Text>
          <IconButton icon="chevron-right" onPress={handleNextMonth} size={24} iconColor={primary} />
        </View>

        {/* Weekday Labels */}
        <View style={[styles.weekdays, { paddingLeft: gridPaddingLeft }]}>
          {WEEKDAYS.map(day => (
            <Text key={day} style={[styles.weekdayText, { width: daySize, color: onSurfaceVariant }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Month Grid */}
        <Animated.View style={[styles.grid, { paddingLeft: gridPaddingLeft, transform: [{ translateX }], width: containerWidth }]}>
          {days.map(day => {
            const key = toDateKey(day);
            return (
              <DayCell
                key={key}
                day={day}
                daySize={daySize}
                dayHeight={dayHeight}
                today={isToday(day)}
                inMonth={isSameMonth(day, currentDate)}
                eventCount={eventCountMap[key] || 0}
                onPress={() => openDayModal(day)}
                primaryContainer={primaryContainer}
                onPrimaryContainer={onPrimaryContainer}
                onSurface={onSurface}
                onSurfaceVariant={onSurfaceVariant}
                primary={primary}
                onPrimary={onPrimary}
              />
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* FAB */}
      {modes.includes('add') && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: primary }]}
          color={onPrimary}
          onPress={() => navigation.navigate('ListItemDetail', {
            item: {},
            name: recordType ? recordType.charAt(0).toUpperCase() + recordType.slice(1) : 'Calendar',
            appConfig,
            mode: 'add',
            fields: mapFields(viewData?.fields || []),
            recordType,
          })}
        />
      )}

      {/* Day Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal} transparent={true}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Icon name="close" size={28} color={primary} />
            </TouchableOpacity>
          </View>

          {selectedDay && (() => {
            const effectiveRecordType = recordType || 'calendar';
            if (effectiveRecordType === 'appointments') {
              return (
                <AppointmentsHourlyView
                  data={localData}
                  selectedDate={selectedDay}
                  appConfig={appConfig}
                  name="Appointments"
                  modes={modes}
                  user={user}
                  onRecordDeleted={handleRecordDeleted}
                />
              );
            }
            return (
              <HourlyView
                data={localData}
                selectedDate={selectedDay}
                appConfig={appConfig}
                name="Calendar"
                modes={modes}
                user={user}
                onRecordDeleted={handleRecordDeleted}
              />
            );
          })()}
        </View>
      </Modal>
    </Surface>
  );
}

/* -------------------------------------------------------
   Styles
------------------------------------------------------- */
const styles = StyleSheet.create({
  surface:      { paddingVertical: 8, elevation: 2, flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 8, marginBottom: 6 },
  headerTitle:  { fontSize: 20, fontWeight: '600' },
  weekdays:     { flexDirection: 'row', marginVertical: 4 },
  weekdayText:  { textAlign: 'center', fontWeight: '600', fontSize: 13 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell:      { justifyContent: 'center', alignItems: 'center' },
  dayCircle:    { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dayText:      { fontSize: 15 },
  eventBadge:   { minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginTop: 2, paddingHorizontal: 5 },
  eventBadgeText: { fontSize: 10, fontWeight: '600' },
  fab:          { position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 100 : 20, borderRadius: 30, elevation: 5 },
  modalContainer: { flex: 1, marginTop: 50, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 1 },
  closeButton:  { padding: 8 },
});