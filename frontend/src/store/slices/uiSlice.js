import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Dialog states
  cartDialogOpen: false,
  addToCartDialogOpen: false,
  orderHistoryOpen: false,
  paymentDialogOpen: false,
  feedbackDialogOpen: false,
  
  // Selected items
  selectedDish: null,
  quantity: 1,
  remarks: '',
  
  // Snackbar state
  snackbar: {
    open: false,
    message: '',
    severity: 'success',
  },
  
  // Loading states
  globalLoading: false,
  
  // Error states
  globalError: null,
  
  // Other UI states
  lastPaidOrderId: null,
  loyaltyDiscount: {
    discount_percentage: 0,
    message: '',
  },
  selectionOfferDiscount: {
    discount_amount: 0,
    message: '',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Dialog actions
    openCartDialog: (state) => {
      state.cartDialogOpen = true;
    },
    
    closeCartDialog: (state) => {
      state.cartDialogOpen = false;
    },
    
    openAddToCartDialog: (state, action) => {
      state.addToCartDialogOpen = true;
      state.selectedDish = action.payload;
      state.quantity = 1;
      state.remarks = '';
    },
    
    closeAddToCartDialog: (state) => {
      state.addToCartDialogOpen = false;
      state.selectedDish = null;
      state.quantity = 1;
      state.remarks = '';
    },
    
    openOrderHistory: (state) => {
      state.orderHistoryOpen = true;
    },
    
    closeOrderHistory: (state) => {
      state.orderHistoryOpen = false;
    },
    
    openPaymentDialog: (state) => {
      state.paymentDialogOpen = true;
    },
    
    closePaymentDialog: (state) => {
      state.paymentDialogOpen = false;
    },
    
    openFeedbackDialog: (state) => {
      state.feedbackDialogOpen = true;
    },
    
    closeFeedbackDialog: (state) => {
      state.feedbackDialogOpen = false;
    },
    
    // Quantity and remarks
    setQuantity: (state, action) => {
      state.quantity = Math.max(1, action.payload);
    },
    
    incrementQuantity: (state) => {
      state.quantity += 1;
    },
    
    decrementQuantity: (state) => {
      state.quantity = Math.max(1, state.quantity - 1);
    },
    
    setRemarks: (state, action) => {
      state.remarks = action.payload;
    },
    
    // Snackbar actions
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'success',
      };
    },
    
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    
    // Loading states
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    // Error states
    setGlobalError: (state, action) => {
      state.globalError = action.payload;
    },
    
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Other UI states
    setLastPaidOrderId: (state, action) => {
      state.lastPaidOrderId = action.payload;
    },
    
    setLoyaltyDiscount: (state, action) => {
      state.loyaltyDiscount = action.payload;
    },
    
    setSelectionOfferDiscount: (state, action) => {
      state.selectionOfferDiscount = action.payload;
    },
    
    // Reset UI state
    resetUIState: (state) => {
      state.cartDialogOpen = false;
      state.addToCartDialogOpen = false;
      state.orderHistoryOpen = false;
      state.paymentDialogOpen = false;
      state.feedbackDialogOpen = false;
      state.selectedDish = null;
      state.quantity = 1;
      state.remarks = '';
      state.snackbar.open = false;
      state.globalLoading = false;
      state.globalError = null;
    },
  },
});

export const {
  openCartDialog,
  closeCartDialog,
  openAddToCartDialog,
  closeAddToCartDialog,
  openOrderHistory,
  closeOrderHistory,
  openPaymentDialog,
  closePaymentDialog,
  openFeedbackDialog,
  closeFeedbackDialog,
  setQuantity,
  incrementQuantity,
  decrementQuantity,
  setRemarks,
  showSnackbar,
  hideSnackbar,
  setGlobalLoading,
  setGlobalError,
  clearGlobalError,
  setLastPaidOrderId,
  setLoyaltyDiscount,
  setSelectionOfferDiscount,
  resetUIState,
} = uiSlice.actions;

// Selectors
export const selectCartDialogOpen = (state) => state.ui.cartDialogOpen;
export const selectAddToCartDialogOpen = (state) => state.ui.addToCartDialogOpen;
export const selectOrderHistoryOpen = (state) => state.ui.orderHistoryOpen;
export const selectPaymentDialogOpen = (state) => state.ui.paymentDialogOpen;
export const selectFeedbackDialogOpen = (state) => state.ui.feedbackDialogOpen;
export const selectSelectedDish = (state) => state.ui.selectedDish;
export const selectQuantity = (state) => state.ui.quantity;
export const selectRemarks = (state) => state.ui.remarks;
export const selectSnackbar = (state) => state.ui.snackbar;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectGlobalError = (state) => state.ui.globalError;
export const selectLastPaidOrderId = (state) => state.ui.lastPaidOrderId;
export const selectLoyaltyDiscount = (state) => state.ui.loyaltyDiscount;
export const selectSelectionOfferDiscount = (state) => state.ui.selectionOfferDiscount;

export default uiSlice.reducer;
