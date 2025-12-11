import React, { useState, useContext } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  IconButton,
  useTheme,
  Portal,
  Dialog,
} from "react-native-paper";

import { launchImageLibrary } from "react-native-image-picker";
import { AuthContext } from "../../context/AuthContext";
import {
  uploadImageBase64,
  deleteImage,
} from "shears-shared/src/Services/Authentication";

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
  const { token } = useContext(AuthContext);

  const maxPhotos = inputConfig.maxPhotos || 5;
  const maxSizeMB = inputConfig.maxSizeMB || 5;
  const aspect = inputConfig.aspect || null;

  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* -----------------------------------------------
     MODE DETECTION (read/view/readonly)
  ----------------------------------------------- */
  const isReadMode =
    typeof mode === "string" &&
    ["read", "view", "display", "readonly"].includes(mode.toLowerCase());

  /* -----------------------------------------------
     NORMALIZE VALUE → [{ url, public_id }]
  ----------------------------------------------- */
  const images = (() => {
    if (!value) return [];

    const arr = Array.isArray(value) ? value : [value];

    return arr
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return { url: item };
        if (item.url) return item;
        return null;
      })
      .filter(Boolean);
  })();

  /* -----------------------------------------------
     UPLOAD IMAGE
  ----------------------------------------------- */
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
      includeBase64: true,
    });

    if (result.didCancel || !result.assets?.length) return;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > maxSizeMB * 1024 * 1024) {
      alert(`Image exceeds ${maxSizeMB}MB`);
      return;
    }

    if (images.length >= maxPhotos) return;

    const base64 = `data:${asset.type};base64,${asset.base64}`;

    try {
      setUploading(true);

      const { url, public_id } = await uploadImageBase64(base64, token);

      onChangeText([...images, { url, public_id }]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* -----------------------------------------------
     DELETE IMAGE
  ----------------------------------------------- */
  const removeImage = async (idx) => {
    const img = images[idx];

    if (img?.public_id) {
      try {
        await deleteImage(img.public_id, token);
      } catch (err) {
        console.error("Cloud delete failed:", err);
      }
    }

    const updated = [...images];
    updated.splice(idx, 1);
    onChangeText(updated);
  };

  /* ===============================================
     ⭐ READ MODE — IDENTICAL TO EDIT MODE LAYOUT
     (just hides delete button + no add button)
  =============================================== */
  if (isReadMode) {
    return (
      <View style={styles.editContainer}>
         <Text
          variant="titleMedium"
          style={[
            styles.label,
            { color: theme.colors.primary }
          ]}
            >
          {label}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.row}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imageWrapper}>
                <TouchableOpacity onPress={() => setPreviewImage(img.url)}>
                  <Image
                    source={{ uri: img.url }}
                    style={[
                      styles.image,
                      aspect ? { aspectRatio: aspect } : {},
                    ]}
                  />
                </TouchableOpacity>
                {/* ❌ NO DELETE BUTTON IN READ MODE */}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* FULL SCREEN PREVIEW */}
      <Portal>
  {previewImage && (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="auto"
    >
      <View
        style={styles.fullscreenOverlay}
        pointerEvents="auto"
      >
        {/* CLOSE BUTTON */}
        <TouchableOpacity
          onPress={() => setPreviewImage(null)}
          style={styles.closeButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* IMAGE */}
        <Image
          source={{ uri: previewImage }}
          style={styles.fullscreenImage}
          resizeMode="contain"
        />
      </View>
    </View>
  )}
</Portal>



      </View>
    );
  }

  /* ===============================================
     EDIT MODE
  =============================================== */
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

      {uploading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 10 }}>Uploading...</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imageWrapper}>
              <TouchableOpacity
                onPress={() => setPreviewImage(img.url)}
                disabled={uploading}
              >
                <Image
                  source={{ uri: img.url }}
                  style={[
                    styles.image,
                    aspect ? { aspectRatio: aspect } : {},
                  ]}
                />
              </TouchableOpacity>

              {/* Show delete button ONLY in edit mode */}
              <IconButton
                icon="close"
                size={20}
                iconColor="white"
                style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                onPress={() => removeImage(idx)}
              />
            </View>
          ))}

          {/* Add new image button ONLY in edit mode */}
          {images.length < maxPhotos && (
            <TouchableOpacity onPress={pickImage} disabled={uploading}>
              <View style={styles.addBox}>
                <IconButton icon="image" size={28} />
                <Text style={{ opacity: 0.6 }}>Add</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {(error || helperText) && (
        <Text
          variant="bodySmall"
          style={{
            color: error
              ? theme.colors.error
              : theme.colors.onSurfaceVariant,
            marginTop: 4,
          }}
        >
          {error || helperText}
        </Text>
      )}

     {/* FULL SCREEN PREVIEW */}
<Portal>
  {previewImage && (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="auto"
    >
      <View
        style={styles.fullscreenOverlay}
        pointerEvents="auto"
      >
        {/* CLOSE BUTTON */}
        <TouchableOpacity
          onPress={() => setPreviewImage(null)}
          style={styles.closeButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* IMAGE */}
        <Image
          source={{ uri: previewImage }}
          style={styles.fullscreenImage}
          resizeMode="contain"
        />
      </View>
    </View>
  )}
</Portal>



    </View>
  );
}

const styles = StyleSheet.create({
  readContainer: {
    marginBottom: 12,
  },
  editContainer: {
    marginBottom: 16,
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
    marginRight: 10,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  addBox: {
    width: 150,
    height: 150,
    marginTop: 6,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    borderRadius: 20,
  },
  loaderOverlay: {
    position: "absolute",
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  fullscreenOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.95)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
  elevation: 99999,
},

closeButton: {
  position: "absolute",
  top: 40,
  right: 20,
  backgroundColor: "rgba(0,0,0,0.6)",
  padding: 12,
  borderRadius: 30,
  zIndex: 100000,
  elevation: 100000,
},

fullscreenImage: {
  width: "100%",
  height: "100%",
},


closeButtonText: {
  color: "#fff",
  fontSize: 22,
  fontWeight: "bold",
},

});
