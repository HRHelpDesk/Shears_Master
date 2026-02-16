// src/components/Dashboard/SmartDashboardWeeklySnapshot.jsx

import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { Text, useTheme, Card } from "react-native-paper";
import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";
import { useRefreshVersion } from "../../../context/RefreshContext";

export default function SmartDashboardWeeklySnapshot() {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [weekLabel, setWeekLabel] = useState("");
  const [totalScheduled, setTotalScheduled] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [outstandingCount, setOutstandingCount] = useState(0);
const refreshVersion = useRefreshVersion('dashboard-data');
  useEffect(() => {
    if (!user || !token) return;
    fetchWeeklyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.subscriberId, token, refreshVersion]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const raw = await getRecords({
        recordType: "calendar",
        subscriberId: user.subscriberId,
      
        page: 1,
        limit: 300,
        token,
      });

      const records = Array.isArray(raw)
        ? raw
        : raw?.records || raw?.items || raw?.data || [];

      const results = computeWeeklyStats(records);

      setWeekLabel(results.weekLabel);
      setTotalScheduled(results.totalScheduled);
      setCompletedCount(results.completedCount);
      setOutstandingCount(results.outstandingCount);
    } catch (err) {
      console.error("Weekly snapshot error:", err);
      setError("Unable to load weekly data");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------
     HELPERS
  -------------------------------------------------------- */

  const getStartAndEndOfWeek = () => {
    const today = new Date();

    // Sunday start
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    start.setHours(0, 0, 0, 0);

    // Saturday end
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const getRecordDate = (rec) => {
    const rawDate = rec?.fieldsData?.date;

    if (!rawDate) return null;

    // Your schema stores date as array: ["2026-02-16"]
    const dateStr = Array.isArray(rawDate) ? rawDate[0] : rawDate;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    return d;
  };

  const isCompleted = (rec) => {
    const status =
      rec?.fieldsData?.status ||
      rec?.fieldsData?.appointmentStatus ||
      rec?.status;

    if (!status) return false;
    return String(status).toLowerCase() === "completed";
  };

  const computeWeeklyStats = (records) => {
    const { start, end } = getStartAndEndOfWeek();

    const format = (d) =>
      `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    let totalScheduled = 0;
    let completedCount = 0;

    for (const rec of records) {
      const date = getRecordDate(rec);
      if (!date) continue;

      if (date >= start && date <= end) {
        totalScheduled++;

        if (isCompleted(rec)) {
          completedCount++;
        }
      }
    }

    return {
      weekLabel: `${format(start)} - ${format(end)}`,
      totalScheduled,
      completedCount,
      outstandingCount: totalScheduled - completedCount,
    };
  };

  /* --------------------------------------------------------
     RENDER
  -------------------------------------------------------- */

  if (!user || !token) {
    return (
      <View style={styles.center}>
        <Text>Sign in to view weekly analytics.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 8 }}>Loading weekly snapshot…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 400;

  return (
    <View style={styles.container}>
      {/* Week Range */}
      <View style={styles.headerContainer}>
        <Text variant="labelLarge" style={[styles.weekLabel, { color: theme.colors.onSurfaceVariant }]}>
          Week of {weekLabel}
        </Text>
      </View>

      <View style={styles.row}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Card.Content style={styles.cardContent}>
            <Text 
              variant={isSmallScreen ? "headlineLarge" : "displaySmall"} 
              style={[styles.count, { color: theme.colors.primary }]}
            >
              {totalScheduled}
            </Text>
            <Text 
              variant="labelMedium" 
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Scheduled
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Card.Content style={styles.cardContent}>
            <Text 
              variant={isSmallScreen ? "headlineLarge" : "displaySmall"} 
              style={[styles.count, { color: theme.colors.primary }]}
            >
              {completedCount}
            </Text>
            <Text 
              variant="labelMedium" 
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Completed
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Card.Content style={styles.cardContent}>
            <Text 
              variant={isSmallScreen ? "headlineLarge" : "displaySmall"} 
              style={[styles.count, { color: theme.colors.primary }]}
            >
              {outstandingCount}
            </Text>
            <Text 
              variant="labelMedium" 
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Upcoming
            </Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  center: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContainer: {
    // alignItems: "flex-end",
    marginBottom: 16,
  },
  weekLabel: {
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weekText: {
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    height: 120,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    height: '100%',
  },
  count: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 8,
  },
  label: {
    textAlign: "center",
    fontWeight: "500",
  },
});