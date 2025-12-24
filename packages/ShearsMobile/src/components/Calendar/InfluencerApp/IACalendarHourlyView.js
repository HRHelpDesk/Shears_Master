// src/components/CalendarHourlyView.js
import React, {
  useState,
  useMemo,
  useContext,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { getRecords } from 'shears-shared/src/Services/Authentication';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { AuthContext } from '../../../context/AuthContext';
import formatTime12 from 'shears-shared/src/utils/stringHelpers';
import { DateTime } from 'luxon';

/* ===============================================================
   CONSTANTS
============================================================== */
const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 60;
const DAY_HEIGHT = HOUR_HEIGHT * 24;
const DATE_BUTTON_WIDTH = 60;

const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return { hour, minutes, index: i };
});

/* ===============================================================
   HELPERS
============================================================== */
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const calculatePosition = (startTime, endTime) => {
  const start = timeToMinutes(startTime);
  const end = endTime ? timeToMinutes(endTime) : start + 30;
  const top = (start / 60) * HOUR_HEIGHT;
  const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 80);
  return { top, height };
};

const generateDateRange = (center) => {
  const out = [];
  for (let i = -10; i <= 10; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() + i);
    out.push(d);
  }
  return out;
};

/* ---------------------------------------------------------------
   Overlap layout
--------------------------------------------------------------- */
const layoutOverlaps = (events) => {
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const columns = [];

  sorted.forEach((evt) => {
    let placed = false;

    for (const col of columns) {
      const last = col[col.length - 1];
      if (timeToMinutes(evt.startTime) >= timeToMinutes(last.endTime)) {
        col.push(evt);
        evt._col = columns.indexOf(col);
        placed = true;
        break;
      }
    }

    if (!placed) {
      evt._col = columns.length;
      columns.push([evt]);
    }
  });

  return sorted.map((e) => ({ ...e, _cols: columns.length }));
};

