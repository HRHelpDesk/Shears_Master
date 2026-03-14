// src/components/CalendarHourlyView.js
import React, {
  useState,
  useMemo,
  useContext,
  useEffect,
  useRef,
  useCallback,
  memo,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StyleSheet as RNStyleSheet,
  Platform,
} from 'react-native';
import { useTheme, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { canSeeCalendarEvent, getRecords } from 'shears-shared/src/Services/Authentication';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { AuthContext } from '../../../context/AuthContext';
import formatTime12 from 'shears-shared/src/utils/stringHelpers';
import { DateTime } from 'luxon';

/* ===============================================================
   CONSTANTS
============================================================== */
const { width } = Dimensions.get('window');
const HOUR_HEIGHT        = 120;
const TIME_COLUMN_WIDTH  = 60;
const DAY_HEIGHT         = HOUR_HEIGHT * 24;
const DATE_BUTTON_WIDTH  = 60;
const MIN_EVENT_WIDTH    = 200;

// Build once at module level — never recreated
const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => ({
  hour:    Math.floor(i / 4),
  minutes: (i % 4) * 15,
  index:   i,
}));

/* ===============================================================
   PURE HELPERS  (module-level, never recreated)
============================================================== */
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const calculatePosition = (startTime, endTime) => {
  const start  = timeToMinutes(startTime);
  const end    = endTime ? timeToMinutes(endTime) : start + 30;
  const top    = (start / 60) * HOUR_HEIGHT;
  const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 30);
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

const toYMD = (date) => DateTime.fromJSDate(date).toISODate();

