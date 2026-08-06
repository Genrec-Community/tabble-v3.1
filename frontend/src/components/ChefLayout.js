import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Button, Tabs, Tab
} from '@mui/material';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';
import LogoutIcon from '@mui/icons-material/Logout';

const ChefLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [chefName, setChefName] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    // Check if chef is logged in
    const chefId = localStorage.getItem('chefId');
    const displayName = localStorage.getItem('chefDisplayName');
    const hotelName = localStorage.getItem('chefHotelName');

    if (!chefId || !hotelName) {
      navigate('/chef/login');
      return;
    }

    setChefName(displayName || 'Chef');
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/chef') setCurrentTab(0);
    else if (location.pathname === '/chef/orders') setCurrentTab(1);
  }, [location.pathname]);

  const handleSignOut = async () => {
    // Clear all chef session data
    [
      'chefId',
      'chefHotelId',
      'chefHotelName',
      'chefDisplayName',
      'chefUsername',
      'selectedHotel',
      'hotelPassword',
      'selectedDatabase',
      'databasePassword',
    ].forEach(k => localStorage.removeItem(k));

    navigate('/chef/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#000', color: '#FFF' }}>
      <AppBar position="static" sx={{ backgroundColor: '#000', boxShadow: 'none', borderBottom: '1px solid rgba(255,165,0,0.2)' }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
          <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1, color: '#FFA500', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Tabble — Kitchen
          </Typography>
          {chefName && (
            <Typography variant="body2" sx={{ color: '#ccc', mr: 2, display: { xs: 'none', sm: 'block' } }}>
              👨‍🍳 {chefName}
            </Typography>
          )}
          <Button
            color="inherit"
            size="small"
            onClick={handleSignOut}
            startIcon={<LogoutIcon fontSize="small" />}
            aria-label="Sign out of kitchen"
            sx={{ color: '#FFA500', border: '1px solid rgba(255,165,0,0.3)', minWidth: 44, px: { xs: 1, sm: 1.5 } }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sign Out</Box>
          </Button>
        </Toolbar>
        <Tabs value={currentTab} textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#FFA500' } }}
          variant="fullWidth"
          sx={{ px: { xs: 0, sm: 2 }, '& .MuiTab-root': { minHeight: 48, fontWeight: 700 } }}>
          <Tab label="Dashboard" component={RouterLink} to="/chef" />
          <Tab label="Orders" component={RouterLink} to="/chef/orders" />
        </Tabs>
      </AppBar>
      <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default ChefLayout;
