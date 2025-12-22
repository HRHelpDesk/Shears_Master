import React, { useEffect, useState, useContext, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";
import { useTheme } from "react-native-paper";

import CardListView from "./CardListView";

/**
 * AnnouncementListViewMobile
 *
 * - Fetches announcements by recordType
 * - Renders CARD list (not ListView)
 * - Matches web AnnouncementListView behavior
 */
export default function AnnouncementListView({
  name = "Announcements",
  recordType = "announcements",
  fields = [],
  appConfig,
}) {
  const { token, user } = useContext(AuthContext);
  const theme = useTheme();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token || !user?.subscriberId) return;

    try {
      const res = await getRecords({
        recordType,
        subscriberId: user.subscriberId,
        token,
        limit: 200,
      });

      const normalized = Array.isArray(res) ? res : res?.records || [];
      setData(normalized);
    } catch (err) {
      console.error("🔥 AnnouncementListViewMobile fetch error:", err);
    }

    setLoading(false);
  }, [token, user?.subscriberId, recordType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <CardListView
      name={name}
      data={data}
      fields={fields}
      appConfig={appConfig}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
