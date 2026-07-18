import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Grid, Paper } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import KitchenIcon from '@mui/icons-material/Kitchen';
import QrCode2Icon from '@mui/icons-material/QrCode2';

const Home = () => {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    // Set demo context so customer login works directly
    localStorage.setItem('customerSelectedDatabase', 'demo');
    localStorage.setItem('selectedDatabase', 'demo');
    localStorage.setItem('tableNumber', '1');
    localStorage.setItem('slotNumber', '1');
    // Clear password-based auth so QR token path is used
    localStorage.removeItem('customerDatabasePassword');
    localStorage.removeItem('databasePassword');
    // We'll redirect to /customer — QRLanding context is already set via fetch on mount
    navigate('/customer/demo-entry');
  };

  const cards = [
    {
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 48, color: '#FFA500' }} />,
      title: 'Hotel Owner',
      desc: 'Manage your restaurant — dishes, tables, orders, staff, and analytics.',
      action: () => navigate('/admin/login'),
      label: 'Admin Login',
      color: '#FFA500',
    },
    {
      icon: <KitchenIcon sx={{ fontSize: 48, color: '#4CAF50' }} />,
      title: 'Chef',
      desc: 'View and manage kitchen orders in real time.',
      action: () => navigate('/chef/login'),
      label: 'Chef Login',
      color: '#4CAF50',
    },
    {
      icon: <QrCode2Icon sx={{ fontSize: 48, color: '#2196F3' }} />,
      title: 'Try Demo',
      desc: 'Experience the customer ordering flow with demo data.',
      action: handleTryDemo,
      label: 'Experience Now',
      color: '#2196F3',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.75)),
          url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Typography
        variant="h2"
        fontWeight="bold"
        sx={{ color: '#FFA500', mb: 1, letterSpacing: 2 }}
      >
        🍽 Tabble
      </Typography>
      <Typography variant="h6" sx={{ color: '#ccc', mb: 6, textAlign: 'center' }}>
        Smart restaurant ordering — scan, order, enjoy
      </Typography>

      <Container maxWidth="md">
        <Grid container spacing={3} justifyContent="center">
          {cards.map((card) => (
            <Grid item xs={12} sm={4} key={card.title}>
              <Paper
                elevation={6}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  bgcolor: 'rgba(18,18,18,0.92)',
                  border: `1px solid ${card.color}40`,
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 12px 32px ${card.color}30`,
                  },
                }}
              >
                {card.icon}
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', mt: 2, mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
                  {card.desc}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={card.action}
                  sx={{
                    bgcolor: card.color,
                    color: '#000',
                    fontWeight: 700,
                    '&:hover': { bgcolor: card.color, opacity: 0.9 },
                  }}
                >
                  {card.label}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
