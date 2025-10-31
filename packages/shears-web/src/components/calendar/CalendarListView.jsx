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
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { humanizeFieldName, singularize } from 'shears-shared/src/utils/stringHelpers';
import ItemDrawer from '../BaseUI/ItemDrawer';
import ListItemDetail from '../BaseUI/ListItemDetail';

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
   Helper Functions
------------------------------------------------------------------ */
const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${suffix}`;
};

const formatDatePretty = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const renderObjectAsString = (obj, fieldName) => {
  if (!obj || typeof obj !== 'object') return obj ?? '';

  if (fieldName === 'time' && obj.startTime) {
    const start = formatTime12(obj.startTime);
    const end = obj.endTime ? ` – ${formatTime12(obj.endTime)}` : '';
    return `${start}${end}`;
  }

  if (fieldName === 'duration' && (obj.hours || obj.minutes)) {
    const h = obj.hours && obj.hours !== '0' ? `${obj.hours}h ` : '';
    const m = obj.minutes && obj.minutes !== '0' ? `${obj.minutes}m` : '';
    return `${h}${m}`.trim() || '0m';
  }

  if (obj.name) return obj.name;
  if (obj.label && obj.value) return `${obj.label}: ${obj.value}`;
  if (Array.isArray(obj))
    return obj
      .map((i) =>
        typeof i === 'object' && i.value ? `${i.label || ''}: ${i.value}` : String(i)
      )
      .join(', ');

  return Object.values(obj).join(', ');
};

/* ------------------------------------------------------------------
   Component
------------------------------------------------------------------ */
export default function CalendarListView({
  data = [],
  appConfig,
  name = 'Calendar',
  refreshing = false,
  onRefresh,
  fields
}) {
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
    console.log("data")


  /* --------------------------------------------------------------
     Filtering + Sorting
  -------------------------------------------------------------- */
  const filteredData = useMemo(() => {
    let filtered = data.filter((item) => {
      const fd = item.fieldsData || {};
      const contactName = fd.contact?.name?.toLowerCase() || '';
      const serviceName = fd.service?.name?.toLowerCase() || '';
      const date = fd.date?.toLowerCase() || '';
      const searchTerm = search.toLowerCase();

      return (
        contactName.includes(searchTerm) ||
        serviceName.includes(searchTerm) ||
        date.includes(searchTerm)
      );
    });

    filtered.sort((a, b) => {
      const aValue = a.fieldsData?.[sortField];
      const bValue = b.fieldsData?.[sortField];
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
        sx={{ mb: 2, flexShrink: 0 }}
      >
        <Grid item xs={12} sm={8} md={9}>
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
        </Grid>

        <Grid item xs={12} sm={4} md="auto">
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            disabled={refreshing}
            sx={{ height: '40px', whiteSpace: 'nowrap' }}
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
                <TableRow
                  key={index}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(item)}
                >
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
      if (onRefresh) onRefresh(); // ✅ Refresh list data when modal closes
    }}
      item={selectedItem}
      appConfig={appConfig}
      fields={fields}
      mode={drawerMode}
      name={data[0].recordType}
      />
)}
    </TableContainerStyled>
  );
}
