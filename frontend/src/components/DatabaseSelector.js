import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper
} from '@mui/material';
import { adminService } from '../services/api';

const DatabaseSelector = ({ open, onSuccess, title = "Select Hotel", fullScreen = false }) => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingHotels, setFetchingHotels] = useState(true);

  // Fetch available hotels when component mounts
  useEffect(() => {
    if (open) {
      fetchHotels();
    }
  }, [open]);

  const fetchHotels = async () => {
    try {
      setFetchingHotels(true);
      const response = await adminService.getHotels();
      setHotels(response.databases || []); // API still returns 'databases' field for compatibility
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setError('Failed to load available hotels');
    } finally {
      setFetchingHotels(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedHotel) {
      setError('Please select a hotel');
      return;
    }

    if (!password) {
      setError('Please enter the hotel password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await adminService.switchHotel(selectedHotel, password);

      if (response.success) {
        // Store hotel credentials in localStorage
        localStorage.setItem('selectedHotel', selectedHotel);
        localStorage.setItem('hotelPassword', password);
        localStorage.setItem('tabbleDatabaseSelected', 'true');

        // Legacy support
        localStorage.setItem('selectedDatabase', selectedHotel);
        localStorage.setItem('databasePassword', password);

        // Call success callback
        onSuccess(selectedHotel);
      } else {
        setError(response.message || 'Failed to connect to hotel');
      }
    } catch (error) {
      console.error('Hotel connection error:', error);
      if (error.response?.status === 401) {
        setError('Invalid password for the selected hotel');
      } else {
        setError('Failed to connect to hotel. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleConnect();
    }
  };

  if (fullScreen) {
    // Render as a full-screen component instead of a dialog
    return (
      <Paper
        sx={{
          p: 4,
          borderRadius: 2,
          border: '2px solid rgba(255, 165, 0, 0.3)',
          backgroundColor: '#121212',
          width: '100%',
          maxWidth: 500,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please select your hotel and enter the password
          </Typography>
        </Box>

        <Box sx={{
          pt: 2,
          border: '1px solid rgba(255, 165, 0, 0.15)',
          borderRadius: 1,
          p: 2,
          backgroundColor: 'rgba(255, 165, 0, 0.02)'
        }}>
          {fetchingHotels ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress color="primary" />
              <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
                Loading hotels...
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleConnect(); }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Hotel</InputLabel>
                <Select
                  value={selectedHotel}
                  label="Select Hotel"
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 165, 0, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 165, 0, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFA500',
                    },
                  }}
                >
                  {hotels.map((hotel) => (
                    <MenuItem key={hotel.database_name} value={hotel.database_name}>
                      {hotel.database_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Hotel Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 165, 0, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 165, 0, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFA500',
                    },
                  },
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || fetchingHotels || !selectedHotel || !password}
                sx={{
                  mt: 3,
                  py: 1.5,
                  backgroundColor: '#FFA500',
                  color: '#000',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#FF8C00',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(255, 165, 0, 0.3)',
                    color: 'rgba(0, 0, 0, 0.5)',
                  },
                }}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Connecting...' : 'Connect to Hotel'}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
          border: '2px solid rgba(255, 165, 0, 0.3)', // Orange border around dialog
          backgroundColor: '#121212', // Consistent dark background
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please select your hotel and enter the password
        </Typography>
      </DialogTitle>

      <DialogContent sx={{
        pt: 2,
        border: '1px solid rgba(255, 165, 0, 0.15)',
        borderRadius: 1,
        m: 2,
        backgroundColor: 'rgba(255, 165, 0, 0.02)'
      }}>
        {fetchingHotels ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: 1
                }}
              >
                {error}
              </Alert>
            )}

            <FormControl
              fullWidth
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  border: '2px solid rgba(255, 165, 0, 0.4)',
                  borderRadius: 1,
                  backgroundColor: 'rgba(18, 18, 18, 0.8)',
                  color: '#FFFFFF',
                  '&:hover': {
                    borderColor: 'rgba(255, 165, 0, 0.6)',
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#FFA500',
                    boxShadow: '0 0 0 2px rgba(255, 165, 0, 0.2)',
                    backgroundColor: 'rgba(18, 18, 18, 1)',
                  },
                  '& .MuiSelect-select': {
                    color: '#FFFFFF !important',
                    padding: '14px',
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
              }}
            >
              <InputLabel>Select Hotel</InputLabel>
              <Select
                value={selectedHotel}
                label="Select Hotel"
                onChange={(e) => setSelectedHotel(e.target.value)}
                disabled={loading}
                sx={{
                  color: '#FFFFFF',
                  '& .MuiSelect-select': {
                    color: '#FFFFFF !important',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      border: '2px solid rgba(255, 165, 0, 0.4)',
                      borderRadius: 1,
                      maxHeight: 200,
                      backgroundColor: '#121212',
                      '& .MuiMenuItem-root': {
                        color: '#FFFFFF',
                        borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
                        padding: '12px 16px',
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 165, 0, 0.1)',
                          borderLeft: '3px solid rgba(255, 165, 0, 0.5)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(255, 165, 0, 0.15)',
                          borderLeft: '4px solid #FFA500',
                          color: '#FFFFFF',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 165, 0, 0.2)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                {hotels.map((hotel) => (
                  <MenuItem key={hotel.database_name} value={hotel.database_name}>
                    {hotel.database_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Hotel Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  border: '2px solid rgba(255, 165, 0, 0.4)',
                  borderRadius: 1,
                  backgroundColor: 'rgba(18, 18, 18, 0.8)',
                  color: '#FFFFFF',
                  '&:hover': {
                    borderColor: 'rgba(255, 165, 0, 0.6)',
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#FFA500',
                    boxShadow: '0 0 0 2px rgba(255, 165, 0, 0.2)',
                    backgroundColor: 'rgba(18, 18, 18, 1)',
                  },
                  '& input': {
                    color: '#FFFFFF',
                    padding: '14px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#FFA500',
                  },
                },
              }}
              autoComplete="off"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        pb: 3,
        borderTop: '1px solid rgba(255, 165, 0, 0.2)',
        backgroundColor: 'rgba(255, 165, 0, 0.02)',
      }}>
        <Button
          onClick={handleConnect}
          variant="contained"
          fullWidth
          disabled={loading || fetchingHotels || !selectedHotel || !password}
          sx={{
            py: 1.5,
            border: '1px solid rgba(255, 165, 0, 0.3)',
            borderRadius: 1,
            background: 'linear-gradient(45deg, #FFA500 30%, #FFB733 90%)',
            boxShadow: '0 4px 12px rgba(255, 165, 0, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #E69500 30%, #FFA500 90%)',
              boxShadow: '0 6px 16px rgba(255, 165, 0, 0.4)',
            },
            '&:disabled': {
              background: 'rgba(255, 165, 0, 0.3)',
              color: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(255, 165, 0, 0.2)',
            },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              Connecting...
            </>
          ) : (
            'Connect to Hotel'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DatabaseSelector;
