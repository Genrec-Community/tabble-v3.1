import React, { useRef, useState } from 'react';
import {
  Dialog,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Badge,
  useTheme
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { apiBaseUrl } from '../../../utils/apiBaseUrl';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import CloseIcon from '@mui/icons-material/Close';

const CartDialog = ({
  open,
  onClose,
  cart,
  handleRemoveFromCart,
  calculateTotal,
  handlePlaceOrder,
  handleMoveCartItem,
  specials = [],
  handleOpenDialog
}) => {
  const theme = useTheme();

  // Drag-to-reorder state (pointer events work on mouse and touch)
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const itemRefs = useRef([]);
  const itemRef = useRef(null);
  const listRef = useRef();

  const sortedCart = [...cart].sort((a, b) => a.position - b.position);

  const handleDragStart = (e, index) => {
    if (index === null) return;
    e.preventDefault();
    itemRef.current = index;
    setDraggingIndex(index);
    setOverIndex(index);
  };

  const handleDragMove = (e) => {
    if (itemRef.current === null) return;
    if (itemRef.current !== draggingIndex) itemRef.current = draggingIndex;
    setOverIndex(computeDragIndex(e));
  };

  const computeDragIndex = (e) => {
    const current = itemRef.current ?? 0;
    let bestIndex = current;
    let bestDistance = Infinity;
    const currentTop = itemRefs.current[current]?.getBoundingClientRect().top ?? 0;
    sortedCart.forEach((_, i) => {
      if (i === current) return;
      const base = itemRefs.current[i]?.getBoundingClientRect().top ?? currentTop;
      const distance = Math.abs(e.clientY - base);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    });
    return Math.max(0, Math.min(bestIndex, sortedCart.length - 1));
  };

  const handleDragEnd = () => {
    if (itemRef.current !== null && overIndex !== null && itemRef.current !== overIndex) {
      handleMoveCartItem(itemRef.current, overIndex);
    }
    itemRef.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      sx={{ '& .MuiDialog-paper': { m: 0 } }}
      PaperProps={{
        sx: {
          borderRadius: '26px 26px 0 0',
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          maxHeight: { xs: '92dvh', sm: '85dvh' },
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      {/* Grab handle */}
      <Box sx={{ pt: 1.5, pb: 0.5, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Box sx={{ width: 44, height: 4, borderRadius: '999px', backgroundColor: theme.palette.divider }} />
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          py: 1,
          flexShrink: 0,
        }}
      >
        <Box display="flex" alignItems="center">
          <Badge
            badgeContent={cart.length}
            color="primary"
            sx={{
              mr: 1.5,
              '& .MuiBadge-badge': {
                fontWeight: 'bold',
                minWidth: '20px',
                height: '20px',
                backgroundColor: '#FFA500',
                color: '#1A1408'
              }
            }}
          >
            <ShoppingCartIcon sx={{ color: '#FFA500', fontSize: '1.6rem' }} />
          </Badge>
          <Typography variant="h6" component="h2" fontWeight="bold" color={theme.palette.text.primary}>
            Your Cart
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {cart.length > 1 && (
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <DragIndicatorIcon sx={{ fontSize: '0.9rem' }} />
              Drag to reorder
            </Typography>
          )}
          <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {cart.length === 0 ? (
          <Box textAlign="center" py={6} px={4}>
            <Box
              sx={{
                width: 88,
                height: 88,
                mx: 'auto',
                mb: 2,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 165, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 40, color: '#FFA500' }} />
            </Box>
            <Typography variant="h6" fontWeight="bold" color={theme.palette.text.primary} gutterBottom>
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add some delicious dishes from our menu
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Items */}
            <Box ref={listRef} sx={{ px: { xs: 2, sm: 3 } }}>
              {sortedCart.map((item, index) => {
                const isDragging = draggingIndex === index;
                const isOver = overIndex === index && overIndex !== null && draggingIndex !== null;
                return (
                  <Box
                    key={`${item.dish_id}-${index}`}
                    ref={el => (itemRefs.current[index] = el)}
                    onPointerDown={(e) => {
                      if (e.target.closest('[data-no-drag]')) return;
                      handleDragStart(e, index);
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                    }}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                    onPointerCancel={handleDragEnd}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: isOver && !isDragging ? 'primary.main' : theme.palette.divider,
                      opacity: isDragging ? 0.5 : 1,
                      touchAction: 'pan-y',
                      userSelect: 'none',
                      cursor: 'grab',
                      backgroundColor: isOver && !isDragging ? 'rgba(255, 165, 0, 0.06)' : 'transparent',
                      transition: 'border-color 0.1s',
                    }}
                  >
                    {/* Drag handle */}
                    <IconButton
                      size="small"
                      sx={{
                        mr: 0.5,
                        cursor: 'grab',
                        color: theme.palette.text.secondary,
                        minWidth: 32,
                        minHeight: 32,
                      }}
                      disableRipple
                    >
                      <DragIndicatorIcon />
                    </IconButton>

                    {/* Dish image */}
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '14px',
                        overflow: 'hidden',
                        mr: 1.5,
                        flexShrink: 0,
                        backgroundColor: theme.palette.background.default,
                      }}
                    >
                      <img
                        src={item.image ? `${apiBaseUrl}${item.image}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                        alt={item.dish_name}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>

                    {/* Item details */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5}>
                        <Typography variant="subtitle1" fontWeight="bold" color={theme.palette.text.primary} sx={{ mr: 0.5 }}>
                          {item.dish_name}
                        </Typography>
                        <Chip
                          label={`x${item.quantity}`}
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '0.75rem',
                            backgroundColor: 'rgba(255, 165, 0, 0.15)',
                            color: '#B26A00',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>
                      {item.is_offer === 1 && (
                        <Chip
                          label={`${item.discount}% OFF`}
                          size="small"
                          sx={{
                            height: '18px',
                            mt: 0.5,
                            fontSize: '0.68rem',
                            backgroundColor: 'rgba(255, 56, 92, 0.12)',
                            color: '#FF385C',
                            fontWeight: 'bold',
                          }}
                        />
                      )}
                      {item.remarks && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.78rem' }}>
                          Note: {item.remarks}
                        </Typography>
                      )}
                    </Box>

                    {/* Remove */}
                    <IconButton
                      edge="end"
                      data-cid="remove"
                      data-no-drag
                      size="small"
                      onClick={() => handleRemoveFromCart(index)}
                      sx={{
                        ml: 1,
                        minWidth: 38,
                        minHeight: 38,
                        backgroundColor: 'rgba(255, 90, 95, 0.12)',
                        color: '#FF385C',
                        '&:hover': { backgroundColor: 'rgba(255, 90, 95, 0.25)' }
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>

            {/* Order summary */}
            <Box sx={{
              mx: { xs: 2, sm: 3 },
              my: 2,
              px: 2,
              py: 1.5,
              borderRadius: '14px',
              backgroundColor: theme.palette.background.default,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Typography variant="body1" color={theme.palette.text.primary} fontWeight="bold">
                Total
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="#FFA500">
                ₹{calculateTotal()}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Today's Specials Suggestions */}
        {specials && specials.length > 0 && (
          <Box mt={cart.length === 0 ? 0 : 1} pb={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: { xs: 2, sm: 3 }, mb: 1 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 165, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RestaurantMenuIcon sx={{ color: '#FFA500', fontSize: '1.15rem' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" color={theme.palette.text.primary} sx={{ lineHeight: 1.2 }}>
                  Chef's Recommendations
                </Typography>
                <Typography variant="caption" color={theme.palette.text.secondary}>
                  Handpicked specials just for you today
                </Typography>
              </Box>
            </Box>

            <Box sx={{ px: { xs: 2, sm: 3 } }}>
              {specials.slice(0, 3).map((special, index) => (
                <Box
                  key={special.id}
                  onClick={() => handleOpenDialog && handleOpenDialog(special)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    mb: index < 2 ? 1 : 0,
                    borderRadius: '16px',
                    backgroundColor: theme.palette.background.default,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { backgroundColor: 'rgba(255, 165, 0, 0.08)' }
                  }}
                >
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={special.image_path ? `${apiBaseUrl}${special.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                      alt={special.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color={theme.palette.text.primary}>
                      {special.name}
                    </Typography>
                    <Typography variant="body2" color="#FFA500" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Tap to add →
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Restaurant Policy */}
        {cart.length > 0 && (
          <Box px={{ xs: 2, sm: 3 }} pb={2} pt={1}>
            <Typography variant="caption" fontWeight="bold" color={theme.palette.text.secondary} gutterBottom display="block">
              Restaurant Policy
            </Typography>
            <Typography variant="caption" color={theme.palette.text.disabled} display="block">
              • All prices are inclusive of taxes
            </Typography>
            <Typography variant="caption" color={theme.palette.text.disabled} display="block">
              • Orders can be cancelled within 60 seconds of placing
            </Typography>
            <Typography variant="caption" color={theme.palette.text.disabled} display="block">
              • For assistance, please contact our staff
            </Typography>
          </Box>
        )}
      </Box>

      {/* Sticky action bar */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderTop: '1px solid',
          borderColor: theme.palette.divider,
          display: 'flex',
          gap: 1.5,
          flexShrink: 0,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            flex: 1,
            py: 1.4,
            borderRadius: '16px',
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            fontWeight: 'bold',
            '&:hover': {
              borderColor: '#FFA500',
              backgroundColor: 'rgba(255, 165, 0, 0.08)',
            }
          }}
        >
          Continue Shopping
        </Button>
        <Button
          variant="contained"
          disabled={cart.length === 0}
          onClick={handlePlaceOrder}
          sx={{
            flex: 1.2,
            py: 1.4,
            fontSize: '0.95rem',
            fontWeight: 800,
            borderRadius: '16px',
            backgroundColor: '#FFA500',
            color: '#1A1408',
            boxShadow: '0 6px 18px rgba(255, 165, 0, 0.35)',
            '&:hover': { backgroundColor: '#FFB800' },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(255, 165, 0, 0.25)',
              color: 'rgba(26, 20, 8, 0.4)'
            }
          }}
        >
          Place Order
        </Button>
      </Box>
    </Dialog>
  );
};

export default CartDialog;
