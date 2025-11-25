import React, { useRef, useState, useContext } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Modal,
  Backdrop,
  CircularProgress,
  Paper,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { capitalizeFirstLetter } from "shears-shared/src/utils/stringHelpers";
import { AuthContext } from "../../../context/AuthContext";
import { uploadUserAvatar } from "shears-shared/src/Services/Authentication";

export default function SmartAvatarInput({
  label,
  user,
  mode = "edit",
}) {
  const fileInputRef = useRef(null);
  const { token, setUser } = useContext(AuthContext);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(user?.avatar || null);

  const displayName =
    user?.fullName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "User";

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const avatarSrc = preview || user?.avatar || null;

  /* ----------------------------------------------------
      HANDLE AVATAR PICK + UPLOAD (matches mobile)
  ---------------------------------------------------- */
  const handlePickImage = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = async () => {
    const base64Preview = reader.result;

    // Temporary preview
    setPreview(base64Preview);

    try {
      setUploading(true);

      // 🔥 Web requires the raw File object
      const formFile = file;

      const result = await uploadUserAvatar(
        user.userId,
        formFile,  // << this must be the raw File object
        token
      );

      setPreview(result.avatar);
      setUser((prev) => ({ ...prev, avatar: result.avatar }));

    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  reader.readAsDataURL(file);
};


  /* ----------------------------------------------------
      READ MODE
  ---------------------------------------------------- */
  if (mode === "read") {
    return (
      <>
        <LoaderOverlay visible={uploading} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            {label}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={avatarSrc || undefined}
              sx={{
                width: 70,
                height: 70,
                fontSize: "28px",
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              {initials}
            </Avatar>

            <Box sx={{ ml: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {displayName}
              </Typography>

              {user?.email && (
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </>
    );
  }

  /* ----------------------------------------------------
      EDIT MODE
  ---------------------------------------------------- */
  return (
    <>
      <LoaderOverlay visible={uploading} />

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={avatarSrc || undefined}
              sx={{
                width: 80,
                height: 80,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontSize: "32px",
              }}
            >
              {initials}
            </Avatar>

            {/* Camera icon overlay */}
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                bgcolor: "background.paper",
                boxShadow: 2,
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <PhotoCameraIcon fontSize="small" />
            </IconButton>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handlePickImage}
            />
          </Box>

          <Box sx={{ ml: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {displayName}
            </Typography>

            {user?.email && (
              <Typography variant="body2" color="text.secondary">
                {capitalizeFirstLetter(user.email)}
              </Typography>
            )}

            {user?.role && (
              <Typography variant="body2" color="text.secondary">
                {capitalizeFirstLetter(user.role)}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}

/* ============================================================================
   🔥 BEAUTIFUL FULL-SCREEN LOADER (Matches React Native Portal + Modal)
============================================================================ */
function LoaderOverlay({ visible }) {
  return (
    <Modal open={visible} closeAfterTransition slots={{ backdrop: Backdrop }}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.45)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <CircularProgress size={48} sx={{ color: "#fff" }} />
          <Typography
            sx={{
              mt: 2,
              color: "#fff",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Updating profile image…
          </Typography>
        </Paper>
      </Box>
    </Modal>
  );
}
