import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  Alert, InputAdornment, IconButton, CircularProgress, Divider
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon, Person as PersonIcon, Email as EmailIcon,
  Visibility, VisibilityOff, ArrowBack as BackIcon, LockPerson as LockIcon
} from '@mui/icons-material';

function RegistrationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!name || !email || !password) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        setError('Please provide a valid email address');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1,
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/')}
          sx={{ color: 'white', mb: 3, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          Back to Home
        </Button>
        <Paper elevation={24} sx={{ p: 5, borderRadius: 4, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)' }}>
              <PersonAddIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Create an Account</Typography>
            <Typography variant="body2" color="text.secondary">Join us today!</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Full Name" type="text" value={name}
              onChange={(e) => setName(e.target.value)} required sx={{ mb: 3 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }} />
            <TextField fullWidth label="Email Address" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 3 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> }} />
            <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 4 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
              }} />
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
              sx={{ py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </form>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account? <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>Log In</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default RegistrationPage;