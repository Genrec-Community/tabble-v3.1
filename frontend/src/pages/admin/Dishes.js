import React, { useState, useEffect } from 'react';

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { adminService } from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';

const AdminDishes = () => {
  // State
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    category: '',
    new_category: '',
    selectedCategories: [],  // For multiple categories
    price: '',
    quantity: '',
    is_vegetarian: 1,  // Default to vegetarian
    image: null,
    imagePreview: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    dishId: null,
    dishName: ''
  });

  const [editDialog, setEditDialog] = useState({
    open: false,
    dish: null
  });

  const [editFormValues, setEditFormValues] = useState({
    name: '',
    description: '',
    category: '',
    new_category: '',
    selectedCategories: [],  // For multiple categories
    price: '',
    quantity: '',
    is_vegetarian: 1,  // Default to vegetarian
    image: null,
    imagePreview: null
  });

  const [editFormErrors, setEditFormErrors] = useState({});
  const [editSubmitLoading, setEditSubmitLoading] = useState(false);
  const [isEditNewCategory, setIsEditNewCategory] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch dishes
  const fetchDishes = async () => {
    try {
      setLoading(true);
      const dishesData = await adminService.getDishes();
      setDishes(dishesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dishes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load dishes',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchCategories();
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
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormValues({
        ...formValues,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
      // Clear error for image
      if (formErrors.image) {
        setFormErrors({
          ...formErrors,
          image: null
        });
      }
    }
  };

  // Handle category toggle
  const handleCategoryToggle = () => {
    setIsNewCategory(!isNewCategory);
    setFormValues({
      ...formValues,
      category: '',
      new_category: ''
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formValues.name) {
      errors.name = 'Name is required';
    }

    if (isNewCategory) {
      if (!formValues.new_category) {
        errors.new_category = 'New category name is required';
      }
    } else {
      if (!formValues.category) {
        errors.category = 'Category is required';
      }
    }

    if (!formValues.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formValues.price) || parseFloat(formValues.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }

    if (!formValues.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(formValues.quantity) || parseInt(formValues.quantity) < 0) {
      errors.quantity = 'Quantity must be a non-negative number';
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
        name: formValues.name,
        description: formValues.description || '',
        categories: JSON.stringify(formValues.selectedCategories.length > 0 ? formValues.selectedCategories :
                   [isNewCategory ? formValues.new_category : formValues.category]),
        price: parseFloat(formValues.price),
        quantity: formValues.quantity ? parseInt(formValues.quantity) : 0,
        is_vegetarian: formValues.is_vegetarian
      };

      if (formValues.image) {
        dishData.image = formValues.image;
      }

      await adminService.createDish(dishData);

      // Reset form
      setFormValues({
        name: '',
        description: '',
        category: '',
        new_category: '',
        selectedCategories: [],
        price: '',
        quantity: '',
        is_vegetarian: 1,
        image: null,
        imagePreview: null
      });
      setIsNewCategory(false);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Dish added successfully!',
        severity: 'success'
      });

      // Refresh dishes and categories
      fetchDishes();
      fetchCategories();

      setSubmitLoading(false);
    } catch (error) {
      console.error('Error adding dish:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add dish',
        severity: 'error'
      });
      setSubmitLoading(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteDialogOpen = (dishId, dishName) => {
    setDeleteDialog({
      open: true,
      dishId,
      dishName
    });
  };

  // Close delete confirmation dialog
  const handleDeleteDialogClose = () => {
    setDeleteDialog({
      ...deleteDialog,
      open: false
    });
  };

  // Delete dish
  const handleDeleteDish = async () => {
    try {
      await adminService.deleteDish(deleteDialog.dishId);

      // Close dialog
      handleDeleteDialogClose();

      // Show success message
      setSnackbar({
        open: true,
        message: 'Dish deleted successfully!',
        severity: 'success'
      });

      // Refresh dishes
      fetchDishes();
    } catch (error) {
      console.error('Error deleting dish:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete dish',
        severity: 'error'
      });
      handleDeleteDialogClose();
    }
  };

  // Open edit dialog
  const handleEditDialogOpen = (dish) => {
    setEditDialog({
      open: true,
      dish
    });

    // Initialize form values with dish data
    // Parse categories from JSON format
    let dishCategories = [];
    try {
      dishCategories = JSON.parse(dish.category || '[]');
      if (!Array.isArray(dishCategories)) {
        dishCategories = [dish.category];
      }
    } catch (e) {
      dishCategories = dish.category ? [dish.category] : [];
    }

    setEditFormValues({
      name: dish.name,
      description: dish.description || '',
      category: dishCategories[0] || '',
      new_category: '',
      selectedCategories: dishCategories,
      price: dish.price.toString(),
      quantity: dish.quantity.toString(),
      is_vegetarian: dish.is_vegetarian !== undefined ? dish.is_vegetarian : 1,
      image: null,
      imagePreview: dish.image_path ? `${process.env.REACT_APP_API_BASE_URL}${dish.image_path}` : null
    });

    // Reset form errors
    setEditFormErrors({});
    setIsEditNewCategory(false);
  };

  // Close edit dialog
  const handleEditDialogClose = () => {
    setEditDialog({
      ...editDialog,
      open: false
    });
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormValues({
      ...editFormValues,
      [name]: value
    });
    // Clear error for this field
    if (editFormErrors[name]) {
      setEditFormErrors({
        ...editFormErrors,
        [name]: null
      });
    }
  };

  // Handle edit image change
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormValues({
        ...editFormValues,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
      // Clear error for image
      if (editFormErrors.image) {
        setEditFormErrors({
          ...editFormErrors,
          image: null
        });
      }
    }
  };

  // Handle edit category toggle
  const handleEditCategoryToggle = () => {
    setIsEditNewCategory(!isEditNewCategory);
    setEditFormValues({
      ...editFormValues,
      category: '',
      new_category: ''
    });
  };

  // Validate edit form
  const validateEditForm = () => {
    const errors = {};

    if (!editFormValues.name) {
      errors.name = 'Name is required';
    }

    if (isEditNewCategory) {
      if (!editFormValues.new_category) {
        errors.new_category = 'New category name is required';
      }
    } else {
      if (!editFormValues.category) {
        errors.category = 'Category is required';
      }
    }

    if (!editFormValues.price) {
      errors.price = 'Price is required';
    } else if (isNaN(editFormValues.price) || parseFloat(editFormValues.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }

    if (!editFormValues.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(editFormValues.quantity) || parseInt(editFormValues.quantity) < 0) {
      errors.quantity = 'Quantity must be a non-negative number';
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) {
      return;
    }

    try {
      setEditSubmitLoading(true);

      const dishData = {
        name: editFormValues.name,
        description: editFormValues.description || '',
        categories: JSON.stringify(editFormValues.selectedCategories.length > 0 ? editFormValues.selectedCategories :
                   [isEditNewCategory ? editFormValues.new_category : editFormValues.category]),
        price: parseFloat(editFormValues.price),
        quantity: editFormValues.quantity ? parseInt(editFormValues.quantity) : 0,
        is_vegetarian: editFormValues.is_vegetarian
      };

      if (editFormValues.image) {
        dishData.image = editFormValues.image;
      }

      await adminService.updateDish(editDialog.dish.id, dishData);

      // Close dialog
      handleEditDialogClose();

      // Show success message
      setSnackbar({
        open: true,
        message: 'Dish updated successfully!',
        severity: 'success'
      });

      // Refresh dishes and categories
      fetchDishes();
      fetchCategories();
    } catch (error) {
      console.error('Error updating dish:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update dish',
        severity: 'error'
      });
    } finally {
      setEditSubmitLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <AdminPageHeader
        title="Manage Dishes"
        subtitle="Add, edit, and organize your restaurant menu items"
        status={`${dishes.length} dishes`}
        statusColor="primary"
      />

      {/* Add New Dish Form - Top Section */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          mb: 4,
          backgroundColor: '#121212',
          border: '2px solid rgba(255, 165, 0, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.02) 0%, rgba(255, 165, 0, 0.01) 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #FFA500, #FFB733)',
            borderRadius: '3px 3px 0 0',
          }
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ color: '#FFFFFF' }}>
          Add New Dish
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          Fill in the details below to add a new dish to your menu
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="name"
                    label="Dish Name"
                    variant="outlined"
                    fullWidth
                    value={formValues.name}
                    onChange={handleFormChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    name="price"
                    label="Price (₹)"
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={formValues.price}
                    onChange={handleFormChange}
                    error={!!formErrors.price}
                    helperText={formErrors.price}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    value={formValues.description}
                    onChange={handleFormChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isNewCategory}
                        onChange={handleCategoryToggle}
                        name="categoryToggle"
                      />
                    }
                    label="Add New Category"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  {isNewCategory ? (
                    <TextField
                      name="new_category"
                      label="New Category Name"
                      variant="outlined"
                      fullWidth
                      value={formValues.new_category}
                      onChange={handleFormChange}
                      error={!!formErrors.new_category}
                      helperText={formErrors.new_category}
                      required
                    />
                  ) : (
                    <FormControl
                      fullWidth
                      error={!!formErrors.category}
                      required
                    >
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        label="Category"
                        value={formValues.category}
                        onChange={handleFormChange}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.category && (
                        <FormHelperText>{formErrors.category}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    name="quantity"
                    label="Quantity Available (Optional)"
                    variant="outlined"
                    fullWidth
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    value={formValues.quantity}
                    onChange={handleFormChange}
                    error={!!formErrors.quantity}
                    helperText={formErrors.quantity || "Leave empty if not tracking quantity"}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Dish Type</InputLabel>
                    <Select
                      name="is_vegetarian"
                      value={formValues.is_vegetarian}
                      onChange={handleFormChange}
                      label="Dish Type"
                    >
                      <MenuItem value={1}>🟢 Vegetarian</MenuItem>
                      <MenuItem value={0}>🔴 Non-Vegetarian</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Categories (Select Multiple)</InputLabel>
                    <Select
                      multiple
                      name="selectedCategories"
                      value={formValues.selectedCategories}
                      onChange={handleFormChange}
                      label="Categories (Select Multiple)"
                      renderValue={(selected) => selected.join(', ')}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          <input
                            type="checkbox"
                            checked={formValues.selectedCategories.indexOf(cat) > -1}
                            style={{ marginRight: 8 }}
                            readOnly
                          />
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Select multiple categories or use the single category option above
                    </FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Dish Image
                  </Typography>
                  <Box
                    sx={{
                      border: '1px dashed',
                      borderColor: formErrors.image ? 'error.main' : 'divider',
                      borderRadius: 1,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: formErrors.image ? 'error.lighter' : 'background.paper',
                      height: formValues.imagePreview ? 'auto' : '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    component="label"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />

                    {formValues.imagePreview ? (
                      <Box sx={{ width: '100%' }}>
                        <img
                          src={formValues.imagePreview}
                          alt="Dish preview"
                          style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1 }}
                          startIcon={<PhotoCameraIcon />}
                        >
                          Change Image
                        </Button>
                      </Box>
                    ) : (
                      <>
                        <PhotoCameraIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Click to upload an image
                        </Typography>
                      </>
                    )}
                  </Box>
                  {formErrors.image && (
                    <FormHelperText error>{formErrors.image}</FormHelperText>
                  )}
                </Grid>

                <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<AddIcon />}
                    disabled={submitLoading}
                    sx={{ height: 'fit-content' }}
                  >
                    {submitLoading ? <CircularProgress size={24} /> : 'Add Dish'}
                  </Button>
                </Grid>
              </Grid>
            </form>
      </Paper>

      {/* Existing Dishes Grid - Bottom Section */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          backgroundColor: '#121212',
          border: '2px solid rgba(255, 165, 0, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.02) 0%, rgba(255, 165, 0, 0.01) 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #FFA500, #FFB733)',
            borderRadius: '3px 3px 0 0',
          }
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ color: '#FFFFFF' }}>
          All Dishes
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          Manage your existing menu items
        </Typography>

        <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : dishes.length === 0 ? (
            <Alert severity="info">No dishes available. Add your first dish!</Alert>
          ) : (
            <Grid container spacing={3}>
              {dishes.map((dish) => (
                <Grid item xs={12} sm={6} md={4} key={dish.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={dish.image_path ? `${process.env.REACT_APP_API_BASE_URL}${dish.image_path}` : `${process.env.REACT_APP_API_BASE_URL}/static/images/default-dish.jpg`}
                      alt={dish.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" gutterBottom noWrap>
                        {dish.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, height: '40px', overflow: 'hidden' }}>
                        {dish.description || 'No description available'}
                      </Typography>

                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Category:
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {(() => {
                            // Parse categories from JSON format
                            let dishCategories = [];
                            try {
                              dishCategories = JSON.parse(dish.category || '[]');
                              if (!Array.isArray(dishCategories)) {
                                dishCategories = [dish.category];
                              }
                            } catch (e) {
                              dishCategories = dish.category ? [dish.category] : [];
                            }
                            return dishCategories.join(', ');
                          })()}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Price:
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          ₹{dish.price}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Available:
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {dish.quantity}
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleEditDialogOpen(dish)}
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDialogOpen(dish.id, dish.name)}
                        startIcon={<DeleteIcon />}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Dish</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.dishName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteDish} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dish Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Dish</DialogTitle>
        <DialogContent dividers>
          {editDialog.dish && (
            <form onSubmit={handleEditSubmit}>
              <TextField
                name="name"
                label="Dish Name"
                variant="outlined"
                fullWidth
                margin="normal"
                value={editFormValues.name}
                onChange={handleEditFormChange}
                error={!!editFormErrors.name}
                helperText={editFormErrors.name}
                required
              />

              <TextField
                name="description"
                label="Description"
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                value={editFormValues.description}
                onChange={handleEditFormChange}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isEditNewCategory}
                    onChange={handleEditCategoryToggle}
                    name="categoryToggle"
                  />
                }
                label="Add New Category"
                sx={{ mb: 2, mt: 1 }}
              />

              {isEditNewCategory ? (
                <TextField
                  name="new_category"
                  label="New Category Name"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={editFormValues.new_category}
                  onChange={handleEditFormChange}
                  error={!!editFormErrors.new_category}
                  helperText={editFormErrors.new_category}
                  required
                />
              ) : (
                <FormControl
                  fullWidth
                  margin="normal"
                  error={!!editFormErrors.category}
                  required
                >
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    label="Category"
                    value={editFormValues.category}
                    onChange={handleEditFormChange}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                  {editFormErrors.category && (
                    <FormHelperText>{editFormErrors.category}</FormHelperText>
                  )}
                </FormControl>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    name="price"
                    label="Price"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={editFormValues.price}
                    onChange={handleEditFormChange}
                    error={!!editFormErrors.price}
                    helperText={editFormErrors.price}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    name="quantity"
                    label="Quantity Available (Optional)"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    value={editFormValues.quantity}
                    onChange={handleEditFormChange}
                    error={!!editFormErrors.quantity}
                    helperText={editFormErrors.quantity || "Leave empty if not tracking quantity"}
                  />
                </Grid>
              </Grid>

              {/* Vegetarian/Non-Vegetarian Selection */}
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Dish Type</InputLabel>
                <Select
                  name="is_vegetarian"
                  value={editFormValues.is_vegetarian}
                  onChange={handleEditFormChange}
                  label="Dish Type"
                >
                  <MenuItem value={1}>🟢 Vegetarian</MenuItem>
                  <MenuItem value={0}>🔴 Non-Vegetarian</MenuItem>
                </Select>
              </FormControl>

              {/* Multiple Categories Selection */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Categories (Select Multiple)</InputLabel>
                <Select
                  multiple
                  name="selectedCategories"
                  value={editFormValues.selectedCategories}
                  onChange={handleEditFormChange}
                  label="Categories (Select Multiple)"
                  renderValue={(selected) => selected.join(', ')}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      <input
                        type="checkbox"
                        checked={editFormValues.selectedCategories.indexOf(cat) > -1}
                        style={{ marginRight: 8 }}
                        readOnly
                      />
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select multiple categories or use the single category option above
                </FormHelperText>
              </FormControl>

              <Box mt={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Dish Image
                </Typography>
                <Box
                  sx={{
                    border: '1px dashed',
                    borderColor: editFormErrors.image ? 'error.main' : 'divider',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: editFormErrors.image ? 'error.lighter' : 'background.paper',
                    height: editFormValues.imagePreview ? 'auto' : '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleEditImageChange}
                  />

                  {editFormValues.imagePreview ? (
                    <Box sx={{ width: '100%' }}>
                      <img
                        src={editFormValues.imagePreview}
                        alt="Dish preview"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        startIcon={<PhotoCameraIcon />}
                      >
                        Change Image
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <PhotoCameraIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Click to upload an image
                      </Typography>
                    </>
                  )}
                </Box>
                {editFormErrors.image && (
                  <FormHelperText error>{editFormErrors.image}</FormHelperText>
                )}
              </Box>
            </form>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            color="primary"
            disabled={editSubmitLoading}
          >
            {editSubmitLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDishes;
