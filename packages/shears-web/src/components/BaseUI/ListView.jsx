// ListView.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  InputAdornment,
  Button,
  Grid,
  Chip,
  Typography,
} from "@mui/material";
import { Search as SearchIcon, Add as AddIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { DateTime } from "luxon";

import {
  humanizeFieldName,
  singularize,
} from "shears-shared/src/utils/stringHelpers";
import { mapFields } from "shears-shared/src/config/fieldMapper";
import ListItemDetail from "./ListItemDetail";

/* ============================================================
   🎨 Status Color Configuration
============================================================ */
const STATUS_COLORS = {
  pending: "#FF9800",
  approved: "#4CAF50",
  rejected: "#F44336",
  completed: "#2196F3",
  cancelled: "#9E9E9E",
};

function getStatusColor(status) {
  if (!status || typeof status !== "string") return null;
  return STATUS_COLORS[status.toLowerCase()] || null;
}

/* ============================================================
   Styled Components
============================================================ */
const TableContainerStyled = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  display: "flex",
  flexDirection: "column",
  height: "100%",
  maxHeight: "100vh",
}));

const SearchField = styled(TextField)(({ theme }) => ({
  width: "100%",
  maxWidth: 400,
}));

const StatusChip = styled(Chip)(({ statuscolor }) => ({
  backgroundColor: statuscolor || "#9E9E9E",
  color: "#ffffff",
  fontWeight: 700,
}));

/* ============================================================
   Date Range Formatter (NEW)
============================================================ */
function resolveDateRange(item) {
  let raw = item.fieldsData?.date ?? item.date;

  if (!raw) return "";

  // Normalize to array
  const dateStrings = Array.isArray(raw) ? raw : [raw];

  const validDates = dateStrings
    .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .map((d) => DateTime.fromFormat(d, "yyyy-MM-dd", { zone: "local" }))
    .filter((dt) => dt.isValid)
    .sort((a, b) => a - b); // chronological

  if (validDates.length === 0) return "—";

  if (validDates.length === 1) {
    return validDates[0].toLocaleString(DateTime.DATE_MED);
  }

  const start = validDates[0];
  const end = validDates[validDates.length - 1];

  if (start.month === end.month && start.year === end.year) {
    return `${start.toFormat("MMM d")} – ${end.toFormat("d, yyyy")}`;
  }
  if (start.year === end.year) {
    return `${start.toFormat("MMM d")} – ${end.toFormat("MMM d, yyyy")}`;
  }
  return `${start.toLocaleString(DateTime.DATE_MED)} – ${end.toLocaleString(DateTime.DATE_MED)}`;
}

/* ============================================================
   Avatar Resolver
============================================================ */
function getAvatarUrl(item) {
  const fd = item?.fieldsData ?? item;

  if (fd.avatar) {
    if (Array.isArray(fd.avatar) && fd.avatar[0]?.url) return fd.avatar[0].url;
    if (typeof fd.avatar === "string") return fd.avatar;
  }

  for (const [key, value] of Object.entries(fd)) {
    if (key.toLowerCase().includes("image") || key.toLowerCase().includes("avatar")) {
      if (Array.isArray(value) && value[0]?.url) return value[0].url;
      if (typeof value === "string") return value;
    }
  }

  for (const v of Object.values(fd)) {
    if (v?.raw?.avatar) return v.raw.avatar;
    if (Array.isArray(v?.avatar) && v.avatar[0]?.url) return v.avatar[0].url;
  }

  return null;
}

/* ============================================================
   Primary Text Resolver
============================================================ */
function getPrimaryText(item) {
  const fd = item?.fieldsData ?? item;

  if (fd.firstName || fd.lastName) {
    return [fd.firstName, fd.lastName].filter(Boolean).join(" ");
  }

  if (fd.influencerName?.raw?.fullName) {
    return fd.influencerName.raw.fullName;
  }

  const nameField = Object.values(fd).find(
    (v) => v?.raw?.fullName || v?.raw?.name || v?.name
  );

  return (
    nameField?.raw?.fullName ||
    nameField?.raw?.name ||
    nameField?.name ||
    fd.title ||
    fd.email ||
    "Untitled"
  );
}

