// src/components/CalendarListViewComponent.jsx
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
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, ChevronLeft } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { humanizeFieldName } from 'shears-shared/src/utils/stringHelpers';
import ListItemDetail from '../BaseUI/ListItemDetail';
import { useNavigate } from 'react-router';

/* ------------------------------------------------------------------
   Styled Components
------------------------------------------------------------------ */
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
  [theme.breakpoints.up('sm')]: {
    maxWidth: 400,
  },
}));

/* ------------------------------------------------------------------
   DATE HELPERS — FIX TIMEZONE SHIFT 100%
------------------------------------------------------------------ */

// ✅ Convert ANY input into YYYY-MM-DD (safe)
const toYMD = (value) => {
  if (!value) return '';

  // already correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (isNaN(d)) return '';

  // ISO → YMD
  return d.toISOString().slice(0, 10);
};

// ✅ Convert YYYY-MM-DD to pretty display without shift
const formatDatePretty = (value) => {
  if (!value) return '';

  // ✅ Handle simple YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);

    // ✅ Construct UTC date to avoid timezone shifts
    const date = new Date(Date.UTC(y, m - 1, d));

    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',   // ✅ CRITICAL — forces correct display
    });
  }

  // ✅ If it's a full ISO timestamp, use the previous safe handler
  const date = new Date(value);
  if (isNaN(date)) return value;

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};


