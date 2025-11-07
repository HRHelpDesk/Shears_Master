// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { registerUser } from "../../../../shears-shared/src/Services/Authentication";
import { BASE_URL } from "../../../../shears-shared/src/config/api";

// ✅ Stripe publishable key
const stripePromise = loadStripe(
  "pk_test_51SPNqR1OAQam7tPgFryvj6gCkIICX1ptrBIRX2ni67VXIYOrWr61l4dG2hTBILCVnNEtebdzxVnmLrbkFHQW4bYb002vB3Y8Mp"
);

export default function Register({ appConfig, logo }) {
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "owner",
    businessName: "",
    street: "",
    suite: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    membershipPlan: "solo",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /* ======================================================
     ✅ CREATE PAYMENT INTENT WHEN PAGE LOADS
  ====================================================== */
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const amount = formData.membershipPlan === "solo" ? 1000 : 4900;

        const response = await fetch(`${BASE_URL}/v1/stripe/create-payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });

        if (!response.ok) throw new Error("Failed to create payment intent");

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (err) {
        alert("Failed to initialize payment.");
      } finally {
        setPaymentLoading(false);
      }
    };

    createPaymentIntent();
  }, [formData.membershipPlan]);

  /* ======================================================
     ✅ SUBMIT REGISTRATION (called after Stripe payment success)
  ====================================================== */
  const submitRegistration = async () => {
    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        fullName: formData.fullName,
        lastName: formData.lastName,
        password: formData.password,
        phone: formData.phone,
        role: "owner",
        businessName: formData.businessName,
        businessAddress: {
          street1: `${formData.street}${formData.suite ? " Suite " + formData.suite : ""}`,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        membershipPlan: formData.membershipPlan,
      };

      await registerUser(payload);

      alert("User registered successfully!");
      navigate("/login", { replace: true });
    } catch (err) {
      alert(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     ✅ STRIPE CHECKOUT FORM (NO REDIRECT)
  ====================================================== */
  const CheckoutForm = ({ onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event) => {
      event.preventDefault();
      if (!stripe || !elements) return;

      setIsProcessing(true);

      // ✅ NO REDIRECT — handle everything inline
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message);
        setIsProcessing(false);
        return;
      }

      // ✅ Payment success
      if (paymentIntent && paymentIntent.status === "succeeded") {
        await onSuccess();
      }

      setIsProcessing(false);
    };

    return (
      <form onSubmit={handleSubmit}>
        <PaymentElement />

        {errorMessage && (
          <Typography color="error" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          type="submit"
          disabled={isProcessing}
          sx={{
            mt: 2,
            py: 1.4,
            textTransform: "none",
            background: `linear-gradient(
              to right,
              ${theme.palette.primary.main},
              ${theme.palette.secondary.main}
            )`,
          }}
        >
          {isProcessing ? "Processing..." : "Pay & Register"}
        </Button>
      </form>
    );
  };

  /* ======================================================
     ✅ UI MATCHES LOGIN SCREEN EXACTLY
  ====================================================== */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(
          to bottom right,
          ${theme.palette.primary.main},
          ${theme.palette.secondary.main}
        )`,
        p: 2,
      }}
    >
      <Paper
        elevation={theme.palette.mode === "light" ? 6 : 3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 760,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          backdropFilter: theme.palette.mode === "light" ? "blur(12px)" : "none",
        }}
      >
        {/* LOGO */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <img src={logo} alt="logo" style={{ width: 140 }} />
        </Box>

        <Typography
          variant="h5"
          fontWeight={600}
          mb={3}
          sx={{ color: theme.palette.text.primary }}
          textAlign="center"
        >
          Create Your Account
        </Typography>

        {/* ======================= USER INFO ======================= */}
        <Typography variant="h6" fontWeight={600}>
          User Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Email */}
        <TextField
          fullWidth
          label="Email Address"
          name="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          inputProps={{ style: { color: theme.palette.text.primary } }}
        />

        {/* First + Last */}
        <Box sx={{ display: "flex", gap: 3 }}>
          <TextField
            fullWidth
            label="First Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
            inputProps={{ style: { color: theme.palette.text.primary } }}
          />
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
            inputProps={{ style: { color: theme.palette.text.primary } }}
          />
        </Box>

        {/* Password */}
        <TextField
          fullWidth
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          inputProps={{ style: { color: theme.palette.text.primary } }}
        />

        {/* Confirm Password */}
        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          inputProps={{ style: { color: theme.palette.text.primary } }}
        />

        {/* ======================= COMPANY INFO ======================= */}
        <Typography variant="h6" fontWeight={600} sx={{ mt: 5 }}>
          Company Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <TextField
          fullWidth
          label="Company Name"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          inputProps={{ style: { color: theme.palette.text.primary } }}
        />

        {/* Address / Suite */}
        <Box sx={{ display: "flex", gap: 3 }}>
          <TextField
            label="Address"
            name="street"
            value={formData.street}
            onChange={handleChange}
            sx={{ width: "70%" }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
            inputProps={{ style: { color: theme.palette.text.primary } }}
          />

          <TextField
            label="Suite No."
            name="suite"
            value={formData.suite}
            onChange={handleChange}
            sx={{ width: "30%" }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
            inputProps={{ style: { color: theme.palette.text.primary } }}
          />
        </Box>

        {/* City / State / Zip */}
        <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
          <TextField
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            sx={{ width: "50%" }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
            inputProps={{ style: { color: theme.palette.text.primary } }}
          />

          <TextField
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            sx={{ width: "25%" }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
            inputProps={{ style: { color: theme.palette.text.primary } }}
          />

          <TextField
            label="Zip"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            sx={{ width: "25%" }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
            inputProps={{ style: { color: theme.palette.text.primary } }}
          />
        </Box>

        <TextField
          fullWidth
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          inputProps={{ style: { color: theme.palette.text.primary } }}
        />

        {/* ======================= PAYMENT ======================= */}
        <Typography variant="h6" fontWeight={600} sx={{ mt: 5 }}>
          Payment Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {paymentLoading ? (
          <Box sx={{ textAlign: "center", my: 3 }}>
            <CircularProgress />
          </Box>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm onSuccess={submitRegistration} />
          </Elements>
        ) : (
          <Typography color="error">Payment could not be initialized.</Typography>
        )}

        <Typography
          textAlign="center"
          mt={3}
          sx={{ color: theme.palette.text.secondary }}
        >
          Already have an account?{" "}
          <a href="/login" style={{ color: theme.palette.primary.main }}>
            Login here
          </a>
        </Typography>
      </Paper>
    </Box>
  );
}
