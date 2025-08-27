import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Snackbar,
  Alert,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  IconButton,
  Divider,
  Badge,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  CircularProgress,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FeedbackDialog from '../../components/FeedbackDialog';
import { customerService } from '../../services/api';
import OrderHistoryDialog from './components/OrderHistoryDialog';
import CartDialog from './components/CartDialog';
import ProductionErrorBoundary from '../../components/ProductionErrorBoundary';
import { handleApiError, showUserFriendlyError } from '../../utils/errorHandler';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import {
  useMenuData,
  useOrderManagement,
  useCartManagement,
  useDiscountManagement
} from '../../hooks/useMenuOptimized';

// Import components
import HeroBanner from './components/HeroBanner';
import SpecialOffers from './components/SpecialOffers';
import TodaySpecials from './components/TodaySpecials';
import MenuCategories from './components/MenuCategories';

import MenuItemsGrid from './components/MenuItemsGrid';

const CustomerMenu = () => {
  // Performance monitoring
  const performanceStats = usePerformanceMonitor('CustomerMenu', 150);

  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tableNumber = queryParams.get('table_number');
  const uniqueId = queryParams.get('unique_id');
  const userId = queryParams.get('user_id');

  // Redirect if table number, unique ID, or user ID is missing
  useEffect(() => {
    if (!tableNumber || !uniqueId || !userId) {
      navigate('/customer');
    }
  }, [tableNumber, uniqueId, userId, navigate]);

  // Optimized hooks for data management
  const {
    dishes,
    categories,
    offers,
    specials,
    enhancedDishes,
    loading,
    errors,
    refetch: refetchMenuData
  } = useMenuData();

  const {
    currentOrder,
    unpaidOrders,
    userOrders,
    hasEverPlacedOrder,
    hasPlacedOrderInSession,
    isPollingActive,
    fetchOrders,
    markOrderPlaced
  } = useOrderManagement(userId, tableNumber);

  const {
    cart,
    addToCart,
    removeFromCart,
    reorderCart,
    clearCart,
    cartTotal,
    cartCount
  } = useCartManagement();

  const {
    discounts,
    fetchDiscounts
  } = useDiscountManagement(userId);

  // UI State
  const [currentCategory, setCurrentCategory] = useState('All');
  const [vegetarianFilter, setVegetarianFilter] = useState('All'); // 'All', 'Vegetarian', 'Non-Vegetarian'
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [lastPaidOrderId, setLastPaidOrderId] = useState(null);
  const [databaseName, setDatabaseName] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Memoized category colors
  const categoryColors = useMemo(() => ({
    'Appetizer': theme.palette.primary.main,
    'Main Course': theme.palette.secondary.main,
    'Dessert': theme.palette.error.main,
    'Beverage': theme.palette.success.main,
  }), [theme.palette]);

  // Memoized filtered dishes based on category and vegetarian filter
  const memoizedFilteredDishes = useMemo(() => {
    let filtered = enhancedDishes;

    // Apply category filter
    if (currentCategory !== 'All') {
      filtered = filtered.filter(dish => {
        // Parse categories from JSON format
        let dishCategories = [];
        try {
          dishCategories = JSON.parse(dish.category || '[]');
          if (!Array.isArray(dishCategories)) {
            dishCategories = [dish.category];
          }
        } catch (e) {
          dishCategories = dish.category ? [dish.category] : [];
        }
        return dishCategories.includes(currentCategory);
      });
    }

    // Apply vegetarian filter
    if (vegetarianFilter !== 'All') {
      filtered = filtered.filter(dish => {
        if (vegetarianFilter === 'Vegetarian') {
          return dish.is_vegetarian === 1;
        } else if (vegetarianFilter === 'Non-Vegetarian') {
          return dish.is_vegetarian === 0;
        }
        return true;
      });
    }

    return filtered;
  }, [enhancedDishes, currentCategory, vegetarianFilter]);

  // Update filtered dishes when memoized value changes
  useEffect(() => {
    setFilteredDishes(memoizedFilteredDishes);
  }, [memoizedFilteredDishes]);

  // Load database name with error handling
  useEffect(() => {
    const fetchDatabaseName = async () => {
      try {
        const storedDatabaseName = localStorage.getItem('selectedDatabase');
        if (storedDatabaseName) {
          setDatabaseName(storedDatabaseName);
        } else {
          const dbData = await customerService.getCurrentDatabase();
          setDatabaseName(dbData.database_name || '');
        }
      } catch (error) {
        const errorInfo = handleApiError(error, 'fetching database name');
        setSnackbar(showUserFriendlyError(error, 'fetching database name'));
        setDatabaseName('');
      }
    };

    fetchDatabaseName();
  }, []);

  // Mark table as occupied when component loads
  useEffect(() => {
    const markTableAsOccupied = async () => {
      if (tableNumber) {
        try {
          await customerService.setTableOccupiedByNumber(parseInt(tableNumber));
        } catch (error) {
          // Silent fail for table occupation
          handleApiError(error, 'marking table as occupied');
        }
      }
    };

    markTableAsOccupied();
  }, [tableNumber]);

  // Optimized category change handler
  const handleCategoryChange = useCallback((_, newValue) => {
    setCurrentCategory(newValue);
  }, []);

  // Vegetarian filter change handler
  const handleVegetarianFilterChange = useCallback((_, newValue) => {
    setVegetarianFilter(newValue);
  }, []);

  // Optimized dialog handlers
  const handleOpenDialog = useCallback((dish) => {
    setSelectedDish(dish);
    setQuantity(1);
    setRemarks('');
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  // Optimized add to cart handler
  const handleAddToCart = useCallback(() => {
    if (!selectedDish) return;

    const newItem = addToCart(selectedDish, quantity, remarks);
    setOpenDialog(false);

    setSnackbar({
      open: true,
      message: `${selectedDish.name} added to cart`,
      severity: 'success'
    });
  }, [selectedDish, quantity, remarks, addToCart]);

  // Optimized cart handlers using the hook
  const handleRemoveFromCart = useCallback((index) => {
    removeFromCart(index);
  }, [removeFromCart]);

  const handleReorderCart = useCallback((index, direction) => {
    reorderCart(index, direction);
  }, [reorderCart]);

  // Memoized calculate discounted price
  const calculateDiscountedPrice = useCallback((price, discount) => {
    return (price - (price * discount / 100)).toFixed(2);
  }, []);

  // Optimized place order function
  const handlePlaceOrder = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const username = urlParams.get('username');
      const password = urlParams.get('password');

      const sortedCart = [...cart].sort((a, b) => a.position - b.position);

      const orderData = {
        table_number: parseInt(tableNumber),
        unique_id: uniqueId,
        ...(username && { username }),
        ...(password && { password }),
        items: sortedCart.map(item => ({
          dish_id: item.dish_id,
          quantity: item.quantity,
          remarks: item.remarks
        }))
      };

      const response = await customerService.createOrder(orderData, userId);

      // Mark order placed and clear cart
      markOrderPlaced();
      clearCart();

      setSnackbar({
        open: true,
        message: `Order placed successfully! Order #${response.id}`,
        severity: 'success'
      });

      // Refresh orders
      await fetchOrders();
    } catch (error) {
      setSnackbar(showUserFriendlyError(error, 'placing order'));
    }
  }, [cart, tableNumber, uniqueId, userId, markOrderPlaced, clearCart, fetchOrders]);

  // Optimized payment request handler
  const handleRequestPayment = useCallback(async () => {
    try {
      await fetchOrders(); // Refresh orders first

      const completedOrders = userOrders.filter(order =>
        order.status === 'completed' &&
        order.table_number === parseInt(tableNumber)
      );

      if (completedOrders.length === 0) {
        setSnackbar({
          open: true,
          message: 'No completed orders found for payment. Orders must be completed by the chef before payment.',
          severity: 'warning'
        });
        return;
      }

      // Calculate total for discount calculation
      const totalOrderAmount = completedOrders.reduce((total, order) => {
        return total + (order.items ? order.items.reduce((sum, item) =>
          sum + (item.dish?.price || 0) * item.quantity, 0) : 0);
      }, 0);

      // Fetch discounts
      await fetchDiscounts(totalOrderAmount);

      setPaymentDialogOpen(true);
    } catch (error) {
      setSnackbar(showUserFriendlyError(error, 'loading payment details'));
    }
  }, [fetchOrders, userOrders, tableNumber, fetchDiscounts]);

  // Optimized dialog handlers
  const handleClosePaymentDialog = useCallback(() => {
    setPaymentDialogOpen(false);
  }, []);

  // Optimized complete payment handler
  const handleCompletePayment = useCallback(async () => {
    try {
      const completedOrders = userOrders.filter(order =>
        order.status === 'completed' &&
        order.table_number === parseInt(tableNumber)
      );

      const firstOrderId = completedOrders.length > 0 ? completedOrders[0].id : null;
      let successCount = 0;
      let errorCount = 0;

      // Process payments sequentially
      for (const order of completedOrders) {
        try {
          await customerService.requestPayment(order.id);
          successCount++;
        } catch (error) {
          handleApiError(error, `processing payment for order ${order.id}`);
          errorCount++;
        }
      }

      setLastPaidOrderId(firstOrderId);
      setPaymentDialogOpen(false);

      // Show appropriate message
      if (errorCount === 0) {
        setSnackbar({
          open: true,
          message: 'Payment completed successfully! The bill will arrive at your table soon.',
          severity: 'success'
        });
      } else if (successCount > 0) {
        setSnackbar({
          open: true,
          message: `${successCount} orders paid successfully. ${errorCount} orders failed. Please try again for failed orders.`,
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error processing payment. Please try again.',
          severity: 'error'
        });
        return;
      }

      // Refresh orders
      await fetchOrders();

      // Show feedback dialog after successful payment
      if (successCount > 0) {
        setTimeout(() => {
          setFeedbackDialogOpen(true);
        }, 1000);
      }
    } catch (error) {
      setSnackbar(showUserFriendlyError(error, 'processing payment'));
    }
  }, [userOrders, tableNumber, fetchOrders]);

  // Optimized quantity handlers
  const incrementQuantity = useCallback(() => {
    setQuantity(prev => prev + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  }, []);

  // Optimized dialog and UI handlers
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleOpenCartDialog = useCallback(() => {
    setCartDialogOpen(true);
  }, []);

  const handleCloseCartDialog = useCallback(() => {
    setCartDialogOpen(false);
  }, []);

  const handleOpenOrderHistory = useCallback(async () => {
    setOrderHistoryOpen(true);
    await fetchOrders();
  }, [fetchOrders]);

  const handleCloseOrderHistory = useCallback(() => {
    setOrderHistoryOpen(false);
  }, []);

  const handleBackToHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Memoized utility functions
  const formatDate = useCallback((dateString) => {
    return moment(dateString).tz('Asia/Kolkata').format('MMM D, YYYY h:mm A');
  }, []);

  const getStatusColor = useCallback((status) => {
    const statusColors = {
      'pending': 'warning',
      'accepted': 'info',
      'completed': 'success',
      'payment_requested': 'info',
      'paid': 'success',
      'cancelled': 'error'
    };
    return statusColors[status] || 'default';
  }, []);

  const getStatusLabel = useCallback((status) => {
    const statusLabels = {
      'pending': 'Waiting',
      'accepted': 'Preparing',
      'completed': 'Ready',
      'payment_requested': 'Payment Requested',
      'paid': 'Paid',
      'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
  }, []);

  return (
    <ProductionErrorBoundary>
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, position: 'relative' }}>
      {/* Back to Home Button - Only show if user hasn't placed any order in current session */}
      {!hasPlacedOrderInSession && (
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToHome}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '2px solid rgba(255, 165, 0, 0.5)',
              borderRadius: '25px',
              px: 3,
              py: 1,
              fontWeight: 'bold',
              fontSize: '0.9rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                borderColor: '#FFA500',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(255, 165, 0, 0.2)',
              },
              '&:active': {
                transform: 'translateY(0px)',
              }
            }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: '1.1rem', color: 'white' }} />
            Home
          </Button>
        </Box>
      )}

      {/* Hero Banner */}
      <HeroBanner tableNumber={tableNumber} uniqueId={uniqueId} databaseName={databaseName} />

      {/* Special Offers Section */}
      <SpecialOffers
        offers={offers}
        loading={loading.offers}
        handleOpenDialog={handleOpenDialog}
        calculateDiscountedPrice={calculateDiscountedPrice}
      />

      {/* Today's Special Section */}
      <TodaySpecials
        specials={specials}
        loading={loading.specials}
        handleOpenDialog={handleOpenDialog}
      />

      <Grid container spacing={4}>
        {/* Menu */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mb: 6,
              borderRadius: '6px',
              backgroundColor: '#121212',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 165, 0, 0.2)',
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
            }}
          >
            <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#FFFFFF',
                mb: 3,
                '&:after': {
                  content: '""',
                  display: 'block',
                  height: '2px',
                  flexGrow: 1,
                  backgroundColor: 'rgba(255, 165, 0, 0.3)',
                  ml: 2
                }
              }}
            >
              Our <Box component="span" sx={{ color: '#FFA500', ml: 1 }}>Menu</Box>
            </Typography>

            {/* Vegetarian Filter */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Tabs
                value={vegetarianFilter}
                onChange={handleVegetarianFilterChange}
                variant="standard"
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#FFA500',
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 'medium',
                    minWidth: 'auto',
                    px: 2,
                    '&.Mui-selected': {
                      color: '#FFA500',
                    },
                  },
                }}
              >
                <Tab
                  label="All"
                  value="All"
                  icon={<Chip label="All" size="small" sx={{ bgcolor: 'rgba(255, 165, 0, 0.2)', color: 'white' }} />}
                  iconPosition="start"
                />
                <Tab
                  label="Vegetarian"
                  value="Vegetarian"
                  icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4CAF50' }} />}
                  iconPosition="start"
                />
                <Tab
                  label="Non-Vegetarian"
                  value="Non-Vegetarian"
                  icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#F44336' }} />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Category Tabs */}
            <MenuCategories
              categories={categories}
              currentCategory={currentCategory}
              handleCategoryChange={handleCategoryChange}
              loading={loading.categories}
            />

            {/* Regular Menu Items */}
            <MenuItemsGrid
              filteredDishes={filteredDishes}
              currentCategory={currentCategory}
              loading={loading.dishes}
              handleOpenDialog={handleOpenDialog}
              categoryColors={categoryColors}
              theme={theme}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add to Cart Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '6px',
            backgroundColor: '#121212',
            color: 'white',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
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
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
          <Box display="flex" alignItems="center" gap={1}>
            {/* Vegetarian/Non-Vegetarian Indicator */}
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: selectedDish?.is_vegetarian === 1 ? '#4CAF50' : '#F44336',
                flexShrink: 0
              }}
            />
            <Typography variant="h6" fontWeight="bold" color="white">{selectedDish?.name}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 165, 0, 0.2)' }}>
          {selectedDish && (
            <>
              <Box
                sx={{
                  height: 200,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  mb: 3,
                  position: 'relative'
                }}
              >
                <img
                  src={selectedDish.image_path ? `${process.env.REACT_APP_API_BASE_URL}${selectedDish.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                  alt={selectedDish.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    p: 2,
                    color: 'white'
                  }}
                >
                  {selectedDish.is_offer === 1 ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        ₹{selectedDish.price.toFixed(2)}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        ₹{calculateDiscountedPrice(selectedDish.price, selectedDish.discount)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="h6" fontWeight="bold">₹{selectedDish.price.toFixed(2)}</Typography>
                  )}
                </Box>
              </Box>

              <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="white">
                Description
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }} paragraph>
                {selectedDish.description || 'A delicious dish prepared with quality ingredients.'}
              </Typography>

              <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />

              <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="white">
                Quantity
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                sx={{
                  border: '1px solid',
                  borderColor: 'rgba(255, 165, 0, 0.3)',
                  borderRadius: '4px',
                  width: 'fit-content',
                  px: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}
              >
                <IconButton
                  size="small"
                  onClick={decrementQuantity}
                  sx={{
                    color: quantity === 1 ? 'rgba(255,255,255,0.3)' : '#FFA500',
                    '&:hover': {
                      backgroundColor: quantity === 1 ? 'transparent' : 'rgba(255,165,0,0.1)'
                    }
                  }}
                  disabled={quantity === 1}
                >
                  <RemoveIcon />
                </IconButton>
                <TextField
                  variant="standard"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setQuantity(val);
                    }
                  }}
                  InputProps={{
                    disableUnderline: true,
                    inputProps: {
                      style: { textAlign: 'center', width: '30px', fontWeight: 'bold', color: 'white' }
                    }
                  }}
                />
                <IconButton size="small" onClick={incrementQuantity} sx={{ color: '#FFA500' }}>
                  <AddIcon />
                </IconButton>
              </Box>

              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="white">
                  Special Instructions (Optional)
                </Typography>
                <TextField
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                  placeholder="E.g., No onions, extra spicy, etc."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderColor: 'rgba(255, 165, 0, 0.3)',
                      color: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 165, 0, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FFA500',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 165, 0, 0.3)',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                    '& .MuiFormLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiFormLabel-root.Mui-focused': {
                      color: '#FFA500',
                    },
                  }}
                  InputProps={{
                    style: { color: 'white' }
                  }}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 3, backgroundColor: '#121212', borderTop: '1px solid rgba(255, 165, 0, 0.2)' }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 165, 0, 0.5)',
              color: '#FFA500',
              borderRadius: '4px',
              '&:hover': {
                borderColor: '#FFA500',
                backgroundColor: 'rgba(255, 165, 0, 0.08)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddToCart}
            sx={{
              px: 3,
              borderRadius: '4px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              backgroundColor: '#FFA500',
              '&:hover': {
                backgroundColor: '#E69500',
              }
            }}
          >
            Add to Cart {quantity > 1 && `(${quantity})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Confirmation Dialog */}

      {/* Snackbar for notifications */}
      {/* Cart Dialog with CartDialog component */}
      <CartDialog
        open={cartDialogOpen}
        onClose={handleCloseCartDialog}
        cart={cart}
        handleRemoveFromCart={handleRemoveFromCart}
        calculateTotal={() => cartTotal}
        handlePlaceOrder={handlePlaceOrder}
        currentOrder={currentOrder}
        handleReorderCart={handleReorderCart}
        specials={specials}
        handleOpenDialog={handleOpenDialog}
        calculateDiscountedPrice={calculateDiscountedPrice}
      />

      {/* Order History Dialog */}
      <OrderHistoryDialog
        open={orderHistoryOpen}
        onClose={handleCloseOrderHistory}
        userOrders={userOrders}
        loadingOrders={false}
        formatDate={formatDate}
        getStatusLabel={getStatusLabel}
        getStatusColor={getStatusColor}
        refreshOrders={fetchOrders}
      />

      {/* Bottom App Bar with View Cart Button */}
      <AppBar
        position="fixed"
        color="default"
        sx={{
          top: 'auto',
          bottom: 0,
          boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.3)',
          backgroundColor: '#000000',
          borderTop: '1px solid rgba(255, 165, 0, 0.2)'
        }}
      >
        <Toolbar>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={handleOpenOrderHistory}
            sx={{
              borderRadius: '4px',
              mr: 2,
              borderColor: 'rgba(255, 165, 0, 0.5)',
              borderWidth: '2px',
              color: '#FFA500',
              '&:hover': {
                borderColor: '#FFA500',
                backgroundColor: 'rgba(255, 165, 0, 0.1)'
              }
            }}
          >
            View Orders
          </Button>
          {/* Real-time update indicator */}
          {isPollingActive && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 2,
                px: 1,
                py: 0.5,
                borderRadius: '12px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}
            >
              <CircularProgress size={12} sx={{ color: '#4CAF50', mr: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#4CAF50', fontSize: '0.7rem' }}>
                Updating...
              </Typography>
            </Box>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color="primary"
            startIcon={
              <Badge
                badgeContent={cartCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    minWidth: '18px',
                    height: '18px',
                    backgroundColor: '#000000',
                    color: '#FFA500',
                    border: '1px solid #FFA500'
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
              borderRadius: '4px',
              fontWeight: 'bold',
              backgroundColor: '#FFA500',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
              '&:hover': {
                backgroundColor: '#E69500',
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4)',
              },
            }}
          >
            View Cart {cartCount > 0 && `(${cartCount})`}
          </Button>
          {/* Show payment button only if there are completed orders */}
          {userOrders && userOrders.some(order =>
            order.status === 'completed' &&
            order.table_number === parseInt(tableNumber)
          ) && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={handleRequestPayment}
              sx={{
                ml: 2,
                py: 1.2,
                px: 3,
                borderRadius: '4px',
                fontWeight: 'bold',
                backgroundColor: '#4DAA57',
                color: '#FFFFFF',
                border: '2px solid #4DAA57',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                  opacity: 0.5
                },
                '&:hover': {
                  backgroundColor: '#3D8A47',
                  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4)',
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

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: '#121212',
            color: 'white',
            border: '1px solid rgba(255, 165, 0, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
          <Box display="flex" alignItems="center">
            <PaymentIcon sx={{ mr: 2, color: '#FFA500' }} />
            <Typography variant="h5" component="h2" fontWeight="bold" color="white">
              Payment Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 165, 0, 0.2)' }}>
          {unpaidOrders.length > 0 ? (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 165, 0, 0.2)',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  color: 'white'
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ color: '#FFA500' }}>
                  Bill Summary
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} gutterBottom>
                    Table #{unpaidOrders[0].table_number}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {unpaidOrders.length} Completed {unpaidOrders.length === 1 ? 'Order' : 'Orders'} Ready for Payment
                  </Typography>
                </Box>

                {/* Display each unpaid order */}
                {unpaidOrders.map((order, orderIndex) => (
                  <Box key={order.id} sx={{ mb: orderIndex < unpaidOrders.length - 1 ? 3 : 0 }}>
                    <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="white">
                      Order #{order.id}
                    </Typography>
                    <List disablePadding>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color="white">
                                    {item.dish?.name || "Unknown Dish"} x{item.quantity}
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium" color="#FFA500">
                                    ₹{((item.dish?.price || 0) * item.quantity).toFixed(2)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" sx={{ fontStyle: 'italic' }}>
                          No items in this order
                        </Typography>
                      )}
                    </List>

                    {/* Order Subtotal */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1, mb: 1 }}>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Order Subtotal:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="#FFA500">
                        ₹{(order.items ? order.items.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0) : 0).toFixed(2)}
                      </Typography>
                    </Box>

                  </Box>
                ))}

                <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />

                <Box sx={{ mt: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)', p: 2, borderRadius: '8px', border: '1px dashed rgba(255, 165, 0, 0.3)' }}>
                  <Typography variant="subtitle2" color="#FFA500" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Applied Discounts:
                  </Typography>

                  {discounts.loyalty.discount_percentage > 0 ? (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      {discounts.loyalty.message}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic', mb: 0.5 }}>
                      No loyalty discount applied
                    </Typography>
                  )}

                  {discounts.selectionOffer.discount_amount > 0 ? (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      {discounts.selectionOffer.message}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                      No special offer discount applied
                    </Typography>
                  )}
                </Box>

                {/* Total Calculation */}
                {(() => {
                  // Calculate subtotal across all unpaid orders
                  const subtotal = unpaidOrders.reduce((total, order) => {
                    return total + (order.items ? order.items.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0) : 0);
                  }, 0);

                  // Calculate loyalty discount
                  const loyaltyDiscountAmount = discounts.loyalty.discount_percentage > 0
                    ? subtotal * (discounts.loyalty.discount_percentage / 100)
                    : 0;

                  // Calculate final total
                  const finalTotal = (subtotal - loyaltyDiscountAmount - discounts.selectionOffer.discount_amount);

                  return (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#4DAA57', borderRadius: '8px' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" color="#000000">Subtotal</Typography>
                        <Typography variant="subtitle1" color="#000000">
                          ₹{subtotal.toFixed(2)}
                        </Typography>
                      </Box>
                      {discounts.loyalty.discount_percentage > 0 && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="#000000">
                            Loyalty Discount ({discounts.loyalty.discount_percentage}%)
                          </Typography>
                          <Typography variant="body2" color="#000000">
                            -₹{loyaltyDiscountAmount.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      {discounts.selectionOffer.discount_amount > 0 && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="#000000">
                            Special Offer Discount
                          </Typography>
                          <Typography variant="body2" color="#000000">
                            -₹{discounts.selectionOffer.discount_amount.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)' }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="bold" color="#000000">TOTAL</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#000000">
                          ₹{finalTotal.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </Paper>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
                  Please proceed to the counter to complete your payment or click the button below to mark as paid.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="white" gutterBottom>
                No completed orders found for payment
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Orders must be completed by the chef before they can be paid. Please wait for your orders to be ready.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 165, 0, 0.2)' }}>
          <Button
            onClick={handleClosePaymentDialog}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 165, 0, 0.5)',
              color: 'white',
              '&:hover': {
                borderColor: 'rgba(255, 165, 0, 0.8)',
                backgroundColor: 'rgba(255, 165, 0, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCompletePayment}
            disabled={unpaidOrders.length === 0}
            sx={{
              py: 1.5,
              px: 4,
              fontWeight: 'bold',
              backgroundColor: '#FFA500',
              color: '#000000',
              borderRadius: 0,
              '&:hover': {
                backgroundColor: '#E69500',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(255, 165, 0, 0.3)',
                color: 'rgba(0, 0, 0, 0.5)'
              }
            }}
          >
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        orderId={lastPaidOrderId}
        personId={userId ? parseInt(userId) : null}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: '50px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </ProductionErrorBoundary>
  );
};

// Memoize the component for better performance
export default React.memo(CustomerMenu);


