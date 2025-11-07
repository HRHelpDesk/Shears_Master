// src/components/SmartInputs/DialogSelectInput.jsx
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
import { useTheme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';

const INPUT_PADDING = '10px'; // Match PlainTextInput

export default function DialogSelectInput({
  label,
  value,
  onChangeText,
  options = [],
  placeholder,
  mode = 'edit',
  allowCustom = true,
  error,
  helperText,
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [selectingOther, setSelectingOther] = useState(false);

  // Find display label from options
  const displayLabel = Array.isArray(options)
    ? options.find((opt) => {
        const optValue = typeof opt === 'object' ? opt.value : opt;
        return optValue === value;
      })
    : null;

  const displayText = displayLabel
    ? typeof displayLabel === 'object'
      ? displayLabel.label
      : displayLabel
    : value || '';

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

  /* -------------------------------------------------------------------------- */
  /*                                 READ MODE                                  */
  /* -------------------------------------------------------------------------- */
  if (mode === 'read') {
    return (
      <Box sx={{ mb: 0.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: theme.palette.primary.main,
            mb: 0.5,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.primary,
            lineHeight: 1.6,
          }}
        >
          {displayText && displayText.toString().trim() !== '' ? (
            displayText.toString()
          ) : (
            <span style={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}>
              Not set
            </span>
          )}
        </Typography>
      </Box>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 EDIT MODE                                  */
  /* -------------------------------------------------------------------------- */

  const borderColor = error
    ? theme.palette.error.main
    : open
    ? theme.palette.primary.main
    : theme.palette.divider;

  return (
    <Box sx={{ mb: 0.5 }}>
      {/* Label */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          color: error ? theme.palette.error.main : theme.palette.text.primary,
          mb: 0.75,
        }}
      >
        {label}
      </Typography>

      {/* Selector Button */}
      <Button
        variant="outlined"
        fullWidth
        onClick={handleOpen}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          backgroundColor: theme.palette.background.paper,
          color: displayText ? theme.palette.text.primary : theme.palette.text.disabled,
          borderColor: borderColor,
          borderWidth: open ? '2px' : '1px',
          padding: INPUT_PADDING, // Match PlainTextInput padding
          fontSize: '16px',
          borderRadius: 1,
          minHeight: '45px', // Match PlainTextInput height
          
          transition: 'border-color 150ms ease-in-out, border-width 150ms ease-in-out',
          '&:hover': {
            borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
            borderWidth: '1px',
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiButton-endIcon': {
            color: theme.palette.text.disabled,
          },
        }}
      >
        <Box component="span" sx={{ textAlign: 'left', flex: 1 }}>
          {displayText || placeholder || `Select ${label.toLowerCase()}`}
        </Box>
      </Button>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <Typography
          variant="caption"
          sx={{
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            mt: 0.5,
            ml: 0.25,
            display: 'block',
          }}
        >
          {error || helperText}
        </Typography>
      )}

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontWeight: 600,
          }}
        >
          Select {label}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {!selectingOther ? (
            <List sx={{ py: 0 }}>
              {options.map((opt, index) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;

                return (
                  <ListItemButton
                    key={index}
                    onClick={() => handleSelect(optValue)}
                    selected={optValue === value}
                    sx={{
                      borderBottom:
                        index < options.length - 1
                          ? `1px solid ${theme.palette.divider}`
                          : 'none',
                      '&.Mui-selected': {
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(74, 144, 226, 0.15)'
                            : 'rgba(74, 144, 226, 0.08)',
                        '&:hover': {
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(74, 144, 226, 0.2)'
                              : 'rgba(74, 144, 226, 0.12)',
                        },
                      },
                    }}
                  >
                    <ListItemText primary={optLabel} />
                  </ListItemButton>
                );
              })}

              {allowCustom && !options.some((opt) => opt === 'Other' || opt.value === 'Other') && (
                <>
                  <Divider />
                  <ListItemButton
                    onClick={() => handleSelect('Other')}
                    sx={{
                      color: theme.palette.primary.main,
                    }}
                  >
                    <AddIcon sx={{ mr: 1, fontSize: 20 }} />
                    <ListItemText primary="Other" />
                  </ListItemButton>
                </>
              )}
            </List>
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                Enter custom value:
              </Typography>
              <TextField
                fullWidth
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Type your custom option..."
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && customValue.trim()) {
                    handleCustomSave();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px',
                    },
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          {selectingOther && (
            <Button
              onClick={handleCustomSave}
              variant="contained"
              disabled={!customValue.trim()}
              sx={{ textTransform: 'none' }}
            >
              Add
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}