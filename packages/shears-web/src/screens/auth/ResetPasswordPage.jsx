import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// ✅ Import new generalized functions
import {
  requestPasswordReset,
  verifyResetOtp,
  resetPassword as resetPasswordApi,
} from 'shears-shared/src/Services/Authentication';

export default function ResetPasswordPage({ logo }) {
  const theme = useTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /* -------------------------------------------------------------------
     ✅ STEP 1: Request OTP
  ------------------------------------------------------------------- */
  const sendOtp = async () => {
    if (!email) return alert('Enter your email');

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep(2);
    } catch (err) {
      alert(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------
     ✅ STEP 2: Verify OTP
  ------------------------------------------------------------------- */
  const verifyOtpCode = async () => {
    if (!otp) return alert('Enter your reset code');

    setLoading(true);
    try {
      await verifyResetOtp(email, otp);
      setStep(3);
    } catch (err) {
      alert(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------
     ✅ STEP 3: Reset Password
  ------------------------------------------------------------------- */
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      return alert('Enter your new password');
    }

    setLoading(true);
    try {
      await resetPasswordApi(email, otp, newPassword, confirmPassword);

      alert('Password reset! You can now log in.');
      window.location.href = '/login';
    } catch (err) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: `linear-gradient(
          to bottom right,
          ${theme.palette.primary.main},
          ${theme.palette.secondary.main}
        )`,
        p: 2,
      }}
    >
      <Paper
        elevation={theme.palette.mode === 'light' ? 6 : 3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          backdropFilter: theme.palette.mode === 'light' ? 'blur(12px)' : 'none',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src={logo} alt="App Logo" style={{ width: 140 }} />
        </Box>

        <Typography variant="h5" fontWeight={600} mb={3}>
          Reset Password
        </Typography>

        {/* ---------------- STEP 1: Email ---------------- */}
        {step === 1 && (
          <>
            <TextField
              fullWidth
              label="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />

            <Button
              fullWidth
              variant="contained"
              onClick={sendOtp}
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </>
        )}

        {/* ---------------- STEP 2: OTP ---------------- */}
        {step === 2 && (
          <>
            <Typography mb={2}>We sent a 6-digit code to your email.</Typography>

            <TextField
              fullWidth
              label="Enter reset code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              margin="normal"
            />

            <Button
              fullWidth
              variant="contained"
              onClick={verifyOtpCode}
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </>
        )}

        {/* ---------------- STEP 3: New Password ---------------- */}
        {step === 3 && (
          <>
            <TextField
              fullWidth
              label="New password"
              type="password"
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <TextField
              fullWidth
              label="Confirm new password"
              type="password"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
