import React from "react";
import { Box, Avatar, Typography } from "@mui/material";
import { capitalizeFirstLetter } from "shears-shared/src/utils/stringHelpers";

export default function SmartProfileCard({ user, open }) {
  if (!user) return null;

  const displayName =
    user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim();

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <Box
      sx={{
        textAlign: "center",
        px: open ? 2 : 0,
        py: 3,
        color: "primary.contrastText",
        width: "100%",
        transition: "all .3s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* BIGGER Circular Avatar */}
      <Avatar
        src={user.avatar || undefined}
        sx={{
          width: open ? 100 : 45,
          height: open ? 100 : 45,
          bgcolor: "primary.contrastText",
          color: "primary.main",
          fontSize: open ? "32px" : "16px",
          fontWeight: 700,
          border: "2px solid rgba(255,255,255,0.35)",
          transition: "all .3s ease",
          mb: open ? 1.2 : 0,
        }}
      >
        {initials}
      </Avatar>

      {/* Only show text when drawer is open */}
      {open && (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transition: "opacity .3s ease",
          }}
        >
          {/* Welcome */}
          <Typography
            variant="subtitle2"
            sx={{ opacity: 0.9, fontSize: 13 }}
          >
            Welcome
          </Typography>

          {/* Name */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              lineHeight: 1.1,
              mt: 0.3,
            }}
          >
            {displayName}
          </Typography>

          {/* Role */}
          {user.role && (
            <Typography
              variant="caption"
              sx={{
                opacity: 0.8,
                fontSize: 12,
                mt: 0.3,
              }}
            >
              {capitalizeFirstLetter(user.role)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
