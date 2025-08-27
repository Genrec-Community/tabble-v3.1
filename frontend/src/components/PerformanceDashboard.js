import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

const PerformanceDashboard = ({ enabled = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    metrics,
    getStats,
    clearMetrics,
    isEnabled
  } = usePerformanceMonitor({ enabled, logToConsole: true });

  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    
    const updateStats = () => {
      setStats(getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enabled, getStats, metrics]);

  if (!enabled || !isEnabled) {
    return null;
  }

  const getPerformanceColor = (value, thresholds) => {
    if (value <= thresholds.good) return '#4CAF50';
    if (value <= thresholds.warning) return '#FF9800';
    return '#F44336';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ position: 'fixed', top: 10, right: 10, zIndex: 9999, maxWidth: 400 }}>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          borderRadius: 2
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SpeedIcon sx={{ color: '#FFA500', mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontSize: '0.9rem' }}>
              Performance Monitor
            </Typography>
          </Box>
          <Box>
            <IconButton size="small" onClick={clearMetrics} sx={{ color: '#FFA500' }}>
              <RefreshIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
              sx={{ color: '#FFA500' }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="caption" sx={{ color: '#FFA500' }}>
                API Avg
              </Typography>
              <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {stats?.api?.avgResponseTime ? `${stats.api.avgResponseTime.toFixed(0)}ms` : 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="caption" sx={{ color: '#FFA500' }}>
                Memory
              </Typography>
              <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {stats?.memory?.used ? `${stats.memory.used}MB` : 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="caption" sx={{ color: '#FFA500' }}>
                Network
              </Typography>
              <Chip
                size="small"
                label={stats?.network || 'Unknown'}
                color={stats?.network === 'online' ? 'success' : 'error'}
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {/* API Performance */}
            {stats?.api && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#FFA500', mb: 1 }}>
                  API Performance
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                    Success Rate: {stats.api.successRate?.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                    Total Calls: {stats.api.totalCalls}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.api.successRate || 0}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPerformanceColor(100 - stats.api.successRate, { good: 5, warning: 15 })
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                    Min: {stats.api.minResponseTime?.toFixed(0)}ms
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                    Max: {stats.api.maxResponseTime?.toFixed(0)}ms
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Render Performance */}
            {stats?.render && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#FFA500', mb: 1 }}>
                  Render Performance
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                    Avg: {stats.render.avgRenderTime?.toFixed(1)}ms
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                    Slow Renders: {stats.render.slowRenders}
                  </Typography>
                </Box>
                {stats.render.slowRenders > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon sx={{ color: '#FF9800', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption" sx={{ color: '#FF9800' }}>
                      {stats.render.slowRenders} slow renders detected
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Memory Usage */}
            {stats?.memory && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#FFA500', mb: 1 }}>
                  Memory Usage
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                    Used: {stats.memory.used}MB / {stats.memory.limit}MB
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                    {((stats.memory.used / stats.memory.limit) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(stats.memory.used / stats.memory.limit) * 100}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPerformanceColor(
                        (stats.memory.used / stats.memory.limit) * 100,
                        { good: 60, warning: 80 }
                      )
                    }
                  }}
                />
              </Box>
            )}

            {/* Recent API Calls */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#FFA500' }}>
                  Recent API Calls
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setShowDetails(!showDetails)}
                  sx={{ color: '#FFA500' }}
                >
                  {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={showDetails}>
                <TableContainer sx={{ maxHeight: 200 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#FFA500', fontSize: '0.7rem', p: 0.5 }}>
                          URL
                        </TableCell>
                        <TableCell sx={{ color: '#FFA500', fontSize: '0.7rem', p: 0.5 }}>
                          Time
                        </TableCell>
                        <TableCell sx={{ color: '#FFA500', fontSize: '0.7rem', p: 0.5 }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.apiResponseTimes.slice(-5).map((call, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ color: '#FFFFFF', fontSize: '0.6rem', p: 0.5 }}>
                            <Tooltip title={call.url}>
                              <span>
                                {call.url.split('/').pop() || 'API'}
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ color: '#FFFFFF', fontSize: '0.6rem', p: 0.5 }}>
                            {call.responseTime.toFixed(0)}ms
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <Chip
                              size="small"
                              label={call.success ? 'OK' : 'ERR'}
                              color={call.success ? 'success' : 'error'}
                              sx={{ fontSize: '0.6rem', height: 16 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default PerformanceDashboard;
