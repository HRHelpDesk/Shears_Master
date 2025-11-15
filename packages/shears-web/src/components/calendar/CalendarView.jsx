// src/components/CalendarView.jsx
import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
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

/* ------------------------------------------------------------------
   Styled Components
------------------------------------------------------------------ */
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

const DayCell = styled(Box)(({ theme, today, event }) => ({
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: today
    ? theme.palette.primary.light
    : event
    ? theme.palette.secondary.light
    : theme.palette.background.default,
  color: today
    ? theme.palette.primary.contrastText
    : event
    ? theme.palette.secondary.contrastText
    : theme.palette.text.primary,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  minHeight: 60,
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

/* ------------------------------------------------------------------
   Component
------------------------------------------------------------------ */
export default function CalendarView({ events = [], onDayClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const firstDayOfMonth = start.getDay();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hasEvent = (day) =>
    events.some((ev) => isSameDay(new Date(ev.fieldsData.date), day));

  return (
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
        {/* offset */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <Box key={`empty-${i}`} />
        ))}

        {days.map((day) => (
          <DayCell
            key={day.toString()}
            today={isToday(day)}
            event={hasEvent(day)}
            onClick={() => onDayClick(day)}
          >
            <Typography variant="body2">{format(day, 'd')}</Typography>

            {hasEvent(day) && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: (theme) => theme.palette.secondary.main,
                  marginTop: 0.5,
                }}
              />
            )}
          </DayCell>
        ))}
      </DayGrid>
    </CalendarContainer>
  );
}
