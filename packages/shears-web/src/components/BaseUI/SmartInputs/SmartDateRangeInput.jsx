import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { DateTime } from 'luxon';

/* ------------------------------------------------------------------
   📅 SmartDateRangeInput (Web) — Fixed version (Option 1)
------------------------------------------------------------------ */
export default function SmartDateRangeInput({
  label = 'Date Range',
  value = [],                    // array of "YYYY-MM-DD" strings
  onChangeText,                  // (newArray: string[]) => void
  mode = 'edit',
  allowSingleDay = true,
  allowMultiDay = true,
}) {
  const theme = useTheme();

  const [rangeMode, setRangeMode] = useState('single');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /* ------------------------------------------------------------------
     Formatters (unchanged)
  ------------------------------------------------------------------ */
  const formatDateDisplay = (isoDate) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    return DateTime.fromFormat(isoDate, 'yyyy-MM-dd', { zone: 'local' })
      .toLocaleString(DateTime.DATE_MED); // e.g. "Feb 12, 2026"
  };

  const getDisplayRange = (dates) => {
    if (!dates?.length) return '—';

    const valid = dates
      .filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();

    if (valid.length === 0) return '—';
    if (valid.length === 1) return formatDateDisplay(valid[0]);

    const start = DateTime.fromFormat(valid[0], 'yyyy-MM-dd');
    const end = DateTime.fromFormat(valid[valid.length - 1], 'yyyy-MM-dd');

    let rangeStr;
    if (start.month === end.month && start.year === end.year) {
      rangeStr = `${start.toFormat('MMM d')} – ${end.toFormat('d, yyyy')}`;
    } else if (start.year === end.year) {
      rangeStr = `${start.toFormat('MMM d')} – ${end.toFormat('MMM d, yyyy')}`;
    } else {
      rangeStr = `${start.toLocaleString(DateTime.DATE_MED)} – ${end.toLocaleString(DateTime.DATE_MED)}`;
    }

    return `${rangeStr} (${valid.length} day${valid.length === 1 ? '' : 's'})`;
  };

  /* ------------------------------------------------------------------
     Sync incoming value → local state + auto-detect mode
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!value || value.length === 0) {
      setStartDate('');
      setEndDate('');
      setRangeMode('single');
      return;
    }

    const sorted = [...value].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    setStartDate(first || '');
    setEndDate(last || '');

    setRangeMode(sorted.length <= 1 ? 'single' : 'range');
  }, [value]);

  /* ------------------------------------------------------------------
     Helper: Propagate full array to parent
  ------------------------------------------------------------------ */
  const propagateToParent = (start, end) => {
    if (!start) {
      onChangeText?.([]);
      return;
    }

    let newValue;

    if (rangeMode === 'single' || !end || start > end) {
      newValue = [start];
    } else {
      const dates = [];
      let current = DateTime.fromFormat(start, 'yyyy-MM-dd');
      const targetEnd = DateTime.fromFormat(end, 'yyyy-MM-dd');

      while (current <= targetEnd) {
        dates.push(current.toFormat('yyyy-MM-dd'));
        current = current.plus({ days: 1 });
      }
      newValue = dates;
    }

    onChangeText?.(newValue);
  };

  /* ------------------------------------------------------------------
     READ MODE (unchanged)
  ------------------------------------------------------------------ */
  if (mode === 'read') {
    return (
      <Box sx={{ my: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
        >
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
            p: 1.5,
            mt: 0.5,
            color: theme.palette.text.primary,
            whiteSpace: 'pre-wrap',
          }}
        >
          {getDisplayRange(value) || (
            <em style={{ color: theme.palette.text.disabled }}>No date selected</em>
          )}
        </Typography>
      </Box>
    );
  }

  /* ------------------------------------------------------------------
     EDIT MODE
  ------------------------------------------------------------------ */
  return (
    <Box sx={{ my: 1 }}>
      <Typography
        variant="subtitle1"
        sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
      >
        {label}
      </Typography>

      {/* Toggle - only shown if both modes are allowed */}
      {allowSingleDay && allowMultiDay && (
        <ToggleButtonGroup
          exclusive
          value={rangeMode}
          onChange={(_, newMode) => {
            if (newMode) {
              setRangeMode(newMode);
              // When switching modes, propagate current selection
              if (newMode === 'single') {
                propagateToParent(startDate, null);
              } else if (newMode === 'range' && startDate && endDate) {
                propagateToParent(startDate, endDate);
              }
            }
          }}
          size="small"
          sx={{ mt: 1.5, mb: 1 }}
        >
          <ToggleButton value="single">Single Day</ToggleButton>
          <ToggleButton value="range">Date Range</ToggleButton>
        </ToggleButtonGroup>
      )}

      {/* Date Inputs */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: rangeMode === 'range' ? 'row' : 'column' },
        }}
      >
        <TextField
          fullWidth
          type="date"
          label={rangeMode === 'single' ? 'Date' : 'Start Date'}
          value={startDate}
          onChange={(e) => {
            const val = e.target.value;
            setStartDate(val);

            // Auto-set end date if start is after current end (common UX)
            if (rangeMode === 'range' && val && (!endDate || val > endDate)) {
              setEndDate(val);
            }

            // Propagate immediately for single mode, or when range is complete
            if (rangeMode === 'single' || (rangeMode === 'range' && endDate && val <= endDate)) {
              propagateToParent(val, endDate);
            }
          }}
          InputLabelProps={{ shrink: true }}
        />

        {rangeMode === 'range' && (
          <TextField
            fullWidth
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => {
              const val = e.target.value;
              setEndDate(val);

              // Auto-set start if end is before current start
              if (val && startDate && val < startDate) {
                setStartDate(val);
              }

              // Propagate only if we now have a valid range
              if (startDate && val && startDate <= val) {
                propagateToParent(startDate, val);
              }
            }}
            InputLabelProps={{ shrink: true }}
          />
        )}
      </Box>

      {/* Live preview in range mode */}
      {rangeMode === 'range' && startDate && endDate && startDate <= endDate && (
        <Typography variant="body2" sx={{ mt: 1.5, color: theme.palette.text.secondary }}>
          {getDisplayRange([startDate, endDate])}
        </Typography>
      )}
    </Box>
  );
}