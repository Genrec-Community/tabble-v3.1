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
  Avatar,
  Rating
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
import RestaurantIcon from '@mui/icons-material/Restaurant';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';
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
const COLORS = ['#FFA500', '#E69500', '#FFB733', '#FFCB66', '#FFD480', '#FFE0A3', '#FFEBC0'];

const DishAnalysis = () => {
  // State
  const [topDishes, setTopDishes] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch top dishes
        const dishes = await analyticsService.getTopDishes(15);
        setTopDishes(dishes);

        // Fetch sales by category
        const categorySales = await analyticsService.getSalesByCategory();
        setSalesByCategory(categorySales);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dish analytics data:', err);
        setError('Failed to load dish analytics data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total revenue
  const totalRevenue = salesByCategory.reduce((sum, category) => sum + category.total_revenue, 0);

  return (
    <Container>
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Dish Analysis
        </Typography>

        <Tabs value={2} aria-label="analysis tabs" sx={{ mb: 3 }}>
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
          {/* Dish Insights */}
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
                        <RestaurantMenuIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {topDishes.length}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Top Selling Dishes
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        These dishes generate the most revenue for your hotel
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
                        <CategoryIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        {salesByCategory.length}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Menu Categories
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Number of different dish categories on your menu
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
                        <TrendingUpIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.dark">
                        ₹{totalRevenue.toFixed(2)}
                      </Typography>
                      <Typography variant="h6" component="div" color="text.secondary">
                        Total Revenue
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Total revenue generated from all dishes
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Sales by Category */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Sales by Category
              </Typography>
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

              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Category Performance
                </Typography>
                <Grid container spacing={2}>
                  {salesByCategory.map((category, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Box
                        p={2}
                        sx={{
                          backgroundColor: 'rgba(255, 165, 0, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 165, 0, 0.1)'
                        }}
                      >
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box
                            width={12}
                            height={12}
                            borderRadius="50%"
                            bgcolor={COLORS[index % COLORS.length]}
                            mr={1}
                          />
                          <Typography variant="subtitle2" fontWeight="bold">
                            {category.category}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            {category.total_ordered} items sold
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ₹{category.total_revenue}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" mt={1}>
                          <Box flexGrow={1} mr={1}>
                            <Box
                              height={4}
                              bgcolor="rgba(255, 165, 0, 0.2)"
                              borderRadius={2}
                              position="relative"
                            >
                              <Box
                                height={4}
                                bgcolor={COLORS[index % COLORS.length]}
                                borderRadius={2}
                                width={`${(category.total_revenue / totalRevenue) * 100}%`}
                              />
                            </Box>
                          </Box>
                          <Typography variant="caption" fontWeight="bold">
                            {((category.total_revenue / totalRevenue) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </Box>

          {/* Top Dishes Table */}
          <Box mb={6}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top Selling Dishes
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Dish</StyledTableCell>
                      <StyledTableCell>Category</StyledTableCell>
                      <StyledTableCell align="right">Price</StyledTableCell>
                      <StyledTableCell align="right">Quantity Sold</StyledTableCell>
                      <StyledTableCell align="right">Revenue</StyledTableCell>
                      <StyledTableCell align="center">Performance</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topDishes.map((dish, index) => (
                      <StyledTableRow key={dish.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              sx={{
                                bgcolor: COLORS[index % COLORS.length],
                                width: 32,
                                height: 32,
                                mr: 1.5,
                                fontSize: '0.9rem'
                              }}
                            >
                              <RestaurantIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {dish.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(() => {
                              // Parse categories from JSON format
                              let dishCategories = [];
                              try {
                                dishCategories = JSON.parse(dish.category || '[]');
                                if (!Array.isArray(dishCategories)) {
                                  dishCategories = [dish.category];
                                }
                              } catch (e) {
                                dishCategories = dish.category ? [dish.category] : [];
                              }
                              return dishCategories.join(', ');
                            })()}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255, 165, 0, 0.1)',
                              color: 'primary.main',
                              fontWeight: 'medium'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">₹{dish.price}</TableCell>
                        <TableCell align="right">{dish.total_ordered}</TableCell>
                        <TableCell align="right">₹{dish.total_revenue}</TableCell>
                        <TableCell align="center">
                          <Rating
                            value={Math.min(5, (dish.total_ordered / (topDishes[0]?.total_ordered || 1)) * 5)}
                            readOnly
                            precision={0.5}
                            size="small"
                          />
                        </TableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* Dish Insights */}
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
                Menu Insights & Recommendations
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Top Performing Category
                    </Typography>
                    <Typography variant="body2">
                      {salesByCategory.length > 0 ?
                        `"${salesByCategory[0].category}" is your best performing category with ₹{salesByCategory[0].total_revenue} in revenue (${((salesByCategory[0].total_revenue / totalRevenue) * 100).toFixed(1)}% of total).` :
                        'No category data available.'} Consider expanding this category with new dishes.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Menu Balance
                    </Typography>
                    <Typography variant="body2">
                      {salesByCategory.length > 0 && salesByCategory[salesByCategory.length - 1].total_revenue < (totalRevenue * 0.05) ?
                        `Your "${salesByCategory[salesByCategory.length - 1].category}" category is underperforming at only ${((salesByCategory[salesByCategory.length - 1].total_revenue / totalRevenue) * 100).toFixed(1)}% of total revenue.` :
                        'Your menu categories are well-balanced.'} Consider refreshing or promoting underperforming categories.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box p={2} borderLeft="2px solid" borderColor="primary.main">
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Star Dishes
                    </Typography>
                    <Typography variant="body2">
                      Your top 3 dishes ({topDishes.slice(0, 3).map(d => `"${d.name}"`).join(', ')}) account for
                      ${((topDishes.slice(0, 3).reduce((sum, dish) => sum + dish.total_revenue, 0) / totalRevenue) * 100).toFixed(1)}% of total revenue.
                      Feature these prominently and consider creating variations.
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

export default DishAnalysis;
