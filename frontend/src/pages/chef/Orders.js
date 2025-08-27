import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardHeader,
  CardContent,
  Button,
  Tabs,
  Tab,
  Divider,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
  Zoom,
  Paper,
  LinearProgress,
  Tooltip,
  IconButton,
  Fab
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

import RefreshIcon from '@mui/icons-material/Refresh';
import TimerIcon from '@mui/icons-material/Timer';
import { chefService, adminService } from '../../services/api';

const ChefOrders = () => {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 for pending, 1 for accepted
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    orderId: null,
    action: '' // 'accept' or 'complete'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [refreshing, setRefreshing] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch both pending and accepted orders
      const [pendingOrdersData, acceptedOrdersData] = await Promise.all([
        chefService.getPendingOrders(),
        chefService.getAcceptedOrders()
      ]);

      setPendingOrders(pendingOrdersData);
      setAcceptedOrders(acceptedOrdersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load orders',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Refresh orders every 10 seconds for real-time updates
    const interval = setInterval(fetchOrders, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Open confirm dialog
  const handleConfirmOpen = (orderId, action) => {
    setConfirmDialog({
      open: true,
      orderId,
      action
    });
  };

  // Close confirm dialog
  const handleConfirmClose = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // Accept an order
  const handleAcceptOrder = async () => {
    try {
      await chefService.acceptOrder(confirmDialog.orderId);

      // Close dialog
      handleConfirmClose();

      // Show success message
      setSnackbar({
        open: true,
        message: 'Order accepted successfully!',
        severity: 'success'
      });

      // Immediate refresh for real-time updates
      await fetchOrders();
    } catch (error) {
      console.error('Error accepting order:', error);

      // Show error message
      setSnackbar({
        open: true,
        message: 'Failed to accept order',
        severity: 'error'
      });

      // Close dialog
      handleConfirmClose();
    }
  };

  // Mark order as completed
  const handleCompleteOrder = async () => {
    try {
      await chefService.completeOrder(confirmDialog.orderId);

      // Close dialog
      handleConfirmClose();

      // Show success message
      setSnackbar({
        open: true,
        message: 'Order marked as completed!',
        severity: 'success'
      });

      // Immediate refresh for real-time updates
      await fetchOrders();
    } catch (error) {
      console.error('Error completing order:', error);

      // Show error message
      setSnackbar({
        open: true,
        message: 'Failed to complete order',
        severity: 'error'
      });

      // Close dialog
      handleConfirmClose();
    }
  };

  // Format date in Indian Standard Time
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    };
    return new Date(dateString).toLocaleString('en-IN', options);
  };

  // Calculate time elapsed using Indian Standard Time
  const getTimeElapsed = (dateString) => {
    const orderTime = new Date(dateString);
    // Get current time in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const istOrderTime = new Date(orderTime.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));

    const diffMs = istNow - istOrderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins === 1) {
      return '1 minute ago';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 120) {
      return '1 hour ago';
    } else {
      return `${Math.floor(diffMins / 60)} hours ago`;
    }
  };

  // Remove urgent order logic - treat all orders equally

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  return (
    <Box sx={{ backgroundColor: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>
      {/* Header Section */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom sx={{ color: '#FFFFFF' }}>
              Kitchen Orders
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Manage incoming orders and track preparation progress
            </Typography>
          </Box>
          <Tooltip title="Refresh Orders">
            <Fab
              size="medium"
              color="primary"
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                boxShadow: 2,
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </Fab>
          </Tooltip>
        </Box>

        <Tabs
          value={1}
          aria-label="chef tabs"
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#FFA500',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFA500',
            },
          }}
        >
          <Tab
            label="Kitchen Dashboard"
            component={RouterLink}
            to="/chef"
            sx={{ fontWeight: 'medium' }}
          />
          <Tab
            label="Orders"
            component={RouterLink}
            to="/chef/orders"
            sx={{ fontWeight: 'medium' }}
          />
        </Tabs>
      </Box>

      {/* Order Status Tabs */}
      <Paper sx={{
        mb: 4,
        backgroundColor: '#121212',
        border: '1px solid rgba(255, 165, 0, 0.2)'
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'rgba(255, 165, 0, 0.2)',
            '& .MuiTab-root': {
              py: 2,
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#FFA500',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFA500',
            },
          }}
        >
          <Tab
            label={
              <Badge
                badgeContent={pendingOrders.length}
                color="warning"
                showZero
                sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: '1.2rem', minWidth: '1.2rem' } }}
              >
                <Box component="span">Pending Orders</Box>
              </Badge>
            }
            sx={{ fontWeight: 'medium' }}
          />
          <Tab
            label={
              <Badge
                badgeContent={acceptedOrders.length}
                color="info"
                showZero
                sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: '1.2rem', minWidth: '1.2rem' } }}
              >
                <Box component="span">Accepted Orders</Box>
              </Badge>
            }
            sx={{ fontWeight: 'medium' }}
          />
        </Tabs>
      </Paper>

      {/* Pending Orders Tab Panel */}
      {activeTab === 0 && (
        <Box mb={4}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ color: '#FFFFFF' }}>
            Orders Waiting for Acceptance
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : pendingOrders.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No pending orders at the moment.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {pendingOrders
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .map((order) => {

                  return (
                    <Grid item xs={12} lg={6} key={order.id}>
                      <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                        <Card
                          sx={{
                            backgroundColor: '#121212',
                            borderLeft: '6px solid',
                            borderColor: 'primary.main',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 24px rgba(63, 81, 181, 0.2)',
                            },
                          }}
                        >
                          <CardHeader
                            title={
                              <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center">
                                  <Typography variant="h6" component="span" fontWeight="bold">
                                    Order #{order.id}
                                  </Typography>
                                  <Chip
                                    label={`Table ${order.table_number}`}
                                    color="primary"
                                    size="small"
                                    sx={{ ml: 2 }}
                                  />
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip
                                    label="Normal"
                                    color="default"
                                    size="small"
                                    icon={<TimerIcon />}
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                </Box>
                              </Box>
                            }
                            subheader={
                              <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                <Box display="flex" alignItems="center">
                                  <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {getTimeElapsed(order.created_at)} ({formatDate(order.created_at)})
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            action={
                              <Tooltip title="Accept this order">
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="medium"
                                  startIcon={<ThumbUpIcon />}
                                  onClick={() => handleConfirmOpen(order.id, 'accept')}
                                  sx={{
                                    mt: 1,
                                    borderRadius: 2,
                                    fontWeight: 'bold',
                                  }}
                                >
                                  Accept Order
                                </Button>
                              </Tooltip>
                            }
                          />
                          <Divider />
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                              Order Items
                            </Typography>
                            <List disablePadding>
                              {order.items.map((item) => (
                                <ListItem
                                  key={item.id}
                                  disableGutters
                                  sx={{
                                    py: 1,
                                    borderBottom: '1px dashed rgba(0, 0, 0, 0.1)'
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Typography variant="body1" fontWeight="medium">
                                        {item.dish.name}
                                      </Typography>
                                    }
                                    secondary={
                                      item.remarks && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                          Note: {item.remarks}
                                        </Typography>
                                      )
                                    }
                                  />
                                  <Chip
                                    label={`Qty: ${item.quantity}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      </Zoom>
                    </Grid>
                  );
                })}
            </Grid>
          )}
        </Box>
      )}

      {/* Accepted Orders Tab Panel */}
      {activeTab === 1 && (
        <Box mb={4}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ color: '#FFFFFF' }}>
            Orders Being Prepared
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : acceptedOrders.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No accepted orders at the moment.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {acceptedOrders.map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                    <Card
                      sx={{
                        backgroundColor: '#121212',
                        borderLeft: '4px solid',
                        borderColor: 'info.main',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <CardHeader
                        title={
                          <Box display="flex" alignItems="center">
                            <Typography variant="h6" component="span">
                              Order #{order.id}
                            </Typography>
                            <Chip
                              label={`Table ${order.table_number}`}
                              color="primary"
                              size="small"
                              sx={{ ml: 2 }}
                            />
                            <Chip
                              label="Accepted"
                              color="info"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        subheader={
                          <Box display="flex" alignItems="center" mt={0.5}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                            <Typography variant="body2" color="text.secondary">
                              {getTimeElapsed(order.created_at)} ({formatDate(order.created_at)})
                            </Typography>
                          </Box>
                        }
                        action={
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleConfirmOpen(order.id, 'complete')}
                            sx={{ mt: 1 }}
                          >
                            Complete
                          </Button>
                        }
                      />
                      <Divider />
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                          Order Items
                        </Typography>
                        <List disablePadding>
                          {order.items.map((item) => (
                            <ListItem
                              key={item.id}
                              disableGutters
                              sx={{
                                py: 1,
                                borderBottom: '1px dashed rgba(0, 0, 0, 0.1)'
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body1" fontWeight="medium">
                                    {item.dish.name}
                                  </Typography>
                                }
                                secondary={
                                  item.remarks && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      Note: {item.remarks}
                                    </Typography>
                                  )
                                }
                              />
                              <Chip
                                label={`Qty: ${item.quantity}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmClose}
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            color: '#FFFFFF',
          }
        }}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.action === 'accept'
              ? `Are you sure you want to accept Order #${confirmDialog.orderId}?`
              : `Are you sure you want to mark Order #${confirmDialog.orderId} as completed?`
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>Cancel</Button>
          {confirmDialog.action === 'accept' ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleAcceptOrder}
              startIcon={<ThumbUpIcon />}
            >
              Yes, Accept
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleCompleteOrder}
              startIcon={<DoneAllIcon />}
            >
              Yes, Complete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiAlert-root': {
            backgroundColor: '#121212',
            color: '#FFFFFF',
          }
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChefOrders;
