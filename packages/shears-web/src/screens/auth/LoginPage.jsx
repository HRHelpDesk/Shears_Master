import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Paper, Link } from '@mui/material';
import { useNavigate } from 'react-router';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../context/AuthContext';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InputAdornment from '@mui/material/InputAdornment';

export default function LoginPage({ appConfig, logo }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password, appConfig);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
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
      }}
    >
      {/* Card wrapper with max width */}
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 420,
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
              width: 300, 
              height: 120, 
              objectFit: 'contain' 
            }}
          />
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
          Welcome Back
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
          Sign in to continue
        </Typography>

        {/* Email input with icon */}
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

        {/* Password input with icon */}
        <TextField
          fullWidth
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          type="password"
          variant="outlined"
          margin="normal"
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon sx={{ color: '#666' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              backgroundColor: '#fff',
              '& fieldset': {
                borderWidth: 1.5,
              },
            },
          }}
        />

        {/* Forgot password link */}
        <Box sx={{ textAlign: 'right', mb: 3, mt: -1 }}>
          <Link
            href="/reset-password"
            underline="none"
            sx={{
              color: '#666',
              fontSize: 14,
              fontWeight: 600,
              '&:hover': {
                color: theme.palette.primary.main,
              },
            }}
          >
            Forgot Password?
          </Link>
        </Box>

        {/* Sign in button */}
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
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
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
          Secure login • Protected by encryption
        </Typography>
      </Box>
    </Box>
  );
}