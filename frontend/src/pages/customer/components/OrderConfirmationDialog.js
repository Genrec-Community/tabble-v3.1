import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';

const OrderConfirmationDialog = ({ open, onClose, orderId }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'success.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            color: 'success.main',
          }}
        >
          <CheckCircleIcon fontSize="large" />
        </Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Order Placed Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your order #{orderId} has been received
        </Typography>
        <Box
          sx={{
            my: 3,
            p: 2,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: '8px',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Estimated Preparation Time
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center">
            <TimerIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              20-35 minutes
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Please wait while our chef prepares your delicious meal.
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          fullWidth
          sx={{
            py: 1.5,
            borderRadius: '50px',
            fontWeight: 'bold',
            background: 'linear-gradient(145deg, #FF5A5F 0%, #FF385C 100%)',
          }}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
};

export default OrderConfirmationDialog;
