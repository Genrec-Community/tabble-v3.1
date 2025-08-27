import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Card,
  CardContent,
  CardActions,

} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import RefreshIcon from '@mui/icons-material/Refresh';
import { adminService } from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';

// Styled components
const TableCard = styled(Card)(({ theme, occupied }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  border: occupied
    ? `3px solid ${theme.palette.error.main}`
    : `3px solid ${theme.palette.success.main}`,
  borderRadius: '12px',
  backgroundColor: '#121212',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: occupied
      ? '0 8px 24px rgba(244, 67, 54, 0.3)'
      : '0 8px 24px rgba(77, 170, 87, 0.3)',
    borderWidth: '4px',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: occupied
      ? `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`
      : `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
    borderRadius: '12px 12px 0 0',
  },
  position: 'relative',
}));

const TableManagement = () => {
  // State
  const [tables, setTables] = useState([]);
  const [tableStatus, setTableStatus] = useState({
    total_tables: 0,
    occupied_tables: 0,
    free_tables: 0
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [formData, setFormData] = useState({
    table_number: ''
  });
  const [batchFormData, setBatchFormData] = useState({
    num_tables: 1
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [errors, setErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables();
    fetchTableStatus();
  }, []);

  // Fetch tables from API
  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTables();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setSnackbar({
        open: true,
        message: 'Error loading tables data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch table status from API
  const fetchTableStatus = async () => {
    try {
      const data = await adminService.getTableStatus();
      setTableStatus(data);
    } catch (error) {
      console.error('Error fetching table status:', error);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    await fetchTableStatus();
    setRefreshing(false);
    setSnackbar({
      open: true,
      message: 'Table data refreshed',
      severity: 'success'
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Handle batch form input change
  const handleBatchInputChange = (e) => {
    const { name, value } = e.target;
    setBatchFormData({
      ...batchFormData,
      [name]: value
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

    if (!formData.table_number) {
      newErrors.table_number = 'Table number is required';
    } else if (parseInt(formData.table_number) <= 0) {
      newErrors.table_number = 'Table number must be greater than 0';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate batch form
  const validateBatchForm = () => {
    const newErrors = {};

    if (!batchFormData.num_tables) {
      newErrors.num_tables = 'Number of tables is required';
    } else if (parseInt(batchFormData.num_tables) <= 0) {
      newErrors.num_tables = 'Number of tables must be greater than 0';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open dialog to add new table
  const handleOpenAddDialog = () => {
    setFormData({
      table_number: ''
    });
    setEditMode(false);
    setDialogOpen(true);
  };

  // Open dialog to add batch of tables
  const handleOpenBatchDialog = () => {
    setBatchFormData({
      num_tables: 1
    });
    setBatchDialogOpen(true);
  };

  // Open dialog to edit table
  const handleOpenEditDialog = (table) => {
    setFormData({
      table_number: table.table_number.toString()
    });
    setCurrentTable(table);
    setEditMode(true);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setErrors({});
  };

  // Close batch dialog
  const handleCloseBatchDialog = () => {
    setBatchDialogOpen(false);
    setErrors({});
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (table) => {
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTableToDelete(null);
  };

  // Submit form to create or update table
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editMode) {
        // Update existing table
        await adminService.updateTable(currentTable.id, {});

        setSnackbar({
          open: true,
          message: 'Table updated successfully',
          severity: 'success'
        });
      } else {
        // Create new table
        await adminService.createTable({
          table_number: parseInt(formData.table_number),
          is_occupied: false
        });

        setSnackbar({
          open: true,
          message: 'Table created successfully',
          severity: 'success'
        });
      }

      // Refresh data and close dialog
      fetchTables();
      fetchTableStatus();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving table:', error);

      // Check for specific error messages
      if (error.response && error.response.data && error.response.data.detail) {
        if (error.response.data.detail.includes('already exists')) {
          setErrors({
            ...errors,
            table_number: 'A table with this number already exists'
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
          message: 'Error saving table',
          severity: 'error'
        });
      }
    }
  };

  // Submit batch form to create multiple tables
  const handleBatchSubmit = async () => {
    if (!validateBatchForm()) return;

    try {
      await adminService.createTablesBatch(
        parseInt(batchFormData.num_tables)
      );

      setSnackbar({
        open: true,
        message: `${batchFormData.num_tables} tables created successfully`,
        severity: 'success'
      });

      // Refresh data and close dialog
      fetchTables();
      fetchTableStatus();
      handleCloseBatchDialog();
    } catch (error) {
      console.error('Error creating tables batch:', error);
      setSnackbar({
        open: true,
        message: 'Error creating tables',
        severity: 'error'
      });
    }
  };

  // Delete table
  const handleDeleteTable = async () => {
    try {
      await adminService.deleteTable(tableToDelete.id);

      setSnackbar({
        open: true,
        message: 'Table deleted successfully',
        severity: 'success'
      });

      // Refresh data and close dialog
      fetchTables();
      fetchTableStatus();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting table:', error);

      // Check for specific error messages
      if (error.response && error.response.data && error.response.data.detail) {
        setSnackbar({
          open: true,
          message: error.response.data.detail,
          severity: 'error'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error deleting table',
          severity: 'error'
        });
      }
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
        title="Table Management"
        subtitle="Manage restaurant tables and their status"
        icon={<TableRestaurantIcon />}
        actions={[
          {
            label: refreshing ? 'Refreshing...' : 'Refresh',
            icon: <RefreshIcon />,
            onClick: handleRefresh,
            disabled: refreshing,
            variant: 'outlined'
          },
          {
            label: 'Add Multiple Tables',
            icon: <AddIcon />,
            onClick: handleOpenBatchDialog,
            variant: 'outlined'
          },
          {
            label: 'Add New Table',
            icon: <AddIcon />,
            onClick: handleOpenAddDialog,
            variant: 'contained'
          }
        ]}
      />

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>

        {/* Table Status Summary */}
        <Box mb={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  color: 'white',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Total Tables
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {tableStatus.total_tables}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'error.light',
                  color: 'white',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Occupied Tables
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {tableStatus.occupied_tables}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'success.light',
                  color: 'white',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Free Tables
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {tableStatus.free_tables}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Box mb={3}>
          <Typography variant="body1" paragraph>
            Manage restaurant tables, track their status, and update their information.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Table Status:</strong> Green tables are free and available for seating. Red tables are currently occupied.
              Tables are automatically marked as occupied when a customer enters the menu page with that table number, and
              automatically marked as free when payment is completed.
            </Typography>
          </Alert>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : tables.length === 0 ? (
          <Alert severity="info">
            No tables have been created yet. Add your first table to start managing your restaurant's seating.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {tables.map((table) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
                <TableCard occupied={table.is_occupied}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h5" component="div" fontWeight="bold">
                        Table {table.table_number}
                      </Typography>
                      <Chip
                        label={table.is_occupied ? 'Occupied' : 'Free'}
                        color={table.is_occupied ? 'error' : 'success'}
                        size="small"
                      />
                    </Box>


                  </CardContent>
                  <CardActions sx={{ mt: 'auto', p: 2, pt: 0 }}>
                    <Box sx={{ ml: 'auto' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEditDialog(table)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(table)}
                          disabled={table.is_occupied}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </TableCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Add/Edit Table Dialog */}
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
            {editMode ? 'Edit Table' : 'Add New Table'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Table Number"
                name="table_number"
                type="number"
                value={formData.table_number}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                variant="outlined"
                required
                error={!!errors.table_number}
                helperText={errors.table_number}
                disabled={editMode} // Can't change table number when editing
                InputProps={{
                  inputProps: { min: 1 }
                }}
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

      {/* Add Batch Tables Dialog */}
      <Dialog
        open={batchDialogOpen}
        onClose={handleCloseBatchDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight="bold">
            Add Multiple Tables
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            This will create multiple tables with sequential numbers starting from the next available table number.
          </Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Number of Tables"
                name="num_tables"
                type="number"
                value={batchFormData.num_tables}
                onChange={handleBatchInputChange}
                fullWidth
                margin="normal"
                variant="outlined"
                required
                error={!!errors.num_tables}
                helperText={errors.num_tables}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseBatchDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleBatchSubmit}
            variant="contained"
            color="primary"
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            Create Tables
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
            Delete Table
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete Table {tableToDelete?.table_number}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. You cannot delete a table that is currently occupied.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteTable}
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

export default TableManagement;
