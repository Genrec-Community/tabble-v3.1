import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardMedia,
  Divider,
  keyframes
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { AddButton } from './MenuStyled';
import AddIcon from '@mui/icons-material/Add';

// Define keyframes for the shine animation
const shine = keyframes`
  0% {
    background-position: -100px;
  }
  40%, 100% {
    background-position: 300px;
  }
`;

// Define keyframes for the floating animation
const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const TodaySpecials = ({ specials, loading, handleOpenDialog }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Rotate through specials every 5 seconds
  useEffect(() => {
    if (specials.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % specials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [specials.length]);

  if (loading || specials.length === 0) return null;

  return (
    <Paper
      elevation={5}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: '16px',
        background: 'linear-gradient(145deg, #1A1A1A 0%, #121212 100%)',
        border: '2px solid #FFA500',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle, rgba(255,165,0,0.1) 10%, transparent 10.5%)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
          opacity: 0.5,
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          position: 'relative'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'inline-block',
            animation: `${float} 3s ease-in-out infinite`,
          }}
        >
          <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: '#FFA500',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              background: 'linear-gradient(90deg, rgba(255,165,0,0.8) 0%, #FFA500 50%, rgba(255,165,0,0.8) 100%)',
              backgroundSize: '400px',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `${shine} 3s linear infinite`,
            }}
          >
            <WhatshotIcon sx={{ mr: 1, fontSize: '2rem' }} /> Today's Chef Special
          </Typography>
        </Box>
        <Divider
          sx={{
            width: '60%',
            height: '3px',
            backgroundColor: 'rgba(255,165,0,0.5)',
            mt: 1,
            borderRadius: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,165,0,0.8), transparent)'
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 4,
          pb: 2,
        }}
      >
        {specials.map((special, index) => (
          <Card
            key={`special-${special.id}`}
            sx={{
              width: 340,
              height: 380,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              backgroundColor: '#121212',
              position: 'relative',
              transform: index === activeIndex ? 'scale(1.05)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              },
            }}
            onClick={() => handleOpenDialog(special)}
          >
            {/* Card background with overlay */}
            <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Image section - taking up 60% of the card */}
              <Box sx={{ position: 'relative', height: '60%' }}>
                <CardMedia
                  component="img"
                  sx={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                  image={special.image_path ? `${process.env.REACT_APP_API_BASE_URL}${special.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                  alt={special.name}
                />

                {/* Diagonal ribbon */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: -30,
                    width: 150,
                    height: 30,
                    backgroundColor: '#FFA500',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    transform: 'rotate(45deg)',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                    zIndex: 10,
                    animation: index === activeIndex ? `${shine} 2s linear infinite` : 'none',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      backgroundSize: '200% 100%',
                      animation: `${shine} 2s linear infinite`,
                    }
                  }}
                >
                  CHEF'S CHOICE
                </Box>

                {/* Price tag */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -15,
                    right: 20,
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    backgroundColor: '#121212',
                    border: '2px solid #FFA500',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                    zIndex: 10,
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#FFA500' }} fontWeight="bold">
                    ₹{special.price.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              {/* Content section - taking up 40% of the card */}
              <Box sx={{
                height: '40%',
                p: 3,
                pt: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#121212',
              }}>
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold" sx={{
                    color: '#FFA500',
                    mb: 1
                  }}>
                    {special.name}
                  </Typography>
                  <Typography variant="body1" sx={{
                    color: 'rgba(255,255,255,0.8)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {special.description || 'A special dish crafted by our chef with premium ingredients.'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="flex-end" mt={1}>
                  <AddButton
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(special);
                    }}
                    sx={{
                      px: 3,
                      py: 1,
                      fontSize: '1rem',
                      background: 'linear-gradient(45deg, #FF8C00, #FFA500)',
                      boxShadow: '0 4px 15px rgba(255, 165, 0, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #FFA500, #FF8C00)',
                        boxShadow: '0 6px 20px rgba(255, 165, 0, 0.6)',
                      }
                    }}
                  >
                    Add
                  </AddButton>
                </Box>
              </Box>

              {/* Border overlay for active card */}
              {index === activeIndex && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '3px solid #FFA500',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    zIndex: 20,
                    boxShadow: 'inset 0 0 20px rgba(255, 165, 0, 0.5)',
                  }}
                />
              )}
            </Box>
          </Card>
        ))}
      </Box>
    </Paper>
  );
};

export default TodaySpecials;
