import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import { launchImageLibrary } from "react-native-image-picker";
import { capitalizeFirstLetter } from "shears-shared/src/utils/stringHelpers";

export default function SmartAvatarInput({
  label,
  value,
  onChangeText,
  user,
  mode = "edit",
}) {
  const theme = useTheme();

  const displayName =
    user?.fullName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "User";

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.error("ImagePicker error: ", response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (asset?.uri) onChangeText(asset.uri);
      }
    );
  };

  /* ------------------------------------------ */
  /* READ MODE                                  */
  /* ------------------------------------------ */
  if (mode === "read") {
    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: theme.colors.onSurface, marginBottom: 8, fontSize: 16 }}>
          {label}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar.Text
            size={70}
            label={displayName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .toUpperCase()}
            style={{ backgroundColor: theme.colors.primary }}
            color={theme.colors.onPrimary}
          />

          <View style={{ marginLeft: 16 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: theme.colors.onSurface,
              }}
            >
              {displayName}
            </Text>

            {user?.email && (
              <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                {user.email}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  /* ------------------------------------------ */
  /* EDIT MODE                                  */
  /* ------------------------------------------ */
  return (
    <View style={{ marginBottom: 20 }}>
     
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
          {value ? (
            <Image
              source={{ uri: value }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#ddd",
              }}
            />
          ) : (
            <Avatar.Text
              size={80}
              label={displayName
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()}
              style={{ backgroundColor: theme.colors.primary }}
              color={theme.colors.onPrimary}
            />
          )}
        </TouchableOpacity>

        {/* User name next to avatar */}
        <View style={{ marginLeft: 18, justifyContent: "center" }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: theme.colors.onSurface,
            }}
          >
            {displayName}
          </Text>

          {user?.email && (
            <Text
              style={{
                fontSize: 15,
                color: theme.colors.onSurfaceVariant,
                marginTop: 4,
              }}
            >
              {capitalizeFirstLetter(user.email)}
            </Text>
          )}
            {user?.role && (
            <Text
              style={{
                fontSize: 15,
                color: theme.colors.onSurfaceVariant,
                marginTop: 4,
              }}
            >
              {capitalizeFirstLetter(user.role)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
