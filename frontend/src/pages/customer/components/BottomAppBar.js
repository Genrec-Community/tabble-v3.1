import React from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Badge
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';

const BottomAppBar = ({ 
  cart, 
  calculateTotal, 
  handleOpenCartDialog, 
  handleOpenOrderHistory, 
  currentOrder, 
  handleRequestPayment 
}) => {
  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
          top: 'auto',
          bottom: 0,
          boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.05)',
          backgroundColor: 'white'
        }}
      >
        <Toolbar>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={handleOpenOrderHistory}
            sx={{
              borderRadius: '50px',
              mr: 2
            }}
          >
            View Orders
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color="primary"
            startIcon={
              <Badge
                badgeContent={cart.length}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    minWidth: '18px',
                    height: '18px',
                  }
                }}
              >
                <ShoppingCartIcon />
              </Badge>
            }
            onClick={handleOpenCartDialog}
            sx={{
              py: 1.2,
              px: 3,
              borderRadius: '50px',
              fontWeight: 'bold',
              background: 'linear-gradient(145deg, #FF5A5F 0%, #FF385C 100%)',
              boxShadow: '0 4px 10px rgba(255, 90, 95, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 15px rgba(255, 90, 95, 0.3)',
              },
            }}
          >
            View Cart {cart.length > 0 && `(${cart.length})`}
          </Button>
          {currentOrder && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PaymentIcon />}
              onClick={handleRequestPayment}
              sx={{
                ml: 2,
                py: 1.2,
                px: 3,
                borderRadius: '50px',
                fontWeight: 'bold',
                background: 'linear-gradient(145deg, #4DAA57 0%, #2E8B57 100%)',
                boxShadow: '0 4px 10px rgba(77, 170, 87, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(77, 170, 87, 0.3)',
                },
              }}
            >
              Payment
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Add padding at the bottom to account for the bottom bar */}
      <Box sx={{ height: 80 }} />
    </>
  );
};

export default BottomAppBar;
