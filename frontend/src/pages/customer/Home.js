import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Avatar,
  Divider,
  useTheme,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import PaidIcon from '@mui/icons-material/Paid';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { customerService } from '../../services/api';
import { apiBaseUrl } from '../../utils/apiBaseUrl';
import { useOrderManagement } from '../../hooks/useMenuOptimized';
import { useSlotHeartbeat } from '../../hooks/useSlotHeartbeat';
import CustomerBottomNav from './components/CustomerBottomNav';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80';

const CustomerHome = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tableNumber = queryParams.get('table_number') || localStorage.getItem('tableNumber');
  const uniqueId = queryParams.get('unique_id') || localStorage.getItem('customerUniqueId');
  const userId = queryParams.get('user_id') || localStorage.getItem('customerId');
  const slotNumber = queryParams.get('slot_number') || localStorage.getItem('slotNumber') || '1';
  const databaseName = localStorage.getItem('customerSelectedDatabase') || localStorage.getItem('selectedDatabase') || '';
  const rawName = localStorage.getItem('customerDisplayName') || 'Guest';
  const displayName = rawName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Guest';

  const [person, setPerson] = useState(null);

  const { userOrders, loading, currentOrder } = useOrderManagement(userId, tableNumber);

  // Keep the slot alive while the customer is on this screen, and free it
  // when the browser is closed (unless an unpaid order is open).
  const hasUnsettledOrder = useCallback(() => {
    return (userOrders || []).some(order =>
      order.table_number === parseInt(tableNumber) &&
      !['paid', 'cancelled', 'merged'].includes(order.status)
    );
  }, [userOrders, tableNumber]);

  useSlotHeartbeat(tableNumber, slotNumber, { releaseGuard: hasUnsettledOrder });

  useEffect(() => {
    if (!tableNumber || !userId) {
      navigate('/customer');
    }
  }, [tableNumber, userId, navigate]);

  // Load loyalty/visit stats for the welcome strip
  useEffect(() => {
    if (!userId) return;
    customerService.getPerson(userId)
      .then(setPerson)
      .catch(() => {});
  }, [userId]);

  const formatDate = useCallback((dateString) => {
    return moment(dateString).tz('Asia/Kolkata').format('MMM D, h:mm A');
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      pending: 'warning', accepted: 'info', rejected: 'error',
      completed: 'success', payment_requested: 'info', paid: 'success', cancelled: 'default',
    };
    return colors[status] || 'default';
  }, []);

  const getStatusLabel = useCallback((status) => {
    const labels = {
      pending: 'Waiting', accepted: 'Preparing', rejected: 'Rejected',
      completed: 'Ready', payment_requested: 'Bill Requested', paid: 'Paid', cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }, []);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Merged orders are consolidated into one bill — never shown individually
  const recentOrders = [...userOrders]
    .filter(order => order.status !== 'merged')
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 5);

  const totalSpent = userOrders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const visitCount = person?.visit_count != null ? person.visit_count : null;

  const goToMenu = useCallback(() => {
    navigate(`/customer/menu?table_number=${tableNumber}&slot_number=${slotNumber}&unique_id=${uniqueId || ''}&user_id=${userId}`);
  }, [navigate, tableNumber, slotNumber, uniqueId, userId]);

  const activeOrder = currentOrder;
  const canStartNewOrder = !activeOrder || ['pending', 'accepted', 'payment_requested'].includes(activeOrder.status);

  const dishImage = (order) => {
    const item = (order.items || []).find(i => i.status !== 'rejected') || (order.items || [])[0];
    const path = item?.dish?.image_path;
    return path ? `${apiBaseUrl}${path}` : FALLBACK_IMAGE;
  };

  const orderItemSummary = (order) => {
    const served = (order.items || []).filter(i => i.status !== 'rejected');
    if (served.length === 0) return '—';
    return served.map(i => `${i.dish?.name || 'Dish'} ×${i.quantity}`).join(', ');
  };

  return (
    <Box sx={{
      minHeight: '100dvh',
      backgroundColor: theme.palette.background.default,
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
    }}>
      {/* Top Header Area — flat rectangle: greeting + avatar + table info */}
      <Box sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: '1px solid rgba(255,165,0,0.12)',
        pt: 'calc(env(safe-area-inset-top, 0px) + 22px)',
        pb: 3,
        px: 2.5,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative soft circle behind the header */}
        <Box sx={{
          position: 'absolute', top: -40, right: -30,
          width: 150, height: 150, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,165,0,0.14) 0%, rgba(255,165,0,0) 70%)',
          pointerEvents: 'none',
        }} />

        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
              {getGreeting()}
            </Typography>
            <Typography variant="h5" fontWeight="bold" noWrap sx={{ color: theme.palette.text.primary, fontSize: { xs: '1.5rem', sm: '1.9rem' }, letterSpacing: '-0.3px' }}>
              {displayName}
            </Typography>
            <Typography variant="body2" noWrap sx={{ color: theme.palette.text.secondary, mt: 0.25, fontWeight: 500 }}>
              {databaseName || 'Welcome to Tabble'}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 48, height: 48,
              bgcolor: '#FFA500', color: '#1A1408',
              fontWeight: 800, fontSize: '1.2rem',
              border: '2px solid rgba(255,165,0,0.35)',
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mt={1.5} flexWrap="wrap">
          <Chip
            icon={<TableRestaurantIcon sx={{ fontSize: 15 }} />}
            label={`Table ${tableNumber} · Seat ${slotNumber}`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255,165,0,0.12)',
              color: '#FFA500',
              fontWeight: 700,
              borderRadius: '10px',
              '& .MuiChip-icon': { color: '#FFA500' },
            }}
          />
          {visitCount != null && visitCount > 0 && (
            <Chip
              label={`Visit #${visitCount}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,165,0,0.08)',
                color: theme.palette.text.secondary,
                fontWeight: 600,
                borderRadius: '10px',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Main Content Sheet — asymmetric overlay: only the top-left corner is
          rounded, the top-right edge runs straight across */}
      <Box sx={{ mt: -1, px: { xs: 0, sm: 2 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: '28px 0 0 0',
            backgroundColor: theme.palette.background.paper,
            minHeight: 'calc(100dvh - 190px)',
            px: { xs: 2, sm: 3 },
            pt: 2.5,
            pb: 8,
            borderTop: '1px solid rgba(255,165,0,0.12)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* ── Live order card ── */}
            {activeOrder && (
              <Box
                sx={{
                  borderRadius: '22px',
                  p: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #2A1E0A 0%, #1A1408 60%, #241A08 100%)',
                  border: '1px solid rgba(255,165,0,0.4)',
                  boxShadow: '0 10px 26px rgba(0,0,0,0.25)',
                }}
              >
                <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,165,0,0.25) 0%, rgba(255,165,0,0) 70%)', pointerEvents: 'none' }} />
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                  <Box display="flex" alignItems="center" gap={1} minWidth={0}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '14px', flexShrink: 0,
                      backgroundColor: 'rgba(255,165,0,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <LocalFireDepartmentIcon sx={{ color: '#FFA500', fontSize: 22 }} />
                    </Box>
                    <Box minWidth={0}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#FFF', lineHeight: 1.2 }}>
                        Order #{activeOrder.id} in progress
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {getStatusLabel(activeOrder.status)} — live updates on every dish
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={getStatusLabel(activeOrder.status)}
                    color={getStatusColor(activeOrder.status)}
                    size="small"
                    sx={{ fontWeight: 800, backgroundColor: '#FFA500', color: '#1A1408' }}
                  />
                </Box>

                <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', mt: 1.5 }}>
                  {orderItemSummary(activeOrder)}
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowForwardIosIcon sx={{ fontSize: 14 }} />}
                  onClick={goToMenu}
                  sx={{
                    mt: 1.5,
                    bgcolor: '#FFA500',
                    color: '#1A1408',
                    fontWeight: 800,
                    borderRadius: '14px',
                    py: 1.1,
                    '&:hover': { bgcolor: '#FFB800' },
                  }}
                >
                  Track My Order
                </Button>
              </Box>
            )}

            {/* ── Hero CTA — Create New Order ── */}
            <Box
              sx={{
                borderRadius: '22px',
                p: 2.5,
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 55%, #FF6B00 100%)',
                boxShadow: '0 12px 30px rgba(255,140,0,0.35)',
              }}
            >
              {/* Decorative shapes */}
              <Box sx={{ position: 'absolute', top: -35, right: -25, width: 130, height: 130, borderRadius: '50%', border: '22px solid rgba(255,255,255,0.14)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', border: '18px solid rgba(255,255,255,0.10)', pointerEvents: 'none' }} />

              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '16px', flexShrink: 0,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RestaurantIcon sx={{ color: '#1A1408', fontSize: 26 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight="800" sx={{ color: '#1A1408', lineHeight: 1.2 }}>
                    Hungry? Let's fix that.
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(26,20,8,0.72)', fontWeight: 600 }}>
                    Order straight from the menu — served hot at your table
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<AddCircleOutlineIcon />}
                onClick={goToMenu}
                disabled={!canStartNewOrder}
                sx={{
                  mt: 2,
                  py: 1.4,
                  borderRadius: '14px',
                  bgcolor: '#FFFFFF',
                  color: '#1A1408',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(255,255,255,0.45)',
                    color: 'rgba(26,20,8,0.4)',
                  },
                }}
              >
                Create New Order
              </Button>
            </Box>

            {/* ── Quick stats strip ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {[
                { icon: <ConfirmationNumberIcon sx={{ fontSize: 18 }} />, label: 'Orders', value: String(userOrders.length) },
                { icon: <ReceiptLongIcon sx={{ fontSize: 18 }} />, label: 'Visits', value: visitCount != null ? String(visitCount) : '—' },
                { icon: <PaidIcon sx={{ fontSize: 18 }} />, label: 'Spent', value: `₹${totalSpent.toFixed(0)}` },
              ].map(stat => (
                <Paper
                  key={stat.label}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: '16px',
                    textAlign: 'center',
                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor: theme.palette.background.default,
                  }}
                >
                  <Box sx={{ color: '#FFA500', display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="800" sx={{ color: theme.palette.text.primary, lineHeight: 1.1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* ── Recent orders ── */}
            <Box mt={0.5}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.25}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.text.primary, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                  Recent Orders
                </Typography>
                {userOrders.length > 5 && (
                  <Button size="small" endIcon={<ArrowForwardIosIcon sx={{ fontSize: 12 }} />}
                    onClick={() => navigate('/customer/history')}
                    sx={{ color: '#FFA500', fontWeight: 700, textTransform: 'none' }}>
                    Show All
                  </Button>
                )}
              </Box>

              {loading && userOrders.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={32} sx={{ color: '#FFA500' }} />
                </Box>
              ) : recentOrders.length === 0 ? (
                <Paper elevation={0} sx={{ p: 3.5, borderRadius: '20px', textAlign: 'center', border: `1px dashed ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'}`, backgroundColor: theme.palette.background.default }}>
                  <ReceiptLongIcon sx={{ fontSize: 44, color: 'rgba(255,165,0,0.4)' }} />
                  <Typography variant="body1" fontWeight="bold" mt={1} sx={{ color: theme.palette.text.primary }}>
                    No orders yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Tap “Create New Order” to get started
                  </Typography>
                </Paper>
              ) : (
                <Box display="flex" flexDirection="column" gap={1.25}>
                  {recentOrders.map(order => (
                    <Paper
                      key={order.id}
                      elevation={0}
                      onClick={() => navigate('/customer/history')}
                      sx={{
                        p: 1.25,
                        borderRadius: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)'}`,
                        backgroundColor: theme.palette.background.default,
                        transition: 'transform 0.15s ease',
                        '&:active': { transform: 'scale(0.99)' },
                      }}
                    >
                      {/* Dish thumbnail */}
                      <Box
                        component="img"
                        src={dishImage(order)}
                        alt=""
                        loading="lazy"
                        sx={{
                          width: 56, height: 56, borderRadius: '14px', flexShrink: 0,
                          objectFit: 'cover',
                          border: '1px solid rgba(255,165,0,0.15)',
                        }}
                      />

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ color: theme.palette.text.primary, fontSize: '0.92rem' }}>
                            Order #{order.id}
                          </Typography>
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status)}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, flexShrink: 0 }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.25 }}>
                          {formatDate(order.created_at)}
                        </Typography>
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mt={0.5}>
                          <Typography variant="caption" noWrap sx={{ color: theme.palette.text.secondary, flex: 1, minWidth: 0 }}>
                            {orderItemSummary(order)}
                          </Typography>
                          <Typography variant="body1" fontWeight="800" sx={{ color: '#FFA500', flexShrink: 0, fontSize: '0.9rem' }}>
                            ₹{(order.total_amount ?? 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>

            {/* Bottom hint */}
            <Box textAlign="center" mt={1}>
              <Divider sx={{ mb: 1.5, borderColor: theme.palette.divider }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                Order now · Pay at the counter when you're done
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <CustomerBottomNav active="home" />
    </Box>
  );
};

export default CustomerHome;
