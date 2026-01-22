// src/components/AppointmentsHourlyViewWeb.jsx
import React, { useMemo, useRef, useEffect, useState, useContext } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { DateTime } from 'luxon';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import formatTime12 from 'shears-shared/src/utils/stringHelpers';
import ListItemDetail from '../../BaseUI/ListItemDetail';
import { AuthContext } from '../../../context/AuthContext';

const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 70;
const DAY_HEIGHT = HOUR_HEIGHT * 24;

const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => ({
  hour: Math.floor(i / 4),
  minutes: (i % 4) * 15,
  index: i,
}));

const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const calculatePosition = (startTime, endTime) => {
  const start = timeToMinutes(startTime);
  const end = endTime ? timeToMinutes(endTime) : start + 60;
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

export default function AppointmentsHourlyViewWeb({
  data = [],
  selectedDate,
  appConfig,
  name = 'Appointments',
  modes = ['read', 'add', 'edit', 'delete'],
  onDataRefresh,
}) {
  const scrollRef = useRef(null);
  const { token, user } = useContext(AuthContext);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailMode, setDetailMode] = useState('read');
  const [localData, setLocalData] = useState(data);

  useEffect(() => setLocalData(data), [data]);

  const dayAppointments = useMemo(() => {
    const targetDay = DateTime.fromJSDate(selectedDate).toISODate();

    const normalized = localData
      .map((item) => {
        if (item.recordType !== 'appointments') return null;
        const fd = item.fieldsData || {};

        if (!fd.date || !fd.time?.startTime) return null;

        const startLocal = DateTime.fromISO(`${fd.date}T${fd.time.startTime}`);

        if (startLocal.toISODate() !== targetDay) return null;

        const endLocal = fd.time.endTime
          ? DateTime.fromISO(`${fd.date}T${fd.time.endTime}`)
          : startLocal.plus({ hours: 1 });

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
  }, [localData, selectedDate]);

  const appointmentsFields = useMemo(() => {
    const nav = appConfig?.mainNavigation?.find(
      (r) => r.name?.toLowerCase() === 'appointments'
    );
    return mapFields(nav?.fields || []);
  }, [appConfig]);

  const handleAppointmentClick = (appt) => {
    setSelectedAppointment(appt.flatItem);
    setDetailMode('read');
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedAppointment(null);
    setDetailMode('read');
    if (onDataRefresh) onDataRefresh();
  };

  useEffect(() => {
    if (dayAppointments.length > 0) {
      const first = dayAppointments[0];
      const firstHour = Math.floor(timeToMinutes(first.startTime) / 60);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: Math.max(0, (firstHour - 2) * HOUR_HEIGHT), behavior: 'smooth' });
      }, 300);
    } else {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 8 * HOUR_HEIGHT, behavior: 'smooth' });
      }, 300);
    }
  }, [dayAppointments]);

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
          height: 3,
          bgcolor: 'error.main',
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            bgcolor: 'error.main',
            borderRadius: '50%',
            position: 'absolute',
            left: -6,
            top: -4.5,
            border: '2px solid white',
          }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h6" fontWeight={600}>
          {selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          
        </Typography>
        {dayAppointments.length > 0 && (
          <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
            {dayAppointments.length} {dayAppointments.length === 1 ? 'appointment' : 'appointments'}
          </Typography>
        )}
      </Box>

      {/* Grid */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <Box sx={{ height: DAY_HEIGHT, position: 'relative' }}>
          {QUARTER_HOURS.map(({ hour, minutes, index }) => {
            const isHour = minutes === 0;
            return (
              <Box
                key={index}
                sx={{
                  height: HOUR_HEIGHT / 4,
                  borderBottom: '1px dashed',
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                {isHour && (
                  <Typography
                    sx={{
                      position: 'absolute',
                      left: 0,
                      width: TIME_COLUMN_WIDTH,
                      textAlign: 'right',
                      pr: 1,
                      pt: 0.5,
                      fontSize: 12,
                      color: 'text.secondary',
                    }}
                  >
                    {formatTime12(`${hour.toString().padStart(2, '0')}:00`)}
                  </Typography>
                )}
              </Box>
            );
          })}

          {renderNowLine()}

          {/* Appointments */}
          {dayAppointments.map((appt) => {
            const { top, height } = calculatePosition(appt.startTime, appt.endTime);
            const colWidth = (window.innerWidth - TIME_COLUMN_WIDTH - 40) / appt._cols;

            return (
              <Box
                key={appt._id}
                onClick={() => handleAppointmentClick(appt)}
                sx={{
                  position: 'absolute',
                  top,
                  left: TIME_COLUMN_WIDTH + appt._col * colWidth,
                  width: colWidth - 8,
                  height,
                  bgcolor: 'primary.light',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  p: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'primary.100' },
                }}
              >
                <Typography variant="caption" fontWeight={700}>
                  {formatTime12(appt.startTime)} – {formatTime12(appt.endTime)}
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {appt.contactName}
                </Typography>
                <Typography variant="caption" noWrap color="text.secondary">
                  {appt.serviceName}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Empty State */}
      {dayAppointments.length === 0 && (
        <Box sx={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No appointments scheduled for this day
          </Typography>
        </Box>
      )}

      {/* Detail Modal */}
      <ListItemDetail
        open={detailModalOpen}
        onClose={handleCloseDetail}
        item={selectedAppointment}
        fields={appointmentsFields}
        name={name}
        mode={detailMode}
        modes={modes}
        recordType="appointments"
        appConfig={appConfig}
      />
    </Box>
  );
}