/* ===============================================================
   COMPONENT
============================================================== */
export default function IACalendarHourlyView(props) {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { token, user } = useContext(AuthContext);

  const scrollRef = useRef(null);
  const dateScrollRef = useRef(null);

  const merged = { ...(route?.params ?? {}), ...props };
  const { data: propData = [], appConfig, name = 'Calendar' } = merged;

  const [localData, setLocalData] = useState(propData);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);

  /* ------------------------------------------------------------
     Fetch records
------------------------------------------------------------ */
  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      const load = async () => {
        const res = await getRecords({
          recordType: 'calendar',
          token,
          subscriberId: user.subscriberId,
          userId: user.userId,
        });
        if (active) setLocalData(res || []);
      };

      load();
      return () => (active = false);
    }, [token, user.subscriberId, user.userId])
  );

  /* ------------------------------------------------------------
     Date range
------------------------------------------------------------ */
  const dateRange = useMemo(
    () => generateDateRange(selectedDate),
    [selectedDate]
  );

  /* ------------------------------------------------------------
     Center dropdown on open
------------------------------------------------------------ */
  useEffect(() => {
    if (!showDateSelector || !dateScrollRef.current) return;

    const idx = dateRange.findIndex(
      (d) =>
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
    );

    if (idx !== -1) {
      const x =
        idx * DATE_BUTTON_WIDTH -
        width / 2 +
        DATE_BUTTON_WIDTH / 2;

      requestAnimationFrame(() => {
        dateScrollRef.current.scrollTo({
          x: Math.max(0, x),
          animated: true,
        });
      });
    }
  }, [showDateSelector, selectedDate, dateRange]);

  /* ------------------------------------------------------------
     Filter + normalize events
------------------------------------------------------------ */
  const dayAppointments = useMemo(() => {
    const targetDay = DateTime.fromJSDate(selectedDate).toISODate();

    const normalized = localData
      .map((item) => {
        const fd = item.fieldsData || {};
        if (!fd.date || !fd.time?.start) return null;

        const startLocal = DateTime.fromISO(
          `${fd.date}T${fd.time.start}`,
          { zone: fd.time.timezone || 'UTC' }
        ).setZone(DateTime.local().zoneName);

        if (startLocal.toISODate() !== targetDay) return null;

        const endLocal = fd.time.end
          ? DateTime.fromISO(
              `${fd.date}T${fd.time.end}`,
              { zone: fd.time.timezone || 'UTC' }
            ).setZone(DateTime.local().zoneName)
          : startLocal.plus({ minutes: 30 });

        return {
          _id: item._id,
          startTime: startLocal.toFormat('HH:mm'),
          endTime: endLocal.toFormat('HH:mm'),
          contactName:
            fd.assignedInfluencer?.fullName ??
            fd.influencerName?.name ??
            '—',
          serviceName:
            fd.platforms?.map(p => p.platform).join(', ') ?? '—',
          flatItem: {
            ...fd,
            _id: item._id,
            recordType: item.recordType,
            subscriberId: item.subscriberId,
          },
        };
      })
      .filter(Boolean);

    return layoutOverlaps(normalized);
  }, [localData, selectedDate]);

  /* ------------------------------------------------------------
     Scroll to now
------------------------------------------------------------ */
  useEffect(() => {
    const now = new Date();
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT),
        animated: true,
      });
    }, 300);
  }, [selectedDate]);

  /* ------------------------------------------------------------
     Now line
------------------------------------------------------------ */
  const renderNowLine = () => {
    const now = DateTime.local();
    if (!now.hasSame(DateTime.fromJSDate(selectedDate), 'day')) return null;

    const minutes = now.hour * 60 + now.minute;
    const top = (minutes / 60) * HOUR_HEIGHT;

    return (
      <View style={[styles.nowLine, { top }]}>
        <View style={styles.nowDot} />
      </View>
    );
  };

  /* ------------------------------------------------------------
     Quarter rows
------------------------------------------------------------ */
  const renderQuarterHourRow = ({ hour, minutes, index }) => (
    <View key={index} style={styles.quarterHourRow}>
      <View style={[styles.timeLabel, { width: TIME_COLUMN_WIDTH }]}>
        <Text style={minutes === 0 ? styles.timeText : styles.minuteText}>
          {minutes === 0 ? formatTime12(`${hour}:00`) : minutes}
        </Text>
      </View>
      <View style={styles.hourLine} />
    </View>
  );

  /* =============================================================
     RENDER
============================================================= */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            setSelectedDate(d => {
              const n = new Date(d);
              n.setDate(n.getDate() - 1);
              return n;
            })
          }
        >
          <Icon name="chevron-left" size={28} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => setShowDateSelector(v => !v)}
        >
          <Text style={styles.dateText}>
            {selectedDate.toDateString()}
          </Text>
          <Icon
            name={showDateSelector ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setSelectedDate(d => {
              const n = new Date(d);
              n.setDate(n.getDate() + 1);
              return n;
            })
          }
        >
          <Icon name="chevron-right" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Date dropdown */}
      {showDateSelector && (
        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateScroll}
        >
          {dateRange.map((d, i) => {
            const selected =
              d.getFullYear() === selectedDate.getFullYear() &&
              d.getMonth() === selectedDate.getMonth() &&
              d.getDate() === selectedDate.getDate();

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dateButton,
                  selected && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  setSelectedDate(new Date(d));
                  setShowDateSelector(false);
                }}
              >
                <Text style={[
                  styles.weekdayText,
                  { color: selected ? '#fff' : '#666' }
                ]}>
                  {d.toLocaleDateString(undefined, { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  { color: selected ? '#fff' : '#000' }
                ]}>
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Grid */}
      <ScrollView ref={scrollRef}>
        <View style={{ height: DAY_HEIGHT }}>
          {QUARTER_HOURS.map(renderQuarterHourRow)}
          {renderNowLine()}

          <View
            style={[
              styles.appointments,
              { left: TIME_COLUMN_WIDTH, width: width - TIME_COLUMN_WIDTH - 20 },
            ]}
          >
            {dayAppointments.map((appt) => {
              const { top, height } = calculatePosition(
                appt.startTime,
                appt.endTime
              );
              const colWidth =
                (width - TIME_COLUMN_WIDTH - 24) / appt._cols;

              return (
                <TouchableOpacity
                  key={appt._id}
                  style={[
                    styles.event,
                    {
                      top,
                      height,
                      width: colWidth - 6,
                      left: appt._col * colWidth,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('ListItemDetail', {
                      item: appt.flatItem,
                      name,
                      appConfig,
                      fields: mapFields(
                        appConfig?.mainNavigation?.find(
                          r => r.name === 'Calendar'
                        )?.fields || []
                      ),
                      mode: 'read',
                    })
                  }
                >
                  <Text style={styles.eventTime}>
                    {formatTime12(appt.startTime)} – {formatTime12(appt.endTime)}
                  </Text>
                  <Text style={styles.eventTitle}>{appt.contactName}</Text>
                  <Text style={styles.eventSub}>{appt.serviceName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() =>
          navigation.navigate('ListItemDetail', {
            item: { date: DateTime.fromJSDate(selectedDate).toISODate() },
            name,
            appConfig,
            mode: 'add',
          })
        }
      />
    </View>
  );
}

/* =============================================================
   STYLES
============================================================= */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: { fontSize: 18, fontWeight: '600' },

  quarterHourRow: {
    height: HOUR_HEIGHT / 4,
    flexDirection: 'row',
  },
  timeLabel: {
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  timeText: { fontSize: 11, opacity: 0.6 },
  minuteText: { fontSize: 9, opacity: 0.3 },
  hourLine: {
    flex: 1,
    borderTopWidth: 0.25,
    borderColor: '#ddd',
  },

  appointments: {
    position: 'absolute',
    top: 0,
    height: DAY_HEIGHT,
  },

  event: {
    position: 'absolute',
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    padding: 8,
  },
  eventTime: { fontSize: 11, fontWeight: 'bold' },
  eventTitle: { fontSize: 14, fontWeight: '600' },
  eventSub: { fontSize: 12 },

 nowLine: {
  position: 'absolute',
  left: TIME_COLUMN_WIDTH,
  right: 0,
  height: 2,                 // slightly thicker
  backgroundColor: 'red',
  zIndex: 1000,              // ⭐ ABOVE events
},
nowDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: 'red',
  position: 'absolute',
  left: -4,
  top: -4,
  zIndex: 1001,              // ⭐ ABOVE the line itself
},

  dateScroll: {
    paddingVertical: 8,
  },
  dateButton: {
    width: DATE_BUTTON_WIDTH,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  weekdayText: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 2,
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});
