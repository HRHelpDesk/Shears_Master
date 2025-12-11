// src/components/CalendarHourlyView.js
import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { deleteRecord, getRecords } from 'shears-shared/src/Services/Authentication';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { AuthContext } from '../../context/AuthContext';
import formatTime12 from 'shears-shared/src/utils/stringHelpers';

// Update these constants at the top of the file
const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 120; // ⭐ Increased from 60 to 80
const TIME_COLUMN_WIDTH = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const QUARTER_HOURS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return { hour, minutes, index: i };
});
const DATE_BUTTON_WIDTH = 60;

/* --------------------------------------------------------------
   ⭐ SAFE LOCAL DATE PARSER (no timezone shift)
-------------------------------------------------------------- */
const parseYMD = (value) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [_, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
};

/* --------------------------------------------------------------
   Format date for display
-------------------------------------------------------------- */
const formatDateHeader = (dateObj) => {
  if (!dateObj) return '';
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/* --------------------------------------------------------------
   Convert time string to minutes from midnight
-------------------------------------------------------------- */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/* --------------------------------------------------------------
   Calculate appointment position and height
-------------------------------------------------------------- */
const calculatePosition = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = endTime ? timeToMinutes(endTime) : startMinutes + 30;
  
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const duration = endMinutes - startMinutes;
  const height = Math.max((duration / 60) * HOUR_HEIGHT, 80); // ⭐ Increased minimum from 40 to 80
  
  return { top, height };
};

