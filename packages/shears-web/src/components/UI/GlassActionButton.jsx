// src/components/UI/GlassActionButton.jsx
import React from "react";
import { IconButton } from "@mui/material";

export default function GlassActionButtonWeb({
  icon,
  onClick,
  color,
  theme,
  size = 40,
}) {
  return (
    <IconButton
      onClick={onClick}
      disableRipple
      disableFocusRipple
      sx={{
        width: size,
        height: size,
        padding: 0,
        borderRadius: "50%",
        flexShrink: 0,
        // ✨ "Glass" look
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.7)",
        border:
          theme.palette.mode === "dark"
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px solid rgba(255,255,255,0.6)",
        backdropFilter: "blur(12px)",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 4px 14px rgba(0,0,0,0.45)"
            : "0 4px 10px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        "&:hover": {
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.16)"
              : "rgba(255,255,255,0.9)",
        },

        "& .MuiSvgIcon-root": {
          fontSize: 20,
          color: color || theme.palette.text.primary,
        },
      }}
    >
      {icon}
    </IconButton>
  );
}
