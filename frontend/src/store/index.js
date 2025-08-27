import { configureStore } from '@reduxjs/toolkit';
import cartSlice from './slices/cartSlice';
import menuSlice from './slices/menuSlice';
import orderSlice from './slices/orderSlice';
import uiSlice from './slices/uiSlice';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    cart: cartSlice,
    menu: menuSlice,
    orders: orderSlice,
    ui: uiSlice,
    auth: authSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
