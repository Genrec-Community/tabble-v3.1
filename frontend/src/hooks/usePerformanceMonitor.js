import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Performance monitoring hook
 * Tracks API response times, render performance, and memory usage
 */
export const usePerformanceMonitor = ({ enabled = true, logToConsole = false }) => {
  const [metrics, setMetrics] = useState({
    apiResponseTimes: [],
    renderTimes: [],
    memoryUsage: null,
    networkStatus: 'online'
  });

  const metricsRef = useRef({
    apiCalls: new Map(),
    renderStart: null,
    componentMounts: 0
  });

  // Track API call performance
  const trackApiCall = useCallback((url, startTime, endTime, success = true) => {
    if (!enabled) return;

    const responseTime = endTime - startTime;
    const callData = {
      url,
      responseTime,
      timestamp: endTime,
      success
    };

    setMetrics(prev => ({
      ...prev,
      apiResponseTimes: [...prev.apiResponseTimes.slice(-49), callData] // Keep last 50
    }));

    if (logToConsole) {
      console.log(`API Call: ${url} - ${responseTime}ms - ${success ? 'Success' : 'Failed'}`);
    }
  }, [enabled, logToConsole]);

  // Track render performance
  const trackRenderStart = useCallback(() => {
    if (!enabled) return;
    metricsRef.current.renderStart = performance.now();
  }, [enabled]);

  const trackRenderEnd = useCallback((componentName = 'Unknown') => {
    if (!enabled || !metricsRef.current.renderStart) return;

    const renderTime = performance.now() - metricsRef.current.renderStart;
    const renderData = {
      componentName,
      renderTime,
      timestamp: Date.now()
    };

    setMetrics(prev => ({
      ...prev,
      renderTimes: [...prev.renderTimes.slice(-49), renderData] // Keep last 50
    }));

    if (logToConsole && renderTime > 16) { // Log slow renders (>16ms)
      console.warn(`Slow render: ${componentName} - ${renderTime.toFixed(2)}ms`);
    }

    metricsRef.current.renderStart = null;
  }, [enabled, logToConsole]);

  // Monitor memory usage
  const checkMemoryUsage = useCallback(() => {
    if (!enabled || !performance.memory) return;

    const memoryInfo = {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
      timestamp: Date.now()
    };

    setMetrics(prev => ({
      ...prev,
      memoryUsage: memoryInfo
    }));

    // Warn if memory usage is high
    if (logToConsole && memoryInfo.used > memoryInfo.limit * 0.8) {
      console.warn(`High memory usage: ${memoryInfo.used}MB / ${memoryInfo.limit}MB`);
    }
  }, [enabled, logToConsole]);

  // Monitor network status
  const updateNetworkStatus = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      networkStatus: navigator.onLine ? 'online' : 'offline'
    }));
  }, []);

  // Get performance statistics
  const getStats = useCallback(() => {
    const { apiResponseTimes, renderTimes } = metrics;

    const apiStats = apiResponseTimes.length > 0 ? {
      avgResponseTime: apiResponseTimes.reduce((sum, call) => sum + call.responseTime, 0) / apiResponseTimes.length,
      maxResponseTime: Math.max(...apiResponseTimes.map(call => call.responseTime)),
      minResponseTime: Math.min(...apiResponseTimes.map(call => call.responseTime)),
      successRate: apiResponseTimes.filter(call => call.success).length / apiResponseTimes.length * 100,
      totalCalls: apiResponseTimes.length
    } : null;

    const renderStats = renderTimes.length > 0 ? {
      avgRenderTime: renderTimes.reduce((sum, render) => sum + render.renderTime, 0) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes.map(render => render.renderTime)),
      slowRenders: renderTimes.filter(render => render.renderTime > 16).length,
      totalRenders: renderTimes.length
    } : null;

    return {
      api: apiStats,
      render: renderStats,
      memory: metrics.memoryUsage,
      network: metrics.networkStatus,
      componentMounts: metricsRef.current.componentMounts
    };
  }, [metrics]);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    setMetrics({
      apiResponseTimes: [],
      renderTimes: [],
      memoryUsage: null,
      networkStatus: navigator.onLine ? 'online' : 'offline'
    });
    metricsRef.current.apiCalls.clear();
  }, []);

  // Setup monitoring
  useEffect(() => {
    if (!enabled) return;

    metricsRef.current.componentMounts++;

    // Check memory usage periodically
    const memoryInterval = setInterval(checkMemoryUsage, 30000); // Every 30 seconds

    // Monitor network status
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Initial network status
    updateNetworkStatus();

    return () => {
      clearInterval(memoryInterval);
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, [enabled, checkMemoryUsage, updateNetworkStatus]);

  // Create instrumented fetch function
  const instrumentedFetch = useCallback(async (url, options = {}) => {
    const startTime = performance.now();
    let success = true;

    try {
      const response = await fetch(url, options);
      success = response.ok;
      return response;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const endTime = performance.now();
      trackApiCall(url, startTime, endTime, success);
    }
  }, [trackApiCall]);

  // Performance-aware component wrapper
  const withPerformanceTracking = useCallback((WrappedComponent, componentName) => {
    return function PerformanceTrackedComponent(props) {
      useEffect(() => {
        trackRenderStart();
        return () => trackRenderEnd(componentName);
      });

      return <WrappedComponent {...props} />;
    };
  }, [trackRenderStart, trackRenderEnd]);

  return {
    metrics,
    getStats,
    clearMetrics,
    trackApiCall,
    trackRenderStart,
    trackRenderEnd,
    instrumentedFetch,
    withPerformanceTracking,
    isEnabled: enabled
  };
};

export default usePerformanceMonitor;
