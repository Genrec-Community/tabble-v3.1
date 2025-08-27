import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';

const PaymentDialog = ({
  open,
  onClose,
  currentOrder,
  handleCompletePayment,
  loyaltyDiscount,
  selectionOfferDiscount
}) => {
  if (!currentOrder) return null;

  // Calculate the total amount
  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal(currentOrder.items);
    const loyaltyAmount = subtotal * (loyaltyDiscount.discount_percentage / 100);
    return (subtotal - loyaltyAmount - selectionOfferDiscount.discount_amount).toFixed(2);
  };

  // Group items by order_id
  const groupItemsByOrder = () => {
    const orderGroups = {};
    currentOrder.items.forEach(item => {
      const orderId = item.order_id || currentOrder.id;
      if (!orderGroups[orderId]) {
        orderGroups[orderId] = [];
      }
      orderGroups[orderId].push(item);
    });
    return orderGroups;
  };

  const orderGroups = groupItemsByOrder();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          backgroundColor: '#000000',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: '#000000',
        padding: '16px 24px',
        borderBottom: '1px solid #333333'
      }}>
        <Box display="flex" alignItems="center">
          <PaymentIcon sx={{ color: '#FFA500', fontSize: '1.8rem', mr: 2 }} />
          <Typography variant="h6" component="h2" fontWeight="bold" color="#FFFFFF">
            Payment Details
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{
        padding: 0,
        backgroundColor: '#000000',
        overflow: 'auto'
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" component="h3" fontWeight="bold" color="#FFA500" sx={{ mb: 1 }}>
            Bill Summary
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="#FFFFFF">
              Table #{currentOrder.table_number}
            </Typography>
            <Typography variant="body1" color="#FFFFFF">
              {Object.keys(orderGroups).length} {Object.keys(orderGroups).length === 1 ? 'Order' : 'Orders'} to Pay
            </Typography>
          </Box>

          <Divider sx={{ backgroundColor: '#333333', my: 2 }} />

          {/* Display orders */}
          {Object.entries(orderGroups).map(([orderId, items]) => (
            <Box key={orderId} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#FFFFFF" sx={{ mb: 2 }}>
                Order #{orderId}
              </Typography>

              {items.map((item, index) => (
                <Box key={index} sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5
                }}>
                  <Typography variant="body1" color="#FFFFFF">
                    {item.dish?.name || "Unknown Dish"} x{item.quantity}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="#FFFFFF">
                    ₹{(item.dish?.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                mb: 2
              }}>
                <Typography variant="body2" color="#999999">
                  Order Subtotal:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="#FFA500">
                  ₹{calculateSubtotal(items).toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ backgroundColor: '#333333', my: 2 }} />
            </Box>
          ))}

          {/* Discounts Section */}
          {(loyaltyDiscount.discount_percentage > 0 || selectionOfferDiscount.discount_amount > 0) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#FFFFFF" sx={{ mb: 1.5 }}>
                Applied Discounts
              </Typography>

              {loyaltyDiscount.discount_percentage > 0 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography variant="body1" color="#4DAA57">
                    Loyalty Discount ({loyaltyDiscount.discount_percentage}%)
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="#4DAA57">
                    -₹{(calculateSubtotal(currentOrder.items) * (loyaltyDiscount.discount_percentage / 100)).toFixed(2)}
                  </Typography>
                </Box>
              )}

              {selectionOfferDiscount.discount_amount > 0 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="body1" color="#4DAA57">
                    Order Amount Discount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="#4DAA57">
                    -₹{selectionOfferDiscount.discount_amount.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ backgroundColor: '#333333', my: 2 }} />
            </Box>
          )}

          {/* Total Section */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#4DAA57',
            p: 2,
            borderRadius: 1
          }}>
            <Typography variant="h6" fontWeight="bold" color="#000000">
              TOTAL
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#000000">
              ₹{calculateTotal()}
            </Typography>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="#999999">
              Please proceed to the counter to complete your payment or click the button below to mark as paid.
            </Typography>
            <Typography variant="body2" color="#4DAA57" sx={{ mt: 1, fontWeight: 'bold' }}>
              After payment, the bill will arrive at your table soon.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 2,
        backgroundColor: '#000000',
        borderTop: '1px solid #333333',
        justifyContent: 'center'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#FFA500',
            color: '#FFFFFF',
            borderWidth: '1px',
            py: 1.5,
            px: 4,
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: 0,
            mr: 2,
            '&:hover': {
              borderColor: '#FFA500',
              backgroundColor: 'rgba(255, 165, 0, 0.1)',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCompletePayment}
          sx={{
            py: 1.5,
            px: 4,
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: '#FFA500',
            color: '#000000',
            borderRadius: 0,
            '&:hover': {
              backgroundColor: '#E69500',
            }
          }}
        >
          Complete Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
