// UserListView.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
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
import axios from 'axios';
import { BASE_URL } from 'shears-shared/src/config/api';
import { AuthContext } from '../../context/AuthContext';
import { getSubUsers } from 'shears-shared/src/Services/Authentication';
import ListItemDetail from '../BaseUI/ListItemDetail';

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

export default function UserListView({fields, appConfig}) {
  const { user, token } = useContext(AuthContext);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('read');
  const [selectedUser, setSelectedUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------
  // ✅ FETCH SUB-USERS BY subscriberId
  // backend route you will add: GET /v1/users/subusers/:subscriberId
  // ---------------------------------------------------------------------
const fetchUsers = async () => {
  if (!user?.subscriberId || !token) return;
  try {
    setLoading(true);
    const data = await getSubUsers(user.subscriberId, token, appConfig);
    setUsers(data);
  } catch (err) {
    console.error("Error loading subusers:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUsers();
  }, [user]);

  // ---------------------------------------------------------------------
  // ✅ Hardcoded fields for Users
  // ---------------------------------------------------------------------
  const userFields = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role' },
  ];

  // ---------------------------------------------------------------------
  // ✅ Filter + Sort
  // ---------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    let filtered = users.filter((u) =>
      [u.fullName, u.email, u.phone]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      return aVal.localeCompare(bVal) * (sortOrder === 'asc' ? 1 : -1);
    });

    return filtered;
  }, [search, users, sortField, sortOrder]);

  const handleSort = (key) => {
    if (sortField === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortOrder('asc');
    }
  };

  // ---------------------------------------------------------------------
  // ✅ Drawer actions
  // ---------------------------------------------------------------------
  const handleAdd = () => {
    setSelectedUser(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const handleRowClick = (u) => {
    setSelectedUser(u);
    setDrawerMode('read');
    setDrawerOpen(true);
  };

  // ---------------------------------------------------------------------
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
        <Grid xs={12} sm={8}>
          <SearchField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search users..."
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

        <Grid xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={loading}
            sx={{ height: 40 }}
          >
            Add User
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell /> {/* avatar */}
              {userFields.map((field) => (
                <TableCell key={field.key}>
                  <TableSortLabel
                    active={sortField === field.key}
                    direction={sortField === field.key ? sortOrder : 'asc'}
                    onClick={() => handleSort(field.key)}
                  >
                    <b>{field.label}</b>
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredUsers.map((u, idx) => {
              const initials = (u.fullName || '?')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <TableRow
                  key={u._id || idx}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(u)}
                >
                  {/* Avatar */}
                  <TableCell sx={{ py: 1 }}>
                    {u.avatar ? (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1, // square
                          overflow: "hidden",
                          bgcolor: "action.hover",
                        }}
                      >
                        <img
                          src={u.avatar}
                          alt={initials}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </Box>
                    ) : (
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1, // square avatar
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          fontWeight: 600,
                        }}
                      >
                        {initials}
                      </Avatar>
                    )}
                  </TableCell>

                  {/* Data columns */}
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                   <TableCell>{u.role}</TableCell>
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
            fetchUsers();
          }}
          item={selectedUser}
          appConfig={appConfig}      // Users are not based on appConfig fields
          fields={fields}
          mode={drawerMode}
          name="users"
        />
      )}
    </TableContainerStyled>
  );
}
