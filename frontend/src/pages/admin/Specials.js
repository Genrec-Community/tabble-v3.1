import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,

  Divider,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import StarIcon from '@mui/icons-material/Star';
import { adminService } from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';

const AdminSpecials = () => {
  // State
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState(null);
  const [formValues, setFormValues] = useState({
    dish_id: '',
    is_special: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [specialDishes, setSpecialDishes] = useState([]);
  const [loadingSpecials, setLoadingSpecials] = useState(true);

  // Fetch dishes and specials on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all dishes
        const dishesData = await adminService.getDishes();
        setDishes(dishesData);
        setLoading(false);

        // Get special dishes
        const specialDishesData = await adminService.getDishes(null, 1);
        setSpecialDishes(specialDishesData);
        setLoadingSpecials(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading data',
          severity: 'error'
        });
        setLoading(false);
        setLoadingSpecials(false);
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
        is_special: 1
      };
      
      // Update the dish with special flag
      await adminService.updateDish(formValues.dish_id, dishData);
      
      // Reset form
      setFormValues({
        dish_id: '',
        is_special: 1
      });
      setSelectedDish(null);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Special dish added successfully!',
        severity: 'success'
      });
      
      // Refresh special dishes
      const specialDishesData = await adminService.getDishes(null, 1);
      setSpecialDishes(specialDishesData);
    } catch (error) {
      console.error('Error adding special dish:', error);
      setSnackbar({
        open: true,
        message: 'Error adding special dish',
        severity: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle remove special
  const handleRemoveSpecial = async (dishId) => {
    try {
      setSubmitLoading(true);
      
      const dishData = {
        is_special: 0
      };
      
      // Update the dish to remove special flag
      await adminService.updateDish(dishId, dishData);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Dish removed from specials successfully!',
        severity: 'success'
      });
      
      // Refresh special dishes
      const specialDishesData = await adminService.getDishes(null, 1);
      setSpecialDishes(specialDishesData);
    } catch (error) {
      console.error('Error removing special dish:', error);
      setSnackbar({
        open: true,
        message: 'Error removing special dish',
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

  return (
    <Container>
      <AdminPageHeader
        title="Today's Special"
        subtitle="Manage special dishes for today's menu"
        icon={<StarIcon />}
      />

      <Grid container spacing={4}>
        {/* Special Form */}
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
              Add Today's Special
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
                    .filter(dish => !dish.is_special) // Only show dishes that are not already specials
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
              
              {selectedDish && (
                <Box mt={2} p={2} bgcolor="rgba(0, 166, 153, 0.1)" borderRadius={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview:
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      Dish:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedDish.name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      Category:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedDish.category}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      Price:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{selectedDish.price.toFixed(2)}
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
                startIcon={<StarIcon />}
                sx={{ mt: 3 }}
                disabled={submitLoading}
              >
                {submitLoading ? <CircularProgress size={24} /> : 'Add to Today\'s Special'}
              </Button>
            </form>
          </Paper>
        </Grid>
        
        {/* Specials List */}
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
              Today's Special Dishes
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            {loadingSpecials ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : specialDishes.length === 0 ? (
              <Alert severity="info">No special dishes available. Add your first special dish!</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Image</TableCell>
                      <TableCell>Dish Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {specialDishes.map((dish) => (
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
                        <TableCell align="right">
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveSpecial(dish.id)}
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

export default AdminSpecials;
