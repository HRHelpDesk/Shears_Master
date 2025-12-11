import { LiquidGlassView } from "@callstack/liquid-glass";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Portal, Text, useTheme } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { capitalizeFirstLetter } from "shears-shared/src/utils/stringHelpers";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function BottomSheetModal({
  visible,
  onDismiss,
  component: Component,
    height = SCREEN_HEIGHT * 0.92, // << FULL SCREEN FEEL

  ...props
}) {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const showSheet = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT - height,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const hideSheet = (cb) => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => cb && cb());
  };

  useEffect(() => {
    if (visible) showSheet();
    else hideSheet();
  }, [visible]);

  return (
    <Portal>
      {visible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => hideSheet(onDismiss)}
          style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height,
              backgroundColor: theme.colors.surface,
              transform: [{ translateY }],
            },
          ]}
        >
           <View style={styles.headerRow}>
                  <Text style={[styles.pageTitle, { color: theme.colors.primary }]}>{capitalizeFirstLetter(props?.name)}</Text>
                  
                  <TouchableOpacity
                    style={styles.editButton} // absolute positioning
                    onPress={() => hideSheet(onDismiss)}
                  >
                    <LiquidGlassView
                      style={styles.editButtonGlass} // your glass styling
                      tintColor="rgba(255,255,255,0.1)"
                      effect="clear"
                      interactive
                    >
                      <Icon name="close" size={28} color={theme.colors.primary} />
                    </LiquidGlassView>
                  </TouchableOpacity>
                </View>
          {/* Render the component passed in */}
          {Component && <Component {...props} />}
        </Animated.View>
      </KeyboardAvoidingView>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    overflow: "hidden",
  },
   headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    marginHorizontal: 16,
    marginBottom: 20,
  },
  pageTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
   editButton: { position: 'absolute', top: 0, right: 10, zIndex: 2 },
  editButtonGlass: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassButton: {
    width: 20,
    height: 20,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
