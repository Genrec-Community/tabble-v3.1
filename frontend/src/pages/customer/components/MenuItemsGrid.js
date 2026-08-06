import React from 'react';
import {
  Box,
  Typography,
  Grid,
  CardContent,
  Divider,
  CircularProgress,
  Zoom
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import {
  DishCard,
  CategoryBadge,
  SpecialBadge,
  AddButton
} from './MenuStyled';

const MenuItemsGrid = ({
  filteredDishes,
  currentCategory,
  loading,
  handleOpenDialog,
  categoryColors,
  theme,
  showPrices = true,
}) => {
  // Show all dishes without filtering out featured dishes
  const displayDishes = filteredDishes;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: { xs: 2, sm: 3 },
          '&:after': {
            content: '""',
            display: 'block',
            height: '1px',
            flexGrow: 1,
            backgroundColor: 'rgba(255, 165, 0, 0.3)',
            ml: 2
          }
        }}
      >
        <Typography variant="h5" color="white" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
          <RestaurantIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
          {currentCategory === 'All' ? 'All Items' : currentCategory}
        </Typography>
      </Box>

      {/* Menu Items Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={{ xs: '250px', sm: '400px' }}>
          <CircularProgress sx={{ color: '#FFA500' }} />
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {displayDishes.map((dish) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dish.id}>
              <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                <DishCard onClick={() => handleOpenDialog(dish)}>
                  {/* Image Section */}
                  <Box sx={{ position: 'relative', width: '100%', paddingTop: '75%', overflow: 'hidden' }}>
                    <Box
                      component="img"
                      src={dish.image_path ? `${process.env.REACT_APP_API_BASE_URL}${dish.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
                      alt={dish.name}
                      loading="lazy"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                    />

                    {/* Gradient Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Popular/New Badge */}
                    {dish.isPopular && (
                      <SpecialBadge sx={{ top: 12, left: 12 }}>
                        <LocalOfferIcon sx={{ fontSize: 14 }} /> Popular
                      </SpecialBadge>
                    )}

                    {dish.isNew && !dish.isPopular && (
                      <SpecialBadge sx={{ top: 12, left: 12, borderColor: theme.palette.secondary.main, color: theme.palette.secondary.main }}>
                        <LocalOfferIcon sx={{ fontSize: 14, color: theme.palette.secondary.main }} /> New
                      </SpecialBadge>
                    )}

                    {/* Category Badges - Only show in All view */}
                    {currentCategory === 'All' && (
                      <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                        {(() => {
                          let dishCategories = [];
                          try {
                            dishCategories = JSON.parse(dish.category || '[]');
                            if (!Array.isArray(dishCategories)) {
                              dishCategories = [dish.category];
                            }
                          } catch (e) {
                            dishCategories = dish.category ? [dish.category] : [];
                          }

                          return dishCategories.slice(0, 1).map((cat, index) => (
                            <CategoryBadge
                              key={index}
                              label={cat}
                              size="small"
                              categorycolor={categoryColors[cat] || categoryColors['Main Course']}
                            />
                          ));
                        })()}
                      </Box>
                    )}

                    {/* Vegetarian/Non-Vegetarian Indicator */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        width: 24,
                        height: 24,
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid',
                        borderColor: dish.is_vegetarian === 1 ? '#4CAF50' : '#F44336',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: dish.is_vegetarian === 1 ? '#4CAF50' : '#F44336',
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Content Section */}
                  <CardContent sx={{
                    p: { xs: 1.5, sm: 2 },
                    backgroundColor: '#171715',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    flexGrow: 1
                  }}>
                    {/* Dish Name */}
                    <Typography
                      variant="h6"
                      component="div"
                      fontWeight="bold"
                      color="white"
                      sx={{
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: { xs: '2.6rem', sm: '2.9rem' }
                      }}
                    >
                      {dish.name}
                    </Typography>

                    {/* Description */}
                    {dish.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.65)',
                          lineHeight: 1.5,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: { xs: '2.4rem', sm: '2.625rem' }
                        }}
                      >
                        {dish.description}
                      </Typography>
                    )}

                    <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

                    {/* Price and Add Button */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      {showPrices ? (
                        <Typography variant="h6" fontWeight="bold" color="#FFA500" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                          ₹{dish.price.toFixed(2)}
                        </Typography>
                      ) : (
                        <Box />
                      )}
                      <AddButton
                        variant="contained"
                        startIcon={<AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(dish);
                        }}
                        sx={{
                          py: { xs: 0.75, sm: 1 },
                          px: { xs: 2, sm: 2.5 },
                          fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                          minWidth: { xs: 80, sm: 90 },
                          fontWeight: 700
                        }}
                      >
                        Add
                      </AddButton>
                    </Box>
                  </CardContent>
                </DishCard>
              </Zoom>
            </Grid>
          ))}

          {filteredDishes.length === 0 && !loading && (
            <Grid item xs={12}>
              <Box textAlign="center" py={8} sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 165, 0, 0.2)'
              }}>
                <RestaurantIcon sx={{ fontSize: 80, color: 'rgba(255, 165, 0, 0.3)', mb: 3, opacity: 0.7 }} />
                <Typography variant="h6" color="white" gutterBottom fontWeight="medium">
                  No dishes available in this category
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ maxWidth: '400px', mx: 'auto' }}>
                  Please check back later or try another category from our luxury menu
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default MenuItemsGrid;
