// src/components/ActionMenu/PhoneCallActionMenuItem.jsx
import React from 'react';
import { Alert, Linking } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * ✅ PhoneCallActionMenuItem
 * - Renders an icon button
 * - Prompts user for confirmation
 * - Initiates a phone call using Linking API
 */
export default function PhoneCallActionMenuItem({
  phone,
  size = 26,
  color,
  icon = "phone",
  style = {},
}) {
  const theme = useTheme();
  const resolvedColor = color || theme.colors.primary;

  // ✅ Normalize the phone number into digits only
  const normalizePhone = (num) => {
    if (!num) return "";
    return String(num).replace(/[^\d]/g, "");
  };

  const phoneNumber = normalizePhone(phone);

  if (!phoneNumber) {
    console.warn("PhoneCallActionMenuItem: Invalid phone number", phone);
  }

  const handlePress = () => {
    if (!phoneNumber) return;

    Alert.alert(
      "Call Phone Number",
      `Would you like to call\n${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          style: "destructive",
          onPress: async () => {
            try {
              const url = `tel:${phoneNumber}`;
              const supported = await Linking.canOpenURL(url);

              if (!supported) {
                Alert.alert("Error", "Device does not support calling.");
                return;
              }

              Linking.openURL(url);
            } catch (err) {
              console.error("PhoneCallActionMenuItem error:", err);
              Alert.alert("Error", "Could not open the dialer.");
            }
          },
        },
      ],
      { cancelable: true }
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
