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
   Styled Components
============================================================ */
const TableContainerStyled = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  flex: 1,
  display: "flex",
  flexDirection: "column",
}));

const SearchField = styled(TextField)(({ theme }) => ({
  width: "100%",
  maxWidth: 400,
}));

/* ============================================================
   Avatar Resolver
============================================================ */
function getAvatarUrl(item) {
  const fd = item?.fieldsData ?? item;
  return (
    fd?.avatar?.[0]?.url ||
    fd?.raw?.avatar ||
    fd?.influencerName?.raw?.avatar ||
    null
  );
}

/* ============================================================
   Primary Text Resolver
============================================================ */
function getPrimaryText(item) {
  const fd = item?.fieldsData ?? item;

  if (fd.firstName || fd.lastName) {
    return [fd.firstName, fd.lastName].filter(Boolean).join(" ");
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
   🕒 TIME + TIMEZONE → LOCAL (MATCHES SmartTimeTimeZone)
============================================================ */
function formatTimeWithZone(value) {
  if (!value?.time || !value?.timezone) return "";

  try {
    const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [hour, minute] = value.time.split(":").map(Number);

    return DateTime.fromObject(
      { hour, minute },
      { zone: value.timezone }
    )
      .setZone(viewerTZ)
      .toFormat("h:mm a");
  } catch {
    return value.time;
  }
}

/* ============================================================
   Smart Field Formatter
============================================================ */
function formatFieldValue(value, field) {
  if (value == null) return "";

  /* ---------- STRING ---------- */
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    if (!isNaN(Date.parse(value))) {
      return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    return value;
  }

  /* ---------- ARRAY ---------- */
  if (Array.isArray(value)) {
    return value
      .map(
        (v) =>
          v.platform ||
          v.label ||
          v.name ||
          v.raw?.fullName ||
          v.raw?.name
      )
      .filter(Boolean)
      .join(", ");
  }

  /* ---------- OBJECT ---------- */
  if (typeof value === "object") {
    // 🔥 FINAL FIX: time + timezone
    if (value.time && value.timezone) {
      return formatTimeWithZone(value);
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

    if (value.hours || value.minutes) {
      const h = value.hours
        ? `${value.hours} hour${value.hours !== "1" ? "s" : ""}`
        : "";
      const m = value.minutes
        ? `${value.minutes} minute${value.minutes !== "1" ? "s" : ""}`
        : "";
      return [h, m].filter(Boolean).join(" ");
    }

    return Object.values(value)
      .filter((v) => typeof v === "string")
      .join(" ");
  }

  return String(value);
}

/* ============================================================
   Sorting Helpers
============================================================ */
function getSortValue(item, field, fieldConfig) {
  const raw = item.fieldsData?.[field] ?? item[field];

  if (fieldConfig?.type === "date" || fieldConfig?.field === "date") {
    return raw ? new Date(raw).getTime() : 0;
  }

  const formatted = formatFieldValue(raw, fieldConfig);
  return formatted?.toLowerCase?.() ?? formatted;
}

function compare(a, b, order) {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
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
      .sort(
        (a, b) =>
          (a.display?.order ?? 999) - (b.display?.order ?? 999)
      );
  }, [mappedFields]);

  const filteredData = useMemo(() => {
    let rows = data.filter((item) =>
      displayFields.some((field) => {
        const raw = item.fieldsData?.[field.field] ?? item[field.field];
        return formatFieldValue(raw, field)
          .toLowerCase()
          .includes(search.toLowerCase());
      })
    );

    if (sortField) {
      const fieldConfig = displayFields.find((f) => f.field === sortField);
      rows = [...rows].sort((a, b) =>
        compare(
          getSortValue(a, sortField, fieldConfig),
          getSortValue(b, sortField, fieldConfig),
          sortOrder
        )
      );
    }

    return rows;
  }, [data, displayFields, search, sortField, sortOrder]);

  return (
    <TableContainerStyled>
      {/* Header */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={8}>
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

        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedItem(null);
              setDrawerMode("add");
              setDrawerOpen(true);
            }}
            disabled={refreshing}
          >
            {singularize(displayName)}
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell />
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
                >
                  <TableCell>
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={initials}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 4,
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
                          borderRadius: 1,
                          fontWeight: 700,
                        }}
                      >
                        {initials}
                      </Box>
                    )}
                  </TableCell>

                  {displayFields.map((field) => (
                    <TableCell key={field.field}>
                      {formatFieldValue(
                        item.fieldsData?.[field.field] ??
                          item[field.field],
                        field
                      )}
                    </TableCell>
                  ))}
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
        />
      )}
    </TableContainerStyled>
  );
}
