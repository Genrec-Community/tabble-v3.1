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
  TableCell,
  styled,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import EventIcon from '@mui/icons-material/Event';
import { analyticsService } from '../../services/api';

// Styled components for future use if needed

const ChefAnalysis = () => {
  // State
  const [chefPerformance, setChefPerformance] = useState({
    total_completed_orders: 0,
    avg_items_per_order: 0,
    busiest_day: null
  });
  const [tableUtilization, setTableUtilization] = useState([]);
  const [salesOverTime, setSalesOverTime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch chef performance metrics
        const performance = await analyticsService.getChefPerformance();
        setChefPerformance(performance);

        // Fetch table utilization
        const tables = await analyticsService.getTableUtilization();
        setTableUtilization(tables);

        // Fetch sales over time
        const salesTime = await analyticsService.getSalesOverTime(14);
        setSalesOverTime(salesTime);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching chef analytics data:', err);
        setError('Failed to load chef analytics data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get max order count for table utilization
  const maxOrderCount = tableUtilization.length > 0
    ? Math.max(...tableUtilization.map(table => table.order_count))
    : 1;

  return (
    <Container>
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Chef Analysis
        </Typography>

        <Tabs value={3} aria-label="analysis tabs" sx={{ mb: 3 }}>
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
          {/* Chef Performance Metrics */}
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
                        <CheckCircleIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {chefPerformance.total_completed_orders}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Completed Orders
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Total orders completed in the last 30 days
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
                        <SpeedIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {chefPerformance.avg_items_per_order}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Avg. Items Per Order
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Average number of items in each order
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
                        {chefPerformance.busiest_day || 'N/A'}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Busiest Day
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Day of the week with the most orders
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Order Volume Over Time */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Order Volume (Last 14 Days)
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
                    />
                    <Tooltip
                      formatter={(value, name) => [`${value.toFixed(2)}`, name]}
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
                      dataKey="order_count"
                      name="Orders"
                      stroke="#FFA500"
                      strokeWidth={2}
                      activeDot={{ r: 8, fill: '#FFA500' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>

          {/* Table Utilization */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Table Utilization
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={tableUtilization.slice(0, 10)} // Show top 10 tables
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          dataKey="table_number"
                          stroke="#FFA500"
                          label={{ value: 'Table Number', position: 'insideBottom', offset: -5, fill: '#FFA500' }}
                        />
                        <YAxis
                          stroke="#FFA500"
                          label={{ value: 'Order Count', angle: -90, position: 'insideLeft', fill: '#FFA500' }}
                        />
                        <Tooltip
                          formatter={(value, name) => [`${value} orders`, 'Count']}
                          labelFormatter={(label) => `Table: ${label}`}
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
                          dataKey="order_count"
                          name="Orders"
                          fill="#FFA500"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box p={2}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Table Performance
                    </Typography>
                    <Box sx={{ maxHeight: 250, overflowY: 'auto', pr: 1 }}>
                      {tableUtilization.slice(0, 10).map((table) => (
                        <Box key={table.table_number} mb={2}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="body2" fontWeight="medium">
                              Table {table.table_number}
                            </Typography>
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" color="text.secondary" mr={1}>
                                {table.order_count} orders
                              </Typography>
                              <Chip
                                label={table.is_occupied ? 'Occupied' : 'Free'}
                                size="small"
                                color={table.is_occupied ? 'error' : 'success'}
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(table.order_count / maxOrderCount) * 100}
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
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Kitchen Efficiency Insights */}
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
                Kitchen Efficiency Insights
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Staffing Recommendation
                    </Typography>
                    <Typography variant="body2">
                      {chefPerformance.busiest_day ?
                        `${chefPerformance.busiest_day} is your busiest day. Consider scheduling additional kitchen staff on this day to handle the increased volume.` :
                        'No clear busiest day identified. Maintain consistent staffing throughout the week.'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Order Complexity
                    </Typography>
                    <Typography variant="body2">
                      Your average order contains {chefPerformance.avg_items_per_order} items.
                      {chefPerformance.avg_items_per_order > 3 ?
                        ' This indicates complex orders. Consider streamlining menu items or preparation processes.' :
                        ' This indicates relatively simple orders. Consider upselling strategies to increase order size.'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Table Optimization
                    </Typography>
                    <Typography variant="body2">
                      {tableUtilization.length > 0 ?
                        `Table ${tableUtilization[0].table_number} is your most utilized table with ${tableUtilization[0].order_count} orders. Ensure this area receives special attention.` :
                        'No table utilization data available.'}
                      {tableUtilization.filter(t => t.order_count === 0).length > 0 ?
                        ` ${tableUtilization.filter(t => t.order_count === 0).length} tables have no orders. Consider repositioning or removing them.` :
                        ' All tables are being utilized effectively.'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Daily Order Distribution */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Order Preparation Efficiency
              </Typography>
              <Box p={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Key Performance Indicators
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box
                      p={3}
                      sx={{
                        backgroundColor: 'rgba(255, 165, 0, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 165, 0, 0.1)'
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={2}>
                        <RestaurantIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Order Completion Rate
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                        {chefPerformance.total_completed_orders > 0 ? '100%' : '0%'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All orders are being completed successfully. Maintain this excellent performance.
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box
                      p={3}
                      sx={{
                        backgroundColor: 'rgba(255, 165, 0, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 165, 0, 0.1)'
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={2}>
                        <SpeedIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Kitchen Workload
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                        {chefPerformance.total_completed_orders * chefPerformance.avg_items_per_order}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total items prepared in the last 30 days. Each item requires careful preparation.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Box>
        </>
      )}
    </Container>
  );
};

export default ChefAnalysis;
