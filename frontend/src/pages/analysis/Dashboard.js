import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
  TextField,
  Rating,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PersonIcon from '@mui/icons-material/Person';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FeedbackIcon from '@mui/icons-material/Feedback';
import StarIcon from '@mui/icons-material/Star';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RefreshIcon from '@mui/icons-material/Refresh';
import { analyticsService } from '../../services/api';

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.common.white,
  fontWeight: 'bold',
  fontSize: '0.9rem'
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

// Custom colors for charts
const COLORS = ['#FFA500', '#E69500', '#FFB733', '#FFCB66', '#FFD480', '#FFE0A3'];

const AnalysisDashboard = () => {
  // State
  const [dashboardStats, setDashboardStats] = useState({
    total_sales: 0,
    total_customers: 0,
    total_orders: 0,
    total_dishes: 0,
    avg_order_value: 0
  });
  const [topCustomers, setTopCustomers] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [salesOverTime, setSalesOverTime] = useState([]);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState({
    total_feedback: 0,
    average_rating: 0,
    rating_counts: {},
    rating_percentages: {},
    recent_comments: []
  });
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Format dates for API
      const formattedStartDate = startDateStr ? new Date(startDateStr).toISOString() : null;
      const formattedEndDate = endDateStr ? new Date(endDateStr).toISOString() : null;

      // Fetch dashboard stats
      const stats = await analyticsService.getDashboardStats(formattedStartDate, formattedEndDate);
      setDashboardStats(stats);

      // Fetch top customers
      const customers = await analyticsService.getTopCustomers(5, formattedStartDate, formattedEndDate);
      setTopCustomers(customers);

      // Fetch top dishes
      const dishes = await analyticsService.getTopDishes(5, formattedStartDate, formattedEndDate);
      setTopDishes(dishes);

      // Fetch sales by category
      const categorySales = await analyticsService.getSalesByCategory(formattedStartDate, formattedEndDate);
      setSalesByCategory(categorySales);

      // Fetch sales over time
      const salesTime = await analyticsService.getSalesOverTime(14, formattedStartDate, formattedEndDate);
      setSalesOverTime(salesTime);

      // Fetch feedback analysis
      const feedback = await analyticsService.getFeedbackAnalysis(formattedStartDate, formattedEndDate);
      setFeedbackAnalysis(feedback);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
      setLoading(false);
    }
  };

  // Handle date changes
  const handleStartDateChange = (e) => {
    setStartDateStr(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDateStr(e.target.value);
  };

  // Reset date filters
  const handleResetDateFilters = () => {
    setStartDateStr('');
    setEndDateStr('');
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Container>
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Analytics Dashboard
        </Typography>

        <Tabs value={0} aria-label="analysis tabs" sx={{ mb: 3 }}>
          <Tab
            label="Overview"
            component={RouterLink}
            to="/analysis"
            sx={{ fontWeight: 'medium' }}
          />
          <Tab
            label="Customer Analysis"
            component={RouterLink}
            to="/analysis/customer"
            sx={{ fontWeight: 'medium' }}
          />
          <Tab
            label="Dish Analysis"
            component={RouterLink}
            to="/analysis/dish"
            sx={{ fontWeight: 'medium' }}
          />
          <Tab
            label="Chef Analysis"
            component={RouterLink}
            to="/analysis/chef"
            sx={{ fontWeight: 'medium' }}
          />
        </Tabs>

        {/* Date Range Selector */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Box display="flex" alignItems="center" flexWrap="wrap">
            <Box display="flex" alignItems="center" mr={2}>
              <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Date Range Filter
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexGrow: 1, my: { xs: 2, sm: 0 } }}>
              <TextField
                label="Start Date"
                type="date"
                value={startDateStr}
                onChange={handleStartDateChange}
                size="small"
                sx={{ minWidth: 150 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDateStr}
                onChange={handleEndDateChange}
                size="small"
                sx={{ minWidth: 150 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Stack>

            <Box ml={{ xs: 0, sm: 2 }} mt={{ xs: 2, sm: 0 }} display="flex">
              <Button
                variant="outlined"
                color="primary"
                onClick={handleResetDateFilters}
                startIcon={<RefreshIcon />}
                size="small"
                sx={{ mr: 1 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={fetchData}
                size="small"
              >
                Apply
              </Button>
            </Box>
          </Box>

          {(startDateStr || endDateStr) && (
            <Box mt={2} p={1} bgcolor="rgba(255, 165, 0, 0.1)" borderRadius={1}>
              <Typography variant="body2" color="primary.main">
                <strong>Active Filter:</strong> {startDateStr ? new Date(startDateStr).toLocaleDateString() : 'All time'}
                {' '} to {' '}
                {endDateStr ? new Date(endDateStr).toLocaleDateString() : 'Present'}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Key Metrics */}
          <Box mb={6}>
            <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
              Key Performance Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: '4px solid',
                    borderColor: 'primary.main',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                      <Box sx={{ color: 'primary.main', mb: 2 }}>
                        <AttachMoneyIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        ₹{dashboardStats.total_sales}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Total Sales
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: '4px solid',
                    borderColor: 'primary.main',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                      <Box sx={{ color: 'primary.main', mb: 2 }}>
                        <PersonIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {dashboardStats.total_customers}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Total Customers
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: '4px solid',
                    borderColor: 'primary.main',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                      <Box sx={{ color: 'primary.main', mb: 2 }}>
                        <RestaurantIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {dashboardStats.total_orders}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Total Orders
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: '4px solid',
                    borderColor: 'primary.main',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                      <Box sx={{ color: 'primary.main', mb: 2 }}>
                        <TrendingUpIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        ₹{dashboardStats.avg_order_value}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Avg. Order Value
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Sales Over Time Chart */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Sales Trend (Last 14 Days)
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesOverTime}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#FFA500"
                    />
                    <YAxis
                      stroke="#FFA500"
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [`₹${value.toFixed(2)}`, 'Sales']}
                      labelFormatter={(label) => `Date: ${formatDate(label)}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid #FFA500',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: '#333',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      itemStyle={{ color: '#333' }}
                      labelStyle={{ color: '#FFA500', fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total_sales"
                      name="Sales"
                      stroke="#FFA500"
                      strokeWidth={2}
                      activeDot={{ r: 8, fill: '#FFA500' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>

          {/* Top Customers and Top Dishes */}
          <Grid container spacing={4} mb={6}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top Customers
                </Typography>
                <TableContainer
                  sx={{
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 165, 0, 0.2)',
                    overflow: 'hidden',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Customer</StyledTableCell>
                        <StyledTableCell align="right">Orders</StyledTableCell>
                        <StyledTableCell align="right">Total Spent</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCustomers.map((customer) => (
                        <StyledTableRow key={customer.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                              {customer.username}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{customer.order_count}</TableCell>
                          <TableCell align="right">₹{customer.total_spent}</TableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box mt={2} textAlign="right">
                  <Button
                    component={RouterLink}
                    to="/analysis/customer"
                    color="primary"
                    size="small"
                  >
                    View All Customers
                  </Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top Selling Dishes
                </Typography>
                <TableContainer
                  sx={{
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 165, 0, 0.2)',
                    overflow: 'hidden',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Dish</StyledTableCell>
                        <StyledTableCell align="right">Quantity Sold</StyledTableCell>
                        <StyledTableCell align="right">Revenue</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topDishes.map((dish) => (
                        <StyledTableRow key={dish.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <RestaurantIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                              {dish.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{dish.total_ordered}</TableCell>
                          <TableCell align="right">₹{dish.total_revenue}</TableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box mt={2} textAlign="right">
                  <Button
                    component={RouterLink}
                    to="/analysis/dish"
                    color="primary"
                    size="small"
                  >
                    View All Dishes
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Sales by Category */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Sales by Category
              </Typography>
              {salesByCategory.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={8}
                  sx={{ color: 'text.secondary' }}
                >
                  <RestaurantIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No Category Data Available
                  </Typography>
                  <Typography variant="body2">
                    Start taking orders to see category performance analytics
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesByCategory}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          dataKey="category"
                          stroke="#FFA500"
                        />
                        <YAxis
                          stroke="#FFA500"
                          tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                          formatter={(value) => [`₹${value}`, 'Revenue']}
                          contentStyle={{ backgroundColor: '#121212', border: '1px solid #FFA500' }}
                        />
                        <Legend />
                        <Bar
                          dataKey="total_revenue"
                          name="Revenue"
                          fill="#FFA500"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box height={300} display="flex" justifyContent="center" alignItems="center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="total_revenue"
                          nameKey="category"
                          label={({ name, percent }) =>
                            percent > 5 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                          }
                          labelStyle={{
                            fill: '#333',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`₹${value.toFixed(2)}`, 'Revenue']}
                          labelFormatter={(label) => `Category: ${label}`}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #FFA500',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            color: '#333',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                          itemStyle={{ color: '#333' }}
                          labelStyle={{ color: '#FFA500', fontWeight: 'bold' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: '12px',
                            color: '#666'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
              )}
            </Paper>
          </Box>

          {/* Feedback Analysis */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Customer Feedback Analysis
              </Typography>

              <Grid container spacing={3}>
                {/* Feedback Overview */}
                <Grid item xs={12} md={4}>
                  <Card
                    sx={{
                      height: '100%',
                      borderTop: '4px solid',
                      borderColor: 'primary.main',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                        <Box sx={{ color: 'primary.main', mb: 2 }}>
                          <FeedbackIcon sx={{ fontSize: 48 }} />
                        </Box>
                        <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                          {feedbackAnalysis.total_feedback}
                        </Typography>
                        <Typography variant="h6" component="div" color="text.secondary">
                          Total Feedback
                        </Typography>
                        <Box mt={2} display="flex" alignItems="center" justifyContent="center">
                          <Rating
                            value={feedbackAnalysis.average_rating}
                            precision={0.1}
                            readOnly
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="h5" fontWeight="bold" color="primary.main">
                            {feedbackAnalysis.average_rating.toFixed(1)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Average Rating
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Rating Distribution */}
                <Grid item xs={12} md={8}>
                  <Box p={2} height="100%">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Rating Distribution
                    </Typography>

                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Box key={rating} mb={1.5}>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <Box display="flex" alignItems="center" width={50}>
                            <Typography variant="body2" fontWeight="medium" mr={0.5}>
                              {rating}
                            </Typography>
                            <StarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          </Box>
                          <Typography variant="body2" color="text.secondary" width={40} textAlign="right">
                            {feedbackAnalysis.rating_counts[rating] || 0}
                          </Typography>
                          <Box flexGrow={1} mx={2}>
                            <LinearProgress
                              variant="determinate"
                              value={feedbackAnalysis.rating_percentages[rating] || 0}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#FFA500',
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight="medium" width={40}>
                            {feedbackAnalysis.rating_percentages[rating] ? `${feedbackAnalysis.rating_percentages[rating]}%` : '0%'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                {/* Recent Comments */}
                {feedbackAnalysis.recent_comments && feedbackAnalysis.recent_comments.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Recent Customer Comments
                    </Typography>
                    <Grid container spacing={2}>
                      {feedbackAnalysis.recent_comments.slice(0, 3).map((feedback) => (
                        <Grid item xs={12} md={4} key={feedback.id}>
                          <Box
                            p={2}
                            sx={{
                              backgroundColor: 'rgba(255, 165, 0, 0.05)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 165, 0, 0.1)',
                              height: '100%'
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {feedback.username}
                              </Typography>
                              <Rating value={feedback.rating} readOnly size="small" />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              "{feedback.comment}"
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="right">
                              {new Date(feedback.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Box>

          {/* Call to Action */}
          <Box textAlign="center" mb={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                backgroundColor: 'rgba(255, 165, 0, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 165, 0, 0.2)'
              }}
            >
              <AnalyticsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Explore Detailed Analytics
              </Typography>
              <Typography variant="body1" paragraph sx={{ maxWidth: '600px', mx: 'auto', mb: 3 }}>
                Dive deeper into your hotel's performance with our detailed analytics pages.
                Understand customer behavior, dish popularity, and chef performance.
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/analysis/customer"
                    sx={{ px: 3 }}
                  >
                    Customer Analysis
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={RouterLink}
                    to="/analysis/dish"
                    sx={{ px: 3 }}
                  >
                    Dish Analysis
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={RouterLink}
                    to="/analysis/chef"
                    sx={{ px: 3 }}
                  >
                    Chef Analysis
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </>
      )}
    </Container>
  );
};

export default AnalysisDashboard;
