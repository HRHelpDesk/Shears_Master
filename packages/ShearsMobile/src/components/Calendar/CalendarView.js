// src/components/CalendarView.js
import React, { useState, useMemo, useCallback } from 'react';
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

const WINDOW_WIDTH = Dimensions.get('window').width;

/* --------------------------------------------------------------
 ✅ FIX: SAFE LOCAL DATE PARSER (no timezone shift)
-------------------------------------------------------------- */
const parseYMD = (value) => {
  if (!value) return null;

  // "YYYY-MM-DD" → local date
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value); // fallback for full ISO strings

  const [_, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0); // ✅ LOCAL midnight
};

export default function CalendarView({ data = [], appConfig }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [containerWidth, setContainerWidth] = useState(WINDOW_WIDTH - 20);
  const [currentDate, setCurrentDate] = useState(new Date());
  const translateX = useMemo(() => new Animated.Value(0), []);

  const daySize = Math.floor(containerWidth / 7);
  const leftover = containerWidth - daySize * 7;
  const gridPaddingLeft = Math.round(leftover / 2);

  /* --------------------------------------------------------------
     ✅ 1) Month Day Grid (LOCAL)
  -------------------------------------------------------------- */
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

  /* --------------------------------------------------------------
     ✅ 2) SAFE EVENT MATCHING (local date comparison)
  -------------------------------------------------------------- */
  const getEventsForDay = useCallback(
    (day) =>
      data.filter((event) => {
        const raw = event.fieldsData?.date;
        if (!raw) return false;

        const eventDate = parseYMD(raw);
        return isSameDay(eventDate, day); // ✅ FIXED: NO SHIFT
      }),
    [data]
  );

  /* --------------------------------------------------------------
     ✅ Navigation between months
  -------------------------------------------------------------- */
  const handlePrevMonth = () => animateMonthChange(subMonths(currentDate, 1), 1);
  const handleNextMonth = () => animateMonthChange(addMonths(currentDate, 1), -1);

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

  /* --------------------------------------------------------------
     ✅ 3) Open day list (NO timezone bugs)
  -------------------------------------------------------------- */
  const openDayList = (day) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length === 0) return;

    navigation.navigate('CalendarListView', {
      selectedDate: day,
      data: dayEvents,
      appConfig,
      header: true,
    });
  };

  /* --------------------------------------------------------------
     ✅ 4) Pass calendar fields (same as ListView)
  -------------------------------------------------------------- */
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

  /* --------------------------------------------------------------
     ✅ 5) RENDER
  -------------------------------------------------------------- */
  return (
    <Surface
      style={[styles.surface, { backgroundColor: theme.colors.surface }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="chevron-left"
            onPress={handlePrevMonth}
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {format(currentDate, 'MMMM yyyy')}
          </Text>
          <IconButton
            icon="chevron-right"
            onPress={handleNextMonth}
            size={24}
            color={theme.colors.primary}
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
                style={[styles.dayCell, { width: daySize, height: daySize }]}
                onPress={() => openDayList(day)}
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
                          ? theme.colors.onPrimary
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

                {/* Event Dots */}
                {eventCount > 0 && (
                  <View style={styles.eventContainer}>
                    {[...Array(Math.min(eventCount, 3))].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.eventDot,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    ))}
                    {eventCount > 3 && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: theme.colors.primary,
                          marginLeft: 2,
                        }}
                      >
                        +{eventCount - 3}
                      </Text>
                    )}
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
            name: 'Calendar',
            appConfig,
            mode: 'add',
            fields: mapFields(viewData?.fields || []),
          })
        }
      />
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
    marginBottom: 6,
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
  eventContainer: {
    flexDirection: 'row',
    marginTop: 4,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 20,
    borderRadius: 30,
    elevation: 5,
  },
});
