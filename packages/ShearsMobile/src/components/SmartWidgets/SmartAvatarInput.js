import React, { useContext, useState } from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Text, useTheme, Avatar, ActivityIndicator, Portal, Modal } from "react-native-paper";
import { launchImageLibrary } from "react-native-image-picker";
import { capitalizeFirstLetter } from "shears-shared/src/utils/stringHelpers";
import { AuthContext } from "../../context/AuthContext";
import { uploadUserAvatar } from "shears-shared/src/Services/Authentication";

export default function SmartAvatarInput({
  label,
  value,
  onChangeText,
  user,
  mode = "edit",
}) {
  const theme = useTheme();
  const { token, setUser } = useContext(AuthContext);

  const [uploading, setUploading] = useState(false);

  const displayName =
    user?.fullName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "User";

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  /* ----------------------------------------------------
      IMAGE PICKER + UPLOAD USING SHARED API FUNCTION
  ---------------------------------------------------- */
  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.8,
      },
      async (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.error("ImagePicker error: ", response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) return;

        try {
          setUploading(true); // 🔥 Show loader

          // temporary preview
          onChangeText(asset.uri);

          const file = {
            uri: asset.uri,
            type: asset.type || "image/jpeg",
            name: asset.fileName || "avatar.jpg",
          };

          const result = await uploadUserAvatar(user.userId, file, token);

          // Update preview + user context
          onChangeText(result.avatar);
          setUser((prev) => ({ ...prev, avatar: result.avatar }));

        } catch (err) {
          console.error("Avatar upload failed:", err);
        } finally {
          setUploading(false); // 🔥 Hide loader
        }
      }
    );
  };

  /* ------------------------------------------ */
  /* Helper: Image selection logic               */
  /* ------------------------------------------ */
  const getAvatarSource = () => {
    if (user?.avatar) return { uri: user.avatar };
    if (value) return { uri: value };
    return null;
  };

  const avatarSource = getAvatarSource();

  /* ------------------------------------------ */
  /* READ MODE                                  */
  /* ------------------------------------------ */
  if (mode === "read") {
    return (
      <>
        <LoaderOverlay visible={uploading} />

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              color: theme.colors.onSurface,
              marginBottom: 8,
              fontSize: 16,
            }}
          >
            {label}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {avatarSource ? (
              <Image
                source={avatarSource}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: "#ddd",
                }}
              />
            ) : (
              <Avatar.Text
                size={70}
                label={initials}
                style={{ backgroundColor: theme.colors.primary }}
                color={theme.colors.onPrimary}
              />
            )}

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
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 4,
                  }}
                >
                  {user.email}
                </Text>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }

  /* ------------------------------------------ */
  /* EDIT MODE                                  */
  /* ------------------------------------------ */
  return (
    <>
      <LoaderOverlay visible={uploading} />

      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
            {avatarSource ? (
              <Image
                source={avatarSource}
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
                label={initials}
                style={{ backgroundColor: theme.colors.primary }}
                color={theme.colors.onPrimary}
              />
            )}
          </TouchableOpacity>

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
    </>
  );
}

/* --------------------------------------------------
   🔥 BEAUTIFUL FULL-SCREEN UPLOAD OVERLAY
-------------------------------------------------- */
function LoaderOverlay({ visible }) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.45)", // dark dim
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            paddingVertical: 30,
            paddingHorizontal: 40,
            borderRadius: 20,
            alignItems: "center",
            backdropFilter: "blur(10px)",
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 20,
          }}
        >
          <ActivityIndicator
            size="large"
            animating={true}
            color={theme.colors.primary}
          />

          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#fff",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Updating profile image…
          </Text>
        </View>
      </Modal>
    </Portal>
  );
}

