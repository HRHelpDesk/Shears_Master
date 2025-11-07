// src/components/ActionMenu/MapsActionMenuItem.jsx
import React from "react";
import { Alert, Linking, Platform } from "react-native";
import { useTheme, IconButton } from "react-native-paper";

export default function MapsActionMenuItem({ address }) {
  const theme = useTheme();

  if (!address) return null;

  // ✅ Build string from either object or full string
  const addressString =
    typeof address === "string"
      ? address
      : [
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

  if (!addressString) return null;

  const handlePress = () => {
    Alert.alert(
      "Open in Maps",
      addressString,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open",
          style: "default",
          onPress: () => {
            const encoded = encodeURIComponent(addressString);

            const url =
              Platform.OS === "ios"
                ? `http://maps.apple.com/?q=${encoded}`
                : `https://www.google.com/maps/search/?api=1&query=${encoded}`;

            Linking.openURL(url).catch((err) =>
              console.error("Maps open failed:", err)
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <IconButton
      icon="map-marker"
      size={24}
      onPress={handlePress}
      style={{
        backgroundColor: theme.colors.secondaryContainer,
        borderRadius: 8,
      }}
      iconColor={theme.colors.onSecondaryContainer}
    />
  );
}
