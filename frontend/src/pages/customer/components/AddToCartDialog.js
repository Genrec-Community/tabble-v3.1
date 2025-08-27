import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const AddToCartDialog = ({ 
  open, 
  onClose, 
  selectedDish, 
  quantity, 
  remarks, 
  setQuantity, 
  setRemarks, 
  handleAddToCart,
  calculateDiscountedPrice
}) => {
  // Increment quantity
  const incrementQuantity = () => {
    setQuantity(prevQuantity => prevQuantity + 1);
  };

  // Decrement quantity
  const decrementQuantity = () => {
    setQuantity(prevQuantity => prevQuantity > 1 ? prevQuantity - 1 : 1);
  };

  if (!selectedDish) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">{selectedDish.name}</Typography>
      </DialogTitle>
      <DialogContent dividers>
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

        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Description
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {selectedDish.description || 'A delicious dish prepared with quality ingredients.'}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Quantity
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50px',
            width: 'fit-content',
            px: 1
          }}
        >
          <IconButton
            size="small"
            onClick={decrementQuantity}
            sx={{
              color: quantity === 1 ? 'text.disabled' : 'primary.main',
              '&:hover': {
                backgroundColor: quantity === 1 ? 'transparent' : 'rgba(0,0,0,0.04)'
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
                style: { textAlign: 'center', width: '30px', fontWeight: 'bold' }
              }
            }}
          />
          <IconButton size="small" onClick={incrementQuantity} color="primary">
            <AddIcon />
          </IconButton>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
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
                borderRadius: '12px',
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddToCart}
          sx={{
            px: 3,
            borderRadius: '50px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            background: 'linear-gradient(145deg, #FF5A5F 0%, #FF385C 100%)',
          }}
        >
          Add to Cart - ₹{
            selectedDish.is_offer === 1 ?
            (calculateDiscountedPrice(selectedDish.price, selectedDish.discount) * quantity).toFixed(2) :
            (selectedDish.price * quantity).toFixed(2)
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddToCartDialog;
