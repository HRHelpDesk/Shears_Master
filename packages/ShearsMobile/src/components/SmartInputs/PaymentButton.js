import React, { useState, useContext } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { Button, Text, useTheme, Portal, Switch } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../../context/AuthContext";
import venmoLogo from "../../assets/images/venmo_icon.png";
import cashappLogo from "../../assets/images/cashapp_icon.png";

import FullscreenQRModal from "../Payment/FullscreenQRModal";
import { GlassActionButton } from "../UI/GlassActionButton";
import StripePaymentModal from "../Payment/StripePaymentModal";
import { BASE_URL } from "shears-shared/src/config/api";

export default function PaymentButton({
  label = "Pay Now",
  onStatusChange,
  mode = "edit",
  item,
  amount = 0,
  tax = 3.0,
}) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const isPaid = item?.payment?.status === "Paid";

  const venmoQR = user?.preferences?.venmoQR || null;
  const cashappQR = user?.preferences?.cashappQR || null;

  const [visible, setVisible] = useState(false);
  const [sheetStep, setSheetStep] = useState("methods");
  const [sendReceipt, setSendReceipt] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrToShow, setQrToShow] = useState(null);
  const [payType, setPayType] = useState("Cash");
  const [showCardModal, setShowCardModal] = useState(false);

  const total = (Number(amount) + Number(tax)).toFixed(2);

  const openSheet = () => {
    if (isPaid) return;
    setSheetStep("methods");
    setVisible(true);
  };

  const closeSheet = () => {
    setVisible(false);
    setSendReceipt(true);
    setQrToShow(null);
    setPayType("Cash");
  };

  const paymentOptions = [
    { key: "cash", label: "Cash", icon: "cash" },
    { key: "credit", label: "Card", icon: "credit-card-outline" },
  ];

  if (venmoQR)
    paymentOptions.push({ key: "venmo", label: "Venmo", image: venmoLogo });

  if (cashappQR)
    paymentOptions.push({
      key: "cashapp",
      label: "Cash App",
      image: cashappLogo,
    });

  const handlePaymentSelect = (method) => {
    switch (method) {
      case "cash":
        setPayType("Cash");
        setSheetStep("confirm");
        break;

      case "credit":
        setShowCardModal(true);
        break;

      case "venmo":
        setPayType("Venmo");
        setQrToShow(venmoQR);
        setSheetStep("confirm");
        break;

      case "cashapp":
        setPayType("Cash App");
        setQrToShow(cashappQR);
        setSheetStep("confirm");
        break;
    }
  };

  return (
    <View style={{ marginVertical: 6 }}>
      <Button
        mode="contained"
        onPress={openSheet}
        disabled={isPaid}
      >
        {isPaid ? "PAID" : label}
      </Button>

      <Portal>
        {visible && (
          <>
            <TouchableOpacity style={styles.backdrop} onPress={closeSheet} />

            <View
              style={[
                styles.sheet,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {sheetStep === "methods" && (
                <>
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Select Payment Method</Text>
                    <Text style={styles.amountText}>Total: ${total}</Text>
                  </View>

                  <View style={styles.grid}>
                    {paymentOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.optionBox,
                          { borderColor: theme.colors.outlineVariant },
                        ]}
                        onPress={() => handlePaymentSelect(opt.key)}
                      >
                        {opt.image ? (
                          <Image
                            source={opt.image}
                            style={{ width: 55, height: 55, marginBottom: 6 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Icon
                            name={opt.icon}
                            size={38}
                            color={theme.colors.primary}
                          />
                        )}

                        <Text style={styles.optionLabel}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ marginTop: 20, alignItems: "center" }}>
                    <GlassActionButton
                      icon="close"
                      onPress={closeSheet}
                      color={theme.colors.onSurface}
                      theme={theme}
                    />
                  </View>
                </>
              )}

              {sheetStep === "confirm" && (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.confirmScrollContent}
                >
                  <View style={styles.confirmHeader}>
                    <Text style={styles.paymentTitle}>{payType} Payment</Text>

                    <View style={styles.priceCard}>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Subtotal</Text>
                        <Text style={styles.priceValue}>
                          ${Number(amount).toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Tax</Text>
                        <Text style={styles.priceValue}>
                          ${Number(tax).toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.priceDivider} />

                      <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${total}</Text>
                      </View>
                    </View>

                    {(payType === "Venmo" || payType === "Cash App") && (
                      <TouchableOpacity
                        style={[
                          styles.squareOption,
                          { borderColor: theme.colors.outlineVariant },
                        ]}
                        onPress={() => setQrModalVisible(true)}
                      >
                        <Image
                          source={payType === "Venmo" ? venmoLogo : cashappLogo}
                          style={{ width: "35%", height: "35%" }}
                          resizeMode="contain"
                        />
                        <Text style={styles.squareLabel}>
                          Show {payType} QR Code
                        </Text>
                      </TouchableOpacity>
                    )}

                    <View style={styles.receiptRow}>
                      <Text style={{ fontSize: 16 }}>
                        Email receipt to customer?
                      </Text>
                      <Switch
                        value={sendReceipt}
                        onValueChange={setSendReceipt}
                        color={theme.colors.primary}
                      />
                    </View>
                  </View>

                  <View style={styles.bottomButtons}>
                    <Button
                      mode="contained"
                      onPress={() => {
                        onStatusChange?.({
                          method: payType.toLowerCase(),
                          status: "Paid",
                          sendReceipt,
                        });
                        closeSheet();
                      }}
                    >
                      Complete {payType} Payment
                    </Button>

                    <Button
                      mode="outlined"
                      onPress={() => setSheetStep("methods")}
                      style={{ marginTop: 10 }}
                    >
                      Back
                    </Button>
                  </View>
                </ScrollView>
              )}
            </View>
          </>
        )}
      </Portal>

      <FullscreenQRModal
        visible={qrModalVisible}
        qrUrl={qrToShow}
        title={`${payType} Payment`}
        onClose={() => setQrModalVisible(false)}
        theme={theme}
      />

      <StripePaymentModal
        visible={showCardModal}
        amount={Math.round(Number(total) * 100)}
        stripeAccountId={user?.stripeAccountId}
        backendUrl={`${BASE_URL}/v1/stripe`}
        onClose={() => {
          setShowCardModal(false);
          closeSheet();
        }}
        onSuccess={(amt, intent) => {
          console.log("Payment successful:", amt, intent);
          onStatusChange?.({
            method: "credit",
            status: "Paid",
            paymentIntent: intent,
            sendReceipt,
          });
          setShowCardModal(false);
          closeSheet();
        }}
        onFailure={(err) => {
          console.log("Payment failed:", err);
          setShowCardModal(false);
        }}
      />
    </View>
  );
}

/* --------------------------------------- */
/* STYLES                                  */
/* --------------------------------------- */

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "75%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    zIndex: 20,
  },
  sheetHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  amountText: {
    fontSize: 16,
    opacity: 0.65,
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionBox: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  optionLabel: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "500",
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    width: "100%",
  },
  confirmScrollContent: {
    paddingBottom: 140,
    alignItems: "center",
  },
  confirmHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  squareOption: {
    width: "45%",
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  squareLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  bottomButtons: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 30,
  },
  paymentTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  priceCard: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 20,
    alignSelf: "stretch",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginVertical: 6,
  },
  priceLabel: {
    fontSize: 16,
    opacity: 0.8,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
});
