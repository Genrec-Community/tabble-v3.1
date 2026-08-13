import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';
import { selectSnackbar, hideSnackbar } from '../store/slices/uiSlice';

const GlobalSnackbar = () => {
  const dispatch = useDispatch();
  const snackbar = useSelector(selectSnackbar);

  useEffect(() => {
    if (!snackbar?.open) return undefined;
    const timer = setTimeout(() => dispatch(hideSnackbar()), 4000);
    return () => clearTimeout(timer);
  }, [snackbar?.open, snackbar?.message, dispatch]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    dispatch(hideSnackbar());
  };

  return (
    <Snackbar
      open={!!snackbar?.open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={handleClose}
        severity={snackbar?.severity || 'success'}
        variant="filled"
        sx={{ width: '100%', fontWeight: 600 }}
      >
        {snackbar?.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
