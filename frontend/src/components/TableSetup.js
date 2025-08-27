import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import DatabaseIcon from '@mui/icons-material/Storage';
import LockIcon from '@mui/icons-material/Lock';
import { styled } from '@mui/material/styles';
import { adminService } from '../services/api';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: '#121212',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 165, 0, 0.2)',
    maxWidth: '500px',
    width: '100%'
  }
}));

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderRadius: '8px',
    border: '2px solid rgba(255, 165, 0, 0.3)',
    '& fieldset': {
      borderColor: 'rgba(255, 165, 0, 0.4)',
      borderWidth: '2px',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 165, 0, 0.6)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FFA500',
      boxShadow: '0 0 0 2px rgba(255, 165, 0, 0.2)',
    },
    '& .MuiSelect-select': {
      color: '#FFFFFF !important',
    },
    '& .MuiSelect-icon': {
      color: '#FFA500',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#FFA500',
    },
  },
  '& .MuiInputBase-input': {
    color: '#FFFFFF',
    fontSize: '1.125rem',
    padding: '16px 14px',
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: '#FFA500',
  },
  // Enhanced styling for Select dropdown
  '& .MuiSelect-root': {
    color: '#FFFFFF',
  },
}));

const TableSetup = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [tableNumber, setTableNumber] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [password, setPassword] = useState('');
  const [availableDatabases, setAvailableDatabases] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = ['Select Database', 'Enter Table Number'];

  // Fetch available databases when component mounts
  useEffect(() => {
    if (open) {
      fetchDatabases();
    }
  }, [open]);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDatabases();
      setAvailableDatabases(response.databases || []);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setError('Failed to load available databases');
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseSubmit = async () => {
    if (!databaseName || !password) {
      setError('Please select a database and enter the password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Attempt to switch to the selected database
      const response = await adminService.switchDatabase(databaseName, password);

      if (response.success) {
        // Store customer-specific database credentials
        localStorage.setItem('customerSelectedDatabase', databaseName);
        localStorage.setItem('customerDatabasePassword', password);
        localStorage.setItem('selectedDatabase', databaseName);
        localStorage.setItem('databasePassword', password);
        localStorage.setItem('tabbleDatabaseSelected', 'true');

        // Move to next step
        setActiveStep(1);
      } else {
        setError(response.message || 'Failed to connect to database');
      }
    } catch (error) {
      console.error('Database connection error:', error);
      if (error.response?.status === 401) {
        setError('Invalid password for the selected database');
      } else {
        setError('Failed to connect to database. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTableSubmit = () => {
    if (!tableNumber || tableNumber.trim() === '') {
      setError('Please enter a valid table number');
      return;
    }

    // Store table number in localStorage
    localStorage.setItem('tableNumber', tableNumber);

    // Close the dialog and notify parent
    onClose({ tableNumber, databaseName, password });
  };

  const handleBack = () => {
    setActiveStep(0);
    setError('');
  };

  const renderDatabaseStep = () => (
    <>
      <Box textAlign="center" mb={3}>
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          Select Database
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Choose your hotel database and enter the password
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }}>
          {error}
        </Alert>
      )}

      <StyledTextField
        select
        label="Database Name"
        variant="outlined"
        fullWidth
        value={databaseName}
        onChange={(e) => {
          setDatabaseName(e.target.value);
          setError('');
        }}
        disabled={loading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <DatabaseIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        autoFocus
      >
        {availableDatabases.map((db) => (
          <MenuItem
            key={db.database_name}
            value={db.database_name}
            sx={{
              border: '1px solid rgba(255, 165, 0, 0.4)',
              margin: '2px',
              borderRadius: '4px',
              color: '#FFFFFF',
              backgroundColor: 'rgba(18, 18, 18, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                border: '1px solid rgba(255, 165, 0, 0.6)',
                borderLeft: '3px solid rgba(255, 165, 0, 0.8)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 165, 0, 0.15)',
                border: '1px solid rgba(255, 165, 0, 0.8)',
                borderLeft: '4px solid #FFA500',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(255, 165, 0, 0.2)',
                  border: '1px solid #FFA500',
                },
              },
            }}
          >
            {db.database_name}
          </MenuItem>
        ))}
      </StyledTextField>

      <StyledTextField
        label="Database Password"
        variant="outlined"
        type="password"
        fullWidth
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError('');
        }}
        disabled={loading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />
    </>
  );

  const renderTableStep = () => (
    <>
      <Box textAlign="center" mb={3}>
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          Enter Table Number
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Please enter your table number to continue
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }}>
          {error}
        </Alert>
      )}

      <StyledTextField
        label="Table Number"
        variant="outlined"
        type="number"
        fullWidth
        value={tableNumber}
        onChange={(e) => {
          setTableNumber(e.target.value);
          setError('');
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <TableRestaurantIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        autoFocus
      />
    </>
  );

  return (
    <StyledDialog
      open={open}
      onClose={() => {}} // Prevent closing by clicking outside
      aria-labelledby="table-setup-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="table-setup-dialog-title">
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <TableRestaurantIcon sx={{ color: 'primary.main', fontSize: 40, mr: 1.5 }} />
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
            TABBLE
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-active': {
                      color: '#FFA500',
                    },
                    '&.Mui-completed': {
                      color: '#FFA500',
                    },
                  },
                  '& .MuiStepIcon-root': {
                    color: 'rgba(255,255,255,0.3)',
                    '&.Mui-active': {
                      color: '#FFA500',
                    },
                    '&.Mui-completed': {
                      color: '#FFA500',
                    },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" mb={3}>
            <CircularProgress sx={{ color: 'primary.main' }} />
          </Box>
        )}

        {!loading && activeStep === 0 && renderDatabaseStep()}
        {!loading && activeStep === 1 && renderTableStep()}
      </DialogContent>

      <DialogActions sx={{ justifyContent: activeStep === 1 ? 'space-between' : 'center', pb: 3, px: 3 }}>
        {activeStep === 1 && (
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBack}
            sx={{
              py: 1.5,
              px: 3,
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            Back
          </Button>
        )}

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={activeStep === 0 ? handleDatabaseSubmit : handleTableSubmit}
          disabled={loading || (activeStep === 0 ? !databaseName || !password : !tableNumber)}
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: '8px',
            fontSize: '1.125rem',
            fontWeight: 500,
            ...(activeStep === 0 && { width: '100%' })
          }}
        >
          {activeStep === 0 ? 'Connect to Database' : 'Continue'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default TableSetup;
