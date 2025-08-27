import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  Container,
  Collapse,
  Alert,
  Button
} from '@mui/material';
import DatabaseSelector from './DatabaseSelector';
import FoodBankIcon from '@mui/icons-material/FoodBank';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import DiscountIcon from '@mui/icons-material/Discount';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

// Sidebar width
const drawerWidth = 280;

const AdminLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  // Start with sidebar closed by default
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [offersOpen, setOffersOpen] = useState(false);
  const [showDatabaseSelector, setShowDatabaseSelector] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [currentDatabase, setCurrentDatabase] = useState('');

  // Format database name: remove .db extension and capitalize first letter
  const formatDatabaseName = (dbName) => {
    if (!dbName) return '';
    // Remove .db extension if present
    const nameWithoutExtension = dbName.replace(/\.db$/, '');
    // Capitalize first letter
    return nameWithoutExtension.charAt(0).toUpperCase() + nameWithoutExtension.slice(1);
  };

  // Check database connection on component mount
  useEffect(() => {
    // Skip database check for demo route
    if (location.pathname === '/admin/demo') {
      setDatabaseConnected(true);
      setCurrentDatabase('demo.db');
      return;
    }

    const checkDatabaseConnection = async () => {
      const selectedDatabase = localStorage.getItem('adminSelectedDatabase');
      const databasePassword = localStorage.getItem('adminDatabasePassword');

      if (selectedDatabase && databasePassword) {
        try {
          // Import adminService here to avoid circular imports
          const { adminService } = await import('../services/api');

          // Temporarily set the credentials for verification
          localStorage.setItem('selectedDatabase', selectedDatabase);
          localStorage.setItem('databasePassword', databasePassword);

          await adminService.getCurrentDatabase();
          setDatabaseConnected(true);
          setCurrentDatabase(selectedDatabase);
          console.log('Admin: Database connection verified');
        } catch (error) {
          console.error('Admin: Database verification failed:', error);
          // Clear invalid credentials
          localStorage.removeItem('adminSelectedDatabase');
          localStorage.removeItem('adminDatabasePassword');
          localStorage.removeItem('selectedDatabase');
          localStorage.removeItem('databasePassword');
          setShowDatabaseSelector(true);
        }
      } else {
        setShowDatabaseSelector(true);
      }
    };

    checkDatabaseConnection();
  }, [location.pathname]);

  const handleDatabaseSuccess = (databaseName) => {
    // Store admin-specific database credentials
    const selectedDatabase = localStorage.getItem('selectedDatabase');
    const databasePassword = localStorage.getItem('databasePassword');

    localStorage.setItem('adminSelectedDatabase', selectedDatabase);
    localStorage.setItem('adminDatabasePassword', databasePassword);

    setCurrentDatabase(databaseName);
    setDatabaseConnected(true);
    setShowDatabaseSelector(false);
  };

  const handleSwitchDatabase = () => {
    // Clear current database connection
    localStorage.removeItem('adminSelectedDatabase');
    localStorage.removeItem('adminDatabasePassword');
    localStorage.removeItem('selectedDatabase');
    localStorage.removeItem('databasePassword');
    setDatabaseConnected(false);
    setCurrentDatabase('');
    setShowDatabaseSelector(true);
  };

  // Toggle drawer
  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // Check if the current route matches
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Menu items
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin'
    },
    {
      text: 'Menu Management',
      icon: <RestaurantMenuIcon />,
      submenu: [
        {
          text: 'Manage Dishes',
          icon: <RestaurantMenuIcon />,
          path: '/admin/dishes'
        },
        {
          text: 'Manage Offers',
          icon: <LocalOfferIcon />,
          path: '/admin/offers'
        },
        {
          text: 'Today\'s Special',
          icon: <StarIcon />,
          path: '/admin/specials'
        }
      ]
    },
    {
      text: 'Offers & Loyalty',
      icon: <DiscountIcon />,
      submenu: [
        {
          text: 'Loyalty Program',
          icon: <CardMembershipIcon />,
          path: '/admin/loyalty'
        },
        {
          text: 'Selection Offers',
          icon: <DiscountIcon />,
          path: '/admin/selection-offers'
        }
      ]
    },
    {
      text: 'Completed Orders',
      icon: <ReceiptIcon />,
      path: '/admin/completed-orders'
    },
    {
      text: 'Table Management',
      icon: <TableRestaurantIcon />,
      path: '/admin/tables'
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analysis'
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/admin/settings'
    }
  ];

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;

    // Find the matching menu item
    for (const item of menuItems) {
      if (item.path === currentPath) {
        return item.text;
      }

      // Check submenu items
      if (item.submenu) {
        for (const subItem of item.submenu) {
          if (subItem.path === currentPath) {
            return subItem.text;
          }
        }
      }
    }

    // Default title
    return "Admin Portal";
  };

  // Drawer content
  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2
      }}>
        <FoodBankIcon sx={{ fontSize: 32, mr: 1.5, color: theme.palette.primary.main }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#FFFFFF' }}>
          TABBLE ADMIN
        </Typography>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255, 165, 0, 0.2)' }} />
      <List component="nav" sx={{ px: 1 }}>
        {menuItems.map((item, index) => (
          item.submenu ? (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (item.text === 'Menu Management') {
                      setMenuOpen(!menuOpen);
                    } else if (item.text === 'Offers & Loyalty') {
                      setOffersOpen(!offersOpen);
                    }
                  }}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: 'medium',
                      color: '#FFFFFF'
                    }}
                  />
                  {item.text === 'Menu Management' ?
                    (menuOpen ? <ExpandLess sx={{ color: '#FFFFFF' }} /> : <ExpandMore sx={{ color: '#FFFFFF' }} />) :
                    (offersOpen ? <ExpandLess sx={{ color: '#FFFFFF' }} /> : <ExpandMore sx={{ color: '#FFFFFF' }} />)
                  }
                </ListItemButton>
              </ListItem>
              <Collapse
                in={item.text === 'Menu Management' ? menuOpen : offersOpen}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {item.submenu.map((subItem, subIndex) => (
                    <ListItem key={subIndex} disablePadding>
                      <ListItemButton
                        component={RouterLink}
                        to={subItem.path}
                        selected={isActive(subItem.path)}
                        sx={{
                          pl: 4,
                          borderRadius: '8px',
                          mb: 0.5,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(255, 165, 0, 0.2)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 165, 0, 0.3)',
                            }
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                          }
                        }}
                      >
                        <ListItemIcon sx={{
                          color: isActive(subItem.path) ?
                            theme.palette.primary.main :
                            'rgba(255, 255, 255, 0.7)'
                        }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={subItem.text}
                          primaryTypographyProps={{
                            fontWeight: isActive(subItem.path) ? 'bold' : 'medium',
                            color: isActive(subItem.path) ?
                              '#FFFFFF' :
                              'rgba(255, 255, 255, 0.7)'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ) : (
            <ListItem key={index} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 165, 0, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 165, 0, 0.3)',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                  }
                }}
              >
                <ListItemIcon sx={{
                  color: isActive(item.path) ?
                    theme.palette.primary.main :
                    'rgba(255, 255, 255, 0.7)'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 'bold' : 'medium',
                    color: isActive(item.path) ?
                      '#FFFFFF' :
                      'rgba(255, 255, 255, 0.7)'
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
      <Divider sx={{ backgroundColor: 'rgba(255, 165, 0, 0.2)', mt: 2 }} />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          &copy; {new Date().getFullYear()} Tabble
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#000000',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
          width: '100%',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label={open ? "close drawer" : "open drawer"}
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              color: 'primary.main',
              backgroundColor: 'rgba(255, 165, 0, 0.08)',
              transition: 'transform 0.3s',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              '&:hover': {
                backgroundColor: 'rgba(255, 165, 0, 0.15)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{
            flexGrow: 1,
            minWidth: 0, // Allow text to shrink
            mr: 2 // Add margin to prevent overlap
          }}>
            {getCurrentPageTitle()}
          </Typography>

          
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          display: { xs: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#121212',
            borderRight: '1px solid rgba(255, 165, 0, 0.2)',
            mt: '64px', // Height of AppBar
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          transition: theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: '64px', // Height of AppBar
          pl: { xs: 3, sm: open ? 4 : 3 }, // Add extra padding when sidebar is open
        }}
      >
        <Container maxWidth="xl">
          {!databaseConnected ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center'
            }}>
              <Alert severity="info" sx={{ mb: 3, maxWidth: 600 }}>
                <Typography variant="h6" gutterBottom>
                  Welcome to Admin Portal
                </Typography>
                <Typography variant="body1">
                  Please select your hotel database to access the admin features.
                  Each hotel has its own independent database for managing orders, dishes, and settings.
                </Typography>
              </Alert>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowDatabaseSelector(true)}
                sx={{ mb: 2 }}
              >
                Select Database
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/"
              >
                Go to Home Page
              </Button>
            </Box>
          ) : (
            <Outlet />
          )}
        </Container>

        {/* Database Selector Dialog */}
        <DatabaseSelector
          open={showDatabaseSelector}
          onSuccess={handleDatabaseSuccess}
          title="Admin Database Selection"
        />
      </Box>
    </Box>
  );
};

export default AdminLayout;
