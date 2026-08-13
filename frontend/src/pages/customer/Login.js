import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, CircularProgress,
  Alert, Grid, Card, CardMedia, Container, Fade, useTheme
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import api from '../../services/api';
import ThemeModeToggle from '../../components/ThemeModeToggle';

const foodImages = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80',
];

const CustomerLogin = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [slotNumber, setSlotNumber] = useState('1');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const selectedDatabase = localStorage.getItem('customerSelectedDatabase');
    const qrToken = localStorage.getItem('customerQrToken');
    const savedTable = localStorage.getItem('tableNumber');
    const savedSlot = localStorage.getItem('slotNumber') || '1';

    if (!selectedDatabase || (!qrToken) || !savedTable) {
      // No QR session — keep the customer inside the ordering app instead of
      // bouncing them to the marketing homepage.
      setError('No table session found. Please scan the QR code on your table.');
      setChecking(false);
      return;
    }

    setTableNumber(savedTable);
    setSlotNumber(savedSlot);

    // If Firebase user already signed in, go straight to menu
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await api.post('/customer/api/auth/google', {
            id_token: idToken,
            table_number: parseInt(savedTable),
            slot_number: parseInt(savedSlot),
          });
          const { user_id } = res.data;
          localStorage.setItem('customerId', String(user_id));
          navigate(`/customer/home?table_number=${savedTable}&slot_number=${savedSlot}&user_id=${user_id}`);
        } catch {
          // Token invalid or hotel changed — let them sign in again
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await api.post('/customer/api/auth/google', {
        id_token: idToken,
        table_number: parseInt(tableNumber),
        slot_number: parseInt(slotNumber),
      });

      const { user_id, display_name } = res.data;
      localStorage.setItem('customerId', String(user_id));
      localStorage.setItem('customerDisplayName', display_name);

      // Generate a unique_id for this session's orders
      const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('customerUniqueId', uniqueId);

      navigate(`/customer/home?table_number=${tableNumber}&slot_number=${slotNumber}&unique_id=${uniqueId}&user_id=${user_id}`);
    } catch (err) {
      let msg = err.response?.data?.detail || err.message || 'Sign-in failed. Please try again.';
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/unauthorized-domain') {
        msg = `Google sign-in is not enabled for this domain (${window.location.hostname}). Add it under Firebase Console → Authentication → Settings → Authorized domains.`;
      }
      setError(msg);
      await auth.signOut().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Box sx={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', bgcolor: theme.palette.background.default,
      }}>
        <CircularProgress sx={{ color: '#FFA500' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: theme.palette.background.default, display: 'flex', flexDirection: 'column' }}>
      {/* Food image gallery strip */}
      <Grid container sx={{ height: { xs: 140, sm: 200 }, overflow: 'hidden' }}>
        {foodImages.map((src, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card sx={{ borderRadius: 0, height: '100%' }}>
              <CardMedia component="img" image={src} sx={{ height: '100%', objectFit: 'cover' }} />
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Login card */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Fade in timeout={500}>
          <Paper sx={{
            p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420,
            bgcolor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.97)' : 'rgba(18,18,18,0.97)',
            border: '1px solid rgba(255,165,0,0.25)',
            borderRadius: 3, textAlign: 'center', position: 'relative',
          }}>
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <ThemeModeToggle size={20} />
            </Box>
            <TableRestaurantIcon sx={{ fontSize: 44, color: '#FFA500', mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ color: theme.palette.text.primary, mb: 0.5 }}>
              Welcome to Tabble
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
              Table {tableNumber} · Seat {slotNumber}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
              Sign in with Google to browse the menu and place your order
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

            <Button
              variant="contained"
              fullWidth
              onClick={handleGoogleSignIn}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} sx={{ color: '#000' }} /> : <GoogleIcon />}
              sx={{
                bgcolor: '#FFA500', color: '#000', fontWeight: 700,
                py: 1.5, fontSize: '1rem',
                '&:hover': { bgcolor: '#E69500' },
              }}
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 2, opacity: 0.7 }}>
              Your name and email from Google will be used to personalise your experience
            </Typography>
          </Paper>
        </Fade>
      </Box>
    </Box>
  );
};

export default CustomerLogin;
