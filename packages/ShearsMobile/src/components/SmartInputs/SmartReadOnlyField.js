// src/components/SmartInputs/SmartReadOnlyField.native.js
import React, { useContext } from "react";
import { View, Text } from "react-native";
import { useTheme } from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";

export default function SmartReadOnlyField({ label, value }) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const isAdmin =
    user?.role === "admin" ||
    user?.permissions?.includes("admin") ||
    false;

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Label */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: theme.colors.primary,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>

      {/* Plain text value */}
      <Text
        style={{
          paddingVertical: 6,
          color: theme.colors.onSurface,
          fontSize: 16,
        }}
      >
        {value && value.toString().trim() !== "" ? value.toString() : "Not set"}
      </Text>

      {/* Only show this message for non-admins */}
      {!isAdmin && (
        <Text
          style={{
            marginTop: 4,
            fontSize: 13,
            color: theme.colors.onSurfaceVariant ?? theme.colors.outline,
            fontStyle: "italic",
          }}
        >
          Only admins can adjust this field.
        </Text>
      )}
    </View>
  );
}
