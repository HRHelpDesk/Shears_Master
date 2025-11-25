// src/components/Dashboard/AppointmentsSummaryWidget.jsx

import React, { useContext, useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";

export default function SmartAppointmentsSummaryWidget() {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [completedThisWeekCount, setCompletedThisWeekCount] = useState(0);
  const [error, setError] = useState(null);

  /* ---------------------------------------------------------
     Load Appointments on Mount
  --------------------------------------------------------- */
  useEffect(() => {
    if (!user || !token) return;
    fetchAppointments();
  }, [user?.userId, user?.subscriberId, token]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const raw = await getRecords({
        recordType: "calendar",
        subscriberId: user.subscriberId,
        userId: user.userId,
        page: 1,
        limit: 200,
        token,
      });

      const records = Array.isArray(raw)
        ? raw
        : raw?.records || raw?.items || raw?.data || [];

      const { todayCount, completedThisWeekCount } =
        computeAppointmentStats(records);

      setTodayCount(todayCount);
      setCompletedThisWeekCount(completedThisWeekCount);

    } catch (err) {
      console.error("Error loading appointment summary:", err);
      setError("Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     Helpers - Date Fields & Status
  --------------------------------------------------------- */
  const getRecordDate = (rec) => {
    const dateStr =
      rec?.fieldsData?.date ||
      rec?.fieldsData?.appointmentDate ||
      rec?.fieldsData?.startDate;

    if (!dateStr) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  };

  const isCompleted = (rec) => {
    const status =
      rec?.fieldsData?.status ||
      rec?.fieldsData?.appointmentStatus ||
      rec?.status;

    if (!status) return false;
    return String(status).toLowerCase() === "completed";
  };

  const computeAppointmentStats = (records) => {
    if (!records || !records.length) {
      return { todayCount: 0, completedThisWeekCount: 0 };
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Monday → Sunday week calculation
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let todayCount = 0;
    let completedThisWeekCount = 0;

    for (const rec of records) {
      const dateStr = getRecordDate(rec);
      if (!dateStr) continue;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) continue;

      if (dateStr === todayStr) {
        todayCount += 1;
      }

      if (d >= startOfWeek && d <= endOfWeek && isCompleted(rec)) {
        completedThisWeekCount += 1;
      }
    }

    return { todayCount, completedThisWeekCount };
  };

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */

  if (!user || !token) {
    return (
      <Box sx={{ textAlign: "center", p: 3 }}>
        <Typography variant="body1">
          Sign in to view your appointment summary.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", p: 3 }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 1 }}>Loading…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 3,
        display: "flex",
        justifyContent: "center",
        gap: 3,
        flexWrap: "wrap",
      }}
    >
      {/* Today's Appointments */}
      <Card
        sx={{
          minWidth: 180,
          borderRadius: 3,
          textAlign: "center",
          p: 1,
        }}
      >
        <CardContent>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            {todayCount}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
            Today&apos;s Appointments
          </Typography>
        </CardContent>
      </Card>

      {/* Completed This Week */}
      <Card
        sx={{
          minWidth: 180,
          borderRadius: 3,
          textAlign: "center",
          p: 1,
        }}
      >
        <CardContent>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            {completedThisWeekCount}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
            Completed This Week
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
