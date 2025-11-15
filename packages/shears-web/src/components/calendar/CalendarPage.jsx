// src/pages/CalendarPage.jsx
import React, { useState, useMemo } from 'react';
import CalendarView from './CalendarView';
import CalendarListView from './CalendarListView';

export default function CalendarPage({ data = [], appConfig, fields }) {
  const [selectedDate, setSelectedDate] = useState(null);

  // Convert date to YMD once
  const toYMD = (d) => d.toISOString().slice(0, 10);

  // Records for the selected date
  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];

    const ymd = toYMD(selectedDate);

    return data.filter(
      (item) => item.fieldsData?.date === ymd
    );
  }, [data, selectedDate]);

  /* --------------------------------------------------------------
     VIEW SWITCH
  -------------------------------------------------------------- */
  if (selectedDate) {
    return (
      <CalendarListView
        data={dayEvents}
        backButton={true}
        appConfig={appConfig}
        setSelectedDate={setSelectedDate}
        fields={fields}
        name="Calendar"
        onRefresh={() => {}}
        header
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
      events={data}
      onDayClick={(date) => setSelectedDate(date)}
    />
  );
}
