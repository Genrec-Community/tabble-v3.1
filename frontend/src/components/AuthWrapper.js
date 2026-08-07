import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import DatabaseSelector from './DatabaseSelector';
import { setHotelInfo } from '../store/slices/authSlice';
import { adminService } from '../services/api';

const AuthWrapper = ({ children }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { selectedHotel, hotelPassword } = useSelector((state) => state.auth);
  const [showSelector, setShowSelector] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    setIsChecking(true);
    
    // Check if we have stored credentials
    const storedHotel = localStorage.getItem('selectedHotel') || localStorage.getItem('selectedDatabase');
    const storedPassword = localStorage.getItem('hotelPassword') || localStorage.getItem('databasePassword');
    
    if (storedHotel && storedPassword) {
      try {
        // Try to authenticate with stored credentials
        const response = await adminService.switchHotel(storedHotel, storedPassword);
        
        if (response.success) {
          // Update Redux store
          dispatch(setHotelInfo({ hotel: storedHotel, password: storedPassword }));
          setIsAuthenticated(true);
        } else {
          // Clear invalid credentials
          clearStoredCredentials();
          setShowSelector(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        clearStoredCredentials();
        setShowSelector(true);
      }
    } else {
      // No stored credentials, show selector
      setShowSelector(true);
    }
    
    setIsChecking(false);
  };

  const clearStoredCredentials = () => {
    localStorage.removeItem('selectedHotel');
    localStorage.removeItem('hotelPassword');
    localStorage.removeItem('selectedDatabase');
    localStorage.removeItem('databasePassword');
    localStorage.removeItem('tabbleDatabaseSelected');
  };

  const handleAuthSuccess = (hotelName) => {
    setIsAuthenticated(true);
    setShowSelector(false);
  };

  const handleLogout = () => {
    clearStoredCredentials();
    dispatch(setHotelInfo({ hotel: null, password: null }));
    setIsAuthenticated(false);
    setShowSelector(true);
  };

  if (isChecking) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: theme.palette.background.default,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            border: '2px solid rgba(255, 165, 0, 0.3)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" color="primary" gutterBottom>
            Tabble Restaurant System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Checking authentication...
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!isAuthenticated || showSelector) {
    // Redirect to dedicated admin login page instead of inline popup
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    return null;
  }

  // User is authenticated, show the main app with logout option
  return (
    <Box>
      {/* Add a logout button in the top right */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: theme.palette.background.paper,
          border: '1px solid rgba(255, 165, 0, 0.3)',
          borderRadius: 1,
          px: 2,
          py: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Hotel: <strong style={{ color: '#FFA500' }}>{selectedHotel}</strong>
        </Typography>
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={handleLogout}
        >
          Logout
        </Typography>
      </Box>
      
      {children}
    </Box>
  );
};

export default AuthWrapper;
