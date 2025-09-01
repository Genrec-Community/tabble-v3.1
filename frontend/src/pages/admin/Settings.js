import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardMedia,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import HotelIcon from '@mui/icons-material/Hotel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DatabaseIcon from '@mui/icons-material/Storage';
import LockIcon from '@mui/icons-material/Lock';
import { adminService } from '../../services/api';

const AdminSettings = () => {
  // State
  const [settings, setSettings] = useState({
    hotel_name: '',
    address: '',
    contact_number: '',
    email: '',
    tax_id: '',
    logo_path: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Database selection state
  const [databases, setDatabases] = useState([]);
  const [currentDatabase, setCurrentDatabase] = useState('');
  const [dbDialogOpen, setDbDialogOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbError, setDbError] = useState('');
  const [switchingDb, setSwitchingDb] = useState(false);
  const [isDatabaseSelected, setIsDatabaseSelected] = useState(false);

  // Fetch settings on component mount
  useEffect(() => {
    // Check if database has been selected before
    const dbSelected = localStorage.getItem('tabbleDatabaseSelected');
    setIsDatabaseSelected(!!dbSelected);

    fetchSettings();
    fetchDatabases();
    fetchCurrentDatabase();

    // If database hasn't been selected, show the dialog
    if (!dbSelected) {
      setDbDialogOpen(true);
    }
  }, []);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      setSettings(data);

      // Set logo preview if available
      if (data.logo_path) {
        setLogoPreview(data.logo_path);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSnackbar({
        open: true,
        message: 'Error loading settings',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch available databases
  const fetchDatabases = async () => {
    try {
      const data = await adminService.getDatabases();
      setDatabases(data.databases || []);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setSnackbar({
        open: true,
        message: 'Error loading database list',
        severity: 'error'
      });
    }
  };

  // Fetch current database
  const fetchCurrentDatabase = async () => {
    try {
      const data = await adminService.getCurrentDatabase();
      setCurrentDatabase(data.database_name || '');
    } catch (error) {
      console.error('Error fetching current database:', error);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });
  };

  // Handle logo file change
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Create form data
      const formData = new FormData();
      formData.append('hotel_name', settings.hotel_name);
      formData.append('address', settings.address || '');
      formData.append('contact_number', settings.contact_number || '');
      formData.append('email', settings.email || '');
      formData.append('tax_id', settings.tax_id || '');

      // Add logo if selected
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      // Update settings
      const updatedSettings = await adminService.updateSettings(formData);
      setSettings(updatedSettings);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Settings updated successfully!',
        severity: 'success'
      });

      // Reset logo file
      setLogoFile(null);
    } catch (error) {
      console.error('Error updating settings:', error);
      setSnackbar({
        open: true,
        message: 'Error updating settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Open database selection dialog
  const handleOpenDbDialog = () => {
    setDbDialogOpen(true);
    setSelectedDatabase(currentDatabase);
    setDbPassword('');
    setDbError('');
  };

  // Close database selection dialog
  const handleCloseDbDialog = () => {
    // Only allow closing if database has been selected
    if (isDatabaseSelected) {
      setDbDialogOpen(false);
      setDbPassword('');
      setDbError('');
    } else {
      setDbError('Please select a database to continue');
    }
  };

  // Handle database selection change
  const handleDatabaseChange = (e) => {
    setSelectedDatabase(e.target.value);
  };

  // Handle database password change
  const handlePasswordChange = (e) => {
    setDbPassword(e.target.value);
    setDbError('');
  };

  // Switch database
  const handleSwitchDatabase = async () => {
    if (!selectedDatabase) {
      setDbError('Please select a database');
      return;
    }

    if (!dbPassword) {
      setDbError('Please enter the database password');
      return;
    }

    try {
      setSwitchingDb(true);
      const result = await adminService.switchDatabase(selectedDatabase, dbPassword);

      if (result.success) {
        setCurrentDatabase(selectedDatabase);

        // Mark database as selected in localStorage
        localStorage.setItem('tabbleDatabaseSelected', 'true');
        localStorage.setItem('selectedDatabase', selectedDatabase);
        localStorage.setItem('databasePassword', dbPassword);
        setIsDatabaseSelected(true);

        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        });
        handleCloseDbDialog();

        // Refresh settings after database switch
        fetchSettings();
      }
    } catch (error) {
      console.error('Error switching database:', error);
      setDbError(error.response?.data?.detail || 'Error switching database');
    } finally {
      setSwitchingDb(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Hotel Settings
        </Typography>

        {isDatabaseSelected && (
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Database: {currentDatabase}
            </Typography>
          </Box>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* Settings Form */}
          <Grid item xs={12} md={8}>
            <Paper
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: 4,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Hotel Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <HotelIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2">Hotel Name</Typography>
                  </Box>
                  <TextField
                    name="hotel_name"
                    value={settings.hotel_name}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    placeholder="Enter hotel name"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2">Address</Typography>
                  </Box>
                  <TextField
                    name="address"
                    value={settings.address || ''}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Enter hotel address"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2">Contact Number</Typography>
                  </Box>
                  <TextField
                    name="contact_number"
                    value={settings.contact_number || ''}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="Enter contact number"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2">Email</Typography>
                  </Box>
                  <TextField
                    name="email"
                    value={settings.email || ''}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="Enter email address"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ReceiptIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2">Tax ID / GST Number</Typography>
                  </Box>
                  <TextField
                    name="tax_id"
                    value={settings.tax_id || ''}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="Enter tax ID or GST number"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                    Hotel Logo
                  </Typography>

                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="logo-upload"
                    type="file"
                    onChange={handleLogoChange}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      sx={{ mb: 2 }}
                    >
                      Choose Logo
                    </Button>
                  </label>

                  {logoPreview && (
                    <Box mt={2} mb={3}>
                      <img
                        src={logoPreview.startsWith('/') ? `${process.env.REACT_APP_API_BASE_URL}${logoPreview}` : logoPreview}
                        alt="Hotel Logo Preview"
                        style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Preview Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%' }}>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview.startsWith('/') ? `${process.env.REACT_APP_API_BASE_URL}${logoPreview}` : logoPreview}
                    alt="Hotel Logo"
                    style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }}
                  />
                ) : (
                  <HotelIcon sx={{ fontSize: 60, color: 'white' }} />
                )}
              </CardMedia>
              <CardContent>
                <Typography variant="h5" component="div" fontWeight="bold" gutterBottom>
                  {settings.hotel_name || 'Hotel Name'}
                </Typography>

                {settings.address && (
                  <Box display="flex" alignItems="flex-start" mb={1.5}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {settings.address}
                    </Typography>
                  </Box>
                )}

                {settings.contact_number && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {settings.contact_number}
                    </Typography>
                  </Box>
                )}

                {settings.email && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {settings.email}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Bill Preview
                </Typography>
                <Typography variant="body2" paragraph>
                  This information will appear on bills generated for customers.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Database Selection Dialog */}
      <Dialog
        open={dbDialogOpen}
        onClose={handleCloseDbDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        // Only allow closing by clicking outside if database has been selected
        onBackdropClick={isDatabaseSelected ? handleCloseDbDialog : undefined}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <DatabaseIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold">Select Hotel Database</Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
              {isDatabaseSelected
                ? "You have already selected a database. This cannot be changed."
                : "Please select your hotel database and enter the password to continue. This is required to use the admin panel."}
            </Typography>

            <FormControl fullWidth sx={{ mb: 4, mt: 3 }}>
              <InputLabel id="database-select-label">Hotel Database</InputLabel>
              <Select
                labelId="database-select-label"
                id="database-select"
                value={selectedDatabase}
                onChange={handleDatabaseChange}
                label="Hotel Database"
                disabled={isDatabaseSelected}
              >
                {databases.map((db) => (
                  <MenuItem key={db.database_name} value={db.database_name}>
                    {db.database_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Password
              </Typography>
              <TextField
                id="database-password"
                type="password"
                value={dbPassword}
                onChange={handlePasswordChange}
                placeholder="Enter database password"
                variant="outlined"
                fullWidth
                disabled={isDatabaseSelected}
                error={!!dbError}
                InputProps={{
                  startAdornment: <LockIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              {dbError && (
                <FormHelperText error sx={{ ml: 1, mt: 0.5 }}>
                  {dbError}
                </FormHelperText>
              )}
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3 }}>
          {isDatabaseSelected ? (
            <Button
              onClick={handleCloseDbDialog}
              color="primary"
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1 }}
            >
              Close
            </Button>
          ) : (
            <Button
              onClick={handleSwitchDatabase}
              color="primary"
              variant="contained"
              disabled={switchingDb}
              startIcon={switchingDb ? <CircularProgress size={20} /> : null}
              fullWidth
              size="large"
              sx={{ py: 1.5 }}
            >
              {switchingDb ? 'Connecting...' : 'Connect to Database'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminSettings;