// Normalise a single raw record into 1 or 2 display events (overnight split)
const normalizeRecord = (item, user) => {
  const fd = item.fieldsData || {};
  if (!fd.date || !fd.timeZoneTime?.start) return [];
  if (!canSeeCalendarEvent(item, user)) return [];

  const rawStart = fd.timeZoneTime.start;
  const rawEnd   = fd.timeZoneTime.end;
  const tz       = fd.timeZoneTime.timezone || 'UTC';
  const localZone = DateTime.local().zoneName;

  const startLocal = DateTime.fromISO(`${fd.date}T${rawStart}`, { zone: tz }).setZone(localZone);

  let endLocal;
  if (rawEnd) {
    const sameDay = timeToMinutes(rawEnd) > timeToMinutes(rawStart);
    endLocal = DateTime.fromISO(`${fd.date}T${rawEnd}`, { zone: tz });
    if (!sameDay) endLocal = endLocal.plus({ days: 1 });
    endLocal = endLocal.setZone(localZone);
  } else {
    endLocal = startLocal.plus({ minutes: 30 });
  }

  const startISO  = startLocal.toISODate();
  const startTime = startLocal.toFormat('HH:mm');
  const endTime   = endLocal.toFormat('HH:mm');
  const isOvernight = endLocal.toISODate() !== startLocal.toISODate();

  const base = {
    _id: item._id,
    startDay:    startISO,
    startTime,
    endTime,
    contactName:
      fd.assignedInfluencer?.fullName ??
      fd.influencerName?.name ??
      '—',
    serviceName: fd.platforms?.map(p => p.platform).join(', ') ?? '—',
    flatItem: {
      ...fd,
      _id:          item._id,
      recordType:   item.recordType,
      subscriberId: item.subscriberId,
    },
    flashSales: fd.flashSales || '',
  };
  if (!isOvernight) return [base];


const result = [
  {
    ...base,
    _id:               `${item._id}_start`,  // ← add _start suffix
    endTime:           '23:59',
    isContinuation:    false,
    continuesNextDay:  true,
    originalStartTime: startTime,
    originalEndTime:   endTime,
  },
];

if (endTime !== '00:00') {
  result.push({
    ...base,
    _id:               `${item._id}_cont`,
    startDay:          startLocal.plus({ days: 1 }).toISODate(),
    startTime:         '00:00',
    isContinuation:    true,
    continuesNextDay:  false,
    originalStartTime: startTime,
    originalEndTime:   endTime,
  });
}

return result;
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
   MEMOIZED SUB-COMPONENTS
============================================================== */

// Quarter-hour row — pure, never changes after mount
const QuarterHourRow = memo(({ hour, minutes, index, borderColor, textColor }) => (
  <View key={index} style={styles.quarterHourRow}>
    <View style={[styles.timeLabel, { width: TIME_COLUMN_WIDTH }]}>
      <Text style={[
        minutes === 0 ? styles.timeText : styles.minuteText,
        { color: textColor },
      ]}>
        {minutes === 0 ? formatTime12(`${hour}:00`) : minutes}
      </Text>
    </View>
    <View style={[styles.hourLine, { borderTopColor: borderColor }]} />
  </View>
));

// Event card — only re-renders if the appointment object reference changes
const EventCard = memo(({ appt, contentWidth, theme, onPress }) => {
  const { top, height } = calculatePosition(appt.startTime, appt.endTime);
  const colWidth = contentWidth / appt._cols;

  const displayStart = appt.isContinuation   ? appt.originalStartTime : appt.startTime;
  const displayEnd   = appt.continuesNextDay  ? appt.originalEndTime  : appt.endTime;

  return (
    <TouchableOpacity
      style={[
        styles.event,
        {
          top,
          height,
          width:           colWidth - 6,
          left:            appt._col * colWidth,
          backgroundColor: appt.isContinuation
            ? theme.colors.primaryContainer + 'BB'
            : theme.colors.primaryContainer,
          borderLeftColor: theme.colors.primary,
          borderStyle:     appt.isContinuation ? 'dashed' : 'solid',
        },
      ]}
      onPress={onPress}
    >
      {appt.isContinuation && (
        <View style={[styles.contBadge, { backgroundColor: theme.colors.primary + '22' }]}>
          <Text style={[styles.contBadgeText, { color: theme.colors.primary }]}>
            ↪ cont'd from {formatTime12(appt.originalStartTime)}
          </Text>
        </View>
      )}

      {appt.continuesNextDay && (
        <Text style={[styles.continuesLabel, { color: theme.colors.primary }]}>
          ↷ continues past midnight
        </Text>
      )}

      <Text style={[styles.eventTime, { color: theme.colors.onPrimaryContainer }]}>
        {formatTime12(displayStart)} – {formatTime12(displayEnd)}
      </Text>
      <Text style={[styles.eventTitle, { color: theme.colors.onPrimaryContainer }]}>
        {appt.contactName}
      </Text>
      <Text style={[styles.eventSub, { color: theme.colors.onPrimaryContainer }]}>
        {appt.serviceName}
      </Text>

      {appt.flashSales && (
        <Text style={[
          styles.eventSub,
          {
            color:      appt.flashSales === true ? '#019506' : '#FF9800',
            fontWeight: 'bold',
          },
        ]}>
          {appt.flashSales === true ? 'Flash Sales Set' : 'Flash Sales Pending'}
        </Text>
      )}

      {appt.flatItem?.products?.length > 0 && (
        <View style={{
          marginTop:      6,
          paddingTop:     4,
          borderTopWidth: RNStyleSheet.hairlineWidth,
          borderTopColor: theme.colors.outline + '60',
        }}>
          {(() => {
            const extraOffset = (appt.isContinuation ? 20 : 0) + (appt.continuesNextDay ? 16 : 0);
            const maxFit      = Math.max(0, Math.floor((height - 75 - extraOffset) / 15));
            const shown       = appt.flatItem.products.slice(0, maxFit);
            const remaining   = appt.flatItem.products.length - shown.length;
            return (
              <>
                {shown.map((prod, idx) => (
                  <Text
                    key={prod._id || idx}
                    style={{
                      fontSize:    11,
                      lineHeight:  14,
                      color:       theme.colors.onPrimaryContainer,
                      opacity:     0.85,
                      marginBottom: 1,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    • {prod.productName || prod.name || 'Product'}
                  </Text>
                ))}
                {remaining > 0 && (
                  <Text style={{ fontSize: 11, color: theme.colors.primary, fontWeight: '500', marginTop: 2 }}>
                    +{remaining} more
                  </Text>
                )}
              </>
            );
          })()}
        </View>
      )}
    </TouchableOpacity>
  );
});

/* ===============================================================
   MAIN COMPONENT
============================================================== */
export default function IACalendarHourlyView(props) {
  const theme      = useTheme();
  const navigation = useNavigation();
  const route      = useRoute();
  const { token, user } = useContext(AuthContext);

  const scrollRef           = useRef(null);
  const dateScrollRef       = useRef(null);
  const horizontalScrollRef = useRef(null);

  // Cache: { "yyyy-MM-dd": normalizedEvents[] }
  const dayCache = useRef({});

  const merged = { ...(route?.params ?? {}), ...props };
  const { appConfig, name = 'Calendar' } = merged;

  const [localData, setLocalData]           = useState([]);
  const [selectedDate, setSelectedDate]     = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);

  /* ------------------------------------------------------------
     FETCH — scoped to ±3 days around the selected date so
     navigating nearby days is instant without re-fetching,
     while keeping the payload tiny.
     Cache key is the date string; skip if already cached.
  ------------------------------------------------------------ */
  const fetchForDate = useCallback(async (date, force = false) => {
    if (!token || !user?.subscriberId) return;

    const key = toYMD(date);
    if (!force && dayCache.current[key]) {
      // Already have this day — nothing to do, dayAppointments will read from cache
      return;
    }

    // Fetch a 7-day window centred on the selected date to amortise requests
    const start = DateTime.fromJSDate(date).minus({ days: 3 }).toISODate();
    const end   = DateTime.fromJSDate(date).plus({ days: 3 }).toISODate();

    try {
      const res = await getRecords({
        recordType:   props.recordType || 'calendar',
        token,
        subscriberId: user.subscriberId,
        startDate:    start,
        endDate:      end,
        limit:        200,
      });

      if (res) setLocalData(res);
    } catch (err) {
      console.error('HourlyView fetch failed:', err);
    }
  }, [token, user?.subscriberId, props.recordType]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchForDate(selectedDate).then(() => {});
      return () => { active = false; };
    }, [fetchForDate, selectedDate])
  );

  // Re-fetch when the user navigates to a new date
  useEffect(() => {
    fetchForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  /* ------------------------------------------------------------
     Normalise ALL fetched records once when localData changes.
     Per-day filtering happens cheaply in dayAppointments below.
  ------------------------------------------------------------ */
  const allNormalized = useMemo(() => {
  const seen = new Set();
  const out = [];
  for (const item of localData) {
    if (seen.has(item._id)) continue;  // ← skip duplicates
    seen.add(item._id);
    const events = normalizeRecord(item, user);
    for (const e of events) out.push(e);
  }
  return out;
}, [localData, user]);

  /* ------------------------------------------------------------
     Filter to selected day + layout — O(n) slice, not O(n) full
  ------------------------------------------------------------ */
  const dayAppointments = useMemo(() => {
    const targetDay = toYMD(selectedDate);
    const filtered  = allNormalized.filter(e => e.startDay === targetDay);
    return layoutOverlaps(filtered);
  }, [allNormalized, selectedDate]);

  /* ------------------------------------------------------------
     Content width
  ------------------------------------------------------------ */
  const contentWidth = useMemo(() => {
    if (dayAppointments.length === 0) return width - TIME_COLUMN_WIDTH - 20;
    const maxCols = Math.max(...dayAppointments.map(a => a._cols), 1);
    return Math.max(maxCols * MIN_EVENT_WIDTH, width - TIME_COLUMN_WIDTH - 20);
  }, [dayAppointments]);

  /* ------------------------------------------------------------
     Date range for picker
  ------------------------------------------------------------ */
  const dateRange = useMemo(() => generateDateRange(selectedDate), [selectedDate]);

  /* ------------------------------------------------------------
     Centre dropdown on open
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!showDateSelector || !dateScrollRef.current) return;
    const idx = dateRange.findIndex(
      d =>
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth()    === selectedDate.getMonth() &&
        d.getDate()     === selectedDate.getDate()
    );
    if (idx !== -1) {
      const x = idx * DATE_BUTTON_WIDTH - width / 2 + DATE_BUTTON_WIDTH / 2;
      requestAnimationFrame(() => {
        dateScrollRef.current.scrollTo({ x: Math.max(0, x), animated: true });
      });
    }
  }, [showDateSelector, selectedDate, dateRange]);

  /* ------------------------------------------------------------
     Scroll to current time
  ------------------------------------------------------------ */
  useEffect(() => {
    const now = new Date();
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y:        Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT),
        animated: true,
      });
    }, 300);
  }, [selectedDate]);

  /* ------------------------------------------------------------
     Now line
  ------------------------------------------------------------ */
  const nowLine = useMemo(() => {
    const now = DateTime.local();
    if (!now.hasSame(DateTime.fromJSDate(selectedDate), 'day')) return null;
    const top = (now.hour * 60 + now.minute) / 60 * HOUR_HEIGHT;
    return (
      <View style={[styles.nowLine, { top, backgroundColor: theme.colors.error }]}>
        <View style={[styles.nowDot, { backgroundColor: theme.colors.error }]} />
      </View>
    );
  }, [selectedDate, theme.colors.error]);

  /* ------------------------------------------------------------
     Stable onPress factory for event cards
  ------------------------------------------------------------ */
  const makeOnPress = useCallback((appt) => () => {
    navigation.navigate('ListItemDetail', {
      item:   appt.flatItem,
      name,
      appConfig,
      fields: mapFields(
        appConfig?.mainNavigation?.find(r => r.name === 'Calendar')?.fields || []
      ),
      mode:  'read',
      modes: props.modes || ['read', 'add', 'edit'],
    });
  }, [navigation, name, appConfig, props.modes]);

  /* ------------------------------------------------------------
     Date navigation helpers
  ------------------------------------------------------------ */
  const goBack = useCallback(() =>
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; }),
  []);

  const goForward = useCallback(() =>
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; }),
  []);

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
      ]}>
        <TouchableOpacity onPress={goBack}>
          <Icon name="chevron-left" size={28} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => setShowDateSelector(v => !v)}
        >
          <Text style={[styles.dateText, { color: theme.colors.onSurface }]}>
            {selectedDate.toDateString()}
          </Text>
          <Icon
            name={showDateSelector ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={goForward}>
          <Icon name="chevron-right" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Date dropdown */}
      {showDateSelector && (
        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.dateScroll, { backgroundColor: theme.colors.surface }]}
        >
          {dateRange.map((d, i) => {
            const selected =
              d.getFullYear() === selectedDate.getFullYear() &&
              d.getMonth()    === selectedDate.getMonth() &&
              d.getDate()     === selectedDate.getDate();
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dateButton, selected && { backgroundColor: theme.colors.primary }]}
                onPress={() => { setSelectedDate(new Date(d)); setShowDateSelector(false); }}
              >
                <Text style={[styles.weekdayText, { color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }]}>
                  {d.toLocaleDateString(undefined, { weekday: 'short' })}
                </Text>
                <Text style={[styles.dayNumber, { color: selected ? theme.colors.onPrimary : theme.colors.onSurface }]}>
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Time grid */}
      <ScrollView ref={scrollRef}>
        <View style={{ height: DAY_HEIGHT }}>
          {/* Quarter-hour rows — stable, memo'd */}
          {QUARTER_HOURS.map(({ hour, minutes, index }) => (
            <QuarterHourRow
              key={index}
              hour={hour}
              minutes={minutes}
              index={index}
              borderColor={theme.colors.border}
              textColor={theme.colors.textSecondary}
            />
          ))}

          {nowLine}

          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            style={[styles.horizontalScroll, { left: TIME_COLUMN_WIDTH }]}
            contentContainerStyle={{ width: contentWidth }}
          >
            <View style={[styles.appointments, { width: contentWidth, height: DAY_HEIGHT }]}>
              {dayAppointments.map(appt => (
                <EventCard
                  key={appt._id}
                  appt={appt}
                  contentWidth={contentWidth}
                  theme={theme}
                  onPress={makeOnPress(appt)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {props.modes.includes('add') && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() =>
            navigation.navigate('ListItemDetail', {
              item:       { date: toYMD(selectedDate) },
              name,
              recordType: 'calendar',
              appConfig,
              mode:       'add',
              modes:      props.modes || ['read', 'add', 'edit'],
              fields:     mapFields(
                appConfig?.mainNavigation?.find(r => r.name === 'Calendar')?.fields || []
              ),
            })
          }
        />
      )}
    </View>
  );
}

