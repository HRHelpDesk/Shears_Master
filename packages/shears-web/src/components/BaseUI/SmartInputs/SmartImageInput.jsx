import React, { useRef, useState, useContext } from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  Paper,
  Fade,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

import { AuthContext } from "../../../context/AuthContext";
import {
  uploadImageBase64,
  deleteImage,
} from "shears-shared/src/Services/Authentication";

export default function SmartMultiImageInput({
  label,
  value,
  onChangeText,
  mode = "edit",
  inputConfig = {},
}) {
  const theme = useTheme();
  const { token } = useContext(AuthContext);
  const fileRef = useRef(null);

  /* ----------------------------------------------------------
     NORMALIZE IMAGES
  ---------------------------------------------------------- */
  const images = (() => {
    if (!value) return [];

    const arr = Array.isArray(value) ? value : [value];

    return arr
      .map((item) => {
        if (!item) return null;

        if (typeof item === "string") return { url: item };

        if (item.url) return item;

        return null;
      })
      .filter(Boolean);
  })();

  const maxPhotos = inputConfig.maxPhotos || 5;
  const maxSizeMB = inputConfig.maxSizeMB || 5;
  const aspect = inputConfig.aspect || null;

  const [previewImage, setPreviewImage] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* ----------------------------------------------------------
     UPLOAD FILE (same flow as RN)
  ---------------------------------------------------------- */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Image exceeds ${maxSizeMB}MB`);
      return;
    }

    if (images.length >= maxPhotos) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;

      try {
        setUploading(true);

        const { url, public_id } = await uploadImageBase64(base64, token);

        onChangeText([...images, { url, public_id }]);
      } catch (err) {
        console.error("Web upload failed:", err);
        alert("Image upload failed");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  /* ----------------------------------------------------------
     DELETE IMAGE
  ---------------------------------------------------------- */
  const removeImage = async (idx) => {
    const img = images[idx];

    if (img?.public_id) {
      try {
        await deleteImage(img.public_id, token);
      } catch (err) {
        console.error("Cloud delete failed:", err);
      }
    }

    const updated = [...images];
    updated.splice(idx, 1);
    onChangeText(updated);

    if (previewIndex === idx) closePreview();
  };

  /* ----------------------------------------------------------
     PREVIEW HANDLERS
  ---------------------------------------------------------- */
  const openPreview = (img, index) => {
    setPreviewImage(img.url);
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPreviewIndex(null);
  };

  /* ----------------------------------------------------------
     READ MODE
  ---------------------------------------------------------- */
  const isReadMode =
    ["read", "view", "display", "readonly"].includes(
      (mode || "").toLowerCase()
    );

  if (isReadMode) {
    return (
      <Box sx={{ mb: 2, position: "relative" }}>
  <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>    
          {label}
        </Typography>

        <Box sx={{ display: "flex", overflowX: "auto", gap: 2, pb: 1 }}>
          {images.map((img, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                width: 150,
                height: 150,
                borderRadius: 2,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={() => openPreview(img, idx)}
            >
              <Box
                component="img"
                src={img.url}
                alt=""
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  aspectRatio: aspect || "auto",
                }}
              />
            </Paper>
          ))}
        </Box>

        {/* FULLSCREEN PREVIEW */}
        <Dialog fullScreen open={!!previewImage} onClose={closePreview}>
          <DialogContent
            sx={{
              p: 0,
              bgcolor: "black",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconButton
              onClick={closePreview}
              sx={{
                position: "absolute",
                top: 20,
                right: 20,
                bgcolor: "rgba(0,0,0,0.4)",
              }}
            >
              <CloseIcon sx={{ color: "#fff" }} />
            </IconButton>

            <Box
              component="img"
              src={previewImage}
              alt=""
              sx={{
                maxWidth: "95%",
                maxHeight: "90%",
                objectFit: "contain",
              }}
            />
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  /* ----------------------------------------------------------
     EDIT MODE
  ---------------------------------------------------------- */
  return (
    <Box sx={{ mb: 3, position: "relative" }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {/* ✨ UPLOADING OVERLAY */}
      {uploading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.85)",
            zIndex: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 2,
          }}
        >
          <CircularProgress color="primary" size={48} />
        </Box>
      )}

      <Box sx={{ display: "flex", overflowX: "auto", gap: 2, pb: 1 }}>
        {images.map((img, idx) => (
          <Box
            key={idx}
            sx={{
              width: 150,
              height: 150,
              borderRadius: 2,
              overflow: "hidden",
              position: "relative",
              border: `1px solid ${theme.palette.divider}`,
              cursor: "pointer",
              flexShrink: 0,
            }}
            onClick={() => openPreview(img, idx)}
          >
            <Box
              component="img"
              src={img.url}
              alt=""
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                aspectRatio: aspect || "auto",
              }}
            />

            {/* DELETE BUTTON */}
            <Fade in>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: theme.palette.error.main,
                  color: "#fff",
                  "&:hover": { bgcolor: theme.palette.error.dark },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Fade>
          </Box>
        ))}

        {/* ADD TILE */}
        {images.length < maxPhotos && (
          <Paper
            variant="outlined"
            onClick={() => fileRef.current.click()}
            sx={{
              width: 150,
              height: 150,
              borderRadius: 2,
              border: `2px dashed ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              "&:hover": {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 34, opacity: 0.6 }} />
          </Paper>
        )}
      </Box>

      {/* BROWSER FILE PICKER */}
      <input
        type="file"
        ref={fileRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* FULLSCREEN PREVIEW */}
      <Dialog fullScreen open={!!previewImage} onClose={closePreview}>
        <DialogContent
          sx={{
            p: 0,
            bgcolor: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* CLOSE BUTTON */}
          <IconButton
            onClick={closePreview}
            sx={{
              position: "absolute",
              top: 20,
              right: 20,
              bgcolor: "rgba(0,0,0,0.4)",
            }}
          >
            <CloseIcon sx={{ color: "#fff" }} />
          </IconButton>

          {/* DELETE BUTTON */}
          <IconButton
            onClick={() => removeImage(previewIndex)}
            sx={{
              position: "absolute",
              bottom: 40,
              bgcolor: theme.palette.error.main,
              "&:hover": { bgcolor: theme.palette.error.dark },
            }}
          >
            <CloseIcon sx={{ color: "#fff" }} />
          </IconButton>

          <Box
            component="img"
            src={previewImage}
            alt=""
            sx={{
              maxWidth: "95%",
              maxHeight: "90%",
              objectFit: "contain",
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