/* ============================================================
   🕒 TIME + TIMEZONE
============================================================ */
function formatTimeWithZone(value) {
  if (!value?.time || !value?.timezone) return "";

  try {
    const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [hour, minute] = value.time.split(":").map(Number);

    return DateTime.fromObject({ hour, minute }, { zone: value.timezone })
      .setZone(viewerTZ)
      .toFormat("h:mm a");
  } catch {
    return value.time || "";
  }
}

/* ============================================================
   Smart Field Formatter – now handles date arrays
============================================================ */
function formatFieldValue(value, field) {
  if (value == null) return "";

  // Special case: date field → use range formatter
  if (field?.field === "date" || field?.type === "date") {
    return resolveDateRange({ fieldsData: { date: value }, date: value });
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return DateTime.fromFormat(value, "yyyy-MM-dd", { zone: "local" })
        .toLocaleString(DateTime.DATE_MED);
    }
    if (!isNaN(Date.parse(value))) {
      return DateTime.fromISO(value).toLocaleString(DateTime.DATE_MED);
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "object" && ("value" in v || "label" in v))) {
      return value
        .map((v) => v.value || v.raw?.value || v.name)
        .filter(Boolean)
        .join(", ");
    }
    return value
      .map(
        (v) =>
          v?.value ||
          v?.label ||
          v?.platform ||
          v?.name ||
          v?.raw?.fullName ||
          v?.raw?.name ||
          ""
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    if (value.time && value.timezone) return formatTimeWithZone(value);
    if (value.hours || value.minutes) {
      const h = value.hours ? `${value.hours} hr${value.hours !== "1" ? "s" : ""}` : "";
      const m = value.minutes && value.minutes !== "00" ? `${value.minutes} min` : "";
      return [h, m].filter(Boolean).join(" ");
    }
    if (value.name) return value.name;
    if (value.raw) {
      return (
        value.raw.fullName ||
        value.raw.name ||
        value.raw.productName ||
        value.raw.serviceName ||
        ""
      );
    }
  }

  return String(value);
}

/* ============================================================
   Sorting Helpers – improved for date arrays
============================================================ */
function getSortValue(item, field, fieldConfig) {
  const raw = item.fieldsData?.[field] ?? item[field];

  if (field === "date" || fieldConfig?.type === "date" || fieldConfig?.field === "date") {
    const dates = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const valid = dates
      .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .map((d) => DateTime.fromFormat(d, "yyyy-MM-dd").toJSDate().getTime())
      .filter((t) => !isNaN(t));

    return valid.length > 0 ? Math.min(...valid) : Number.MAX_SAFE_INTEGER;
  }

  const formatted = formatFieldValue(raw, fieldConfig);
  return typeof formatted === "string" ? formatted.toLowerCase() : formatted;
}

