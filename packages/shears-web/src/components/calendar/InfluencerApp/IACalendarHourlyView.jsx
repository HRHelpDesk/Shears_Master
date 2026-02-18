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
const DATE_BUTTON_WIDTH = 60;
const DAY_HEIGHT = HOUR_HEIGHT * 24;
const MIN_EVENT_WIDTH = 200; // Minimum width for each event card

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
   Overlap layout
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
export default function IACalendarHourlyViewWeb({ 
  data = [], 
  appConfig,
  name = "Calendar",
  modes = ['read', 'add', 'edit', 'delete']
}) {
  const { token, user } = useContext(AuthContext);

  const scrollRef = useRef(null);
  const dateScrollRef = useRef(null);
  const horizontalScrollRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [localData, setLocalData] = useState(data);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMode, setDetailMode] = useState("read");

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
      });
      console.log("calendar records:", res);
      if (active) setLocalData(res || []);
    };

    load();
    return () => (active = false);
  }, [token, user.subscriberId]);

  /* --------------------------------------------------
     Filter events by visibility
  -------------------------------------------------- */
  const visibleData = useMemo(() => {
    if (!user) return [];
    return localData.filter(item => canSeeCalendarEvent(item, user));
  }, [localData, user]);

  /* --------------------------------------------------
     Refresh data when modal closes
  -------------------------------------------------- */
  const handleCloseDetail = async () => {
    setDetailModalOpen(false);
    setSelectedAppointment(null);
    setDetailMode("read");

    const res = await getRecords({
      recordType: "calendar",
      token,
      subscriberId: user.subscriberId,
    });
    setLocalData(res || []);
  };

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
     Normalize + filter events
  -------------------------------------------------- */
  const dayAppointments = useMemo(() => {
    const target = DateTime.fromJSDate(selectedDate).toISODate();

    const normalized = visibleData
      .map((item) => {
        const fd = item.fieldsData || {};
        if (!fd.date || !fd.timeZoneTime?.start) return null;

        const startLocal = DateTime.fromISO(
          `${fd.date}T${fd.timeZoneTime.start}`,
          { zone: fd.timeZoneTime.timezone || "UTC" }
        ).setZone(DateTime.local().zoneName);

        if (startLocal.toISODate() !== target) return null;

        const endLocal = fd.timeZoneTime.end
          ? DateTime.fromISO(`${fd.date}T${fd.timeZoneTime.end}`, {
              zone: fd.timeZoneTime.timezone || "UTC",
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
          flashSales: fd.flashSales || "",
        };
      })
      .filter(Boolean);

    return layoutOverlaps(normalized);
  }, [visibleData, selectedDate]);

  /* ------------------------------------------------------------
     Calculate content width for horizontal scrolling
  ------------------------------------------------------------ */
  const contentWidth = useMemo(() => {
    if (dayAppointments.length === 0) {
      return window.innerWidth - TIME_COLUMN_WIDTH - 40;
    }
    
    const maxCols = Math.max(...dayAppointments.map(a => a._cols), 1);
    const calculatedWidth = maxCols * MIN_EVENT_WIDTH;
    const availableWidth = window.innerWidth - TIME_COLUMN_WIDTH - 40;
    
    // Use the larger of calculated or available width
    return Math.max(calculatedWidth, availableWidth);
  }, [dayAppointments]);

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
     Calendar fields configuration
  -------------------------------------------------- */
  const calendarFields = useMemo(() => {
    const calendarNav = appConfig?.mainNavigation?.find(
      (r) => r.name?.toLowerCase() === 'calendar'
    );

    let rawFields;

    if (calendarNav?.fields) {
      rawFields = calendarNav.fields;
    } else {
      rawFields = [
        { field: "date", label: "Date", input: "date" },
        { 
          field: "time", 
          label: "Time", 
          input: "timeTimezone",
          objectConfig: [
            { field: "start", label: "Start Time", input: "time" },
            { field: "end", label: "End Time", input: "time" },
            { field: "timezone", label: "Timezone", input: "text" }
          ]
        },
        { field: "assignedInfluencer", label: "Contact", input: "linkSelect", inputConfig: { recordType: "influencers" } },
        { 
          field: "platforms", 
          label: "Platforms", 
          input: "array",
          arrayConfig: {
            object: [
              { field: "platform", label: "Platform", input: "text" }
            ]
          }
        },
      ];
    }

    return mapFields(rawFields);
  }, [appConfig]);

  /* --------------------------------------------------
     Handlers
  -------------------------------------------------- */
  const handleAppointmentClick = (appt) => {
    setSelectedAppointment(appt.flatItem);
    setDetailMode("read");
    setDetailModalOpen(true);
  };

  const handleAddNew = () => {
    const newItem = {
      date: DateTime.fromJSDate(selectedDate).toISODate(),
      time: {
        start: "",
        end: "",
        timezone: DateTime.local().zoneName,
      },
    };

    setSelectedAppointment(newItem);
    setDetailMode("add");
    setDetailModalOpen(true);
  };

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
          left: 0,
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
            setSelectedDate((d) => {
              const newDate = new Date(d);
              newDate.setDate(newDate.getDate() - 1);
              return newDate;
            })
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
            setSelectedDate((d) => {
              const newDate = new Date(d);
              newDate.setDate(newDate.getDate() + 1);
              return newDate;
            })
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
          sx={{
            maxHeight: 140,
            overflowY: "visible",
            py: 2,
            px: 2,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
          }}
        >
          <Box
            ref={dateScrollRef}
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: 1.5,
              pb: 1,
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                bgcolor: "rgba(0,0,0,0.05)",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "rgba(0,0,0,0.2)",
                borderRadius: 4,
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.3)",
                },
              },
            }}
          >
            {dateRange.map((d, i) => {
              const selected = d.toDateString() === selectedDate.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              
              return (
                <Box
                  key={i}
                  onClick={() => {
                    setSelectedDate(new Date(d));
                    setShowDateSelector(false);
                  }}
                  sx={{
                    minWidth: 64,
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    bgcolor: selected 
                      ? "primary.main" 
                      : isToday 
                      ? "rgba(59, 130, 246, 0.1)" 
                      : "transparent",
                    color: selected 
                      ? "primary.contrastText" 
                      : isToday 
                      ? "primary.main" 
                      : "text.primary",
                    border: isToday && !selected 
                      ? "2px solid" 
                      : "2px solid transparent",
                    borderColor: isToday && !selected 
                      ? "primary.main" 
                      : "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: selected 
                        ? "primary.dark" 
                        : "rgba(59, 130, 246, 0.15)",
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: 10,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      mb: 0.25,
                    }}
                  >
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: 22, 
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {d.getDate()}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* GRID WITH HORIZONTAL SCROLL */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          position: "relative",
        }}
      >
        <Box
          sx={{
            height: DAY_HEIGHT,
            minHeight: DAY_HEIGHT,
            position: "relative",
            display: "flex",
          }}
        >
          {/* TIME COLUMN (FIXED) */}
          <Box
            sx={{
              width: TIME_COLUMN_WIDTH,
              flexShrink: 0,
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
                    position: "relative",
                  }}
                >
                  {isHour && (
                    <Typography
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 2,
                        width: TIME_COLUMN_WIDTH,
                        textAlign: "right",
                        pr: 1,
                        opacity: 0.6,
                        fontSize: 12,
                        fontWeight: 600,
                        pointerEvents: "none",
                      }}
                    >
                      {formatTime12(`${hour.toString().padStart(2, "0")}:00`)}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* HORIZONTAL SCROLL AREA FOR GRID LINES AND EVENTS */}
          <Box
            ref={horizontalScrollRef}
            sx={{
              flexGrow: 1,
              overflowX: "auto",
              position: "relative",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                bgcolor: "grey.100",
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "grey.400",
                borderRadius: 1,
                "&:hover": {
                  bgcolor: "grey.500",
                },
              },
            }}
          >
            <Box
              sx={{
                width: contentWidth,
                height: DAY_HEIGHT,
                position: "relative",
              }}
            >
              {/* GRID LINES */}
              {QUARTER_HOURS.map(({ hour, minutes, index }) => {
                const isHour = minutes === 0;

                return (
                  <Divider
                    key={index}
                    sx={{
                      position: "absolute",
                      top: (index * HOUR_HEIGHT) / 4,
                      left: 0,
                      right: 0,
                      opacity: isHour ? 0.9 : 0.4,
                    }}
                  />
                );
              })}

              {renderNowLine()}

              {/* APPOINTMENTS */}
              {dayAppointments.map((appt) => {
                const { top, height } = calculatePosition(
                  appt.startTime,
                  appt.endTime
                );

                const colWidth = contentWidth / appt._cols;

                return (
                  <Box
                    key={appt._id}
                    onClick={() => handleAppointmentClick(appt)}
                    sx={{
                      position: "absolute",
                      top,
                      left: appt._col * colWidth,
                      width: colWidth - 6,
                      height,
                      bgcolor: "#DBEAFE",
                      borderLeft: "4px solid #3B82F6",
                      borderRadius: 1,
                      p: 1,
                      zIndex: 10,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "#BFDBFE",
                        transform: "scale(1.02)",
                        boxShadow: 2,
                      },
                    }}
                  >
                    <Typography fontSize={12} fontWeight={700}>
                      {formatTime12(appt.startTime)} – {formatTime12(appt.endTime)}
                    </Typography>

                    <Typography fontWeight={600} noWrap>
                      {appt.contactName}
                    </Typography>

                    <Typography variant="caption" noWrap>
                      {appt.serviceName}
                    </Typography>
                     <br/>
                    { appt.flashSales && (
                      <Typography sx={{ color: appt.flashSales === true ? '#019506' : '#FF9800', fontWeight:'bold'  }} variant="caption" noWrap>
                      {appt.flashSales ? 'Flash Sales Set' : 'Flash Sales Pending...'}
                    </Typography>
                    )}

                    {/* PRODUCTS LIST */}
                    {appt.flatItem?.products?.length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          pt: 0.5,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        {(() => {
                          // Estimate remaining vertical space after header content
                          const usedSpace = 55; // approx: time + name + platforms + paddings
                          const availablePx = height - usedSpace;
                          const lineHeightPx = 16; // font-size ~13 + line-height + margin
                          const maxLines = Math.max(0, Math.floor(availablePx / lineHeightPx));

                          const shownProducts = appt.flatItem.products.slice(0, maxLines);
                          const remaining = appt.flatItem.products.length - shownProducts.length;

                          return (
                            <>
                              {shownProducts.map((prod, idx) => (
                                <Typography
                                  key={prod._id || idx}
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    lineHeight: 1.3,
                                    color: "text.primary",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  • {prod.productName || prod.name || "Product"}
                                </Typography>
                              ))}

                              {remaining > 0 && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "primary.main",
                                    fontWeight: 500,
                                    mt: 0.5,
                                  }}
                                >
                                  +{remaining} more
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
            </Box>
          </Box>
        </Box>
      </Box>

      {/* FAB */}
      {modes.includes('add') && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "absolute",
            bottom: 24,
            right: 24,
          }}
          onClick={handleAddNew}
        >
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