import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Paper,
  useTheme,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { customerService } from '../../services/api';
import { useOrderManagement } from '../../hooks/useMenuOptimized';
import { useSlotHeartbeat } from '../../hooks/useSlotHeartbeat';
import OrderSummaryCard from './components/OrderSummaryCard';
import CustomerBottomNav from './components/CustomerBottomNav';

const CustomerHistory = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tableNumber = queryParams.get('table_number') || localStorage.getItem('tableNumber');
  const slotNumber = queryParams.get('slot_number') || localStorage.getItem('slotNumber') || '1';
  const userId = queryParams.get('user_id') || localStorage.getItem('customerId');

  const { userOrders, loading, fetchOrders } = useOrderManagement(userId, tableNumber);

  // Keep the slot alive while the customer is on this screen, and free it
  // when the browser is closed (unless an unpaid order is open).
  const hasUnsettledOrder = useCallback(() => {
    return (userOrders || []).some(order =>
      order.table_number === parseInt(tableNumber) &&
      !['paid', 'cancelled', 'merged'].includes(order.status)
    );
  }, [userOrders, tableNumber]);

  useSlotHeartbeat(tableNumber, slotNumber, { releaseGuard: hasUnsettledOrder });

  const [cancelDialog, setCancelDialog] = useState({ open: false, order: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!tableNumber || !userId) {
      navigate('/customer');
    }
  }, [tableNumber, userId, navigate]);

  const formatDate = useCallback((dateString) => {
    return moment(dateString).tz('Asia/Kolkata').format('MMM D, YYYY h:mm A');
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      pending: 'warning', accepted: 'info', rejected: 'error',
      completed: 'success', payment_requested: 'info', paid: 'success', cancelled: 'default',
    };
    return colors[status] || 'default';
  }, []);

  const getStatusLabel = useCallback((status) => {
    const labels = {
      pending: 'Waiting', accepted: 'Preparing', rejected: 'Rejected',
      completed: 'Ready', payment_requested: 'Bill Requested', paid: 'Paid', cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }, []);

  const handleCancelRequest = useCallback((order) => {
    setCancelDialog({ open: true, order });
  }, []);

  const handleCancelConfirm = async () => {
    const order = cancelDialog.order;
    setCancelDialog({ open: false, order: null });
    try {
      await customerService.cancelOrder(order.id);
      setSnackbar({ open: true, message: `Order #${order.id} cancelled`, severity: 'success' });
      fetchOrders();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to cancel order',
        severity: 'error',
      });
    }
  };

  // Merged orders are consolidated into a single bill — show only the bill
  const sortedOrders = [...userOrders]
    .filter(order => order.status !== 'merged')
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  return (
    <Box sx={{
      minHeight: '100dvh',
      backgroundColor: theme.palette.background.default,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
    }}>
      {/* Top Header Area — flat rectangle */}
      <Box sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: '1px solid rgba(255,165,0,0.12)',
        pt: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        pb: 3,
        px: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <HistoryIcon sx={{ color: '#FFA500', fontSize: 30 }} />
        <Typography variant="h5" fontWeight="bold" sx={{ color: theme.palette.text.primary, fontSize: { xs: '1.4rem', sm: '1.75rem' } }}>
          Order History
        </Typography>
      </Box>

      {/* Main Content Sheet — top-left corner rounded, top-right straight */}
      <Box sx={{ mt: -1, px: { xs: 0, sm: 2 }, flex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: '28px 0 0 0',
            backgroundColor: theme.palette.background.paper,
            minHeight: 'calc(100dvh - 160px)',
            px: { xs: 2, sm: 3 },
            pt: 3,
            pb: 8,
            borderTop: '1px solid rgba(255,165,0,0.12)',
          }}
        >
          {loading && sortedOrders.length === 0 ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={32} sx={{ color: '#FFA500' }} />
            </Box>
          ) : sortedOrders.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                No orders yet
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Your orders will appear here once you place them
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.25}>
              {sortedOrders.map(order => (
                <OrderSummaryCard
                  key={order.id}
                  order={order}
                  formatDate={formatDate}
                  getStatusLabel={getStatusLabel}
                  getStatusColor={getStatusColor}
                  onCancel={handleCancelRequest}
                />
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Cancel confirmation */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, order: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          Cancel Order #{cancelDialog.order?.id}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            This order is still waiting for the kitchen. You can cancel it before it is accepted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialog({ open: false, order: null })} sx={{ color: theme.palette.text.secondary }}>
            Keep Order
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            sx={{ borderRadius: '10px', fontWeight: 700 }}
          >
            Cancel Order
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: '50px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <CustomerBottomNav active="history" />
    </Box>
  );
};

export default CustomerHistory;