// ✅ Sorting key for YMD date (UTC midnight)
const dateSortKey = (value) => {
  const ymd = toYMD(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return Number.NEGATIVE_INFINITY;

  const [_, y, m, d] = match;
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
};

/* ------------------------------------------------------------------
   Other helpers
------------------------------------------------------------------ */
const formatTime12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  let hour = Number(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${m} ${suffix}`;
};

const renderObjectAsString = (obj, fieldName) => {
  if (!obj) return '';

  // ✅ Direct scalar or string
  if (typeof obj !== 'object') return obj;

  // ✅ TIME FIELD
  if (fieldName === 'time' && obj.startTime) {
    const start = formatTime12(obj.startTime);
    const end = obj.endTime ? ` – ${formatTime12(obj.endTime)}` : '';
    return `${start}${end}`;
  }

  // ✅ DURATION FIELD
  if (fieldName === 'duration' && (obj.hours || obj.minutes)) {
    const h = obj.hours && obj.hours !== '0' ? `${obj.hours}h` : '';
    const m = obj.minutes && obj.minutes !== '0' ? `${obj.minutes}m` : '';
    return [h, m].filter(Boolean).join(' ') || '0m';
  }

  // ✅ ARRAY OF LINKED RECORDS (SERVICES, PRODUCTS, CONTACTS, ETC.)
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '—';

    // ✅ If every item has a name → render names cleanly
    const allHaveName = obj.every(
      (i) => i && typeof i === 'object' && i.name
    );
    if (allHaveName) {
      return obj.map((i) => i.name).join(', ');
    }

    // ✅ Generic fallback for objects with value or label
    const allHaveLabelOrValue = obj.every(
      (i) =>
        i &&
        typeof i === 'object' &&
        (i.label || i.value)
    );

    if (allHaveLabelOrValue) {
      return obj
        .map((i) => {
          if (i.label && i.value) return `${i.label}: ${i.value}`;
          return i.value || i.label || '';
        })
        .filter(Boolean)
        .join(', ');
    }

    // ✅ FINAL fallback for odd arrays
    return obj.map((i) => JSON.stringify(i)).join(', ');
  }

  // ✅ SINGLE LINKED RECORD
  if (obj.name) return obj.name;
  if (obj.label && obj.value) return `${obj.label}: ${obj.value}`;

  // ✅ Generic object fallback
  return Object.values(obj)
    .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
    .join(', ');
};


/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------ */
export default function CalendarListView({
  data = [],
  appConfig,
  name = 'Calendar',
  refreshing = false,
  onRefresh,
  fields,
  backButton = false,
  setSelectedDate
}) {
  const {navigate} = useNavigate();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('read');
  const [selectedItem, setSelectedItem] = useState(null);

  const displayFields = [
    { field: 'contact', label: 'Client' },
    { field: 'service', label: 'Service' },
    { field: 'date', label: 'Date' },
    { field: 'time', label: 'Time' },
    { field: 'duration', label: 'Duration' },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  /* --------------------------------------------------------------
     Filtering + Sorting
  -------------------------------------------------------------- */
  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      const fd = item.fieldsData || {};
      const searchTerm = search.toLowerCase();

      const contact = fd.contact?.name?.toLowerCase() || '';
      const service = fd.service?.name?.toLowerCase() || '';
      const date = fd.date?.toLowerCase() || '';

      return (
        contact.includes(searchTerm) ||
        service.includes(searchTerm) ||
        date.includes(searchTerm)
      );
    });

    // ✅ Date-safe sorting
    filtered.sort((a, b) => {
      const aValue = a.fieldsData?.[sortField];
      const bValue = b.fieldsData?.[sortField];

      if (sortField === 'date') {
        const aKey = dateSortKey(aValue);
        const bKey = dateSortKey(bValue);

        if (aKey < bKey) return sortOrder === 'asc' ? -1 : 1;
        if (aKey > bKey) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }

      const aStr = renderObjectAsString(aValue, sortField).toLowerCase();
      const bStr = renderObjectAsString(bValue, sortField).toLowerCase();

      if (aStr < bStr) return sortOrder === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, search, sortField, sortOrder]);

  /* --------------------------------------------------------------
     Row Handlers
  -------------------------------------------------------------- */
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

  /* --------------------------------------------------------------
     Render
  -------------------------------------------------------------- */
  return (
    <TableContainerStyled
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 180px)',
        overflow: 'hidden',
      }}
    >
      {/* Header Section */}
    <Grid
  container
  spacing={2}
  alignItems="center"
  justifyContent="space-between"
  sx={{ mb: 2 }}
>

  {/* Back Button + Search Field INLINE */}
  <Grid item xs={12} sm={8} md={9}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1, // space between back button and search
      }}
    >
      {backButton && (
     <IconButton onClick={() => setSelectedDate(null)}>
        <ChevronLeft />
      </IconButton>
      )}
 

      <SearchField
        fullWidth
        size="small"
        variant="outlined"
        placeholder="Search appointments..."
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
    </Box>
  </Grid>

  {/* Add Appointment Button */}
  <Grid item xs={12} sm={4} md={3}>
    <Button
      fullWidth
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleAddClick}
      disabled={refreshing}
      sx={{ height: "40px", whiteSpace: "nowrap" }}
    >
      Add Appointment
    </Button>
  </Grid>
</Grid>


      {/* Scrollable Table */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>

              {displayFields.map((field) => (
                <TableCell key={field.field}>
                  <TableSortLabel
                    active={sortField === field.field}
                    direction={sortField === field.field ? sortOrder : 'asc'}
                    onClick={() => handleSort(field.field)}
                  >
                    <b>{humanizeFieldName(field.label)}</b>
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((item, index) => {
              const fd = item.fieldsData || {};

              const initials = fd.contact?.name
                ? fd.contact.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : '?';

              return (
                <TableRow key={index} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                  <TableCell>
                    <Avatar>{initials}</Avatar>
                  </TableCell>

                  {displayFields.map((field) => {
                    const rawValue = fd[field.field];
                    let displayValue = renderObjectAsString(rawValue, field.field);

                    if (field.field === 'date' && rawValue)
                      displayValue = formatDatePretty(rawValue);

                    return <TableCell key={field.field}>{displayValue}</TableCell>;
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
          name={'calendar'}
        />
      )}
    </TableContainerStyled>
  );
}
