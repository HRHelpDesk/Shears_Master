// ListView.jsx
import React, { useState, useMemo } from 'react';
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
  Button,
  Grid,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  humanizeFieldName,
  singularize,
} from 'shears-shared/src/utils/stringHelpers';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import ListItemDetail from './ListItemDetail';

const TableContainerStyled = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
}));

const SearchField = styled(TextField)(({ theme }) => ({
  width: '100%',
  maxWidth: '100%',
  [theme.breakpoints.up('sm')]: { maxWidth: 400 },
}));

// ---------------------------------------------------------------------
// Primary text (for avatar initials)
// ---------------------------------------------------------------------
function getPrimaryText(item) {
  if (item.firstName || item.lastName) {
    return [item.firstName, item.lastName].filter(Boolean).join(' ');
  }

  const nameFields = Object.keys(item).filter((k) =>
    k.toLowerCase().includes('name')
  );
  if (nameFields.length) {
    return nameFields.map((k) => item[k]).filter(Boolean).join(' ');
  }

  const nested = Object.values(item).find(
    (v) =>
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      (v.name ||
        (v.raw && (v.raw.name || v.raw.productName || v.raw.serviceName)))
  );
  if (nested) {
    return (
      nested.name ||
      nested.raw?.name ||
      nested.raw?.productName ||
      nested.raw?.serviceName ||
      ''
    );
  }

  return (
    item.title ||
    item.serviceName ||
    item.description ||
    item.email ||
    'Untitled'
  );
}

// ---------------------------------------------------------------------
// Format field value — NOW MATCHES MOBILE EXACTLY
// ---------------------------------------------------------------------
function formatFieldValue(value, field) {
  if (!value && value !== 0) return '';

  // 1. Array → join first item values with " • "
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (first && typeof first === 'object') {
      // Try to extract .name from array items
      const names = value
        .map((v) => {
          if (v.name) return v.name;
          if (v.raw?.name) return v.raw.name;
          if (v.raw?.productName) return v.raw.productName;
          if (v.raw?.serviceName) return v.raw.serviceName;
          return null;
        })
        .filter(Boolean);
      if (names.length) return names.join(', ');

      return Object.values(first)
        .filter(Boolean)
        .join(' • ');
    }
    return String(first);
  }

  // 2. Object with .name (e.g., property: { name: "Home" })
  if (typeof value === 'object' && value !== null) {
    if (value.name) return value.name;
    if (value.raw?.name) return value.raw.name;
    if (value.raw?.productName) return value.raw.productName;
    if (value.raw?.serviceName) return value.raw.serviceName;
  }

  // 3. Object field with objectConfig (e.g., address)
  if (field.type === 'object' && field.objectConfig && typeof value === 'object') {
    const parts = field.objectConfig
      .map((sub) => {
        const val = value?.[sub.field];
        return val ? `${val} ${sub.label.toLowerCase()}` : null;
      })
      .filter(Boolean);
    return parts.length ? parts.join(' ') : '';
  }

  // 4. Fallback: stringify
  return String(value);
}

// ---------------------------------------------------------------------
export default function ListView({
  data,
  fields,
  name = 'Item',
  appConfig,
  refreshing,
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('read');
  const [selectedItem, setSelectedItem] = useState(null);

  const matchedRoute =
    appConfig?.mainNavigation?.find(
      (r) =>
        r.name?.toLowerCase() === name?.toLowerCase() ||
        r.displayName?.toLowerCase() === name?.toLowerCase()
    ) || {};

  const mappedFields = mapFields(
    fields?.length ? fields : matchedRoute.fields || []
  );
console.log('mapped',mappedFields)
  const resolvedData = Array.isArray(data) ? data : [];

  const displayFields = useMemo(
    () => mappedFields.filter((f) => f.displayInList !== false),
    [mappedFields]
  );

  // -----------------------------------------------------------------
  // Sorting
  // -----------------------------------------------------------------
  const handleSort = (fieldKey) => {
    if (sortField === fieldKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldKey);
      setSortOrder('asc');
    }
  };

  // -----------------------------------------------------------------
  // Filtering + Sorting
  // -----------------------------------------------------------------
  const filteredData = useMemo(() => {
    if (!Array.isArray(resolvedData)) return [];

    // 1. Filter
    let filtered = resolvedData.filter((item) =>
      displayFields.some((field) => {
        const raw = item.fieldsData?.[field.field] ?? '';
        const txt = Array.isArray(raw)
          ? raw.map((v) => v.value ?? '').join(' ')
          : String(raw);
        return txt.toLowerCase().includes(search.toLowerCase());
      })
    );

    // 2. Sort
    if (sortField) {
      const fieldConfig = displayFields.find((f) => f.field === sortField);
      filtered = [...filtered].sort((a, b) => {
        const aVal = a.fieldsData?.[sortField] ?? '';
        const bVal = b.fieldsData?.[sortField] ?? '';

        const aStr = formatFieldValue(aVal, fieldConfig);
        const bStr = formatFieldValue(bVal, fieldConfig);

        return aStr.localeCompare(bStr) * (sortOrder === 'asc' ? 1 : -1);
      });
    }

    return filtered;
  }, [search, resolvedData, displayFields, sortField, sortOrder]);

  // -----------------------------------------------------------------
  // Drawer
  // -----------------------------------------------------------------
  const handleAddClick = () => {
    setSelectedItem(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };
  const handleRowClick = (item) => {
    setSelectedItem(item);
    setDrawerMode('read');
    setDrawerOpen(true);
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <TableContainerStyled
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2, flexShrink: 0 }}
      >
        <Grid size={{ xs: 12, sm: 8, md: 9 }}>
          <SearchField
            fullWidth
            size="small"
            variant="outlined"
            placeholder={`Search ${name}...`}
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

        <Grid size={{ xs: 12, sm: 4, md: 'auto' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            disabled={refreshing}
            sx={{ height: '40px', whiteSpace: 'nowrap' }}
          >
            Add {singularize(name)}
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell /> {/* Avatar */}
              {displayFields.map((field) => (
                <TableCell key={field.field}>
                  <TableSortLabel
                    active={sortField === field.field}
                    direction={sortField === field.field ? sortOrder : 'asc'}
                    onClick={() => handleSort(field.field)}
                  >
                    <b>{humanizeFieldName(field.label || field.field)}</b>
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((item, idx) => {
              const primaryText = getPrimaryText(item.fieldsData ?? item);
              const safePrimary = typeof primaryText === 'string' ? primaryText : '';
              const initials =
                !item.avatar &&
                (safePrimary
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase() || '?');

              return (
                <TableRow
                  key={item._id?.toString() ?? idx}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(item)}
                >
                  {/* Avatar */}
                  <TableCell sx={{ py: 1 }}>
                    {item.avatar ? (
                      <Avatar src={item.avatar} sx={{ width: 40, height: 40 }} />
                    ) : (
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                        }}
                      >
                        {initials}
                      </Avatar>
                    )}
                  </TableCell>

                  {/* Data Cells */}
                  {displayFields.map((field) => {
                    const rawValue = item.fieldsData?.[field.field] ?? '';
                    const displayValue = formatFieldValue(rawValue, field);
                    return (
                      <TableCell key={field.field}>
                        {displayValue}
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
          onClose={() => {
            setDrawerOpen(false);
            if (onRefresh) onRefresh();
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