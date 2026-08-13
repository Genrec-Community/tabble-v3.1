import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper, useTheme } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';

const CustomerBottomNav = ({ active = 'home' }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderRadius: '18px 18px 0 0',
        overflow: 'hidden',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'}`,
        boxShadow: '0 -8px 28px rgba(0,0,0,0.18)',
      }}
    >
      <BottomNavigation
        value={active}
        showLabels
        sx={{
          backgroundColor: 'transparent',
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            color: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)',
            fontSize: '0.7rem',
            '&.Mui-selected': {
              color: '#FFA500',
              '& .MuiBottomNavigationAction-label': {
                fontWeight: 700,
              },
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.72rem',
            fontWeight: 500,
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          value="home"
          icon={<HomeIcon />}
          onClick={() => navigate('/customer/home')}
        />
        <BottomNavigationAction
          label="History"
          value="history"
          icon={<HistoryIcon />}
          onClick={() => navigate('/customer/history')}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default CustomerBottomNav;
