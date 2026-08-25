import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { customerService } from '../services/api';
import { handleApiError, safeAsync, withRetry } from '../utils/errorHandler';

/**
 * Optimized hook for menu data management
 */
export const useMenuData = () => {
  const [state, setState] = useState({
    dishes: [],
    categories: ['All'],
    offers: [],
    specials: [],
    loading: {
      dishes: true,
      categories: true,
      offers: true,
      specials: true
    },
    errors: {}
  });

  // Memoized enhanced dishes to prevent unnecessary recalculations
  const enhancedDishes = useMemo(() => {
    return state.dishes.map(dish => ({
      ...dish,
      rating: (Math.random() * 2 + 3).toFixed(1),
      prepTime: Math.floor(Math.random() * 15) + 5,
      isPopular: Math.random() > 0.7,
      isNew: Math.random() > 0.8,
      isFeatured: dish.is_offer === 1 ? true : Math.random() > 0.85,
    }));
  }, [state.dishes]);

  // Optimized data fetching with error handling
  const fetchMenuData = useCallback(async () => {
    const fetchOperations = [
      {
        key: 'categories',
        operation: () => customerService.getCategories(),
        transform: (data) => ['All', ...Array.from(new Set(data.filter(c => c && c !== 'All')))],
      },
      {
        key: 'dishes',
        operation: () => customerService.getMenu()
      },
      {
        key: 'offers',
        operation: () => customerService.getOffers()
      },
      {
        key: 'specials',
        operation: () => customerService.getSpecials()
      }
    ];

    const results = await Promise.allSettled(
      fetchOperations.map(async ({ key, operation, transform }) => {
        try {
          const data = await withRetry(operation, 2, 500);
          return {
            key,
            data: transform ? transform(data) : data,
            success: true
          };
        } catch (error) {
          return {
            key,
            error: handleApiError(error, `fetching ${key}`),
            success: false
          };
        }
      })
    );

    setState(prevState => {
      const newState = { ...prevState };
      const newLoading = { ...prevState.loading };
      const newErrors = { ...prevState.errors };

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { key, data, success, error } = result.value;
          newLoading[key] = false;
          
          if (success) {
            newState[key] = data;
            delete newErrors[key];
          } else {
            newErrors[key] = error;
          }
        }
      });

      return {
        ...newState,
        loading: newLoading,
        errors: newErrors
      };
    });
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  return {
    ...state,
    enhancedDishes,
    refetch: fetchMenuData
  };
};

/**
 * Optimized hook for order management
 */
export const useOrderManagement = (userId, tableNumber) => {
  const [state, setState] = useState({
    currentOrder: null,
    unpaidOrders: [],
    userOrders: [],
    loading: false,
    hasEverPlacedOrder: false,
    hasPlacedOrderInSession: false,
    isPollingActive: false
  });

  // Memoized order fetching function
  const fetchOrders = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const orders = await withRetry(
        () => customerService.getPersonOrders(userId),
        2,
        500
      );

      const tableOrders = orders.filter(order =>
        order.table_number === parseInt(tableNumber)
      );

      const tableUnpaidOrders = orders.filter(order =>
        order.status !== 'paid' &&
        order.status !== 'cancelled' &&
        order.status !== 'merged' &&
        order.status !== 'rejected' &&
        order.status !== 'payment_requested' &&
        order.table_number === parseInt(tableNumber)
      );

      const activeOrder = tableUnpaidOrders.length > 0 ? tableUnpaidOrders[0] : null;

      setState(prev => ({
        ...prev,
        currentOrder: activeOrder,
        unpaidOrders: tableUnpaidOrders,
        userOrders: orders,
        hasEverPlacedOrder: tableOrders.length > 0,
        loading: false
      }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: handleApiError(error, 'fetching orders')
      }));
    }
  }, [userId, tableNumber]);

  // Optimized polling with cleanup
  useEffect(() => {
    if (!userId) return;

    fetchOrders();

    const interval = setInterval(async () => {
      setState(prev => ({ ...prev, isPollingActive: true }));
      try {
        await fetchOrders();
      } finally {
        setState(prev => ({ ...prev, isPollingActive: false }));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userId, fetchOrders]);

  const markOrderPlaced = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasEverPlacedOrder: true,
      hasPlacedOrderInSession: true
    }));
  }, []);

  return {
    ...state,
    fetchOrders,
    markOrderPlaced
  };
};

/**
 * Hook for cart management backed by a SERVER-SIDE shared slot cart.
 * One QR code = one shared cart, so everyone who scans the same QR sees and
 * edits the same cart live (polled every 5 s). localStorage is only used as
 * an offline mirror of the last known server state.
 */
