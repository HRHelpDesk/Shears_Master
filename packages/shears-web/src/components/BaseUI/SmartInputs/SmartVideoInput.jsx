// src/components/SmartInputs/SmartVideoInputWeb.jsx
import React from "react";
import { Box, Typography, TextField } from "@mui/material";

/* ---------------------------------------------
   Convert URL → Embeddable version (same logic as mobile)
--------------------------------------------- */
const getEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  url = url.trim();

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let id = "";
    if (url.includes("youtube.com/watch?v=")) {
      id = url.split("v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      id = url.split("youtu.be/")[1]?.split("?")[0];
    }
    if (id) {
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&controls=1`;
    }
  }

  // Vimeo – now supports private videos with hash!
  if (url.includes("vimeo.com")) {
    const match = url.match(/vimeo.*\/(\d+)\/?([a-z0-9]+)?/i);
    if (match) {
      const videoId = match[1];
      const hash = match[2] || "";

      const params = new URLSearchParams({
        controls: "1",
        title: "0",
        byline: "0",
        portrait: "0",
        transparent: "0",
      });

      if (hash) params.set("h", hash);

      return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
    }
  }

  // Direct MP4
  if (/\.mp4($|\?)/i.test(url)) {
    return url;
  }

  return null;
};

export default function SmartVideoInputWeb({
  label,
  value,
  onChangeText,
  placeholder,
  mode = "edit",
  error,
  helperText,
}) {
  const embedUrl = getEmbedUrl(value);

  /* -----------------------------------------------------------
     SHARED VIDEO COMPONENT (used in both read & edit modes)
  ----------------------------------------------------------- */
  const VideoPlayer = ({ height = 300 }) => (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "#000",
        mb: 1,
        boxShadow: 1,
      }}
    >
      {embedUrl?.includes("youtube") || embedUrl?.includes("vimeo") ? (
        <Box
          component="iframe"
          src={embedUrl}
          title="Video preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      ) : embedUrl?.endsWith(".mp4") ? (
        <video
          src={embedUrl}
          controls
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 8,
          }}
        />
      ) : null}
    </Box>
  );

  /* -----------------------------------------------------------
     READ MODE
  ----------------------------------------------------------- */
  if (mode === "read") {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: "primary.main", mb: 1.5 }}
        >
          {label}
        </Typography>

        {!embedUrl ? (
          <Typography variant="body1" sx={{ fontStyle: "italic", color: "text.secondary" }}>
            Not set
          </Typography>
        ) : (
          <VideoPlayer height={340} />
        )}
      </Box>
    );
  }

  /* -----------------------------------------------------------
     EDIT MODE – with live preview
  ----------------------------------------------------------- */
  return (
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        label={label}
        variant="outlined"
        placeholder={placeholder || "Paste YouTube, Vimeo or .mp4 link..."}
        value={value || ""}
        onChange={(e) => onChangeText(e.target.value)}
        error={Boolean(error)}
        helperText={error || helperText || "Supports YouTube, Vimeo (including private), and direct .mp4 links"}
        sx={{ mb: 2 }}
      />

      {/* Live Preview */}
      {embedUrl && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Preview
          </Typography>
          <VideoPlayer height={280} />
        </Box>
      )}
    </Box>
  );
}