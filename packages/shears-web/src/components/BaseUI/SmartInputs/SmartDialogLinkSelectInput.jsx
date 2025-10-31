import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme, alpha } from '@mui/material/styles';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';

export default function SmartDialogLinkSelectInput({
  label,
  value,
  recordTypeName = 'contacts',
  onChangeText,
  placeholder = 'Select...',
  mode = 'edit',
}) {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  /** Sync displayed text with current value */
  useEffect(() => {
    console.log("label")
        console.log(recordTypeName)

    
    if (value && typeof value === 'object' && value.name) {
      setSearchValue(value.name);
    } else {
      setSearchValue('');
    }
  }, [value]);

  /** Fetch available records */
  const fetchRecords = async (query = '') => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getRecords({
        recordType: recordTypeName.toLowerCase(),
        subscriberId: user.subscriberId,
        userId: user.userId,
        token,
        status: 'active',
      });

      const formatted =
        response?.map((r) => {
          const fields = r.fieldsData || {};
          const nameKeys = Object.keys(fields).filter(
            (key) => key.toLowerCase().includes('name') && fields[key]
          );
          const displayName = nameKeys.length
            ? nameKeys
                .slice(0, 2)
                .map((key) => fields[key])
                .join(' ')
            : '(Unnamed)';
          return { _id: r._id, name: displayName, raw: fields };
        }) || [];

      const filtered = query
        ? formatted.filter((r) =>
            r.name.toLowerCase().includes(query.toLowerCase())
          )
        : formatted;

      setRecords(filtered);
    } catch (err) {
      console.error('Error fetching records:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchRecords();
  }, [open]);

  const handleSelect = (record) => {
    onChangeText(record);
    setSearchValue(record.name);
    setOpen(false);
    setRecords([]);
  };

  /* ----------------------------------------------------------------
     READ MODE
  ---------------------------------------------------------------- */
  if (mode === 'read') {
    return (
      <Box sx={{ my: 1 }}>
        <Typography variant="subtitle2" color="text.primary">
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.grey[100],
            borderRadius: 1,
            p: 1,
            mt: 0.5,
            color: theme.palette.text.primary,
            minHeight: '2.5rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {value?.name ? value.name : <em style={{ color: theme.palette.text.secondary }}>—</em>}
        </Typography>
      </Box>
    );
  }

  /* ----------------------------------------------------------------
     EDIT MODE
  ---------------------------------------------------------------- */
  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="subtitle2" color="text.primary">
        {label}
      </Typography>

      <TextField
        value={searchValue || ''}
        placeholder={placeholder}
        onClick={() => setOpen(true)}
        fullWidth
        variant="outlined"
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end" sx={{ cursor: 'pointer' }}>
              ⌄
            </InputAdornment>
          ),
        }}
        sx={{
          mt: 0.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : theme.palette.background.paper,
            '& fieldset': {
              borderColor: theme.palette.divider,
            },
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: 1,
            },
          },
        }}
      />

      {/* Selection Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          Select {label}
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: 400 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              fetchRecords(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root fieldset': {
                borderColor: theme.palette.divider,
              },
              '& .MuiOutlinedInput-root:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              },
            }}
          />

          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : records.length > 0 ? (
            <List dense>
              {records.map((record) => (
                <ListItem disablePadding key={record._id}>
                  <ListItemButton
                    onClick={() => handleSelect(record)}
                    selected={record._id === value?._id}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.primary.main, 0.2)
                            : alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? alpha(theme.palette.primary.main, 0.3)
                              : alpha(theme.palette.primary.main, 0.12),
                        },
                      },
                    }}
                  >
                    <ListItemText primary={record.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 2 }}
            >
              No results found
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => setOpen(false)} color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
