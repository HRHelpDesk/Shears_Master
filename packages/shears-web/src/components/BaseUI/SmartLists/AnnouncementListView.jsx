import React, { useEffect, useState, useContext, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import { AuthContext } from "../../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";
import CardListViewReadOnly from "./CardListView";


/**
 * AnnouncementListView
 *
 * - Fetches announcements by recordType
 * - Renders CARD layout instead of table
 */
export default function AnnouncementListView({
  name = "Announcements",
  recordType = "announcements",
  fields,
  appConfig,
}) {
  const { token, user } = useContext(AuthContext);

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
      console.error("🔥 AnnouncementListView fetch error:", err);
    }

    setLoading(false);
  }, [token, user?.subscriberId, recordType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    <CardListViewReadOnly
      name={name}
      data={data}
      fields={fields}
      appConfig={appConfig}
    />
  );
}
