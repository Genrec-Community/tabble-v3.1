import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,

  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Grid,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PercentIcon from '@mui/icons-material/Percent';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { adminService } from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'medium',
  borderBottom: '1px solid rgba(255, 165, 0, 0.15)',
  borderRight: '1px solid rgba(255, 165, 0, 0.1)',
  '&:last-child': {
    borderRight: 'none',
  },
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    borderBottom: '2px solid rgba(255, 165, 0, 0.3)',
    borderTop: '1px solid rgba(255, 165, 0, 0.2)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  borderBottom: '1px solid rgba(255, 165, 0, 0.15)',
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(255, 165, 0, 0.03)',
  },
  '&:nth-of-type(even)': {
    backgroundColor: 'rgba(255, 165, 0, 0.01)',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 165, 0, 0.08)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(255, 165, 0, 0.2)',
  },
  '&:last-child': {
    borderBottom: 'none',
  },
  transition: 'all 0.2s ease',
}));

const SelectionOffers = () => {
  // State
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [formData, setFormData] = useState({
    min_amount: '',
    discount_amount: '',
    is_active: true,
    description: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [errors, setErrors] = useState({});

  // Fetch offers on component mount
  useEffect(() => {
    fetchOffers();
  }, []);

  // Fetch offers from API
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSelectionOffers();
      setOffers(data);
    } catch (error) {
      console.error('Error fetching selection offers:', error);
      setSnackbar({
        open: true,
        message: 'Error loading selection offers data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.min_amount) {
      newErrors.min_amount = 'Minimum amount is required';
    } else if (parseFloat(formData.min_amount) <= 0) {
      newErrors.min_amount = 'Minimum amount must be greater than 0';
    }

    if (!formData.discount_amount) {
      newErrors.discount_amount = 'Discount amount is required';
    } else if (parseFloat(formData.discount_amount) <= 0) {
      newErrors.discount_amount = 'Discount amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open dialog to add new offer
  const handleOpenAddDialog = () => {
    setFormData({
      min_amount: '',
      discount_amount: '',
      is_active: true,
      description: ''
    });
    setEditMode(false);
    setDialogOpen(true);
  };

  // Open dialog to edit offer
  const handleOpenEditDialog = (offer) => {
    setFormData({
      min_amount: offer.min_amount.toString(),
      discount_amount: offer.discount_amount.toString(),
      is_active: offer.is_active,
      description: offer.description || ''
    });
    setCurrentOffer(offer);
    setEditMode(true);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setErrors({});
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (offer) => {
    setOfferToDelete(offer);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setOfferToDelete(null);
  };

  // Submit form to create or update offer
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editMode) {
        // Update existing offer
        await adminService.updateSelectionOffer(currentOffer.id, {
          min_amount: parseFloat(formData.min_amount),
          discount_amount: parseFloat(formData.discount_amount),
          is_active: formData.is_active,
          description: formData.description || null
        });

        setSnackbar({
          open: true,
          message: 'Selection offer updated successfully',
          severity: 'success'
        });
      } else {
        // Create new offer
        await adminService.createSelectionOffer({
          min_amount: parseFloat(formData.min_amount),
          discount_amount: parseFloat(formData.discount_amount),
          is_active: formData.is_active,
          description: formData.description || null
        });

        setSnackbar({
          open: true,
          message: 'Selection offer created successfully',
          severity: 'success'
        });
      }

      // Refresh data and close dialog
      fetchOffers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving selection offer:', error);

      // Check for specific error messages
      if (error.response && error.response.data && error.response.data.detail) {
        if (error.response.data.detail.includes('already exists')) {
          setErrors({
            ...errors,
            min_amount: 'An offer with this minimum amount already exists'
          });
        } else {
          setSnackbar({
            open: true,
            message: error.response.data.detail,
            severity: 'error'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: 'Error saving selection offer',
          severity: 'error'
        });
      }
    }
  };

  // Delete offer
  const handleDeleteOffer = async () => {
    try {
      await adminService.deleteSelectionOffer(offerToDelete.id);

      setSnackbar({
        open: true,
        message: 'Selection offer deleted successfully',
        severity: 'success'
      });

      // Refresh data and close dialog
      fetchOffers();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting selection offer:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting selection offer',
        severity: 'error'
      });
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Container>
      <AdminPageHeader
        title="Selection Offers"
        subtitle="Manage special offers and promotions"
        icon={<LocalOfferIcon />}
        actions={[
          {
            label: 'Add New Offer',
            icon: <AddIcon />,
            onClick: () => setDialogOpen(true),
            variant: 'contained'
          }
        ]}
      />

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <LocalOfferIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              Selection Offers Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
          >
            Add New Offer
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box mb={3}>
          <Typography variant="body1" paragraph>
            Set up selection offers based on order amounts. When a customer's order total exceeds the minimum amount,
            they will automatically receive the corresponding discount.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>How it works:</strong> When a customer's order total equals or exceeds a minimum amount threshold,
              they will receive the discount percentage defined for that offer. If an order qualifies for multiple offers,
              the offer with the highest minimum amount will be applied.
            </Typography>
          </Alert>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : offers.length === 0 ? (
          <Alert severity="info">
            No selection offers have been created yet. Add your first offer to start providing discounts based on order amounts.
          </Alert>
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
                  <StyledTableCell>Minimum Amount</StyledTableCell>
                  <StyledTableCell>Discount Amount</StyledTableCell>
                  <StyledTableCell>Description</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Created At</StyledTableCell>
                  <StyledTableCell>Updated At</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((offer) => (
                  <StyledTableRow key={offer.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AttachMoneyIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        ₹{offer.min_amount.toFixed(2)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AttachMoneyIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                        ₹{offer.discount_amount.toFixed(2)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {offer.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={offer.is_active ? 'Active' : 'Inactive'}
                        color={offer.is_active ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(offer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(offer.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEditDialog(offer)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleOpenDeleteDialog(offer)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight="bold">
            {editMode ? 'Edit Selection Offer' : 'Add New Selection Offer'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Minimum Amount"
                name="min_amount"
                type="number"
                value={formData.min_amount}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                variant="outlined"
                required
                error={!!errors.min_amount}
                helperText={errors.min_amount}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Discount Amount"
                name="discount_amount"
                type="number"
                value={formData.discount_amount}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                variant="outlined"
                required
                error={!!errors.discount_amount}
                helperText={errors.discount_amount}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="e.g., 'Spend ₹50, get 10% off'"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    name="is_active"
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight="bold" color="error">
            Delete Selection Offer
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the selection offer for orders over ₹{offerToDelete?.min_amount.toFixed(2)} with ₹{offerToDelete?.discount_amount.toFixed(2)} discount?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteOffer}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: '50px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SelectionOffers;
