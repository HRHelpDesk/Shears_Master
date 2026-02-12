import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Link, IconButton } from '@mui/material';
import { useNavigate } from 'react-router';
import { useTheme } from '@mui/material/styles';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InputAdornment from '@mui/material/InputAdornment';

import {
  requestPasswordReset,
  verifyResetOtp,
  resetPassword as resetPasswordApi,
} from 'shears-shared/src/Services/Authentication';

export default function ResetPasswordPage({ appConfig, logo }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /* -------------------------------------------------------------------
     STEP 1: Request OTP
  ------------------------------------------------------------------- */
  const sendOtp = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

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
     STEP 2: Verify OTP
  ------------------------------------------------------------------- */
  const verifyOtpCode = async () => {
    if (!otp) {
      alert('Please enter your reset code');
      return;
    }

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
     STEP 3: Reset Password
  ------------------------------------------------------------------- */
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please enter your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(email, otp, newPassword, confirmPassword);
      alert('Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (step === 1) sendOtp();
      else if (step === 2) verifyOtpCode();
      else if (step === 3) handleResetPassword();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Reset Password';
      case 2: return 'Verify Code';
      case 3: return 'New Password';
      default: return 'Reset Password';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return 'Enter your email to receive a reset code';
      case 2: return 'We sent a 6-digit code to your email';
      case 3: return 'Create your new password';
      default: return '';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: `linear-gradient(
          to bottom right,
          ${theme.palette.primary.main},
          ${theme.palette.secondary.main}
        )`,
        p: 2.5,
        position: 'relative',
      }}
    >
      {/* Back button */}
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#fff',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Card wrapper with max width */}
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Logo inside card */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mb: 3,
          }}
        >
          <img
            src={logo}
            alt="App Logo"
            style={{ 
              width: 120, 
              height: 120, 
              objectFit: 'contain' 
            }}
          />
        </Box>

        {/* Progress indicator */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 1,
            mb: 3,
          }}
        >
          {[1, 2, 3].map((num) => (
            <Box
              key={num}
              sx={{
                width: step >= num ? 24 : 8,
                height: 8,
                borderRadius: 1,
                backgroundColor: step >= num ? '#666' : '#e0e0e0',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>

        {/* Title and subtitle matching mobile */}
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          sx={{ 
            color: '#1a1a1a',
            mb: 1,
          }}
        >
          {getStepTitle()}
        </Typography>
        
        <Typography
          variant="body1"
          textAlign="center"
          sx={{ 
            color: '#666',
            mb: 4,
            fontSize: 15,
          }}
        >
          {getStepSubtitle()}
        </Typography>

        {/* STEP 1: Email */}
        {step === 1 && (
          <>
            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              margin="normal"
              type="email"
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderWidth: 1.5,
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={sendOtp}
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.75,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 1.5,
                textTransform: 'none',
                letterSpacing: 0.5,
                boxShadow: 2,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: 4,
                },
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <>
            <TextField
              fullWidth
              label="Reset Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              margin="normal"
              inputProps={{ maxLength: 6 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ShieldOutlinedIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderWidth: 1.5,
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={verifyOtpCode}
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.75,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 1.5,
                textTransform: 'none',
                letterSpacing: 0.5,
                boxShadow: 2,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: 4,
                },
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                onClick={sendOtp}
                disabled={loading}
                underline="none"
                sx={{
                  color: '#666',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                Resend Code
              </Link>
            </Box>
          </>
        )}

        {/* STEP 3: New Password */}
        {step === 3 && (
          <>
            <TextField
              fullWidth
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              type="password"
              variant="outlined"
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderWidth: 1.5,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              type="password"
              variant="outlined"
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOpenOutlinedIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderWidth: 1.5,
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.75,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 1.5,
                textTransform: 'none',
                letterSpacing: 0.5,
                boxShadow: 2,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: 4,
                },
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </>
        )}
      </Paper>

      {/* Footer text */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Secure password reset • Protected by encryption
        </Typography>
      </Box>
    </Box>
  );
}