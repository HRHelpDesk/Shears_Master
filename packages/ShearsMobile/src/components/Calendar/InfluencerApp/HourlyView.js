// src/components/HourlyView.js
import React, { useMemo, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import formatTime12 from 'shears-shared/src/utils/stringHelpers';
import { DateTime } from 'luxon';
import { canSeeCalendarEvent } from 'shears-shared/src/Services/Authentication';

/* ===============================================================
   CONSTANTS
============================================================== */
const { width } = Dimensions.get('window');
const HOUR_HEIGHT       = 120;
const TIME_COLUMN_WIDTH = 60;
const DAY_HEIGHT        = HOUR_HEIGHT * 24;
const MIN_EVENT_WIDTH   = 200;

const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => ({
  hour:    Math.floor(i / 4),
  minutes: (i % 4) * 15,
  index:   i,
}));

/* ===============================================================
   HELPERS
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
  return sorted.map(e => ({ ...e, _cols: columns.length }));
};

/* ===============================================================
   MEMOIZED SUB-COMPONENTS
============================================================== */
const QuarterHourRow = memo(({ hour, minutes, index, borderColor, textColor }) => (
  <View style={styles.quarterHourRow}>
    <View style={[styles.timeLabel, { width: TIME_COLUMN_WIDTH }]}>
      <Text style={[minutes === 0 ? styles.timeText : styles.minuteText, { color: textColor }]}>
        {minutes === 0 ? formatTime12(`${hour}:00`) : minutes}
      </Text>
    </View>
    <View style={[styles.hourLine, { borderTopColor: borderColor }]} />
  </View>
));

