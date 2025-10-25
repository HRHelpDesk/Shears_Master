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
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import ItemDrawer from './ItemDrawer';

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
  maxWidth: '100%', // allow full width
  [theme.breakpoints.up('sm')]: {
    maxWidth: 400, // limit width on small+ screens
  },
}));

export default function ListView({ data, fields, name = 'Item', appConfig, refreshing, onRefresh }) {
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

  const mappedFields = mapFields(fields?.length ? fields : matchedRoute.fields || []);
  const resolvedData = Array.isArray(data) ? data : []; // Use data directly, no fallback

  // ✅ Only include fields marked for display in the list
  const displayFields = useMemo(
    () => mappedFields.filter((f) => f.displayInList !== false),
    [mappedFields]
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(resolvedData)) return [];

    let filtered = resolvedData.filter((item) =>
      displayFields.some((field) => {
        const value = item.fieldsData?.[field.field] ?? '';
        // Handle array fields (e.g., email, phone) and scalar fields (e.g., firstName)
        const searchValue = Array.isArray(value)
          ? value.map((v) => v.value || '').join(' ').toLowerCase()
          : String(value).toLowerCase();
        return searchValue.includes(search.toLowerCase());
      })
    );

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a.fieldsData?.[sortField] ?? '';
        const bValue = b.fieldsData?.[sortField] ?? '';
        // Handle array fields for sorting
        const aSortValue = Array.isArray(aValue)
          ? aValue.map((v) => v.value || '').join(' ').toLowerCase()
          : String(aValue).toLowerCase();
        const bSortValue = Array.isArray(bValue)
          ? bValue.map((v) => v.value || '').join(' ').toLowerCase()
          : String(bValue).toLowerCase();
        if (aSortValue < bSortValue) return sortOrder === 'asc' ? -1 : 1;
        if (aSortValue > bSortValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [search, resolvedData, displayFields, sortField, sortOrder]);

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

  return (
    <TableContainerStyled>
      {/* Header */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item xs={12} sm={8} md={9}>
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

        <Grid item xs={12} sm={4} md="auto">
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            disabled={refreshing} // Disable during refresh
            sx={{
              height: '40px',
              whiteSpace: 'nowrap',
            }}
          >
            Add {singularize(name)}
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
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
                    <b>{humanizeFieldName(field.label || field.field)}</b>
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((item, index) => {
              const initials =
                item.fieldsData?.firstName && item.fieldsData?.lastName
                  ? `${item.fieldsData.firstName[0]}${item.fieldsData.lastName[0]}`
                  : '?';
              return (
                <TableRow
                  key={index}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell>
                    <Avatar src={item.avatar}>{!item.avatar && initials}</Avatar>
                  </TableCell>
                  {displayFields.map((field) => {
                    const value = item.fieldsData?.[field.field] ?? '';
                    const displayValue = Array.isArray(value)
                      ? value.map((v) => v.value || '').filter(Boolean).join(', ')
                      : String(value);
                    return <TableCell key={field.field}>{displayValue}</TableCell>;
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Drawer */}
      <ItemDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        item={selectedItem}
        fields={mappedFields}
        appConfig={appConfig}
        name={singularize(name)}
      />
    </TableContainerStyled>
  );
}