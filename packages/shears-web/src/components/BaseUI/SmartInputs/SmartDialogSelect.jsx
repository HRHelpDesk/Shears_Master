// src/components/SmartInputs/DialogSelectInput.jsx
import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";

const INPUT_PADDING = "10px";

export default function DialogSelectInput({
  label,
  value,
  options = [],
  onChangeText,
  placeholder = "Select...",
  allowCustom = true,
  mode = "edit",
  error,
  helperText,
}) {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  /* -------------------------------------------------------------------------- */
  /* ✅ Normalize value consistently (string)                                   */
  /* -------------------------------------------------------------------------- */
  const normalizedValue = useMemo(() => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value.value) return value.value;
    if (typeof value === "object" && value.label) return value.label;
    return "";
  }, [value]);

  /* -------------------------------------------------------------------------- */
  /* ✅ Pick the correct label to show                                         */
  /* -------------------------------------------------------------------------- */
  const displayText = useMemo(() => {
    if (!normalizedValue) return "";

    const match = options.find((opt) => {
      if (typeof opt === "string") return opt === normalizedValue;
      if (typeof opt === "object") return opt.value === normalizedValue;
      return false;
    });

    if (!match) return normalizedValue; // custom value

    return typeof match === "object" ? match.label : match;
  }, [normalizedValue, options]);

  const handleSelect = (val) => {
    if (val === "Other" && allowCustom) {
      setIsCustom(true);
      setCustomValue("");
      return;
    }

    onChangeText(val);
    setOpen(false);
  };

  const handleAddCustom = () => {
    if (!customValue.trim()) return;
    onChangeText(customValue.trim());
    setIsCustom(false);
    setOpen(false);
  };

  /* -------------------------------------------------------------------------- */
  /* ✅ READ MODE                                                               */
  /* -------------------------------------------------------------------------- */
  if (mode === "read") {
    return (
      <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>    
        
          {label}
        </Typography>

        <Typography variant="body1">
          {displayText ? (
            displayText
          ) : (
            <em style={{ color: theme.palette.text.disabled }}>Not set</em>
          )}
        </Typography>
      </Box>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* ✅ EDIT MODE                                                               */
  /* -------------------------------------------------------------------------- */

  const borderColor = error
    ? theme.palette.error.main
    : open
    ? theme.palette.primary.main
    : theme.palette.divider;

  return (
    <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>    
        {label}
      </Typography>

      <Button
        variant="outlined"
        fullWidth
        onClick={() => {
          setOpen(true);
          setIsCustom(false);
        }}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          justifyContent: "space-between",
          textTransform: "none",
          backgroundColor: theme.palette.background.paper,
          color: displayText
            ? theme.palette.text.primary
            : theme.palette.text.disabled,
          borderColor: borderColor,
          borderWidth: open ? "2px" : "1px",
          padding: INPUT_PADDING,
          fontSize: "16px",
          borderRadius: 1,
          minHeight: "45px",
          "&:hover": {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        {displayText || placeholder}
      </Button>

      {(error || helperText) && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
          }}
        >
          {error || helperText}
        </Typography>
      )}

      {/* ============================================================ */}
      {/* ✅ DIALOG */}
      {/* ============================================================ */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setIsCustom(false);
          setCustomValue("");
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select {label}</DialogTitle>

        <DialogContent dividers>
          {!isCustom ? (
            <List>
              {options.map((opt, idx) => {
                const optValue = typeof opt === "object" ? opt.value : opt;
                const optLabel = typeof opt === "object" ? opt.label : opt;

                const isSelected = optValue === normalizedValue;

                return (
                  <ListItemButton
                    key={idx}
                    onClick={() => handleSelect(optValue)}
                    selected={isSelected}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(74,144,226,0.15)"
                            : "rgba(74,144,226,0.08)",
                      },
                    }}
                  >
                    <ListItemText primary={optLabel} />
                  </ListItemButton>
                );
              })}

              {/* ✅ Add "Other" option */}
              {allowCustom && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <ListItemButton onClick={() => handleSelect("Other")}>
                    <AddIcon sx={{ mr: 1 }} />
                    <ListItemText primary="Other" />
                  </ListItemButton>
                </>
              )}
            </List>
          ) : (
            <Box sx={{ p: 1 }}>
              <Typography sx={{ mb: 1.5, fontWeight: 500 }}>
                Enter custom value
              </Typography>

              <TextField
                fullWidth
                autoFocus
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Type your option..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustom();
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setIsCustom(false);
              setOpen(false);
            }}
          >
            Cancel
          </Button>

          {isCustom && (
            <Button
              variant="contained"
              disabled={!customValue.trim()}
              onClick={handleAddCustom}
            >
              Add
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
