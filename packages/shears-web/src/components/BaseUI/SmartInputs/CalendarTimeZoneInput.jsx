// CalendarTimeZoneInput.web.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DateTime } from "luxon";

const US_TIMEZONES = [
  { label: "Eastern (EST)", value: "America/New_York" },
  { label: "Central (CST)", value: "America/Chicago" },
  { label: "Mountain (MST)", value: "America/Denver" },
  { label: "Pacific (PST)", value: "America/Los_Angeles" },
  { label: "Alaska (AKST)", value: "America/Anchorage" },
  { label: "Hawaii (HST)", value: "Pacific/Honolulu" },
];

/* ------------------------------------------------------------
   📌 Convert stored time + source timezone → viewer's timezone
------------------------------------------------------------ */
function convertToLocalTime(time, sourceTZ) {
  if (!time || !sourceTZ) return "";

  try {
    const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [hour, minute] = time.split(":").map(Number);

    return DateTime.fromObject(
      { hour, minute },
      { zone: sourceTZ }
    )
      .setZone(viewerTZ)
      .toFormat("h:mm a");
  } catch {
    return time;
  }
}

export default function CalendarTimeZoneInput({
  label = "Time",
  value,
  onChangeText,
  mode = "edit",
  defaultValue,
}) {
  const startTime = value?.start ?? "";
  const endTime = value?.end ?? "";
  const timezone =
    value?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log("Applying default timezone:", value);
  /* ------------------------------------------------------------
     ⏱ Apply default timezone if provided
  ------------------------------------------------------------ */
  useEffect(() => {
  
    if (defaultValue && !value?.timezone) {
      onChangeText({ start: startTime, end: endTime, timezone: defaultValue });
    }
  }, [defaultValue]);

  /* ------------------------------------------------------------
     🔐 Safe update
  ------------------------------------------------------------ */
  const update = (key, val) => {
    onChangeText({
      start: key === "start" ? val : startTime,
      end: key === "end" ? val : endTime,
      timezone: key === "timezone" ? val : timezone,
    });
  };

  const selectedLabel =
    US_TIMEZONES.find((tz) => tz.value === timezone)?.label ||
    "Select timezone";

  /* ------------------------------------------------------------
     📖 READ MODE
  ------------------------------------------------------------ */
  if (mode === "read") {
    const convertedStart = convertToLocalTime(startTime, timezone);
    const convertedEnd = convertToLocalTime(endTime, timezone);

    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 0.5, fontWeight: 500 }}
        >
          {label}
        </Typography>

        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {convertedStart && convertedEnd
            ? `${convertedStart} - ${convertedEnd}`
            : "Not set"}
          {convertedStart && (
            <Typography
              component="span"
              variant="caption"
              sx={{ color: "text.secondary", ml: 1 }}
            >
              (Your local time)
            </Typography>
          )}
        </Typography>

        {/* {startTime && (
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
            Original: {startTime} - {endTime} ({selectedLabel})
          </Typography>
        )} */}
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ✏️ EDIT MODE
  ------------------------------------------------------------ */
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mb: 1, fontWeight: 500 }}
      >
        {label}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
        {/* START TIME */}
        <TextField
          label="Start Time"
          type="time"
          value={startTime}
          onChange={(e) => update("start", e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ step: 300 }} // 5 min intervals
          size="small"
          fullWidth
        />

        {/* END TIME */}
        <TextField
          label="End Time"
          type="time"
          value={endTime}
          onChange={(e) => update("end", e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ step: 300 }}
          size="small"
          fullWidth
        />
      </Box>

      {/* TIMEZONE SELECTOR */}
      <FormControl fullWidth size="small">
        <InputLabel>Timezone</InputLabel>
        <Select
          value={timezone}
          label="Timezone"
          onChange={(e) => update("timezone", e.target.value)}
        >
          {US_TIMEZONES.map((tz) => (
            <MenuItem key={tz.value} value={tz.value}>
              {tz.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}