function compare(a, b, order) {
  if (a === b) return 0;
  if (a == null || a === Number.MAX_SAFE_INTEGER) return 1;
  if (b == null || b === Number.MAX_SAFE_INTEGER) return -1;
  return (a < b ? -1 : 1) * (order === "asc" ? 1 : -1);
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function ListView({
  data = [],
  fields,
  name = "Item",
  displayName = "Item",
  recordType,
  appConfig,
  refreshing,
  onRefresh,
  modes,
  sortBy = "name", // "name" | "date"
  actionsMenu = [],
}) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("read");
  const [selectedItem, setSelectedItem] = useState(null);

  const rawFields = useMemo(() => {
    if (Array.isArray(fields)) return fields;
    if (fields && typeof fields === "object") return Object.values(fields);
    return (
      appConfig?.mainNavigation?.find(
        (r) => r.name?.toLowerCase() === name.toLowerCase()
      )?.fields || []
    );
  }, [fields, appConfig, name]);

  const mappedFields = mapFields(rawFields);

  const displayFields = useMemo(() => {
    return mappedFields
      .filter((f) => f.displayInList !== false)
      .sort((a, b) => (a.display?.order ?? 999) - (b.display?.order ?? 999));
  }, [mappedFields]);

  const filteredData = useMemo(() => {
    let rows = data.filter((item) =>
      displayFields.some((field) => {
        const raw = item.fieldsData?.[field.field] ?? item[field.field];
        return formatFieldValue(raw, field)
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase());
      })
    );

    // Apply sorting
    if (sortBy === "date") {
  // Sort by newest date first
      rows = [...rows].sort((a, b) => {
        const valA = getSortValue(a, "date", { field: "date" });
        const valB = getSortValue(b, "date", { field: "date" });
        return compare(valA, valB, "desc"); // newest → oldest
      });
} else if (sortField) {
      const fieldConfig = displayFields.find((f) => f.field === sortField);
      rows = [...rows].sort((a, b) =>
        compare(
          getSortValue(a, sortField, fieldConfig),
          getSortValue(b, sortField, fieldConfig),
          sortOrder
        )
      );
    } else {
      // Default: alphabetical by primary name
      rows = [...rows].sort((a, b) =>
        getPrimaryText(a).localeCompare(getPrimaryText(b))
      );
    }

    return rows;
  }, [data, displayFields, search, sortField, sortOrder, sortBy]);

  return (
    <TableContainerStyled>
      {/* Header */}
      <Grid
        container
        spacing={2}
        sx={{
          mb: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Grid item xs={12} sm={8} md={6}>
          <SearchField
            size="small"
            placeholder={`Search ${displayName}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm="auto">
          {modes.includes("add") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedItem(null);
                setDrawerMode("add");
                setDrawerOpen(true);
              }}
              disabled={refreshing}
              sx={{ minWidth: 150, whiteSpace: "nowrap" }}
            >
              Add {singularize(displayName)}
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Table */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={60} /> {/* Avatar column */}
              {displayFields.map((field) => (
                <TableCell key={field.field}>
                  <TableSortLabel
                    active={sortField === field.field}
                    direction={sortOrder}
                    onClick={() => {
                      setSortField(field.field);
                      setSortOrder(
                        sortField === field.field && sortOrder === "asc"
                          ? "desc"
                          : "asc"
                      );
                    }}
                  >
                    <b>{humanizeFieldName(field.label || field.field)}</b>
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((item, idx) => {
              const primary = getPrimaryText(item);
              const initials = primary
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const avatar = getAvatarUrl(item);

              return (
                <TableRow
                  key={item._id ?? idx}
                  hover
                  onClick={() => {
                    setSelectedItem(item);
                    setDrawerMode("read");
                    setDrawerOpen(true);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={initials}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: "1rem",
                        }}
                      >
                        {initials}
                      </Box>
                    )}
                  </TableCell>

                  {displayFields.map((field) => {
                    const rawValue = item.fieldsData?.[field.field] ?? item[field.field];
                  const formatted = formatFieldValue(rawValue, field);
                  const isStatus = field.field.toLowerCase() === "status";
                  const isDate = field.field.toLowerCase() === "date";
                  const isActive = field.field === "isActive";
                  const statusColor = isStatus ? getStatusColor(formatted) : null;

                  return (
                    <TableCell key={field.field}>
                      {isActive ? (
                        <Chip
                          label={rawValue ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            backgroundColor: rawValue ? "#4CAF50" : "#F44336",
                            color: "#ffffff",
                            fontWeight: 700,
                          }}
                        />
                      ) : isStatus && statusColor ? (
                        <StatusChip
                          label={formatted}
                          statuscolor={statusColor}
                          size="small"
                        />
                      ) : isDate ? (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "primary.main",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatted || "—"}
                        </Typography>
                      ) : (
                        formatted || "—"
                      )}
                    </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {/* Drawer */}
      {drawerOpen && (
        <ListItemDetail
          open={drawerOpen}
          recordType={recordType || name.toLowerCase()}
          onClose={() => {
            setDrawerOpen(false);
            onRefresh?.();
          }}
          item={selectedItem}
          appConfig={appConfig}
          fields={fields}
          mode={drawerMode}
          name={name}
          modes={modes}
          actionsMenu={actionsMenu}
        />
      )}
    </TableContainerStyled>
  );
}