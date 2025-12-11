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

/* ============================================================
   Styled Components
============================================================ */
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

/* ============================================================
   Avatar Resolver (matches Mobile)
============================================================ */
function getAvatarUrl(item) {
  const fd = item?.fieldsData ?? item;

  return (
    fd?.avatar?.[0]?.url ||
    fd?.raw?.avatar?.[0]?.url ||
    fd?.raw?.avatar ||
    fd?.influencerName?.raw?.avatar || // <-- ADD THIS
    null
  );
}


/* ============================================================
   Primary text for initials (matches Mobile)
============================================================ */
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
        (v.raw &&
          (v.raw.name || v.raw.productName || v.raw.serviceName)))
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

/* ============================================================
   Field formatter (unchanged)
============================================================ */
function formatFieldValue(value, field) {
  if (!value && value !== 0) return '';

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (first && typeof first === 'object') {
      const names = value
        .map((v) => v.name || v.raw?.name || v.raw?.productName || v.raw?.serviceName)
        .filter(Boolean);

      if (names.length) return names.join(', ');

      return Object.values(first).filter(Boolean).join(' • ');
    }
    return String(first);
  }

  if (typeof value === 'object' && value !== null) {
    if (value.name) return value.name;
    if (value.raw?.name) return value.raw.name;
    if (value.raw?.productName) return value.raw.productName;
    if (value.raw?.serviceName) return value.raw.serviceName;
  }

  if (field.type === 'object' && field.objectConfig && typeof value === 'object') {
    const parts = field.objectConfig
      .map((sub) => {
        const val = value?.[sub.field];
        return val ? `${val} ${sub.label.toLowerCase()}` : null;
      })
      .filter(Boolean);
    return parts.length ? parts.join(' ') : '';
  }

  return String(value);
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function ListView({
  data,
  fields,
  name = 'Item',
  displayName= 'Item',
  recordType,
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

    console.log('Matched Route:', matchedRoute);

  const mappedFields = mapFields(
    fields?.length ? fields : matchedRoute.fields || []
  );
  console.log('Mapped Fields:', mappedFields);  

  const resolvedData = Array.isArray(data) ? data : [];

 const displayFields = useMemo(() => {
  return mappedFields.filter((field) => {
    // If explicitly set to false → hide
    if (field.displayInList === false) return false;

    // If explicitly set to true → show
    if (field.displayInList === true) return true;

    // Otherwise → follow mobile rules:
    // Show only if field.display?.order exists
    return field.display?.order !== undefined;
  });
}, [mappedFields]);
  console.log('Display Fields:', displayFields);

  /* ------------------------------------------------------------
     Sort
  ------------------------------------------------------------ */
  const handleSort = (fieldKey) => {
    if (sortField === fieldKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldKey);
      setSortOrder('asc');
    }
  };

  /* ------------------------------------------------------------
     Search + Sort
  ------------------------------------------------------------ */
  const filteredData = useMemo(() => {
    if (!Array.isArray(resolvedData)) return [];

    let filtered = resolvedData.filter((item) =>
      displayFields.some((field) => {
        const raw = item.fieldsData?.[field.field] ?? '';
        const txt = Array.isArray(raw)
          ? raw.map((v) => v.value ?? '').join(' ')
          : String(raw);
        return txt.toLowerCase().includes(search.toLowerCase());
      })
    );

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

  /* ------------------------------------------------------------
     Drawer
  ------------------------------------------------------------ */
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

  /* ------------------------------------------------------------
     Render
  ------------------------------------------------------------ */
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

        <Grid size={{ xs: 12, sm: 4, md: 'auto' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            disabled={refreshing}
            sx={{ height: '40px', whiteSpace: 'nowrap' }}
          >
            {singularize(displayName)}
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
              const initials =
                (primaryText || 'U')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

              const avatarUrl = getAvatarUrl(item);

              return (
                <TableRow
                  key={item._id?.toString() ?? idx}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(item)}
                >
                  {/* Avatar Cell */}
                  <TableCell sx={{ py: 1 }}>
                    {avatarUrl ? (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1, // square
                          overflow: 'hidden',
                          bgcolor: 'action.hover',
                        }}
                      >
                        <img
                          src={avatarUrl}
                          alt={initials}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontWeight: 700,
                          fontSize: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {initials}
                      </Box>
                    )}
                  </TableCell>

                  {/* Data Fields */}
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
          recordType={recordType || name?.toLowerCase()}
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
