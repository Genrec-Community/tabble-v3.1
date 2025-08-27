import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  TextField,
  InputAdornment,
  Fab,
  Badge
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaidIcon from '@mui/icons-material/Paid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TodayIcon from '@mui/icons-material/Today';
import PersonIcon from '@mui/icons-material/Person';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckIcon from '@mui/icons-material/Check';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { adminService } from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';

const AdminDashboard = () => {
  // State
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    paid_orders: 0,
    total_orders_today: 0,
    pending_orders_today: 0,
    completed_orders_today: 0,
    paid_orders_today: 0
  });
  const [completedOrders, setCompletedOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingCompletedOrders, setLoadingCompletedOrders] = useState(true);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch stats and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get statistics
        const statsData = await adminService.getOrderStats();
        setStats(statsData);
        setLoading(false);

        // Get completed orders for billing
        await fetchCompletedOrders();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load dashboard data',
          severity: 'error'
        });
        setLoading(false);
        setLoadingCompletedOrders(false);
      }
    };

    fetchData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [statusFilter]);



  // Fetch completed orders for billing
  const fetchCompletedOrders = async () => {
    setLoadingCompletedOrders(true);
    try {
      const completedOrdersData = await adminService.getCompletedOrdersForBilling();
      setCompletedOrders(completedOrdersData);
      setLoadingCompletedOrders(false);
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load completed orders',
        severity: 'error'
      });
      setLoadingCompletedOrders(false);
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    const newStatus = event.target.value;
    setStatusFilter(newStatus);
  };

  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const statsData = await adminService.getOrderStats();
      setStats(statsData);
      await fetchCompletedOrders();
      setSnackbar({
        open: true,
        message: 'Data refreshed successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to refresh data',
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Filter completed orders based on search query and status
  const filteredCompletedOrders = completedOrders.filter(order => {
    // Filter by status
    if (statusFilter && order.status !== statusFilter) return false;

    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.table_number.toString().includes(query) ||
      (order.person_name && order.person_name.toLowerCase().includes(query)) ||
      order.status.toLowerCase().includes(query)
    );
  });

  // View order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  // Close order details dialog
  const handleCloseOrderDetails = () => {
    setOrderDetailsOpen(false);
  };

  // Mark order as paid
  const handleMarkAsPaid = async (orderId) => {
    try {
      await adminService.markOrderAsPaid(orderId);

      // Close dialog
      setOrderDetailsOpen(false);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Order marked as paid!',
        severity: 'success'
      });

      // Refresh data
      const statsData = await adminService.getOrderStats();
      setStats(statsData);
      await fetchCompletedOrders();
    } catch (error) {
      console.error('Error marking order as paid:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark order as paid',
        severity: 'error'
      });
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

  // Get status chip
  const getStatusChip = (status) => {
    let color, icon, label;

    switch (status) {
      case 'pending':
        color = 'warning';
        icon = <PendingIcon fontSize="small" />;
        label = 'Pending';
        break;
      case 'completed':
        color = 'success';
        icon = <CheckCircleIcon fontSize="small" />;
        label = 'Completed';
        break;
      case 'payment_requested':
        color = 'info';
        icon = <ReceiptIcon fontSize="small" />;
        label = 'Payment Requested';
        break;
      case 'paid':
        color = 'secondary';
        icon = <PaidIcon fontSize="small" />;
        label = 'Paid';
        break;
      default:
        color = 'default';
        icon = null;
        label = status;
    }

    return (
      <Chip
        icon={icon}
        label={label}
        color={color}
        size="small"
        sx={{ '& .MuiChip-icon': { fontSize: '1rem' } }}
      />
    );
  };

  // Calculate order total - use stored total_amount if available, otherwise calculate from items
  const calculateOrderTotal = (order) => {
    if (!order) return 0;

    // If order has a stored total_amount (after discounts), use that
    if (order.total_amount !== null && order.total_amount !== undefined) {
      return parseFloat(order.total_amount).toFixed(2);
    }

    // Fallback to calculating from items (original prices)
    if (!order.items) return 0;
    return order.items.reduce((total, item) => {
      return total + (item.dish.price * item.quantity);
    }, 0).toFixed(2);
  };

  // Calculate order subtotal (before discounts)
  const calculateOrderSubtotal = (order) => {
    if (!order || !order.items) return 0;
    return order.items.reduce((total, item) => {
      return total + (item.dish.price * item.quantity);
    }, 0).toFixed(2);
  };

  // Generate bill PDF
  const handleGenerateBill = async (orderId) => {
    try {
      // Show loading message
      setSnackbar({
        open: true,
        message: 'Generating bill...',
        severity: 'info'
      });

      // Call API to generate bill
      const pdfBlob = await adminService.generateBill(orderId);

      // Create a URL for the blob
      const url = window.URL.createObjectURL(pdfBlob);

      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill_order_${orderId}.pdf`;

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Bill generated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating bill:', error);
      setSnackbar({
        open: true,
        message: 'Error generating bill',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Header Section */}
      <AdminPageHeader
        title="Dashboard"
        subtitle="Monitor and manage your restaurant operations"
        actions={
          <Tooltip title="Refresh Data">
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
        }
      />



      {/* Today's Statistics */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
            <TodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Today's Statistics
          </Typography>
          <Grid container spacing={3} mb={5}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderColor: 'primary.main',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.05) 0%, rgba(255, 165, 0, 0.02) 100%)',
                  border: '1px solid rgba(255, 165, 0, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(255, 165, 0, 0.3)',
                    background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%)',
                  },
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{
                      color: '#FFA500',
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 165, 0, 0.15)',
                      border: '2px solid rgba(255, 165, 0, 0.3)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '-4px',
                        left: '-4px',
                        right: '-4px',
                        bottom: '-4px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, rgba(255, 165, 0, 0.2), rgba(255, 165, 0, 0.1))',
                        zIndex: -1,
                      }
                    }}>
                      <ReceiptIcon sx={{ fontSize: 48, filter: 'drop-shadow(0 2px 4px rgba(255, 165, 0, 0.3))' }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="#FFA500" sx={{
                      textShadow: '0 2px 4px rgba(255, 165, 0, 0.3)',
                      mb: 1
                    }}>
                      {stats.total_orders_today}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Total Orders Today
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1} sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: '12px',
                      px: 1.5,
                      py: 0.5,
                      border: '1px solid rgba(76, 175, 80, 0.3)'
                    }}>
                      <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        +{((stats.total_orders_today / Math.max(stats.total_orders, 1)) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderColor: 'warning.main',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.02) 100%)',
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(255, 152, 0, 0.3)',
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 152, 0, 0.04) 100%)',
                  },
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{
                      color: '#FF9800',
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 152, 0, 0.15)',
                      border: '2px solid rgba(255, 152, 0, 0.3)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '-4px',
                        left: '-4px',
                        right: '-4px',
                        bottom: '-4px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1))',
                        zIndex: -1,
                      }
                    }}>
                      <PendingIcon sx={{ fontSize: 48, filter: 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.3))' }} />
                      {stats.pending_orders_today > 0 && (
                        <Badge
                          badgeContent={stats.pending_orders_today}
                          color="error"
                          sx={{
                            position: 'absolute',
                            top: -12,
                            right: -12,
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              animation: stats.pending_orders_today > 5 ? 'pulse 2s infinite' : 'none',
                            }
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="#FF9800" sx={{
                      textShadow: '0 2px 4px rgba(255, 152, 0, 0.3)',
                      mb: 1
                    }}>
                      {stats.pending_orders_today}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Pending Today
                    </Typography>
                    {stats.pending_orders_today > 0 && (
                      <Box display="flex" alignItems="center" mt={1} sx={{
                        backgroundColor: stats.pending_orders_today > 5 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                        borderRadius: '12px',
                        px: 1.5,
                        py: 0.5,
                        border: stats.pending_orders_today > 5 ? '1px solid rgba(244, 67, 54, 0.3)' : '1px solid rgba(255, 152, 0, 0.3)'
                      }}>
                        <AccessTimeIcon fontSize="small" color={stats.pending_orders_today > 5 ? "error" : "warning"} sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color={stats.pending_orders_today > 5 ? "error.main" : "warning.main"} fontWeight="bold">
                          {stats.pending_orders_today > 5 ? 'Urgent!' : 'Needs Attention'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderColor: 'success.main',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 100%)',
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(76, 175, 80, 0.3)',
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.04) 100%)',
                  },
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{
                      color: '#4CAF50',
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      border: '2px solid rgba(76, 175, 80, 0.3)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '-4px',
                        left: '-4px',
                        right: '-4px',
                        bottom: '-4px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
                        zIndex: -1,
                      }
                    }}>
                      <CheckCircleIcon sx={{ fontSize: 48, filter: 'drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3))' }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="#4CAF50" sx={{
                      textShadow: '0 2px 4px rgba(76, 175, 80, 0.3)',
                      mb: 1
                    }}>
                      {stats.completed_orders_today}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Completed Today
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1} sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: '12px',
                      px: 1.5,
                      py: 0.5,
                      border: '1px solid rgba(76, 175, 80, 0.3)'
                    }}>
                      <CheckIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Ready for Billing
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderColor: '#9C27B0',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(156, 39, 176, 0.02) 100%)',
                  border: '1px solid rgba(156, 39, 176, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(156, 39, 176, 0.3)',
                    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.04) 100%)',
                  },
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{
                      color: '#9C27B0',
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(156, 39, 176, 0.15)',
                      border: '2px solid rgba(156, 39, 176, 0.3)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '-4px',
                        left: '-4px',
                        right: '-4px',
                        bottom: '-4px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, rgba(156, 39, 176, 0.2), rgba(156, 39, 176, 0.1))',
                        zIndex: -1,
                      }
                    }}>
                      <PaidIcon sx={{ fontSize: 48, filter: 'drop-shadow(0 2px 4px rgba(156, 39, 176, 0.3))' }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="#9C27B0" sx={{
                      textShadow: '0 2px 4px rgba(156, 39, 176, 0.3)',
                      mb: 1
                    }}>
                      ₹{(stats.revenue_today || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Revenue Today
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1} sx={{
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                      borderRadius: '12px',
                      px: 1.5,
                      py: 0.5,
                      border: '1px solid rgba(156, 39, 176, 0.3)'
                    }}>
                      <AccountBalanceWalletIcon fontSize="small" sx={{ color: '#9C27B0', mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: '#9C27B0' }} fontWeight="bold">
                        {stats.paid_orders_today} Orders Paid
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

        </>
      )}

      {/* Completed Orders for Billing */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: 'background.paper',
          border: '2px solid rgba(255, 165, 0, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.02) 0%, rgba(255, 165, 0, 0.01) 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #FFA500, #FFB733)',
            borderRadius: '3px 3px 0 0',
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{
              p: 1.5,
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
            }}>
              <ReceiptIcon sx={{ color: '#FFA500', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
                Completed Orders for Billing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready for payment processing
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '12px',
              px: 2,
              py: 1,
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              <Badge badgeContent={filteredCompletedOrders.length} color="success">
                <PaidIcon sx={{ color: '#4CAF50' }} />
              </Badge>
              <Typography variant="body2" color="success.main" fontWeight="bold">
                {filteredCompletedOrders.length} Ready
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
              sx={{
                borderColor: 'rgba(255, 165, 0, 0.3)',
                color: '#FFA500',
                '&:hover': {
                  borderColor: '#FFA500',
                  backgroundColor: 'rgba(255, 165, 0, 0.05)',
                }
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>



        {/* Search and Filter for Completed Orders */}
        <Box mb={3} display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search completed orders..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Payment Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="completed">Ready for Payment</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loadingCompletedOrders ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : filteredCompletedOrders.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <ReceiptIcon />
              No completed orders found for billing.
            </Box>
          </Alert>
        ) : (
          <TableContainer sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px solid rgba(255, 165, 0, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'success.light' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Table</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Completed Time</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>Billing Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompletedOrders.map((order, index) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      backgroundColor: index % 2 === 0 ? 'background.default' : 'background.paper',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        #{order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Table ${order.table_number}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {order.person_name || 'Guest'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getStatusChip(order.status)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        ₹{calculateOrderTotal(order)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.updated_at || order.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Tooltip title="Generate Bill">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ReceiptIcon />}
                            onClick={() => handleGenerateBill(order.id)}
                            color="success"
                            sx={{
                              borderRadius: 2,
                              minWidth: 100,
                              fontWeight: 'bold'
                            }}
                          >
                            Bill
                          </Button>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewOrderDetails(order)}
                            sx={{ borderRadius: 2 }}
                          >
                            View
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Order Details Dialog */}
      <Dialog
        open={orderDetailsOpen}
        onClose={handleCloseOrderDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Order Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    #{selectedOrder.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Table
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder.table_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder.person_name || 'Guest'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {getStatusChip(selectedOrder.status)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedOrder.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    ₹{calculateOrderTotal(selectedOrder)}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.dish.name}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.dish.price.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{(item.dish.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>{item.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Total Amount:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ₹{calculateOrderTotal(selectedOrder)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDetails}>Close</Button>
          {selectedOrder && (selectedOrder.status === 'completed' || selectedOrder.status === 'paid') && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleGenerateBill(selectedOrder.id)}
            >
              Generate Bill
            </Button>
          )}
          {selectedOrder && selectedOrder.status === 'payment_requested' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PaidIcon />}
              onClick={() => handleMarkAsPaid(selectedOrder.id)}
            >
              Mark as Paid
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
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
