// packages/web/src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router';
import { AuthContext } from '../../context/AuthContext'; // import your context

export default function LoginPage({ appConfig, logo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext); // grab login function from context
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password); // call context login
      navigate('/dashboard', { replace: true }); // redirect after successful login
    } catch (err) {
      alert(err.message); // show backend error
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
        background: `linear-gradient(to bottom right, ${appConfig.themeColors.primary}, ${appConfig.themeColors.secondary})`,
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src={logo} alt="App Logo" style={{ width: 140, objectFit: 'contain' }} />
        </Box>

        <Typography variant="h5" fontWeight={600} mb={3}>
          Sign In
        </Typography>

        <TextField
          fullWidth
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          variant="outlined"
          margin="normal"
          required
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleLogin}
          disabled={loading}
          sx={{
            mt: 3,
            py: 1.5,
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
            background: `linear-gradient(to right, ${appConfig.themeColors.primary}, ${appConfig.themeColors.secondary})`,
            '&:hover': {
              background: `linear-gradient(to right, ${appConfig.themeColors.secondary}, ${appConfig.themeColors.primary})`,
            },
          }}
        >
          {loading ? 'Signing In...' : 'Login'}
        </Button>

        <Typography variant="body2" mt={3} color="text.secondary">
          Don't have an account? <a href="/register">Register</a>
        </Typography>
      </Paper>
    </Box>
  );
}
