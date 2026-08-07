import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  CircularProgress, Alert, InputAdornment, useTheme
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import LockIcon from '@mui/icons-material/Lock';
import { adminService } from '../../services/api';
import ThemeModeToggle from '../../components/ThemeModeToggle';

const AdminLogin = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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

  // Uniform scrim for legibility — no edge vignette.
  const overlay = isDark
    ? 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))'
    : 'linear-gradient(rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.72))';

  const fieldSx = isDark
    ? {
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
          '&:hover fieldset': { borderColor: 'rgba(255,165,0,0.5)' },
          '&.Mui-focused fieldset': { borderColor: '#FFA500' }
        },
        '& .MuiInputLabel-root': { color: '#888' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#FFA500' },
        '& .MuiInputBase-input': { color: '#fff' }
      }
    : {
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
          '&:hover fieldset': { borderColor: 'rgba(255,165,0,0.5)' },
          '&.Mui-focused fieldset': { borderColor: '#FFA500' }
        },
        '& .MuiInputLabel-root': { color: '#666' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#FFA500' },
        '& .MuiInputBase-input': { color: '#1A1A1A' }
      };

  return (
    <Box sx={{
      position: 'relative',
      minHeight: '100vh',
      background: `${overlay},
        url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
    }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Paper
          elevation={1}
          sx={{
            p: 0.5,
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(18,18,18,0.75)' : 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(255, 165, 0, 0.25)',
          }}
        >
          <ThemeModeToggle />
        </Paper>
      </Box>

      <Paper sx={{
        p: 4, width: '100%', maxWidth: 420,
        bgcolor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(255,165,0,0.3)',
        borderRadius: 3,
      }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#FFA500', mb: 0.5, textAlign: 'center' }}>
          🏨 Hotel Admin
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#888' : '#555', textAlign: 'center', mb: 3 }}>
          Sign in to manage your restaurant
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth label="Hotel Name" value={hotelName}
            onChange={e => setHotelName(e.target.value)}
            sx={{ mb: 2, ...fieldSx }} variant="outlined"
            InputProps={{ startAdornment: <InputAdornment position="start"><HotelIcon sx={{ color: '#FFA500' }} /></InputAdornment> }}
          />
          <TextField
            fullWidth label="Password" type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 3, ...fieldSx }} variant="outlined"
            InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#FFA500' }} /></InputAdornment> }}
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
          variant="body2" sx={{ color: isDark ? '#555' : '#666', textAlign: 'center', mt: 3, cursor: 'pointer', '&:hover': { color: '#FFA500' } }}
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdminLogin;