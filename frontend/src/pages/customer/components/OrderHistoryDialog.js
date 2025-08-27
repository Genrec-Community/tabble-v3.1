import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  DialogContentText
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import CancelIcon from '@mui/icons-material/Cancel';
import { customerService } from '../../../services/api';

const OrderHistoryDialog = ({
  open,
  onClose,
  userOrders,
  loadingOrders,
  formatDate,
  getStatusLabel,
  refreshOrders
}) => {
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    orderId: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handle cancel order
  const handleCancelOrder = async () => {
    try {
      await customerService.cancelOrder(cancelDialog.orderId);

      // Close dialog
      setCancelDialog({ ...cancelDialog, open: false });

      // Show success message
      setSnackbar({
        open: true,
        message: 'Order cancelled successfully',
        severity: 'success'
      });

      // Refresh orders
      if (refreshOrders) {
        refreshOrders();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);

      // Show error message
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to cancel order',
        severity: 'error'
      });

      // Close dialog
      setCancelDialog({ ...cancelDialog, open: false });
    }
  };

  // Open cancel confirmation dialog
  const openCancelDialog = (orderId) => {
    setCancelDialog({
      open: true,
      orderId
    });
  };

  // Close cancel confirmation dialog
  const closeCancelDialog = () => {
    setCancelDialog({
      ...cancelDialog,
      open: false
    });
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          backgroundColor: '#121212',
          backgroundImage: 'linear-gradient(rgba(255, 165, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 165, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
        padding: '20px 24px',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: '#FFA500',
        }
      }}>
        <Box display="flex" alignItems="center">
          <HistoryIcon sx={{ color: '#FFA500', fontSize: '2.2rem', mr: 2 }} />
          <Typography variant="h5" component="h2" fontWeight="bold" color="#FFFFFF">
            Your Order History
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(255, 165, 0, 0.2)', padding: '24px' }}>
        {loadingOrders ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress sx={{ color: '#FFA500' }} size={60} thickness={4} />
          </Box>
        ) : userOrders.length === 0 ? (
          <Box textAlign="center" py={10} sx={{
            backgroundImage: 'radial-gradient(rgba(255, 165, 0, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            padding: 4
          }}>
            <Box
              component="img"
              src="https://img.freepik.com/free-vector/no-data-concept-illustration_114360-536.jpg?w=826&t=st=1699123456~exp=1699124056~hmac=86a5d1f14da1d3c532839d11bba8c9ce44c5b23f50953a44d576edb7b8a29381"
              alt="No orders"
              sx={{ width: '70%', maxWidth: '300px', mb: 4, opacity: 0.8 }}
            />
            <Typography color="#FFA500" variant="h5" gutterBottom fontWeight="bold">
              No orders found
            </Typography>
            <Typography color="#FFFFFF" variant="body1" sx={{ fontSize: '1.1rem' }}>
              You haven't placed any orders yet
            </Typography>
          </Box>
        ) : (
          <>

            <Grid container spacing={4}>
              {userOrders.map((order) => {
                const canCancel = order.status === 'pending';

                return (
                  <Grid item xs={12} md={6} key={order.id}>
                    <Card sx={{
                      borderRadius: '8px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                      border: canCancel ? '2px solid #FFA500' : '1px solid rgba(255, 165, 0, 0.2)',
                      backgroundColor: '#121212',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
                      }
                    }}>
                      {/* Order status indicator bar */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        backgroundColor: order.status === 'completed' ? '#4DAA57' :
                                        order.status === 'accepted' ? '#2196F3' :
                                        order.status === 'pending' ? '#FFA500' : '#FF385C'
                      }} />

                      <CardHeader
                        sx={{
                          borderBottom: '1px solid rgba(255, 165, 0, 0.15)',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          py: 2
                        }}
                        title={
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                              <ReceiptIcon sx={{ color: '#FFA500', mr: 1.5 }} />
                              <Typography variant="h6" color="#FFFFFF">Order #{order.id}</Typography>
                            </Box>
                            <Chip
                              label={getStatusLabel(order.status)}
                              sx={{
                                backgroundColor: order.status === 'completed' ? 'rgba(77, 170, 87, 0.2)' :
                                                order.status === 'accepted' ? 'rgba(33, 150, 243, 0.2)' :
                                                order.status === 'pending' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 56, 92, 0.2)',
                                color: order.status === 'completed' ? '#4DAA57' :
                                      order.status === 'accepted' ? '#2196F3' :
                                      order.status === 'pending' ? '#FFA500' : '#FF385C',
                                border: `1px solid ${order.status === 'completed' ? 'rgba(77, 170, 87, 0.3)' :
                                                    order.status === 'accepted' ? 'rgba(33, 150, 243, 0.3)' :
                                                    order.status === 'pending' ? 'rgba(255, 165, 0, 0.3)' : 'rgba(255, 56, 92, 0.3)'}`,
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                height: '28px'
                              }}
                              size="medium"
                            />
                          </Box>
                        }
                        subheader={
                          <Box display="flex" alignItems="center" mt={1}>
                            <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1rem', mr: 1 }} />
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)">
                              {formatDate(order.created_at)}
                            </Typography>
                          </Box>
                        }
                      />

                      <CardContent sx={{ py: 2.5 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <RestaurantIcon sx={{ color: '#FFA500', mr: 1.5 }} />
                          <Typography variant="subtitle1" color="#FFFFFF" fontWeight="bold">
                            Order Items
                          </Typography>
                        </Box>

                        <Paper elevation={0} sx={{
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 165, 0, 0.15)',
                          borderRadius: '6px',
                          mb: 2.5,
                          overflow: 'hidden'
                        }}>
                          <List dense disablePadding>
                            {order.items.map((item, index) => (
                              <ListItem
                                key={item.id}
                                sx={{
                                  py: 1.5,
                                  px: 2,
                                  borderBottom: index !== order.items.length - 1 ? '1px solid rgba(255, 165, 0, 0.1)' : 'none',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 165, 0, 0.05)'
                                  }
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Box display="flex" alignItems="center">
                                        <Avatar sx={{
                                          width: 24,
                                          height: 24,
                                          bgcolor: 'rgba(255, 165, 0, 0.2)',
                                          color: '#FFA500',
                                          fontSize: '0.8rem',
                                          mr: 1.5
                                        }}>
                                          {index + 1}
                                        </Avatar>
                                        <Typography variant="body1" color="#FFFFFF">
                                          {item.dish?.name || "Unknown Dish"}
                                        </Typography>
                                        <Chip
                                          label={`x${item.quantity}`}
                                          size="small"
                                          sx={{
                                            ml: 1.5,
                                            height: '20px',
                                            fontSize: '0.7rem',
                                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                                            color: '#FFA500',
                                            border: '1px solid rgba(255, 165, 0, 0.2)'
                                          }}
                                        />
                                      </Box>
                                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                        Qty: {item.quantity}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={item.remarks && (
                                    <Typography variant="caption" color="rgba(255, 255, 255, 0.6)" sx={{
                                      display: 'block',
                                      mt: 0.5,
                                      fontStyle: 'italic'
                                    }}>
                                      Note: {item.remarks}
                                    </Typography>
                                  )}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>

                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{
                          backgroundColor: 'rgba(255, 165, 0, 0.1)',
                          p: 2,
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 165, 0, 0.2)'
                        }}>
                          <Box display="flex" alignItems="center">
                            <TableRestaurantIcon sx={{ color: '#FFA500', mr: 1 }} />
                            <Typography variant="body1" color="#FFFFFF">
                              Table #{order.table_number}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center">
                            {order.status === 'pending' && (
                              <Tooltip title="Cancel Order">
                                <IconButton
                                  onClick={() => openCancelDialog(order.id)}
                                  sx={{
                                    mr: 2,
                                    color: '#FF385C',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 56, 92, 0.1)'
                                    }
                                  }}
                                  size="small"
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Typography variant="h6" fontWeight="bold" color="#FFA500">
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{
        p: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 165, 0, 0.2)'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 165, 0, 0.5)',
            color: '#FFFFFF',
            borderWidth: '2px',
            py: 1.5,
            px: 4,
            fontSize: '1rem',
            fontWeight: 'bold',
            '&:hover': {
              borderColor: '#FFA500',
              backgroundColor: 'rgba(255, 165, 0, 0.1)',
            }
          }}
        >
          Close
        </Button>
      </DialogActions>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onClose={closeCancelDialog}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog}>No, Keep Order</Button>
          <Button
            onClick={handleCancelOrder}
            color="error"
            variant="contained"
            startIcon={<CancelIcon />}
          >
            Yes, Cancel Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default OrderHistoryDialog;
