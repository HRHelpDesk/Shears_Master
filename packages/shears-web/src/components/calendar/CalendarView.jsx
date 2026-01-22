// src/components/CalendarView.jsx
import React, { useState, useMemo, useContext } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  Dialog, 
  DialogContent,
  DialogTitle 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  isSameDay
} from 'date-fns';
import HourlyView from './InfluencerApp/HourlyView';                  // calendar/influencer
import AppointmentsHourlyView from './Shear/AppointmentsHourlyView'; // appointments
import { AuthContext } from '../../context/AuthContext';
import { canSeeCalendarEvent } from 'shears-shared/src/Services/Authentication';

const parseYMD = (value) => {
  if (!value) return null;

  let dateString = value;
  if (typeof value === 'string' && value.includes('T')) {
    dateString = value.split('T')[0];
  } else if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    dateString = `${year}-${month}-${day}`;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) {
    console.warn('Invalid date format:', value);
    return null;
  }

  const [_, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
};

const CalendarContainer = styled(Paper)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  width: '98%',
  height: '100%',
  overflow: 'hidden',
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const DayGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: theme.spacing(0.5),
  flexGrow: 0,
}));

const DayCell = styled(Box)(({ theme, today }) => ({
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: today
    ? theme.palette.primary.main
    : theme.palette.background.default,
  color: today
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: today 
      ? theme.palette.primary.dark 
      : theme.palette.action.hover,
  },
  minHeight: 90,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}));

const WeekdayLabel = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: theme.typography.fontWeightMedium,
  color: theme.palette.text.secondary,
  padding: theme.spacing(1),
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '90%',
    maxWidth: 1000,
    height: '85vh',
    maxHeight: 800,
  },
}));

const DialogHeader = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
}));

export default function CalendarView({ events = [], onEventClick, appConfig, modes, recordType = 'calendar' }) {
  const { user } = useContext(AuthContext);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const visibleEvents = useMemo(() => {
    if (!user) return [];
    return events.filter(event => canSeeCalendarEvent(event, user));
  }, [events, user]);

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const firstDayOfMonth = start.getDay();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventCountForDay = useMemo(() => {
    const countMap = new Map();

    visibleEvents.forEach(ev => {
      const eventDate = parseYMD(ev.fieldsData?.date);
      if (eventDate) {
        const key = eventDate.toDateString();
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    });

    return (day) => countMap.get(day.toDateString()) || 0;
  }, [visibleEvents]);

  const handleDayClick = (day) => {
    const count = getEventCountForDay(day);
    if (count === 0) return;

    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDay(null);
  };

  return (
    <>
      <CalendarContainer>
        <CalendarHeader>
          <IconButton onClick={handlePrevMonth}>
            <i className="fa fa-chevron-left" />
          </IconButton>

          <Typography variant="h6">{format(currentDate, 'MMMM yyyy')}</Typography>

          <IconButton onClick={handleNextMonth}>
            <i className="fa fa-chevron-right" />
          </IconButton>
        </CalendarHeader>

        {/* Weekdays */}
        <DayGrid>
          {weekdays.map((day) => (
            <WeekdayLabel key={day}>{day}</WeekdayLabel>
          ))}
        </DayGrid>

        {/* Calendar Days */}
        <DayGrid>
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <Box key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const today = isToday(day);
            const eventCount = getEventCountForDay(day);
            const hasEvents = eventCount > 0;

            return (
              <DayCell
                key={day.toString()}
                today={today}
                onClick={() => handleDayClick(day)}
              >
                <Typography 
                  variant="body1"
                  sx={{ 
                    fontWeight: today ? 700 : 500,
                    color: today ? 'inherit' : 'text.primary'
                  }}
                >
                  {format(day, 'd')}
                </Typography>

                {hasEvents && (
                  <Typography
                    variant="button"
                    sx={{
                      mt: 0.5,
                      color: today 
                        ? 'inherit'
                        : 'primary.main',
                      fontSize: '0.65rem',
                      fontWeight: 500,
                    }}
                  >
                    {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                  </Typography>
                )}
              </DayCell>
            );
          })}
        </DayGrid>
      </CalendarContainer>

      {/* Hourly View Modal – switch based on recordType */}
      <StyledDialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogHeader>
          <Typography variant="h6">
            {recordType === 'appointments' ? 'Appointments' : 'Schedule'} – {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseModal}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogHeader>
        <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
          {selectedDay && (
            <>
              {recordType === 'appointments' ? (
                <AppointmentsHourlyView
                  data={visibleEvents}
                  selectedDate={selectedDay}
                  appConfig={appConfig}
                  name="Appointments"
                  modes={modes}
                  onDataRefresh={() => window.location.reload()} // or your refresh logic
                />
              ) : (
                <HourlyView
                  data={visibleEvents}
                  selectedDate={selectedDay}
                  appConfig={appConfig}
                  name="Calendar"
                  modes={modes}
                  onDataRefresh={() => window.location.reload()}
                />
              )}
            </>
          )}
        </DialogContent>
      </StyledDialog>
    </>
  );
}