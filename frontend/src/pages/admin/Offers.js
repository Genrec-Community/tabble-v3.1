import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,

  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PercentIcon from '@mui/icons-material/Percent';
import { adminService } from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';

const AdminOffers = () => {
  // State
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState(null);
  const [formValues, setFormValues] = useState({
    dish_id: '',
    discount: '',
    is_offer: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [offerDishes, setOfferDishes] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Fetch dishes and offers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all dishes
        const dishesData = await adminService.getDishes();
        setDishes(dishesData);
        setLoading(false);

        // Get offer dishes
        const offerDishesData = await adminService.getDishes(1);
        setOfferDishes(offerDishesData);
        setLoadingOffers(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading data',
          severity: 'error'
        });
        setLoading(false);
        setLoadingOffers(false);
      }
    };

    fetchData();
  }, []);

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }

    // If dish_id is changed, find the selected dish
    if (name === 'dish_id') {
      const dish = dishes.find(d => d.id === parseInt(value));
      setSelectedDish(dish);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formValues.dish_id) {
      errors.dish_id = 'Please select a dish';
    }

    if (!formValues.discount) {
      errors.discount = 'Please enter a discount percentage';
    } else if (isNaN(formValues.discount) || formValues.discount <= 0 || formValues.discount > 100) {
      errors.discount = 'Discount must be between 1 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);

      const dishData = {
        discount: parseFloat(formValues.discount),
        is_offer: 1
      };

      // Update the dish with offer details
      await adminService.updateDish(formValues.dish_id, dishData);

      // Reset form
      setFormValues({
        dish_id: '',
        discount: '',
        is_offer: 1
      });
      setSelectedDish(null);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Offer added successfully!',
        severity: 'success'
      });

      // Refresh offer dishes
      const offerDishesData = await adminService.getDishes(1);
      setOfferDishes(offerDishesData);
    } catch (error) {
      console.error('Error adding offer:', error);
      setSnackbar({
        open: true,
        message: 'Error adding offer',
        severity: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle remove offer
  const handleRemoveOffer = async (dishId) => {
    try {
      setSubmitLoading(true);

      const dishData = {
        discount: 0,
        is_offer: 0
      };

      // Update the dish to remove offer
      await adminService.updateDish(dishId, dishData);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Offer removed successfully!',
        severity: 'success'
      });

      // Refresh offer dishes
      const offerDishesData = await adminService.getDishes(1);
      setOfferDishes(offerDishesData);
    } catch (error) {
      console.error('Error removing offer:', error);
      setSnackbar({
        open: true,
        message: 'Error removing offer',
        severity: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (price, discount) => {
    return (price - (price * discount / 100)).toFixed(2);
  };

  return (
    <Container>
      <AdminPageHeader
        title="Manage Offers"
        subtitle="Create and manage promotional offers"
        icon={<LocalOfferIcon />}
      />

      <Grid container spacing={4}>
        {/* Offer Form */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2,
              height: '100%'
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
              Add New Offer
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
              <FormControl
                fullWidth
                margin="normal"
                error={!!formErrors.dish_id}
              >
                <InputLabel id="dish-select-label">Select Dish</InputLabel>
                <Select
                  labelId="dish-select-label"
                  id="dish-select"
                  name="dish_id"
                  value={formValues.dish_id}
                  onChange={handleFormChange}
                  label="Select Dish"
                >
                  {dishes
                    .filter(dish => !dish.is_offer) // Only show dishes that are not already offers
                    .map((dish) => (
                      <MenuItem key={dish.id} value={dish.id}>
                        {dish.name} - ₹{dish.price.toFixed(2)}
                      </MenuItem>
                    ))}
                </Select>
                {formErrors.dish_id && (
                  <FormHelperText>{formErrors.dish_id}</FormHelperText>
                )}
              </FormControl>

              <TextField
                name="discount"
                label="Discount Percentage"
                variant="outlined"
                fullWidth
                margin="normal"
                type="number"
                InputProps={{
                  endAdornment: <PercentIcon color="action" />,
                  inputProps: { min: 1, max: 100 }
                }}
                value={formValues.discount}
                onChange={handleFormChange}
                error={!!formErrors.discount}
                helperText={formErrors.discount}
                required
              />

              {selectedDish && formValues.discount && !isNaN(formValues.discount) && (
                <Box mt={2} p={2} bgcolor="rgba(0, 166, 153, 0.1)" borderRadius={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview:
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      Original Price:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{selectedDish.price.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      Discount:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="error">
                      {formValues.discount}%
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      Final Price:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      ₹{calculateDiscountedPrice(selectedDish.price, formValues.discount)}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={<LocalOfferIcon />}
                sx={{ mt: 3 }}
                disabled={submitLoading}
              >
                {submitLoading ? <CircularProgress size={24} /> : 'Add Offer'}
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Offers List */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2,
              height: '100%'
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
              Current Offers
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {loadingOffers ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : offerDishes.length === 0 ? (
              <Alert severity="info">No offers available. Add your first offer!</Alert>
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
                      <TableCell>Image</TableCell>
                      <TableCell>Dish Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Original Price</TableCell>
                      <TableCell>Discount</TableCell>
                      <TableCell>Final Price</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {offerDishes.map((dish) => (
                      <TableRow key={dish.id} hover>
                        <TableCell>
                          <Box
                            component="img"
                            src={dish.image_path || 'https://via.placeholder.com/50'}
                            alt={dish.name}
                            sx={{
                              width: 50,
                              height: 50,
                              borderRadius: 1,
                              objectFit: 'cover'
                            }}
                          />
                        </TableCell>
                        <TableCell>{dish.name}</TableCell>
                        <TableCell>{dish.category}</TableCell>
                        <TableCell>₹{dish.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Box
                            component="span"
                            sx={{
                              bgcolor: 'error.light',
                              color: 'white',
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}
                          >
                            {dish.discount}% OFF
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold" color="success.main">
                            ₹{calculateDiscountedPrice(dish.price, dish.discount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveOffer(dish.id)}
                            disabled={submitLoading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminOffers;
