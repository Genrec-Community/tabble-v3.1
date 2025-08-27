import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Rating,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Fade,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FeedbackIcon from '@mui/icons-material/Feedback';
import StarIcon from '@mui/icons-material/Star';
import { customerService } from '../services/api';

const StyledRating = styled(Rating)(({ theme }) => ({
  '& .MuiRating-iconFilled': {
    color: theme.palette.primary.main,
  },
  '& .MuiRating-iconHover': {
    color: theme.palette.primary.light,
  },
}));

const labels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const FeedbackDialog = ({ open, onClose, orderId, personId }) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSubmit = async () => {
    if (rating === 0) {
      setSnackbar({
        open: true,
        message: 'Please select a rating',
        severity: 'error'
      });
      return;
    }

    // Check if orderId is available
    if (!orderId) {
      setSnackbar({
        open: true,
        message: 'Order information not available. Please try again later.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const feedbackData = {
        order_id: orderId,
        person_id: personId,
        rating,
        comment: comment.trim() || null
      };

      console.log('Submitting feedback:', feedbackData);
      await customerService.submitFeedback(feedbackData);

      setSnackbar({
        open: true,
        message: 'Thank you for your feedback!',
        severity: 'success'
      });

      // Close dialog after a short delay and navigate to home page
      setTimeout(() => {
        handleClose();
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSnackbar({
        open: true,
        message: 'Error submitting feedback. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setRating(5);
    setComment('');
    onClose();
  };

  const handleSkip = () => {
    handleClose();
    navigate('/');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <FeedbackIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5" component="div" fontWeight="bold">
              Your Feedback
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" gutterBottom>
              Thank you for dining with us! Please share your experience to help us improve our service.
            </Typography>
            <Typography variant="body1" color="success.main" sx={{ mt: 1, fontWeight: 'medium' }}>
              Your bill will arrive at your table soon.
            </Typography>

            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              my: 4,
              p: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: '16px'
            }}>
              <Typography variant="h6" gutterBottom>
                How would you rate your experience?
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StyledRating
                  name="hover-feedback"
                  value={rating}
                  precision={1}
                  size="large"
                  onChange={(event, newValue) => {
                    setRating(newValue);
                  }}
                  onChangeActive={(event, newHover) => {
                    setHover(newHover);
                  }}
                  emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {labels[hover !== -1 ? hover : rating]}
              </Typography>
            </Box>

            <TextField
              label="Additional Comments (Optional)"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleSkip}
            variant="outlined"
            disabled={loading}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              background: 'linear-gradient(145deg, #FF5A5F 0%, #FF385C 100%)',
              boxShadow: '0 4px 10px rgba(255, 90, 95, 0.25)',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
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
    </>
  );
};

export default FeedbackDialog;
