// src/components/SmartInputs/SmartReadOnlyField.native.js
import React, { useContext, useEffect } from "react";
import { View, Text } from "react-native";
import { useTheme } from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";

export default function SmartReadOnlyField({
  label,
  value,
  defaultValue = "Not set",
  onChangeText,
}) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
useEffect(() => {
    onChangeText(defaultValue);
  }, [defaultValue]);
  const isAdmin =
    user?.role === "admin" ||
    user?.permissions?.includes("admin") ||
    false;

  // Display value or fallback to defaultValue
  const displayValue =
    value != null && value !== "" ? String(value).trim() : defaultValue;

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

      {/* Value or default */}
      <Text
        style={{
          paddingVertical: 6,
          color: theme.colors.onSurface,
          fontSize: 16,
        }}
      >
        {displayValue}
      </Text>

      {/* Admin hint */}
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