import React from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CancelIcon from '@mui/icons-material/Cancel';

const OrderSummaryCard = ({
  order,
  formatDate,
  getStatusLabel,
  getStatusColor,
  showPrices = true,
  onCancel,
  onClick,
}) => {
  const theme = useTheme();

  const servedItems = (order.items || []).filter(i => i.status !== 'rejected');
  const rejectedCount = (order.items || []).filter(i => i.status === 'rejected').length;

  const subtotal = (order.items || []).reduce((sum, item) => {
    if (item.status === 'rejected') return sum;
    return sum + (item.price ?? item.dish?.price ?? 0) * item.quantity;
  }, 0);

  const total = order.total_amount ?? subtotal;

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        borderRadius: '16px',
        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'}`,
        backgroundColor: theme.palette.background.paper,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:active': { transform: 'scale(0.99)' },
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <Box display="flex" alignItems="center" gap={1} minWidth={0}>
            <ReceiptIcon sx={{ color: '#FFA500', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ color: theme.palette.text.primary }}>
              Order #{order.id}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(order.status)}
            color={getStatusColor(order.status)}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
          />
        </Box>

        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>
          {formatDate ? formatDate(order.created_at) : order.created_at}
        </Typography>

        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" noWrap sx={{ color: theme.palette.text.primary }}>
            {servedItems.map(i => `${i.dish?.name || 'Dish'} ×${i.quantity}`).join(', ') || '—'}
            {rejectedCount > 0 && (
              <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem' }}>
                {' '}({rejectedCount} not served)
              </Box>
            )}
          </Typography>
        </Box>

        <Divider sx={{ my: 1, borderColor: theme.palette.divider }} />

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Table {order.table_number} · Slot {order.slot_number}
          </Typography>
          {showPrices && (
            <Typography variant="body1" fontWeight="bold" sx={{ color: '#FFA500' }}>
              ₹{total?.toFixed ? total.toFixed(2) : total}
            </Typography>
          )}
        </Box>

        {onCancel && order.status === 'pending' && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CancelIcon fontSize="small" />}
            onClick={(e) => {
              e.stopPropagation();
              onCancel(order);
            }}
            sx={{ mt: 1, borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem' }}
          >
            Cancel Order
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default OrderSummaryCard;
