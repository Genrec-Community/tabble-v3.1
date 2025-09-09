import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  ListItem,
  IconButton,
  Chip,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { CartPaper } from './MenuStyled';

const CartDialog = ({
  open,
  onClose,
  cart,
  handleRemoveFromCart,
  calculateTotal,
  handlePlaceOrder,
  currentOrder,
  handleReorderCart,
  specials = [],
  handleOpenDialog,
  calculateDiscountedPrice
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          backgroundColor: '#121212',
          backgroundImage: 'linear-gradient(rgba(255, 165, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 165, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
        padding: '20px 24px',
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
        <Box display="flex" alignItems="center">
          <Badge
            badgeContent={cart.length}
            color="primary"
            sx={{
              mr: 3,
              '& .MuiBadge-badge': {
                fontWeight: 'bold',
                fontSize: '1.1rem',
                minWidth: '28px',
                height: '28px',
                backgroundColor: '#FFA500',
                color: '#000000'
              }
            }}
          >
            <ShoppingCartIcon sx={{ color: '#FFA500', fontSize: '2.2rem' }} />
          </Badge>
          <Typography variant="h5" component="h2" fontWeight="bold" color="#FFFFFF">
            Your Cart
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(255, 165, 0, 0.2)', padding: 0 }}>
        <CartPaper elevation={0} sx={{ padding: 0 }}>
          {/* Cart Items */}
          {cart.length === 0 ? (
            <Box textAlign="center" py={10} mb={3} sx={{
              backgroundImage: 'radial-gradient(rgba(255, 165, 0, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              padding: 4
            }}>
              <Box
                component="img"
                src="https://img.freepik.com/free-vector/empty-shopping-cart-illustration_114065-634.jpg?w=826&t=st=1699123456~exp=1699124056~hmac=86a5d1f14da1d3c532839d11bba8c9ce44c5b23f50953a44d576edb7b8a29381"
                alt="Empty cart"
                sx={{ width: '70%', maxWidth: '250px', mb: 4, opacity: 0.8 }}
              />
              <Typography color="#FFA500" variant="h5" gutterBottom fontWeight="bold">
                Your cart is empty
              </Typography>
              <Typography color="text.secondary" variant="body1" sx={{ fontSize: '1.1rem' }}>
                Add some delicious dishes from our menu
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                py: 1.5,
                px: 3,
                display: 'flex',
                alignItems: 'center'
              }}>
                <RestaurantMenuIcon sx={{ color: '#FFA500', mr: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" color="#FFFFFF">
                  Your Order Items
                </Typography>
              </Box>
              <Box sx={{ px: 3, pt: 2 }}>
                {/* Sort cart items by position to maintain the order they were added */}
                {[...cart].sort((a, b) => a.position - b.position).map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      py: 2.5,
                      px: 0,
                      borderBottom: '1px solid rgba(255, 165, 0, 0.15)',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 165, 0, 0.05)'
                      }
                    }}
                    secondaryAction={
                      <Box display="flex" alignItems="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1.5 }}>
                          <Tooltip title="Move Up">
                            <IconButton
                              size="medium"
                              onClick={() => handleReorderCart(index, 'up')}
                              disabled={index === 0}
                              sx={{
                                mb: 0.8,
                                backgroundColor: 'rgba(255, 165, 0, 0.15)',
                                color: '#FFA500',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 165, 0, 0.3)',
                                },
                                '&.Mui-disabled': {
                                  opacity: 0.3
                                }
                              }}
                            >
                              <ArrowUpwardIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Move Down">
                            <IconButton
                              size="medium"
                              onClick={() => handleReorderCart(index, 'down')}
                              disabled={index === cart.length - 1}
                              sx={{
                                backgroundColor: 'rgba(255, 165, 0, 0.15)',
                                color: '#FFA500',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 165, 0, 0.3)',
                                },
                                '&.Mui-disabled': {
                                  opacity: 0.3
                                }
                              }}
                            >
                              <ArrowDownwardIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <IconButton
                          edge="end"
                          size="medium"
                          onClick={() => handleRemoveFromCart(index)}
                          sx={{
                            backgroundColor: 'rgba(255, 90, 95, 0.15)',
                            color: '#FF385C',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 90, 95, 0.3)',
                            }
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Box sx={{ display: 'flex', width: '100%' }}>
                      <Box
                        sx={{
                          width: 75,
                          height: 75,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          mr: 2.5,
                          flexShrink: 0,
                          border: '2px solid rgba(255, 165, 0, 0.3)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <img
                          src={item.image ? `${process.env.REACT_APP_API_BASE_URL}${item.image}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                          alt={item.dish_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <Box sx={{ flexGrow: 1, pr: 3 }}>
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: '#FFA500',
                              color: '#000000',
                              fontWeight: 'bold',
                              mr: 2,
                              fontSize: '1.2rem',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography variant="h6" fontWeight="bold" color="#FFFFFF">
                            {item.dish_name}
                          </Typography>
                          <Chip
                            label={`x${item.quantity}`}
                            size="medium"
                            sx={{
                              ml: 1.5,
                              height: '26px',
                              fontSize: '0.9rem',
                              backgroundColor: 'rgba(255, 165, 0, 0.2)',
                              color: '#FFA500',
                              fontWeight: 'bold',
                              border: '1px solid rgba(255, 165, 0, 0.3)'
                            }}
                          />
                        </Box>
                        {item.remarks && (
                          <Typography variant="body2" display="block" color="text.secondary" sx={{
                            fontStyle: 'italic',
                            mt: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)'
                          }}>
                            Note: {item.remarks}
                          </Typography>
                        )}
                        {/* Hide individual item prices - only show in total */}
                        {item.is_offer === 1 && (
                          <Box display="flex" alignItems="center" mt={1.5}>
                            <Chip
                              label={`${item.discount}% OFF`}
                              size="small"
                              sx={{
                                height: '24px',
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255, 56, 92, 0.15)',
                                color: '#FF385C',
                                fontWeight: 'bold',
                                border: '1px solid rgba(255, 56, 92, 0.3)'
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </Box>
            </Box>
          )}

          {/* Today's Specials Suggestions */}
          {specials && specials.length > 0 && (
            <Box mt={4}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)',
                py: 2,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px 8px 0 0',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderBottom: 'none'
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
                  <RestaurantMenuIcon sx={{ color: '#FFA500', fontSize: '1.5rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="#FFA500" sx={{ mb: 0.5 }}>
                    Chef's Recommendations
                  </Typography>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.8)" sx={{ fontSize: '0.9rem' }}>
                    ✨ Handpicked specials just for you today
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                px: 3,
                py: 2,
                backgroundColor: 'rgba(255, 165, 0, 0.05)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px'
              }}>
                {specials.slice(0, 3).map((special, index) => (
                  <Box
                    key={special.id}
                    onClick={() => handleOpenDialog && handleOpenDialog(special)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2.5,
                      mb: index < 2 ? 2 : 0,
                      borderRadius: '12px',
                      border: '2px dashed rgba(255, 165, 0, 0.3)',
                      backgroundColor: 'rgba(255, 165, 0, 0.08)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 165, 0, 0.15)',
                        borderColor: 'rgba(255, 165, 0, 0.5)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 25px rgba(255, 165, 0, 0.2)',
                      },
                      '&::before': {
                        content: '"⭐"',
                        position: 'absolute',
                        top: -8,
                        right: 10,
                        fontSize: '1.2rem',
                        backgroundColor: 'rgba(255, 165, 0, 0.9)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(255, 165, 0, 0.3)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        mr: 3,
                        flexShrink: 0,
                        border: '3px solid rgba(255, 165, 0, 0.4)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <img
                        src={special.image_path ? `${process.env.REACT_APP_API_BASE_URL}${special.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                        alt={special.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="h6" fontWeight="bold" color="#FFFFFF" sx={{ mr: 1 }}>
                          {special.name}
                        </Typography>
                        <Box sx={{
                          backgroundColor: 'rgba(255, 165, 0, 0.2)',
                          color: '#FFA500',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255, 165, 0, 0.4)'
                        }}>
                          SUGGESTED
                        </Box>
                      </Box>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.8)" sx={{ mb: 1.5, lineHeight: 1.4 }}>
                        {special.description ? special.description.substring(0, 60) + '...' : 'A special dish crafted by our chef with premium ingredients'}
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <Typography variant="body2" sx={{
                          color: 'rgba(255, 165, 0, 0.8)',
                          fontStyle: 'italic',
                          fontSize: '0.8rem'
                        }}>
                          Tap to add →
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}

                <Box sx={{
                  textAlign: 'center',
                  mt: 3,
                  pt: 2,
                  borderTop: '1px dashed rgba(255, 165, 0, 0.3)'
                }}>
                  <Typography variant="body2" sx={{
                    color: 'rgba(255, 165, 0, 0.8)',
                    fontStyle: 'italic',
                    fontSize: '0.85rem'
                  }}>
                    🍽️ These dishes are specially recommended by our chef today
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Delivery Time Indicator - Only show when cart has items and no current order */}
          {cart.length > 0 && !currentOrder && (
            <Box display="flex" alignItems="center" justifyContent="center" mt={4} mb={2} sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              py: 1.5,
              borderRadius: '4px',
              mx: 3
            }}>
      
            
            </Box>
          )}

          {/* Restaurant Policy */}
          <Box mt={4} pt={3} px={3} pb={2} borderTop="1px dashed rgba(255, 165, 0, 0.2)">
            <Typography variant="subtitle1" color="#FFA500" gutterBottom fontWeight="bold">
              Restaurant Policy
            </Typography>
            <Typography variant="body2" color="#FFFFFF" component="p" paragraph sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#FFA500',
                mr: 1.5
              }}></Box>
              All prices are inclusive of taxes
            </Typography>
            <Typography variant="body2" color="#FFFFFF" component="p" paragraph sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#FFA500',
                mr: 1.5
              }}></Box>
              Orders can be cancelled within 60 seconds of placing
            </Typography>
            <Typography variant="body2" color="#FFFFFF" component="p" sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#FFA500',
                mr: 1.5
              }}></Box>
              For assistance, please contact our staff
            </Typography>
          </Box>
        </CartPaper>
      </DialogContent>
      <DialogActions sx={{
        p: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 165, 0, 0.2)'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 165, 0, 0.5)',
            color: '#FFFFFF',
            borderWidth: '2px',
            py: 1.5,
            px: 3,
            fontSize: '1rem',
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
            py: 1.5,
            px: 4,
            ml: 2,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            backgroundColor: '#FFA500',
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
