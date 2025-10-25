import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  ScrollView,
} from 'react-native';
import { IconButton, useTheme, Surface } from 'react-native-paper';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
} from 'date-fns';

const WINDOW_WIDTH = Dimensions.get('window').width;

export default function CalendarView({ events = [] }) {
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(WINDOW_WIDTH - 20);
  const [currentDate, setCurrentDate] = useState(new Date());
  const translateX = useMemo(() => new Animated.Value(0), []);

  const daySize = Math.floor(containerWidth / 7);
  const leftover = containerWidth - daySize * 7;
  const gridPaddingLeft = Math.round(leftover / 2);

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

  const hasEvent = (day) =>
    events.some((event) => isSameDay(new Date(event.date), day));

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

  return (
    <Surface
      style={[styles.surface, { backgroundColor: theme.colors.surface }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="chevron-left" onPress={handlePrevMonth} size={24} color={theme.colors.primary} />
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {format(currentDate, 'MMMM yyyy')}
        </Text>
        <IconButton icon="chevron-right" onPress={handleNextMonth} size={24} color={theme.colors.primary} />
      </View>

      {/* Weekday labels */}
      <View style={[styles.weekdays, { paddingLeft: gridPaddingLeft }]}>
        {weekdays.map((day) => (
          <Text
            key={day}
            numberOfLines={1}
            style={[
              styles.weekdayText,
              {
                width: daySize,
                color: theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {day}
          </Text>
        ))}
      </View>

      {/* Animated month grid */}
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
          const selectedMonth = isSameMonth(day, currentDate);
          const event = hasEvent(day);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[styles.dayCell, { width: daySize, height: daySize }]}
              onPress={() => setCurrentDate(day)}
              activeOpacity={0.7}
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
                        : selectedMonth
                        ? theme.colors.onSurface
                        : theme.colors.onSurfaceVariant,
                      fontWeight: today ? '700' : '400',
                    },
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </View>

              {event && (
                <View style={styles.eventContainer}>
                  <View
                    style={[
                      styles.eventDot,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </Surface>
  );
}

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
    marginTop: 4,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
