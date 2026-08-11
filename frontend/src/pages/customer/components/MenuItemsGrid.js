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
import ScheduleIcon from '@mui/icons-material/Schedule';
import StarIcon from '@mui/icons-material/Star';
import { apiBaseUrl } from '../../../utils/apiBaseUrl';
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
        <Typography variant="h5" color={theme.palette.text.primary} fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
          <RestaurantIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
          {currentCategory === 'All' ? 'All Items' : currentCategory}
        </Typography>
      </Box>

      {/* Menu Items Grid — 2-column on mobile, per the ordering-app design */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={{ xs: '250px', sm: '400px' }}>
          <CircularProgress sx={{ color: '#FFA500' }} />
        </Box>
      ) : (
        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
          {displayDishes.map((dish) => (
            <Grid item xs={6} sm={4} md={3} key={dish.id}>
              <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                <DishCard
                  onClick={() => handleOpenDialog(dish)}
                  sx={{
                    borderRadius: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.09)'}`,
                  }}
                >
                  {/* Upper half — media, clipped to the card's top rounded corners */}
                  <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', overflow: 'hidden' }}>
                    <Box
                      component="img"
                      src={dish.image_path ? `${apiBaseUrl}${dish.image_path}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}
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

                    {/* Subtle gradient overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '35%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)',
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Popular/New Badge */}
                    {dish.isPopular && (
                      <SpecialBadge sx={{ top: 10, left: 10, py: '3px', px: '8px', fontSize: '0.65rem' }}>
                        <LocalOfferIcon sx={{ fontSize: 12 }} /> Popular
                      </SpecialBadge>
                    )}

                    {dish.isNew && !dish.isPopular && (
                      <SpecialBadge sx={{ top: 10, left: 10, py: '3px', px: '8px', fontSize: '0.65rem', borderColor: theme.palette.secondary.main, color: theme.palette.secondary.main }}>
                        <LocalOfferIcon sx={{ fontSize: 12, color: theme.palette.secondary.main }} /> New
                      </SpecialBadge>
                    )}

                    {/* Category Badges - Only show in All view */}
                    {currentCategory === 'All' && (
                      <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
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
                              sx={{ height: 20, fontSize: '0.62rem', '& .MuiChip-label': { px: 1 } }}
                            />
                          ));
                        })()}
                      </Box>
                    )}

                    {/* Vegetarian/Non-Vegetarian Indicator */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        width: 20,
                        height: 20,
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
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: dish.is_vegetarian === 1 ? '#4CAF50' : '#F44336',
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Lower half — details */}
                  <CardContent sx={{
                    p: { xs: 1.5, sm: 2 },
                    pb: { xs: 1.25, sm: 1.5 },
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    flexGrow: 1
                  }}>
                    {/* Dish Name */}
                    <Typography
                      variant="h6"
                      component="div"
                      fontWeight="bold"
                      color={theme.palette.text.primary}
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '1.0625rem' },
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: { xs: '2.3rem', sm: '2.8rem' }
                      }}
                    >
                      {dish.name}
                    </Typography>

                    {/* Metadata row — circular icon + inline value (time & rating) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: 'rgba(255,165,0,0.12)',
                        }}>
                          <ScheduleIcon sx={{ fontSize: 13, color: '#FFA500' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                          {dish.prepTime} min
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: 'rgba(255,165,0,0.12)',
                        }}>
                          <StarIcon sx={{ fontSize: 13, color: '#FFA500' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                          {dish.rating}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ backgroundColor: theme.palette.divider, mt: 0.25 }} />

                    {/* Price bottom-left + add button */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
                      {showPrices ? (
                        <Box sx={{ minWidth: 0, mr: 0.5 }}>
                          {dish.is_offer === 1 && dish.discount > 0 && (
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', color: theme.palette.text.disabled, textDecoration: 'line-through', fontSize: '0.65rem', lineHeight: 1 }}
                            >
                              ₹{dish.price.toFixed(2)}
                            </Typography>
                          )}
                          <Typography variant="h6" fontWeight="bold" color="#FFA500" noWrap sx={{ fontSize: { xs: '0.95rem', sm: '1.125rem' }, lineHeight: 1.25 }}>
                            ₹{(dish.is_offer === 1 && dish.discount > 0
                              ? (dish.price - (dish.price * dish.discount / 100))
                              : dish.price
                            ).toFixed(2)}
                          </Typography>
                        </Box>
                      ) : (
                        <Box />
                      )}
                      <AddButton
                        variant="contained"
                        aria-label={`Add ${dish.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(dish);
                        }}
                        sx={{
                          minWidth: { xs: 30, sm: 36 },
                          width: { xs: 30, sm: 36 },
                          height: { xs: 30, sm: 36 },
                          borderRadius: '50%',
                          p: 0,
                          minHeight: 0,
                          '& .MuiButton-startIcon': { m: 0 },
                        }}
                      >
                        <AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
                backgroundColor: theme.palette.background.paper,
                borderRadius: '6px',
                border: '1px solid rgba(255, 165, 0, 0.2)'
              }}>
                <RestaurantIcon sx={{ fontSize: 80, color: 'rgba(255, 165, 0, 0.3)', mb: 3, opacity: 0.7 }} />
                <Typography variant="h6" color={theme.palette.text.primary} gutterBottom fontWeight="medium">
                  No dishes available in this category
                </Typography>
                <Typography variant="body2" color={theme.palette.text.secondary} sx={{ maxWidth: '400px', mx: 'auto' }}>
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
