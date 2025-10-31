import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Divider,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

export default function SmartDialogSelect({
  label,
  value,
  onChangeText,
  options = [],
  placeholder,
  mode,
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [selectingOther, setSelectingOther] = useState(false);

  const displayLabel =
    options.find((opt) => opt.value === value)?.label || value || '';

  const handleOpen = () => {
    setOpen(true);
    setSelectingOther(false);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectingOther(false);
    setCustomValue('');
  };

  const handleSelect = (selectedValue) => {
    if (selectedValue === 'Other') {
      setSelectingOther(true);
      setCustomValue('');
      return;
    }
    onChangeText(selectedValue);
    handleClose();
  };

  const handleCustomSave = () => {
    if (customValue.trim()) {
      onChangeText(customValue.trim());
      handleClose();
    }
  };

  /* ---------------------------------------
     READ MODE
  --------------------------------------- */
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
          }}
        >
          {displayLabel || <em style={{ color: theme.palette.text.secondary }}>—</em>}
        </Typography>
      </Box>
    );
  }

  /* ---------------------------------------
     EDIT MODE
  --------------------------------------- */
  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="subtitle2" color="text.primary">
        {label}
      </Typography>

      <Button
        variant="outlined"
        fullWidth
        onClick={handleOpen}
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          backgroundColor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.9)
              : theme.palette.background.paper,
          color: theme.palette.text.primary,
          mt: 0.5,
          borderColor: theme.palette.divider,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        {displayLabel || placeholder || `Select ${label}`}
      </Button>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
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

        <DialogContent dividers sx={{ p: 0 }}>
          {!selectingOther ? (
            <List>
              {options.map((opt) => (
                <ListItemButton
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  selected={opt.value === value}
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
                  <ListItemText primary={opt.label} />
                </ListItemButton>
              ))}

              {!options.some((opt) => opt.value === 'Other') && (
                <>
                  <Divider sx={{ borderColor: theme.palette.divider }} />
                  <ListItemButton onClick={() => handleSelect('Other')}>
                    <ListItemText
                      primary="Other"
                      sx={{ color: theme.palette.text.secondary }}
                    />
                  </ListItemButton>
                </>
              )}
            </List>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Enter custom value for {label}:
              </Typography>
              <TextField
                fullWidth
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Type your custom option..."
                autoFocus
                sx={{
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.9)
                      : theme.palette.background.paper,
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
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          {selectingOther && (
            <Button onClick={handleCustomSave} variant="contained" color="primary">
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
