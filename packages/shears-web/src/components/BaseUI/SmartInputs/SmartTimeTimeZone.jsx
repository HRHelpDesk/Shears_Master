import React from "react";
import { Box, Typography, TextField, MenuItem } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DateTime } from "luxon";

const US_TIMEZONES = [
  { label: "Eastern (EST)", value: "America/New_York" },
  { label: "Central (CST)", value: "America/Chicago" },
  { label: "Mountain (MST)", value: "America/Denver" },
  { label: "Pacific (PST)", value: "America/Los_Angeles" },
  { label: "Alaska (AKST)", value: "America/Anchorage" },
  { label: "Hawaii (HST)", value: "Pacific/Honolulu" }
];

/* ------------------------------------------------------------
   📌 Convert stored time + source timezone → viewer timezone
------------------------------------------------------------ */
function convertToLocalTime(time, sourceTZ) {
  if (!time || !sourceTZ) return "";

  const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [hour, minute] = time.split(":").map(Number);

  const source = DateTime.fromObject(
    { hour, minute },
    { zone: sourceTZ }
  );

  const local = source.setZone(viewerTZ);
  return local.toFormat("h:mm a");
}

export default function SmartTimeTimeZone({
  label = "Time",
  value,
  onChangeText,
  mode = "edit"
}) {
  const theme = useTheme();

  const time = value?.time || "";
  const timezone =
    value?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  /* ------------------------------------------------------------
     🚧 SAFE UPDATE — mirrors mobile version
     Ensures the output is ALWAYS:
       { time: "HH:mm" , timezone: "America/Chicago" }
------------------------------------------------------------ */
  const safeUpdate = (key, val) => {
    const next = {
      time: time || "",
      timezone:
        timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    next[key] = val || "";
    onChangeText(next);
  };

  /* ------------------------------------------------------------
     🔍 READ MODE
  ------------------------------------------------------------ */
  if (mode === "read") {
    const converted = convertToLocalTime(time, timezone);

    return (
      <Box sx={{ my: 1 }}>
        <Typography variant="subtitle2" color="text.primary">
          {label}
        </Typography>

        <Typography
          sx={{
            bgcolor: theme.palette.grey[100],
            borderRadius: 1,
            p: 1,
            mt: 0.5
          }}
        >
          {converted || <em>—</em>}{" "}
          <span style={{ color: theme.palette.text.secondary, fontSize: "0.85em" }}>
            (Your Local Time)
          </span>
        </Typography>

        <Typography
          variant="caption"
          sx={{ mt: 0.5, display: "block", color: theme.palette.text.secondary }}
        >
          Original timezone: {timezone}
        </Typography>
      </Box>
    );
  }

  /* ------------------------------------------------------------
     ✏️ EDIT MODE (now uses safeUpdate)
  ------------------------------------------------------------ */
  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="subtitle2" color="text.primary">
        {label}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
        {/* TIME FIELD */}
        <TextField
          type="time"
          fullWidth
          value={time}
          onChange={(e) => safeUpdate("time", e.target.value)}
        />

        {/* TIMEZONE SELECT */}
        <TextField
          select
          fullWidth
          value={timezone}
          onChange={(e) => safeUpdate("timezone", e.target.value)}
        >
          {US_TIMEZONES.map((tz) => (
            <MenuItem key={tz.value} value={tz.value}>
              {tz.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
}
