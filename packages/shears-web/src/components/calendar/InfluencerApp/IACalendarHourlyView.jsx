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
  Fab,
  useTheme,
} from "@mui/material";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";

import { DateTime } from "luxon";
import { canSeeCalendarEvent, getRecords } from "shears-shared/src/Services/Authentication";
import { mapFields } from "shears-shared/src/config/fieldMapper";
import formatTime12 from "shears-shared/src/utils/stringHelpers";
import { AuthContext } from "../../../context/AuthContext";
import ListItemDetail from "../../BaseUI/ListItemDetail";

/* ======================================================
   CONSTANTS
====================================================== */
const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 70;
const DATE_BUTTON_WIDTH = 64;
const DAY_HEIGHT = HOUR_HEIGHT * 24;
const MIN_EVENT_WIDTH = 200;

const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => ({
  hour: Math.floor(i / 4),
  minutes: (i % 4) * 15,
  index: i,
}));

/* ======================================================
   HELPERS
====================================================== */
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const calculatePosition = (start, end) => {
  const s = timeToMinutes(start);
  const e = end ? timeToMinutes(end) : s + 30;
  return {
    top: (s / 60) * HOUR_HEIGHT,
    height: Math.max(((e - s) / 60) * HOUR_HEIGHT, 30),
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
export default function IACalendarHourlyViewWeb({
  data = [],
  appConfig,
  name = "Calendar",
  modes = ["read", "add", "edit", "delete"],
  onDataRefresh,
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  const isDark = theme.palette.mode === "dark";

  const scrollRef = useRef(null);
  const dateScrollRef = useRef(null);
  const horizontalScrollRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [localData, setLocalData] = useState(data);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMode, setDetailMode] = useState("read");

  // Theme-aware colors
  const eventBg = isDark ? `${theme.palette.primary.dark}40` : "#DBEAFE";
  const eventBgHover = isDark ? `${theme.palette.primary.dark}70` : "#BFDBFE";
  const eventBgCont = isDark ? `${theme.palette.primary.dark}28` : "#EFF6FF";
  const eventBorder = theme.palette.primary.main;

  const scrollbarTrack = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const scrollbarThumb = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)";
  const scrollbarThumbHover = isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.28)";

  const scrollbarSx = {
    "&::-webkit-scrollbar": { height: 8, width: 8 },
    "&::-webkit-scrollbar-track": { bgcolor: scrollbarTrack, borderRadius: 4 },
    "&::-webkit-scrollbar-thumb": {
      bgcolor: scrollbarThumb,
      borderRadius: 4,
      "&:hover": { bgcolor: scrollbarThumbHover },
    },
  };

  // Data fetching
  useEffect(() => {
    let active = true;
    const load = async () => {
      const res = await getRecords({
        recordType: "calendar",
        token,
        subscriberId: user?.subscriberId,
      });
      if (active) setLocalData(res || []);
    };
    load();
    return () => { active = false; };
  }, [token, user?.subscriberId]);

  const handleCloseDetail = async () => {
    setDetailModalOpen(false);
    setSelectedAppointment(null);
    setDetailMode("read");
    if (onDataRefresh) {
      onDataRefresh();
    } else {
      const res = await getRecords({
        recordType: "calendar",
        token,
        subscriberId: user?.subscriberId,
      });
      setLocalData(res || []);
    }
  };

  // Date logic
  const dateRange = useMemo(() => generateDateRange(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!showDateSelector || !dateScrollRef.current) return;
    const idx = dateRange.findIndex(d => d.toDateString() === selectedDate.toDateString());
    if (idx === -1) return;
    const targetX = idx * DATE_BUTTON_WIDTH - window.innerWidth / 2 + DATE_BUTTON_WIDTH / 2;
    requestAnimationFrame(() => {
      dateScrollRef.current?.scrollTo({ left: Math.max(0, targetX), behavior: "smooth" });
    });
  }, [showDateSelector, selectedDate, dateRange]);

  /* ------------------------------------------------------------
     Normalize ALL records upfront so overnight continuation
     pieces are available when the user navigates to the next day.

     KEY FIX: detect overnight by comparing raw HH:mm minutes,
     NOT by comparing Luxon ISO dates — because the raw end time
     (e.g. "03:30") is stored against the same date string as the
     start (e.g. "21:00"), so Luxon would parse both on the same
     date and never fire the overnight branch.
  ------------------------------------------------------------ */
  const allNormalized = useMemo(() => {
    if (!user) return [];
    const out = [];

    localData.forEach((item) => {
      if (!canSeeCalendarEvent(item, user)) return;
      const fd = item.fieldsData || {};
      if (!fd.date || !fd.timeZoneTime?.start) return;

      const rawStart = fd.timeZoneTime.start;       // e.g. "21:00"
      const rawEnd   = fd.timeZoneTime.end;         // e.g. "03:30"
      const tz       = fd.timeZoneTime.timezone || "UTC";

      const startLocal = DateTime.fromISO(`${fd.date}T${rawStart}`, { zone: tz })
        .setZone(DateTime.local().zoneName);

      // Build end DateTime correctly.
      // If rawEnd minutes <= rawStart minutes → end is on the next calendar day.
      let endLocal;
      if (rawEnd) {
        const crossesMidnight = timeToMinutes(rawEnd) <= timeToMinutes(rawStart);
        endLocal = DateTime.fromISO(`${fd.date}T${rawEnd}`, { zone: tz });
        if (crossesMidnight) endLocal = endLocal.plus({ days: 1 });
        endLocal = endLocal.setZone(DateTime.local().zoneName);
      } else {
        endLocal = startLocal.plus({ minutes: 30 });
      }

      const startISO  = startLocal.toISODate();
      const startTime = startLocal.toFormat("HH:mm");
      const endTime   = endLocal.toFormat("HH:mm");

      // Now that endLocal has the correct date, this comparison is reliable
      const isOvernight = endLocal.toISODate() !== startLocal.toISODate();

      const base = {
        _id: item._id,
        startDay: startISO,
        startTime,
        endTime,
        contactName: fd.assignedInfluencer?.fullName ?? fd.influencerName?.name ?? "—",
        serviceName: fd.platforms?.map(p => p.platform).join(", ") ?? "—",
        flatItem: {
          ...fd,
          _id: item._id,
          recordType: item.recordType,
          subscriberId: item.subscriberId,
        },
        flashSales: fd.flashSales || "",
      };

      if (isOvernight) {
        // Part 1 — original day: startTime → 23:59
        out.push({
          ...base,
          endTime: "23:59",
          isContinuation: false,
          continuesNextDay: true,
          originalStartTime: startTime,
          originalEndTime: endTime,
        });
        // Part 2 — next calendar day: 00:00 → actual endTime
        out.push({
          ...base,
          _id: `${item._id}_cont`,
          startDay: startLocal.plus({ days: 1 }).toISODate(),
          startTime: "00:00",
          isContinuation: true,
          continuesNextDay: false,
          originalStartTime: startTime,
          originalEndTime: endTime,
        });
      } else {
        out.push(base);
      }
    });

    return out;
  }, [localData, user]);

  // Filter to selected day
  const dayAppointments = useMemo(() => {
    const target = DateTime.fromJSDate(selectedDate).toISODate();
    const filtered = allNormalized.filter(e => e.startDay === target);
    return layoutOverlaps(filtered);
  }, [allNormalized, selectedDate]);

  const contentWidth = useMemo(() => {
    if (dayAppointments.length === 0) return window.innerWidth - TIME_COLUMN_WIDTH - 32;
    const maxCols = Math.max(...dayAppointments.map(a => a._cols), 1);
    return Math.max(maxCols * MIN_EVENT_WIDTH, window.innerWidth - TIME_COLUMN_WIDTH - 32);
  }, [dayAppointments]);

  // Auto-scroll to first event or ~now
  useEffect(() => {
    const targetHour = dayAppointments.length > 0
      ? Math.floor(timeToMinutes(dayAppointments[0].startTime) / 60) - 2
      : new Date().getHours() - 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: Math.max(0, targetHour * HOUR_HEIGHT), behavior: "smooth" });
    }, 300);
  }, [dayAppointments]);

  // Calendar fields config
  const calendarFields = useMemo(() => {
    const nav = appConfig?.mainNavigation?.find(r => r.name?.toLowerCase() === "calendar");
    const raw = nav?.fields ?? [
      { field: "date", label: "Date", input: "date" },
      {
        field: "time", label: "Time", input: "timeTimezone",
        objectConfig: [
          { field: "start", label: "Start Time", input: "time" },
          { field: "end", label: "End Time", input: "time" },
          { field: "timezone", label: "Timezone", input: "text" },
        ],
      },
      { field: "assignedInfluencer", label: "Contact", input: "linkSelect", inputConfig: { recordType: "influencers" } },
      {
        field: "platforms", label: "Platforms", input: "array",
        arrayConfig: { object: [{ field: "platform", label: "Platform", input: "text" }] },
      },
    ];
    return mapFields(raw);
  }, [appConfig]);

  const handleAppointmentClick = (appt) => {
    setSelectedAppointment(appt.flatItem);
    setDetailMode("read");
    setDetailModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAppointment({
      date: DateTime.fromJSDate(selectedDate).toISODate(),
      time: { start: "", end: "", timezone: DateTime.local().zoneName },
    });
    setDetailMode("add");
    setDetailModalOpen(true);
  };

  const renderNowLine = () => {
    const now = DateTime.local();
    if (!now.hasSame(DateTime.fromJSDate(selectedDate), "day")) return null;
    const top = ((now.hour * 60 + now.minute) / 60) * HOUR_HEIGHT;
    return (
      <Box sx={{ position: "absolute", top, left: 0, right: 0, height: 2, bgcolor: "error.main", zIndex: 1000 }}>
        <Box sx={{ width: 10, height: 10, bgcolor: "error.main", borderRadius: "50%", position: "absolute", left: -4, top: -4, boxShadow: 1 }} />
      </Box>
    );
  };

  // ──────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.default", color: "text.primary" }}>

      {/* HEADER */}
      <Box sx={{ display: "flex", alignItems: "center", p: 2, gap: 1, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", zIndex: 20 }}>
        <IconButton onClick={() => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; })}>
          <ArrowBackIosIcon />
        </IconButton>

        <Box onClick={() => setShowDateSelector(v => !v)} sx={{ flexGrow: 1, textAlign: "center", cursor: "pointer" }}>
          <Typography variant="h6" fontWeight={600}>
            {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </Typography>
        </Box>

        <IconButton onClick={() => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; })}>
          <ArrowForwardIosIcon />
        </IconButton>

        <IconButton onClick={() => setShowDateSelector(v => !v)}>
          {showDateSelector ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>

      {/* DATE SELECTOR DROPDOWN */}
      {showDateSelector && (
        <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", boxShadow: theme.shadows[6], py: 2, px: 2, maxHeight: 120, minHeight: 120, overflow: "visible" }}>
          <Box
            ref={dateScrollRef}
            sx={{
              display: "flex", overflowX: "auto", gap: 2, pb: 2, pt: 0.5,
              scrollbarWidth: "thin", msOverflowStyle: "none",
              ...scrollbarSx,
            }}
          >
            {dateRange.map((d, i) => {
              const selected = d.toDateString() === selectedDate.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <Box
                  key={i}
                  onClick={() => { setSelectedDate(new Date(d)); setShowDateSelector(false); }}
                  sx={{
                    minWidth: DATE_BUTTON_WIDTH, height: DATE_BUTTON_WIDTH, borderRadius: "50%",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                    bgcolor: selected ? "primary.main" : isToday ? `${theme.palette.primary.main}${isDark ? "22" : "11"}` : "transparent",
                    color: selected ? "primary.contrastText" : isToday ? "primary.main" : "text.primary",
                    border: isToday && !selected ? `2px solid ${theme.palette.primary.main}` : "2px solid transparent",
                    transition: "all 0.18s ease",
                    "&:hover": { bgcolor: selected ? theme.palette.primary.dark : `${theme.palette.primary.main}${isDark ? "33" : "22"}`, transform: "scale(1.08)" },
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4, mb: 0.25 }}>
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </Typography>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                    {d.getDate()}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* MAIN CALENDAR GRID */}
      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: "auto", position: "relative", bgcolor: "background.default" }}>
        <Box sx={{ height: DAY_HEIGHT, minHeight: DAY_HEIGHT, display: "flex", position: "relative", bgcolor: "background.default" }}>

          {/* FIXED TIME COLUMN */}
          <Box sx={{ width: TIME_COLUMN_WIDTH, flexShrink: 0, position: "relative", bgcolor: "background.paper", borderRight: 1, borderColor: "divider", zIndex: 15 }}>
            {QUARTER_HOURS.map(({ hour, minutes, index }) => (
              <Box key={index} sx={{ height: HOUR_HEIGHT / 4, position: "relative" }}>
                {minutes === 0 && (
                  <Typography sx={{ position: "absolute", right: 8, top: 2, width: TIME_COLUMN_WIDTH - 8, textAlign: "right", fontSize: 12, fontWeight: 600, opacity: 0.7, color: "text.secondary", pointerEvents: "none" }}>
                    {formatTime12(`${hour.toString().padStart(2, "0")}:00`)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {/* HORIZONTAL SCROLL + EVENTS */}
          <Box ref={horizontalScrollRef} sx={{ flexGrow: 1, overflowX: "auto", position: "relative", bgcolor: "transparent", ...scrollbarSx }}>
            <Box sx={{ width: contentWidth, height: DAY_HEIGHT, position: "relative", bgcolor: "background.default" }}>

              {/* GRID LINES */}
              {QUARTER_HOURS.map(({ index, minutes }) => (
                <Divider
                  key={index}
                  sx={{
                    position: "absolute", top: (index * HOUR_HEIGHT) / 4, left: 0, right: 0,
                    borderColor: "divider",
                    opacity: minutes === 0 ? (isDark ? 0.4 : 0.65) : (isDark ? 0.12 : 0.22),
                  }}
                />
              ))}

              {renderNowLine()}

              {/* EVENTS */}
              {dayAppointments.map((appt) => {
                const { top, height } = calculatePosition(appt.startTime, appt.endTime);
                const colWidth = contentWidth / appt._cols;

                const displayStart = appt.isContinuation ? appt.originalStartTime : appt.startTime;
                const displayEnd   = appt.continuesNextDay ? appt.originalEndTime : appt.endTime;

                return (
                  <Box
                    key={appt._id}
                    onClick={() => handleAppointmentClick(appt)}
                    sx={{
                      position: "absolute",
                      top,
                      left: appt._col * colWidth,
                      width: colWidth - 8,
                      height,
                      bgcolor: appt.isContinuation ? eventBgCont : eventBg,
                      borderLeft: `4px solid ${eventBorder}`,
                      borderStyle: appt.isContinuation ? "dashed" : "solid",
                      borderRadius: 1.5,
                      p: 1.5,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      zIndex: 10,
                      "&:hover": { bgcolor: eventBgHover, transform: "scale(1.015)", boxShadow: theme.shadows[4] },
                    }}
                  >
                    {/* ↪ cont'd badge */}
                    {appt.isContinuation && (
                      <Box sx={{ display: "inline-flex", alignItems: "center", bgcolor: `${theme.palette.primary.main}18`, borderRadius: 0.75, px: 0.75, py: 0.25, mb: 0.5 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "primary.main", lineHeight: 1.2 }}>
                          ↪ cont'd from {formatTime12(appt.originalStartTime)}
                        </Typography>
                      </Box>
                    )}

                    {/* ↷ continues past midnight */}
                    {appt.continuesNextDay && (
                      <Typography sx={{ fontSize: 10, fontWeight: 500, color: "primary.main", fontStyle: "italic", mb: 0.25, display: "block" }}>
                        ↷ continues past midnight
                      </Typography>
                    )}

                    <Typography fontSize={12} fontWeight={700} color="text.primary">
                      {formatTime12(displayStart)} – {formatTime12(displayEnd)}
                    </Typography>

                    <Typography fontWeight={600} noWrap color="text.primary">
                      {appt.contactName}
                    </Typography>

                    <Typography variant="caption" noWrap color="text.secondary">
                      {appt.serviceName}
                    </Typography>

                    {appt.flashSales && (
                      <Typography variant="caption" noWrap sx={{ fontWeight: "bold", color: appt.flashSales === true ? "success.main" : "warning.main", mt: 0.5, display: "block" }}>
                        {appt.flashSales === true ? "Flash Sales Set" : "Flash Sales Pending"}
                      </Typography>
                    )}

                    {appt.flatItem?.products?.length > 0 && (
                      <Box sx={{ mt: 1, pt: 0.5, borderTop: 1, borderColor: "divider" }}>
                        {(() => {
                          const extraOffset = (appt.isContinuation ? 22 : 0) + (appt.continuesNextDay ? 18 : 0);
                          const maxLines = Math.max(0, Math.floor((height - 80 - extraOffset) / 17));
                          const shown = appt.flatItem.products.slice(0, maxLines);
                          const more = appt.flatItem.products.length - shown.length;
                          return (
                            <>
                              {shown.map((prod, idx) => (
                                <Typography key={prod._id || idx} variant="caption" sx={{ display: "block", lineHeight: 1.4, color: "text.primary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  • {prod.productName || prod.name || "Product"}
                                </Typography>
                              ))}
                              {more > 0 && (
                                <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 500, mt: 0.5 }}>
                                  +{more} more
                                </Typography>
                              )}
                            </>
                          );
                        })()}
                      </Box>
                    )}
                  </Box>
                );
              })}

              {/* Empty state */}
              {dayAppointments.length === 0 && (
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <Typography variant="body1" color="text.secondary" fontStyle="italic">
                    No events scheduled for this day
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ADD FAB */}
      {modes.includes("add") && (
        <Fab color="primary" aria-label="add event" sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1300 }} onClick={handleAddNew}>
          <AddIcon />
        </Fab>
      )}

      {/* DETAIL MODAL */}
      <ListItemDetail
        open={detailModalOpen}
        onClose={handleCloseDetail}
        item={selectedAppointment}
        fields={calendarFields}
        name={name}
        mode={detailMode}
        modes={modes}
        recordType="calendar"
      />
    </Box>
  );
}