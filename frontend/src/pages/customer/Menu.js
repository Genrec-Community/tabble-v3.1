import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import {
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
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CloseIcon from '@mui/icons-material/Close';
import FeedbackDialog from '../../components/FeedbackDialog';
import { customerService } from '../../services/api';
import CartDialog from './components/CartDialog';
import ProductionErrorBoundary from '../../components/ProductionErrorBoundary';
import { handleApiError, showUserFriendlyError } from '../../utils/errorHandler';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { useSlotHeartbeat } from '../../hooks/useSlotHeartbeat';
import {
  useMenuData,
  useOrderManagement,
  useCartManagement,
  useDiscountManagement
} from '../../hooks/useMenuOptimized';

// Import components
import SpecialOffers from './components/SpecialOffers';
import TodaySpecials from './components/TodaySpecials';

import MenuItemsGrid from './components/MenuItemsGrid';
import { apiBaseUrl } from '../../utils/apiBaseUrl';

const CustomerMenu = () => {
  // Performance monitoring
  const performanceStats = usePerformanceMonitor('CustomerMenu', 150);

  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tableNumber = queryParams.get('table_number') || localStorage.getItem('tableNumber');
  const uniqueId = queryParams.get('unique_id') || localStorage.getItem('customerUniqueId');
  const userId = queryParams.get('user_id') || localStorage.getItem('customerId');
  const slotNumber = queryParams.get('slot_number') || localStorage.getItem('slotNumber') || '1';

  // Whether this hotel shows prices on the menu
  const [showPrices, setShowPrices] = useState(true);

  useEffect(() => {
    const hotelName = localStorage.getItem('customerSelectedDatabase') || localStorage.getItem('selectedDatabase');
    if (!hotelName) return;
    fetch(`${apiBaseUrl}/settings/public/show-prices?hotel_name=${encodeURIComponent(hotelName)}`)
      .then(r => r.json())
      .then(data => setShowPrices(data.show_prices !== false))
      .catch(() => setShowPrices(true)); // default to showing prices on error
  }, []);

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
    moveCartItem,
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [lastPaidOrderId, setLastPaidOrderId] = useState(null);
  const [databaseName, setDatabaseName] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // ── Live order status tracking (per-move notifications) ──────────────────
  // Remembers the last seen status of every order so we can notify the user
  // the moment the chef accepts / rejects a dish or delivers / bills an order.
  const lastSeenStatuses = useRef({}); // orderId -> { status, items: {itemId: status} }
  const [notifQueue, setNotifQueue] = useState([]); // queued popups
  const [currentNotif, setCurrentNotif] = useState(null); // the popup being shown
  const [rejectionDialog, setRejectionDialog] = useState(null); // { orderId, dishes: [{name, reason}] }
  const paidCleanupDone = useRef(false);
  const [paidNotifiedOrders, setPaidNotifiedOrders] = useState([]);

  // Push the next queued notification (one at a time)
  useEffect(() => {
    if (currentNotif) return;
    if (notifQueue.length === 0) return;
    const [next, ...rest] = notifQueue;
    setCurrentNotif(next);
    setNotifQueue(rest);
  }, [notifQueue, currentNotif]);

  const handleNotifClose = useCallback(() => {
    setCurrentNotif(null);
  }, []);

  // Detect status changes on every order poll and notify the user of each move
  useEffect(() => {
    const myOrders = userOrders.filter(o => o.table_number === parseInt(tableNumber));
    if (myOrders.length === 0) return;

    const seen = { ...lastSeenStatuses.current };
    const events = [];
    let rejectedDishes = [];
    let paidOrders = [];

    myOrders.forEach((order) => {
      const itemMap = {};
      order.items.forEach(i => { itemMap[i.id] = i.status; });
      const prev = seen[order.id];
      seen[order.id] = { status: order.status, items: itemMap };

      if (!prev) return; // first sight — don't spam the user with old state

      // Per-dish moves
      order.items.forEach((item) => {
        const before = prev.items[item.id];
        if (before && before !== item.status) {
          if (item.status === 'accepted') {
            events.push({ message: `"${item.dish?.name || 'Dish'}" accepted by the kitchen`, severity: 'success' });
          } else if (item.status === 'rejected') {
            rejectedDishes.push({ name: item.dish?.name || 'Dish', reason: item.rejection_reason });
          }
        }
      });

      // Order-level moves
      if (prev.status !== order.status) {
        if (order.status === 'rejected' && rejectedDishes.length === 0) {
          rejectedDishes = order.items.map(i => ({ name: i.dish?.name || 'Dish', reason: i.rejection_reason }));
        } else if (order.status === 'accepted') {
          events.push({ message: `Order #${order.id} accepted — the kitchen is preparing it`, severity: 'success' });
        } else if (order.status === 'completed') {
          events.push({ message: `Order #${order.id} delivered — you can request the bill`, severity: 'success' });
        } else if (order.status === 'payment_requested') {
          events.push({ message: `Bill requested for Order #${order.id} — please pay at the counter`, severity: 'info' });
        } else if (order.status === 'paid') {
          paidOrders.push(order.id);
        } else if (order.status === 'cancelled') {
          events.push({ message: `Order #${order.id} cancelled`, severity: 'warning' });
        }
      }
    });

    lastSeenStatuses.current = seen;

    if (rejectedDishes.length > 0) {
      setRejectionDialog((prev) => ({
        dishes: [...(prev ? prev.dishes : []), ...rejectedDishes],
      }));
    }
    if (events.length > 0) {
      setNotifQueue(q => [...q, ...events]);
    }
    if (paidOrders.length > 0) {
      setPaidNotifiedOrders(prev => [...prev, ...paidOrders]);
      setLastPaidOrderId(paidOrders[0]);
    }
  }, [userOrders, tableNumber]);

  // When the admin marks the bill paid: notify, clear the session and wrap up the visit
  useEffect(() => {
    if (paidNotifiedOrders.length === 0 || paidCleanupDone.current) return;
    paidCleanupDone.current = true;

    setNotifQueue(q => [...q, ...paidNotifiedOrders.map(id => ({
      message: `Order #${id} paid — thank you for dining with us!`,
      severity: 'success',
    }))]);

    setSnackbar({ open: true, message: 'Bill settled — have a great day!', severity: 'success' });

    const finishVisit = async () => {
      try {
        const { auth } = await import('../../firebase');
        await auth.signOut();
      } catch { /* firebase may not be available */ }
      localStorage.removeItem('customerQrToken');
      localStorage.removeItem('customerId');
      localStorage.removeItem('customerDisplayName');
      localStorage.removeItem('tableNumber');
      localStorage.removeItem('slotNumber');
      localStorage.removeItem('customerSelectedDatabase');
      localStorage.removeItem('customerUniqueId');
    };

    finishVisit().then(() => {
      setTimeout(() => {
        setFeedbackDialogOpen(true);
      }, 2500);
      setTimeout(() => {
        window.location.href = '/';
      }, 9000);
    });
  }, [paidNotifiedOrders]);

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

    // Apply search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(dish =>
        dish.name?.toLowerCase().includes(query) ||
        (dish.description || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [enhancedDishes, currentCategory, vegetarianFilter, searchQuery]);

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

  // Mark slot as occupied when component loads
  useEffect(() => {
    const markTableAsOccupied = async () => {
      if (tableNumber && slotNumber) {
        try {
          await customerService.setTableOccupiedByNumber(parseInt(tableNumber), parseInt(slotNumber));
        } catch (error) {
          handleApiError(error, 'marking table as occupied');
        }
      }
    };
    markTableAsOccupied();
  }, [tableNumber, slotNumber]);

  // Heartbeat + auto-release — proves this customer is still browsing, so
  // the backend can free the slot when the browser is closed. The slot stays
  // occupied only while an unpaid order exists (releaseGuard).
  const hasUnsettledOrder = useCallback(() => {
    return (userOrders || []).some(order =>
      order.table_number === parseInt(tableNumber) &&
      !['paid', 'cancelled', 'merged'].includes(order.status)
    );
  }, [userOrders, tableNumber]);

  useSlotHeartbeat(tableNumber, slotNumber, { releaseGuard: hasUnsettledOrder });

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
        slot_number: parseInt(slotNumber),
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

  // Optimized bill request handler
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
          message: 'No delivered orders yet. Orders must be delivered by the chef before you can request the bill.',
          severity: 'warning'
        });
        return;
      }

      // Calculate total for discount calculation
      const totalOrderAmount = completedOrders.reduce((total, order) => {
        return total + (order.items ? order.items.reduce((sum, item) => {
          if (item.status === 'rejected') return sum;
          return sum + (item.price ?? item.dish?.price ?? 0) * item.quantity;
        }, 0) : 0);
      }, 0);

      // Fetch discounts
      await fetchDiscounts(totalOrderAmount);

      setPaymentDialogOpen(true);
    } catch (error) {
      setSnackbar(showUserFriendlyError(error, 'loading bill details'));
    }
  }, [fetchOrders, userOrders, tableNumber, fetchDiscounts]);

  // Optimized dialog handlers
  const handleClosePaymentDialog = useCallback(() => {
    setPaymentDialogOpen(false);
  }, []);

  // Request the bill for all delivered orders — the counter staff then
  // generates the bill and marks it paid (which frees the table).
  const handleCompletePayment = useCallback(async () => {
    try {
      const completedOrders = userOrders.filter(order =>
        order.status === 'completed' &&
        order.table_number === parseInt(tableNumber)
      );

      let successCount = 0;
      let errorCount = 0;

      // Process bill requests sequentially
      for (const order of completedOrders) {
        try {
          await customerService.requestPayment(order.id);
          successCount++;
        } catch (error) {
          handleApiError(error, `requesting the bill for order ${order.id}`);
          errorCount++;
        }
      }

      setPaymentDialogOpen(false);

      // Show appropriate message
      if (errorCount === 0) {
        setSnackbar({
          open: true,
          message: 'Bill requested! Please pay at the counter — the staff will confirm your payment.',
          severity: 'success'
        });
      } else if (successCount > 0) {
        setSnackbar({
          open: true,
          message: `Bill requested for ${successCount} order${successCount !== 1 ? 's' : ''}. ${errorCount} could not be requested.`,
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error requesting the bill. Please try again.',
          severity: 'error'
        });
        return;
      }

      // Refresh orders
      await fetchOrders();
    } catch (error) {
      setSnackbar(showUserFriendlyError(error, 'requesting the bill'));
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

  const handleBackToHome = useCallback(() => {
    navigate(`/customer/home?table_number=${tableNumber}&slot_number=${slotNumber}&unique_id=${uniqueId || ''}&user_id=${userId}`);
  }, [navigate, tableNumber, slotNumber, uniqueId, userId]);

  // Optimized utility functions
  const formatDate = useCallback((dateString) => {
    return moment(dateString).tz('Asia/Kolkata').format('MMM D, YYYY h:mm A');
  }, []);

  const getStatusColor = useCallback((status) => {
    const statusColors = {
      'pending': 'warning',
      'accepted': 'info',
      'rejected': 'error',
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
      'rejected': 'Rejected',
      'completed': 'Ready',
      'payment_requested': 'Bill Requested',
      'paid': 'Paid',
      'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
  }, []);

  // The order currently being worked on at this table (for the live status banner)
  const activeTableOrder = useMemo(() => {
    const active = userOrders.find(o =>
      o.table_number === parseInt(tableNumber) &&
      ['pending', 'accepted', 'payment_requested'].includes(o.status)
    );
    return active || null;
  }, [userOrders, tableNumber]);

  const hasCompletedForBill = userOrders.some(o =>
    o.status === 'completed' && o.table_number === parseInt(tableNumber)
  );
  const hasPaymentRequested = userOrders.some(o =>
    o.status === 'payment_requested' && o.table_number === parseInt(tableNumber)
  );

  return (
    <ProductionErrorBoundary>
      <Box sx={{
        minHeight: '100dvh',
        backgroundColor: theme.palette.background.default,
        position: 'relative',
        pb: 2,
      }}>
      {/* Sticky Header — title + search + cart (mobile app frame) */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: theme.palette.background.paper,
          pt: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          px: { xs: 2, sm: 3 },
          pb: 0.5,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
          <Box display="flex" alignItems="center" gap={0.5} minWidth={0}>
            <IconButton onClick={handleBackToHome} aria-label="Home" sx={{ color: theme.palette.text.primary, p: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold" noWrap sx={{ color: theme.palette.text.primary }}>
              {databaseName || 'Menu'}
            </Typography>
          </Box>
          {/* Cart button — square icon container, rounded corners */}
          <IconButton
            onClick={handleOpenCartDialog}
            aria-label="Cart"
            sx={{
              backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.09)',
              borderRadius: '12px',
              width: 44,
              height: 44,
              '&:hover': { backgroundColor: 'rgba(255,165,0,0.15)' },
            }}
          >
            <Badge badgeContent={cartCount} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 'bold' } }}>
              <ShoppingCartIcon sx={{ color: theme.palette.text.primary }} />
            </Badge>
          </IconButton>
        </Box>
        {/* Search bar — wide thin strip, magnifier left, subtle divider below */}
        <TextField
          fullWidth
          variant="standard"
          placeholder="Search dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />,
            sx: { fontSize: '0.95rem', pb: 1, color: theme.palette.text.primary },
          }}
          sx={{
            '& .MuiInput-underline:before': {
              borderBottomColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)',
            },
            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
              borderBottomColor: 'rgba(255,165,0,0.4)',
            },
            '& .MuiInput-underline:after': { borderBottomColor: '#FFA500' },
          }}
        />
      </Box>

      {/* Live Order Status Banner — keeps the user updated on every move */}
      {activeTableOrder && (
        <Paper
          elevation={3}
          sx={{
            mt: 2,
            mx: { xs: 2, sm: 3 },
            p: 2,
            borderRadius: '16px',
            backgroundColor: theme.palette.background.paper,
            border: '1px solid rgba(255, 165, 0, 0.3)',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" color={theme.palette.text.primary}>
                Order #{activeTableOrder.id}
                <Chip
                  label={getStatusLabel(activeTableOrder.status)}
                  color={getStatusColor(activeTableOrder.status)}
                  size="small"
                  sx={{ ml: 1, fontWeight: 'bold' }}
                />
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {activeTableOrder.status === 'payment_requested'
                  ? 'Bill requested — please pay at the counter'
                  : 'The kitchen is updating you live on every dish'}
              </Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={0.5} justifyContent="flex-end">
              {activeTableOrder.items.map((item) => (
                <Chip
                  key={item.id}
                  size="small"
                  label={item.dish?.name || 'Dish'}
                  color={item.status === 'rejected' ? 'error' : item.status === 'accepted' ? 'success' : 'warning'}
                  variant={item.status === 'pending' ? 'outlined' : 'filled'}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Main Content Sheet — asymmetric: top-left corner rounded, top-right straight */}
      <Box sx={{ mt: 2, px: { xs: 0, sm: 2 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: '28px 0 0 0',
            backgroundColor: theme.palette.background.paper,
            minHeight: '70vh',
            px: { xs: 2, sm: 3 },
            pt: 2.5,
            pb: 10,
            borderTop: '1px solid rgba(255,165,0,0.12)',
          }}
        >
          {/* Category Selector — horizontal text list, active is bold */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 1,
              mb: 1.5,
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {['All', ...categories.filter(c => c !== 'All')].map(cat => (
              <Typography
                key={cat}
                onClick={() => handleCategoryChange(null, cat)}
                sx={{
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: currentCategory === cat ? 700 : 500,
                  color: currentCategory === cat ? '#FFA500' : theme.palette.text.secondary,
                  transition: 'color 0.15s ease',
                }}
              >
                {cat}
              </Typography>
            ))}
          </Box>

          {/* Vegetarian filter pills */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
            {['All', 'Vegetarian', 'Non-Vegetarian'].map(v => (
              <Chip
                key={v}
                label={v}
                size="small"
                clickable
                onClick={() => handleVegetarianFilterChange(null, v)}
                sx={{
                  borderRadius: '999px',
                  flexShrink: 0,
                  backgroundColor: vegetarianFilter === v ? '#FFA500' : 'transparent',
                  color: vegetarianFilter === v ? '#000' : theme.palette.text.secondary,
                  fontWeight: vegetarianFilter === v ? 700 : 500,
                  border: '1px solid rgba(255,165,0,0.4)',
                }}
              />
            ))}
          </Box>

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

          {/* Regular Menu Items */}
          <MenuItemsGrid
            filteredDishes={filteredDishes}
            currentCategory={currentCategory}
            loading={loading.dishes}
            handleOpenDialog={handleOpenDialog}
            categoryColors={categoryColors}
            theme={theme}
            showPrices={showPrices}
          />
        </Paper>
      </Box>

      {/* Floating Get Bill bar — appears once orders are delivered */}
      {(hasCompletedForBill || hasPaymentRequested) && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            p: 1.5,
            backgroundColor: theme.palette.mode === 'light'
              ? 'rgba(255,255,255,0.96)'
              : 'rgba(23,23,21,0.96)',
            borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
            backdropFilter: 'blur(16px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            startIcon={<PaymentIcon />}
            onClick={handleRequestPayment}
            disabled={!hasCompletedForBill}
            sx={{
              py: 1.25,
              borderRadius: '14px',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              backgroundColor: '#4DAA57',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
              '&:hover': { backgroundColor: '#3D8A47' },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(77, 170, 87, 0.4)',
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            {hasCompletedForBill ? 'Get Bill' : 'Bill Requested'}
          </Button>
        </Box>
      )}

      {/* Bottom spacer when the bill bar is visible */}
      {(hasCompletedForBill || hasPaymentRequested) && (
        <Box sx={{ height: 'calc(88px + env(safe-area-inset-bottom, 0px))' }} />
      )}

      {/* Add to Cart Dialog — clean mobile bottom sheet */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { m: 0 } }}
        PaperProps={{
          sx: {
            borderRadius: '26px 26px 0 0',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.35)',
            maxHeight: { xs: '92dvh', sm: '85dvh' },
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        {selectedDish && (
          <>
            {/* Media — full-bleed, clipped to the sheet's rounded top corners */}
            <Box sx={{ position: 'relative', width: '100%', height: { xs: 220, sm: 280 }, flexShrink: 0 }}>
              <img
                src={selectedDish.image_path ? `${apiBaseUrl}${selectedDish.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'}
                alt={selectedDish.name}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* soft bottom gradient for legibility of the badge */}
              <Box sx={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 40%)',
              }} />
              {/* Vegetarian/Non-Vegetarian Indicator */}
              <Box
                sx={{
                  position: 'absolute', top: 14, left: 14,
                  width: 24, height: 24, borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '2px solid',
                  borderColor: selectedDish.is_vegetarian === 1 ? '#4CAF50' : '#F44336',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                <Box sx={{
                  width: 9, height: 9, borderRadius: '50%',
                  backgroundColor: selectedDish.is_vegetarian === 1 ? '#4CAF50' : '#F44336',
                }} />
              </Box>
              {/* Close */}
              <IconButton
                onClick={handleCloseDialog}
                aria-label="Close"
                sx={{
                  position: 'absolute', top: 10, right: 10, zIndex: 2,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(6px)',
                  color: '#FFF',
                  width: 36, height: 36,
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Details */}
            <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 0, overflowY: 'auto', flex: 1 }}>
              {/* Title + price */}
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: theme.palette.text.primary, fontSize: { xs: '1.25rem', sm: '1.5rem' }, lineHeight: 1.25 }}>
                  {selectedDish.name}
                </Typography>
              </Box>
              {showPrices && (
                <Box display="flex" alignItems="baseline" gap={1} mt={0.75}>
                  {selectedDish.is_offer === 1 ? (
                    <>
                      <Typography variant="body1" fontWeight="bold" color="#FFA500" sx={{ fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
                        ₹{calculateDiscountedPrice(selectedDish.price, selectedDish.discount)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, textDecoration: 'line-through' }}>
                        ₹{selectedDish.price.toFixed(2)}
                      </Typography>
                      <Chip
                        label={`${selectedDish.discount}% OFF`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, backgroundColor: 'rgba(255,56,92,0.12)', color: '#FF385C', border: '1px solid rgba(255,56,92,0.3)' }}
                      />
                    </>
                  ) : (
                    <Typography variant="body1" fontWeight="bold" color="#FFA500" sx={{ fontSize: { xs: '1.2rem', sm: '1.35rem' } }}>
                      ₹{selectedDish.price.toFixed(2)}
                    </Typography>
                  )}
                </Box>
              )}

              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1.5, lineHeight: 1.6 }}>
                {selectedDish.description || 'A delicious dish prepared with quality ingredients.'}
              </Typography>

              <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />

              {/* Quantity */}
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                  Quantity
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  sx={{
                    border: '1px solid rgba(255,165,0,0.35)',
                    borderRadius: '999px',
                    backgroundColor: theme.palette.background.default,
                    overflow: 'hidden',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={decrementQuantity}
                    disabled={quantity === 1}
                    sx={{
                      color: quantity === 1 ? theme.palette.text.disabled : '#FFA500',
                      width: 42, height: 42,
                      borderRadius: 0,
                      '&:hover': { backgroundColor: quantity === 1 ? 'transparent' : 'rgba(255,165,0,0.1)' },
                    }}
                  >
                    <RemoveIcon sx={{ fontSize: 20 }} />
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
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    InputProps={{
                      disableUnderline: true,
                      inputProps: {
                        style: { textAlign: 'center', width: '36px', fontWeight: 'bold', color: theme.palette.text.primary }
                      }
                    }}
                  />
                  <IconButton size="small" onClick={incrementQuantity} sx={{ color: '#FFA500', width: 42, height: 42, borderRadius: 0 }}>
                    <AddIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Special Instructions */}
              <Box mt={2.5} mb={2.5}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                  Special Instructions <Typography component="span" variant="caption" sx={{ color: theme.palette.text.disabled, fontWeight: 500 }}>(Optional)</Typography>
                </Typography>
                <TextField
                  multiline
                  rows={2}
                  fullWidth
                  variant="outlined"
                  placeholder="E.g., No onions, extra spicy, etc."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,165,0,0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FFA500',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,165,0,0.3)',
                      },
                    },
                    '& .MuiInputBase-input': { color: theme.palette.text.primary },
                  }}
                />
              </Box>
            </Box>

            {/* Sticky action bar — price + add button */}
            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderTop: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.background.paper,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexShrink: 0,
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {showPrices && (
                <Box sx={{ minWidth: 84 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', fontWeight: 600 }}>
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight="800" color="#FFA500" noWrap sx={{ lineHeight: 1.2 }}>
                    ₹{(parseFloat(selectedDish.is_offer === 1
                      ? calculateDiscountedPrice(selectedDish.price, selectedDish.discount)
                      : selectedDish.price.toFixed(2)
                    ) * quantity).toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Button
                variant="contained"
                fullWidth
                onClick={handleAddToCart}
                sx={{
                  py: 1.4,
                  borderRadius: '16px',
                  backgroundColor: '#FFA500',
                  color: '#1A1408',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  boxShadow: '0 6px 18px rgba(255,165,0,0.35)',
                  '&:hover': { backgroundColor: '#FFB800' },
                }}
              >
                Add to Cart {quantity > 1 ? `· ${quantity} items` : ''}
              </Button>
            </Box>
          </>
        )}
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
        handleMoveCartItem={moveCartItem}
        specials={specials}
        handleOpenDialog={handleOpenDialog}
        calculateDiscountedPrice={calculateDiscountedPrice}
      />

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { m: 0 } }}
        PaperProps={{
          sx: {
            borderRadius: '26px 26px 0 0',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.35)',
            maxHeight: { xs: '92dvh', sm: '85dvh' },
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
          <Box display="flex" alignItems="center">
            <PaymentIcon sx={{ mr: 1.5, color: '#FFA500' }} />
            <Typography variant="h5" component="h2" fontWeight="bold" color={theme.palette.text.primary}>
              Bill Details
            </Typography>
          </Box>
          <IconButton onClick={handleClosePaymentDialog} size="small" sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: theme.palette.divider }}>
          {unpaidOrders.length > 0 ? (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: '18px',
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.background.default,
                  color: theme.palette.text.primary
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ color: '#FFA500' }}>
                  Bill Summary
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }} gutterBottom>
                    Table #{unpaidOrders[0].table_number}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>
                    {unpaidOrders.length} Delivered {unpaidOrders.length === 1 ? 'Order' : 'Orders'} Ready for the Bill
                  </Typography>
                </Box>

                {/* Display each unpaid order */}
                {unpaidOrders.map((order, orderIndex) => (
                  <Box key={order.id} sx={{ mb: orderIndex < unpaidOrders.length - 1 ? 3 : 0 }}>
                    <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold" color={theme.palette.text.primary}>
                      Order #{order.id}
                    </Typography>
                    <List disablePadding>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="body2" color={theme.palette.text.primary}>
                                    {item.dish?.name || "Unknown Dish"} x{item.quantity}
                                    {item.status === 'rejected' && (
                                      <Chip label="not served" size="small" color="error" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                                    )}
                                  </Typography>
                                  {showPrices && item.status !== 'rejected' && (
                                    <Typography variant="body2" fontWeight="medium" color="#FFA500">
                                      ₹{((item.price ?? item.dish?.price ?? 0) * item.quantity).toFixed(2)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color={theme.palette.text.secondary} sx={{ fontStyle: 'italic' }}>
                          No items in this order
                        </Typography>
                      )}
                    </List>

                    {/* Order Subtotal — hidden when prices are off */}
                    {showPrices && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1, mb: 1 }}>
                      <Typography variant="body2" color={theme.palette.text.secondary}>
                        Order Subtotal:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="#FFA500">
                        ₹{(order.items ? order.items.reduce((sum, item) => {
                          if (item.status === 'rejected') return sum;
                          return sum + (item.price ?? item.dish?.price ?? 0) * item.quantity;
                        }, 0) : 0).toFixed(2)}
                      </Typography>
                    </Box>
                    )}{/* end showPrices subtotal */}

                  </Box>
                ))}

                <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />

                <Box sx={{ mt: 2, backgroundColor: theme.palette.background.paper, p: 2, borderRadius: '14px' }}>
                  <Typography variant="subtitle2" color="#FFA500" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Applied Discounts:
                  </Typography>

                  {discounts.loyalty.discount_percentage > 0 ? (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      {discounts.loyalty.message}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', mb: 0.5 }}>
                      No loyalty discount applied
                    </Typography>
                  )}

                  {discounts.selectionOffer.discount_amount > 0 ? (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      {discounts.selectionOffer.message}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                      No special offer discount applied
                    </Typography>
                  )}
                </Box>

                {/* Total Calculation */}
                {(() => {
                  // Calculate subtotal across all unpaid orders
                  const subtotal = unpaidOrders.reduce((total, order) => {
                    return total + (order.items ? order.items.reduce((sum, item) => {
                      if (item.status === 'rejected') return sum;
                      return sum + (item.price ?? item.dish?.price ?? 0) * item.quantity;
                    }, 0) : 0);
                  }, 0);

                  // Calculate loyalty discount
                  const loyaltyDiscountAmount = discounts.loyalty.discount_percentage > 0
                    ? subtotal * (discounts.loyalty.discount_percentage / 100)
                    : 0;

                  // Calculate final total
                  const finalTotal = (subtotal - loyaltyDiscountAmount - discounts.selectionOffer.discount_amount);

                  return (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#4DAA57', borderRadius: '14px' }}>
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }} paragraph>
                  Press the button below to request your bill. The counter staff will generate the bill and confirm your payment.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color={theme.palette.text.primary} gutterBottom>
                No delivered orders found
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Orders must be delivered by the chef before you can request the bill. Please wait for your food to arrive.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: theme.palette.divider }}>
          <Button
            onClick={handleClosePaymentDialog}
            variant="outlined"
            sx={{
              borderRadius: '14px',
              py: 1.2,
              px: 3,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              fontWeight: 'bold',
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
            onClick={handleCompletePayment}
            disabled={unpaidOrders.length === 0}
            sx={{
              py: 1.3,
              px: 4,
              fontWeight: 800,
              borderRadius: '14px',
              backgroundColor: '#FFA500',
              color: '#1A1408',
              boxShadow: '0 6px 18px rgba(255, 165, 0, 0.35)',
              '&:hover': {
                backgroundColor: '#FFB800',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(255, 165, 0, 0.25)',
                color: 'rgba(26, 20, 8, 0.4)'
              }
            }}
          >
            Request Bill
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

      {/* Rejected dishes popup — notifies the user of every rejection */}
      <Dialog
        open={!!rejectionDialog}
        onClose={() => setRejectionDialog(null)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { m: 0 } }}
        PaperProps={{
          sx: {
            borderRadius: '26px 26px 0 0',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.35)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#FF385C', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
          Dish{rejectionDialog?.dishes?.length > 1 ? 'es' : ''} Not Available
          <IconButton onClick={() => setRejectionDialog(null)} size="small" sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: theme.palette.divider }}>
          <Typography variant="body1" gutterBottom>
            The kitchen could not prepare the following:
          </Typography>
          <Box mt={1}>
            {rejectionDialog?.dishes?.map((d, idx) => (
              <Box key={idx} sx={{
                p: 1.5,
                mb: 1,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 56, 92, 0.06)',
                border: '1px solid rgba(255, 56, 92, 0.2)',
              }}>
                <Typography variant="body1" fontWeight="bold">
                  {d.name}
                </Typography>
                {d.reason && (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Reason: {d.reason}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
            You can add a different dish from the menu, or order the same dish again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <Button
            onClick={() => setRejectionDialog(null)}
            variant="contained"
            fullWidth
            sx={{
              py: 1.3,
              borderRadius: '14px',
              bgcolor: '#FFA500',
              color: '#1A1408',
              fontWeight: 800,
              boxShadow: '0 6px 18px rgba(255, 165, 0, 0.35)',
              '&:hover': { bgcolor: '#FFB800' }
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Live move notifications (accepted / delivered / bill status) */}
      <Snackbar
        key={currentNotif ? `${currentNotif.message}-${currentNotif.severity}` : 'notif'}
        open={!!currentNotif}
        autoHideDuration={5000}
        onClose={handleNotifClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleNotifClose}
          severity={currentNotif?.severity || 'info'}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: '50px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {currentNotif?.message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
      </Box>
    </ProductionErrorBoundary>
  );
};

// Memoize the component for better performance
export default React.memo(CustomerMenu);


