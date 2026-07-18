import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Button, useTheme, Tabs, Tab
} from '@mui/material';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../services/api';

const ChefLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [chefName, setChefName] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/chef/login');
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const res = await api.post('/chef/auth/google', { id_token: idToken });
        const { display_name, hotel_name } = res.data;
        setChefName(display_name);
        localStorage.setItem('chefHotelName', hotel_name);
        localStorage.setItem('selectedHotel', hotel_name);
        localStorage.setItem('selectedDatabase', hotel_name);
      } catch {
        // Gmail no longer registered — sign out and redirect
        await auth.signOut();
        navigate('/chef/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/chef') setCurrentTab(0);
    else if (location.pathname === '/chef/orders') setCurrentTab(1);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await auth.signOut();
    [
      'chefHotelName', 'chefDisplayName', 'chefGmail', 'chefHotelId',
      'selectedHotel', 'hotelPassword', 'selectedDatabase', 'databasePassword',
    ].forEach(k => localStorage.removeItem(k));
    navigate('/chef/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#000', color: '#FFF' }}>
      <AppBar position="static" sx={{ backgroundColor: '#000', boxShadow: 'none', borderBottom: '1px solid rgba(255,165,0,0.2)' }}>
        <Toolbar>
          <RestaurantIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1, color: '#FFA500' }}>
            Tabble — Kitchen
          </Typography>
          {chefName && (
            <Typography variant="body2" sx={{ color: '#ccc', mr: 2 }}>
              👨‍🍳 {chefName}
            </Typography>
          )}
          <Button
            color="inherit"
            size="small"
            onClick={handleSignOut}
            sx={{ color: '#FFA500', border: '1px solid rgba(255,165,0,0.3)' }}
          >
            Sign Out
          </Button>
        </Toolbar>
        <Tabs value={currentTab} textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#FFA500' } }}
          sx={{ px: 2 }}>
          <Tab label="Dashboard" component={RouterLink} to="/chef" />
          <Tab label="Orders" component={RouterLink} to="/chef/orders" />
        </Tabs>
      </AppBar>
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default ChefLayout;
