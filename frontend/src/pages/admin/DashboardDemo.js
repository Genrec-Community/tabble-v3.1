import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Badge,
  Button,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaidIcon from '@mui/icons-material/Paid';
import TodayIcon from '@mui/icons-material/Today';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckIcon from '@mui/icons-material/Check';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AdminPageHeader from '../../components/AdminPageHeader';

const DashboardDemo = () => {
  // Mock data for demonstration
  const stats = {
    total_orders_today: 24,
    pending_orders_today: 8,
    completed_orders_today: 16,
    paid_orders_today: 12,
    total_orders: 150
  };

  const filteredCompletedOrders = [
    { id: 1, table_number: 5, items: ['Pasta', 'Pizza'], total: 850 },
    { id: 2, table_number: 3, items: ['Burger', 'Fries'], total: 650 },
    { id: 3, table_number: 8, items: ['Salad', 'Soup'], total: 450 }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Monitor and manage your restaurant operations"
        actions={[
          {
            label: 'Refresh Data',
            icon: <RefreshIcon />,
            onClick: () => console.log('Refresh clicked'),
            variant: 'outlined'
          }
        ]}
      />

      {/* Today's Statistics */}
      <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
        <TodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Today's Statistics
      </Typography>
      
      <Grid container spacing={3} mb={5}>
        {/* Total Orders Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              borderTop: '4px solid',
              borderColor: 'primary.main',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.05) 0%, rgba(255, 165, 0, 0.02) 100%)',
              border: '1px solid rgba(255, 165, 0, 0.2)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(255, 165, 0, 0.3)',
                background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%)',
              },
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Box sx={{
                  color: '#FFA500',
                  mb: 2,
                  p: 2,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 165, 0, 0.15)',
                  border: '2px solid rgba(255, 165, 0, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, rgba(255, 165, 0, 0.2), rgba(255, 165, 0, 0.1))',
                    zIndex: -1,
                  }
                }}>
                  <ReceiptIcon sx={{ fontSize: 48, filter: 'drop-shadow(0 2px 4px rgba(255, 165, 0, 0.3))' }} />
                </Box>
                <Typography variant="h3" component="div" fontWeight="bold" color="#FFA500" sx={{ 
                  textShadow: '0 2px 4px rgba(255, 165, 0, 0.3)',
                  mb: 1
                }}>
                  {stats.total_orders_today}
                </Typography>
                <Typography variant="h6" component="div" color="text.primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Total Orders Today
                </Typography>
                <Box display="flex" alignItems="center" mt={1} sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: '12px',
                  px: 1.5,
                  py: 0.5,
                  border: '1px solid rgba(76, 175, 80, 0.3)'
                }}>
                  <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    +{((stats.total_orders_today / Math.max(stats.total_orders, 1)) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Orders Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              borderTop: '4px solid',
              borderColor: 'warning.main',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.02) 100%)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(255, 152, 0, 0.3)',
                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 152, 0, 0.04) 100%)',
              },
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Box sx={{
                  color: '#FF9800',
                  mb: 2,
                  p: 2,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 152, 0, 0.15)',
                  border: '2px solid rgba(255, 152, 0, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1))',
                    zIndex: -1,
                  }
                }}>
                  <PendingIcon sx={{ fontSize: 48, filter: 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.3))' }} />
                  {stats.pending_orders_today > 0 && (
                    <Badge
                      badgeContent={stats.pending_orders_today}
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        right: -12,
                        '& .MuiBadge-badge': {
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          animation: stats.pending_orders_today > 5 ? 'pulse 2s infinite' : 'none',
                        }
                      }}
                    />
                  )}
                </Box>
                <Typography variant="h3" component="div" fontWeight="bold" color="#FF9800" sx={{ 
                  textShadow: '0 2px 4px rgba(255, 152, 0, 0.3)',
                  mb: 1
                }}>
                  {stats.pending_orders_today}
                </Typography>
                <Typography variant="h6" component="div" color="text.primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Pending Today
                </Typography>
                {stats.pending_orders_today > 0 && (
                  <Box display="flex" alignItems="center" mt={1} sx={{
                    backgroundColor: stats.pending_orders_today > 5 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                    borderRadius: '12px',
                    px: 1.5,
                    py: 0.5,
                    border: stats.pending_orders_today > 5 ? '1px solid rgba(244, 67, 54, 0.3)' : '1px solid rgba(255, 152, 0, 0.3)'
                  }}>
                    <AccessTimeIcon fontSize="small" color={stats.pending_orders_today > 5 ? "error" : "warning"} sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color={stats.pending_orders_today > 5 ? "error.main" : "warning.main"} fontWeight="bold">
                      {stats.pending_orders_today > 5 ? 'Urgent!' : 'Needs Attention'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Orders Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              borderTop: '4px solid',
              borderColor: 'success.main',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 100%)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(76, 175, 80, 0.3)',
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.04) 100%)',
              },
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Box sx={{
                  color: '#4CAF50',
                  mb: 2,
                  p: 2,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(76, 175, 80, 0.15)',
                  border: '2px solid rgba(76, 175, 80, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))',
                    zIndex: -1,
                  }
                }}>
                  <CheckCircleIcon sx={{ fontSize: 48, filter: 'drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3))' }} />
                </Box>
                <Typography variant="h3" component="div" fontWeight="bold" color="#4CAF50" sx={{ 
                  textShadow: '0 2px 4px rgba(76, 175, 80, 0.3)',
                  mb: 1
                }}>
                  {stats.completed_orders_today}
                </Typography>
                <Typography variant="h6" component="div" color="text.primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Completed Today
                </Typography>
                <Box display="flex" alignItems="center" mt={1} sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: '12px',
                  px: 1.5,
                  py: 0.5,
                  border: '1px solid rgba(76, 175, 80, 0.3)'
                }}>
                  <CheckIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    Ready for Billing
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              borderTop: '4px solid',
              borderColor: '#9C27B0',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(156, 39, 176, 0.02) 100%)',
              border: '1px solid rgba(156, 39, 176, 0.2)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(156, 39, 176, 0.3)',
                background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.04) 100%)',
              },
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Box sx={{
                  color: '#9C27B0',
                  mb: 2,
                  p: 2,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(156, 39, 176, 0.15)',
                  border: '2px solid rgba(156, 39, 176, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, rgba(156, 39, 176, 0.2), rgba(156, 39, 176, 0.1))',
                    zIndex: -1,
                  }
                }}>
                  <PaidIcon sx={{ fontSize: 48, filter: 'drop-shadow(0 2px 4px rgba(156, 39, 176, 0.3))' }} />
                </Box>
                <Typography variant="h3" component="div" fontWeight="bold" color="#9C27B0" sx={{ 
                  textShadow: '0 2px 4px rgba(156, 39, 176, 0.3)',
                  mb: 1
                }}>
                  ₹{(stats.paid_orders_today * 450).toLocaleString()}
                </Typography>
                <Typography variant="h6" component="div" color="text.primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Revenue Today
                </Typography>
                <Box display="flex" alignItems="center" mt={1} sx={{
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  borderRadius: '12px',
                  px: 1.5,
                  py: 0.5,
                  border: '1px solid rgba(156, 39, 176, 0.3)'
                }}>
                  <AccountBalanceWalletIcon fontSize="small" sx={{ color: '#9C27B0', mr: 0.5 }} />
                  <Typography variant="body2" sx={{ color: '#9C27B0' }} fontWeight="bold">
                    {stats.paid_orders_today} Orders Paid
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Billing Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 3, 
          backgroundColor: 'background.paper',
          border: '2px solid rgba(255, 165, 0, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.02) 0%, rgba(255, 165, 0, 0.01) 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #FFA500, #FFB733)',
            borderRadius: '3px 3px 0 0',
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{
              p: 1.5,
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
            }}>
              <ReceiptIcon sx={{ color: '#FFA500', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
                Completed Orders for Billing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready for payment processing
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '12px',
              px: 2,
              py: 1,
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              <Badge badgeContent={filteredCompletedOrders.length} color="success">
                <PaidIcon sx={{ color: '#4CAF50' }} />
              </Badge>
              <Typography variant="body2" color="success.main" fontWeight="bold">
                {filteredCompletedOrders.length} Ready
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              size="small"
              sx={{
                borderColor: 'rgba(255, 165, 0, 0.3)',
                color: '#FFA500',
                '&:hover': {
                  borderColor: '#FFA500',
                  backgroundColor: 'rgba(255, 165, 0, 0.05)',
                }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Search and Filter */}
        <Box mb={3} display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search completed orders..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select label="Payment Status" defaultValue="">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ReceiptIcon />
            Demo: {filteredCompletedOrders.length} completed orders ready for billing processing.
          </Box>
        </Alert>
      </Paper>
    </Container>
  );
};

export default DashboardDemo;
