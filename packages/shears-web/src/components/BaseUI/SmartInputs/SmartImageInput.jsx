import React, { useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import UploadIcon from "@mui/icons-material/Upload";

export default function SmartImageInput({
  label,
  value,
  onChangeText,
  mode = "edit",
  error,
  helperText,
  inputConfig = {}, // ✅ supports accepted file types, max size, etc.
}) {
  const theme = useTheme();
  const fileRef = useRef(null);

  const acceptTypes = inputConfig.accept || "image/*";
  const maxSizeMB = inputConfig.maxSizeMB || 5;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Max size = ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChangeText(reader.result); // ✅ store base64
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => onChangeText("");

  /* -------------------------------------------------------------------------- */
  /* ✅ READ MODE                                                               */
  /* -------------------------------------------------------------------------- */
  if (mode === "read") {
    return (
      <Box sx={{ mb: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 500, color: theme.palette.primary.main }}
        >
          {label}
        </Typography>

        {value ? (
          <Avatar
            src={value}
            variant="rounded"
            sx={{
              width: 120,
              height: 120,
              borderRadius: 2,
              mt: 1,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.disabled, fontStyle: "italic" }}
          >
            No image set
          </Typography>
        )}
      </Box>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* ✅ EDIT MODE                                                               */
  /* -------------------------------------------------------------------------- */
  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        variant="subtitle1"
        sx={{ color: theme.palette.primary.main, fontWeight: 500, mb: 0.5 }}
      >
        {label}
      </Typography>

      {/* If image exists → show preview with delete */}
      {value ? (
        <Box
          sx={{
            position: "relative",
            display: "inline-block",
          }}
        >
          <Avatar
            src={value}
            variant="rounded"
            sx={{
              width: 150,
              height: 150,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />

          <IconButton
            size="small"
            onClick={removeImage}
            sx={{
              position: "absolute",
              top: -10,
              right: -10,
              background: theme.palette.error.main,
              color: "#fff",
              "&:hover": { background: theme.palette.error.dark },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            textAlign: "center",
            borderRadius: 2,
            cursor: "pointer",
            "&:hover": { borderColor: theme.palette.primary.main },
          }}
          onClick={() => fileRef.current?.click()}
        >
          <UploadIcon sx={{ fontSize: 36, opacity: 0.5 }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Click to upload image
          </Typography>
        </Paper>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept={acceptTypes}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {(error || helperText) && (
        <Typography
          variant="caption"
          sx={{
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            mt: 0.5,
            display: "block",
          }}
        >
          {error || helperText}
        </Typography>
      )}
    </Box>
  );
}
