import React, { useContext, useEffect } from "react";
import { View, Text, Image } from "react-native";
import { useTheme } from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";

/**
 * SmartAutoUserInput (MOBILE)
 * - Auto attaches logged-in user ONLY in "add" mode
 * - Shows existing user in edit/read mode
 */
export default function SmartAutoUserInput({
  label = "User",
  value,
  onChangeText,
  mode = "read", // expected: "add" | "edit" | "read"
}) {
  const theme = useTheme();
  const { user: currentUser } = useContext(AuthContext);

  /* ------------------------------------------------------------
     🧠 Auto-attach logged-in user ONLY for ADD MODE
------------------------------------------------------------ */
  useEffect(() => {
    if (mode === "add" && !value && typeof onChangeText === "function") {
      console.log("📌 SmartAutoUserInput (MOBILE) auto-attaching current user");

      onChangeText({
        name:
          currentUser?.fullName ||
          `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim(),
        raw: currentUser,
      });
    }
  }, [mode, value, currentUser, onChangeText]);

  /* ------------------------------------------------------------
     🧩 Determine which user to RENDER:
     - ADD MODE → show currentUser
     - EDIT/READ MODE → show value.raw user
------------------------------------------------------------ */
  const displayUser =
    mode === "add" ? currentUser : value?.raw || currentUser;

  const displayName =
    displayUser?.fullName ||
    `${displayUser?.firstName || ""} ${displayUser?.lastName || ""}`.trim() ||
    displayUser?.email ||
    "User";

  const avatarUrl =
    displayUser?.avatar ||
    displayUser?.avatarUrl ||
    null;

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Label */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: theme.colors.primary,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      {/* Box */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          backgroundColor: theme.dark
            ? "rgba(255,255,255,0.05)"
            : theme.colors.surfaceVariant,
        }}
      >
        {/* Avatar */}
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 6,
              marginRight: 12,
            }}
          />
        ) : (
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 6,
              backgroundColor: theme.colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Text
              style={{
                color: theme.colors.onPrimary,
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {displayName?.[0]?.toUpperCase() || "U"}
            </Text>
          </View>
        )}

        {/* User Text */}
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.colors.onSurface,
            }}
          >
            {displayName}
          </Text>

          {displayUser?.email && (
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.onSurfaceVariant,
                marginTop: 2,
              }}
            >
              {displayUser.email}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
