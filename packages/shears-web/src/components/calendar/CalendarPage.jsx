// src/pages/CalendarPage.jsx

import React, { useState, useMemo, useEffect, useContext } from 'react';
import CalendarView from './CalendarView';
import CalendarListView from '../calendar/Shear/CalendarListView';
import { getRecords } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';
import { DateTime } from 'luxon';

export default function CalendarPage({
  appConfig,
  fields,
  modes,
  recordType
}) {
  /* --------------------------------------------------------------
     STATE
  -------------------------------------------------------------- */

  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(false);
const [refreshKey, setRefreshKey] = useState(0);
  const { token, user } = useContext(AuthContext);

  /* --------------------------------------------------------------
     DATE RANGE (BASED ON currentMonth ONLY)
  -------------------------------------------------------------- */

  const { startDate, endDate } = useMemo(() => {
    const dt = DateTime.fromJSDate(currentMonth);

    return {
      startDate: dt.startOf('month').toISODate(),
      endDate: dt.endOf('month').toISODate(),
    };
  }, [currentMonth]);

  /* --------------------------------------------------------------
     FETCH RECORDS WHEN MONTH CHANGES
  -------------------------------------------------------------- */

  useEffect(() => {
    if (!token || !user?.subscriberId) return;

    let active = true;

    const load = async () => {
      try {
        setLoading(true);

        const res = await getRecords({
          recordType,
          token,
          subscriberId: user.subscriberId,
          startDate,
          endDate,
        });

        console.log('calendar range fetch:', startDate, endDate);

        if (active) {
          setLocalData(res || []);
        }
      } catch (err) {
        console.error('Calendar fetch error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [token, user?.subscriberId, recordType, startDate, endDate, refreshKey]);

  /* --------------------------------------------------------------
     FILTER EVENTS FOR SELECTED DAY
  -------------------------------------------------------------- */
const refreshMonth = () => {
  setRefreshKey((prev) => prev + 1);
};
  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];

    const ymd = DateTime.fromJSDate(selectedDate).toISODate();

    return localData.filter(
      (item) => item.fieldsData?.date === ymd
    );
  }, [localData, selectedDate]);

  /* --------------------------------------------------------------
     VIEW SWITCH
  -------------------------------------------------------------- */

  if (selectedDate) {
    return (
      <CalendarListView
        data={dayEvents}
        backButton
        appConfig={appConfig}
        setSelectedDate={setSelectedDate}
        fields={fields}
        name="Calendar"
        header
        onRefresh={() => {
          // Re-trigger fetch for same month
          setCurrentMonth(new Date(currentMonth));
        }}
        extraHeader={
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              marginBottom: 16,
              padding: '8px 14px',
              background: '#ddd',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ← Back to Calendar
          </button>
        }
      />
    );
  }

  /* --------------------------------------------------------------
     DEFAULT: MONTH VIEW
  -------------------------------------------------------------- */

  return (
    <CalendarView
      events={localData}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      onDayClick={(date) => setSelectedDate(date)}
      onRefreshMonth={refreshMonth}   // 👈 NEW
      appConfig={appConfig}
      modes={modes}
      recordType={recordType}
      loading={loading}
    />
  );
}