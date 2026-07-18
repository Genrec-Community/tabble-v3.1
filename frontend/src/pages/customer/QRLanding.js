import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import axios from 'axios';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const getBaseUrl = () => process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

const QRLanding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [slotOccupied, setSlotOccupied] = useState(false);

  useEffect(() => {
    const token = searchParams.get('t');
    if (!token) {
      setError('Invalid QR code — no token found.');
      return;
    }

    axios
      .get(`${getBaseUrl()}/public/scan/${token}`)
      .then((res) => {
        const { hotel_name, table_number, slot_number, is_occupied } = res.data;

        if (is_occupied) {
          // Use onAuthStateChanged to reliably check Firebase rehydration
          const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            unsubscribe();
            const existingToken = localStorage.getItem('customerQrToken');
            const existingCustomerId = localStorage.getItem('customerId');

            if (existingToken === token && firebaseUser && existingCustomerId) {
              // Same customer resuming before payment — go straight to menu
              navigate(
                `/customer/menu?table_number=${table_number}&slot_number=${slot_number}&unique_id=${localStorage.getItem('customerUniqueId') || 'RESUME'}&user_id=${existingCustomerId}`
              );
            } else {
              setSlotOccupied(true);
            }
          });
          return;
        }

        localStorage.setItem('customerSelectedDatabase', hotel_name);
        localStorage.setItem('selectedDatabase', hotel_name);
        localStorage.setItem('tableNumber', String(table_number));
        localStorage.setItem('slotNumber', String(slot_number));
        localStorage.setItem('customerQrToken', token);
        localStorage.removeItem('customerDatabasePassword');
        localStorage.removeItem('databasePassword');

        navigate('/customer');
      })
      .catch(() => {
        setError('This QR code is invalid or no longer active. Please ask your server for assistance.');
      });
  }, [searchParams, navigate]);

  if (slotOccupied) {
    return (
      <Box sx={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        bgcolor: '#000', color: '#fff', p: 3, textAlign: 'center',
      }}>
        <Typography variant="h2" sx={{ mb: 1 }}>🪑</Typography>
        <Typography variant="h5" sx={{ color: '#FFA500', mb: 2 }}>
          This seat is occupied
        </Typography>
        <Typography variant="body1" sx={{ color: '#ccc', mb: 1, maxWidth: 340 }}>
          Someone is already using this slot.
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', maxWidth: 340 }}>
          Please scan the QR code on the other side of the table, or ask your server for help.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        bgcolor: '#000', color: '#fff', p: 3, textAlign: 'center',
      }}>
        <Typography variant="h5" sx={{ color: '#FFA500', mb: 2 }}>Invalid QR Code</Typography>
        <Typography variant="body1" sx={{ color: '#ccc', mb: 3, maxWidth: 360 }}>{error}</Typography>
        <Button variant="outlined" sx={{ borderColor: '#FFA500', color: '#FFA500' }}
          onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', bgcolor: '#000', gap: 2,
    }}>
      <CircularProgress sx={{ color: '#FFA500' }} size={48} />
      <Typography variant="body1" sx={{ color: '#ccc' }}>Loading your table...</Typography>
    </Box>
  );
};

export default QRLanding;
