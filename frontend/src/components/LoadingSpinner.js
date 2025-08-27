import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Fade,
  LinearProgress,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';

// Main loading spinner component
const LoadingSpinner = ({ 
  size = 40, 
  message = 'Loading...', 
  fullScreen = false,
  variant = 'circular' // 'circular', 'linear', 'dots'
}) => {
  const containerSx = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    py: 4,
  };

  if (variant === 'linear') {
    return (
      <Box sx={containerSx}>
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <LinearProgress 
            sx={{ 
              backgroundColor: 'rgba(255, 165, 0, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#FFA500',
              },
            }} 
          />
        </Box>
        {message && (
          <Typography 
            variant="body1" 
            sx={{ color: '#FFA500', textAlign: 'center' }}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  if (variant === 'dots') {
    return (
      <Box sx={containerSx}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#FFA500',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${index * 0.2}s`,
                '@keyframes pulse': {
                  '0%, 80%, 100%': {
                    opacity: 0.3,
                    transform: 'scale(0.8)',
                  },
                  '40%': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                },
              }}
            />
          ))}
        </Box>
        {message && (
          <Typography 
            variant="body1" 
            sx={{ color: '#FFA500', textAlign: 'center' }}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  // Default circular variant
  return (
    <Fade in={true} timeout={300}>
      <Box sx={containerSx}>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: '#FFA500',
              animationDuration: '1.5s',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <RestaurantIcon 
              sx={{ 
                color: '#FFA500', 
                fontSize: size * 0.4,
                animation: 'rotate 2s linear infinite',
                '@keyframes rotate': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }} 
            />
          </Box>
        </Box>
        {message && (
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#FFA500', 
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

// Specialized loading components
export const PageLoadingSpinner = ({ message = 'Loading page...' }) => (
  <LoadingSpinner fullScreen message={message} size={60} />
);

export const ComponentLoadingSpinner = ({ message = 'Loading...' }) => (
  <LoadingSpinner message={message} size={40} />
);

export const ButtonLoadingSpinner = ({ size = 20 }) => (
  <CircularProgress 
    size={size} 
    thickness={4}
    sx={{ color: 'inherit' }}
  />
);

export const InlineLoadingSpinner = ({ message = 'Loading...' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
    <CircularProgress size={16} thickness={4} sx={{ color: '#FFA500' }} />
    <Typography variant="body2" sx={{ color: '#FFA500' }}>
      {message}
    </Typography>
  </Box>
);

export const LinearLoadingBar = ({ message = 'Loading...' }) => (
  <LoadingSpinner variant="linear" message={message} />
);

export const DotsLoadingSpinner = ({ message = 'Loading...' }) => (
  <LoadingSpinner variant="dots" message={message} />
);

// Skeleton loading component for content placeholders
export const SkeletonLoader = ({ 
  lines = 3, 
  height = 20, 
  spacing = 1,
  animation = 'wave' // 'wave', 'pulse', false
}) => {
  return (
    <Box>
      {Array.from({ length: lines }).map((_, index) => (
        <Box
          key={index}
          sx={{
            height,
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            borderRadius: 1,
            mb: spacing,
            width: index === lines - 1 ? '60%' : '100%',
            animation: animation === 'wave' 
              ? 'wave 1.6s ease-in-out infinite'
              : animation === 'pulse'
              ? 'pulse 1.5s ease-in-out infinite'
              : 'none',
            '@keyframes wave': {
              '0%': {
                transform: 'translateX(-100%)',
              },
              '50%': {
                transform: 'translateX(100%)',
              },
              '100%': {
                transform: 'translateX(100%)',
              },
            },
            '@keyframes pulse': {
              '0%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.4,
              },
              '100%': {
                opacity: 1,
              },
            },
          }}
        />
      ))}
    </Box>
  );
};

export default LoadingSpinner;