export const useCartManagement = () => {
  // Get current QR token to identify the shared slot session
  const qrToken = localStorage.getItem('customerQrToken') || 'default';
  const cartStorageKey = `customerCart_${qrToken}`;

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(cartStorageKey);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  // Timestamp of the last local mutation — polling skips right after a
  // mutation so the optimistic update is never clobbered by a stale poll.
  const lastMutationAt = useRef(0);

  const applyServerCart = useCallback((items) => {
    if (!Array.isArray(items)) return;
    setCart(items);
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(items));
      localStorage.setItem('customerCartUpdatedAt', new Date().toISOString());
      if (items.length > 0) {
        localStorage.setItem('customerOrderStatus', 'active');
      } else {
        localStorage.removeItem('customerOrderStatus');
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartStorageKey]);

  // Pull the shared cart from the server
  const fetchCart = useCallback(async () => {
    if (qrToken === 'default') return; // no QR session — nothing to sync
    try {
      const data = await customerService.getCart();
      applyServerCart(data.items || []);
    } catch (error) {
      // Offline / server hiccup — keep showing the mirrored cart
    }
  }, [qrToken, applyServerCart]);

  useEffect(() => {
    fetchCart();

    const interval = setInterval(() => {
      // Skip one cycle right after a local mutation
      if (Date.now() - lastMutationAt.current < 2000) return;
      fetchCart();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchCart]);

  const addToCart = useCallback((dish, quantity, remarks, optionLabel = null) => {
    const actualPrice = dish.is_offer === 1 ?
      parseFloat((dish.price - (dish.price * dish.discount / 100)).toFixed(2)) :
      dish.price;

    lastMutationAt.current = Date.now();
    customerService.addCartItem({
      dish_id: dish.id,
      quantity,
      remarks,
      option_label: optionLabel,
      image: dish.image_path,
      original_price: dish.price,
      discount: dish.discount,
      is_offer: dish.is_offer,
    })
      .then((data) => applyServerCart(data.items))
      .catch(() => {
        lastMutationAt.current = 0;
        fetchCart();
      });
  }, [applyServerCart, fetchCart]);

  const removeFromCart = useCallback((index) => {
    setCart(prev => {
      const item = prev[index];
      if (!item || item.line_id === undefined) return prev;
      lastMutationAt.current = Date.now();
      customerService.deleteCartItem(item.line_id)
        .then((data) => applyServerCart(data.items))
        .catch(() => { lastMutationAt.current = 0; fetchCart(); });
      return prev.filter((_, idx) => idx !== index);
    });
  }, [applyServerCart, fetchCart]);

  const persistOrder = useCallback((newCart) => {
    setCart(newCart);
    lastMutationAt.current = Date.now();
    customerService.reorderCartItems(newCart.map(i => i.line_id))
      .then((data) => applyServerCart(data.items))
      .catch(() => { lastMutationAt.current = 0; fetchCart(); });
  }, [applyServerCart, fetchCart]);

  const reorderCart = useCallback((index, direction) => {
    setCart(prev => {
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prev.length - 1)
      ) {
        return prev;
      }

      const newCart = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [newCart[index], newCart[newIndex]] = [newCart[newIndex], newCart[index]];

      newCart.forEach((item, idx) => { item.position = idx + 1; });
      persistOrder(newCart);
      return newCart;
    });
  }, [persistOrder]);

  // Move an item from one index to another (used by drag-to-reorder in the cart)
  const moveCartItem = useCallback((fromIndex, toIndex) => {
    setCart(prev => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }

      const newCart = [...prev];
      const [moved] = newCart.splice(fromIndex, 1);
      newCart.splice(toIndex, 0, moved);

      newCart.forEach((item, idx) => { item.position = idx + 1; });
      persistOrder(newCart);
      return newCart;
    });
  }, [persistOrder]);

  const clearCart = useCallback(async () => {
    setCart([]);
    lastMutationAt.current = Date.now();
    try {
      await customerService.clearCart();
    } catch (error) {
      // Server may already be empty — ignore
    }
    try {
      localStorage.removeItem(cartStorageKey);
      localStorage.removeItem('customerOrderStatus');
      localStorage.removeItem('customerCartUpdatedAt');
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  }, [cartStorageKey]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    reorderCart,
    moveCartItem,
    clearCart,
    refreshCart: fetchCart,
    cartTotal,
    cartCount: cart.length
  };
};

/**
 * Optimized hook for discount management
 */
export const useDiscountManagement = (userId) => {
  const [discounts, setDiscounts] = useState({
    loyalty: { discount_percentage: 0, message: '' },
    selectionOffer: { discount_amount: 0, message: '' }
  });

  const fetchDiscounts = useCallback(async (totalAmount = 0) => {
    if (!userId) return;

    try {
      const person = await customerService.getPerson(userId);
      
      // Fetch loyalty discount
      let loyaltyDiscount = { discount_percentage: 0, message: 'No loyalty discount available' };
      if (person && person.visit_count > 0) {
        try {
          loyaltyDiscount = await customerService.getLoyaltyDiscount(person.visit_count);
        } catch (error) {
          // Fallback to no discount
        }
      }

      // Fetch selection offer discount
      let selectionOfferDiscount = { discount_amount: 0, message: 'No special offer available' };
      if (totalAmount > 0) {
        try {
          selectionOfferDiscount = await customerService.getSelectionOfferDiscount(totalAmount);
        } catch (error) {
          // Fallback calculation
          if (totalAmount >= 100) {
            selectionOfferDiscount = {
              discount_amount: 15,
              message: 'Special Offer: ₹15 off on orders above ₹100'
            };
          } else if (totalAmount >= 50) {
            selectionOfferDiscount = {
              discount_amount: 5,
              message: 'Special Offer: ₹5 off on orders above ₹50'
            };
          }
        }
      }

      setDiscounts({
        loyalty: loyaltyDiscount,
        selectionOffer: selectionOfferDiscount
      });

    } catch (error) {
      // Silent fail for discounts
      setDiscounts({
        loyalty: { discount_percentage: 0, message: 'No loyalty discount available' },
        selectionOffer: { discount_amount: 0, message: 'No special offer available' }
      });
    }
  }, [userId]);

  return {
    discounts,
    fetchDiscounts
  };
};
