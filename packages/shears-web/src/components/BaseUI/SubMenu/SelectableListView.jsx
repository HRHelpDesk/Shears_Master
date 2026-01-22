// src/components/BaseUI/SubMenu/SelectableListViewWeb.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DateTime } from "luxon";

const SquareAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: 8,
}));

// Status colors (same as mobile)
const STATUS_COLORS = {
  pending: "#FF9800",
  approved: "#4CAF50",
  rejected: "#F44336",
  completed: "#2196F3",
  cancelled: "#9E9E9E",
  paid: "#4CAF50",
  refunded: "#757575",
};

const getStatusColor = (status) => {
  if (!status) return "default";
  return STATUS_COLORS[status.toLowerCase()] || "default";
};

// Deep name resolver (same as before)
const getPrimaryText = (item) => {
  if (!item) return "Untitled";

  const data = item.fieldsData ? { ...item, ...item.fieldsData } : item;

  if (data.name) return String(data.name).trim() || "Unnamed";
  if (data.fullName) return String(data.fullName).trim() || "Unnamed";
  if (data.displayName) return String(data.displayName).trim() || "Unnamed";

  if (data.firstName || data.lastName) {
    return [data.firstName, data.lastName].filter(Boolean).join(" ") || "Unnamed";
  }

  const deepSearch = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    if (obj.name) return String(obj.name).trim();
    if (obj.fullName) return String(obj.fullName).trim();
    if (obj.firstName && obj.lastName) return `${obj.firstName} ${obj.lastName}`.trim();
    for (const val of Object.values(obj)) {
      const found = deepSearch(val);
      if (found) return found;
    }
    return null;
  };

  const deepName = deepSearch(data) || deepSearch(data.raw);
  if (deepName) return deepName;

  return data.title || data.description || data.email || `Item ${data._id || "Unnamed"}`;
};

// Avatar resolver
const getAvatarUrl = (item) => {
  const data = item.fieldsData ? { ...item, ...item.fieldsData } : item;

  const paths = [
    data.avatar,
    data.avatar?.url,
    data.avatar?.[0]?.url,
    data.raw?.avatar,
    data.raw?.avatar?.url,
    data.raw?.avatar?.[0]?.url,
  ];

  for (const p of paths) {
    if (typeof p === "string" && p) return p;
    if (p?.url) return p.url;
  }
  return null;
};

// Date resolver (Luxon)
const resolveDate = (item) => {
  const raw =
    item.date ||
    item.startDate ||
    item.requestDate ||
    item.createdAt ||
    item.updatedAt ||
    item.fieldsData?.date;

  if (!raw) return null;

  try {
    let dt;
    if (typeof raw === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        dt = DateTime.fromFormat(raw, "yyyy-MM-dd", { zone: "local" });
      } else {
        dt = DateTime.fromISO(raw, { zone: "utc" }).toLocal();
      }
    } else if (raw instanceof Date) {
      dt = DateTime.fromJSDate(raw);
    }

    if (dt && dt.isValid) {
      return dt.toLocaleString(DateTime.DATE_MED); // e.g. "Jan 17, 2026"
    }
  } catch {
    return null;
  }
  return null;
};

// Duration formatter
const formatDuration = (value) => {
  if (!value || typeof value !== "object") return "";
  const h = value.hours ? `${value.hours}h` : "";
  const m = value.minutes ? `${value.minutes}m` : "";
  return [h, m].filter(Boolean).join(" ") || "0m";
};

// Time with timezone (if present)
const formatTimeWithZone = (value) => {
  if (!value?.time || !value?.timezone) return "";
  try {
    const [hour, minute] = String(value.time).split(":").map(Number);
    return DateTime.fromObject({ hour, minute }, { zone: value.timezone })
      .toFormat("h:mm a");
  } catch {
    return value.time || "";
  }
};

// Unified value formatter for subtext
const formatValueForList = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map((v) => v?.name || v?.label || v?.platform || v?.raw?.name || "")
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    if (value.time && value.timezone) return formatTimeWithZone(value);
    if (value.hours || value.minutes) return formatDuration(value);
    if (value.name) return value.name;
    if (value.raw) {
      return value.raw.fullName || value.raw.name || value.raw.email || "";
    }
    return "";
  }

  return "";
};

const matchesSearch = (item, search) => {
  if (!search) return true;
  return getPrimaryText(item).toLowerCase().includes(search.toLowerCase());
};

export default function SelectableListViewWeb({
  data = [],
  onSelect,
  name = "Item",
  fields = null,
  appConfig,
  loading = false,
  mode = "basic", // "basic" or "expanded"
}) {
  const [search, setSearch] = useState("");

  // Normalize data (flatten fieldsData)
  const normalizedData = useMemo(() => 
    data.map((item) => {
      if (item.fieldsData) {
        return {
          ...item,
          ...item.fieldsData,
          _id: item._id,
          recordType: item.recordType,
        };
      }
      return item;
    }),
    [data]
  );

  const filtered = useMemo(() => 
    normalizedData.filter((item) => matchesSearch(item, search)),
    [normalizedData, search]
  );

  const initials = (str) => {
    if (!str) return "?";
    return str
      .split(" ")
      .map((p) => p[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusChipColor = (status) => {
    const lowerStatus = status?.toLowerCase();
    switch(lowerStatus) {
      case 'approved':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  // Build subtext lines for expanded mode
  const buildSubText = (item) => {
    if (mode !== "expanded" || !fields?.length) return { date: null, fields: [], status: null };

    const fieldLines = [];
    let status = null;
    let date = null;

    fields.forEach((field) => {
      // Skip primary name fields
      if (["name", "fullName", "firstName", "lastName"].includes(field.field)) return;

      const raw = item[field.field];
      if (raw == null || raw === "") return;

      const formatted = formatValueForList(raw);
      if (!formatted) return;

      const label = field.label || field.field;

      // Special handling for status - store separately for chip
      if (field.field.toLowerCase() === "status") {
        status = formatted;
        return;
      }

      fieldLines.push({
        label,
        value: formatted,
      });
    });

    // Get date if present
    const dateStr = resolveDate(item);
    if (dateStr) {
      date = dateStr;
    }

    return { date, fields: fieldLines, status };
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <TextField
        fullWidth
        size="medium"
        label={`Search ${name}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          }
        }}
      />

      <List disablePadding sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        {filtered.map((item, index) => {
          const displayName = getPrimaryText(item);
          const avatarUrl = getAvatarUrl(item);
          const subText = buildSubText(item);
          const hasContent = subText.date || subText.fields.length > 0 || subText.status;

          return (
            <ListItemButton
              key={item._id || displayName}
              onClick={() => onSelect?.(item)}
              sx={{
                py: 2,
                px: 2.5,
                borderBottom: index !== filtered.length - 1 ? "1px solid" : "none",
                borderColor: "divider",
                alignItems: "flex-start",
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemAvatar sx={{ mt: 0.5, minWidth: 64 }}>
                {avatarUrl ? (
                  <SquareAvatar 
                    src={avatarUrl} 
                    variant="rounded"
                    sx={{ 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                  />
                ) : (
                  <SquareAvatar 
                    variant="rounded"
                    sx={{
                      bgcolor: 'primary.main',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {initials(displayName)}
                  </SquareAvatar>
                )}
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: hasContent ? 0.75 : 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                      {displayName}
                    </Typography>
                    {subText.status && (
                      <Chip 
                        label={subText.status} 
                        size="small"
                        color={getStatusChipColor(subText.status)}
                        sx={{ 
                          height: 22, 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  (subText.date || subText.fields.length > 0) ? (
                    <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                      {subText.date && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                          }}
                        >
                          📅 {subText.date}
                        </Typography>
                      )}
                      {subText.fields.map((field, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontSize: '0.875rem',
                          }}
                        >
                          <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            {field.label}:
                          </Box>{' '}
                          {field.value}
                        </Typography>
                      ))}
                    </Box>
                  ) : null
                }
                secondaryTypographyProps={{ component: "div" }}
              />
            </ListItemButton>
          );
        })}

        {!filtered.length && (
          <Box sx={{ 
            textAlign: "center", 
            py: 8, 
            color: "text.secondary",
            bgcolor: 'background.default',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.7 }}>
              {search ? `No ${name} found matching "${search}"` : `No ${name} available`}
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
}