/* --------------------------------------------------------------
   Generate array of dates (10 back, today, 10 forward)
-------------------------------------------------------------- */
const generateDateRange = (centerDate) => {
  const dates = [];
  for (let i = -10; i <= 10; i++) {
    const date = new Date(centerDate);
    date.setDate(centerDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

/* --------------------------------------------------------------
   Main Component
-------------------------------------------------------------- */
export default function CalendarHourlyView(props) {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { token, user } = useContext(AuthContext);
  const scrollViewRef = useRef(null);
  const dateScrollRef = useRef(null);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const merged = { ...(route?.params ?? {}), ...props };
  const {
    data: propData = [],
    appConfig,
    onRefresh,
    refreshing = false,
    name = 'Calendar',
  } = merged;

  const [localData, setLocalData] = useState(propData);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setLocalData(propData);
  }, [propData]);

  /* ----------------------------------------------------------------
     Generate date range for scrollable selector
  ---------------------------------------------------------------- */
  const dateRange = useMemo(() => generateDateRange(new Date()), []);

  /* ----------------------------------------------------------------
     Scroll to selected date in horizontal scroll
  ---------------------------------------------------------------- */
  useEffect(() => {
    const todayIndex = 10; // Today is at index 10 (center)
    const selectedIndex = dateRange.findIndex(
      (date) =>
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
    );

    if (selectedIndex !== -1 && dateScrollRef.current) {
      const scrollPosition = Math.max(0, selectedIndex * DATE_BUTTON_WIDTH - width / 2 + DATE_BUTTON_WIDTH / 2);
      setTimeout(() => {
        dateScrollRef.current?.scrollTo({
          x: scrollPosition,
          animated: true,
        });
      }, 100);
    }
  }, [selectedDate, dateRange]);

  /* ----------------------------------------------------------------
     Fetch records
  ---------------------------------------------------------------- */
  const fetchLocalRecords = async () => {
    try {
      const resp = await getRecords({
        recordType: 'calendar',
        token,
        subscriberId: user.subscriberId,
        userId: user.userId,
      });
      setLocalData(resp || []);
    } catch (e) {
      console.error('CalendarHourlyView fetch error:', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLocalRecords();
    }, [])
  );

  /* ----------------------------------------------------------------
     Get view configuration
  ---------------------------------------------------------------- */
  const viewData = useMemo(() => {
    return appConfig?.mainNavigation?.find(
      (r) =>
        r.name?.toLowerCase() === 'calendar' ||
        r.displayName?.toLowerCase() === 'calendar'
    );
  }, [appConfig]);

  /* ----------------------------------------------------------------
     Filter appointments for selected date
  ---------------------------------------------------------------- */
  const dayAppointments = useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    return localData
      .map((item) => {
        const fd = item.fieldsData || {};
        const dateStr = fd.date;
        const dateObj = parseYMD(dateStr);
        
        if (!dateObj) return null;
        
        const itemDateStr = dateObj.toISOString().split('T')[0];
        if (itemDateStr !== selectedDateStr) return null;

        const payment = fd.payment;
        const amount = payment?.amount;
        const status = (payment?.status || '').toUpperCase();

        return {
          _id: item._id,
          recordType: item.recordType,
          subscriberId: item.subscriberId,
          contactName: fd.contact?.name ?? '—',
          serviceName: Array.isArray(fd.service)
            ? fd.service.map((s) => s.name).join(', ')
            : fd.service?.name ?? '—',
          startTime: fd.time?.startTime,
          endTime: fd.time?.endTime,
          amount,
          status,
          fieldsData: fd,
          flatItem: {
            ...fd,
            _id: item._id,
            recordType: item.recordType,
            subscriberId: item.subscriberId,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [localData, selectedDate]);

  /* ----------------------------------------------------------------
     Count appointments per date for indicator dots
  ---------------------------------------------------------------- */
  const appointmentCounts = useMemo(() => {
    const counts = {};
    
    localData.forEach((item) => {
      const fd = item.fieldsData || {};
      const dateStr = fd.date;
      const dateObj = parseYMD(dateStr);
      
      if (dateObj) {
        const key = dateObj.toISOString().split('T')[0];
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    
    return counts;
  }, [localData]);

  /* ----------------------------------------------------------------
     Navigate between days
  ---------------------------------------------------------------- */
  const changeDay = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  /* ----------------------------------------------------------------
     Delete appointment
  ---------------------------------------------------------------- */
  const handleDelete = (id) => {
    Alert.alert('Delete appointment?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord(id, token);
            setLocalData((prev) => prev.filter((i) => i._id !== id));
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  /* ----------------------------------------------------------------
     Get status color
  ---------------------------------------------------------------- */
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return '#2ecc71';
      case 'PENDING':
        return '#f1c40f';
      case 'REFUNDED':
      case 'CANCELED':
      case 'CANCELLED':
        return '#e74c3c';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  /* ----------------------------------------------------------------
     Scroll to current time on mount
  ---------------------------------------------------------------- */
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, (currentHour - 2) * HOUR_HEIGHT),
        animated: true,
      });
    }, 300);
  }, [selectedDate]);

  /* ----------------------------------------------------------------
     Check if date is selected
  ---------------------------------------------------------------- */
  const isDateSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  /* ----------------------------------------------------------------
     Check if date is today
  ---------------------------------------------------------------- */
  const isDateToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  /* ----------------------------------------------------------------
     Render date button in horizontal scroll
  ---------------------------------------------------------------- */
  const renderDateButton = (date, index) => {
    const selected = isDateSelected(date);
    const today = isDateToday(date);
    const dateKey = date.toISOString().split('T')[0];
    const appointmentCount = appointmentCounts[dateKey] || 0;

    const month = date.toLocaleDateString(undefined, { month: 'short' });
    const day = date.getDate();
    const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dateButton,
          selected && {
            backgroundColor: theme.colors.primary,
          },
          today && !selected && {
            borderColor: theme.colors.primary,
            borderWidth: 2,
          },
        ]}
        onPress={() => setSelectedDate(new Date(date))}
      >
        <Text
          style={[
            styles.dateMonth,
            {
              color: selected
                ? theme.colors.onPrimary
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {month}
        </Text>
        <Text
          style={[
            styles.dateDay,
            {
              color: selected
                ? theme.colors.onPrimary
                : today
                ? theme.colors.primary
                : theme.colors.onSurface,
              fontWeight: today ? 'bold' : '600',
            },
          ]}
        >
          {day}
        </Text>
        <Text
          style={[
            styles.dateWeekday,
            {
              color: selected
                ? theme.colors.onPrimary
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {weekday}
        </Text>
        
        {appointmentCount > 0 && (
          <View style={styles.dotContainer}>
            {Array.from({ length: Math.min(appointmentCount, 3) }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.appointmentDot,
                  {
                    backgroundColor: selected
                      ? theme.colors.onPrimary
                      : theme.colors.primary,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /* ----------------------------------------------------------------
   Render appointment chip
---------------------------------------------------------------- */
const renderAppointment = (appointment) => {
  const { top, height } = calculatePosition(
    appointment.startTime,
    appointment.endTime
  );

  const chipColor = appointment.status 
    ? getStatusColor(appointment.status)
    : theme.colors.primary;

  // ⭐ Determine if we need compact layout for short appointments
  const isCompact = height < 100;

  return (
    <TouchableOpacity
      key={appointment._id}
      style={[
        styles.appointmentChip,
        {
          top,
          height,
          backgroundColor: chipColor + '20',
          borderLeftColor: chipColor,
          borderLeftWidth: 4,
          paddingVertical: isCompact ? 6 : 10, // ⭐ Less padding for short chips
        },
      ]}
      onPress={() =>
        navigation.navigate('ListItemDetail', {
          item: appointment.flatItem,
          name: 'Calendar',
          appConfig,
          fields: mapFields(viewData?.fields || []),
          mode: 'read',
        })
      }
      onLongPress={() => handleDelete(appointment._id)}
    >
      <View style={styles.chipContent}>
        <Text
          style={[
            styles.chipTime, 
            { color: chipColor },
            isCompact && { fontSize: 11, marginBottom: 2 } // ⭐ Smaller font for compact
          ]}
          numberOfLines={1}
        >
          {formatTime12(appointment.startTime)}
          {appointment.endTime && ` - ${formatTime12(appointment.endTime)}`}
        </Text>
        
        <Text
          style={[
            styles.chipContact, 
            { color: theme.colors.onSurface },
            isCompact && { fontSize: 13, marginBottom: 2 } // ⭐ Smaller font for compact
          ]}
          numberOfLines={1}
        >
          {appointment.contactName}
        </Text>
        
        {/* ⭐ Only show service if not compact OR if no amount */}
        {(!isCompact || !appointment.amount) && (
          <Text
            style={[
              styles.chipService, 
              { color: theme.colors.onSurfaceVariant },
              isCompact && { fontSize: 11, marginBottom: 2 } // ⭐ Smaller font for compact
            ]}
            numberOfLines={1}
          >
            {appointment.serviceName}
          </Text>
        )}

        {/* ⭐ Show amount on same line as service for compact */}
        {appointment.amount && (
          <Text
            style={[
              styles.chipAmount, 
              { color: theme.colors.onSurface },
              isCompact && { fontSize: 11 } // ⭐ Smaller font for compact
            ]}
            numberOfLines={1}
          >
            {isCompact && appointment.serviceName !== '—' ? `${appointment.serviceName} • ` : ''}
            {appointment.amount}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

  /* ----------------------------------------------------------------
     Render hour row
  ---------------------------------------------------------------- */
  const renderHourRow = (hour) => {
    const time12 = formatTime12(`${hour.toString().padStart(2, '0')}:00`);
    const isCurrentHour = new Date().getHours() === hour;

    return (
      <View key={hour} style={styles.hourRow}>
        <View style={[styles.timeLabel, { width: TIME_COLUMN_WIDTH }]}>
          <Text
            style={[
              styles.timeLabelText,
              {
                color: isCurrentHour
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant,
                fontWeight: isCurrentHour ? 'bold' : 'normal',
                opacity: 0.6,
              },
            ]}
          >
            {time12}
          </Text>
        </View>
        
        <View
          style={[
            styles.hourLine,
            {
              borderTopColor: theme.colors.outline + '40',
              backgroundColor: isCurrentHour
                ? theme.colors.primary + '03'
                : 'transparent',
            },
          ]}
        />
      </View>
    );
  };

  /* ----------------------------------------------------------------
   Render hour row with 15-minute increments
---------------------------------------------------------------- */
const renderQuarterHourRow = ({ hour, minutes, index }) => {
  const isHourMark = minutes === 0;
  const time12 = isHourMark 
    ? formatTime12(`${hour.toString().padStart(2, '0')}:00`)
    : `${minutes}`;
  
  const currentTime = new Date();
  const isCurrentHour = currentTime.getHours() === hour && minutes === 0;
  const isCurrentQuarter = 
    currentTime.getHours() === hour && 
    Math.floor(currentTime.getMinutes() / 15) * 15 === minutes;

  return (
    <View key={index} style={styles.quarterHourRow}>
      <View style={[styles.timeLabel, { width: TIME_COLUMN_WIDTH }]}>
        {isHourMark ? (
          <Text
            style={[
              styles.timeLabelText,
              {
                color: isCurrentHour
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant,
                fontWeight: isCurrentHour ? 'bold' : 'normal',
                opacity: 0.6,
              },
            ]}
          >
            {time12}
          </Text>
        ) : (
          <Text
            style={[
              styles.quarterMarkText,
              {
                color: theme.colors.onSurfaceVariant,
                opacity: 0.4,
              },
            ]}
          >
            {time12}
          </Text>
        )}
      </View>
      
      <View
        style={[
          styles.quarterHourLine,
          {
            borderTopColor: theme.colors.outline + '40',
            borderTopWidth: isHourMark ? 0.5 : 0.3, // Thinner for quarter marks
            backgroundColor: isCurrentQuarter
              ? theme.colors.primary + '03'
              : 'transparent',
            opacity: isHourMark ? 0.2 : 0.1, // More transparent for quarter marks
          },
        ]}
      />
    </View>
  );
};

  /* ----------------------------------------------------------------
   Render
---------------------------------------------------------------- */
return (
  <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    {/* Date Navigation Header */}
    <View style={[styles.dateHeader, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => changeDay(-1)}
      >
        <Icon name="chevron-left" size={28} color={theme.colors.primary} />
      </TouchableOpacity>

      <View style={styles.dateDisplay}>
        <Text style={[styles.dateText, { color: theme.colors.onSurface }]}>
          {formatDateHeader(selectedDate)}
        </Text>
        
        {/* ⭐ Toggle button for date selector */}
        <TouchableOpacity
            style={[
                styles.toggleButton,
                { backgroundColor: theme.colors.primary + '10' } // ⭐ Apply theme color inline
            ]}
            onPress={() => setShowDateSelector(!showDateSelector)}
            >
            <Icon 
                name={showDateSelector ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={theme.colors.primary} 
            />
            </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => changeDay(1)}
      >
        <Icon name="chevron-right" size={28} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>

    {/* ⭐ Collapsible Horizontal Date Selector */}
    {showDateSelector && (
      <ScrollView
        ref={dateScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.dateScrollContainer, { backgroundColor: theme.colors.surface }]}
        contentContainerStyle={styles.dateScrollContent}
      >
        {dateRange.map(renderDateButton)}
      </ScrollView>
    )}

    {/* Calendar Grid */}
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.calendarGrid}>
        {/* Quarter hour rows */}
        {QUARTER_HOURS.map(renderQuarterHourRow)}

        {/* Appointments overlay */}
        <View
          style={[
            styles.appointmentsContainer,
            { left: TIME_COLUMN_WIDTH, width: width - TIME_COLUMN_WIDTH - 20 },
          ]}
        >
          {dayAppointments.map(renderAppointment)}
        </View>

        {/* Empty state */}
        {dayAppointments.length === 0 && (
          <View style={styles.emptyState}>
            <Icon
              name="calendar-blank"
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No appointments scheduled
            </Text>
          </View>
        )}
      </View>
    </ScrollView>

    {/* Add FAB */}
    <FAB
      icon="plus"
      style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      color={theme.colors.onPrimary}
      onPress={() =>
        navigation.navigate('ListItemDetail', {
          item: {
            date: selectedDate.toISOString().split('T')[0],
          },
          name: 'Calendar',
          appConfig,
          mode: 'add',
          fields: mapFields(viewData?.fields || []),
        })
      }
    />
  </View>
);



};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  navButton: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8, // ⭐ Added gap between text and button
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    padding: 4,
    borderRadius: 20,
    // ⭐ Remove theme reference - will be applied inline
  },
  dateScrollContainer: {
    maxHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dateScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  dateButton: {
    width: DATE_BUTTON_WIDTH,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 4,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 2,
  },
  dateWeekday: {
    fontSize: 10,
    fontWeight: '500',
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  appointmentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  calendarGrid: {
    position: 'relative',
    paddingBottom: 100,
  },
  quarterHourRow: {
    height: HOUR_HEIGHT / 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourRow: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeLabel: {
    paddingTop: 2,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timeLabelText: {
    fontSize: 11,
  },
  quarterMarkText: {
    fontSize: 9,
    fontWeight: '400',
  },
  quarterHourLine: {
    flex: 1,
    height: HOUR_HEIGHT / 4,
  },
  hourLine: {
    flex: 1,
    borderTopWidth: 0.5,
    height: HOUR_HEIGHT,
    opacity: 0.2,
  },
  appointmentsContainer: {
    position: 'absolute',
    top: 0,
    height: HOUR_HEIGHT * 24,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  appointmentChip: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    elevation: 3,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 100,
  },
  chipContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chipTime: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  chipContact: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  chipService: {
    fontSize: 13,
    marginBottom: 3,
  },
  chipAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    elevation: 5,
  },
});


