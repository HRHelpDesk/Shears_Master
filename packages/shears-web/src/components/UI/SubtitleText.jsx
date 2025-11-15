import React from "react";
import { Typography } from "@mui/material";
import { DateTime } from "luxon";

export default function SubtitleText({ name, item }) {
  if (!name || !item) return null;

  const type = name.toLowerCase();

  switch (type) {
    case "calendar":
    case "appointments":
    case "appointment":
    case "calendarlist":
      return <CalendarSubtitle item={item} />;

    // 🔜 Here you can add:
    // case "contacts": return <ContactSubtitle item={item} />;
    // case "services": return <ServiceSubtitle item={item} />;
    // case "payments": …

    default:
      return null;
  }
}

/* -----------------------------------------------------------
   🗓️  CALENDAR SUBTITLE
----------------------------------------------------------- */
function CalendarSubtitle({ item }) {
  if (!item?.date || !item?.time?.startTime) return null;

  const { date, time } = item;

  // Convert to Luxon
  const dt = DateTime.fromISO(`${date}T${time.startTime}`, {
    zone: "America/Chicago",
  });

  if (!dt.isValid) return null;

  const formatted = dt.toFormat("cccc, LLLL d, yyyy • h:mm a");

  // If endTime exists, calculate readable range
  let endFormatted = "";
  if (time.endTime) {
    const endDt = DateTime.fromISO(`${date}T${time.endTime}`, {
      zone: "America/Chicago",
    });
    if (endDt.isValid) {
      endFormatted = ` - ${endDt.toFormat("h:mm a")}`;
    }
  }

  return (
    <Typography variant="subtitle2" sx={{ color: "text.secondary", mt: 0.5 }}>
      {formatted}{endFormatted}
    </Typography>
  );
}
