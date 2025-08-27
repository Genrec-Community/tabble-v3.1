import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customerService } from '../../services/api';

// Async thunks for order operations
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async ({ orderData, personId }, { rejectWithValue }) => {
    try {
      const data = await customerService.createOrder(orderData, personId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create order');
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (userId, { rejectWithValue }) => {
    try {
      const data = await customerService.getPersonOrders(userId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch orders');
    }
  }
);

export const requestPayment = createAsyncThunk(
  'orders/requestPayment',
  async (orderId, { rejectWithValue }) => {
    try {
      const data = await customerService.requestPayment(orderId);
      return { orderId, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to request payment');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const data = await customerService.cancelOrder(orderId);
      return { orderId, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to cancel order');
    }
  }
);

const initialState = {
  userOrders: [],
  currentOrder: null,
  unpaidOrders: [],
  loading: false,
  creating: false,
  paymentLoading: false,
  cancellingOrders: [],
  error: null,
  lastOrderId: null,
  hasPlacedOrderInSession: false,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },

    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },

    setHasPlacedOrderInSession: (state, action) => {
      state.hasPlacedOrderInSession = action.payload;
    },

    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.userOrders.find(order => order.id === orderId);
      if (order) {
        order.status = status;
      }
    },

    addCancellingOrder: (state, action) => {
      const orderId = action.payload;
      if (!state.cancellingOrders.includes(orderId)) {
        state.cancellingOrders.push(orderId);
      }
    },

    removeCancellingOrder: (state, action) => {
      const orderId = action.payload;
      state.cancellingOrders = state.cancellingOrders.filter(id => id !== orderId);
    },

    clearError: (state) => {
      state.error = null;
    },

    resetSession: (state) => {
      state.hasPlacedOrderInSession = false;
      state.currentOrder = null;
      state.lastOrderId = null;
    },
  },
  extraReducers: (builder) => {
    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.creating = false;
        state.currentOrder = action.payload;
        state.lastOrderId = action.payload.id;
        state.hasPlacedOrderInSession = true;
        
        // Add to user orders if not already present
        const existingOrder = state.userOrders.find(order => order.id === action.payload.id);
        if (!existingOrder) {
          state.userOrders.unshift(action.payload);
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });

    // Fetch User Orders
    builder
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.userOrders = action.payload;
        
        // Update unpaid orders
        state.unpaidOrders = action.payload.filter(
          order => order.status === 'completed'
        );
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Request Payment
    builder
      .addCase(requestPayment.pending, (state) => {
        state.paymentLoading = true;
        state.error = null;
      })
      .addCase(requestPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        
        // Update order status
        const order = state.userOrders.find(order => order.id === action.payload.orderId);
        if (order) {
          order.status = 'payment_requested';
        }
      })
      .addCase(requestPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.error = action.payload;
      });

    // Cancel Order
    builder
      .addCase(cancelOrder.pending, (state, action) => {
        const orderId = action.meta.arg;
        orderSlice.caseReducers.addCancellingOrder(state, { payload: orderId });
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const orderId = action.payload.orderId;
        orderSlice.caseReducers.removeCancellingOrder(state, { payload: orderId });
        
        // Update order status
        const order = state.userOrders.find(order => order.id === orderId);
        if (order) {
          order.status = 'cancelled';
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        const orderId = action.meta.arg;
        orderSlice.caseReducers.removeCancellingOrder(state, { payload: orderId });
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentOrder,
  clearCurrentOrder,
  setHasPlacedOrderInSession,
  updateOrderStatus,
  addCancellingOrder,
  removeCancellingOrder,
  clearError,
  resetSession,
} = orderSlice.actions;

// Selectors
export const selectUserOrders = (state) => state.orders.userOrders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectUnpaidOrders = (state) => state.orders.unpaidOrders;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectOrderCreating = (state) => state.orders.creating;
export const selectPaymentLoading = (state) => state.orders.paymentLoading;
export const selectCancellingOrders = (state) => state.orders.cancellingOrders;
export const selectOrdersError = (state) => state.orders.error;
export const selectLastOrderId = (state) => state.orders.lastOrderId;
export const selectHasPlacedOrderInSession = (state) => state.orders.hasPlacedOrderInSession;

export default orderSlice.reducer;
