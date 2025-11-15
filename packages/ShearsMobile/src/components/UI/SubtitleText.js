// src/components/UI/SubtitleTextMobile.jsx
import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { DateTime } from "luxon";

export default function SubtitleTextMobile({ name, item }) {
  const theme = useTheme();

  if (!name || !item) return null;

  const type = name.toLowerCase();

  switch (type) {
    /* ------------------------------------------------------------
       🗓️ CALENDAR / APPOINTMENTS (matches Web logic exactly)
    ------------------------------------------------------------ */
    case "calendar":
    case "appointments":
    case "appointment":
    case "calendarlist":
      return <CalendarSubtitleMobile item={item} theme={theme} />;

    /* ------------------------------------------------------------
       👤 USERS (your mobile logic)
    ------------------------------------------------------------ */
    case "users":
      return <UserSubtitleMobile item={item} theme={theme} />;

    /* ------------------------------------------------------------
       📇 CONTACTS (your mobile logic)
    ------------------------------------------------------------ */
    // case "contacts":
    //   return <ContactSubtitleMobile item={item} theme={theme} />;

    /* ------------------------------------------------------------
       💈 SERVICES / PRODUCTS — show price
    ------------------------------------------------------------ */
    // case "services":
    // case "products":
    //   return <PriceSubtitleMobile item={item} theme={theme} />;

    default:
      return null;
  }
}

/* ============================================================
   🗓️ Calendar Subtitle (FULL Web parity)
============================================================ */
function CalendarSubtitleMobile({ item, theme }) {
  if (!item?.date || !item?.time?.startTime) return null;

  const { date, time } = item;

  // Convert to Luxon
  const dt = DateTime.fromISO(`${date}T${time.startTime}`, {
    zone: "America/Chicago",
  });

  if (!dt.isValid) return null;

  const formatted = dt.toFormat("cccc, LLLL d, yyyy • h:mm a");

  // End time if present
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
    <Text
      variant="bodySmall"
      style={{
        color: theme.colors.textSecondary,
        marginTop: 4,
      }}
    >
      {formatted}
      {endFormatted}
    </Text>
  );
}

/* ============================================================
   👤 User Subtitle (mobile logic)
============================================================ */
function UserSubtitleMobile({ item, theme }) {
  return (
    <View style={{ marginTop: 4 }}>
      {item.email ? (
        <Text style={{ color: theme.colors.textSecondary }}>{item.email}</Text>
      ) : null}

      {item.role ? (
        <Text style={{ color: theme.colors.textSecondary }}>
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
        </Text>
      ) : null}
    </View>
  );
}

/* ============================================================
   📇 Contact Subtitle (mobile logic)
============================================================ */
function ContactSubtitleMobile({ item, theme }) {
  return (
    <View style={{ marginTop: 4 }}>
      {item.phone ? (
        <Text style={{ color: theme.colors.textSecondary }}>{item.phone}</Text>
      ) : null}

      {item.email ? (
        <Text style={{ color: theme.colors.textSecondary }}>{item.email}</Text>
      ) : null}
    </View>
  );
}

/* ============================================================
   💈 Services / Products — Show price (mobile logic)
============================================================ */
function PriceSubtitleMobile({ item, theme }) {
  const price =
    item?.raw?.price ||
    item?.price ||
    item?.payment?.amount ||
    null;

  if (!price) return null;

  return (
    <Text
      style={{
        color: theme.colors.textSecondary,
        marginTop: 4,
      }}
    >
      {price}
    </Text>
  );
}
