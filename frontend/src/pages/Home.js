import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Grid, Paper, useTheme } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import KitchenIcon from '@mui/icons-material/Kitchen';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ThemeModeToggle from '../components/ThemeModeToggle';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleTryDemo = () => {
    // Set demo context so customer login works directly
    localStorage.setItem('customerSelectedDatabase', 'demo');
    localStorage.setItem('selectedDatabase', 'demo');
    localStorage.setItem('tableNumber', '1');
    localStorage.setItem('slotNumber', '1');
    localStorage.setItem('customerUniqueId', 'DEMO');
    localStorage.setItem('customerId', 'demo');
    // Clear password-based auth so QR token path is used
    localStorage.removeItem('customerDatabasePassword');
    localStorage.removeItem('databasePassword');
    navigate('/customer/demo-entry?table_number=1&slot_number=1&unique_id=DEMO&user_id=demo');
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

  // Subtle, uniform overlay for text legibility — no edge vignette.
  // Light mode gets a soft white scrim so the page reads bright and clean.
  const overlay = isDark
    ? 'linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55))'
    : 'linear-gradient(rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.72))';

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        background: `${overlay},
          url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      {/* Theme toggle — top right, always visible */}
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

      <Typography
        variant="h2"
        fontWeight="bold"
        sx={{ color: isDark ? '#FFA500' : '#1A1A1A', mb: 1, letterSpacing: 2 }}
      >
        🍽 Tabble
      </Typography>
      <Typography variant="h6" sx={{ color: isDark ? '#E0E0E0' : '#3A3A3A', mb: 6, textAlign: 'center' }}>
        Smart restaurant ordering — scan, order, enjoy
      </Typography>

      <Container maxWidth="md">
        <Grid container spacing={3} justifyContent="center">
          {cards.map((card) => (
            <Grid item xs={12} sm={4} key={card.title}>
              <Paper
                elevation={isDark ? 6 : 2}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  bgcolor: isDark ? 'rgba(18,18,18,0.92)' : 'rgba(255,255,255,0.95)',
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
                <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? '#fff' : '#1A1A1A', mt: 2, mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#999' : '#555555', mb: 3 }}>
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