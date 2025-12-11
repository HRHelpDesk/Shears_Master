// ListViewReadOnly.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  InputAdornment,
  Grid
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

import {
  humanizeFieldName,
  singularize
} from "shears-shared/src/utils/stringHelpers";

import { mapFields } from "shears-shared/src/config/fieldMapper";
import ReadOnlyDetail from "./ReadOnlyDetail";

/* styled components from your original */
const TableContainerStyled = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  flex: 1,
  display: "flex",
  flexDirection: "column",
  position: "relative"
}));

const SearchField = styled(TextField)(({ theme }) => ({
  width: "100%",
  maxWidth: "100%",
  [theme.breakpoints.up("sm")]: { maxWidth: 400 }
}));

/* Avatar resolver */
function getAvatarUrl(item) {
  return (
    item?.avatar?.[0]?.url ||
    item?.fieldsData?.avatar?.[0]?.url ||
    item?.raw?.avatar?.[0]?.url ||
    null
  );
}

function getPrimaryText(item) {
  if (item.firstName || item.lastName) {
    return [item.firstName, item.lastName].filter(Boolean).join(" ");
  }
  return (
    item.title ||
    item.name ||
    item.description ||
    item.email ||
    "Untitled"
  );
}

export default function ListViewReadOnly({
  data,
  fields,
  name = "Item",
  appConfig
}) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const resolvedData = Array.isArray(data) ? data : [];
  const mappedFields = mapFields(fields || []);

  const displayFields = useMemo(
    () => mappedFields.filter((f) => f.displayInList !== false),
    [mappedFields]
  );

  /* SORT ----------------------------- */
  const handleSort = (fieldKey) => {
    if (sortField === fieldKey) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(fieldKey);
      setSortOrder("asc");
    }
  };

  /* FILTER + SORT ----------------------------- */
  const filteredData = useMemo(() => {
    let filtered = resolvedData.filter((item) =>
      displayFields.some((field) => {
        const raw = item.fieldsData?.[field.field] ?? "";
        const txt = Array.isArray(raw)
          ? raw.map((v) => v?.value || "").join(" ")
          : String(raw);
        return txt.toLowerCase().includes(search.toLowerCase());
      })
    );

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a.fieldsData?.[sortField] ?? "";
        const bVal = b.fieldsData?.[sortField] ?? "";
        return String(aVal).localeCompare(String(bVal)) *
          (sortOrder === "asc" ? 1 : -1);
      });
    }

    return filtered;
  }, [resolvedData, search, sortField, sortOrder]);

  /* OPEN DETAIL ----------------------------- */
  const openDetail = (item) => {
    setSelectedItem(item.fieldsData ?? item);
    setDetailOpen(true);
  };

  return (
    <TableContainerStyled>
      {/* Search row */}
      <Grid container spacing={2} sx={{ mb: 2, flexShrink: 0 }}>
        <Grid item xs={12} sm={8}>
          <SearchField
            size="small"
            placeholder={`Search ${name}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
      </Grid>

      {/* TABLE */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell />
              {displayFields.map((field) => (
                <TableCell key={field.field}>
                  <TableSortLabel
                    active={sortField === field.field}
                    direction={sortField === field.field ? sortOrder : "asc"}
                    onClick={() => handleSort(field.field)}
                  >
                    {humanizeFieldName(field.label || field.field)}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((item, idx) => {
              const primaryText = getPrimaryText(item.fieldsData ?? item);
              const initials = (primaryText || "U")
                .split(" ")
                .map((p) => p[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              const avatarUrl = getAvatarUrl(item);

              return (
                <TableRow
                  key={item._id || idx}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => openDetail(item)}
                >
                  <TableCell>
                    {avatarUrl ? (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          overflow: "hidden",
                          bgcolor: "action.hover"
                        }}
                      >
                        <img
                          src={avatarUrl}
                          alt={initials}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      </Box>
                    ) : (
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1
                        }}
                      >
                        {initials}
                      </Avatar>
                    )}
                  </TableCell>

                  {displayFields.map((field) => {
                    const raw = item.fieldsData?.[field.field] ?? "";
                    return <TableCell key={field.field}>{String(raw)}</TableCell>;
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {/* READ-ONLY DETAIL MODAL */}
      {detailOpen && selectedItem && (
        <ReadOnlyDetail
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={selectedItem}
          fields={fields}
          name={name}
        />
      )}
    </TableContainerStyled>
  );
}
