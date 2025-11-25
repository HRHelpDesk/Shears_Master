import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Switch,
  Divider,
  IconButton,
  useTheme,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import QrCodeIcon from "@mui/icons-material/QrCode2";
import MoneyIcon from "@mui/icons-material/AttachMoney";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

import { createManualPaymentIntent } from "shears-shared/src/Services/Authentication";
import { currencyToNumber } from "shears-shared/src/utils/stringHelpers";

import { AuthContext } from "../../../context/AuthContext";

export default function PaymentButtonWeb({
  label = "Pay Now",
  onStatusChange,
  mode = "edit",
  item,
  amount = 0,
  tax = 0,
}) {
  const theme = useTheme();
  const stripe = useStripe();
  const elements = useElements();
  const { user, token } = useContext(AuthContext);

  const venmoQR = user?.preferences?.venmoQR || null;
  const cashappQR = user?.preferences?.cashappQR || null;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("methods");
  const [sendReceipt, setSendReceipt] = useState(true);
  const [method, setMethod] = useState("Cash");

  const [tipSelection, setTipSelection] = useState("0");
  const [customTip, setCustomTip] = useState("");

  const baseAmount = Number(amount) || 0;
  const taxAmount = Number(tax) || 0;
  const tipAmount =
    tipSelection === "custom"
      ? Number(customTip || 0)
      : Number(tipSelection);

  const total = (baseAmount + taxAmount + tipAmount).toFixed(2);

  /* ------------------------------------------------------------
     OPEN / CLOSE
  ------------------------------------------------------------ */
  const openModal = () => {
    if (mode === "read") return;
    setStep("methods");
    setMethod("Cash");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setStep("methods");
    setSendReceipt(true);
    setTipSelection("0");
    setCustomTip("");
  };

  /* ------------------------------------------------------------
     HANDLE PAYMENT METHOD SELECTION
  ------------------------------------------------------------ */
  const handleMethodSelect = (m) => {
    setMethod(m);
    if (m === "Card") setStep("card");
    else setStep("confirm");
  };

  /* ------------------------------------------------------------
     HANDLE CARD PAYMENT (Stripe Elements)
  ------------------------------------------------------------ */
  const handleCardPayment = async () => {
    try {
      if (!stripe || !elements) return;

      // 1) Create Manual Payment Intent on backend
      const numAmount = Math.round(Number(total) * 100);
      const intent = await createManualPaymentIntent({
        amount: numAmount,
        stripeAccountId: user.stripeAccountId,
        token,
      });

      const cardElement = elements.getElement(CardElement);

      // 2) Confirm card payment
      const confirm = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirm.error) {
        console.error("Card payment error:", confirm.error);
        alert(confirm.error.message);
        return;
      }

      if (confirm.paymentIntent?.status === "succeeded") {
        onStatusChange?.({
          status: "Paid",
          method: "credit",
          sendReceipt,
          paymentIntent: confirm.paymentIntent,
        });
        closeModal();
      }
    } catch (err) {
      console.error("Card payment failed:", err);
      alert("Payment failed. Check console.");
    }
  };

  /* ------------------------------------------------------------
     CONFIRM FOR OTHER METHODS
  ------------------------------------------------------------ */
  const handleConfirmNonCard = () => {
    console.log("Non-card payment confirmed");
    onStatusChange?.({
      status: "Paid",
      method: method.toLowerCase(),
      sendReceipt,
    });
    closeModal();
  };

  /* ------------------------------------------------------------
     TIP UI
  ------------------------------------------------------------ */
  const TipSelector = (
    <Box sx={{ my: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Add Tip
      </Typography>

      <ToggleButtonGroup
        exclusive
        value={tipSelection}
        onChange={(e, val) => {
          if (val !== null) setTipSelection(val);
        }}
        fullWidth
        sx={{ mb: tipSelection === "custom" ? 1.5 : 0 }}
      >
        <ToggleButton value="0">None</ToggleButton>
        <ToggleButton value={(amount * 0.1).toFixed(2)}>10%</ToggleButton>
        <ToggleButton value={(amount * 0.15).toFixed(2)}>15%</ToggleButton>
        <ToggleButton value={(amount * 0.2).toFixed(2)}>20%</ToggleButton>
        <ToggleButton value="custom">Custom</ToggleButton>
      </ToggleButtonGroup>

      {tipSelection === "custom" && (
        <TextField
          fullWidth
          placeholder="Custom tip amount"
          value={customTip}
          onChange={(e) => setCustomTip(e.target.value)}
          InputProps={{
            startAdornment: <Typography>$</Typography>,
          }}
        />
      )}
    </Box>
  );

  /* ------------------------------------------------------------
     MODAL UI
  ------------------------------------------------------------ */
  return (
    <>
      <Button
        variant="contained"
        onClick={openModal}
        disabled={mode === "read"}
        sx={{
          background: theme.palette.primary.main,
          mt: 1,
        }}
      >
        {label}
      </Button>

      <Dialog open={open} onClose={closeModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          {step === "methods" && "Select Payment Method"}
          {step === "card" && "Card Payment"}
          {step === "confirm" && `${method} Payment`}
          <IconButton onClick={closeModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* ---------------- METHOD SELECTION ---------------- */}
          {step === "methods" && (
            <>
              <Typography sx={{ mb: 2 }}>
                Total: <strong>${total}</strong>
              </Typography>

              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<MoneyIcon />}
                  onClick={() => handleMethodSelect("Cash")}
                >
                  Cash
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<CreditCardIcon />}
                  onClick={() => handleMethodSelect("Card")}
                >
                  Credit/Debit (Stripe)
                </Button>

                {venmoQR && (
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                    onClick={() => handleMethodSelect("Venmo")}
                  >
                    Venmo
                  </Button>
                )}

                {cashappQR && (
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                    onClick={() => handleMethodSelect("Cash App")}
                  >
                    Cash App
                  </Button>
                )}
              </Stack>

              {TipSelector}
            </>
          )}

          {/* ---------------- CARD PAYMENT ---------------- */}
          {step === "card" && (
            <>
              <Typography sx={{ mb: 1 }}>
                Total: <strong>${total}</strong>
              </Typography>

              {TipSelector}

              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardElement options={{ hidePostalCode: false }} />
              </Box>
            </>
          )}

          {/* ---------------- CONFIRM NON-CARD ---------------- */}
          {step === "confirm" && (
            <>
              <Typography sx={{ mb: 1 }}>
                Total: <strong>${total}</strong>
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                {method === "Venmo" || method === "Cash App"
                  ? "Show your QR code to the customer:"
                  : `Confirm ${method} payment`}
              </Typography>

              {method === "Venmo" && (
                <img
                  src={venmoQR}
                  alt="Venmo QR"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    marginTop: 8,
                    marginBottom: 16,
                  }}
                />
              )}

              {method === "Cash App" && (
                <img
                  src={cashappQR}
                  alt="Cash App QR"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    marginTop: 8,
                    marginBottom: 16,
                  }}
                />
              )}

              {TipSelector}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 2,
                }}
              >
                <Typography>Email receipt to customer?</Typography>
                <Switch
                  checked={sendReceipt}
                  onChange={(e) => setSendReceipt(e.target.checked)}
                />
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {step === "card" && (
            <Button
              variant="contained"
              onClick={handleCardPayment}
              disabled={!stripe}
            >
              Pay ${total}
            </Button>
          )}

          {step === "confirm" && (
            <Button variant="contained" onClick={handleConfirmNonCard}>
              Complete Payment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
