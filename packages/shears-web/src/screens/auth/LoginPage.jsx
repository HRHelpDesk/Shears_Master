import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../context/AuthContext';

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        /* ✅ Theme-based gradient */
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

          /* ✅ Theme-based surface */
          backgroundColor: theme.palette.background.paper,

          /* ✅ Subtle blur if in light mode */
          backdropFilter: theme.palette.mode === 'light' ? 'blur(12px)' : 'none',

          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img
            src={logo}
            alt="App Logo"
            style={{ width: 140, height: 'auto', objectFit: 'contain' }}
          />
        </Box>

        <Typography
          variant="h5"
          fontWeight={600}
          mb={3}
          sx={{ color: theme.palette.text.primary }}
        >
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

          /* ✅ Theme input styling */
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          inputProps={{ style: { color: theme.palette.text.primary } }}
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
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          inputProps={{ style: { color: theme.palette.text.primary } }}
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

            /* ✅ Theme-based gradient button */
            background: `linear-gradient(
              to right,
              ${theme.palette.primary.main},
              ${theme.palette.secondary.main}
            )`,
            '&:hover': {
              background: `linear-gradient(
                to right,
                ${theme.palette.secondary.main},
                ${theme.palette.primary.main}
              )`,
            },
          }}
        >
          {loading ? 'Signing In...' : 'Login'}
        </Button>

        <Typography variant="body2" mt={3} sx={{ color: theme.palette.text.secondary }}>
          Don't have an account?{' '}
          <a href="/register" style={{ color: theme.palette.primary.main }}>
            Register
          </a>
        </Typography>
        <Typography variant="body2" mt={3} sx={{ color: theme.palette.text.secondary }}>
   
          <a href="/reset-password" style={{ color: theme.palette.primary.main }}>
            Reset Password
          </a>
        </Typography>

      </Paper>
    </Box>
  );
}
