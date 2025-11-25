import React, { useState } from "react";
import { View } from "react-native";
import { Button, Switch, Text, useTheme } from "react-native-paper";
import FullscreenQRModal from "../components/FullscreenQRModal";


export default function PaymentQRCodeScreen({
  amount,
  customer,
  qrUrl,
  type = "Venmo", // or "CashApp"
}) {
  const theme = useTheme();
  const [showQR, setShowQR] = useState(false);
  const [sendReceipt, setSendReceipt] = useState(true);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* ---------- Title ---------- */}
      <Text variant="headlineMedium" style={{ marginBottom: 10 }}>
        {type} Payment
      </Text>

      {/* ---------- Amount ---------- */}
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Amount: <Text style={{ fontWeight: "bold" }}>${amount}</Text>
      </Text>

      {/* ---------- Customer ---------- */}
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Customer: <Text style={{ fontWeight: "bold" }}>{customer}</Text>
      </Text>

      {/* ---------- Send Receipt Toggle ---------- */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <Switch
          value={sendReceipt}
          onValueChange={setSendReceipt}
          color={theme.colors.primary}
        />
        <Text style={{ marginLeft: 10 }}>Send Receipt?</Text>
      </View>

      {/* ---------- Show QR Button ---------- */}
      <Button
        mode="contained"
        onPress={() => setShowQR(true)}
        style={{ padding: 10, borderRadius: 10 }}
      >
        Show {type} QR Code
      </Button>

      <FullscreenQRModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        qrUrl={qrUrl}
        title={`${type} Payment`}
      />
    </View>
  );
}
