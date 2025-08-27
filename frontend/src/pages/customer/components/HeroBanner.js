import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Rating,
  Fade
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';

const HeroBanner = ({ tableNumber, uniqueId, databaseName }) => {
  // Format database name: remove .db extension and capitalize first letter
  const formatDatabaseName = (dbName) => {
    if (!dbName) return '';
    // Remove .db extension if present
    const nameWithoutExtension = dbName.replace(/\.db$/, '');
    // Capitalize first letter
    return nameWithoutExtension.charAt(0).toUpperCase() + nameWithoutExtension.slice(1);
  };

  const formattedDatabaseName = formatDatabaseName(databaseName);

  return (
    <Box
      sx={{
        position: 'relative',
        height: '300px',
        borderRadius: '6px',
        overflow: 'hidden',
        mb: 6,
        boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
        background: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: '#FFA500',
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          p: 4,
          color: 'white',
        }}
      >
        <Fade in={true} timeout={1000}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: '#FFA500',
                letterSpacing: '3px',
                fontSize: '1rem',
                mb: 1,
                display: 'block'
              }}
            >
              LUXURY HOTEL DINING
            </Typography>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom sx={{
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-15px',
                left: '0',
                width: '80px',
                height: '3px',
                backgroundColor: '#FFA500'
              }
            }}>
              {formattedDatabaseName ? (
                <>
                  <Box component="span" sx={{ color: '#FFA500' }}>{formattedDatabaseName}</Box> Experience
                </>
              ) : (
                <>
                  Exquisite <Box component="span" sx={{ color: '#FFA500' }}>Culinary</Box> Experience
                </>
              )}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mt={4}>
              <Box display="flex" alignItems="center">
                <PlaceIcon sx={{ mr: 0.5, fontSize: '1rem', color: '#FFA500' }} />
                <Typography variant="body2">Table #{tableNumber}</Typography>
              </Box>
              
              <Chip
                label={uniqueId}
                size="small"
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#FFA500',
                  fontWeight: 'bold',
                  border: '1px solid rgba(255, 165, 0, 0.5)',
                  backdropFilter: 'blur(4px)',
                }}
              />
            </Box>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default HeroBanner;
