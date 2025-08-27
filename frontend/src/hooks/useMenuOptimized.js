import { useState, useEffect, useCallback, useMemo } from 'react';
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
        transform: (data) => ['All', ...data]
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
 * Optimized hook for cart management
 */
export const useCartManagement = () => {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((dish, quantity, remarks) => {
    const actualPrice = dish.is_offer === 1 ?
      parseFloat((dish.price - (dish.price * dish.discount / 100)).toFixed(2)) :
      dish.price;

    const newItem = {
      dish_id: dish.id,
      dish_name: dish.name,
      price: actualPrice,
      original_price: dish.price,
      discount: dish.discount,
      is_offer: dish.is_offer,
      quantity,
      remarks,
      image: dish.image_path,
      added_at: new Date().toISOString(),
      position: cart.length + 1
    };

    setCart(prev => [...prev, newItem]);
    return newItem;
  }, [cart.length]);

  const removeFromCart = useCallback((index) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      return newCart.map((item, idx) => ({
        ...item,
        position: idx + 1
      }));
    });
  }, []);

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

      return newCart.map((item, idx) => ({
        ...item,
        position: idx + 1
      }));
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    reorderCart,
    clearCart,
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
