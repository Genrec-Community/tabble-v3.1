import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Hotel as HotelIcon,
  Restaurant as RestaurantIcon,
  TableBar as TableIcon,
  ShoppingCart as OrderIcon,
  TrendingUp as RevenueIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import axios from 'axios';
import { apiBaseUrl } from '../../utils/apiBaseUrl';

const API_BASE_URL = apiBaseUrl;

const SuperAdmin = () => {
  const theme = useTheme();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const [hotels, setHotels] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelStats, setHotelStats] = useState({});

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [hotelForm, setHotelForm] = useState({
    name: '',
    phone: '',
    password: '',
    address: '',
    email: ''
  });

  const handleAuth = async () => {
    setAuthError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/super/auth`, {
        password: password
      });

      if (response.data.success) {
        setAuthenticated(true);
        fetchData();
      }
    } catch (error) {
      setAuthError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [hotelsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/super/hotels`),
        axios.get(`${API_BASE_URL}/admin/super/stats/overview`)
      ]);

      setHotels(hotelsRes.data);
      setOverviewStats(statsRes.data);
    } catch (error) {
      showSnackbar('Error fetching data', 'error');
    }
  };

  const fetchHotelStats = async (hotelId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/super/hotels/${hotelId}/stats`);
      setHotelStats(prev => ({ ...prev, [hotelId]: response.data }));
    } catch (error) {
      showSnackbar('Error fetching hotel stats', 'error');
    }
  };

  const handleAddHotel = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin/super/hotels`, hotelForm);
      showSnackbar('Hotel added successfully', 'success');
      setOpenAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Error adding hotel', 'error');
    }
  };

  const handleEditHotel = async () => {
    try {
      const updateData = { ...hotelForm };
      // Remove password if empty (don't update)
      if (!updateData.password) {
        delete updateData.password;
      }

      await axios.put(`${API_BASE_URL}/admin/super/hotels/${selectedHotel.id}`, updateData);
      showSnackbar('Hotel updated successfully', 'success');
      setOpenEditDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Error updating hotel', 'error');
    }
  };

  const handleDeleteHotel = async (hotel) => {
    if (!window.confirm(`Are you sure you want to delete "${hotel.name}"? This will delete all associated data including tables, menu items, and orders.`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/admin/super/hotels/${hotel.id}`);
      showSnackbar('Hotel deleted successfully', 'success');
      fetchData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Error deleting hotel', 'error');
    }
  };

  const openEdit = (hotel) => {
    setSelectedHotel(hotel);
    setHotelForm({
      name: hotel.name,
      phone: hotel.phone,
      password: '', // Leave empty for security
      address: hotel.address || '',
      email: hotel.email || ''
    });
    setOpenEditDialog(true);
  };

  const openStats = async (hotel) => {
    setSelectedHotel(hotel);
    await fetchHotelStats(hotel.id);
    setOpenStatsDialog(true);
  };

  const resetForm = () => {
    setHotelForm({
      name: '',
      phone: '',
      password: '',
      address: '',
      email: ''
    });
    setSelectedHotel(null);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (!authenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.background.default,
        }}
      >
        <Card sx={{ maxWidth: 400, width: '100%', m: 2, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LockIcon sx={{ fontSize: 60, color: '#F7B538', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Super Admin Access
              </Typography>
              <Typography variant="body2" color={theme.palette.text.secondary}>
                Enter password to continue
              </Typography>
            </Box>

            <TextField
              fullWidth
              type="password"
              label="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              error={!!authError}
              helperText={authError}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.text.primary,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#F7B538' }
                },
                '& .MuiInputLabel-root': { color: theme.palette.text.secondary }
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleAuth}
              disabled={loading || !password}
              sx={{
                backgroundColor: '#F7B538',
                color: '#1A1408',
                fontWeight: 700,
                py: 1.5,
                '&:hover': { backgroundColor: '#FFB800' }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, color: theme.palette.text.primary, py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#F7B538' }}>
            Super Admin Dashboard
          </Typography>
          <Typography variant="body1" color={theme.palette.text.secondary}>
            Manage all hotels and view system statistics
          </Typography>
        </Box>

        {overviewStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
<Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: '1px solid rgba(247, 181, 56, 0.3)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <HotelIcon sx={{ color: '#F7B538', mr: 1 }} />
                      <Typography variant="body2" color={theme.palette.text.secondary}>
                        Total Hotels
                      </Typography>
                    </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewStats.total_hotels}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
<Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: '1px solid rgba(247, 181, 56, 0.3)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TableIcon sx={{ color: '#F7B538', mr: 1 }} />
                      <Typography variant="body2" color={theme.palette.text.secondary}>
                        Total Tables
                      </Typography>
                    </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewStats.total_tables}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
<Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: '1px solid rgba(247, 181, 56, 0.3)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RestaurantIcon sx={{ color: '#F7B538', mr: 1 }} />
                      <Typography variant="body2" color={theme.palette.text.secondary}>
                        Menu Items
                      </Typography>
                    </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewStats.total_menu_items}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
<Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: '1px solid rgba(247, 181, 56, 0.3)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <OrderIcon sx={{ color: '#F7B538', mr: 1 }} />
                      <Typography variant="body2" color={theme.palette.text.secondary}>
                        Total Orders
                      </Typography>
                    </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewStats.total_orders}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
<Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: '1px solid rgba(247, 181, 56, 0.3)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RevenueIcon sx={{ color: '#4CAF50', mr: 1 }} />
                      <Typography variant="body2" color={theme.palette.text.secondary}>
                        Total Revenue
                      </Typography>
                    </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#4CAF50' }}>
                    ₹{overviewStats.total_revenue.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Hotels Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                sx={{
                  backgroundColor: '#F7B538',
                  color: '#1A1408',
                  fontWeight: 700,
                  '&:hover': { backgroundColor: '#FFB800' }
                }}
              >
                Add Hotel
              </Button>
            </Box>

<TableContainer component={Paper} sx={{ backgroundColor: theme.palette.background.paper }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.background.paper }}>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>ID</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>Name</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>Phone</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>Email</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>Address</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>Created</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 700 }} align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hotels.map((hotel) => (
                        <TableRow key={hotel.id} sx={{ '&:hover': { backgroundColor: theme.palette.background.default } }}>
                          <TableCell sx={{ color: theme.palette.text.primary }}>{hotel.id}</TableCell>
                          <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>{hotel.name}</TableCell>
                          <TableCell sx={{ color: theme.palette.text.primary }}>{hotel.phone}</TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary }}>{hotel.email || '-'}</TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary }}>{hotel.address || '-'}</TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary }}>
                            {new Date(hotel.created_at).toLocaleDateString()}
                          </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => openStats(hotel)}
                          sx={{ color: '#4CAF50', mr: 1 }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openEdit(hotel)}
                          sx={{ color: '#2196F3', mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteHotel(hotel)}
                          sx={{ color: '#F44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>

      {/* Add Hotel Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => { setOpenAddDialog(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary } }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Add New Hotel
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Hotel Name"
            value={hotelForm.name}
            onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
            sx={{ mb: 2, ...textFieldStyles(theme) }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={hotelForm.phone}
            onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            error={hotelForm.phone.length > 0 && hotelForm.phone.length !== 10}
            helperText={hotelForm.phone.length > 0 && hotelForm.phone.length !== 10 ? 'Enter a valid 10-digit mobile number' : ''}
            sx={{ mb: 2, ...textFieldStyles(theme) }}
          />
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={hotelForm.password}
            onChange={(e) => setHotelForm({ ...hotelForm, password: e.target.value })}
            sx={{ mb: 2, ...textFieldStyles(theme) }}
          />
          <TextField
            fullWidth
            label="Email (Optional)"
            value={hotelForm.email}
            onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })}
            sx={{ mb: 2, ...textFieldStyles(theme) }}
          />
          <TextField
            fullWidth
            label="Address (Optional)"
            multiline
            rows={2}
            value={hotelForm.address}
            onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
            sx={textFieldStyles(theme)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => { setOpenAddDialog(false); resetForm(); }} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddHotel}
            variant="contained"
            disabled={!hotelForm.name || !hotelForm.phone || !hotelForm.password}
            sx={{
              backgroundColor: '#F7B538',
              color: '#1A1408',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#FFB800' }
            }}
          >
            Add Hotel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Hotel Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => { setOpenEditDialog(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary } }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Edit Hotel
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Hotel Name"
            value={hotelForm.name}
            onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
            sx={{ mb: 2, ...textFieldStyles(theme) }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={hotelForm.phone}
            onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            error={hotelForm.phone.length > 0 && hotelForm.phone.length !== 10}
            helperText={hotelForm.phone.length > 0 && hotelForm.phone.length !== 10 ? 'Enter a valid 10-digit mobile number' : ''}
            sx={{ mb: 2, ...textFieldStyles(theme) }}
          />
          <TextField
            fullWidth
            type="password"
            label="New Password (Leave empty to keep current)"
            value={hotelForm.password}
            onChange={(e) => setHotelForm({ ...hotelForm, password: e.target.value })}
            sx={{ mb: 2, ...textFieldStyles(theme) }}
            helperText="Only fill this if you want to change the password"
          />
          <TextField
            fullWidth
            label="Email"
            value={hotelForm.email}
            onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })}
            sx={{ mb: 2, ...textFieldStyles(theme) }}
          />
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={2}
            value={hotelForm.address}
            onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
            sx={textFieldStyles(theme)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => { setOpenEditDialog(false); resetForm(); }} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleEditHotel}
            variant="contained"
            disabled={!hotelForm.name || !hotelForm.phone}
            sx={{
              backgroundColor: '#F7B538',
              color: '#1A1408',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#FFB800' }
            }}
          >
            Update Hotel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hotel Stats Dialog */}
      <Dialog
        open={openStatsDialog}
        onClose={() => { setOpenStatsDialog(false); setSelectedHotel(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary } }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Hotel Statistics - {selectedHotel?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedHotel && hotelStats[selectedHotel.id] ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, p: 2 }}>
                  <Typography variant="body2" color={theme.palette.text.secondary} gutterBottom>
                    Tables
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {hotelStats[selectedHotel.id].total_tables}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, p: 2 }}>
                  <Typography variant="body2" color={theme.palette.text.secondary} gutterBottom>
                    Menu Items
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {hotelStats[selectedHotel.id].total_menu_items}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, p: 2 }}>
                  <Typography variant="body2" color={theme.palette.text.secondary} gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {hotelStats[selectedHotel.id].total_orders}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, p: 2 }}>
                  <Typography variant="body2" color={theme.palette.text.secondary} gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {hotelStats[selectedHotel.id].completed_orders}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, p: 2 }}>
                  <Typography variant="body2" color={theme.palette.text.secondary} gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#4CAF50' }}>
                    ₹{hotelStats[selectedHotel.id].total_revenue.toFixed(2)}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#F7B538' }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => { setOpenStatsDialog(false); setSelectedHotel(null); }} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const textFieldStyles = (theme) => ({
  '& .MuiOutlinedInput-root': {
    color: theme.palette.text.primary,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#F7B538' }
  },
  '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
  '& .MuiFormHelperText-root': { color: theme.palette.text.secondary }
});

export default SuperAdmin;
