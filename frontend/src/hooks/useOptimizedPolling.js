import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Optimized polling hook with smart intervals and error handling
 * Features:
 * - Adaptive polling intervals based on activity
 * - Exponential backoff on errors
 * - Automatic pause when tab is not visible
 * - Cleanup on unmount
 */
export const useOptimizedPolling = ({
  fetchFunction,
  baseInterval = 10000, // 10 seconds default
  fastInterval = 3000,  // 3 seconds when active
  maxInterval = 60000,  // 1 minute max
  enabled = true,
  dependencies = []
}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);
  const currentIntervalRef = useRef(baseInterval);
  const errorCountRef = useRef(0);
  const isActiveRef = useRef(true);
  const lastActivityRef = useRef(Date.now());

  // Track user activity to adjust polling frequency
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // Use faster polling when user is active
    if (currentIntervalRef.current > fastInterval) {
      currentIntervalRef.current = fastInterval;
      restartPolling();
    }
  }, [fastInterval]);

  // Check if user has been inactive
  const checkInactivity = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    const shouldSlowDown = timeSinceActivity > 30000; // 30 seconds of inactivity
    
    if (shouldSlowDown && currentIntervalRef.current < baseInterval) {
      currentIntervalRef.current = baseInterval;
      restartPolling();
    }
  }, [baseInterval]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    isActiveRef.current = !document.hidden;
    if (isActiveRef.current) {
      updateActivity();
      restartPolling();
    } else {
      stopPolling();
    }
  }, [updateActivity]);

  // Optimized fetch with error handling
  const optimizedFetch = useCallback(async () => {
    if (!enabled || !isActiveRef.current) return;

    setIsPolling(true);
    setError(null);

    try {
      const result = await fetchFunction();
      
      // Reset error count on success
      errorCountRef.current = 0;
      currentIntervalRef.current = Math.max(
        currentIntervalRef.current * 0.9, // Gradually reduce interval
        fastInterval
      );
      
      setLastUpdate(Date.now());
      setIsPolling(false);
      
      return result;
    } catch (err) {
      console.error('Polling error:', err);
      setError(err);
      setIsPolling(false);
      
      // Exponential backoff on errors
      errorCountRef.current += 1;
      currentIntervalRef.current = Math.min(
        baseInterval * Math.pow(2, errorCountRef.current),
        maxInterval
      );
      
      throw err;
    }
  }, [fetchFunction, enabled, fastInterval, baseInterval, maxInterval]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    const poll = async () => {
      try {
        await optimizedFetch();
        checkInactivity();
      } catch (error) {
        // Error already handled in optimizedFetch
      }
      
      // Schedule next poll
      if (enabled && isActiveRef.current) {
        intervalRef.current = setTimeout(poll, currentIntervalRef.current);
      }
    };

    // Initial fetch
    poll();
  }, [optimizedFetch, enabled, checkInactivity]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Restart polling with new interval
  const restartPolling = useCallback(() => {
    stopPolling();
    if (enabled && isActiveRef.current) {
      startPolling();
    }
  }, [stopPolling, startPolling, enabled]);

  // Manual refresh
  const refresh = useCallback(async () => {
    updateActivity();
    try {
      return await optimizedFetch();
    } catch (error) {
      // Error already handled
      throw error;
    }
  }, [optimizedFetch, updateActivity]);

  // Setup polling and event listeners
  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    // Add event listeners for activity tracking
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling
    startPolling();

    return () => {
      // Cleanup
      stopPolling();
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling, updateActivity, handleVisibilityChange, ...dependencies]);

  return {
    isPolling,
    error,
    lastUpdate,
    refresh,
    currentInterval: currentIntervalRef.current,
    errorCount: errorCountRef.current
  };
};

export default useOptimizedPolling;
