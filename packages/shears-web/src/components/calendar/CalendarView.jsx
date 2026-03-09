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

/* ---------------------------------- */
/* Utilities                          */
/* ---------------------------------- */

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

  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
};

/* ---------------------------------- */
/* Styled Components                  */
/* ---------------------------------- */

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

/* ---------------------------------- */
/* Main Component                     */
/* ---------------------------------- */

export default function CalendarView({
  events = [],
  appConfig,
  modes,
  recordType = 'calendar',
  currentMonth,
  setCurrentMonth,
  onRefreshMonth
}) {
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMode, setDetailMode] = useState('add');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  /* ---------------------------------- */
  /* Filter Visible Events              */
  /* ---------------------------------- */

  const visibleEvents = useMemo(() => {
    if (!user) return [];
    return events.filter((event) => canSeeCalendarEvent(event, user));
  }, [events, user]);

  /* ---------------------------------- */
  /* Field Mapping                      */
  /* ---------------------------------- */

  const calendarFields = useMemo(() => {
    const calendarNav = appConfig?.mainNavigation?.find(
      (r) => r.name?.toLowerCase() === recordType?.toLowerCase()
    );
    return mapFields(calendarNav?.fields || []);
  }, [appConfig, recordType]);

  /* ---------------------------------- */
  /* Month Calculations                 */
  /* ---------------------------------- */

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const firstDayOfMonth = start.getDay();

  const handlePrevMonth = () =>
    setCurrentMonth(subMonths(currentMonth, 1));

  const handleNextMonth = () =>
    setCurrentMonth(addMonths(currentMonth, 1));

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* ---------------------------------- */
  /* Event Counting                     */
  /* ---------------------------------- */

  const getEventCountForDay = useMemo(() => {
    const countMap = new Map();

    visibleEvents.forEach((ev) => {
      const eventDate = parseYMD(ev.fieldsData?.date);
      if (eventDate) {
        const key = eventDate.toDateString();
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    });

    return (day) => countMap.get(day.toDateString()) || 0;
  }, [visibleEvents]);

  /* ---------------------------------- */
  /* Day Click                          */
  /* ---------------------------------- */

  const handleDayClick = (day) => {
    if (getEventCountForDay(day) === 0) return;
    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
  setModalOpen(false);
  setSelectedDay(null);

  if (onRefreshMonth) {
    onRefreshMonth();   // 👈 triggers parent refetch
  }
};

  /* ---------------------------------- */
  /* Add New                            */
  /* ---------------------------------- */

  const handleAddNew = () => {
    setSelectedAppointment({
      date: format(currentMonth, 'yyyy-MM-dd'),
    });
    setDetailMode('add');
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedAppointment(null);
  };

  const cellMinHeight = isMobile ? 52 : isTablet ? 70 : 90;

  /* ---------------------------------- */
  /* Render                             */
  /* ---------------------------------- */

  return (
    <>
      <CalendarContainer>
        <CalendarHeader>
          <IconButton onClick={handlePrevMonth}>
            <i className="fa fa-chevron-left" />
          </IconButton>

          <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
            {format(currentMonth, isMobile ? 'MMM yyyy' : 'MMMM yyyy')}
          </Typography>

          <IconButton onClick={handleNextMonth}>
            <i className="fa fa-chevron-right" />
          </IconButton>
        </CalendarHeader>

        <DayGrid>
          {WEEKDAYS.map((day) => (
            <Box key={day} sx={{ textAlign: 'center', py: 1, fontWeight: 600 }}>
              {isMobile ? day[0] : day}
            </Box>
          ))}

          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <Box key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const today = isToday(day);
            const eventCount = getEventCountForDay(day);
            const hasEvents = eventCount > 0;

            return (
              <Box
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                sx={{
                  padding: 1,
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
                }}
              >
                <Typography fontWeight={today ? 700 : 500}>
                  {format(day, 'd')}
                </Typography>

                {hasEvents && (
                  <Typography variant="button" sx={{
                        color: today ? 'inherit' : 'primary.main',
                        fontSize: '0.65rem',
                        fontWeight: 500,
                      }}>
                    {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                  </Typography>
                )}
              </Box>
            );
          })}
        </DayGrid>
      </CalendarContainer>

      {modes?.includes('add') && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={handleAddNew}
        >
          <AddIcon />
        </Fab>
      )}

      <StyledDialog
        open={modalOpen}
        onClose={handleCloseModal}
        fullScreen={isMobile}
      >
        <DialogHeader>
          <Typography fontWeight={600}>
            {selectedDay &&
              format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </Typography>
          <IconButton onClick={handleCloseModal}>
            <CloseIcon />
          </IconButton>
        </DialogHeader>

        <DialogContent sx={{ p: 0 }}>
          {selectedDay &&
            (recordType === 'appointments' ? (
              <AppointmentsHourlyView
                data={visibleEvents}
                selectedDate={selectedDay}
                appConfig={appConfig}
                onDataRefresh={onRefreshMonth}
                name="Appointments"
                modes={modes}
              />
            ) : (
              <HourlyView
                data={visibleEvents}
                selectedDate={selectedDay}
                appConfig={appConfig}
                onDataRefresh={onRefreshMonth}
                name="Calendar"
                modes={modes}
              />
            ))}
        </DialogContent>
      </StyledDialog>

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