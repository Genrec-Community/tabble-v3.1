import React, { useState, useEffect, useRef } from 'react';

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { adminService } from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';
import { apiBaseUrl } from '../../utils/apiBaseUrl';

const API_BASE_URL = apiBaseUrl;

const parseCategories = (category) => {
  if (!category) return [];
  try {
    const parsed = JSON.parse(category);
    return Array.isArray(parsed) ? parsed : [category];
  } catch {
    return category ? [category] : [];
  }
};

const dishImageUrl = (imagePath) => {
  if (!imagePath) return `${API_BASE_URL}/static/images/default-dish.jpg`;
  return imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;
};

// ---------------------------------------------------------------------------
// Shared Add / Edit form (one dialog for both)
// ---------------------------------------------------------------------------
const DishFormDialog = ({ open, mode, dish, categories, onClose, onSave }) => {
  const theme = useTheme();
  const [values, setValues] = useState({
    name: '',
    description: '',
    price: '',
    is_vegetarian: 1,
    selectedCategories: [],
    newCategory: '',
    image: null,
    imagePreview: null
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && dish) {
      setValues({
        name: dish.name || '',
        description: dish.description || '',
        price: dish.price != null ? String(dish.price) : '',
        is_vegetarian: dish.is_vegetarian !== undefined ? dish.is_vegetarian : 1,
        selectedCategories: parseCategories(dish.category),
        newCategory: '',
        image: null,
        imagePreview: dishImageUrl(dish.image_path)
      });
    } else {
      setValues({
        name: '',
        description: '',
        price: '',
        is_vegetarian: 1,
        selectedCategories: [],
        newCategory: '',
        image: null,
        imagePreview: null
      });
    }
    setErrors({});
    setSaving(false);
  }, [open, mode, dish]);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  };

  const handleFile = (file) => {
    if (!file) return;
    setField('image', file);
    setField('imagePreview', URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!values.name.trim()) errs.name = 'Dish name is required';
    if (!values.price) {
      errs.price = 'Price is required';
    } else if (isNaN(parseFloat(values.price)) || parseFloat(values.price) <= 0) {
      errs.price = 'Price must be a positive number';
    }
    if (values.selectedCategories.length === 0 && !values.newCategory.trim()) {
      errs.categories = 'Add at least one category (pick from the list or type a new one)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategories = [...values.selectedCategories];
    values.newCategory
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => {
        if (!finalCategories.includes(c)) finalCategories.push(c);
      });

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      categories: JSON.stringify(finalCategories),
      price: parseFloat(values.price),
      is_vegetarian: values.is_vegetarian
    };
    if (values.image) payload.image = values.image;

    setSaving(true);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const hotelName = localStorage.getItem('selectedHotel') || 'your-hotel';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {mode === 'edit' ? 'Edit Dish' : 'Add New Dish'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={7}>
              <TextField
                label="Dish Name"
                variant="outlined"
                fullWidth
                required
                value={values.name}
                onChange={(e) => setField('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Price (₹)"
                variant="outlined"
                fullWidth
                required
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={values.price}
                onChange={(e) => setField('price', e.target.value)}
                error={!!errors.price}
                helperText={errors.price}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description (optional)"
                variant="outlined"
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                value={values.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Dish Type
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={values.is_vegetarian}
                onChange={(_, v) => v !== null && setField('is_vegetarian', v)}
              >
                <ToggleButton value={1} sx={{ textTransform: 'none' }}>
                  🟢 Vegetarian
                </ToggleButton>
                <ToggleButton value={0} sx={{ textTransform: 'none' }}>
                  🔴 Non-Vegetarian
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.categories}>
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={values.selectedCategories}
                  onChange={(e) => setField('selectedCategories', e.target.value)}
                  label="Categories"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((c) => (
                        <Chip key={c} label={c} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {values.selectedCategories.includes(cat) ? '☑ ' : '☐ '}
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categories && (
                  <FormHelperText>{errors.categories}</FormHelperText>
                )}
              </FormControl>
              <TextField
                label="New category (optional)"
                variant="outlined"
                fullWidth
                size="small"
                placeholder="e.g. Starters, Desserts (comma-separated)"
                value={values.newCategory}
                onChange={(e) => setField('newCategory', e.target.value)}
                sx={{ mt: 1.5 }}
                helperText="Typed here will be added to the selected ones above."
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Photo (optional)
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed rgba(255, 165, 0, 0.45)',
                  borderRadius: 2,
                  backgroundColor: theme.palette.mode === 'light' ? '#FAF6EE' : '#1d1d1d',
                  minHeight: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  p: 2,
                  textAlign: 'center',
                  '&:hover': {
                    borderColor: '#FFA500',
                    backgroundColor: theme.palette.mode === 'light' ? '#FFF3E0' : '#242424'
                  }
                }}
              >
                {values.imagePreview ? (
                  <>
                    <Box
                      component="img"
                      src={values.imagePreview}
                      alt="Dish preview"
                      sx={{ maxHeight: 160, maxWidth: '100%', borderRadius: 1 }}
                    />
                    <Button
                      size="small"
                      color="primary"
                      startIcon={<PhotoCameraIcon />}
                      sx={{ mt: 1 }}
                    >
                      Change photo
                    </Button>
                  </>
                ) : (
                  <>
                    <PhotoCameraIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
<Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
  Click to choose a photo
</Typography>
<Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
  A default photo is used if you skip this
</Typography>
                  </>
                )}
              </Box>
              {values.imagePreview && mode === 'edit' && !values.image && (
                <FormHelperText>Current photo — picking a new one replaces it.</FormHelperText>
              )}
              {values.image && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    setField('image', null);
                    setField('imagePreview', null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  sx={{ mt: 1 }}
                >
                  Remove photo
                </Button>
              )}
              <FormHelperText sx={{ mt: 1 }}>
                Photos are stored on your server at{' '}
                <strong>/static/images/dishes/{hotelName}/</strong> — the files live in{' '}
                <strong>backend/app/static/images/dishes/{hotelName}/</strong> on disk.
              </FormHelperText>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={saving ? null : mode === 'edit' ? <EditIcon /> : <AddIcon />}
          >
            {saving ? <CircularProgress size={22} /> : mode === 'edit' ? 'Save Changes' : 'Add Dish'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const AdminDishes = () => {
  const theme = useTheme();
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formDialog, setFormDialog] = useState({ open: false, mode: 'add', dish: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, dishId: null, dishName: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCategories = async () => {
    try {
      setCategories(await adminService.getCategories());
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDishes = async () => {
    try {
      setLoading(true);
      setDishes(await adminService.getDishes());
    } catch (error) {
      console.error('Error fetching dishes:', error);
      showSnackbar('Failed to load dishes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchCategories();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async (payload) => {
    try {
      if (formDialog.mode === 'edit') {
        await adminService.updateDish(formDialog.dish.id, payload);
        showSnackbar('Dish updated successfully!');
      } else {
        await adminService.createDish(payload);
        showSnackbar('Dish added successfully!');
      }
      setFormDialog({ open: false, mode: 'add', dish: null });
      fetchDishes();
      fetchCategories();
    } catch (error) {
      console.error('Error saving dish:', error);
      showSnackbar('Failed to save dish', 'error');
      throw error;
    }
  };

  const handleDeleteDish = async () => {
    try {
      await adminService.deleteDish(deleteDialog.dishId);
      showSnackbar('Dish deleted successfully!');
      setDeleteDialog({ open: false, dishId: null, dishName: '' });
      fetchDishes();
      fetchCategories();
    } catch (error) {
      console.error('Error deleting dish:', error);
      showSnackbar('Failed to delete dish', 'error');
    }
  };

  return (
    <Container maxWidth="xl">
      <AdminPageHeader
        title="Manage Dishes"
        subtitle="Add, edit, and organize your restaurant menu"
        status={`${dishes.length} dish${dishes.length === 1 ? '' : 'es'}`}
        statusColor="primary"
        actions={[
          {
            label: 'Add Dish',
            icon: <AddIcon />,
            variant: 'contained',
            onClick: () => setFormDialog({ open: true, mode: 'add', dish: null })
          }
        ]}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" my={6}>
          <CircularProgress />
        </Box>
      ) : dishes.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            border: '1px dashed rgba(255,165,0,0.25)',
            borderRadius: 3
          }}
        >
          <RestaurantMenuIcon sx={{ fontSize: 60, color: 'rgba(255,165,0,0.35)', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No dishes yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your first dish to start taking orders.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormDialog({ open: true, mode: 'add', dish: null })}
          >
            Add Dish
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {dishes.map((dish) => {
            const dishCategories = parseCategories(dish.category);
            const isVeg = dish.is_vegetarian === 1;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={dish.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: theme.palette.background.paper,
                    border: '1px solid rgba(255,165,0,0.15)',
                    '&:hover': { borderColor: 'rgba(255,165,0,0.4)' }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={dishImageUrl(dish.image_path)}
                      alt={dish.name}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: 'rgba(0,0,0,0.78)',
                        borderRadius: 1,
                        px: 0.75,
                        py: 0.35
                      }}
                    >
                      <Box
                        sx={{
                          width: 11,
                          height: 11,
                          borderRadius: 0.5,
                          border: '1.5px solid',
                          borderColor: isVeg ? '#4caf50' : '#f44336',
                          bgcolor: '#fff'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                        {isVeg ? 'Veg' : 'Non-Veg'}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="h6" component="div" noWrap fontWeight="600">
                      {dish.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        height: 40,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {dish.description || 'No description'}
                    </Typography>

                    {dishCategories.length > 0 && (
                      <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', mb: 1.5 }}>
                        {dishCategories.slice(0, 3).map((c) => (
                          <Chip key={c} label={c} size="small" variant="outlined" color="primary" />
                        ))}
                        {dishCategories.length > 3 && (
                          <Chip label={`+${dishCategories.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Stack>
                    )}

                    <Typography variant="h6" sx={{ color: '#FFA500', fontWeight: 700 }}>
                      ₹{dish.price}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5 }}>
                    <Button
                      size="small"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => setFormDialog({ open: true, mode: 'edit', dish })}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() =>
                        setDeleteDialog({ open: true, dishId: dish.id, dishName: dish.name })
                      }
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <DishFormDialog
        open={formDialog.open}
        mode={formDialog.mode}
        dish={formDialog.dish}
        categories={categories}
        onClose={() => setFormDialog({ open: false, mode: 'add', dish: null })}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
        <DialogTitle>Delete Dish</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.dishName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Cancel</Button>
          <Button onClick={handleDeleteDish} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDishes;
