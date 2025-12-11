import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import {
  Box,
  Typography,
  IconButton,
  Fab,
  Divider,
} from "@mui/material";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";

import { getRecords } from "shears-shared/src/Services/Authentication";
import { mapFields } from "shears-shared/src/config/fieldMapper";
import formatTime12 from "shears-shared/src/utils/stringHelpers";
import { AuthContext } from "../../context/AuthContext";

const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 70;
const DATE_BUTTON_WIDTH = 60;

const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => ({
  hour: Math.floor(i / 4),
  minutes: (i % 4) * 15,
  index: i,
}));

const parseYMD = (value) => {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return new Date(value);
  return new Date(+m[1], +m[2] - 1, +m[3]);
};

const formatDateHeader = (date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const calculatePosition = (start, end) => {
  const startMin = timeToMinutes(start);
  const endMin = end ? timeToMinutes(end) : startMin + 30;

  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 80);

  return { top, height };
};

const generateDateRange = (center) => {
  const arr = [];
  for (let i = -10; i <= 10; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() + i);
    arr.push(d);
  }
  return arr;
};

export default function CalendarHourlyViewWeb({ data = [], appConfig }) {
  const { token, user } = useContext(AuthContext);
  const scrollRef = useRef(null);
  const dateScrollRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [localData, setLocalData] = useState(data);

  const dateRange = useMemo(() => generateDateRange(new Date()), []);

  useEffect(() => setLocalData(data), [data]);

  useEffect(() => {
    const fetchData = async () => {
      const resp = await getRecords({
        recordType: "calendar",
        token,
        subscriberId: user.subscriberId,
        userId: user.userId,
      });
      setLocalData(resp || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const now = new Date();
    const y = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: y, behavior: "smooth" });
    }, 300);
  }, [selectedDate]);

  const dayAppointments = useMemo(() => {
    const key = selectedDate.toISOString().split("T")[0];

    return localData
      .map((item) => {
        const fd = item.fieldsData || {};
        const date = parseYMD(fd.date);
        if (!date) return null;

        const itemKey = date.toISOString().split("T")[0];
        if (itemKey !== key) return null;

        return {
          ...fd,
          _id: item._id,
          flatItem: {
            ...fd,
            _id: item._id,
            recordType: item.recordType,
            subscriberId: item.subscriberId,
          },
          contactName: fd.contact?.name ?? "—",
          serviceName: Array.isArray(fd.service)
            ? fd.service.map((s) => s.name).join(", ")
            : fd.service?.name ?? "—",
        };
      })
      .filter(Boolean)
      .sort((a, b) =>
        timeToMinutes(a.time.startTime) - timeToMinutes(b.time.startTime)
      );
  }, [localData, selectedDate]);

  const changeDay = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  const getStatusColor = (s) => {
    switch ((s || "").toUpperCase()) {
      case "PAID":
        return "#27ae60";
      case "PENDING":
        return "#f1c40f";
      case "CANCELED":
      case "REFUNDED":
        return "#e74c3c";
      default:
        return "#888";
    }
  };

  const renderDateButton = (d, idx) => {
    const isSelected = d.toDateString() === selectedDate.toDateString();

    return (
      <Box
        key={idx}
        onClick={() => setSelectedDate(new Date(d))}
        sx={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: DATE_BUTTON_WIDTH,
          height: 70,
          mx: 1,
          borderRadius: "50%",
          cursor: "pointer",
          bgcolor: isSelected ? "primary.main" : "transparent",
          color: isSelected ? "primary.contrastText" : "text.primary",
          flexShrink: 0,
        }}
      >
        <Typography variant="caption">
          {d.toLocaleDateString(undefined, { month: "short" })}
        </Typography>
        <Typography fontWeight={600} fontSize={18}>
          {d.getDate()}
        </Typography>
        <Typography variant="caption">
          {d.toLocaleDateString(undefined, { weekday: "short" })}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          gap: 2,
          flexShrink: 0,
        }}
      >
        <IconButton onClick={() => changeDay(-1)}>
          <ArrowBackIosIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "center" }}>
          {formatDateHeader(selectedDate)}
        </Typography>

        <IconButton onClick={() => changeDay(1)}>
          <ArrowForwardIosIcon />
        </IconButton>

        <IconButton onClick={() => setShowDateSelector((prev) => !prev)}>
          {showDateSelector ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>

      {/* DATE SELECTOR (always outside scrollRef!) */}
      {showDateSelector && (
        <Box
          ref={dateScrollRef}
          sx={{
            whiteSpace: "nowrap",
            overflowX: "auto",
            p: 1.5,
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            bgcolor: "background.paper",
            flexShrink: 0,
            maxHeight: 110,
          }}
        >
          {dateRange.map(renderDateButton)}
        </Box>
      )}

      {/* SCROLLABLE GRID */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          position: "relative",
        }}
      >
        {QUARTER_HOURS.map(({ hour, minutes, index }) => {
          const isHour = minutes === 0;
          return (
            <Box
              key={index}
              sx={{
                height: HOUR_HEIGHT / 4,
                display: "flex",
                position: "relative",
                pl: `${TIME_COLUMN_WIDTH}px`,
              }}
            >
              {isHour && (
                <Typography
                  sx={{
                    position: "absolute",
                    left: 0,
                    width: TIME_COLUMN_WIDTH,
                    textAlign: "right",
                    pr: 1,
                    pt: 1,
                    opacity: 0.6,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {formatTime12(`${hour.toString().padStart(2, "0")}:00`)}
                </Typography>
              )}

              <Divider
                sx={{
                  position: "absolute",
                  top: 0,
                  left: TIME_COLUMN_WIDTH,
                  right: 0,
                  borderColor: "rgba(0,0,0,0.15)",
                  opacity: isHour ? 1 : 0.4,
                }}
              />
            </Box>
          );
        })}

        {/* APPOINTMENTS */}
        {dayAppointments.map((appt) => {
          const { top, height } = calculatePosition(
            appt.time.startTime,
            appt.time.endTime
          );

          const color = getStatusColor(appt.payment?.status);

          return (
            <Box
              key={appt._id}
              sx={{
                position: "absolute",
                top,
                left: TIME_COLUMN_WIDTH + 10,
                right: 20,
                height,
                bgcolor: `${color}22`,
                borderLeft: `4px solid ${color}`,
                borderRadius: 2,
                p: 1,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                boxShadow: 1,
              }}
              onClick={() =>
                window.navigateToDetail({
                  item: appt.flatItem,
                  name: "Calendar",
                  appConfig,
                  fields: mapFields(
                    appConfig?.mainNavigation?.find((n) => n.name === "Calendar")
                      ?.fields || []
                  ),
                })
              }
            >
              <Typography fontWeight={700} fontSize={13} color={color}>
                {formatTime12(appt.time.startTime)}
                {appt.time.endTime &&
                  ` - ${formatTime12(appt.time.endTime)}`}
              </Typography>

              <Typography fontWeight={600} fontSize={15}>
                {appt.contactName}
              </Typography>

              {appt.serviceName !== "—" && (
                <Typography fontSize={12} color="text.secondary">
                  {appt.serviceName}
                </Typography>
              )}

              {appt.payment?.amount && (
                <Typography fontWeight={600} fontSize={12}>
                  {appt.payment.amount}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {/* FAB BUTTON */}
      {/* <Fab
        color="primary"
        sx={{ position: "absolute", bottom: 24, right: 24 }}
        onClick={() =>
          window.navigateToAdd({
            date: selectedDate.toISOString().split("T")[0],
            name: "Calendar",
            appConfig,
          })
        }
      >
        <AddIcon />
      </Fab> */}
    </Box>
  );
}
