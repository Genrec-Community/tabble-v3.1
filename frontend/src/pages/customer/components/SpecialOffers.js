import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  keyframes,
  Divider
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { AddButton } from './MenuStyled';
import AddIcon from '@mui/icons-material/Add';

// Define keyframes for the pulsating animation
const pulsate = keyframes`
  0% {
    transform: scale(1);
    text-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
  }
  50% {
    transform: scale(1.05);
    text-shadow: 0 0 20px rgba(255, 165, 0, 0.8), 0 0 30px rgba(255, 165, 0, 0.5);
  }
  100% {
    transform: scale(1);
    text-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
  }
`;

// Define keyframes for the shine effect
const shine = keyframes`
  0% {
    background-position: -100px;
  }
  40%, 100% {
    background-position: 300px;
  }
`;

const SpecialOffers = ({ offers, loading, handleOpenDialog, calculateDiscountedPrice }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto scroll to next dish every 5 seconds (slower transition)
  useEffect(() => {
    if (offers.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % offers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [offers.length, isPaused]);

  // Function to handle manual navigation
  const goToSlide = (index) => {
    setCurrentIndex(index);
    // Pause auto-scrolling briefly when user manually navigates
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  };

  // Navigate to previous slide
  const prevSlide = () => {
    const newIndex = currentIndex === 0 ? offers.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  // Navigate to next slide
  const nextSlide = () => {
    const newIndex = (currentIndex + 1) % offers.length;
    goToSlide(newIndex);
  };

  if (loading || offers.length === 0) return null;

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
          opacity: 0.3,
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
        <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: '#FFA500',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            background: 'linear-gradient(90deg, rgba(255,165,0,0.8) 0%, #FFA500 50%, rgba(255,165,0,0.8) 100%)',
            backgroundSize: '400px',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${shine} 3s linear infinite, ${pulsate} 2s infinite ease-in-out`,
          }}
        >
          <LocalOfferIcon sx={{ mr: 1, fontSize: '2.5rem', color: '#FFA500' }} /> Special Offers
        </Typography>
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
          position: 'relative',
          width: '100%',
          height: 400,
          overflow: 'hidden',
          mb: 2,
        }}
      >
        {/* Left navigation arrow */}
        {offers.length > 1 && (
          <IconButton
            onClick={prevSlide}
            sx={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#FFA500',
              width: 40,
              height: 40,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.9)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
        )}

        {/* Right navigation arrow */}
        {offers.length > 1 && (
          <IconButton
            onClick={nextSlide}
            sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#FFA500',
              width: 40,
              height: 40,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.9)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        )}

        {/* Simple slider container */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {offers.map((offer, index) => (
            <Card
              key={`offer-${offer.id}`}
              sx={{
                display: 'flex',
                width: '100%',
                height: 400,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                backgroundColor: '#121212',
                border: '2px solid #FFA500',
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: index === currentIndex ? 1 : 0,
                transform: `translateX(${index === currentIndex ? 0 : (index < currentIndex ? '-100%' : '100%')})`,
                transition: 'transform 0.8s ease, opacity 0.8s ease',
                zIndex: index === currentIndex ? 2 : 1,
              }}
              onClick={() => handleOpenDialog(offer)}
            >
              {/* Left side - Image */}
              <Box sx={{
                width: '35%',
                position: 'relative',
              }}>
                <CardMedia
                  component="img"
                  sx={{
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  image={offer.image_path ? `${process.env.REACT_APP_API_BASE_URL}${offer.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                  alt={offer.name}
                />

                {/* Discount badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: -30,
                    width: 150,
                    height: 40,
                    background: 'linear-gradient(135deg, #FF8C00, #FFA500)',
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(45deg)',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                    zIndex: 10,
                    fontSize: '1.2rem',
                  }}
                >
                  {offer.discount}% OFF
                </Box>
              </Box>

              {/* Right side - Content */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '65%',
                color: 'white',
              }}>
                <CardContent sx={{
                  flex: '1 0 auto',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%'
                }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{
                      color: '#FFA500',
                      mb: 2,
                      borderBottom: '2px solid rgba(255, 165, 0, 0.3)',
                      pb: 1,
                    }}>
                      {offer.name}
                    </Typography>

                    <Typography variant="h6" sx={{
                      color: 'rgba(255,255,255,0.9)',
                      mb: 3,
                      lineHeight: 1.5,
                    }}>
                      {offer.description || 'A delicious dish prepared with the finest ingredients, available for a limited time at a special discount.'}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.5)' }}>
                        ₹{offer.price.toFixed(2)}
                      </Typography>
                      <Typography variant="h4" sx={{
                        color: '#FFA500',
                        fontWeight: 'bold',
                      }}>
                        ₹{calculateDiscountedPrice(offer.price, offer.discount)}
                      </Typography>
                    </Box>

                    <AddButton
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(offer);
                      }}
                      sx={{
                        px: 3,
                        py: 1.5,
                        fontSize: '1.1rem',
                        background: 'linear-gradient(45deg, #FF8C00, #FFA500)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #FFA500, #FF8C00)',
                        },
                      }}
                    >
                      Add
                    </AddButton>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Navigation dots */}
      {offers.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 2,
            gap: 1.5
          }}
        >
          {offers.map((_, index) => (
            <Box
              key={index}
              onClick={() => goToSlide(index)}
              sx={{
                width: index === currentIndex ? 40 : 12,
                height: 12,
                borderRadius: 6,
                cursor: 'pointer',
                backgroundColor: index === currentIndex ? '#FFA500' : 'rgba(255, 165, 0, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: index === currentIndex ? '0 0 10px rgba(255, 165, 0, 0.5)' : 'none',
                '&:hover': {
                  backgroundColor: index === currentIndex ? '#FFA500' : 'rgba(255, 165, 0, 0.5)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              {index === currentIndex && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'black',
                    fontWeight: 'bold',
                    fontSize: '0.6rem'
                  }}
                >
                  {index + 1}/{offers.length}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default SpecialOffers;
