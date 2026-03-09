import React, { useState, useContext } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useTheme } from "@mui/material/styles";
import { AuthContext } from "../../context/AuthContext";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function LoginPage({ appConfig, logo }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      await login(email, password, appConfig);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
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
        p: 2.5,
      }}
    >
      {/* Card wrapper */}
      <Paper
        elevation={theme.palette.mode === "dark" ? 0 : 8}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          border:
            theme.palette.mode === "dark"
              ? `1px solid ${theme.palette.divider}`
              : "none",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 32px rgba(0,0,0,0.6)"
              : "0px 8px 32px rgba(0, 0, 0, 0.15)",
          transition: "all 0.2s ease",
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 3,
          }}
        >
          <img
            src={logo}
            alt="App Logo"
            style={{
              width: 300,
              height: 120,
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          sx={{
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          Welcome Back
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body1"
          textAlign="center"
          sx={{
            color: theme.palette.text.secondary,
            mb: 4,
            fontSize: 15,
          }}
        >
          Sign in to continue
        </Typography>

        {/* Email */}
        <TextField
          fullWidth
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyPress}
          variant="outlined"
          margin="normal"
          type="email"
          autoComplete="email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon
                  sx={{ color: theme.palette.text.secondary }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: theme.palette.background.default,
              "& fieldset": {
                borderWidth: 1.5,
                borderColor: theme.palette.divider,
              },
              "&:hover fieldset": {
                borderColor: theme.palette.primary.main,
              },
            },
            "& .MuiInputLabel-root": {
              color: theme.palette.text.secondary,
            },
          }}
        />

        {/* Password */}
        <TextField
          fullWidth
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyPress}
          type="password"
          variant="outlined"
          margin="normal"
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon
                  sx={{ color: theme.palette.text.secondary }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: theme.palette.background.default,
              "& fieldset": {
                borderWidth: 1.5,
                borderColor: theme.palette.divider,
              },
              "&:hover fieldset": {
                borderColor: theme.palette.primary.main,
              },
            },
            "& .MuiInputLabel-root": {
              color: theme.palette.text.secondary,
            },
          }}
        />

        {/* Forgot password */}
        <Box sx={{ textAlign: "right", mb: 3, mt: -1 }}>
          <Link
            href="/reset-password"
            underline="none"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: 14,
              fontWeight: 600,
              "&:hover": {
                color: theme.palette.primary.main,
              },
            }}
          >
            Forgot Password?
          </Link>
        </Box>

        {/* Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleLogin}
          disabled={loading}
          sx={{
            mt: 1,
            py: 1.75,
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 1.5,
            textTransform: "none",
            letterSpacing: 0.5,
            boxShadow: theme.palette.mode === "dark" ? 0 : 2,
            "&:hover": {
              boxShadow: theme.palette.mode === "dark" ? 0 : 4,
            },
          }}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Secure login • Protected by encryption
        </Typography>
      </Box>
    </Box>
  );
}
