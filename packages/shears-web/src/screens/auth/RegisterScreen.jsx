// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { registerUser } from "../../../../shears-shared/src/Services/Authentication";
import { BASE_URL } from "../../../../shears-shared/src/config/api";
import { getAppHeaders } from "../../../../shears-shared/src/config/appHeaders";

// Dynamic Components
import DynamicField from "./components/DynamicField";
import PasswordField from "./components/PasswordField";
import AddressField from "./components/AddressField";
import { buildUserPayload } from "shears-shared/src/utils/stringHelpers";

const stripePromise = loadStripe(
  "pk_test_51SPNqR1OAQam7tPgFryvj6gCkIICX1ptrBIRX2ni67VXIYOrWr61l4dG2hTBILCVnNEtebdzxVnmLrbkFHQW4bYb002vB3Y8Mp"
);

export default function Register({ appConfig, logo }) {
  const navigate = useNavigate();
  const theme = useTheme();

  const userFields = appConfig?.user?.fields || [];

  /* ---------------------------------------------------------
     BUILD INITIAL FORM STATE FROM SCHEMA
  --------------------------------------------------------- */
  const initialState = {};
  userFields.forEach((f) => {
    if (!f.displayInRegistration) return;

    if (f.type === "object") {
      initialState[f.field] = {};
      f.objectConfig?.forEach((c) => {
        initialState[f.field][c.field] = c.default ?? "";
      });
    } else {
      initialState[f.field] = f.default ?? "";
    }
  });

  const [formData, setFormData] = useState(initialState);

  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  /* ---------------------------------------------------------
     DETERMINE STRIPE CONFIG FROM SCHEMA
  --------------------------------------------------------- */
  const stripeField = userFields.find(
    (f) => f.field === "stripe" && f.displayInRegistration
  );

  const stripeEnabled =
    stripeField && formData?.stripe?.enabled !== false && formData?.stripe;

  const stripeAmount = stripeEnabled ? formData.stripe.amount : null;
  const stripeCurrency = stripeEnabled ? formData.stripe.currency : "usd";
  const stripeDescription = stripeEnabled
    ? formData.stripe.description
    : "Registration Payment";

  /* ---------------------------------------------------------
     STRIPE PAYMENT INTENT
  --------------------------------------------------------- */
  const [clientSecret, setClientSecret] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(!!stripeEnabled);

  useEffect(() => {
    if (!stripeEnabled) return;

    const createPaymentIntent = async () => {
      try {
        const response = await fetch(`${BASE_URL}/v1/stripe/create-payment-intent`, {
          method: "POST",
          headers: {
            ...getAppHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(stripeAmount) || 1000,
            currency: stripeCurrency,
            description: stripeDescription,
          }),
        });

        if (!response.ok) throw new Error("Failed to create payment intent");

        const data = await response.json();

        setClientSecret(data.clientSecret);
      } catch (err) {
        alert("Payment initialization failed.");
      }

      setPaymentLoading(false);
    };

    createPaymentIntent();
  }, [stripeEnabled, stripeAmount, stripeCurrency]);

  /* ---------------------------------------------------------
     BUILD PAYLOAD BASED ON SCHEMA
  --------------------------------------------------------- */
  const buildPayload = () => {
    const payload = {};

    userFields.forEach((f) => {
      if (!f.displayInRegistration) return;

      if (f.type === "object") {
        payload[f.field] = { ...formData[f.field] };
      } else {
        payload[f.field] = formData[f.field];
      }
    });

    return payload;
  };

  /* ---------------------------------------------------------
     FINAL REGISTRATION (CALLED AFTER PAYMENT SUCCESS)
  --------------------------------------------------------- */
  const submitRegistration = async () => {
    console.log(userFields, formData);
  const payload = buildUserPayload(userFields, formData);
console.log("Registration Payload:", payload);  
    try {
      await registerUser(payload);
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      alert(err.message || "Registration failed.");
    }
  };

  /* ---------------------------------------------------------
     STRIPE CHECKOUT FORM
  --------------------------------------------------------- */
  const CheckoutForm = ({ onSuccess }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <PaymentElement />

      <Button
        fullWidth
        variant="contained"
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
        Pay & Register
      </Button>
    </form>
  );

  /* ---------------------------------------------------------
     UI (STYLES PRESERVED)
  --------------------------------------------------------- */
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
          backdropFilter: "blur(12px)",
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
          textAlign="center"
          sx={{ color: theme.palette.text.primary }}
        >
          Create Your Account
        </Typography>

        {/* ==============================
            SECTION: USER INFORMATION
        =============================== */}
        <Typography variant="h6" fontWeight={600}>
          User Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* GRID LAYOUT */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3,
          }}
        >
          {userFields
            .filter((f) => f.displayInRegistration && f.display?.order < 7)
            .sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0))
            .map((field) => {
              const isAddress = field.field.toLowerCase().includes("address");
              const isPassword = field.input === "password";

              if (isAddress)
                return (
                  <Box key={field.field} sx={{ gridColumn: "span 2" }}>
                    <AddressField
                      field={field}
                      value={formData[field.field]}
                      onChange={(v) => updateField(field.field, v)}
                    />
                  </Box>
                );

              if (isPassword)
                return (
                  <Box key={field.field} sx={{ gridColumn: "span 2" }}>
                    <PasswordField
                      field={field}
                      value={formData[field.field]}
                      onChange={(v) => updateField(field.field, v)}
                    />
                  </Box>
                );

              return (
                <Box
                  key={field.field}
                  sx={{ gridColumn: field.fullWidth ? "span 2" : "span 1" }}
                >
                  <DynamicField
                    field={field}
                    value={formData[field.field]}
                    onChange={(v) => updateField(field.field, v)}
                  />
                </Box>
              );
            })}
        </Box>

        {/* ==============================
            SECTION: COMPANY INFORMATION
        =============================== */}
        <Typography variant="h6" fontWeight={600} sx={{ mt: 5 }}>
          Company Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3,
          }}
        >
          {userFields
            .filter(
              (f) =>
                f.displayInRegistration &&
                f.display?.order >= 7 &&
                f.display?.order < 20
            )
            .sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0))
            .map((field) => {
              const isAddress = field.field.toLowerCase().includes("address");

              if (isAddress)
                return (
                  <Box key={field.field} sx={{ gridColumn: "span 2" }}>
                    <AddressField
                      field={field}
                      value={formData[field.field]}
                      onChange={(v) => updateField(field.field, v)}
                    />
                  </Box>
                );

              return (
                <Box
                  key={field.field}
                  sx={{ gridColumn: field.fullWidth ? "span 2" : "span 1" }}
                >
                  <DynamicField
                    field={field}
                    value={formData[field.field]}
                    onChange={(v) => updateField(field.field, v)}
                  />
                </Box>
              );
            })}
        </Box>

        {/* ==============================
            STRIPE PAYMENT SECTION (Dynamic!)
        =============================== */}
        {stripeEnabled && (
          <>
            <Typography variant="h6" fontWeight={600} sx={{ mt: 5 }}>
              Payment Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {paymentLoading ? (
              <Box sx={{ textAlign: "center", my: 3 }}>
                <CircularProgress />
              </Box>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: theme.palette.mode }
                }}
              >
                <CheckoutForm onSuccess={submitRegistration} />
              </Elements>
            ) : (
              <Typography color="error">Payment could not be initialized.</Typography>
            )}
          </>
        )}

        {/* NO PAYMENT REQUIRED */}
        {!stripeEnabled && (
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, py: 1.4 }}
            onClick={submitRegistration}
          >
            Register
          </Button>
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
