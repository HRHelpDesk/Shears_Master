// src/components/AdminListView/AdminListView.native.js
import React, { useEffect, useState, useContext, useCallback } from "react";
import { View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";
import ListView from "../ListView";

export default function AdminListView({
  name,
  recordType,
  fields,
  appConfig
}) {
  const { token, user } = useContext(AuthContext);

  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);  // initial load
const [isFirstLoad, setIsFirstLoad] = useState(true);

  const effectiveRecordType = recordType || name?.toLowerCase();

  const loadData = useCallback(async (isRefresh = false) => {
    if (!token || !user?.subscriberId) return;

   // Handle loading states
   if (isFirstLoad) setLoading(true);
   if (!isFirstLoad && isRefresh) setRefreshing(true);

    try {
      console.log("📡 AdminListView fetching:", effectiveRecordType);

      const res = await getRecords({
        recordType: effectiveRecordType,
        subscriberId: user.subscriberId,
        token,
        limit: 500
      });

      const normalized = Array.isArray(res)
        ? res
        : res?.records || [];

      setData(normalized);

    } catch (err) {
      console.error("🔥 AdminListView fetch error:", err);
    }

   // Cleanup load states
   if (isFirstLoad) {
     setIsFirstLoad(false);
     setLoading(false);
   }
   if (isRefresh) setRefreshing(false);

  }, [token, user?.subscriberId, effectiveRecordType, isFirstLoad]);

  useEffect(() => {
    loadData(false); // initial load
  }, [loadData]);

  if (loading) {
    return (
      <View style={{ height: "60%", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ListView
      name={name}
      recordType={effectiveRecordType}
      data={data}
      fields={fields}
      appConfig={appConfig}
      refreshing={refreshing}
      onRefresh={() => loadData(true)}  // ⭐ Trigger refresh mode
    />
  );
}

