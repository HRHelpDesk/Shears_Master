// src/components/HourlyView.jsx
import React, { useMemo, useRef, useEffect, useState, useContext } from 'react';
import { Box, Typography, Divider, useTheme } from '@mui/material';
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
const MIN_EVENT_WIDTH = 200;

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
  return {
    top: (start / 60) * HOUR_HEIGHT,
    height: Math.max(((end - start) / 60) * HOUR_HEIGHT, 30),
  };
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
  selectedDate: selectedDateProp,
  appConfig,
  name = 'Calendar',
  modes = ['read', 'add', 'edit', 'delete'],
  onDataRefresh
}) {
  const selectedDate = selectedDateProp instanceof Date && !isNaN(selectedDateProp)
    ? selectedDateProp
    : new Date();

  const theme = useTheme();
  const scrollRef = useRef(null);
  const horizontalScrollRef = useRef(null);
  const { token, user } = useContext(AuthContext);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailMode, setDetailMode] = useState('read');
  const [localData, setLocalData] = useState(data);

  useEffect(() => { setLocalData(data); }, [data]);

  /* ------------------------------------------------------------
     Normalize ALL records upfront (no date filter yet).

     KEY FIX: detect overnight by comparing raw HH:mm minutes,
     NOT by comparing Luxon ISO dates — because the raw end time
     (e.g. "03:30") is stored against the same date string as the
     start (e.g. "21:00"), so Luxon parses both on the same ISO
     date and the overnight branch never fires.
  ------------------------------------------------------------ */
  const allNormalized = useMemo(() => {
    if (!user) return [];
    const out = [];

    localData.forEach((item) => {
      if (!canSeeCalendarEvent(item, user)) return;
      const fd = item.fieldsData || {};
      if (!fd.date || !fd.timeZoneTime?.start) return;

      const rawStart = fd.timeZoneTime.start;     // e.g. "21:00"
      const rawEnd   = fd.timeZoneTime.end;       // e.g. "03:30"
      const tz       = fd.timeZoneTime.timezone || 'UTC';

      const startLocal = DateTime.fromISO(`${fd.date}T${rawStart}`, { zone: tz })
        .setZone(DateTime.local().zoneName);

      // Build end with the correct date.
      // If rawEnd minutes <= rawStart minutes → end is on the next calendar day.
      let endLocal;
      if (rawEnd) {
        const crossesMidnight = timeToMinutes(rawEnd) <= timeToMinutes(rawStart);
        endLocal = DateTime.fromISO(`${fd.date}T${rawEnd}`, { zone: tz });
        if (crossesMidnight) endLocal = endLocal.plus({ days: 1 });
        endLocal = endLocal.setZone(DateTime.local().zoneName);
      } else {
        endLocal = startLocal.plus({ minutes: 30 });
      }

      const startISO  = startLocal.toISODate();
      const startTime = startLocal.toFormat('HH:mm');
      const endTime   = endLocal.toFormat('HH:mm');

      // Now that endLocal has the correct date, this is reliable
      const isOvernight = endLocal.toISODate() !== startLocal.toISODate();

      const base = {
        _id: item._id,
        startDay: startISO,
        startTime,
        endTime,
        contactName: fd.assignedInfluencer?.fullName ?? fd.influencerName?.name ?? '—',
        serviceName: fd.platforms?.map(p => p.platform).join(', ') ?? '—',
        flatItem: {
          ...fd,
          _id: item._id,
          recordType: item.recordType,
          subscriberId: item.subscriberId,
        },
        flashSales: fd.flashSales || '',
      };

      if (isOvernight) {
        // Part 1 — original day: startTime → 23:59
        out.push({
          ...base,
          endTime: '23:59',
          isContinuation: false,
          continuesNextDay: true,
          originalStartTime: startTime,
          originalEndTime: endTime,
        });
        // Part 2 — next calendar day: 00:00 → actual endTime
        out.push({
          ...base,
          _id: `${item._id}_cont`,
          startDay: startLocal.plus({ days: 1 }).toISODate(),
          startTime: '00:00',
          isContinuation: true,
          continuesNextDay: false,
          originalStartTime: startTime,
          originalEndTime: endTime,
        });
      } else {
        out.push(base);
      }
    });

    return out;
  }, [localData, user]);

  // Filter to selected day
  const dayAppointments = useMemo(() => {
    const targetDay = DateTime.fromJSDate(selectedDate).toISODate();
    const filtered = allNormalized.filter(e => e.startDay === targetDay);
    return layoutOverlaps(filtered);
  }, [allNormalized, selectedDate]);

  const contentWidth = useMemo(() => {
    if (dayAppointments.length === 0) return window.innerWidth - TIME_COLUMN_WIDTH - 40;
    const maxCols = Math.max(...dayAppointments.map(a => a._cols), 1);
    return Math.max(maxCols * MIN_EVENT_WIDTH, window.innerWidth - TIME_COLUMN_WIDTH - 40);
  }, [dayAppointments]);

  const calendarFields = useMemo(() => {
    const calendarNav = appConfig?.mainNavigation?.find(r => r.name?.toLowerCase() === 'calendar');
    const rawFields = calendarNav?.fields ?? [
      { field: 'date', label: 'Date', input: 'date' },
      {
        field: 'time', label: 'Time', input: 'timeTimezone',
        objectConfig: [
          { field: 'start', label: 'Start Time', input: 'time' },
          { field: 'end', label: 'End Time', input: 'time' },
          { field: 'timezone', label: 'Timezone', input: 'text' },
        ],
      },
      { field: 'assignedInfluencer', label: 'Contact', input: 'linkSelect', inputConfig: { recordType: 'influencers' } },
      {
        field: 'platforms', label: 'Platforms', input: 'array',
        arrayConfig: { object: [{ field: 'platform', label: 'Platform', input: 'text' }] },
      },
    ];
    return mapFields(rawFields);
  }, [appConfig]);

  const handleAppointmentClick = (appt) => {
    setSelectedAppointment(appt.flatItem);
    setDetailMode('read');
    setDetailModalOpen(true);
  };

  const handleCloseDetail = async () => {
    setDetailModalOpen(false);
    setSelectedAppointment(null);
    setDetailMode('read');
    if (onDataRefresh) {
      onDataRefresh();
    } else {
      const res = await getRecords({ recordType: 'calendar', token, subscriberId: user.subscriberId });
      setLocalData(res || []);
    }
  };

  // Scroll to first event or 8am
  useEffect(() => {
    const targetHour = dayAppointments.length > 0
      ? Math.floor(timeToMinutes(dayAppointments[0].startTime) / 60) - 2
      : 8;
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, targetHour * HOUR_HEIGHT);
    }, 100);
  }, [dayAppointments]);

  const renderNowLine = () => {
    const now = DateTime.local();
    if (!now.hasSame(DateTime.fromJSDate(selectedDate), 'day')) return null;
    const top = ((now.hour * 60 + now.minute) / 60) * HOUR_HEIGHT;
    return (
      <Box sx={{ position: 'absolute', top, left: 0, right: 0, height: 2, bgcolor: 'error.main', zIndex: 1000 }}>
        <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%', position: 'absolute', left: -4, top: -3 }} />
      </Box>
    );
  };

  const isDark = theme.palette.mode === 'dark';
  const eventBg = isDark ? theme.palette.primary.dark + '40' : '#DBEAFE';
  const eventBgCont = isDark ? theme.palette.primary.dark + '28' : '#EFF6FF';
  const eventBgHover = isDark ? theme.palette.primary.dark + '70' : '#BFDBFE';
  const eventBorder = theme.palette.primary.main;

  const scrollbarTrack = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const scrollbarThumb = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const scrollbarThumbHover = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const scrollbarSx = {
    '&::-webkit-scrollbar': { height: 8 },
    '&::-webkit-scrollbar-track': { bgcolor: scrollbarTrack },
    '&::-webkit-scrollbar-thumb': { bgcolor: scrollbarThumb, borderRadius: 1, '&:hover': { bgcolor: scrollbarThumbHover } },
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Date Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
        {dayAppointments.length > 0 && (
          <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
            {dayAppointments.length} {dayAppointments.length === 1 ? 'event' : 'events'}
          </Typography>
        )}
      </Box>

      {/* GRID */}
      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
        <Box sx={{ height: DAY_HEIGHT, minHeight: DAY_HEIGHT, position: 'relative', display: 'flex' }}>

          {/* TIME COLUMN */}
          <Box sx={{ width: TIME_COLUMN_WIDTH, flexShrink: 0, position: 'relative' }}>
            {QUARTER_HOURS.map(({ hour, minutes, index }) => (
              <Box key={index} sx={{ height: HOUR_HEIGHT / 4, position: 'relative' }}>
                {minutes === 0 && (
                  <Typography sx={{ position: 'absolute', left: 0, top: 2, width: TIME_COLUMN_WIDTH, textAlign: 'right', pr: 1, opacity: 0.6, fontSize: 12, fontWeight: 600, pointerEvents: 'none', color: 'text.secondary' }}>
                    {formatTime12(`${hour.toString().padStart(2, '0')}:00`)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {/* HORIZONTAL SCROLL AREA */}
          <Box ref={horizontalScrollRef} sx={{ flexGrow: 1, overflowX: 'auto', position: 'relative', ...scrollbarSx }}>
            <Box sx={{ width: contentWidth, height: DAY_HEIGHT, position: 'relative' }}>

              {/* GRID LINES */}
              {QUARTER_HOURS.map(({ minutes, index }) => (
                <Divider key={index} sx={{ position: 'absolute', top: (index * HOUR_HEIGHT) / 4, left: 0, right: 0, opacity: minutes === 0 ? 0.9 : 0.4 }} />
              ))}

              {renderNowLine()}

              {/* APPOINTMENTS */}
              {dayAppointments.map((appt) => {
                const { top, height } = calculatePosition(appt.startTime, appt.endTime);
                const colWidth = contentWidth / appt._cols;

                const displayStart = appt.isContinuation ? appt.originalStartTime : appt.startTime;
                const displayEnd   = appt.continuesNextDay ? appt.originalEndTime : appt.endTime;

                return (
                  <Box
                    key={appt._id}
                    onClick={() => handleAppointmentClick(appt)}
                    sx={{
                      position: 'absolute', top, left: appt._col * colWidth,
                      width: colWidth - 6, height,
                      bgcolor: appt.isContinuation ? eventBgCont : eventBg,
                      borderLeft: `4px solid ${eventBorder}`,
                      borderStyle: appt.isContinuation ? 'dashed' : 'solid',
                      borderRadius: 1, p: 1, zIndex: 10, overflow: 'hidden', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: eventBgHover, transform: 'scale(1.02)', boxShadow: 2 },
                    }}
                  >
                    {/* ↪ cont'd badge */}
                    {appt.isContinuation && (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: `${theme.palette.primary.main}18`, borderRadius: 0.75, px: 0.75, py: 0.25, mb: 0.5 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
                          ↪ cont'd from {formatTime12(appt.originalStartTime)}
                        </Typography>
                      </Box>
                    )}

                    {/* ↷ continues past midnight */}
                    {appt.continuesNextDay && (
                      <Typography sx={{ fontSize: 10, fontWeight: 500, color: 'primary.main', fontStyle: 'italic', mb: 0.25, display: 'block' }}>
                        ↷ continues past midnight
                      </Typography>
                    )}

                    <Typography fontSize={12} fontWeight={700} color="text.primary">
                      {formatTime12(displayStart)} – {formatTime12(displayEnd)}
                    </Typography>

                    <Typography fontWeight={600} noWrap color="text.primary">
                      {appt.contactName}
                    </Typography>

                    <Typography variant="caption" noWrap color="text.secondary">
                      {appt.serviceName}
                    </Typography>
                    <br />

                    {appt.flashSales && (
                      <Typography sx={{ color: appt.flashSales === true ? '#019506' : '#FF9800', fontWeight: 'bold' }} variant="caption" noWrap>
                        {appt.flashSales === true ? 'Flash Sales Set' : 'Flash Sales Pending'}
                      </Typography>
                    )}

                    {appt.flatItem?.products?.length > 0 && (
                      <Box sx={{ mt: 1, pt: 0.5, borderTop: '1px solid', borderColor: 'divider', opacity: 0.9 }}>
                        {(() => {
                          const extraOffset = (appt.isContinuation ? 22 : 0) + (appt.continuesNextDay ? 18 : 0);
                          const maxFit = Math.max(0, Math.floor((height - 65 - extraOffset) / 16));
                          const shown = appt.flatItem.products.slice(0, maxFit);
                          const remaining = appt.flatItem.products.length - shown.length;
                          return (
                            <>
                              {shown.map((prod, idx) => (
                                <Typography key={prod._id || idx} variant="caption" sx={{ display: 'block', lineHeight: 1.3, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  • {prod.productName || prod.name || 'Product'}
                                </Typography>
                              ))}
                              {remaining > 0 && (
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500, mt: 0.5 }}>
                                  +{remaining} more
                                </Typography>
                              )}
                            </>
                          );
                        })()}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Empty State */}
      {dayAppointments.length === 0 && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
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