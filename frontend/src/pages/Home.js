import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Button,
  Box,
  Container,
  Paper,
  Stack,
  Fade
} from '@mui/material';
import TableSetup from '../components/TableSetup';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';



const Home = () => {
  const navigate = useNavigate();
  const [showTableSetup, setShowTableSetup] = useState(false);

  // Check for existing database credentials on component mount
  useEffect(() => {
    const checkDatabaseCredentials = () => {
      const selectedDatabase = localStorage.getItem('customerSelectedDatabase');
      const databasePassword = localStorage.getItem('customerDatabasePassword');
      const tableNumber = localStorage.getItem('tableNumber');

      console.log('Checking database credentials:', {
        selectedDatabase: !!selectedDatabase,
        databasePassword: !!databasePassword,
        tableNumber: !!tableNumber
      });
    };

    checkDatabaseCredentials();
  }, []);

  const handleTableSetupComplete = () => {
    setShowTableSetup(false);
    console.log('Table setup completed - navigating to /customer');
    navigate('/customer');
  };

  const handleExperienceNowClick = () => {
    // Check if database credentials already exist
    const selectedDatabase = localStorage.getItem('customerSelectedDatabase');
    const databasePassword = localStorage.getItem('customerDatabasePassword');
    const tableNumber = localStorage.getItem('tableNumber');

    if (selectedDatabase && databasePassword && tableNumber) {
      console.log('Database credentials found - navigating directly to /customer');
      navigate('/customer');
    } else {
      console.log('Database credentials missing - showing table setup');
      setShowTableSetup(true);
    }
  };

  const handleAdminPortalClick = () => {
    console.log('Admin Portal button clicked - navigating to /admin');
    navigate('/admin');
  };

  // Hero section background with dark overlay for restaurant feel
  const heroBg = `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')`;









  return (
    <>
      {/* Table Setup Dialog */}
      <TableSetup
        open={showTableSetup}
        onClose={handleTableSetupComplete}
      />

      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 4, md: 6 },
          px: 2,
          mb: 2,
          background: heroBg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 165, 0, 0.5) 50%, transparent 100%)'
          }
        }}
      >
        <Container maxWidth="xl">
          <Fade in={true} timeout={1000}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ position: 'relative' }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: 'primary.main',
                      letterSpacing: '3px',
                      fontSize: '1rem',
                      mb: 2,
                      display: 'block'
                    }}
                  >
                    RESTAURANT AUTOMATION SYSTEM
                  </Typography>
                  <Typography
                    variant="h1"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                      color: 'white',
                      lineHeight: 1.1,
                      mb: 3,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-15px',
                        left: '0',
                        width: '80px',
                        height: '4px',
                        backgroundColor: 'primary.main'
                      }
                    }}
                  >
                    Elevate Your Dining Experience
                  </Typography>
                  <Typography
                    variant="h5"
                    color="text.secondary"
                    paragraph
                    sx={{ mb: 3, maxWidth: '600px', fontWeight: 300, lineHeight: 1.6 }}
                  >
                    Tabble brings sophisticated digital ordering and kitchen management to premium hotels and fine dining establishments
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleExperienceNowClick}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        py: 1.5,
                        px: 4,
                        fontSize: '1rem',
                        fontWeight: 500,
                        letterSpacing: '0.5px'
                      }}
                    >
                      Experience Now
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      onClick={handleAdminPortalClick}
                      sx={{
                        py: 1.5,
                        px: 4,
                        fontSize: '1rem',
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                        borderWidth: '2px'
                      }}
                    >
                      Admin Portal
                    </Button>
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      right: -20,
                      top: -20,
                      border: '2px solid rgba(255, 165, 0, 0.3)',
                      borderRadius: '6px',
                      zIndex: 0
                    }
                  }}
                >
                  <Paper
                    elevation={6}
                    sx={{
                      borderRadius: '6px',
                      overflow: 'hidden',
                      width: '100%',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
                      alt="Luxury dining experience"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Fade>
        </Container>
      </Box>
    </>
  );
};

export default Home;