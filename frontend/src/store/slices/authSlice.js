import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tableNumber: null,
  uniqueId: null,
  userId: null,
  selectedHotel: localStorage.getItem('selectedHotel') || localStorage.getItem('selectedDatabase') || null,
  hotelPassword: localStorage.getItem('hotelPassword') || localStorage.getItem('databasePassword') || null,
  selectedDatabase: localStorage.getItem('selectedDatabase') || null, // Legacy support
  databasePassword: localStorage.getItem('databasePassword') || null, // Legacy support
  isAuthenticated: false,
  sessionId: localStorage.getItem('tabbleSessionId') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTableInfo: (state, action) => {
      const { tableNumber, uniqueId, userId } = action.payload;
      state.tableNumber = tableNumber;
      state.uniqueId = uniqueId;
      state.userId = userId;
      state.isAuthenticated = !!(tableNumber && uniqueId && userId);
    },

    setHotelInfo: (state, action) => {
      const { hotel, password } = action.payload;
      state.selectedHotel = hotel;
      state.hotelPassword = password;

      // Update localStorage
      if (hotel) {
        localStorage.setItem('selectedHotel', hotel);
      } else {
        localStorage.removeItem('selectedHotel');
      }

      if (password) {
        localStorage.setItem('hotelPassword', password);
      } else {
        localStorage.removeItem('hotelPassword');
      }
    },

    // Legacy method for backward compatibility
    setDatabaseInfo: (state, action) => {
      const { database, password } = action.payload;
      state.selectedDatabase = database;
      state.databasePassword = password;
      state.selectedHotel = database; // Map to hotel for compatibility
      state.hotelPassword = password;

      // Update localStorage
      if (database) {
        localStorage.setItem('selectedDatabase', database);
        localStorage.setItem('selectedHotel', database);
      } else {
        localStorage.removeItem('selectedDatabase');
        localStorage.removeItem('selectedHotel');
      }

      if (password) {
        localStorage.setItem('databasePassword', password);
        localStorage.setItem('hotelPassword', password);
      } else {
        localStorage.removeItem('databasePassword');
        localStorage.removeItem('hotelPassword');
      }
    },

    setSessionId: (state, action) => {
      state.sessionId = action.payload;
      if (action.payload) {
        localStorage.setItem('tabbleSessionId', action.payload);
      } else {
        localStorage.removeItem('tabbleSessionId');
      }
    },

    clearAuth: (state) => {
      state.tableNumber = null;
      state.uniqueId = null;
      state.userId = null;
      state.isAuthenticated = false;
    },

    clearDatabase: (state) => {
      state.selectedDatabase = null;
      state.databasePassword = null;
      localStorage.removeItem('selectedDatabase');
      localStorage.removeItem('databasePassword');
      localStorage.removeItem('tabbleDatabaseSelected');
    },

    logout: (state) => {
      state.tableNumber = null;
      state.uniqueId = null;
      state.userId = null;
      state.selectedDatabase = null;
      state.databasePassword = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('selectedDatabase');
      localStorage.removeItem('databasePassword');
      localStorage.removeItem('tabbleDatabaseSelected');
      localStorage.removeItem('tabbleSessionId');
    },
  },
});

export const {
  setTableInfo,
  setHotelInfo,
  setDatabaseInfo,
  setSessionId,
  clearAuth,
  clearDatabase,
  logout,
} = authSlice.actions;

// Selectors
export const selectTableNumber = (state) => state.auth.tableNumber;
export const selectUniqueId = (state) => state.auth.uniqueId;
export const selectUserId = (state) => state.auth.userId;
export const selectSelectedDatabase = (state) => state.auth.selectedDatabase;
export const selectDatabasePassword = (state) => state.auth.databasePassword;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectSessionId = (state) => state.auth.sessionId;

export default authSlice.reducer;
