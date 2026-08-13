import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  InputAdornment,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import api from '../../services/api';
import ThemeModeToggle from '../../components/ThemeModeToggle';

const ChefLogin = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    hotel_id: ''
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await api.get('/public/hotels');
      setHotels(response.data);
    } catch (err) {
      setError('Failed to load hotels');
    } finally {
      setLoadingHotels(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.hotel_id) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/chef/auth/login', {
        username: formData.username,
        password: formData.password,
        hotel_id: parseInt(formData.hotel_id)
      });

      const { chef_id, hotel_id, hotel_name, display_name, username } = response.data;

      // Store chef session data
      localStorage.setItem('chefId', String(chef_id));
      localStorage.setItem('chefHotelId', String(hotel_id));
      localStorage.setItem('chefHotelName', hotel_name);
      localStorage.setItem('chefDisplayName', display_name);
      localStorage.setItem('chefUsername', username);
      localStorage.setItem('selectedHotel', hotel_name);
      localStorage.setItem('selectedDatabase', hotel_name);

      navigate('/chef');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Uniform scrim for legibility — no edge vignette.
  const overlay = isDark
    ? 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))'
    : 'linear-gradient(rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.72))';

  // Theme-aware green inputs
  const fieldSx = isDark
    ? {
        '& .MuiOutlinedInput-root': {
          color: 'white',
          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
          '&:hover fieldset': { borderColor: 'rgba(76,175,80,0.5)' },
          '&.Mui-focused fieldset': { borderColor: '#4CAF50' }
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#4CAF50' }
      }
    : {
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
          '&:hover fieldset': { borderColor: 'rgba(76,175,80,0.5)' },
          '&.Mui-focused fieldset': { borderColor: '#4CAF50' }
        },
        '& .MuiInputLabel-root': { color: '#666' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#4CAF50' },
        '& .MuiInputBase-input': { color: '#1A1A1A' }
      };

  return (
    <Box sx={{
      position: 'relative',
      minHeight: '100vh',
      background: `${overlay},
        url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
    }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Paper
          elevation={1}
          sx={{
            p: 0.5,
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(18,18,18,0.75)' : 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
          }}
        >
          <ThemeModeToggle />
        </Paper>
      </Box>

      <Paper sx={{
        p: 4,
        width: '100%',
        maxWidth: 420,
        bgcolor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(76,175,80,0.3)',
        borderRadius: 3,
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <RestaurantIcon sx={{ fontSize: 60, color: '#4CAF50', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#4CAF50', mb: 0.5 }}>
            Chef Portal
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#888' : '#555' }}>
            Sign in to access kitchen orders
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            select
            label="Select Hotel"
            name="hotel_id"
            value={formData.hotel_id}
            onChange={handleChange}
            disabled={loadingHotels}
            sx={{ mb: 2, ...fieldSx }}
          >
            {loadingHotels ? (
              <MenuItem value="">
                <CircularProgress size={20} />
              </MenuItem>
            ) : (
              hotels.map((hotel) => (
                <MenuItem key={hotel.id} value={hotel.id}>
                  {hotel.name || hotel.hotel_name}
                </MenuItem>
              ))
            )}
          </TextField>

          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            sx={{ mb: 2, ...fieldSx }}
          />

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#666' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 3, ...fieldSx }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              bgcolor: '#4CAF50',
              color: '#fff',
              fontWeight: 700,
              py: 1.5,
              '&:hover': { bgcolor: '#388E3C' },
              '&:disabled': { bgcolor: 'rgba(76,175,80,0.3)' }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </form>

        <Typography
          variant="body2"
          sx={{
            color: isDark ? '#555' : '#666',
            mt: 3,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': { color: '#4CAF50' }
          }}
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChefLogin;