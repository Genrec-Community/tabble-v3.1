import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MergeIcon from '@mui/icons-material/Merge';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import moment from 'moment-timezone';
import { adminService } from '../../services/api';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'medium',
  borderBottom: '1px solid rgba(255, 165, 0, 0.15)',
  borderRight: '1px solid rgba(255, 165, 0, 0.1)',
  '&:last-child': {
    borderRight: 'none',
  },
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    borderBottom: '2px solid rgba(255, 165, 0, 0.3)',
    borderTop: '1px solid rgba(255, 165, 0, 0.2)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  borderBottom: '1px solid rgba(255, 165, 0, 0.15)',
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(255, 165, 0, 0.03)',
  },
  '&:nth-of-type(even)': {
    backgroundColor: 'rgba(255, 165, 0, 0.01)',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 165, 0, 0.08)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(255, 165, 0, 0.2)',
  },
  '&:last-child': {
    borderBottom: 'none',
  },
  transition: 'all 0.2s ease',
}));

const CompletedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrders('paid');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setSnackbar({
        open: true,
        message: 'Error loading orders',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Open order details dialog
  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  // Close order details dialog
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  // Format date in Indian Standard Time
  const formatDate = (dateString) => {
    return moment(dateString).tz('Asia/Kolkata').format('MMM D, YYYY h:mm A');
  };

  // Calculate order total - use stored total_amount if available, otherwise calculate from items
  const calculateTotal = (order) => {
    // If order has a stored total_amount (after discounts), use that
    if (order && order.total_amount !== null && order.total_amount !== undefined) {
      return parseFloat(order.total_amount).toFixed(2);
    }

    // Fallback to calculating from items (original prices)
    const items = order?.items || order;
    if (Array.isArray(items)) {
      return items.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0).toFixed(2);
    }

    return "0.00";
  };

  // Calculate order subtotal (before discounts)
  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0).toFixed(2);
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

  // Handle order selection
  const handleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // Handle select all orders
  const handleSelectAllOrders = (event) => {
    if (event.target.checked) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  // Generate bill for multiple orders
  const handleGenerateMultiBill = async () => {
    if (selectedOrders.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one order',
        severity: 'warning'
      });
      return;
    }

    try {
      // Show loading message
      setSnackbar({
        open: true,
        message: 'Generating bill for multiple orders...',
        severity: 'info'
      });

      // Call API to generate bill for multiple orders
      const pdfBlob = await adminService.generateMultiBill(selectedOrders);

      // Create a URL for the blob
      const url = window.URL.createObjectURL(pdfBlob);

      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill_multiple_orders_${selectedOrders.join('-')}.pdf`;

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Bill generated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating multi-order bill:', error);
      setSnackbar({
        open: true,
        message: 'Error generating bill',
        severity: 'error'
      });
    }
  };

  // Open merge dialog
  const handleOpenMergeDialog = () => {
    if (selectedOrders.length !== 1) {
      setSnackbar({
        open: true,
        message: 'Please select exactly one order to merge',
        severity: 'warning'
      });
      return;
    }

    setMergeDialogOpen(true);
  };

  // Close merge dialog
  const handleCloseMergeDialog = () => {
    setMergeDialogOpen(false);
    setTargetOrderId('');
  };

  // Handle merge orders
  const handleMergeOrders = async () => {
    if (!targetOrderId) {
      setSnackbar({
        open: true,
        message: 'Please select a target order',
        severity: 'warning'
      });
      return;
    }

    try {
      // Show loading message
      setSnackbar({
        open: true,
        message: 'Merging orders...',
        severity: 'info'
      });

      // Call API to merge orders
      await adminService.mergeOrders(selectedOrders[0], targetOrderId);

      // Close dialog
      handleCloseMergeDialog();

      // Refresh orders
      await fetchOrders();

      // Clear selected orders
      setSelectedOrders([]);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Orders merged successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error merging orders:', error);
      setSnackbar({
        open: true,
        message: `Error merging orders: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Completed Orders
        </Typography>

        {selectedOrders.length > 0 && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={handleGenerateMultiBill}
              sx={{ mr: 2 }}
            >
              Generate Combined Bill
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<MergeIcon />}
              onClick={handleOpenMergeDialog}
            >
              Merge Orders
            </Button>
          </Box>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Box
            component="img"
            src="https://img.freepik.com/free-vector/no-data-concept-illustration_114360-536.jpg?w=826&t=st=1699123456~exp=1699124056~hmac=86a5d1f14da1d3c532839d11bba8c9ce44c5b23f50953a44d576edb7b8a29381"
            alt="No orders"
            sx={{ width: '70%', maxWidth: '300px', mb: 3, opacity: 0.8 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No completed orders found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completed orders will appear here
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid rgba(255, 165, 0, 0.2)',
            overflow: 'hidden',
            backgroundColor: '#121212',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedOrders.length > 0 && selectedOrders.length < orders.length}
                    checked={orders.length > 0 && selectedOrders.length === orders.length}
                    onChange={handleSelectAllOrders}
                  />
                </StyledTableCell>
                <StyledTableCell>Order ID</StyledTableCell>
                <StyledTableCell>Customer</StyledTableCell>
                <StyledTableCell>Table</StyledTableCell>
                <StyledTableCell>Items</StyledTableCell>
                <StyledTableCell>Total</StyledTableCell>
                <StyledTableCell>Date</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <StyledTableRow key={order.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleOrderSelection(order.id)}
                    />
                  </TableCell>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      {order.person_name || 'Guest'}
                      {order.visit_count && (
                        <Tooltip title={`Visit count: ${order.visit_count}`}>
                          <Chip
                            label={order.visit_count}
                            size="small"
                            color="primary"
                            sx={{ ml: 1, height: '20px', minWidth: '20px', fontSize: '0.7rem' }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{order.table_number}</TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{calculateTotal(order)}
                      </Typography>
                      {(order.loyalty_discount_amount > 0 || order.selection_offer_discount_amount > 0) && (
                        <Typography variant="caption" color="success.main">
                          (Discounted)
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Paid"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenDetails(order)}
                          sx={{
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            '&:hover': {
                              backgroundColor: 'rgba(25, 118, 210, 0.15)',
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generate Bill">
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => handleGenerateBill(order.id)}
                          sx={{
                            backgroundColor: 'rgba(77, 170, 87, 0.08)',
                            '&:hover': {
                              backgroundColor: 'rgba(77, 170, 87, 0.15)',
                            }
                          }}
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Order Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" component="div" fontWeight="bold">
                  Order #{selectedOrder.id} Details
                </Typography>
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Paid"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 'medium' }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Order Information
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Table Number:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedOrder.table_number}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Date:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(selectedOrder.created_at)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Customer:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedOrder.person_name || 'Guest'}
                    {selectedOrder.visit_count && ` (Visit: ${selectedOrder.visit_count})`}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Order Items
              </Typography>
              <List disablePadding>
                {selectedOrder.items.map((item) => (
                  <ListItem key={item.id} disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            {item.dish?.name || "Unknown Dish"} x{item.quantity}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ₹{(item.dish?.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      }
                      secondary={item.remarks && `Note: ${item.remarks}`}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box>
                {/* Show discount breakdown if available */}
                {(() => {
                  const subtotal = selectedOrder.subtotal_amount || parseFloat(calculateSubtotal(selectedOrder.items));
                  const loyaltyDiscount = selectedOrder.loyalty_discount_amount || 0;
                  const offerDiscount = selectedOrder.selection_offer_discount_amount || 0;
                  const finalAmount = selectedOrder.total_amount || (subtotal - loyaltyDiscount - offerDiscount);

                  return (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2">Subtotal:</Typography>
                        <Typography variant="subtitle2">
                          ₹{subtotal.toFixed(2)}
                        </Typography>
                      </Box>

                      {loyaltyDiscount > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="subtitle2" color="success.main">
                            Loyalty Discount ({selectedOrder.loyalty_discount_percentage || 0}%):
                          </Typography>
                          <Typography variant="subtitle2" color="success.main">
                            -₹{loyaltyDiscount.toFixed(2)}
                          </Typography>
                        </Box>
                      )}

                      {offerDiscount > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="subtitle2" color="success.main">
                            Offer Discount:
                          </Typography>
                          <Typography variant="subtitle2" color="success.main">
                            -₹{offerDiscount.toFixed(2)}
                          </Typography>
                        </Box>
                      )}

                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2">Tax (10%):</Typography>
                        <Typography variant="subtitle2">
                          ₹{(finalAmount * 0.1).toFixed(2)}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total Paid:
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          ₹{(finalAmount * 1.1).toFixed(2)}
                        </Typography>
                      </Box>

                      {(loyaltyDiscount > 0 || offerDiscount > 0) && (
                        <Box display="flex" justifyContent="space-between" mt={1}>
                          <Typography variant="caption" color="success.main">
                            Total Savings: ₹{(loyaltyDiscount + offerDiscount).toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  );
                })()}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                startIcon={<ReceiptIcon />}
                onClick={() => handleGenerateBill(selectedOrder.id)}
                variant="contained"
                color="success"
                sx={{ mr: 1 }}
              >
                Generate Bill
              </Button>
              <Button onClick={handleCloseDetails} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Merge Orders Dialog */}
      <Dialog
        open={mergeDialogOpen}
        onClose={handleCloseMergeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight="bold">
            Merge Orders
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            You are about to merge Order #{selectedOrders[0]} with another order.
            All items from Order #{selectedOrders[0]} will be moved to the target order.
          </Typography>

          <Box mt={3}>
            <FormControl fullWidth>
              <InputLabel id="target-order-label">Select Target Order</InputLabel>
              <Select
                labelId="target-order-label"
                value={targetOrderId}
                label="Select Target Order"
                onChange={(e) => setTargetOrderId(e.target.value)}
              >
                {orders
                  .filter(order => order.id !== selectedOrders[0])
                  .map(order => (
                    <MenuItem key={order.id} value={order.id}>
                      Order #{order.id} - Table {order.table_number} - {formatDate(order.created_at)}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Box>

          {targetOrderId && (
            <Box mt={3} p={2} bgcolor="rgba(0, 0, 0, 0.04)" borderRadius={1}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Target Order Details
              </Typography>
              {orders.find(o => o.id === parseInt(targetOrderId)) && (
                <>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Table Number:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {orders.find(o => o.id === parseInt(targetOrderId)).table_number}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Customer:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {orders.find(o => o.id === parseInt(targetOrderId)).person_name || 'Guest'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Items:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {orders.find(o => o.id === parseInt(targetOrderId)).items.length}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}

          <Box mt={3}>
            <Typography variant="body2" color="error">
              Warning: This action cannot be undone. The source order will be deleted after merging.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseMergeDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleMergeOrders}
            variant="contained"
            color="primary"
            disabled={!targetOrderId}
            startIcon={<MergeIcon />}
          >
            Merge Orders
          </Button>
        </DialogActions>
      </Dialog>

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
  );
};

export default CompletedOrders;
