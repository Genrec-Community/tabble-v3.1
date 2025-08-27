import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { reportError } from '../utils/errorHandler';

class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now().toString();
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorId,
    });

    // Report error to monitoring service in production
    reportError(error, 'Error Boundary', {
      errorId,
      componentStack: errorInfo.componentStack,
      props: this.props,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            errorId={this.state.errorId}
          />
        );
      }

      // Production-safe error UI
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#121212',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              borderRadius: '12px',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <ErrorOutlineIcon
                sx={{
                  fontSize: '4rem',
                  color: '#FF385C',
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ color: '#FFFFFF', fontWeight: 'bold' }}
              >
                Oops! Something went wrong
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: '#FFA500', mb: 3 }}
              >
                We're sorry for the inconvenience. Our team has been notified.
              </Typography>
              
              {process.env.NODE_ENV === 'production' && (
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}
                >
                  Error ID: {this.state.errorId}
                </Typography>
              )}
            </Box>

            {/* Only show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'left',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ color: '#FF385C', fontWeight: 'bold', mb: 1 }}
                >
                  Error Details (Development Mode):
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                sx={{
                  backgroundColor: '#FFA500',
                  color: '#000000',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#E69500',
                  },
                }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                sx={{
                  borderColor: '#FFA500',
                  color: '#FFA500',
                  '&:hover': {
                    borderColor: '#E69500',
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                  },
                }}
              >
                Go Home
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for functional components
export const withProductionErrorBoundary = (Component, fallback) => {
  return function WithProductionErrorBoundaryComponent(props) {
    return (
      <ProductionErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ProductionErrorBoundary>
    );
  };
};

export default ProductionErrorBoundary;
