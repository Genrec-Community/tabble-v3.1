import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache persists for 1 hour
      cacheTime: 60 * 60 * 1000, // 1 hour
      
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      
      // Don't refetch on reconnect by default
      refetchOnReconnect: true,
      
      // Retry failed requests 3 times
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Menu related queries
  menu: {
    all: ['menu'],
    lists: () => [...queryKeys.menu.all, 'list'],
    list: (category) => [...queryKeys.menu.lists(), category],
    categories: () => [...queryKeys.menu.all, 'categories'],
    specials: () => [...queryKeys.menu.all, 'specials'],
    offers: () => [...queryKeys.menu.all, 'offers'],
  },
  
  // Order related queries
  orders: {
    all: ['orders'],
    lists: () => [...queryKeys.orders.all, 'list'],
    list: (userId) => [...queryKeys.orders.lists(), userId],
    detail: (orderId) => [...queryKeys.orders.all, 'detail', orderId],
  },
  
  // User related queries
  user: {
    all: ['user'],
    profile: (userId) => [...queryKeys.user.all, 'profile', userId],
    loyalty: (userId) => [...queryKeys.user.all, 'loyalty', userId],
  },
  
  // Admin related queries
  admin: {
    all: ['admin'],
    settings: () => [...queryKeys.admin.all, 'settings'],
    databases: () => [...queryKeys.admin.all, 'databases'],
    analytics: (startDate, endDate) => [...queryKeys.admin.all, 'analytics', startDate, endDate],
  },
  
  // Chef related queries
  chef: {
    all: ['chef'],
    pendingOrders: () => [...queryKeys.chef.all, 'pending'],
    acceptedOrders: () => [...queryKeys.chef.all, 'accepted'],
  },
};

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all menu-related queries
  invalidateMenu: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
  },
  
  // Invalidate all order-related queries
  invalidateOrders: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
  },
  
  // Invalidate user orders for a specific user
  invalidateUserOrders: (userId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(userId) });
  },
  
  // Invalidate chef orders
  invalidateChefOrders: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chef.all });
  },
  
  // Prefetch menu data
  prefetchMenu: async (category = null) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.menu.list(category),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },
  
  // Set query data manually (for optimistic updates)
  setQueryData: (queryKey, data) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Get cached query data
  getQueryData: (queryKey) => {
    return queryClient.getQueryData(queryKey);
  },
  
  // Remove specific query from cache
  removeQueries: (queryKey) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Clear all cache
  clearCache: () => {
    queryClient.clear();
  },
};

export default queryClient;
