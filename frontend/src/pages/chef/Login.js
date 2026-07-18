import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, CircularProgress, Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import api from '../../services/api';

const ChefLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await api.post('/chef/auth/google', { id_token: idToken });
      const { hotel_id, hotel_name, display_name, gmail } = res.data;

      localStorage.setItem('chefHotelId', String(hotel_id));
      localStorage.setItem('chefHotelName', hotel_name);
      localStorage.setItem('chefDisplayName', display_name);
      localStorage.setItem('chefGmail', gmail);
      localStorage.setItem('selectedHotel', hotel_name);
      localStorage.setItem('hotelPassword', '');
      localStorage.setItem('selectedDatabase', hotel_name);

      navigate('/chef');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Sign-in failed';
      setError(msg);
      await auth.signOut().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.8)),
        url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
    }}>
      <Paper sx={{
        p: 4, width: '100%', maxWidth: 400,
        bgcolor: 'rgba(18,18,18,0.95)',
        border: '1px solid rgba(76,175,80,0.3)',
        borderRadius: 3, textAlign: 'center',
      }}>
        <Typography variant="h2" sx={{ mb: 1 }}>👨‍🍳</Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#4CAF50', mb: 0.5 }}>
          Chef Portal
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
          Sign in with the Google account your hotel admin registered
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={handleGoogleLogin}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} sx={{ color: '#000' }} /> : <GoogleIcon />}
          sx={{
            bgcolor: '#4CAF50', color: '#fff', fontWeight: 700, py: 1.5,
            '&:hover': { bgcolor: '#388E3C' },
          }}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        <Typography
          variant="body2"
          sx={{ color: '#555', mt: 3, cursor: 'pointer', '&:hover': { color: '#4CAF50' } }}
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChefLogin;
