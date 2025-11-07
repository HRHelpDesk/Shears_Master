// src/components/ActionMenu/TextMessageActionMenuItem.jsx
import React from 'react';
import { Alert, Linking } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * ✅ TextMessageActionMenuItem
 * - Renders an icon button
 * - Confirms before sending SMS
 * - Opens the user's SMS app with prefilled number
 */
export default function TextMessageActionMenuItem({
  phone,
  size = 24,
  color,
  icon = "message-text",
  style = {},
  message = "",   // optional pre-filled message
}) {
  const theme = useTheme();
  const resolvedColor = color || theme.colors.primary;

  // ✅ Normalize into numbers only
  const normalizePhone = (num) => {
    if (!num) return "";
    return String(num).replace(/[^\d]/g, "");
  };

  const phoneNumber = normalizePhone(phone);

  if (!phoneNumber) {
    console.warn("TextMessageActionMenuItem: Invalid phone number", phone);
  }

  const handlePress = () => {
    if (!phoneNumber) return;

    Alert.alert(
      "Send Text Message",
      `Would you like to text\n${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Text",
          style: "default",
          onPress: async () => {
            try {
              let url = `sms:${phoneNumber}`;
              if (message) {
                // ✅ Cross-platform: Android uses "body", iOS uses "body" as well
                url += `?body=${encodeURIComponent(message)}`;
              }

              const supported = await Linking.canOpenURL(url);
              if (!supported) {
                Alert.alert("Error", "Device does not support messaging.");
                return;
              }

              Linking.openURL(url);
            } catch (err) {
              console.error("TextMessageActionMenuItem error:", err);
              Alert.alert("Error", "Could not open messaging app.");
            }
          },
        },
      ]
    );
  };

  return (
    <IconButton
      icon={() => <Icon name={icon} size={size} color={resolvedColor} />}
      onPress={handlePress}
      style={style}
    />
  );
}
