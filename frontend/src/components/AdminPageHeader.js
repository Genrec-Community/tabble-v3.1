import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Chip, Button } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

const AdminPageHeader = ({ 
  title, 
  subtitle, 
  actions, 
  showBreadcrumbs = true,
  status,
  statusColor = 'primary'
}) => {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      {
        label: 'Admin',
        path: '/admin',
        icon: <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
      }
    ];

    // Map path segments to readable names
    const pathMap = {
      'dishes': 'Manage Dishes',
      'offers': 'Manage Offers',
      'specials': 'Today\'s Special',
      'loyalty': 'Loyalty Program',
      'selection-offers': 'Selection Offers',
      'completed-orders': 'Completed Orders',
      'tables': 'Table Management',
      'settings': 'Settings'
    };

    if (pathSegments.length > 1) {
      const currentPage = pathSegments[pathSegments.length - 1];
      if (pathMap[currentPage]) {
        breadcrumbs.push({
          label: pathMap[currentPage],
          path: location.pathname,
          current: true
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <Box mb={4}>
      {showBreadcrumbs && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((crumb, index) => (
            crumb.current ? (
              <Typography
                key={index}
                color="text.primary"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {crumb.icon}
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.path}
                underline="hover"
                color="inherit"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {crumb.icon}
                {crumb.label}
              </Link>
            )
          ))}
        </Breadcrumbs>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {title}
            </Typography>
            {status && (
              <Chip
                label={status}
                color={statusColor}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Box display="flex" gap={2} alignItems="center">
            {Array.isArray(actions) ? (
              actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outlined'}
                  startIcon={action.icon}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  sx={action.sx}
                >
                  {action.label}
                </Button>
              ))
            ) : (
              actions
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminPageHeader;