/* =============================================================
   STYLES
============================================================= */
const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: Platform.OS === 'ios' ? 100 : 0 },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    padding:        12,
    alignItems:     'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText:     { fontSize: 18, fontWeight: '600' },

  dateScroll:   { paddingVertical: 8 },
  dateButton: {
    width:           DATE_BUTTON_WIDTH,
    height:          70,
    borderRadius:    35,
    alignItems:      'center',
    justifyContent:  'center',
    marginHorizontal: 4,
  },
  weekdayText: { fontSize: 10, textTransform: 'uppercase' },
  dayNumber:   { fontSize: 20, fontWeight: '600', marginTop: 2 },

  quarterHourRow: { height: HOUR_HEIGHT / 4, flexDirection: 'row' },
  timeLabel:      { alignItems: 'flex-end', paddingRight: 8 },
  timeText:       { fontSize: 11, fontWeight: '500' },
  minuteText:     { fontSize: 9 },
  hourLine:       { flex: 1, borderTopWidth: 0.5 },

  horizontalScroll: {
    position: 'absolute',
    top:      0,
    right:    0,
    height:   DAY_HEIGHT,
  },
  appointments: { position: 'relative' },

  event: {
    position:     'absolute',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding:      8,
    elevation:    2,
  },
  eventTime:  { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  eventTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventSub:   { fontSize: 12 },

  contBadge: {
    borderRadius:    4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf:       'flex-start',
    marginBottom:    4,
  },
  contBadgeText:   { fontSize: 10, fontWeight: '600' },
  continuesLabel:  { fontSize: 10, fontWeight: '500', marginBottom: 2, fontStyle: 'italic' },

  nowLine: {
    position: 'absolute',
    left:     TIME_COLUMN_WIDTH,
    right:    0,
    height:   3,
    zIndex:   1000,
  },
  nowDot: {
    width:        12,
    height:       12,
    borderRadius: 6,
    position:     'absolute',
    left:         -6,
    top:          -4.5,
    zIndex:       1001,
    borderWidth:  2,
    borderColor:  '#fff',
  },

  fab: { position: 'absolute', right: 20, bottom: 100 },
});