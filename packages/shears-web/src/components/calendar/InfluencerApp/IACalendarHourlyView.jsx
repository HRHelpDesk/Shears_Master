import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useContext,
} from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import { DateTime } from "luxon";
import { getRecords } from "shears-shared/src/Services/Authentication";
import { mapFields } from "shears-shared/src/config/fieldMapper";
import formatTime12 from "shears-shared/src/utils/stringHelpers";
import { AuthContext } from "../../../context/AuthContext";

/* ======================================================
   CONSTANTS
====================================================== */
const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 70;
const DATE_BUTTON_WIDTH = 60;
const DAY_HEIGHT = HOUR_HEIGHT * 24;

const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => ({
  hour: Math.floor(i / 4),
  minutes: (i % 4) * 15,
  index: i,
}));

/* ======================================================
   HELPERS
====================================================== */
const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const calculatePosition = (start, end) => {
  const s = timeToMinutes(start);
  const e = end ? timeToMinutes(end) : s + 30;
  return {
    top: (s / 60) * HOUR_HEIGHT,
    height: Math.max(((e - s) / 60) * HOUR_HEIGHT, 80),
  };
};

const generateDateRange = (center) => {
  const out = [];
  for (let i = -10; i <= 10; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() + i);
    out.push(d);
  }
  return out;
};

/* ------------------------------------------------------
   Overlap layout (same as RN)
------------------------------------------------------ */
const layoutOverlaps = (events) => {
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const cols = [];

  sorted.forEach((evt) => {
    let placed = false;
    for (const col of cols) {
      const last = col[col.length - 1];
      if (timeToMinutes(evt.startTime) >= timeToMinutes(last.endTime)) {
        col.push(evt);
        evt._col = cols.indexOf(col);
        placed = true;
        break;
      }
    }
    if (!placed) {
      evt._col = cols.length;
      cols.push([evt]);
    }
  });

  return sorted.map((e) => ({ ...e, _cols: cols.length }));
};

