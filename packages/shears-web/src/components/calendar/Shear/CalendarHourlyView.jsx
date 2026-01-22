// src/components/CalendarHourlyViewWeb.jsx
import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import {
  Box,
  Typography,
  IconButton,
  Fab,
  Divider,
  useTheme,
} from "@mui/material";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

import { getRecords, deleteRecord } from "shears-shared/src/Services/Authentication";
import { mapFields } from "shears-shared/src/config/fieldMapper";
import formatTime12 from "shears-shared/src/utils/stringHelpers";
import { AuthContext } from "../../../context/AuthContext";

// Import the detail component (adjust path if needed)
import ListItemDetail from "../../BaseUI/ListItemDetail";  // Adjust path if needed

const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 70;
const DATE_BUTTON_WIDTH = 72;

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
  if (!timeStr) return 0;
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

export default function CalendarHourlyViewWeb({ data = [], appConfig, recordType = "calendar" }) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  const scrollRef = useRef(null);
  const dateScrollRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [localData, setLocalData] = useState(data);

  // Modal control states (same pattern as CalendarListViewComponent)
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailMode, setDetailMode] = useState("read");

  const dateRange = useMemo(() => generateDateRange(new Date()), []);

  useEffect(() => setLocalData(data), [data]);

  // Fetch records
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await getRecords({
          recordType,
          token,
          subscriberId: user.subscriberId,
          userId: user.userId,
        });
        setLocalData(resp || []);
      } catch (err) {
        console.error("Failed to fetch records:", err);
      }
    };
    fetchData();
  }, [token, user, recordType]);

  // Scroll to current time on date change
  useEffect(() => {
    const now = new Date();
    const y = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: y, behavior: "smooth" });
    }, 300);
  }, [selectedDate]);

  // Auto-scroll date selector to selected date
  useEffect(() => {
    if (!dateScrollRef.current) return;
    const selectedIndex = dateRange.findIndex(
      (d) => d.toDateString() === selectedDate.toDateString()
    );
    if (selectedIndex === -1) return;
    const scrollX = Math.max(0, selectedIndex * DATE_BUTTON_WIDTH - window.innerWidth / 2 + DATE_BUTTON_WIDTH / 2);
    dateScrollRef.current.scrollTo({ left: scrollX, behavior: "smooth" });
  }, [selectedDate, dateRange]);

  const dayAppointments = useMemo(() => {
    const key = selectedDate.toISOString().split("T")[0];

    return localData
      .map((item) => {
        const fd = item.fieldsData || {};
        const date = parseYMD(fd.date);
        if (!date) return null;

        const itemKey = date.toISOString().split("T")[0];
        if (itemKey !== key) return null;

        const payment = fd.payment || {};
        const status = (payment.status || "").toUpperCase();

        return {
          _id: item._id,
          contactName: fd.contact?.name ?? "—",
          serviceName: Array.isArray(fd.service)
            ? fd.service.map((s) => s.name || s.serviceName).join(", ")
            : fd.service?.name ?? "—",
          startTime: fd.time?.startTime,
          endTime: fd.time?.endTime,
          amount: payment.amount,
          status,
          flatItem: {
            ...fd,
            _id: item._id,
            recordType: item.recordType,
            subscriberId: item.subscriberId,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [localData, selectedDate]);

  const changeDay = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID": return "#27ae60";
      case "PENDING": return "#f1c40f";
      case "CANCELED":
      case "REFUNDED":
      case "CANCELLED": return "#e74c3c";
      default: return theme.palette.text.secondary;
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this appointment?")) return;
    deleteRecord(id, token)
      .then(() => {
        setLocalData((prev) => prev.filter((i) => i._id !== id));
      })
      .catch((err) => console.error("Delete failed:", err));
  };

  // Open detail modal (same pattern as CalendarListViewComponent)
  const openDetail = (appt, mode = "read") => {
    setSelectedItem(appt.flatItem || appt); // for add mode we pass partial item
    setDetailMode(mode);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedItem(null);
    // Optional: refresh after close
    // fetchData();
  };

  const renderDateButton = (d, idx) => {
    const isSelected = d.toDateString() === selectedDate.toDateString();
    const isToday = d.toDateString() === new Date().toDateString();

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
          mx: 0.5,
          borderRadius: "50%",
          cursor: "pointer",
          bgcolor: isSelected ? "primary.main" : "transparent",
          color: isSelected ? "primary.contrastText" : isToday ? "primary.main" : "text.primary",
          border: isToday && !isSelected ? `2px solid ${theme.palette.primary.main}` : "none",
          fontWeight: isToday ? 700 : 500,
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.7 }}>
          {d.toLocaleDateString(undefined, { month: "short" })}
        </Typography>
        <Typography variant="h6" sx={{ fontSize: 20, fontWeight: 600 }}>
          {d.getDate()}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 10 }}>
          {d.toLocaleDateString(undefined, { weekday: "short" })}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          gap: 1.5,
          flexShrink: 0,
          bgcolor: "background.paper",
        }}
      >
        <IconButton onClick={() => changeDay(-1)}>
          <ArrowBackIosIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <Typography variant="h6">
            {formatDateHeader(selectedDate)}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowDateSelector((prev) => !prev)}
            sx={{ color: "primary.main" }}
          >
            {showDateSelector ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Box>

        <IconButton onClick={() => changeDay(1)}>
          <ArrowForwardIosIcon />
        </IconButton>

        <IconButton onClick={() => setSelectedDate(new Date())} title="Today">
          <CalendarTodayIcon />
        </IconButton>
      </Box>

      {/* Collapsible date selector */}
      {showDateSelector && (
        <Box
          ref={dateScrollRef}
          sx={{
            display: "flex",
            overflowX: "auto",
            p: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            flexShrink: 0,
            whiteSpace: "nowrap",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {dateRange.map(renderDateButton)}
        </Box>
      )}

      {/* Main scrollable grid */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          position: "relative",
          bgcolor: "background.default",
        }}
      >
        {/* Time grid lines */}
        {QUARTER_HOURS.map(({ hour, minutes, index }) => {
          const isHour = minutes === 0;
          const now = new Date();
          const isCurrent = now.getHours() === hour && (isHour || Math.floor(now.getMinutes() / 15) * 15 === minutes);

          return (
            <Box
              key={index}
              sx={{
                height: HOUR_HEIGHT / 4,
                display: "flex",
                position: "relative",
                borderBottom: isHour ? "1px solid" : "0.5px dashed",
                borderColor: isCurrent ? "primary.main" : "divider",
                bgcolor: isCurrent ? "action.hover" : "transparent",
                opacity: isHour ? 1 : 0.6,
              }}
            >
              {isHour && (
                <Typography
                  sx={{
                    position: "absolute",
                    left: 0,
                    width: TIME_COLUMN_WIDTH,
                    textAlign: "right",
                    pr: 1.5,
                    pt: 0.5,
                    fontSize: 12,
                    fontWeight: now.getHours() === hour ? 700 : 500,
                    color: now.getHours() === hour ? "primary.main" : "text.secondary",
                  }}
                >
                  {formatTime12(`${hour.toString().padStart(2, "0")}:00`)}
                </Typography>
              )}

              {!isHour && (
                <Typography
                  sx={{
                    position: "absolute",
                    left: TIME_COLUMN_WIDTH - 20,
                    fontSize: 10,
                    color: "text.disabled",
                    opacity: 0.6,
                  }}
                >
                  {minutes}
                </Typography>
              )}
            </Box>
          );
        })}

        {/* Appointments overlay */}
        <Box sx={{ position: "absolute", top: 0, left: TIME_COLUMN_WIDTH, right: 16, bottom: 0 }}>
          {dayAppointments.map((appt) => {
            const { top, height } = calculatePosition(appt.startTime, appt.endTime);
            const color = getStatusColor(appt.status);
            const isCompact = height < 100;

            return (
              <Box
                key={appt._id}
                onClick={() => openDetail(appt)}  // ← Opens detail modal on click
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleDelete(appt._id);
                }}
                sx={{
                  position: "absolute",
                  top,
                  left: 12,
                  right: 12,
                  height,
                  bgcolor: `${color}15`,
                  borderLeft: `4px solid ${color}`,
                  borderRadius: 2,
                  p: isCompact ? 1 : 1.5,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  boxShadow: 1,
                  transition: "all 0.2s",
                  "&:hover": { boxShadow: 3, transform: "translateY(-1px)" },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color, fontSize: isCompact ? 11 : 13 }}
                >
                  {formatTime12(appt.startTime)}
                  {appt.endTime && ` – ${formatTime12(appt.endTime)}`}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, fontSize: isCompact ? 13 : 15 }}
                >
                  {appt.contactName}
                </Typography>

                {(!isCompact || !appt.amount) && appt.serviceName !== "—" && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: isCompact ? 11 : 13 }}>
                    {appt.serviceName}
                  </Typography>
                )}

                {appt.amount && (
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: isCompact ? 11 : 13 }}
                  >
                    {isCompact && appt.serviceName !== "—" ? `${appt.serviceName} • ` : ""}
                    {appt.amount}
                  </Typography>
                )}
              </Box>
            );
          })}

          {dayAppointments.length === 0 && (
            <Box
              sx={{
                position: "absolute",
                top: "30%",
                left: 0,
                right: 0,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
              <Typography variant="h6">No appointments scheduled</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* FAB - Add new */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() =>
          openDetail(
            { flatItem: { date: selectedDate.toISOString().split("T")[0] } },
            "add"
          )
        }
      >
        <AddIcon />
      </Fab>

      {/* Detail Modal - controlled like in CalendarListViewComponent */}
      <ListItemDetail
        open={detailOpen}
        onClose={closeDetail}
        item={selectedItem || {}}
        fields={mapFields(
          appConfig?.mainNavigation?.find((n) => n.name?.toLowerCase() === "calendar")?.fields || []
        )}
        name="Calendar"
        mode={detailMode}
        recordType={recordType}
        appConfig={appConfig}
      />
    </Box>
  );
}