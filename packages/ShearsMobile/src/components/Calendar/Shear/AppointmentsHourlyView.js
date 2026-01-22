// src/components/AppointmentsHourlyView.js
import React, { useMemo, useRef, useEffect } from 'react';
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

const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 60;
const DAY_HEIGHT = HOUR_HEIGHT * 24;

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
  const end = endTime ? timeToMinutes(endTime) : start + 60; // default 1h
  const top = (start / 60) * HOUR_HEIGHT;
  const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 80);
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

  return sorted.map((e) => ({ ...e, _cols: columns.length }));
};

/* ===============================================================
   COMPONENT
============================================================== */
export default function AppointmentsHourlyView({
  data = [],
  selectedDate,
  appConfig,
  name = 'Appointments',
  modes = [],
  user, // optional – can be used later for permissions
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const scrollRef = useRef(null);

  const dayAppointments = useMemo(() => {
    const targetDay = DateTime.fromJSDate(selectedDate).toISODate();

    const normalized = data
      .map((item) => {
        if (item.recordType !== 'appointments') return null;
        const fd = item.fieldsData || {};

        if (!fd.date || !fd.time?.startTime) return null;

        // Assuming time is stored in local/business timezone already
        const startLocal = DateTime.fromISO(
          `${fd.date}T${fd.time.startTime}`
        );

        if (startLocal.toISODate() !== targetDay) return null;

        const endLocal = fd.time.endTime
          ? DateTime.fromISO(`${fd.date}T${fd.time.endTime}`)
          : startLocal.plus({ hours: 1 });

        // Prefer explicit duration if available, otherwise calculate
        let displayEnd = fd.time.endTime;
        if (!displayEnd && fd.duration) {
          const totalMin = (Number(fd.duration.hours) || 0) * 60 + (Number(fd.duration.minutes) || 0);
          displayEnd = startLocal.plus({ minutes: totalMin }).toFormat('HH:mm');
        }

        const mainService = fd.service?.[0]?.serviceName || '—';

        return {
          _id: item._id,
          startTime: startLocal.toFormat('HH:mm'),
          endTime: displayEnd || endLocal.toFormat('HH:mm'),
          contactName:
            fd.contact?.firstName && fd.contact?.lastName
              ? `${fd.contact.firstName} ${fd.contact.lastName}`
              : fd.contact?.firstName || '—',
          serviceName: mainService,
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
  }, [data, selectedDate]);

  // Scroll to first appointment or 8 AM
  useEffect(() => {
    if (dayAppointments.length > 0) {
      const first = dayAppointments[0];
      const firstHour = Math.floor(timeToMinutes(first.startTime) / 60);
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, (firstHour - 2) * HOUR_HEIGHT),
          animated: true,
        });
      }, 300);
    } else {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: 8 * HOUR_HEIGHT,
          animated: true,
        });
      }, 300);
    }
  }, [dayAppointments]);

  const renderNowLine = () => {
    const now = DateTime.local();
    if (!now.hasSame(DateTime.fromJSDate(selectedDate), 'day')) return null;

    const minutes = now.hour * 60 + now.minute;
    const top = (minutes / 60) * HOUR_HEIGHT;

    return (
      <View style={[styles.nowLine, { top, backgroundColor: theme.colors.error }]}>
        <View style={[styles.nowDot, { backgroundColor: theme.colors.error }]} />
      </View>
    );
  };

  const renderQuarterHourRow = ({ hour, minutes, index }) => (
    <View key={index} style={styles.quarterHourRow}>
      <View style={[styles.timeLabel, { width: TIME_COLUMN_WIDTH }]}>
        <Text
          style={[
            minutes === 0 ? styles.timeText : styles.minuteText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {minutes === 0 ? formatTime12(`${hour}:00`) : minutes}
        </Text>
      </View>
      <View style={[styles.hourLine, { borderTopColor: theme.colors.border }]} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text
          style={[styles.dateText, { color: theme.colors.onSurface }]}
        >
          {selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        {dayAppointments.length > 0 && (
          <Text
            style={[styles.eventCount, { color: theme.colors.primary }]}
          >
            {dayAppointments.length}{' '}
            {dayAppointments.length === 1 ? 'appointment' : 'appointments'}
          </Text>
        )}
      </View>

      {/* Grid */}
      <ScrollView ref={scrollRef} style={styles.scrollView}>
        <View style={{ height: DAY_HEIGHT }}>
          {QUARTER_HOURS.map(renderQuarterHourRow)}
          {renderNowLine()}

          <View
            style={[
              styles.appointments,
              {
                left: TIME_COLUMN_WIDTH,
                width: width - TIME_COLUMN_WIDTH - 40,
              },
            ]}
          >
            {dayAppointments.map((appt) => {
              const { top, height } = calculatePosition(
                appt.startTime,
                appt.endTime
              );
              const colWidth = (width - TIME_COLUMN_WIDTH - 44) / appt._cols;

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
                      backgroundColor: theme.colors.primaryContainer,
                      borderLeftColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('ListItemDetail', {
                        item: appt.flatItem,
                        name,                               // ← already "Appointments" or similar
                        appConfig,
                        fields: mapFields(
                        appConfig?.mainNavigation?.find(
                            (r) => r.name?.toLowerCase() === name.toLowerCase()   // safe match
                                || r.displayName?.toLowerCase() === name.toLowerCase()
                        )?.fields || []
                        ),
                        mode: 'read',
                        modes,
                        recordType: 'appointments',         // ← add this – very important!
                    })
                    }
                >
                  <Text
                    style={[
                      styles.eventTime,
                      { color: theme.colors.onPrimaryContainer },
                    ]}
                  >
                    {formatTime12(appt.startTime)} – {formatTime12(appt.endTime)}
                  </Text>
                  <Text
                    style={[
                      styles.eventTitle,
                      { color: theme.colors.onPrimaryContainer },
                    ]}
                  >
                    {appt.contactName}
                  </Text>
                  <Text
                    style={[
                      styles.eventSub,
                      { color: theme.colors.onPrimaryContainer },
                    ]}
                  >
                    {appt.serviceName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Empty state */}
      {dayAppointments.length === 0 && (
        <View style={styles.emptyState}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No appointments scheduled for this day
          </Text>
        </View>
      )}
    </View>
  );
}

/* Styles – mostly reused from your original */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  dateText: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  eventCount: { fontSize: 14, fontWeight: '500' },
  scrollView: { flex: 1 },
  quarterHourRow: { height: HOUR_HEIGHT / 4, flexDirection: 'row' },
  timeLabel: { alignItems: 'flex-end', paddingRight: 8 },
  timeText: { fontSize: 11, fontWeight: '500' },
  minuteText: { fontSize: 9 },
  hourLine: { flex: 1, borderTopWidth: 0.5 },
  appointments: { position: 'absolute', top: 0, height: DAY_HEIGHT },
  event: {
    position: 'absolute',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventTime: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  eventTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventSub: { fontSize: 12 },
  nowLine: {
    position: 'absolute',
    left: TIME_COLUMN_WIDTH,
    right: 0,
    height: 3,
    zIndex: 1000,
  },
  nowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    left: -6,
    top: -4.5,
    zIndex: 1001,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 16, fontStyle: 'italic' },
});