/* ======================================================
   COMPONENT
====================================================== */
export default function CalendarHourlyViewWeb({ data = [], appConfig }) {
  const { token, user } = useContext(AuthContext);

  const scrollRef = useRef(null);
  const dateScrollRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [localData, setLocalData] = useState(data);

  /* --------------------------------------------------
     Fetch records
  -------------------------------------------------- */
  useEffect(() => {
    let active = true;

    const load = async () => {
      const res = await getRecords({
        recordType: "calendar",
        token,
        subscriberId: user.subscriberId,
        userId: user.userId,
      });
      console.log("calendar records:", res);
      if (active) setLocalData(res || []);
    };

    load();
    return () => (active = false);
  }, [token, user.subscriberId, user.userId]);

  /* --------------------------------------------------
     Date range
  -------------------------------------------------- */
  const dateRange = useMemo(
    () => generateDateRange(selectedDate),
    [selectedDate]
  );

  /* --------------------------------------------------
     Center dropdown on open
  -------------------------------------------------- */
  useEffect(() => {
    if (!showDateSelector || !dateScrollRef.current) return;

    const idx = dateRange.findIndex(
      (d) => d.toDateString() === selectedDate.toDateString()
    );

    if (idx !== -1) {
      const x =
        idx * DATE_BUTTON_WIDTH -
        window.innerWidth / 2 +
        DATE_BUTTON_WIDTH / 2;

      requestAnimationFrame(() => {
        dateScrollRef.current.scrollTo({
          left: Math.max(0, x),
          behavior: "smooth",
        });
      });
    }
  }, [showDateSelector, selectedDate, dateRange]);

  /* --------------------------------------------------
     Normalize + filter events (timezone-safe)
  -------------------------------------------------- */
  const dayAppointments = useMemo(() => {
    const target = DateTime.fromJSDate(selectedDate).toISODate();

    const normalized = localData
      .map((item) => {
        const fd = item.fieldsData || {};
        if (!fd.date || !fd.time?.start) return null;

        const startLocal = DateTime.fromISO(
          `${fd.date}T${fd.time.start}`,
          { zone: fd.time.timezone || "UTC" }
        ).setZone(DateTime.local().zoneName);

        if (startLocal.toISODate() !== target) return null;

        const endLocal = fd.time.end
          ? DateTime.fromISO(`${fd.date}T${fd.time.end}`, {
              zone: fd.time.timezone || "UTC",
            }).setZone(DateTime.local().zoneName)
          : startLocal.plus({ minutes: 30 });

        return {
          _id: item._id,
          startTime: startLocal.toFormat("HH:mm"),
          endTime: endLocal.toFormat("HH:mm"),
          contactName:
            fd.assignedInfluencer?.fullName ??
            fd.influencerName?.name ??
            "—",
          serviceName:
            fd.platforms?.map((p) => p.platform).join(", ") ?? "—",
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

  /* --------------------------------------------------
     Scroll to now
  -------------------------------------------------- */
  useEffect(() => {
    const now = new Date();
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT),
        behavior: "smooth",
      });
    }, 300);
  }, [selectedDate]);

  /* --------------------------------------------------
     Now line
  -------------------------------------------------- */
  const renderNowLine = () => {
    const now = DateTime.local();
    if (!now.hasSame(DateTime.fromJSDate(selectedDate), "day")) return null;

    const top = ((now.hour * 60 + now.minute) / 60) * HOUR_HEIGHT;

    return (
      <Box
        sx={{
          position: "absolute",
          top,
          left: TIME_COLUMN_WIDTH,
          right: 0,
          height: 2,
          bgcolor: "red",
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            bgcolor: "red",
            borderRadius: "50%",
            position: "absolute",
            left: -4,
            top: -3,
          }}
        />
      </Box>
    );
  };

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", alignItems: "center", p: 2, gap: 1 }}>
        <IconButton
          onClick={() =>
            setSelectedDate((d) => new Date(d.setDate(d.getDate() - 1)))
          }
        >
          <ArrowBackIosIcon />
        </IconButton>

        <Box
          onClick={() => setShowDateSelector((v) => !v)}
          sx={{ flexGrow: 1, textAlign: "center", cursor: "pointer" }}
        >
          <Typography fontWeight={600}>
            {selectedDate.toDateString()}
          </Typography>
        </Box>

        <IconButton
          onClick={() =>
            setSelectedDate((d) => new Date(d.setDate(d.getDate() + 1)))
          }
        >
          <ArrowForwardIosIcon />
        </IconButton>

        <IconButton onClick={() => setShowDateSelector((v) => !v)}>
          {showDateSelector ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>

      {/* DATE DROPDOWN */}
      {showDateSelector && (
        <Box
          ref={dateScrollRef}
          sx={{
            display: "flex",
            overflowX: "auto",
            py: 1,
            borderBottom: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          {dateRange.map((d, i) => {
            const selected = d.toDateString() === selectedDate.toDateString();
            return (
              <Box
                key={i}
                onClick={() => {
                  setSelectedDate(new Date(d));
                  setShowDateSelector(false);
                }}
                sx={{
                  width: DATE_BUTTON_WIDTH,
                  height: 70,
                  borderRadius: "50%",
                  mx: 1,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: selected ? "primary.main" : "transparent",
                  color: selected ? "primary.contrastText" : "text.primary",
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </Typography>
                <Typography fontSize={20} fontWeight={600}>
                  {d.getDate()}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* GRID */}
      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: "auto", position: "relative" }}>
        <Box sx={{ height: DAY_HEIGHT, position: "relative" }}>
          {QUARTER_HOURS.map(({ hour, minutes, index }) => (
            <Box key={index} sx={{ height: HOUR_HEIGHT / 4, pl: `${TIME_COLUMN_WIDTH}px` }}>
              {minutes === 0 && (
                <Typography
                  sx={{
                    position: "absolute",
                    left: 0,
                    width: TIME_COLUMN_WIDTH,
                    textAlign: "right",
                    pr: 1,
                    opacity: 0.6,
                    fontSize: 12,
                  }}
                >
                  {formatTime12(`${hour}:00`)}
                </Typography>
              )}
              <Divider sx={{ ml: TIME_COLUMN_WIDTH }} />
            </Box>
          ))}

          {renderNowLine()}

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
                sx={{
                  position: "absolute",
                  top,
                  left: TIME_COLUMN_WIDTH + appt._col * colWidth,
                  width: colWidth - 6,
                  height,
                  bgcolor: "#DBEAFE",
                  borderLeft: "4px solid #3B82F6",
                  borderRadius: 1,
                  p: 1,
                  zIndex: 10,
                }}
              >
                <Typography fontSize={12} fontWeight={700}>
                  {formatTime12(appt.startTime)} –{" "}
                  {formatTime12(appt.endTime)}
                </Typography>
                <Typography fontWeight={600}>{appt.contactName}</Typography>
                <Typography variant="caption">{appt.serviceName}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
