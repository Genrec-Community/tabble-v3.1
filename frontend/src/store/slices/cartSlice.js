import { createSlice } from '@reduxjs/toolkit';
import { produce } from 'immer';

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { dish, quantity, remarks } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.id === dish.id && item.remarks === remarks
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        state.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        const newItem = {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity,
          remarks,
          image_path: dish.image_path,
          category: dish.category,
          is_offer: dish.is_offer,
          discount: dish.discount,
          position: state.items.length + 1,
        };
        state.items.push(newItem);
      }

      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);
    },

    removeItem: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      
      // Update positions
      state.items.forEach((item, index) => {
        item.position = index + 1;
      });

      cartSlice.caseReducers.calculateTotals(state);
    },

    updateItemQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      
      if (item) {
        item.quantity = Math.max(1, quantity);
        cartSlice.caseReducers.calculateTotals(state);
      }
    },

    reorderItems: (state, action) => {
      const { fromIndex, toIndex } = action.payload;
      
      if (fromIndex >= 0 && fromIndex < state.items.length &&
          toIndex >= 0 && toIndex < state.items.length) {
        
        // Swap items
        const [movedItem] = state.items.splice(fromIndex, 1);
        state.items.splice(toIndex, 0, movedItem);
        
        // Update positions
        state.items.forEach((item, index) => {
          item.position = index + 1;
        });
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },

    calculateTotals: (state) => {
      state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
      state.total = state.items.reduce((total, item) => {
        const itemPrice = item.is_offer === 1 
          ? item.price * (1 - item.discount / 100)
          : item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateItemQuantity,
  reorderItems,
  clearCart,
  calculateTotals,
  setLoading,
  setError,
  clearError,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;

export default cartSlice.reducer;
