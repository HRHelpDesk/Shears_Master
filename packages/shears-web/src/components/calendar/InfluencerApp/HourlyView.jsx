// src/components/HourlyView.jsx
import React, { useMemo, useRef, useEffect, useState, useContext } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { DateTime } from 'luxon';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { canSeeCalendarEvent, getRecords } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../../context/AuthContext';
import ListItemDetail from '../../BaseUI/ListItemDetail';

/* ===============================================================
   CONSTANTS
============================================================== */
const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 70;
const DAY_HEIGHT = HOUR_HEIGHT * 24;

const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => ({
  hour: Math.floor(i / 4),
  minutes: (i % 4) * 15,
  index: i,
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
  const start = timeToMinutes(startTime);
  const end = endTime ? timeToMinutes(endTime) : start + 30;
  const top = (start / 60) * HOUR_HEIGHT;
  const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 80);
  return { top, height };
};

const formatTime12 = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
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
export default function HourlyView({ 
  data = [], 
  selectedDate,
  appConfig,
  name = 'Calendar',
  modes = ['read', 'add', 'edit', 'delete'],
  onDataRefresh
}) {
  const scrollRef = useRef(null);
  const { token, user } = useContext(AuthContext);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailMode, setDetailMode] = useState('read');
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Filter events by visibility (admins see all, others see public + own private)
  const visibleData = useMemo(() => {
    if (!user) return [];
    return localData.filter(item => canSeeCalendarEvent(item, user));
  }, [localData, user]);

  const dayAppointments = useMemo(() => {
    const targetDay = DateTime.fromJSDate(selectedDate).toISODate();

    const normalized = visibleData
      .map((item) => {
        const fd = item.fieldsData || {};
        if (!fd.date || !fd.timeZoneTime?.start) return null;

        const startLocal = DateTime.fromISO(
          `${fd.date}T${fd.timeZoneTime.start}`,
          { zone: fd.timeZoneTime.timezone || 'UTC' }
        ).setZone(DateTime.local().zoneName);

        if (startLocal.toISODate() !== targetDay) return null;

        const endLocal = fd.timeZoneTime.end
          ? DateTime.fromISO(
              `${fd.date}T${fd.timeZoneTime.end}`,
              { zone: fd.timeZoneTime.timezone || 'UTC' }
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
  }, [visibleData, selectedDate]);

  /* --------------------------------------------------
     Calendar fields configuration
  -------------------------------------------------- */
  const calendarFields = useMemo(() => {
    // Find calendar fields in appConfig.mainNavigation
    const calendarNav = appConfig?.mainNavigation?.find(
      (r) => r.name?.toLowerCase() === 'calendar'
    );

    console.log('Calendar Navigation Config:', calendarNav);

    let rawFields;

    if (calendarNav?.fields) {
      rawFields = calendarNav.fields;
    } else {
      // Fallback to default calendar fields if not found in appConfig
      rawFields = [
        { field: 'date', label: 'Date', input: 'date' },
        { 
          field: 'time', 
          label: 'Time', 
          input: 'timeTimezone',
          objectConfig: [
            { field: 'start', label: 'Start Time', input: 'time' },
            { field: 'end', label: 'End Time', input: 'time' },
            { field: 'timezone', label: 'Timezone', input: 'text' }
          ]
        },
        { field: 'assignedInfluencer', label: 'Contact', input: 'linkSelect', inputConfig: { recordType: 'influencers' } },
        { 
          field: 'platforms', 
          label: 'Platforms', 
          input: 'array',
          arrayConfig: {
            object: [
              { field: 'platform', label: 'Platform', input: 'text' }
            ]
          }
        },
      ];
    }

    // Use mapFields to normalize the field structure
    return mapFields(rawFields);
  }, [appConfig]);

  /* --------------------------------------------------
     Handlers
  -------------------------------------------------- */
  const handleAppointmentClick = (appt) => {
    setSelectedAppointment(appt.flatItem);
    setDetailMode('read');
    setDetailModalOpen(true);
  };

  const handleCloseDetail = async () => {
    setDetailModalOpen(false);
    setSelectedAppointment(null);
    setDetailMode('read');

    // Refresh calendar data
    if (onDataRefresh) {
      // If parent provides refresh callback
      onDataRefresh();
    } else {
      // Otherwise fetch directly
      const res = await getRecords({
        recordType: 'calendar',
        token,
        subscriberId: user.subscriberId,
      });
      setLocalData(res || []);
    }
  };

  /* ------------------------------------------------------------
     Scroll to earliest event or 8am
------------------------------------------------------------ */
  useEffect(() => {
    if (dayAppointments.length > 0) {
      const firstEvent = dayAppointments[0];
      const firstHour = Math.floor(timeToMinutes(firstEvent.startTime) / 60);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = Math.max(0, (firstHour - 2) * HOUR_HEIGHT);
        }
      }, 100);
    } else {
      // Default to 8am if no events
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
        }
      }, 100);
    }
  }, [dayAppointments]);

  /* ------------------------------------------------------------
     Now line (only if viewing today)
------------------------------------------------------------ */
  const renderNowLine = () => {
    const now = DateTime.local();
    if (!now.hasSame(DateTime.fromJSDate(selectedDate), 'day')) return null;

    const top = ((now.hour * 60 + now.minute) / 60) * HOUR_HEIGHT;

    return (
      <Box
        sx={{
          position: 'absolute',
          top,
          left: TIME_COLUMN_WIDTH,
          right: 0,
          height: 2,
          bgcolor: 'red',
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            bgcolor: 'red',
            borderRadius: '50%',
            position: 'absolute',
            left: -4,
            top: -3,
          }}
        />
      </Box>
    );
  };

  /* =============================================================
     RENDER
============================================================= */
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Date Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          {selectedDate.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
        {dayAppointments.length > 0 && (
          <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
            {dayAppointments.length} {dayAppointments.length === 1 ? 'event' : 'events'}
          </Typography>
        )}
      </Box>

      {/* GRID */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* FULL DAY HEIGHT CONTAINER */}
        <Box
          sx={{
            height: DAY_HEIGHT,
            minHeight: DAY_HEIGHT,
            position: 'relative',
          }}
        >
          {QUARTER_HOURS.map(({ hour, minutes, index }) => {
            const isHour = minutes === 0;

            return (
              <Box
                key={index}
                sx={{
                  height: HOUR_HEIGHT / 4,
                  position: 'relative',
                }}
              >
                {/* TIME LABEL */}
                {isHour && (
                  <Typography
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 2,
                      width: TIME_COLUMN_WIDTH,
                      textAlign: 'right',
                      pr: 1,
                      opacity: 0.6,
                      fontSize: 12,
                      fontWeight: 600,
                      pointerEvents: 'none',
                    }}
                  >
                    {formatTime12(`${hour.toString().padStart(2, '0')}:00`)}
                  </Typography>
                )}

                {/* GRID LINE */}
                <Divider
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: TIME_COLUMN_WIDTH,
                    right: 0,
                    opacity: isHour ? 0.9 : 0.4,
                  }}
                />
              </Box>
            );
          })}

          {renderNowLine()}

          {/* APPOINTMENTS */}
          {dayAppointments.map((appt) => {
            const { top, height } = calculatePosition(
              appt.startTime,
              appt.endTime
            );

            const colWidth =
              (window.innerWidth - TIME_COLUMN_WIDTH - 40) / appt._cols;

            return (
              <Box
                key={appt._id}
                onClick={() => handleAppointmentClick(appt)}
                sx={{
                  position: 'absolute',
                  top,
                  left: TIME_COLUMN_WIDTH + appt._col * colWidth,
                  width: colWidth - 6,
                  height,
                  bgcolor: '#DBEAFE',
                  borderLeft: '4px solid #3B82F6',
                  borderRadius: 1,
                  p: 1,
                  zIndex: 10,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#BFDBFE',
                    transform: 'scale(1.02)',
                    boxShadow: 2,
                  },
                }}
              >
                <Typography fontSize={12} fontWeight={700}>
                  {formatTime12(appt.startTime)} – {formatTime12(appt.endTime)}
                </Typography>

                <Typography fontWeight={600} noWrap>
                  {appt.contactName}
                </Typography>

                <Typography variant="caption" noWrap>
                  {appt.serviceName}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Empty State */}
      {dayAppointments.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary" fontStyle="italic">
            No events scheduled for this day
          </Typography>
        </Box>
      )}

      {/* LIST ITEM DETAIL MODAL */}
      <ListItemDetail
        open={detailModalOpen}
        onClose={handleCloseDetail}
        item={selectedAppointment}
        fields={calendarFields}
        name={name}
        mode={detailMode}
        modes={modes}
        recordType="calendar"
      />
    </Box>
  );
}