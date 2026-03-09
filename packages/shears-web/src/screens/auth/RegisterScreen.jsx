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
  Link,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { registerUser } from "../../../../shears-shared/src/Services/Authentication";
import { BASE_URL } from "../../../../shears-shared/src/config/api";
import { getAppHeaders } from "../../../../shears-shared/src/config/appHeaders";

import DynamicField from "./components/DynamicField";
import PasswordField from "./components/PasswordField";
import AddressField from "./components/AddressField";
import { buildUserPayload } from "shears-shared/src/utils/stringHelpers";

const stripePromise = loadStripe("pk_test_XXXX"); // keep yours

export default function Register({ appConfig, logo }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const userFields = appConfig?.user?.fields || [];

  /* -----------------------------
     INITIAL FORM STATE
  ----------------------------- */
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

  /* -----------------------------
     STRIPE CONFIG
  ----------------------------- */
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

  const [clientSecret, setClientSecret] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(!!stripeEnabled);

  useEffect(() => {
    if (!stripeEnabled) return;

    const createPaymentIntent = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/v1/stripe/create-payment-intent`,
          {
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
          }
        );

        if (!response.ok) throw new Error();

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch {
        alert("Payment initialization failed.");
      }

      setPaymentLoading(false);
    };

    createPaymentIntent();
  }, [stripeEnabled, stripeAmount, stripeCurrency]);

  /* -----------------------------
     REGISTRATION
  ----------------------------- */
  const submitRegistration = async () => {
    const payload = buildUserPayload(userFields, formData);

    try {
      await registerUser(payload);
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      alert(err.message || "Registration failed.");
    }
  };

  /* -----------------------------
     STRIPE FORM
  ----------------------------- */
  const CheckoutForm = () => (
    <form onSubmit={(e) => e.preventDefault()}>
      <PaymentElement />

      <Button
        fullWidth
        variant="contained"
        sx={{
          mt: 2,
          py: 1.4,
          textTransform: "none",
          fontWeight: 600,
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

  /* ==========================================================
     UI
  ========================================================== */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(
          to bottom right,
          ${
            theme.palette.mode === "dark"
              ? theme.palette.primary.dark
              : theme.palette.primary.main
          },
          ${
            theme.palette.mode === "dark"
              ? theme.palette.secondary.dark
              : theme.palette.secondary.main
          }
        )`,
        p: 2,
      }}
    >
      <Paper
        elevation={theme.palette.mode === "dark" ? 0 : 6}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 760,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          border:
            theme.palette.mode === "dark"
              ? `1px solid ${theme.palette.divider}`
              : "none",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 10px 40px rgba(0,0,0,0.6)"
              : theme.shadows[6],
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

        {/* USER SECTION */}
        <Typography variant="h6" fontWeight={600}>
          User Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
            },
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
                  <Box key={field.field} sx={{ gridColumn: "1 / -1" }}>
                    <AddressField
                      field={field}
                      value={formData[field.field]}
                      onChange={(v) => updateField(field.field, v)}
                    />
                  </Box>
                );

              if (isPassword)
                return (
                  <Box key={field.field} sx={{ gridColumn: "1 / -1" }}>
                    <PasswordField
                      field={field}
                      value={formData[field.field]}
                      onChange={(v) => updateField(field.field, v)}
                    />
                  </Box>
                );

              return (
                <DynamicField
                  key={field.field}
                  field={field}
                  value={formData[field.field]}
                  onChange={(v) => updateField(field.field, v)}
                />
              );
            })}
        </Box>

        {/* COMPANY SECTION */}
        <Typography variant="h6" fontWeight={600} sx={{ mt: 5 }}>
          Company Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
            },
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
            .map((field) => (
              <DynamicField
                key={field.field}
                field={field}
                value={formData[field.field]}
                onChange={(v) => updateField(field.field, v)}
              />
            ))}
        </Box>

        {/* STRIPE */}
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
                  appearance: {
                    theme:
                      theme.palette.mode === "dark" ? "night" : "stripe",
                  },
                }}
              >
                <CheckoutForm />
              </Elements>
            ) : (
              <Typography color="error">
                Payment could not be initialized.
              </Typography>
            )}
          </>
        )}

        {!stripeEnabled && (
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, py: 1.4, fontWeight: 600 }}
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
          <Link
            href="/login"
            underline="hover"
            sx={{ color: theme.palette.primary.main }}
          >
            Login here
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