const EventCard = memo(({ appt, contentWidth, theme, onPress }) => {
  const { top, height } = calculatePosition(appt.startTime, appt.endTime);
  const colWidth     = contentWidth / appt._cols;
  const displayStart = appt.isContinuation   ? appt.originalStartTime : appt.startTime;
  const displayEnd   = appt.continuesNextDay  ? appt.originalEndTime   : appt.endTime;

  return (
    <TouchableOpacity
      style={[styles.event, {
        top,
        height,
        width:           colWidth - 6,
        left:            appt._col * colWidth,
        backgroundColor: appt.isContinuation
          ? theme.colors.primaryContainer + 'BB'
          : theme.colors.primaryContainer,
        borderLeftColor: theme.colors.primary,
        borderStyle:     appt.isContinuation ? 'dashed' : 'solid',
      }]}
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
        <Text style={[styles.eventSub, {
          color:      appt.flashSales === true ? '#019506' : '#FF9800',
          fontWeight: 'bold',
        }]}>
          {appt.flashSales === true ? 'Flash Sales Set' : 'Flash Sales Pending'}
        </Text>
      )}
      {appt.flatItem?.products?.length > 0 && (
        <View style={{
          marginTop:      6,
          paddingTop:     4,
          borderTopWidth: StyleSheet.hairlineWidth,
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
                    style={{ fontSize: 11, lineHeight: 14, color: theme.colors.onPrimaryContainer, opacity: 0.85, marginBottom: 1 }}
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
export default function HourlyView({
  data = [],
  selectedDate,
  appConfig,
  name = 'Calendar',
  modes = [],
  user,
  onRecordDeleted,  // (deletedId: string) => void — optional, passed from CalendarView
}) {
  const theme      = useTheme();
  const navigation = useNavigation();
  const scrollRef           = useRef(null);
  const horizontalScrollRef = useRef(null);

  /* ------------------------------------------------------------
     Normalize all records — Luxon tz work done once on data change
  ------------------------------------------------------------ */
  const allNormalized = useMemo(() => {
    const out = [];
    data.forEach((item) => {
      const fd = item.fieldsData || {};
      if (!canSeeCalendarEvent(item, user)) return;
      if (!fd.date || !fd.timeZoneTime?.start) return;

      const rawStart  = fd.timeZoneTime.start;
      const rawEnd    = fd.timeZoneTime.end;
      const tz        = fd.timeZoneTime.timezone || 'UTC';
      const localZone = DateTime.local().zoneName;

      const startLocal = DateTime.fromISO(`${fd.date}T${rawStart}`, { zone: tz }).setZone(localZone);

      let endLocal;
      if (rawEnd) {
        const crossesMidnight = timeToMinutes(rawEnd) <= timeToMinutes(rawStart);
        endLocal = DateTime.fromISO(`${fd.date}T${rawEnd}`, { zone: tz });
        if (crossesMidnight) endLocal = endLocal.plus({ days: 1 });
        endLocal = endLocal.setZone(localZone);
      } else {
        endLocal = startLocal.plus({ minutes: 30 });
      }

      const startISO    = startLocal.toISODate();
      const startTime   = startLocal.toFormat('HH:mm');
      const endTime     = endLocal.toFormat('HH:mm');
      const isOvernight = endLocal.toISODate() !== startLocal.toISODate();

      const base = {
        _id:         item._id,
        startDay:    startISO,
        startTime,
        endTime,
        contactName: fd.assignedInfluencer?.fullName ?? fd.influencerName?.name ?? '—',
        serviceName: fd.platforms?.map(p => p.platform).join(', ') ?? '—',
        flatItem:    { ...fd, _id: item._id, recordType: item.recordType, subscriberId: item.subscriberId },
        flashSales:  fd.flashSales || '',
      };

      if (isOvernight) {
        out.push({ ...base, endTime: '23:59', isContinuation: false, continuesNextDay: true, originalStartTime: startTime, originalEndTime: endTime });
        out.push({ ...base, _id: `${item._id}_cont`, startDay: startLocal.plus({ days: 1 }).toISODate(), startTime: '00:00', isContinuation: true, continuesNextDay: false, originalStartTime: startTime, originalEndTime: endTime });
      } else {
        out.push(base);
      }
    });
    return out;
  }, [data, user]);

  /* ------------------------------------------------------------
     Filter to selected day + layout
  ------------------------------------------------------------ */
  const dayAppointments = useMemo(() => {
    const targetDay = DateTime.fromJSDate(selectedDate).toISODate();
    return layoutOverlaps(allNormalized.filter(e => e.startDay === targetDay));
  }, [allNormalized, selectedDate]);

  /* ------------------------------------------------------------
     Content width
  ------------------------------------------------------------ */
  const contentWidth = useMemo(() => {
    if (dayAppointments.length === 0) return width - TIME_COLUMN_WIDTH - 40;
    const maxCols = Math.max(...dayAppointments.map(a => a._cols), 1);
    return Math.max(maxCols * MIN_EVENT_WIDTH, width - TIME_COLUMN_WIDTH - 40);
  }, [dayAppointments]);

  /* ------------------------------------------------------------
     Scroll to earliest event or 8am
  ------------------------------------------------------------ */
  useEffect(() => {
    const y = dayAppointments.length > 0
      ? Math.max(0, (Math.floor(timeToMinutes(dayAppointments[0].startTime) / 60) - 2) * HOUR_HEIGHT)
      : 8 * HOUR_HEIGHT;
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 300);
  }, [dayAppointments]);

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
     Navigate to detail — passes onRecordDeleted through route
     params so ListItemDetail can invoke it after a delete
  ------------------------------------------------------------ */
  const makeOnPress = useCallback((appt) => () => {
    navigation.navigate('ListItemDetail', {
      item:   appt.flatItem,
      name,
      appConfig,
      fields: mapFields(appConfig?.mainNavigation?.find(r => r.name === 'Calendar')?.fields || []),
      mode:   'read',
      modes,
      onRecordDeleted: onRecordDeleted
        ? (deletedId) => onRecordDeleted(deletedId)
        : undefined,
    });
  }, [navigation, name, appConfig, modes, onRecordDeleted]);

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Date Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.dateText, { color: theme.colors.onSurface }]}>
          {selectedDate.toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </Text>
        {dayAppointments.length > 0 && (
          <Text style={[styles.eventCount, { color: theme.colors.primary }]}>
            {dayAppointments.length} {dayAppointments.length === 1 ? 'event' : 'events'}
          </Text>
        )}
      </View>

      {/* Hourly Grid */}
      <ScrollView ref={scrollRef} style={styles.scrollView}>
        <View style={{ height: DAY_HEIGHT }}>
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

      {/* Empty State */}
      {dayAppointments.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No events scheduled for this day
          </Text>
        </View>
      )}
    </View>
  );
}

/* =============================================================
   STYLES
============================================================= */
const styles = StyleSheet.create({
  container:  { flex: 1, paddingBottom: 20 },
  header:     { padding: 16, borderBottomWidth: 1 },
  dateText:   { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  eventCount: { fontSize: 14, fontWeight: '500' },
  scrollView: { flex: 1 },

  quarterHourRow: { height: HOUR_HEIGHT / 4, flexDirection: 'row' },
  timeLabel:      { alignItems: 'flex-end', paddingRight: 8 },
  timeText:       { fontSize: 11, fontWeight: '500' },
  minuteText:     { fontSize: 9 },
  hourLine:       { flex: 1, borderTopWidth: 0.5 },

  horizontalScroll: { position: 'absolute', top: 0, right: 0, height: DAY_HEIGHT },
  appointments:     { position: 'relative' },

  event: {
    position: 'absolute', borderLeftWidth: 4, borderRadius: 8, padding: 8, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  eventTime:      { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  eventTitle:     { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventSub:       { fontSize: 12 },
  contBadge:      { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  contBadgeText:  { fontSize: 10, fontWeight: '600' },
  continuesLabel: { fontSize: 10, fontWeight: '500', marginBottom: 2, fontStyle: 'italic' },

  nowLine: { position: 'absolute', left: TIME_COLUMN_WIDTH, right: 0, height: 3, zIndex: 1000 },
  nowDot:  { width: 12, height: 12, borderRadius: 6, position: 'absolute', left: -6, top: -4.5, zIndex: 1001, borderWidth: 2, borderColor: '#fff' },

  emptyState: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  emptyText:  { fontSize: 16, fontStyle: 'italic' },
});