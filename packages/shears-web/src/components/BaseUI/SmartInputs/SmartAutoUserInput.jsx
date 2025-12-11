import React, { useContext, useEffect } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AuthContext } from "../../../context/AuthContext";

export default function SmartAutoUserInput({
  label = "User",
  value,
  onChangeText,
  mode = "read", // "add" | "edit" | "read"
}) {
  const theme = useTheme();
  const { user: currentUser } = useContext(AuthContext);

  /* ------------------------------------------------------------
     🧠 ONLY auto-attach logged-in user when:
       - mode === "add"
       - value is EMPTY
------------------------------------------------------------ */
  useEffect(() => {
    if (mode === "add" && !value && typeof onChangeText === "function") {
      console.log("📌 SmartAutoUserInput auto-attaching current user");
      onChangeText({
        name:
          currentUser?.fullName ||
          `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim(),
        raw: currentUser,
      });
    }
  }, [mode, value, onChangeText, currentUser]);

  /* ------------------------------------------------------------
     📌 Determine which user to DISPLAY:
     - Add mode: show current user
     - Edit/read mode: show value.raw user
------------------------------------------------------------ */
  const displayUser =
    mode === "add" ? currentUser : value?.raw || currentUser;

  const displayName =
    displayUser?.fullName ||
    `${displayUser?.firstName || ""} ${displayUser?.lastName || ""}`.trim() ||
    displayUser?.email ||
    "User";

  const avatarUrl = displayUser?.avatar || displayUser?.avatarUrl || null;

  return (
    <Box sx={{ mb: 2 }}>
      {/* Label */}
      <Typography
        variant="subtitle1"
        sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
      >
        {label}
      </Typography>

      {/* Display User Info */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mt: 1,
          p: 1.5,
          border: "1px solid",
          borderColor: theme.palette.divider,
          borderRadius: 1,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.05)"
              : theme.palette.grey[100],
        }}
      >
        <Avatar
          src={avatarUrl || undefined}
          alt={displayName}
          sx={{
            width: 40,
            height: 40,
            mr: 2,
            bgcolor: theme.palette.primary.main,
          }}
        />

        <Box>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            {displayName}
          </Typography>

          {displayUser?.email && (
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              {displayUser.email}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
