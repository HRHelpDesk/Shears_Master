// src/components/BasicLayoutPageWeb.jsx
import React, { useState, useCallback, useContext } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import RenderBasicField from "./RenderBasicField";
import { AuthContext } from "../../context/AuthContext";
import { useTriggerRefresh } from "../../context/RefreshContext";

export default function BasicLayoutPage({ fields = [] }) {
  const { user } = useContext(AuthContext);
  const trigger = useTriggerRefresh();

  const initialState = {};
  fields.forEach((f) => {
    initialState[f.field] = "";
  });

  const [form, setForm] = useState(initialState);
  const [refreshing, setRefreshing] = useState(false);

  const handleChange = (fieldKey, newVal) => {
    setForm((prev) => ({ ...prev, [fieldKey]: newVal }));
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      trigger("dashboard-data");
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  }, [trigger]);

  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        height: "100vh",
        overflowY: "auto",
        padding: 3,
        paddingTop: 4,               // ← extra top padding so first field isn't right under browser edge
        bgcolor: "background.default",
        position: "relative",        // ← important: allows absolute positioning inside
      }}
    >
      {/* Floating refresh button – top-right, doesn't push content */}
      <Tooltip title="Refresh dashboard data">
        <IconButton
          onClick={handleRefresh}
          disabled={refreshing}
          size="small"
          color="primary"
          sx={{
            position: "absolute",
            top: 16,                   // distance from top edge
            right: 24,                 // distance from right edge
            zIndex: 10,
          }}
        >
          {refreshing ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <Refresh fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      {/* Content starts immediately at the top */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {fields.map((field) => (
          <RenderBasicField
            key={field.field}
            field={field}
            user={user}
            value={form[field.field]}
            onChange={(newVal) => handleChange(field.field, newVal)}
          />
        ))}
      </Box>

      {/* Optional debug */}
      {/* <pre style={{ marginTop: 40, fontSize: 13, opacity: 0.6 }}>
        {JSON.stringify(form, null, 2)}
      </pre> */}
    </Box>
  );
}