import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Avatar, useTheme } from "react-native-paper";
import { capitalizeFirstLetter } from "shears-shared/src/utils/stringHelpers";

export default function SmartProfileCard({ user }) {
  const theme = useTheme();

  if (!user) return null;

  const displayName =
    user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "User";

  const initials = displayName
    .split(" ")
    .map((p) => p?.[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2); // limit to 2 characters max

  const hasAvatar = user.avatar && typeof user.avatar === "string";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {/* Avatar */}
      {hasAvatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={[
            styles.avatarImage,
            {
              borderColor: theme.colors.primaryContainer,
              borderWidth: 3,
            },
          ]}
          defaultSource={{ uri: "" }} // prevents broken image flash
        />
      ) : (
        <Avatar.Text
          label={initials}
          size={96}
          labelStyle={{
            color: theme.colors.onPrimary,
            fontWeight: "700",
          }}
          style={{
            backgroundColor: theme.colors.primary,
            elevation: 4,
            shadowColor: theme.colors.shadow || "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        />
      )}

      {/* Name */}
      <Text
        style={[
          styles.name,
          {
            color: theme.colors.onSurface,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayName}
      </Text>

      {/* Role / Email fallback */}
      <Text
        style={[
          styles.role,
          {
            color: theme.colors.onSurfaceVariant,
          },
        ]}
      >
        {user.role
          ? capitalizeFirstLetter(user.role)
          : user.email || "No role assigned"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e0e0e0", // fallback color while loading
  },
  name: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  role: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.85,
  },
});