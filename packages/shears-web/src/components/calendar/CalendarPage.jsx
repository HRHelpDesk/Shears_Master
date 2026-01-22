// src/pages/CalendarPage.jsx
import React, { useState, useMemo, useEffect, useContext } from 'react';
import CalendarView from './CalendarView';
import CalendarListView from '../calendar/Shear/CalendarListView';
import { getRecords } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';

export default function CalendarPage({ data = [], appConfig, fields, modes, recordType }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [localData, setLocalData] = useState(data);
  const { token, user } = useContext(AuthContext);
  useEffect(() => {
    let active = true;

    const load = async () => {
      const res = await getRecords({
        recordType: recordType,
        token,
        subscriberId: user.subscriberId,
      });
      console.log("calendar records:", res);
      if (active) setLocalData(res || []);
    };

    load();
    return () => (active = false);
  }, [token, user.subscriberId]);
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
      events={localData}
      onDayClick={(date) => setSelectedDate(date)}
      appConfig={appConfig}
      modes={modes}
      recordType={recordType}
    />
  );
}
