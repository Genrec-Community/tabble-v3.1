import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';

const QuickActions = ({ variant = 'admin' }) => {
  const adminActions = [
    {
      title: 'Add New Dish',
      description: 'Create a new menu item',
      icon: <RestaurantMenuIcon />,
      path: '/admin/dishes',
      color: 'primary',
      action: 'Add Dish'
    },
    {
      title: 'Create Offer',
      description: 'Set up a special offer',
      icon: <LocalOfferIcon />,
      path: '/admin/offers',
      color: 'secondary',
      action: 'Create Offer'
    },
    {
      title: 'Today\'s Special',
      description: 'Feature a special dish',
      icon: <StarIcon />,
      path: '/admin/specials',
      color: 'warning',
      action: 'Set Special'
    },
    {
      title: 'View Orders',
      description: 'Check recent orders',
      icon: <ReceiptIcon />,
      path: '/admin/completed-orders',
      color: 'success',
      action: 'View Orders'
    }
  ];

  const chefActions = [
    {
      title: 'Pending Orders',
      description: 'Orders waiting for acceptance',
      icon: <RestaurantMenuIcon />,
      path: '/chef/orders',
      color: 'warning',
      action: 'View Orders'
    },
    {
      title: 'Accepted Orders',
      description: 'Orders being prepared',
      icon: <LocalOfferIcon />,
      path: '/chef/orders',
      color: 'info',
      action: 'View Orders'
    }
  ];

  const actions = variant === 'admin' ? adminActions : chefActions;

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
      <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
        Quick Actions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Common tasks and shortcuts for efficient management
      </Typography>

      <Grid container spacing={2}>
        {actions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                borderTop: '3px solid',
                borderColor: `${action.color}.main`,
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      color: `${action.color}.main`,
                      backgroundColor: `${action.color}.light`,
                      borderRadius: '50%',
                      p: 1,
                      mr: 2,
                      opacity: 0.8
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6" component="h3" fontWeight="medium">
                    {action.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                <Button
                  component={RouterLink}
                  to={action.path}
                  size="small"
                  color={action.color}
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {action.action}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default QuickActions;
