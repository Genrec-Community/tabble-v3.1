import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, useTheme } from '@mui/material';
import axios from 'axios';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const getBaseUrl = getApiBaseUrl;

const QRLanding = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [slotOccupied, setSlotOccupied] = useState(false);
  const [showCartConflict, setShowCartConflict] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  useEffect(() => {
    const token = searchParams.get('t');
    if (!token) {
      setError('Invalid QR code — no token found.');
      return;
    }

    const existingToken = localStorage.getItem('customerQrToken');
    const existingCart = existingToken ? localStorage.getItem(`customerCart_${existingToken}`) : null;
    const hasCartItems = existingCart && JSON.parse(existingCart).length > 0;

    axios
      .get(`${getBaseUrl()}/public/scan/${token}`)
      .then((res) => {
        const { hotel_name, table_number, slot_number, is_occupied } = res.data;

        // Scenario 1: Same QR token - Resume session
        if (existingToken === token) {
          // Check if user is authenticated
          const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            unsubscribe();
            const existingCustomerId = localStorage.getItem('customerId');

            if (firebaseUser && existingCustomerId) {
              // Resume existing session - go directly to menu
              navigate(
                `/customer/menu?table_number=${table_number}&slot_number=${slot_number}&unique_id=${localStorage.getItem('customerUniqueId') || 'RESUME'}&user_id=${existingCustomerId}`
              );
            } else {
              // Need to authenticate first
              setupNewSession(token, hotel_name, table_number, slot_number);
              navigate('/customer');
            }
          });
          return;
        }

        // Scenario 2: Different QR token but has items in cart
        if (existingToken && existingToken !== token && hasCartItems) {
          // Check if new slot is occupied
          if (is_occupied) {
            setSlotOccupied(true);
            return;
          }

          // Show cart conflict dialog
          setConflictData({
            newToken: token,
            hotel_name,
            table_number,
            slot_number
          });
          setShowCartConflict(true);
          return;
        }

        // Scenario 3: Slot is occupied by someone else
        if (is_occupied) {
          setSlotOccupied(true);
          return;
        }

        // Scenario 4: New session - no conflicts
        setupNewSession(token, hotel_name, table_number, slot_number);
        navigate('/customer');
      })
      .catch(() => {
        setError('This QR code is invalid or no longer active. Please ask your server for assistance.');
      });
  }, [searchParams, navigate]);

  const setupNewSession = (token, hotel_name, table_number, slot_number) => {
    // Clear old cart if switching tables
    const oldToken = localStorage.getItem('customerQrToken');
    if (oldToken && oldToken !== token) {
      localStorage.removeItem(`customerCart_${oldToken}`);
    }

    // Setup new session
    localStorage.setItem('customerSelectedDatabase', hotel_name);
    localStorage.setItem('selectedDatabase', hotel_name);
    localStorage.setItem('tableNumber', String(table_number));
    localStorage.setItem('slotNumber', String(slot_number));
    localStorage.setItem('customerQrToken', token);
    localStorage.removeItem('customerDatabasePassword');
    localStorage.removeItem('databasePassword');
    localStorage.removeItem('customerOrderStatus');
  };

  const handleContinueWithNewTable = () => {
    if (!conflictData) return;

    // Clear old cart
    const oldToken = localStorage.getItem('customerQrToken');
    if (oldToken) {
      localStorage.removeItem(`customerCart_${oldToken}`);
      localStorage.removeItem('customerOrderStatus');
    }

    // Setup new session
    setupNewSession(
      conflictData.newToken,
      conflictData.hotel_name,
      conflictData.table_number,
      conflictData.slot_number
    );

    setShowCartConflict(false);
    navigate('/customer');
  };

  const handleKeepOldCart = () => {
    // Go back to old table menu
    const tableNumber = localStorage.getItem('tableNumber');
    const slotNumber = localStorage.getItem('slotNumber');
    const customerId = localStorage.getItem('customerId');
    const uniqueId = localStorage.getItem('customerUniqueId');

    setShowCartConflict(false);

    if (tableNumber && slotNumber && customerId) {
      navigate(`/customer/menu?table_number=${tableNumber}&slot_number=${slotNumber}&unique_id=${uniqueId || 'RESUME'}&user_id=${customerId}`);
    } else {
      navigate('/customer');
    }
  };

  if (showCartConflict) {
    return (
      <Dialog
        open={true}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: '1px solid rgba(255,165,0,0.3)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFA500', fontWeight: 'bold' }}>
          You Have Items in Your Cart
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You have items in your cart from a previous table. What would you like to do?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            • <strong>Continue with new table:</strong> Your cart will be cleared and you'll start fresh.
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
            • <strong>Keep current cart:</strong> Return to your previous table to complete your order.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleKeepOldCart}
            sx={{ color: theme.palette.text.secondary }}
          >
            Keep Current Cart
          </Button>
          <Button
            onClick={handleContinueWithNewTable}
            variant="contained"
            sx={{
              bgcolor: '#FFA500',
              color: '#000',
              fontWeight: 700,
              '&:hover': { bgcolor: '#FF8C00' }
            }}
          >
            Start Fresh at New Table
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (slotOccupied) {
    return (
      <Box sx={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        bgcolor: theme.palette.background.default, color: theme.palette.text.primary, p: 3, textAlign: 'center',
      }}>
        <Typography variant="h2" sx={{ mb: 1 }}>🪑</Typography>
        <Typography variant="h5" sx={{ color: '#FFA500', mb: 2 }}>
          This seat is occupied
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 1, maxWidth: 340 }}>
          Someone is already using this slot.
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, maxWidth: 340 }}>
          Please scan the QR code on the other side of the table, or ask your server for help.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        bgcolor: theme.palette.background.default, color: theme.palette.text.primary, p: 3, textAlign: 'center',
      }}>
        <Typography variant="h5" sx={{ color: '#FFA500', mb: 2 }}>Invalid QR Code</Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3, maxWidth: 360 }}>{error}</Typography>
        <Button variant="outlined" sx={{ borderColor: '#FFA500', color: '#FFA500' }}
          onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', bgcolor: theme.palette.background.default, gap: 2,
    }}>
      <CircularProgress sx={{ color: '#FFA500' }} size={48} />
      <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>Loading your table...</Typography>
    </Box>
  );
};

export default QRLanding;
