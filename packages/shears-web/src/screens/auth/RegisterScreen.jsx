// src/pages/Register.jsx
import React, { useState } from 'react';
import {useNavigate} from 'react-router';

import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Paper,
} from '@mui/material';

import { registerUser } from '../../../../shears-shared/src/Services/Authentication';


export default function Register({appConfig, logo}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'client'
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await registerUser(formData); // <-- await!
    alert(`User ${res.user.fullName} registered successfully!`);
    navigate('/login');
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
        background: `linear-gradient(to bottom right, ${appConfig.themeColors.primary}, ${appConfig.themeColors.secondary})`, // professional gradient
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img
            src={logo} // place your logo in public/logo.png
            alt="App Logo"
            style={{ width: 150, height: 'auto', objectFit: 'contain' }}
          />
        </Box>

        <Typography variant="h5" fontWeight={600} mb={2}>
          Create Your Account
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            name="fullName"
            label="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            name="role"
            label="Role"
            value={formData.role}
            onChange={handleChange}
            margin="normal"
          >
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="barber">Barber</MenuItem>
            <MenuItem value="owner">Owner</MenuItem>
          </TextField>

          <Button
            fullWidth
            variant="contained"
            type="submit"
            color="primary"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.2,
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              background: 'linear-gradient(to right, #007bff, #00b4db)',
              '&:hover': { background: 'linear-gradient(to right, #0056b3, #0083b0)' },
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <Typography variant="body2" mt={3} color="text.secondary">
          Already have an account? <a href="/login">Login</a>
        </Typography>
      </Paper>
    </Box>
  );
}
