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
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useTheme, alpha } from '@mui/material/styles';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';
import FieldActionsForEntry from '../ActionMenu/FieldActionsForEntry'
/* ============================================================
   ✅ Helper: Format special fields dynamically
============================================================ */
const formatLinkedValue = (key, value) => {
  if (!value) return "";

  if (key === "price") {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `$${num.toFixed(2)}`;
  }

  if (key === "duration" && typeof value === "object") {
    const h = value.hours || "0";
    const m = value.minutes || "00";
    return `${h}h ${m}m`;
  }

  return value;
};

/* ============================================================
   ✅ Helper: Determine which fields to display
============================================================ */
const getLinkedDisplayFields = (raw) => {
  if (!raw || typeof raw !== "object") return [];

  const fields = [];

  // ✅ Price
  if (raw.price != null) {
    fields.push({ key: "price", label: "Price", layout: "inline" });
  }

  // ✅ Duration
  if (raw.duration != null) {
    fields.push({ key: "duration", label: "Duration", layout: "inline" });
  }

  // ✅ Phone (mobile behavior)
  if (Array.isArray(raw.phone) && raw.phone.length > 0) {
    fields.push({ key: "phone", label: "Phone", layout: "inline" });
  }

  // ✅ Description (full width)
  if (raw.description) {
    fields.push({ key: "description", label: "Description", layout: "full" });
  }

  return fields;
};

/* ============================================================
   ✅ MAIN COMPONENT
============================================================ */
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
  const [expanded, setExpanded] = useState(false); // ✅ Collapse state
  const [searchValue, setSearchValue] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  /** Sync displayed value */
  useEffect(() => {
    if (value && typeof value === 'object' && value.name) {
      setSearchValue(value.name);
    } else {
      setSearchValue('');
    }
  }, [value]);

  /** Fetch records */
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
            ? nameKeys.slice(0, 2).map((key) => fields[key]).join(' ')
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

  /* ============================================================
   ✅ READ MODE — with collapsible details + phone actions
============================================================ */
if (mode === 'read') {
  const raw = value?.raw || {};
  const fields = getLinkedDisplayFields(raw);

  const compact = fields.filter((f) => f.layout === "inline");
  const fullWidth = fields.filter((f) => f.layout === "full");

  // ✅ Extract phone entry like mobile
  const phoneEntry =
    Array.isArray(raw.phone) && raw.phone.length > 0
      ? raw.phone[0] // { label, value }
      : null;

  return (
    <Box sx={{ my: 1 }}>
      {/* Label */}
      <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>

      {/* Header (click-to-expand) */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          cursor: 'pointer',
          bgcolor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.6)
              : theme.palette.grey[100],
          borderRadius: 1,
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {value?.name || (
            <em style={{ color: theme.palette.text.secondary }}>Not set</em>
          )}
        </Typography>

        <KeyboardArrowDownIcon
          sx={{
            transition: '0.3s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: theme.palette.text.secondary,
          }}
        />
      </Box>

      {/* Collapsible Details */}
      <Collapse in={expanded} timeout={250} unmountOnExit>
        <Box sx={{ mt: 1, pl: 1 }}>
          {/* ✅ Compact fields (Price, Duration, Phone) */}
          {compact.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                mb: fullWidth.length ? 2 : 0,
              }}
            >
              {compact.map((f) => {
                const isPhoneField = f.key === "phone";

                let formattedValue = formatLinkedValue(f.key, raw[f.key]);

                if (isPhoneField && phoneEntry) {
                  formattedValue = phoneEntry.value;
                }

                return (
                  <Box key={f.key} sx={{ flex: "1 1 150px" }}>
                    {/* Small label */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 0.25 }}
                    >
                      {f.label}
                    </Typography>

                    {/* Value + phone action icons */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formattedValue}
                      </Typography>

                      {/* ✅ Inline actions (call, sms, email, maps) */}
                      {isPhoneField && phoneEntry && (
                        <FieldActionsForEntry entry={phoneEntry} />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* ✅ Full-width fields (Description) */}
          {fullWidth.map((f) => (
            <Box key={f.key} sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.25 }}
              >
                {f.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatLinkedValue(f.key, raw[f.key])}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}


  /* ============================================================
     ✅ EDIT MODE
  ============================================================ */
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
          },
        }}
      />

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
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
            sx={{ mb: 2 }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : records.length > 0 ? (
            <List dense>
              {records.map((record) => (
                <ListItem disablePadding key={record._id}>
                  <ListItemButton
                    onClick={() => handleSelect(record)}
                    selected={record._id === value?._id}
                  >
                    <ListItemText primary={record.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
              variant="body2"
              align="center"
              sx={{ mt: 2, color: theme.palette.text.secondary }}
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
