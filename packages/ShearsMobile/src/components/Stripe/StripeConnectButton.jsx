import React, { useContext, useState } from "react";
import { View, Button, Alert, Linking } from "react-native";
import { AuthContext } from "../../../../shears-web/src/context/AuthContext";
import { connectStripeAccount } from "shears-shared/src/Services/Authentication";

export default function StripeConnectButton() {
  const [loading, setLoading] = useState(false);
  const { user, token } = useContext(AuthContext);

  const handleConnect = async () => {
    try {
      setLoading(true);

      const url = await connectStripeAccount(user.userId, token);

      // 🔗 Cross-platform open URL
      await Linking.openURL(url);

    } catch (err) {
      console.error("Stripe connect failed:", err);
      Alert.alert("Error", err?.error || err.message || "Failed to connect Stripe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button
        title={loading ? "Connecting..." : "Connect My Stripe Account"}
        onPress={handleConnect}
        disabled={loading}
      />
    </View>
  );
}
