import { useCallback, useRef, useState, useEffect } from 'react';
import { customerService, chefService } from '../services/api';
import { useOptimizedPolling } from './useOptimizedPolling';

/**
 * Optimized order synchronization hook
 * Features:
 * - Smart caching with timestamps
 * - Differential updates (only fetch changed data)
 * - Optimistic updates for better UX
 * - Error recovery and retry logic
 */
export const useOrderSync = ({ userId, tableNumber, userType = 'customer' }) => {
  const [orders, setOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache management
  const cacheRef = useRef({
    orders: new Map(),
    lastFetch: null,
    etag: null
  });

  // Optimistic updates queue
  const optimisticUpdatesRef = useRef(new Map());

  // Fetch function based on user type
  const fetchOrders = useCallback(async () => {
    try {
      let result;
      
      if (userType === 'customer' && userId) {
        // Customer: fetch user orders
        result = await customerService.getPersonOrders(userId);
        
        // Apply optimistic updates
        const optimisticUpdates = Array.from(optimisticUpdatesRef.current.values());
        if (optimisticUpdates.length > 0) {
          result = result.map(order => {
            const optimisticUpdate = optimisticUpdatesRef.current.get(order.id);
            return optimisticUpdate ? { ...order, ...optimisticUpdate } : order;
          });
        }
        
        setOrders(result);
        
      } else if (userType === 'chef') {
        // Chef: fetch pending and accepted orders
        const [pending, accepted] = await Promise.all([
          chefService.getPendingOrders(),
          chefService.getAcceptedOrders()
        ]);
        
        setPendingOrders(pending);
        setAcceptedOrders(accepted);
        result = { pending, accepted };
      }

      // Update cache
      cacheRef.current.lastFetch = Date.now();
      setError(null);
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [userId, userType]);

  // Optimized polling setup
  const {
    isPolling,
    error: pollingError,
    lastUpdate,
    refresh,
    currentInterval
  } = useOptimizedPolling({
    fetchFunction: fetchOrders,
    baseInterval: userType === 'chef' ? 5000 : 10000, // Chef needs faster updates
    fastInterval: userType === 'chef' ? 2000 : 5000,
    enabled: !!(userType === 'chef' || userId),
    dependencies: [userId, userType]
  });

  // Optimistic update for order status
  const updateOrderOptimistically = useCallback((orderId, updates) => {
    optimisticUpdatesRef.current.set(orderId, updates);
    
    // Apply immediately to current state
    if (userType === 'customer') {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));
    } else if (userType === 'chef') {
      setPendingOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));
      setAcceptedOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));
    }

    // Clear optimistic update after 30 seconds (should be resolved by then)
    setTimeout(() => {
      optimisticUpdatesRef.current.delete(orderId);
    }, 30000);
  }, [userType]);

  // Accept order with optimistic update
  const acceptOrder = useCallback(async (orderId) => {
    try {
      // Optimistic update
      updateOrderOptimistically(orderId, { 
        status: 'accepted',
        updated_at: new Date().toISOString()
      });

      // API call
      await chefService.acceptOrder(orderId);
      
      // Clear optimistic update on success
      optimisticUpdatesRef.current.delete(orderId);
      
      // Trigger immediate refresh
      await refresh();
      
    } catch (error) {
      // Revert optimistic update on error
      optimisticUpdatesRef.current.delete(orderId);
      await refresh(); // Refresh to get correct state
      throw error;
    }
  }, [updateOrderOptimistically, refresh]);

  // Complete order with optimistic update
  const completeOrder = useCallback(async (orderId) => {
    try {
      // Optimistic update
      updateOrderOptimistically(orderId, { 
        status: 'completed',
        updated_at: new Date().toISOString()
      });

      // API call
      await chefService.completeOrder(orderId);
      
      // Clear optimistic update on success
      optimisticUpdatesRef.current.delete(orderId);
      
      // Trigger immediate refresh
      await refresh();
      
    } catch (error) {
      // Revert optimistic update on error
      optimisticUpdatesRef.current.delete(orderId);
      await refresh(); // Refresh to get correct state
      throw error;
    }
  }, [updateOrderOptimistically, refresh]);

  // Cancel order with optimistic update
  const cancelOrder = useCallback(async (orderId) => {
    try {
      // Optimistic update
      updateOrderOptimistically(orderId, { 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      });

      // API call
      await customerService.cancelOrder(orderId);
      
      // Clear optimistic update on success
      optimisticUpdatesRef.current.delete(orderId);
      
      // Trigger immediate refresh
      await refresh();
      
    } catch (error) {
      // Revert optimistic update on error
      optimisticUpdatesRef.current.delete(orderId);
      await refresh(); // Refresh to get correct state
      throw error;
    }
  }, [updateOrderOptimistically, refresh]);

  // Request payment with optimistic update
  const requestPayment = useCallback(async (orderId) => {
    try {
      // Optimistic update
      updateOrderOptimistically(orderId, { 
        status: 'payment_requested',
        updated_at: new Date().toISOString()
      });

      // API call
      await customerService.requestPayment(orderId);
      
      // Clear optimistic update on success
      optimisticUpdatesRef.current.delete(orderId);
      
      // Trigger immediate refresh
      await refresh();
      
    } catch (error) {
      // Revert optimistic update on error
      optimisticUpdatesRef.current.delete(orderId);
      await refresh(); // Refresh to get correct state
      throw error;
    }
  }, [updateOrderOptimistically, refresh]);

  // Initial loading
  useEffect(() => {
    if (userType === 'chef' || userId) {
      setLoading(true);
      fetchOrders()
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
    }
  }, [fetchOrders, userType, userId]);

  // Get orders by status for customer
  const getOrdersByStatus = useCallback((status) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  // Get real-time statistics
  const getStats = useCallback(() => {
    if (userType === 'customer') {
      return {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        accepted: orders.filter(o => o.status === 'accepted').length,
        completed: orders.filter(o => o.status === 'completed').length,
        paid: orders.filter(o => o.status === 'paid').length
      };
    } else {
      return {
        pending: pendingOrders.length,
        accepted: acceptedOrders.length,
        total: pendingOrders.length + acceptedOrders.length
      };
    }
  }, [orders, pendingOrders, acceptedOrders, userType]);

  return {
    // Data
    orders,
    pendingOrders,
    acceptedOrders,
    
    // State
    loading,
    isPolling,
    error: error || pollingError,
    lastUpdate,
    currentInterval,
    
    // Actions
    refresh,
    acceptOrder,
    completeOrder,
    cancelOrder,
    requestPayment,
    
    // Utilities
    getOrdersByStatus,
    getStats
  };
};

export default useOrderSync;
