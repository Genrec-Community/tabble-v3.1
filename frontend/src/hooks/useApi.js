import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, chefService, adminService } from '../services/api';
import { queryKeys, cacheUtils } from '../services/queryClient';

// Menu hooks
export const useMenu = (category = null) => {
  return useQuery({
    queryKey: queryKeys.menu.list(category),
    queryFn: () => customerService.getMenu(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.menu.categories(),
    queryFn: customerService.getCategories,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useSpecials = () => {
  return useQuery({
    queryKey: queryKeys.menu.specials(),
    queryFn: customerService.getSpecials,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useOffers = () => {
  return useQuery({
    queryKey: queryKeys.menu.offers(),
    queryFn: customerService.getOffers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Order hooks
export const useUserOrders = (userId, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.orders.list(userId),
    queryFn: () => customerService.getPersonOrders(userId),
    enabled: !!userId && enabled,
    staleTime: 30 * 1000, // 30 seconds (orders change frequently)
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderData, personId }) => customerService.createOrder(orderData, personId),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user orders
      if (variables.personId) {
        cacheUtils.invalidateUserOrders(variables.personId);
      }
      
      // Invalidate chef orders (new order appears)
      cacheUtils.invalidateChefOrders();
    },
    onError: (error) => {
      console.error('Error creating order:', error);
    },
  });
};

export const useRequestPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customerService.requestPayment,
    onSuccess: (data, orderId) => {
      // Update the specific order in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.orders.all },
        (oldData) => {
          if (Array.isArray(oldData)) {
            return oldData.map(order => 
              order.id === orderId 
                ? { ...order, status: 'payment_requested' }
                : order
            );
          }
          return oldData;
        }
      );
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customerService.cancelOrder,
    onSuccess: (data, orderId) => {
      // Update the specific order in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.orders.all },
        (oldData) => {
          if (Array.isArray(oldData)) {
            return oldData.map(order => 
              order.id === orderId 
                ? { ...order, status: 'cancelled' }
                : order
            );
          }
          return oldData;
        }
      );
      
      // Invalidate chef orders
      cacheUtils.invalidateChefOrders();
    },
  });
};

// Chef hooks
export const usePendingOrders = () => {
  return useQuery({
    queryKey: queryKeys.chef.pendingOrders(),
    queryFn: chefService.getPendingOrders,
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 60 * 1000, // 1 minute
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });
};

export const useAcceptedOrders = () => {
  return useQuery({
    queryKey: queryKeys.chef.acceptedOrders(),
    queryFn: chefService.getAcceptedOrders,
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 60 * 1000, // 1 minute
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });
};

export const useAcceptOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chefService.acceptOrder,
    onSuccess: () => {
      // Invalidate both pending and accepted orders
      cacheUtils.invalidateChefOrders();
      
      // Also invalidate user orders as status changed
      cacheUtils.invalidateOrders();
    },
  });
};

export const useCompleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chefService.completeOrder,
    onSuccess: () => {
      // Invalidate chef orders
      cacheUtils.invalidateChefOrders();
      
      // Invalidate user orders as status changed
      cacheUtils.invalidateOrders();
    },
  });
};

// Admin hooks
export const useSettings = () => {
  return useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: adminService.getSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useDatabases = () => {
  return useQuery({
    queryKey: queryKeys.admin.databases(),
    queryFn: adminService.getDatabases,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Utility hooks
export const usePrefetchMenu = () => {
  const queryClient = useQueryClient();
  
  return {
    prefetchMenu: (category = null) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.menu.list(category),
        queryFn: () => customerService.getMenu(category),
        staleTime: 10 * 60 * 1000,
      });
    },
    prefetchCategories: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.menu.categories(),
        queryFn: customerService.getCategories,
        staleTime: 15 * 60 * 1000,
      });
    },
  };
};
