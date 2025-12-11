import React, { useEffect, useState, useContext, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";
import ListView from "../ListView";

/**
 * Updated AdminListView — Now recordType-driven
 *
 * Props:
 * - name (string): route/view name
 * - recordType (string): schema-defined record type  <-- NEW
 * - fields (array)
 * - appConfig (object)
 */
export default function AdminListView({ name, recordType, fields, appConfig, displayName }) {
  const { token, user } = useContext(AuthContext);

  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  /** ---------------------------------------------------------------
   * RESOLVE FINAL RECORD TYPE
   * Priority:
   * 1. Explicit recordType prop
   * 2. Fallback: route/view "name"
   ---------------------------------------------------------------- */
  const resolvedRecordType =
    recordType || name?.toLowerCase() || null;

  /** ---------------------------------------------------------------
   * LOAD DATA
   ---------------------------------------------------------------- */
  const loadData = useCallback(async () => {
    if (!token || !user?.subscriberId || !resolvedRecordType) return;

    setRefreshing(true);
    try {
      console.log("📦 AdminListView → Fetching records:", resolvedRecordType);

      const res = await getRecords({
        recordType: resolvedRecordType,
        subscriberId: user.subscriberId,
        token,
        limit: 500,
      });

      console.log("📥 RAW DATA FROM SERVER:", res);

      // Normalize API output
      const normalized = Array.isArray(res) ? res : res?.records || [];

      console.log("📤 Normalized Data Passed to ListView:", normalized);

      setData(normalized);
    } catch (err) {
      console.error("🔥 AdminListView fetch error:", err);
    }

    setRefreshing(false);
    setLoading(false);
  }, [token, user?.subscriberId, resolvedRecordType]);

  /** ---------------------------------------------------------------
   * Mount + refresh when recordType changes
   ---------------------------------------------------------------- */
  useEffect(() => {
    console.log("🔁 AdminListView Mounted — Loading Data…");
    loadData();
  }, [loadData]);

  /** ---------------------------------------------------------------
   * UI Rendering
   ---------------------------------------------------------------- */
  if (loading) {
    return (
      <Box
        sx={{
          height: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ListView
      name={name}
      displayName={displayName}
      recordType={resolvedRecordType}   // ⭐ Pass resolved record type
      data={data}
      fields={fields}
      appConfig={appConfig}
      refreshing={refreshing}
      onRefresh={loadData}
    />
  );
}
