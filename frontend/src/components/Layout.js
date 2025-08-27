import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  useTheme
} from '@mui/material';
import FoodBankIcon from '@mui/icons-material/FoodBank';

function Layout() {
  const theme = useTheme();

  // Solid black background for the AppBar with subtle orange accent
  const appBarBackground = '#000000';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{
        background: appBarBackground,
        boxShadow: 'none',
        borderBottom: '1px solid rgba(255, 165, 0, 0.2)'
      }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 1.5, justifyContent: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}
            >
              <FoodBankIcon sx={{ fontSize: 40, mr: 1.5, color: theme.palette.primary.main }} />
              <Typography
                variant="h4"
                fontWeight="bold"
                letterSpacing="1px"
                sx={{ color: '#FFFFFF' }}
              >
                TABBLE
              </Typography>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" sx={{ mt: 3, mb: 4, flexGrow: 1, maxWidth: { xl: '1600px' }, px: { xs: 1, sm: 2 } }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 1,
          mt: 'auto',
          backgroundColor: '#000000',
          borderTop: '1px solid rgba(255, 165, 0, 0.2)',
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" flexDirection="column" alignItems="center">
            <Box display="flex" alignItems="center" mb={3}>
              <FoodBankIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
              <Typography variant="h6" component="span" fontWeight="bold" letterSpacing="1px">
                TABBLE
              </Typography>
            </Box>
            <Typography variant="body2" align="center" sx={{ opacity: 0.9, maxWidth: '600px', mb: 2 }}>
              Elevating the dining experience with elegant design and seamless service for luxury hotels
            </Typography>
            <Box sx={{
              width: '40px',
              height: '2px',
              backgroundColor: 'primary.main',
              mb: 3
            }} />
            <Typography variant="body2" align="center" sx={{ opacity: 0.7 }}>
              &copy; {new Date().getFullYear()} Tabble - Premium Hotel Management System
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
