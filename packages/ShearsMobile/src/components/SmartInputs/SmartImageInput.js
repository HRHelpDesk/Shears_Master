import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Text, Button, IconButton, useTheme } from "react-native-paper";
import { launchImageLibrary } from "react-native-image-picker";

export default function SmartImageInput({
  label,
  value,
  onChangeText,
  mode = "edit",
  error,
  helperText,
  inputConfig = {},
}) {
  const theme = useTheme();

  const maxSizeMB = inputConfig.maxSizeMB || 5;
  const imageAspect = inputConfig.aspect || null;

  /* ---------------------------------------------------------- */
  /* ✅ Pick Image (Non-Expo)                                    */
  /* ---------------------------------------------------------- */
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
      includeBase64: true,
    });

    if (result.didCancel || !result.assets || !result.assets.length) return;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > maxSizeMB * 1024 * 1024) {
      alert(`File exceeds ${maxSizeMB}MB`);
      return;
    }

    // ✅ store base64
    onChangeText(`data:${asset.type};base64,${asset.base64}`);
  };

  const removeImage = () => onChangeText("");

  /* ---------------------------------------------------------- */
  /* ✅ READ MODE                                                */
  /* ---------------------------------------------------------- */
  if (mode === "read") {
    return (
      <View style={styles.readContainer}>
        <Text
          variant="titleMedium"
          style={[styles.label, { color: theme.colors.primary }]}
        >
          {label}
        </Text>

        {value ? (
          <Image
            source={{ uri: value }}
            style={[
              styles.image,
              imageAspect ? { aspectRatio: imageAspect } : {},
            ]}
          />
        ) : (
          <Text
            style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}
          >
            No image
          </Text>
        )}
      </View>
    );
  }

  /* ---------------------------------------------------------- */
  /* ✅ EDIT MODE                                                */
  /* ---------------------------------------------------------- */
  return (
    <View style={styles.editContainer}>
      <Text
        variant="labelMedium"
        style={[
          styles.label,
          { color: error ? theme.colors.error : theme.colors.text },
        ]}
      >
        {label}
      </Text>

      {/* ✅ Image preview + remove button */}
      {value ? (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: value }}
            style={[
              styles.image,
              imageAspect ? { aspectRatio: imageAspect } : {},
            ]}
          />

          <IconButton
            icon="close"
            size={20}
            iconColor="white"
            style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
            onPress={removeImage}
          />
        </View>
      ) : (
        <Button
          mode="outlined"
          icon="image"
          onPress={pickImage}
          style={{ marginTop: 8 }}
        >
          Upload Image
        </Button>
      )}

      {(error || helperText) && (
        <Text
          variant="bodySmall"
          style={{
            color: error ? theme.colors.error : theme.colors.onSurfaceVariant,
            marginTop: 4,
          }}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readContainer: {
    marginBottom: 12,
  },
  editContainer: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "500",
    marginBottom: 4,
  },
  imageWrapper: {
    marginTop: 6,
    position: "relative",
    width: 150,
    height: 150,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  removeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    borderRadius: 20,
  },
});
