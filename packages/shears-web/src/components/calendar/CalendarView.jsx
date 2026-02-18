// src/components/CalendarView.jsx
import React, { useState, useMemo, useContext } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  Dialog, 
  DialogContent,
  DialogTitle,
  Fab,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import HourlyView from './InfluencerApp/HourlyView';
import AppointmentsHourlyView from './Shear/AppointmentsHourlyView';
import { AuthContext } from '../../context/AuthContext';
import { canSeeCalendarEvent } from 'shears-shared/src/Services/Authentication';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import ListItemDetail from '../BaseUI/ListItemDetail';

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
  if (!match) return null;

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
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  boxSizing: 'border-box',
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
  width: '100%',
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '95%',
    maxWidth: 1000,
    height: '90vh',
    maxHeight: 900,
    margin: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      width: '90%',
      height: '85vh',
      maxHeight: 800,
      margin: theme.spacing(2),
    },
  },
}));

const DialogHeader = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5, 2),
}));

export default function CalendarView({ 
  events = [], 
  onEventClick, 
  appConfig, 
  modes, 
  recordType = 'calendar' 
}) {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMode, setDetailMode] = useState('add');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const visibleEvents = useMemo(() => {
    if (!user) return [];
    return events.filter(event => canSeeCalendarEvent(event, user));
  }, [events, user]);

  const calendarFields = useMemo(() => {
    const calendarNav = appConfig?.mainNavigation?.find(
      (r) => r.name?.toLowerCase() === recordType?.toLowerCase()
    );
    return mapFields(calendarNav?.fields || []);
  }, [appConfig, recordType]);

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });
  const firstDayOfMonth = start.getDay();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    if (getEventCountForDay(day) === 0) return;
    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDay(null);
  };

  const handleAddNew = () => {
    setSelectedAppointment({ date: format(currentDate, 'yyyy-MM-dd') });
    setDetailMode('add');
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedAppointment(null);
  };

  const cellMinHeight = isMobile ? 52 : isTablet ? 70 : 90;

  return (
    <>
      <CalendarContainer>
        <CalendarHeader>
          <IconButton onClick={handlePrevMonth} size={isMobile ? 'small' : 'medium'}>
            <i className="fa fa-chevron-left" />
          </IconButton>

          <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
            {format(currentDate, isMobile ? 'MMM yyyy' : 'MMMM yyyy')}
          </Typography>

          <IconButton onClick={handleNextMonth} size={isMobile ? 'small' : 'medium'}>
            <i className="fa fa-chevron-right" />
          </IconButton>
        </CalendarHeader>

        {/* Single grid: weekday headers + empty offset cells + day cells */}
        <DayGrid>
          {/* Weekday headers */}
          {WEEKDAYS.map((day) => (
            <Box
              key={day}
              sx={{
                textAlign: 'center',
                py: 1,
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {isMobile ? day[0] : day}
            </Box>
          ))}

          {/* Empty offset cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <Box key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const today = isToday(day);
            const eventCount = getEventCountForDay(day);
            const hasEvents = eventCount > 0;

            return (
              <Box
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                sx={{
                  padding: isMobile ? 0.5 : 1,
                  textAlign: 'center',
                  borderRadius: 1,
                  backgroundColor: today ? 'primary.main' : 'background.default',
                  color: today ? 'primary.contrastText' : 'text.primary',
                  cursor: hasEvents ? 'pointer' : 'default',
                  minHeight: cellMinHeight,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'background-color 0.15s ease',
                  '&:hover': hasEvents ? {
                    backgroundColor: today ? 'primary.dark' : 'action.hover',
                  } : {},
                }}
              >
                <Typography
                  sx={{
                    fontWeight: today ? 700 : 500,
                    fontSize: isMobile ? '0.8rem' : '1rem',
                    lineHeight: 1,
                  }}
                >
                  {format(day, 'd')}
                </Typography>

                {hasEvents && (
                  <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isMobile ? (
                      <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: today ? 'primary.contrastText' : 'primary.main',
                      }} />
                    ) : (
                      <Typography variant="button" sx={{
                        color: today ? 'inherit' : 'primary.main',
                        fontSize: '0.65rem',
                        fontWeight: 500,
                      }}>
                        {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </DayGrid>
      </CalendarContainer>

      {/* FAB */}
      {modes?.includes('add') && (
        <Fab
          color="primary"
          aria-label="add"
          size={isMobile ? 'medium' : 'large'}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24, md: 40 },
            right: { xs: 16, sm: 24, md: 40 },
            zIndex: 1200,
          }}
          onClick={handleAddNew}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Hourly View Modal */}
      <StyledDialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogHeader>
          <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight={600}>
            {recordType === 'appointments' ? 'Appointments' : 'Schedule'}
            {selectedDay && ` – ${format(selectedDay, isMobile ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')}`}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={handleCloseModal}>
            <CloseIcon />
          </IconButton>
        </DialogHeader>
        <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
          {selectedDay && (
            recordType === 'appointments' ? (
              <AppointmentsHourlyView
                data={visibleEvents}
                selectedDate={selectedDay}
                appConfig={appConfig}
                name="Appointments"
                modes={modes}
                onDataRefresh={() => window.location.reload()}
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
            )
          )}
        </DialogContent>
      </StyledDialog>

      {/* Add New Detail Modal */}
      <ListItemDetail
        open={detailModalOpen}
        onClose={handleCloseDetail}
        item={selectedAppointment}
        fields={calendarFields}
        name={recordType}
        mode={detailMode}
        modes={modes}
        recordType={recordType}
      />
    </>
  );
}