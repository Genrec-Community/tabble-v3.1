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
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
  Chip,
  Avatar
} from '@mui/material';
import {
  BarChart,
  Bar,
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
import PeopleIcon from '@mui/icons-material/People';
import RepeatIcon from '@mui/icons-material/Repeat';
import EventIcon from '@mui/icons-material/Event';
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
const COLORS = ['#FFA500', '#E69500', '#FFB733', '#FFCB66', '#FFD480'];

const CustomerAnalysis = () => {
  // State
  const [topCustomers, setTopCustomers] = useState([]);
  const [customerFrequency, setCustomerFrequency] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch top customers
        const customers = await analyticsService.getTopCustomers(10);
        setTopCustomers(customers);

        // Fetch customer frequency
        const frequency = await analyticsService.getCustomerFrequency();
        setCustomerFrequency(frequency);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching customer analytics data:', err);
        setError('Failed to load customer analytics data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Container>
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Customer Analysis
        </Typography>

        <Tabs value={1} aria-label="analysis tabs" sx={{ mb: 3 }}>
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
          {/* Customer Frequency Analysis */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Customer Visit Frequency
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={customerFrequency}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          dataKey="frequency"
                          stroke="#FFA500"
                        />
                        <YAxis
                          stroke="#FFA500"
                        />
                        <Tooltip
                          formatter={(value, name) => [`${value} customers`, 'Count']}
                          labelFormatter={(label) => `Visit Frequency: ${label}`}
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
                        <Bar
                          dataKey="customer_count"
                          name="Number of Customers"
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
                          data={customerFrequency}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="customer_count"
                          nameKey="frequency"
                          label={({ name, percent }) =>
                            percent > 5 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                          }
                          labelStyle={{
                            fill: '#333',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {customerFrequency.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} customers`, 'Count']}
                          labelFormatter={(label) => `Visit Frequency: ${label}`}
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
            </Paper>
          </Box>

          {/* Customer Insights */}
          <Box mb={6}>
            <Grid container spacing={3}>
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
                        <PeopleIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {topCustomers.length > 0 ? topCustomers.length : 0}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Top Customers
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        These customers generate the most revenue for your hotel
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

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
                        <RepeatIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {topCustomers.length > 0 ? Math.max(...topCustomers.map(c => c.visit_count)) : 0}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Highest Visit Count
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Maximum number of visits by a single customer
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

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
                        <EventIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {topCustomers.length > 0 ?
                          (topCustomers.reduce((sum, customer) => sum + customer.order_count, 0) / topCustomers.length).toFixed(1) :
                          0
                        }
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Avg. Orders per Customer
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Average number of orders placed by top customers
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Top Customers Table */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top Customers by Revenue
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Customer</StyledTableCell>
                      <StyledTableCell align="center">Visit Count</StyledTableCell>
                      <StyledTableCell align="center">Last Visit</StyledTableCell>
                      <StyledTableCell align="center">Orders</StyledTableCell>
                      <StyledTableCell align="right">Total Spent</StyledTableCell>
                      <StyledTableCell align="right">Avg. Order Value</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCustomers.map((customer) => (
                      <StyledTableRow key={customer.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                width: 32,
                                height: 32,
                                mr: 1.5,
                                fontSize: '0.9rem'
                              }}
                            >
                              {customer.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {customer.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={customer.visit_count}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255, 165, 0, 0.1)',
                              color: 'primary.main',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">{formatDate(customer.last_visit)}</TableCell>
                        <TableCell align="center">{customer.order_count}</TableCell>
                        <TableCell align="right">₹{customer.total_spent}</TableCell>
                        <TableCell align="right">₹{customer.avg_order_value}</TableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* Customer Insights */}
          <Box mb={6}>
            <Paper
              sx={{
                p: 4,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                backgroundColor: 'rgba(255, 165, 0, 0.05)',
                border: '1px solid rgba(255, 165, 0, 0.2)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Customer Insights & Recommendations
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Loyalty Program Impact
                    </Typography>
                    <Typography variant="body2">
                      Your top customers visit an average of {topCustomers.length > 0 ?
                        (topCustomers.reduce((sum, customer) => sum + customer.visit_count, 0) / topCustomers.length).toFixed(1) :
                        0} times. Consider enhancing your loyalty program to increase this number.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Customer Retention
                    </Typography>
                    <Typography variant="body2">
                      {customerFrequency.length > 0 && customerFrequency[0].customer_count > 0 ?
                        `${customerFrequency[0].customer_count} customers (${Math.round(customerFrequency[0].customer_count / customerFrequency.reduce((sum, freq) => sum + freq.customer_count, 0) * 100)}%) have only visited once.` :
                        'No one-time customers found.'} Focus on converting these one-time visitors into repeat customers.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      VIP Treatment
                    </Typography>
                    <Typography variant="body2">
                      Your top 3 customers have spent a combined ₹{topCustomers.slice(0, 3).reduce((sum, customer) => sum + customer.total_spent, 0).toFixed(2)}.
                      Consider offering personalized experiences to these VIP guests.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </>
      )}
    </Container>
  );
};

export default CustomerAnalysis;
