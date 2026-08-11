import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
  Zoom,
  Paper,
  LinearProgress,
  Tooltip,
  IconButton,
  Fab,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import RefreshIcon from '@mui/icons-material/Refresh';
import TimerIcon from '@mui/icons-material/Timer';
import { chefService } from '../../services/api';

const ChefOrders = () => {
  const theme = useTheme();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 for pending, 1 for accepted
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    orderId: null,
    itemId: null,
    itemName: '',
    action: '' // 'accept', 'acceptAll', 'rejectItem', 'complete'
  });
  const [rejectReason, setRejectReason] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [refreshing, setRefreshing] = useState(false);

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

  // Open confirm dialog for an action
  const handleConfirmOpen = (orderId, action, itemId = null, itemName = '') => {
    setRejectReason('');
    setConfirmDialog({
      open: true,
      orderId,
      itemId,
      itemName,
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

  // Accept the whole order (every pending dish)
  const handleAcceptAllOrder = async () => {
    try {
      await chefService.acceptOrder(confirmDialog.orderId);

      handleConfirmClose();

      setSnackbar({
        open: true,
        message: 'Order accepted successfully!',
        severity: 'success'
      });

      await fetchOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      setSnackbar({
        open: true,
        message: 'Failed to accept order',
        severity: 'error'
      });
      handleConfirmClose();
    }
  };

  // Accept a single dish
  const handleAcceptItem = async () => {
    try {
      await chefService.acceptOrderItem(confirmDialog.orderId, confirmDialog.itemId);

      handleConfirmClose();

      setSnackbar({
        open: true,
        message: `${confirmDialog.itemName} accepted`,
        severity: 'success'
      });

      await fetchOrders();
    } catch (error) {
      console.error('Error accepting dish:', error);
      setSnackbar({
        open: true,
        message: 'Failed to accept dish',
        severity: 'error'
      });
      handleConfirmClose();
    }
  };

  // Reject a single dish (with optional reason)
  const handleRejectItem = async () => {
    try {
      await chefService.rejectOrderItem(confirmDialog.orderId, confirmDialog.itemId, rejectReason.trim() || null);

      handleConfirmClose();

      setSnackbar({
        open: true,
        message: rejectReason.trim()
          ? `${confirmDialog.itemName} rejected — ${rejectReason.trim()}`
          : `${confirmDialog.itemName} rejected`,
        severity: 'warning'
      });

      await fetchOrders();
    } catch (error) {
      console.error('Error rejecting dish:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reject dish',
        severity: 'error'
      });
      handleConfirmClose();
    }
  };

  // Mark order as completed
  const handleCompleteOrder = async () => {
    try {
      await chefService.completeOrder(confirmDialog.orderId);

      handleConfirmClose();

      setSnackbar({
        open: true,
        message: 'Order marked as delivered!',
        severity: 'success'
      });

      await fetchOrders();
    } catch (error) {
      console.error('Error completing order:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to complete order',
        severity: 'error'
      });
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

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Customer identity shown on each order card so the chef can track who ordered
  const CustomerIdentity = ({ order }) => {
    const parts = [];
    if (order.person_name && order.person_name !== 'Guest') parts.push(order.person_name);
    if (order.unique_id) parts.push(order.unique_id);
    if (parts.length === 0) return null;
    return (
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5} mt={1}>
        <PersonIcon fontSize="small" sx={{ opacity: 0.7 }} />
        {parts.map((p, idx) => (
          <Chip
            key={idx}
            label={p}
            size="small"
            color="default"
            icon={<LocalOfferIcon />}
            sx={{ fontWeight: 'bold', fontSize: '0.72rem', height: 22 }}
          />
        ))}
      </Box>
    );
  };

  // Per-dish status chip (accepted / rejected / pending)
  const ItemStatusChip = ({ item }) => {
    if (item.status === 'accepted') {
      return <Chip label="Accepted" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />;
    }
    if (item.status === 'rejected') {
      return <Chip label="Rejected" size="small" color="error" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />;
    }
    return <Chip label="Pending" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />;
  };

  // Accept / reject buttons for a single pending dish
  const ItemActionButtons = ({ order, item }) => (
    <Box display="flex" gap={0.5}>
      <Tooltip title={`Accept ${item.dish?.name || 'this dish'}`}>
        <IconButton
          size="small"
          color="success"
          sx={{ border: '1px solid rgba(77,170,87,0.5)' }}
          onClick={() => handleConfirmOpen(order.id, 'acceptItem', item.id, item.dish?.name || 'Dish')}
        >
          <ThumbUpIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Reject ${item.dish?.name || 'this dish'}`}>
        <IconButton
          size="small"
          color="error"
          sx={{ border: '1px solid rgba(255,56,92,0.5)' }}
          onClick={() => handleConfirmOpen(order.id, 'rejectItem', item.id, item.dish?.name || 'Dish')}
        >
          <ThumbDownIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // Shared dish list renderer: shows per-dish status and actions for pending dishes
  const renderItems = (order) => (
    <List disablePadding>
      {order.items.map((item) => (
        <ListItem
          key={item.id}
          disableGutters
          sx={{
            py: 1,
            borderBottom: '1px dashed rgba(128,128,128,0.2)',
            backgroundColor: item.status === 'rejected'
              ? 'rgba(255,56,92,0.06)'
              : item.status === 'accepted'
                ? 'rgba(77,170,87,0.05)'
                : 'transparent',
          }}
        >
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" fontWeight="medium">
                  {item.dish.name}
                </Typography>
                <ItemStatusChip item={item} />
              </Box>
            }
            secondary={
              <>
                {item.remarks && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Note: {item.remarks}
                  </Typography>
                )}
                {item.status === 'rejected' && item.rejection_reason && (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                    Reason: {item.rejection_reason}
                  </Typography>
                )}
              </>
            }
          />
          <Chip
            label={`Qty: ${item.quantity}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          {item.status === 'pending' && <ItemActionButtons order={order} item={item} />}
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', color: theme.palette.text.primary }}>
      {/* Header Section */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mb={3}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom sx={{ color: theme.palette.text.primary, fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>
              Kitchen Orders
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, display: { xs: 'none', sm: 'block' } }}>
              Accept or reject each dish — the customer is notified of every move
            </Typography>
          </Box>
          <Tooltip title="Refresh Orders">
            <Fab
              size="small"
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

      </Box>

      {/* Order Status Tabs */}
      <Paper sx={{
        mb: 4,
        backgroundColor: theme.palette.background.paper,
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
              color: theme.palette.text.secondary,
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
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ color: theme.palette.text.primary }}>
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
                  const pendingCount = order.items.filter(i => i.status === 'pending').length;
                  return (
                    <Grid item xs={12} lg={6} key={order.id}>
                      <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                        <Card
                          sx={{
                            backgroundColor: theme.palette.background.paper,
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
                                <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                                  <Typography variant="h6" component="span" fontWeight="bold">
                                    Order #{order.id}
                                  </Typography>
                                  <Chip
                                    label={`Table ${order.table_number}`}
                                    color="primary"
                                    size="small"
                                  />
                                  <Chip
                                    label={`Seat ${order.slot_number}`}
                                    color="default"
                                    size="small"
                                  />
                                </Box>
                                <Chip
                                  label={`${pendingCount} dish${pendingCount !== 1 ? 'es' : ''} to decide`}
                                  color="warning"
                                  size="small"
                                  icon={<TimerIcon />}
                                  sx={{ fontWeight: 'bold' }}
                                />
                              </Box>
                            }
                            subheader={
                              <Box mt={1}>
                                <Box display="flex" alignItems="center">
                                  <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {getTimeElapsed(order.created_at)} ({formatDate(order.created_at)})
                                  </Typography>
                                </Box>
                                <CustomerIdentity order={order} />
                              </Box>
                            }
                            action={
                              <Tooltip title="Accept every dish in this order">
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="medium"
                                  startIcon={<ThumbUpIcon />}
                                  onClick={() => handleConfirmOpen(order.id, 'acceptAll')}
                                  sx={{
                                    mt: 1,
                                    borderRadius: 2,
                                    fontWeight: 'bold',
                                  }}
                                >
                                  Accept All
                                </Button>
                              </Tooltip>
                            }
                          />
                          <Divider />
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                              Order Items — accept or reject each dish
                            </Typography>
                            {renderItems(order)}
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
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ color: theme.palette.text.primary }}>
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
              {acceptedOrders.map((order) => {
                const hasPendingItems = order.items.some(i => i.status === 'pending');
                return (
                  <Grid item xs={12} key={order.id}>
                    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                      <Card
                        sx={{
                          backgroundColor: theme.palette.background.paper,
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
                            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                              <Typography variant="h6" component="span">
                                Order #{order.id}
                              </Typography>
                              <Chip
                                label={`Table ${order.table_number}`}
                                color="primary"
                                size="small"
                              />
                              <Chip
                                label={`Seat ${order.slot_number}`}
                                color="default"
                                size="small"
                              />
                              <Chip
                                label="Accepted"
                                color="info"
                                size="small"
                              />
                            </Box>
                          }
                          subheader={
                            <Box mt={1}>
                              <Box display="flex" alignItems="center">
                                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {getTimeElapsed(order.created_at)} ({formatDate(order.created_at)})
                                </Typography>
                              </Box>
                              <CustomerIdentity order={order} />
                            </Box>
                          }
                          action={
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleConfirmOpen(order.id, 'complete')}
                              disabled={hasPendingItems}
                              sx={{ mt: 1 }}
                            >
                              Delivered
                            </Button>
                          }
                        />
                        {hasPendingItems && (
                          <LinearProgress color="warning" />
                        )}
                        <Divider />
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                            Order Items {hasPendingItems && (
                              <Box component="span" color="warning.main" fontWeight="bold">
                                — decide the remaining dishes to deliver
                              </Box>
                            )}
                          </Typography>
                          {renderItems(order)}
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

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmClose}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }
        }}
      >
        <DialogTitle>
          {confirmDialog.action === 'acceptAll' ? 'Accept Order' :
           confirmDialog.action === 'acceptItem' ? 'Accept Dish' :
           confirmDialog.action === 'rejectItem' ? 'Reject Dish' :
           'Mark as Delivered'}
        </DialogTitle>
        <DialogContent>
          {confirmDialog.action === 'acceptAll' && (
            <Typography>
              Are you sure you want to accept Order #{confirmDialog.orderId}? Every dish will be marked as accepted and the customer will be notified.
            </Typography>
          )}
          {confirmDialog.action === 'acceptItem' && (
            <Typography>
              Accept <strong>{confirmDialog.itemName}</strong> from Order #{confirmDialog.orderId}? The customer will be notified.
            </Typography>
          )}
          {confirmDialog.action === 'rejectItem' && (
            <>
              <Typography sx={{ mb: 2 }}>
                Reject <strong>{confirmDialog.itemName}</strong> from Order #{confirmDialog.orderId}? The customer will be notified immediately.
              </Typography>
              <TextField
                label="Rejection reason (optional)"
                fullWidth
                multiline
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Ingredient not available today"
              />
            </>
          )}
          {confirmDialog.action === 'complete' && (
            <Typography>
              Are you sure you want to mark Order #{confirmDialog.orderId} as delivered? The customer will be notified and can request the bill.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>Cancel</Button>
          {confirmDialog.action === 'acceptAll' && (
            <Button variant="contained" color="primary" onClick={handleAcceptAllOrder} startIcon={<ThumbUpIcon />}>
              Yes, Accept All
            </Button>
          )}
          {confirmDialog.action === 'acceptItem' && (
            <Button variant="contained" color="success" onClick={handleAcceptItem} startIcon={<ThumbUpIcon />}>
              Yes, Accept
            </Button>
          )}
          {confirmDialog.action === 'rejectItem' && (
            <Button variant="contained" color="error" onClick={handleRejectItem} startIcon={<ThumbDownIcon />}>
              Yes, Reject
            </Button>
          )}
          {confirmDialog.action === 'complete' && (
            <Button variant="contained" color="success" onClick={handleCompleteOrder} startIcon={<DoneAllIcon />}>
              Yes, Delivered
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
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
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
