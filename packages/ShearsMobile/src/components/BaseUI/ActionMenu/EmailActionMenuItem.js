// src/components/ActionMenu/EmailActionMenuItem.jsx
import React from "react";
import { Alert, Linking } from "react-native";
import { useTheme, IconButton } from "react-native-paper";

export default function EmailActionMenuItem({ email }) {
  const theme = useTheme();

  if (!email) return null;

  const handlePress = () => {
    Alert.alert(
      "Send Email",
      `Email ${email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          style: "default",
          onPress: () => {
            const url = `mailto:${email}`;
            Linking.openURL(url).catch((err) =>
              console.error("Email open failed:", err)
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <IconButton
      icon="email"
      size={24}
      onPress={handlePress}
      style={{
        backgroundColor: theme.colors.primaryContainer,
        borderRadius: 8,
      }}
      iconColor={theme.colors.onPrimaryContainer}
    />
  );
}
