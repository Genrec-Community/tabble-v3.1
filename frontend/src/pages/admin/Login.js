import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  CircularProgress, Alert, InputAdornment
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import LockIcon from '@mui/icons-material/Lock';
import { adminService } from '../../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [hotelName, setHotelName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!hotelName || !password) {
      setError('Please enter both hotel name and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await adminService.switchHotel(hotelName.trim(), password);
      if (res.success) {
        localStorage.setItem('selectedHotel', hotelName.trim());
        localStorage.setItem('hotelPassword', password);
        localStorage.setItem('selectedDatabase', hotelName.trim());
        localStorage.setItem('databasePassword', password);
        navigate('/admin');
      } else {
        setError('Invalid hotel name or password');
      }
    } catch {
      setError('Invalid hotel name or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.8)),
        url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
    }}>
      <Paper sx={{
        p: 4, width: '100%', maxWidth: 420,
        bgcolor: 'rgba(18,18,18,0.95)',
        border: '1px solid rgba(255,165,0,0.3)',
        borderRadius: 3,
      }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#FFA500', mb: 0.5, textAlign: 'center' }}>
          🏨 Hotel Admin
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', textAlign: 'center', mb: 3 }}>
          Sign in to manage your restaurant
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth label="Hotel Name" value={hotelName}
            onChange={e => setHotelName(e.target.value)}
            sx={{ mb: 2 }} variant="outlined"
            InputProps={{ startAdornment: <InputAdornment position="start"><HotelIcon sx={{ color: '#FFA500' }} /></InputAdornment> }}
            InputLabelProps={{ style: { color: '#888' } }}
            inputProps={{ style: { color: '#fff' } }}
          />
          <TextField
            fullWidth label="Password" type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 3 }} variant="outlined"
            InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#FFA500' }} /></InputAdornment> }}
            InputLabelProps={{ style: { color: '#888' } }}
            inputProps={{ style: { color: '#fff' } }}
          />
          <Button
            type="submit" variant="contained" fullWidth
            disabled={loading}
            sx={{ bgcolor: '#FFA500', color: '#000', fontWeight: 700, py: 1.5, '&:hover': { bgcolor: '#E69500' } }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#000' }} /> : 'Sign In'}
          </Button>
        </form>

        <Typography
          variant="body2" sx={{ color: '#555', textAlign: 'center', mt: 3, cursor: 'pointer', '&:hover': { color: '#FFA500' } }}
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdminLogin;
