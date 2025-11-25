import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Text, Portal } from "react-native-paper";
import {
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import { GlassActionButton } from "../UI/GlassActionButton";

export default function FullscreenQRModal({ visible, onClose, qrUrl, title }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const pinchScale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  if (!visible || !qrUrl) return null;

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      lastScale.current *= nativeEvent.scale;
      baseScale.setValue(lastScale.current);
      pinchScale.setValue(1);
    }
  };

  return (
    <Portal>
  <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>

 {/* BOTTOM-CENTER CLOSE BUTTON */}
<View style={styles.bottomCloseWrapper}>
  <View style={styles.closeButtonBackground}>
    <GlassActionButton
      icon="close"
      onPress={onClose}
      theme={{ colors: { text: "#000", border: "#000" } }}
      color="#000"
    />
  </View>
</View>


    {/* TITLE */}

    {/* ZOOMABLE QR CODE */}
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        width: "90%",
        height: "70%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <PinchGestureHandler
        onGestureEvent={onPinchEvent}
        onHandlerStateChange={onPinchStateChange}
      >
        <Animated.View
          style={{
            transform: [
              { scale: Animated.multiply(baseScale, pinchScale) },
            ],
          }}
        >
          <Image
            source={{ uri: qrUrl }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        </Animated.View>
      </PinchGestureHandler>
    </Animated.View>

  </Animated.View>
</Portal>

  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.99)",
    justifyContent: "center",
    alignItems: "center",
    
    zIndex: 99999,
  },

  qrImage: {
    width: 300,
    height: 300,
  },

  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 10,
    borderRadius: 40,
    zIndex: 100000,
  },

  closeText: {
    color: "#000",
    fontSize: 22,
    fontWeight: "bold",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#fff",
  },
bottomCloseWrapper: {
  position: "absolute",
  bottom: 40,            // <— space above bottom safe area
  alignSelf: "center",   // <— centers it horizontally
  zIndex: 999999,
  elevation: 20,
},

closeButtonBackground: {
  width: 65,
  height: 65,
  borderRadius: 32.5,
  backgroundColor: "rgba(255,255,255,0.35)",
  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#fff",
  shadowOpacity: 0.4,
  shadowRadius: 8,
},



});
