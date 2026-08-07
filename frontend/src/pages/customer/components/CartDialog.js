import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { CartPaper } from './MenuStyled';

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
      fullScreen={false}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          overflow: 'hidden',
          maxHeight: { xs: '92dvh', sm: '85dvh' },
          m: { xs: 0, sm: 2 },
          width: { xs: '100%', sm: undefined },
        }
      }}
    >
      <DialogTitle sx={{
        borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
        padding: { xs: '14px 16px', sm: '20px 24px' },
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
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Badge
              badgeContent={cart.length}
              color="primary"
              sx={{
                mr: 2,
                '& .MuiBadge-badge': {
                  fontWeight: 'bold',
                  minWidth: '24px',
                  height: '24px',
                  backgroundColor: '#FFA500',
                  color: '#000000'
                }
              }}
            >
              <ShoppingCartIcon sx={{ color: '#FFA500', fontSize: '1.8rem' }} />
            </Badge>
            <Typography variant="h6" component="h2" fontWeight="bold" color={theme.palette.text.primary}>
              Your Cart
            </Typography>
          </Box>
          {cart.length > 1 && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <DragIndicatorIcon sx={{ fontSize: '0.9rem', color: 'primary.main' }} />
              Drag to reorder
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(255, 165, 0, 0.2)', padding: 0 }}>
        <CartPaper elevation={0} sx={{ padding: 0 }}>
          {/* Cart Items */}
          {cart.length === 0 ? (
            <Box textAlign="center" py={8} sx={{ padding: 4 }}>
              <Box
                component="img"
                src="https://img.freepik.com/free-vector/empty-shopping-cart-illustration_114065-634.jpg?w=826&t=st=1699123456~exp=1699124056~hmac=86a5d1f14da1d3c532839d11bba8c9ce44c5b23f50953a44d576edb7b8a29381"
                alt="Empty cart"
                sx={{ width: '60%', maxWidth: '200px', mb: 3, opacity: 0.8 }}
              />
              <Typography color="#FFA500" variant="h6" gutterBottom fontWeight="bold">
                Your cart is empty
              </Typography>
              <Typography color="text.secondary" variant="body1">
                Add some delicious dishes from our menu
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                py: 1,
                px: { xs: 2, sm: 3 },
                display: 'flex',
                alignItems: 'center'
              }}>
                <RestaurantMenuIcon sx={{ color: '#FFA500', mr: 1.5, fontSize: '1.2rem' }} />
                <Typography variant="subtitle1" fontWeight="bold" color={theme.palette.text.primary}>
                  Your Order Items
                </Typography>
              </Box>
              <Box
                ref={listRef}
                sx={{ px: { xs: 2, sm: 3 }, pt: 1 }}
              >
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
                        borderBottom: isOver && !isDragging
                          ? '2px solid #FFA500'
                          : '1px solid rgba(255, 165, 0, 0.15)',
                        opacity: isDragging ? 0.5 : 1,
                        touchAction: 'pan-y',
                        userSelect: 'none',
                        cursor: 'grab',
                        backgroundColor: isOver && !isDragging ? 'rgba(255, 165, 0, 0.08)' : 'transparent',
                        transition: 'border-color 0.1s',
                      }}
                    >
                      {/* Drag handle */}
                      <IconButton
                        size="small"
                        sx={{
                          mr: 1,
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
                          width: 62,
                          height: 62,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          mr: 2,
                          flexShrink: 0,
                          border: '2px solid rgba(255, 165, 0, 0.3)'
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
                        <Box display="flex" alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle1" fontWeight="bold" color={theme.palette.text.primary} sx={{ mr: 1 }}>
                            {item.dish_name}
                          </Typography>
                          <Chip
                            label={`x${item.quantity}`}
                            size="small"
                            sx={{
                              height: '22px',
                              fontSize: '0.8rem',
                              backgroundColor: 'rgba(255, 165, 0, 0.2)',
                              color: '#FFA500',
                              fontWeight: 'bold',
                              border: '1px solid rgba(255, 165, 0, 0.3)'
                            }}
                          />
                        </Box>
                        {item.remarks && (
                          <Typography variant="body2" color="text.secondary" sx={{
                            fontStyle: 'italic',
                            mt: 0.5,
                            fontSize: '0.8rem',
                          }}>
                            Note: {item.remarks}
                          </Typography>
                        )}
                        {item.is_offer === 1 && (
                          <Chip
                            label={`${item.discount}% OFF`}
                            size="small"
                            sx={{
                              height: '20px',
                              mt: 0.5,
                              fontSize: '0.72rem',
                              backgroundColor: 'rgba(255, 56, 92, 0.15)',
                              color: '#FF385C',
                              fontWeight: 'bold',
                              border: '1px solid rgba(255, 56, 92, 0.3)'
                            }}
                          />
                        )}
                      </Box>

                      {/* Remove */}
                      <IconButton
                        edge="end"
                        data-cid="remove"
                        size="small"
                        onClick={() => handleRemoveFromCart(index)}
                        sx={{
                          ml: 1,
                          minWidth: 40,
                          minHeight: 40,
                          backgroundColor: 'rgba(255, 90, 95, 0.15)',
                          color: '#FF385C',
                          '&:hover': { backgroundColor: 'rgba(255, 90, 95, 0.3)' }
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
                mt: 1,
                mb: 2,
                p: 2,
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 165, 0, 0.08)',
                border: '1px dashed rgba(255, 165, 0, 0.3)',
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" color={theme.palette.text.primary} fontWeight="bold">
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="#FFA500">
                    ₹{calculateTotal()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Today's Specials Suggestions */}
          {specials && specials.length > 0 && (
            <Box mt={3}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)',
                py: 1.5,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                borderY: '1px solid rgba(255, 165, 0, 0.3)'
              }}>
                <Box sx={{
                  backgroundColor: 'rgba(255, 165, 0, 0.2)',
                  borderRadius: '50%',
                  p: 1,
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RestaurantMenuIcon sx={{ color: '#FFA500', fontSize: '1.3rem' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" color="#FFA500" sx={{ mb: 0.25 }}>
                    Chef's Recommendations
                  </Typography>
                  <Typography variant="body2" color={theme.palette.text.secondary} sx={{ fontSize: '0.85rem' }}>
                    ✨ Handpicked specials just for you today
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                px: { xs: 2, sm: 3 },
                py: 1.5,
                backgroundColor: 'rgba(255, 165, 0, 0.05)',
                borderBottom: '1px solid rgba(255, 165, 0, 0.3)'
              }}>
                {specials.slice(0, 3).map((special, index) => (
                  <Box
                    key={special.id}
                    onClick={() => handleOpenDialog && handleOpenDialog(special)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      mb: index < 2 ? 1.5 : 0,
                      borderRadius: '12px',
                      border: '1px dashed rgba(255, 165, 0, 0.3)',
                      backgroundColor: 'rgba(255, 165, 0, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 165, 0, 0.15)',
                        borderColor: 'rgba(255, 165, 0, 0.5)',
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        mr: 2,
                        flexShrink: 0,
                        border: '2px solid rgba(255, 165, 0, 0.4)'
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
                      <Typography variant="body2" color={theme.palette.text.secondary} sx={{ lineHeight: 1.3 }}>
                        Tap to add → 
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Restaurant Policy */}
          <Box mt={2} pt={2} px={{ xs: 2, sm: 3 }} pb={2} borderTop="1px dashed rgba(255, 165, 0, 0.2)">
            <Typography variant="subtitle2" color="#FFA500" gutterBottom fontWeight="bold">
              Restaurant Policy
            </Typography>
            <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mb: 0.5 }}>
              • All prices are inclusive of taxes
            </Typography>
            <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mb: 0.5 }}>
              • Orders can be cancelled within 60 seconds of placing
            </Typography>
            <Typography variant="body2" color={theme.palette.text.secondary}>
              • For assistance, please contact our staff
            </Typography>
          </Box>
        </CartPaper>
      </DialogContent>
      <DialogActions sx={{
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderTop: '1px solid rgba(255, 165, 0, 0.2)',
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            flex: { xs: '1 1 45%', sm: '0 1 auto' },
            borderColor: 'rgba(255, 165, 0, 0.5)',
            color: theme.palette.text.primary,
            borderWidth: '2px',
            py: 1.25,
            px: { xs: 1, sm: 3 },
            fontSize: { xs: '0.85rem', sm: '1rem' },
            fontWeight: 'bold',
            '&:hover': {
              borderColor: '#FFA500',
              backgroundColor: 'rgba(255, 165, 0, 0.1)',
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
            flex: { xs: '1 1 45%', sm: '0 1 auto' },
            py: 1.25,
            px: { xs: 1, sm: 4 },
            fontSize: { xs: '0.9rem', sm: '1.1rem' },
            fontWeight: 'bold',
            backgroundColor: '#FFA500',
            ml: { sm: 2 },
            color: '#000000',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#E69500',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(255, 165, 0, 0.3)',
              color: 'rgba(0, 0, 0, 0.4)'
            }
          }}
        >
          Place Order
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartDialog;