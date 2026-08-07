import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Fab,
  Chip,
  CardActions,
  Tooltip,
  useTheme
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KitchenIcon from '@mui/icons-material/Kitchen';
import { chefService, adminService } from '../../services/api';

const ChefDashboard = () => {
  const theme = useTheme();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [acceptedOrdersCount, setAcceptedOrdersCount] = useState(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [databaseError, setDatabaseError] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Get pending and accepted orders
      const [pendingOrders, acceptedOrders] = await Promise.all([
        chefService.getPendingOrders(),
        chefService.getAcceptedOrders()
      ]);

      setPendingOrdersCount(pendingOrders.length);
      setAcceptedOrdersCount(acceptedOrders.length);

      // Remove urgent order calculation - treat all orders equally

      // Calculate total items from both pending and accepted orders
      let totalItems = 0;
      const allOrders = [...pendingOrders, ...acceptedOrders];
      allOrders.forEach(order => {
        order.items.forEach(item => {
          totalItems += item.quantity;
        });
      });
      setTotalItemsCount(totalItems);

      // Get completed orders count
      const completedData = await chefService.getCompletedOrdersCount();
      setCompletedOrdersCount(completedData.count);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();

    // Refresh data every 10 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', color: theme.palette.text.primary, pb: 4 }}>
      {/* Header Section */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mb={3}>
          <Box>
<Typography variant="h4" component="h1" fontWeight="bold" gutterBottom sx={{ color: theme.palette.text.primary, fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>
              Kitchen Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, display: { xs: 'none', sm: 'block' } }}>
              Monitor and manage kitchen operations in real-time
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <Tooltip title="Refresh Data">
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

      </Box>

      <Alert
        severity="info"
        sx={{
          mb: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          color: theme.palette.text.primary,
          '& .MuiAlert-icon': {
            color: '#FFA500'
          }
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium" sx={{ color: theme.palette.text.primary }}>🍳 Kitchen Dashboard</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Monitor and manage your kitchen operations efficiently. Use the "Orders" tab to manage incoming orders.
        </Typography>
      </Alert>

      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
            Kitchen Performance
          </Typography>
          <Chip
            icon={<KitchenIcon />}
            label="Live Status"
            color="success"
            variant="outlined"
            sx={{
              backgroundColor: 'rgba(77, 170, 87, 0.1)',
              border: '1px solid rgba(77, 170, 87, 0.5)',
              color: '#4DAA57'
            }}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card
              sx={{
                height: '100%',
                backgroundColor: theme.palette.background.paper,
                borderLeft: '4px solid',
                borderColor: 'warning.main',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 8px 24px rgba(255, 165, 0, 0.2)',
                },
              }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{
                      color: 'warning.main',
                      mb: 2,
                    }}>
                      <RestaurantIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography
                      variant="h3"
                      component="div"
                      fontWeight="bold"
                      color="warning.dark"
                    >
                      {pendingOrdersCount}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                      Pending Orders
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    component={RouterLink}
                    to="/chef/orders"
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    View Orders
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: theme.palette.background.paper,
                  borderLeft: '4px solid',
                  borderColor: 'info.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2)',
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{ color: 'info.main', mb: 2 }}>
                      <ThumbUpIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="info.dark">
                      {acceptedOrdersCount}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.secondary">
                      Accepted Orders
                    </Typography>

                    <Button
                      variant="outlined"
                      color="info"
                      component={RouterLink}
                      to="/chef/orders"
                      sx={{ mt: 2 }}
                    >
                      View Orders
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: theme.palette.background.paper,
                  borderLeft: '4px solid',
                  borderColor: 'success.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{ color: 'success.main', mb: 2 }}>
                      <CheckCircleIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="success.dark">
                      {completedOrdersCount}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.secondary">
                      Completed Orders
                    </Typography>

                    <Button
                      variant="outlined"
                      color="success"
                      disabled
                      sx={{ mt: 2, visibility: 'hidden' }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: theme.palette.background.paper,
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(63, 81, 181, 0.2)',
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      <LocalDiningIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                      {totalItemsCount}
                    </Typography>
                    <Typography variant="h6" component="div" color="text.secondary">
                      Total Items Prepared
                    </Typography>

                    <Button
                      variant="outlined"
                      color="primary"
                      disabled
                      sx={{ mt: 2, visibility: 'hidden' }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      <Box my={5}>
        <Divider sx={{ backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />
      </Box>
    </Box>
  );
};

export default ChefDashboard;
