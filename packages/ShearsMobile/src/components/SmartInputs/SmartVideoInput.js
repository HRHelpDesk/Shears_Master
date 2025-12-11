// src/components/SmartInputs/SmartVideoInput.js
import React, { useState } from "react";
import { View, StyleSheet, TextInput as RNTextInput, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { WebView } from "react-native-webview";

export default function SmartVideoInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode = "edit",
  error,
  helperText
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  /* -----------------------------------------------------------
     Convert YouTube/Vimeo URL → embeddable iframe URL
  ----------------------------------------------------------- */
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
    if (id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  }

  // Vimeo – with hash + mobile controls
  if (url.includes("vimeo.com")) {
    const match = url.match(/vimeo.*\/(\d+)\/?([a-z0-9]+)?/i);
    if (match) {
      const videoId = match[1];
      const hash = match[2] || "";

      // Base URL
      let embedUrl = `https://player.vimeo.com/video/${videoId}`;

      // Add hash for private videos
      const params = new URLSearchParams();
      if (hash) params.set("h", hash);

      // Critical: Force controls on mobile!
      params.set("controls", "1");

      // Optional nice defaults (customize as needed)
      params.set("title", "0");
      params.set("byline", "0");
      params.set("portrait", "0");
      params.set("transparent", "0"); // prevents weird background on some themes

      // Optional: autoplay muted (great for forms)
      // params.set("autoplay", "1");
      // params.set("muted", "1");
      // params.set("loop", "1");
      // params.set("background", "1");

      const queryString = params.toString();
      return queryString ? `${embedUrl}?${queryString}` : embedUrl;
    }
  }

  // Direct MP4
  if (/\.mp4($|\?)/i.test(url)) {
    return url;
  }

  return null;
};
console.log('VALUE:', value);
  const embedUrl = getEmbedUrl(value);

  /* -----------------------------------------------------------
     READ MODE — Show embedded video OR “Not set”
  ----------------------------------------------------------- */
  if (mode === "read") {
    return (
      <View style={styles.readContainer}>
        <Text
          variant="titleMedium"
          style={[styles.label, { color: theme.colors.primary }]}
        >
          {label}
        </Text>

        {embedUrl ? (
  <View style={styles.videoWrapper}>
    <WebView
      key={embedUrl} // forces remount on URL change
      source={{
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                  overflow: hidden;
                  background: black;
                }
                iframe {
                  width: 100% !important;
                  height: 100% !important;
                  border: none;
                }
                /* Critical: Force full player UI on mobile */
                .vp-controls, .vp-title, .vp-sidedock { display: block !important; }
              </style>
            </head>
            <body>
              <iframe
                src="${embedUrl}?controls=1&title=0&byline=0&portrait=0&transparent=0&autoplay=0"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                webkitallowfullscreen
                mozallowfullscreen
              ></iframe>
            </body>
          </html>
        `,
      }}
      style={styles.video}
      allowsFullscreenVideo={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      originWhitelist={['*']}
      mixedContentMode="compatibility"
      // These two lines are CRUCIAL for proper mobile playback:
      setBuiltInZoomControls={false}
      setDisplayZoomControls={false}
    />
  </View>
) : (
          <Text
            variant="bodyLarge"
            style={[styles.readValue, { color: theme.colors.textLight, fontStyle: "italic" }]}
          >
            Not set
          </Text>
        )}
      </View>
    );
  }

  /* -----------------------------------------------------------
     EDIT MODE — Input for URL
  ----------------------------------------------------------- */
  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary
    : theme.colors.border;

  return (
    <View style={styles.editContainer}>
      <Text
        variant="labelMedium"
        style={[
          styles.label,
          { color: error ? theme.colors.error : theme.colors.text }
        ]}
      >
        {label}
      </Text>

      <RNTextInput
        value={value || ""}
        onChangeText={onChangeText}
        placeholder={placeholder || "Paste video link..."}
        placeholderTextColor={theme.colors.textLight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            borderColor,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
          }
        ]}
      />

      {(helperText || error) && (
        <Text
          variant="bodySmall"
          style={[
            styles.helperText,
            { color: error ? theme.colors.error : theme.colors.textSecondary }
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

/* -----------------------------------------------------------
   Styles
----------------------------------------------------------- */
const styles = StyleSheet.create({
  // READ MODE
  readContainer: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 4 },
  readValue: { lineHeight: 22 },

 videoWrapper: {
  width: "100%",
  aspectRatio: 16 / 9,        // ← replaces fixed height
  borderRadius: 10,
  overflow: "hidden",
  backgroundColor: "#000",
  maxHeight: 400,             // optional: prevent huge videos on large screens
},
  video: {
    width: "100%",
    height: "100%",
  },

  // EDIT MODE
  editContainer: { marginBottom: 16 },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  helperText: { marginTop: 4, marginLeft: 2 },
});
