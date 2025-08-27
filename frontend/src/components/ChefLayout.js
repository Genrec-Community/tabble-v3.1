import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Alert,
  Button,
  useTheme,
  Tabs,
  Tab
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import DatabaseSelector from './DatabaseSelector';

const ChefLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const [showDatabaseSelector, setShowDatabaseSelector] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [currentDatabase, setCurrentDatabase] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  // Format database name: remove .db extension and capitalize first letter
  const formatDatabaseName = (dbName) => {
    if (!dbName) return '';
    // Remove .db extension if present
    const nameWithoutExtension = dbName.replace(/\.db$/, '');
    // Capitalize first letter
    return nameWithoutExtension.charAt(0).toUpperCase() + nameWithoutExtension.slice(1);
  };

  // Check database connection on component mount
  useEffect(() => {
    const checkDatabaseConnection = async () => {
      const selectedDatabase = localStorage.getItem('chefSelectedDatabase');
      const databasePassword = localStorage.getItem('chefDatabasePassword');

      if (selectedDatabase && databasePassword) {
        try {
          // Import adminService here to avoid circular imports
          const { adminService } = await import('../services/api');
          
          // Temporarily set the credentials for verification
          localStorage.setItem('selectedDatabase', selectedDatabase);
          localStorage.setItem('databasePassword', databasePassword);
          
          await adminService.getCurrentDatabase();
          setDatabaseConnected(true);
          setCurrentDatabase(selectedDatabase);
          console.log('Chef: Database connection verified');
        } catch (error) {
          console.error('Chef: Database verification failed:', error);
          // Clear invalid credentials
          localStorage.removeItem('chefSelectedDatabase');
          localStorage.removeItem('chefDatabasePassword');
          localStorage.removeItem('selectedDatabase');
          localStorage.removeItem('databasePassword');
          setShowDatabaseSelector(true);
        }
      } else {
        setShowDatabaseSelector(true);
      }
    };

    checkDatabaseConnection();
  }, []);

  // Update tab based on current route
  useEffect(() => {
    if (location.pathname === '/chef') {
      setCurrentTab(0);
    } else if (location.pathname === '/chef/orders') {
      setCurrentTab(1);
    }
  }, [location.pathname]);

  const handleDatabaseSuccess = (databaseName) => {
    // Store chef-specific database credentials
    const selectedDatabase = localStorage.getItem('selectedDatabase');
    const databasePassword = localStorage.getItem('databasePassword');
    
    localStorage.setItem('chefSelectedDatabase', selectedDatabase);
    localStorage.setItem('chefDatabasePassword', databasePassword);
    
    setCurrentDatabase(databaseName);
    setDatabaseConnected(true);
    setShowDatabaseSelector(false);
  };

  const handleSwitchDatabase = () => {
    // Clear current database connection
    localStorage.removeItem('chefSelectedDatabase');
    localStorage.removeItem('chefDatabasePassword');
    localStorage.removeItem('selectedDatabase');
    localStorage.removeItem('databasePassword');
    setDatabaseConnected(false);
    setCurrentDatabase('');
    setShowDatabaseSelector(true);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#FFFFFF'
    }}>
      {/* App Bar */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: '#000000',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
        }}
      >
        <Toolbar>
          <RestaurantIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Chef Portal
          </Typography>
          
          {databaseConnected && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Database: {formatDatabaseName(currentDatabase)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSwitchDatabase}
                sx={{ 
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                  }
                }}
              >
                Switch DB
              </Button>
              <Button
                variant="outlined"
                size="small"
                component={RouterLink}
                to="/"
                sx={{ 
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                  }
                }}
              >
                Home
              </Button>
            </Box>
          )}
        </Toolbar>

        {/* Navigation Tabs */}
        {databaseConnected && (
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 165, 0, 0.2)' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                },
              }}
            >
              <Tab
                label="Dashboard"
                component={RouterLink}
                to="/chef"
              />
              <Tab
                label="Orders"
                component={RouterLink}
                to="/chef/orders"
              />
            </Tabs>
          </Box>
        )}
      </AppBar>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: '#000000',
          minHeight: '100vh',
          color: '#FFFFFF',
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            backgroundColor: '#000000',
            minHeight: '100vh',
            color: '#FFFFFF',
            py: 0
          }}
        >
          {!databaseConnected ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              backgroundColor: '#000000'
            }}>
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  maxWidth: 600,
                  backgroundColor: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  color: '#FFFFFF',
                  '& .MuiAlert-icon': {
                    color: '#FFA500'
                  }
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                  Welcome to Chef Portal
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Please select your hotel database to access the kitchen management features.
                  Each hotel has its own independent database for managing orders and kitchen operations.
                </Typography>
              </Alert>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowDatabaseSelector(true)}
                sx={{ mb: 2 }}
              >
                Select Database
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/"
              >
                Go to Home Page
              </Button>
            </Box>
          ) : (
            <Outlet />
          )}
        </Container>
      </Box>
      
      {/* Database Selector Dialog */}
      <DatabaseSelector
        open={showDatabaseSelector}
        onSuccess={handleDatabaseSuccess}
        title="Chef Database Selection"
      />
    </Box>
  );
};

export default ChefLayout;
