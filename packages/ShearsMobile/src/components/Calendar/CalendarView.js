// src/components/CalendarView.js
import React, { useState, useMemo, useCallback, useEffect, useContext } from 'react';
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

const parseYMD = (value) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [_, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
};

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

  const daySize = Math.floor(containerWidth / 7);
  const leftover = containerWidth - daySize * 7;
  const gridPaddingLeft = Math.round(leftover / 2);

  const { token, user } = useContext(AuthContext);

  const loadCalendarData = useCallback(async () => {
    if (!token || !user?.subscriberId) return;

    try {
      const res = await getRecords({
        recordType: recordType || 'calendar',
        token,
        subscriberId: user.subscriberId,
      });
      if (res) setLocalData(res);
    } catch (err) {
      console.error("Failed to load calendar:", err);
    }
  }, [token, user?.subscriberId]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCalendarData();
      if (onRefresh) onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [loadCalendarData, onRefresh]);

  const getEventsForDay = useCallback(
    (day) =>
      localData.filter((event) => {
          if (!canSeeCalendarEvent(event, user)) {
          return false;
        }
        const raw = event.fieldsData?.date;
        if (!raw) return false;
        const eventDate = parseYMD(raw);
        return isSameDay(eventDate, day);
      }),
    [localData]
  );

  const generateMonthDays = (date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
    const days = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    while (days.length < 42) {
      days.push(addDays(days[days.length - 1], 1));
    }
    return days;
  };

  const days = useMemo(() => generateMonthDays(currentDate), [currentDate]);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => animateMonthChange(subMonths(currentDate, 1), 1);
  const handleNextMonth = () => animateMonthChange(addMonths(currentDate, 1), -1);
const dayHeight = Math.floor(daySize * 1.15);
  const animateMonthChange = (newDate, direction) => {
    Animated.timing(translateX, {
      toValue: direction * containerWidth,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentDate(newDate);
      translateX.setValue(-direction * containerWidth);

      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 20,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 50) handlePrevMonth();
          else if (gesture.dx < -50) handleNextMonth();
        },
      }),
    [currentDate, containerWidth]
  );

  const openDayModal = (day) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length === 0) return;
    setSelectedDay(day);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDay(null);
  };

  const viewData = useMemo(() => {
    if (!appConfig?.mainNavigation) return null;
    return (
      appConfig.mainNavigation.find(
        (r) =>
          r.name?.toLowerCase() === 'calendar' ||
          r.displayName?.toLowerCase() === 'calendar'
      ) || null
    );
  }, [appConfig]);

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
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            title="Refreshing calendar..."
            titleColor={theme.colors.onSurfaceVariant}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="chevron-left"
            onPress={handlePrevMonth}
            size={24}
            iconColor={theme.colors.primary}
          />
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {format(currentDate, 'MMMM yyyy')}
          </Text>
          <IconButton
            icon="chevron-right"
            onPress={handleNextMonth}
            size={24}
            iconColor={theme.colors.primary}
          />
        </View>

        {/* Weekday Labels */}
        <View style={[styles.weekdays, { paddingLeft: gridPaddingLeft }]}>
          {weekdays.map((day) => (
            <Text
              key={day}
              style={[
                styles.weekdayText,
                { width: daySize, color: theme.colors.onSurfaceVariant },
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Month Grid */}
        <Animated.View
          style={[
            styles.grid,
            {
              paddingLeft: gridPaddingLeft,
              transform: [{ translateX }],
              width: containerWidth,
            },
          ]}
        >
          {days.map((day) => {
            const today = isToday(day);
            const inMonth = isSameMonth(day, currentDate);
            const eventCount = getEventsForDay(day).length;

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.dayCell, { width: daySize, height: dayHeight }]}

                onPress={() => openDayModal(day)}
                activeOpacity={eventCount > 0 ? 0.7 : 1}
              >
                <View
                  style={[
                    styles.dayCircle,
                    today && {
                      backgroundColor: theme.colors.primaryContainer,
                      width: Math.min(36, Math.floor(daySize * 0.72)),
                      height: Math.min(36, Math.floor(daySize * 0.72)),
                      borderRadius: Math.min(36, Math.floor(daySize * 0.72)) / 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: today
                          ? theme.colors.onPrimaryContainer
                          : inMonth
                          ? theme.colors.onSurface
                          : theme.colors.onSurfaceVariant,
                        fontWeight: today ? '700' : '400',
                      },
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </View>

                {eventCount > 0 && (
                  <View style={[
                    styles.eventBadge,
                    { backgroundColor: theme.colors.primary }
                  ]}>
                    <Text style={[
                      styles.eventBadgeText,
                      { color: theme.colors.onPrimary }
                    ]}>
                      {eventCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() =>
          navigation.navigate('ListItemDetail', {
            item: {},
            name: recordType ? recordType.charAt(0).toUpperCase() + recordType.slice(1) : 'Calendar',
            appConfig,
            mode: 'add',
            fields: mapFields(viewData?.fields || []),
            recordType
          })
        }
      />

      {/* Modal - now fully theme-aware */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
        transparent={true} 
      >
        <View style={[
          styles.modalContainer, 
          { backgroundColor: theme.colors.background }
        ]}>
          {/* Modal Header */}
          <View style={[
            styles.modalHeader,
            { 
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border 
            }
          ]}>
            <TouchableOpacity 
              onPress={closeModal}
              style={styles.closeButton}
            >
              <Icon 
                name="close" 
                size={28} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          </View>

          {/* Hourly View */}
          {selectedDay && (
      <>
        {(() => {
          const effectiveRecordType = recordType || 'calendar'; // fallback

          if (effectiveRecordType === 'appointments') {
            return (
              <AppointmentsHourlyView
                data={localData}
                selectedDate={selectedDay}
                appConfig={appConfig}
                name="Appointments"
                modes={modes}
                user={user}
              />
            );
          } 
          
          // default / fallback → calendar / influencer / scheduling events
          return (
            <HourlyView
              data={localData}
              selectedDate={selectedDay}
              appConfig={appConfig}
              name="Calendar"
              modes={modes}
              user={user}
            />
          );
        })()}
      </>
    )}

          
        </View>
      </Modal>
    </Surface>
  );
}

/* --------------------------------------------------------------
     Styles
-------------------------------------------------------------- */
const styles = StyleSheet.create({
  surface: {
    paddingVertical: 8,
    elevation: 2,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  weekdays: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  weekdayText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 15,
  },
  eventBadge: {
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 2,
  paddingHorizontal: 5,
},
eventBadgeText: {
  fontSize: 10,
  fontWeight: '600',
},
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 20,
    borderRadius: 30,
    elevation: 5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    marginTop: 50, // Adjust this to control how much of the calendar shows behind
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
});