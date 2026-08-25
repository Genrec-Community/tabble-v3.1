import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteIcon from '@mui/icons-material/Delete';
import { adminService } from '../../services/api';

const SOUP_PRESET = ['1/2', '2/4', '3/6', '4/8'];

const parseOptions = (options) => {
  try {
    const parsed = options ? JSON.parse(options) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Parcel = () => {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Current parcel being built: [{dish_id, dish_name, price, quantity, option_label}]
  const [cartLines, setCartLines] = useState([]);
  const [optionDialog, setOptionDialog] = useState({ dish: null, selected: null });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const [parcelOrders, setParcelOrders] = useState([]);
  const [nextToken, setNextToken] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dishList, categoryList, orders, token] = await Promise.all([
        adminService.getDishes(),
        adminService.getCategories(),
        adminService.getOrders(null, true),
        adminService.getNextParcelToken()
      ]);
      setDishes(dishList.filter((d) => d.visibility === 1));
      setCategories(['All', ...categoryList.filter((c) => c !== 'All')]);
      setParcelOrders(orders);
      setNextToken(token.token_number);
    } catch (error) {
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      adminService.getOrders(null, true)
        .then(setParcelOrders)
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredDishes = dishes.filter((d) => {
    const matchesCategory =
      activeCategory === 'All' ||
      (() => {
        try {
          const cats = JSON.parse(d.category || '[]');
          return Array.isArray(cats) ? cats.includes(activeCategory) : cats === activeCategory;
        } catch {
          return d.category === activeCategory;
        }
      })();
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addDish = (dish) => {
    const options = parseOptions(dish.options);
    if (options.length > 0) {
      setOptionDialog({ dish, selected: null });
      return;
    }
    addLine(dish, null);
  };

  const addLine = (dish, optionLabel) => {
    setCartLines((prev) => [
      ...prev,
      {
        dish_id: dish.id,
        dish_name: dish.name,
        price: dish.is_offer === 1
          ? parseFloat((dish.price - (dish.price * dish.discount / 100)).toFixed(2))
          : dish.price,
        quantity: 1,
        option_label: optionLabel
      }
    ]);
  };

  const updateLineQty = (index, delta) => {
    setCartLines((prev) =>
      prev
        .map((line, i) => (i === index ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0)
    );
  };

  const removeLine = (index) => {
    setCartLines((prev) => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cartLines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const handleConfirmOption = () => {
    if (!optionDialog.selected) {
      showSnackbar('Please select a serving size', 'warning');
      return;
    }
    addLine(optionDialog.dish, optionDialog.selected);
    setOptionDialog({ dish: null, selected: null });
  };

  const downloadBill = async (orderId) => {
    try {
      const blob = await adminService.generateBill(orderId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `parcel-bill-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showSnackbar('Failed to generate bill PDF', 'error');
    }
  };

  const handleCreateAndBill = async () => {
    if (cartLines.length === 0) {
      showSnackbar('Add at least one item to the parcel order', 'warning');
      return;
    }
    setCreating(true);
    try {
      const order = await adminService.createParcelOrder({
        items: cartLines.map(({ dish_id, quantity, option_label }) => ({
          dish_id,
          quantity,
          option_label
        })),
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null
      });
      await downloadBill(order.id);
      showSnackbar(`Parcel #${order.token_number} created and bill downloaded`);
      setCartLines([]);
      setCustomerName('');
      setCustomerPhone('');
      await loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to create parcel order', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPaid = async (orderId) => {
    try {
      await adminService.markOrderAsPaid(orderId);
      showSnackbar('Parcel marked as paid');
      const orders = await adminService.getOrders(null, true);
      setParcelOrders(orders);
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to mark as paid', 'error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Parcel / Takeaway Orders
      </Typography>

      <Grid container spacing={3}>
        {/* Left — build the order */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                  value={activeCategory}
                  onChange={(_, v) => setActiveCategory(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {categories.map((cat) => (
                    <Tab key={cat} value={cat} label={cat} />
                  ))}
                </Tabs>
              </Box>

              <TextField
                fullWidth
                size="small"
                placeholder="Search dishes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
              />

              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={1}>
                  {filteredDishes.map((dish) => (
                    <Grid item xs={12} sm={6} key={dish.id}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => addDish(dish)}
                        sx={{
                          justifyContent: 'space-between',
                          textTransform: 'none',
                          px: 1.5,
                          borderColor: 'divider'
                        }}
                      >
                        <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
                          <Typography noWrap fontWeight={600}>
                            {dish.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{dish.is_offer === 1
                              ? (dish.price - (dish.price * dish.discount / 100)).toFixed(2)
                              : dish.price}
                          </Typography>
                        </Box>
                        <AddIcon color="primary" />
                      </Button>
                    </Grid>
                  ))}
                  {filteredDishes.length === 0 && (
                    <Grid item xs={12}>
                      <Typography color="text.secondary" align="center" py={3}>
                        No dishes found
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right — current parcel */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight="bold">
                  New Parcel
                </Typography>
                {nextToken != null && (
                  <Chip label={`Token #${nextToken}`} color="primary" size="small" />
                )}
              </Box>

              {cartLines.length === 0 ? (
                <Typography color="text.secondary" align="center" py={3}>
                  Tap dishes on the left to build the parcel
                </Typography>
              ) : (
                <>
                  {cartLines.map((line, index) => (
                    <Box
                      key={`${line.dish_id}-${index}`}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      py={1}
                    >
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography fontWeight={600} noWrap>
                          {line.dish_name}
                        </Typography>
                        <Box display="flex" gap={0.5} mt={0.25}>
                          {line.option_label && (
                            <Chip label={line.option_label} size="small" sx={{ height: 18, fontSize: '0.68rem' }} />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            ₹{line.price.toFixed(2)} × {line.quantity}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <IconButton size="small" onClick={() => updateLineQty(index, -1)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography minWidth={20} align="center">{line.quantity}</Typography>
                        <IconButton size="small" onClick={() => updateLineQty(index, 1)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => removeLine(index)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold" align="right">
                    Subtotal: ₹{cartTotal.toFixed(2)} (+GST)
                  </Typography>
                </>
              )}

              <TextField
                fullWidth
                size="small"
                margin="normal"
                label="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />

              <Button
                fullWidth
                variant="contained"
                startIcon={<ReceiptIcon />}
                disabled={creating || cartLines.length === 0}
                onClick={handleCreateAndBill}
                sx={{ mt: 2 }}
              >
                {creating ? <CircularProgress size={22} color="inherit" /> : 'Create Parcel & Generate Bill'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Parcel order list */}
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight="bold" gutterBottom mt={2}>
            Parcel Orders
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Bill No.</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parcelOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.token_number ?? '-'}</TableCell>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.customer_name || '-'}</TableCell>
                    <TableCell>
                      {(order.items || [])
                        .map((i) => `${i.dish?.name || 'Item'} x${i.quantity}${i.option_label ? ` (${i.option_label})` : ''}`)
                        .join(', ')}
                    </TableCell>
                    <TableCell>₹{(order.total_amount ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        color={
                          order.status === 'paid' ? 'success' :
                          order.status === 'cancelled' ? 'default' : 'warning'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => downloadBill(order.id)}>
                        Bill
                      </Button>
                      {order.status !== 'paid' && order.status !== 'cancelled' && (
                        <Button size="small" color="success" onClick={() => handleMarkPaid(order.id)}>
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {parcelOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No parcel orders yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Serving-size picker for dishes with options */}
      <Dialog open={!!optionDialog.dish} onClose={() => setOptionDialog({ dish: null, selected: null })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Select Serving Size</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>{optionDialog.dish?.name}</Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            {parseOptions(optionDialog.dish?.options).map((opt) => (
              <Chip
                key={opt}
                label={opt}
                clickable
                onClick={() => setOptionDialog((prev) => ({ ...prev, selected: opt }))}
                sx={{
                  fontWeight: optionDialog.selected === opt ? 800 : 600,
                  border: '2px solid',
                  borderColor: optionDialog.selected === opt ? '#FFA500' : 'divider',
                  backgroundColor: optionDialog.selected === opt ? 'rgba(255,165,0,0.15)' : 'transparent'
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOptionDialog({ dish: null, selected: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmOption}>Add</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default Parcel;
