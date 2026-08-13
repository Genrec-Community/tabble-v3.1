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
        height: { xs: '184px', sm: '260px', md: '300px' },
        borderRadius: { xs: '0 0 24px 24px', sm: '24px' },
        overflow: 'hidden',
        mb: { xs: 3, sm: 5 },
        boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
        background: `linear-gradient(90deg, rgba(10,10,8,0.93), rgba(10,10,8,0.42)), url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1074&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          p: { xs: 2.5, sm: 4 },
          color: 'white',
        }}
      >
        <Fade in={true} timeout={1000}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: '#F7B538',
                letterSpacing: { xs: '1px', sm: '3px' },
                fontSize: { xs: '0.64rem', sm: '0.8rem' },
                mb: 1,
                display: 'block'
              }}
            >
              LUXURY HOTEL DINING
            </Typography>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom sx={{
              fontSize: { xs: '1.55rem', sm: '2rem', md: '3rem' },
              lineHeight: 1.15,
            }}>
              {formattedDatabaseName ? (
                <>
                  <Box component="span" sx={{ color: '#F7B538' }}>{formattedDatabaseName}</Box> dining
                </>
              ) : (
                <>
                  Exquisite <Box component="span" sx={{ color: '#F7B538' }}>Culinary</Box> dining
                </>
              )}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={{ xs: 1.5, sm: 3 }}>
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
