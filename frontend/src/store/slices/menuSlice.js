import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customerService } from '../../services/api';

// Async thunks for API calls
export const fetchMenu = createAsyncThunk(
  'menu/fetchMenu',
  async (category = null, { rejectWithValue }) => {
    try {
      const data = await customerService.getMenu(category);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch menu');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'menu/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const data = await customerService.getCategories();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch categories');
    }
  }
);

export const fetchSpecials = createAsyncThunk(
  'menu/fetchSpecials',
  async (_, { rejectWithValue }) => {
    try {
      const data = await customerService.getSpecials();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch specials');
    }
  }
);

export const fetchOffers = createAsyncThunk(
  'menu/fetchOffers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await customerService.getOffers();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch offers');
    }
  }
);

const initialState = {
  dishes: [],
  categories: ['All'],
  specials: [],
  offers: [],
  currentCategory: 'All',
  filteredDishes: [],
  loading: false,
  categoriesLoading: false,
  specialsLoading: false,
  offersLoading: false,
  error: null,
  lastFetched: null,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
      menuSlice.caseReducers.filterDishes(state);
    },

    filterDishes: (state) => {
      if (state.currentCategory === 'All') {
        state.filteredDishes = state.dishes;
      } else {
        state.filteredDishes = state.dishes.filter(
          dish => dish.category === state.currentCategory
        );
      }
    },

    clearError: (state) => {
      state.error = null;
    },

    invalidateCache: (state) => {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Menu
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.dishes = action.payload;
        state.lastFetched = Date.now();
        menuSlice.caseReducers.filterDishes(state);
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = ['All', ...action.payload];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload;
      });

    // Fetch Specials
    builder
      .addCase(fetchSpecials.pending, (state) => {
        state.specialsLoading = true;
      })
      .addCase(fetchSpecials.fulfilled, (state, action) => {
        state.specialsLoading = false;
        state.specials = action.payload;
      })
      .addCase(fetchSpecials.rejected, (state, action) => {
        state.specialsLoading = false;
        state.error = action.payload;
      });

    // Fetch Offers
    builder
      .addCase(fetchOffers.pending, (state) => {
        state.offersLoading = true;
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.offersLoading = false;
        state.offers = action.payload;
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        state.offersLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentCategory,
  filterDishes,
  clearError,
  invalidateCache,
} = menuSlice.actions;

// Selectors
export const selectDishes = (state) => state.menu.dishes;
export const selectFilteredDishes = (state) => state.menu.filteredDishes;
export const selectCategories = (state) => state.menu.categories;
export const selectCurrentCategory = (state) => state.menu.currentCategory;
export const selectSpecials = (state) => state.menu.specials;
export const selectOffers = (state) => state.menu.offers;
export const selectMenuLoading = (state) => state.menu.loading;
export const selectCategoriesLoading = (state) => state.menu.categoriesLoading;
export const selectSpecialsLoading = (state) => state.menu.specialsLoading;
export const selectOffersLoading = (state) => state.menu.offersLoading;
export const selectMenuError = (state) => state.menu.error;
export const selectLastFetched = (state) => state.menu.lastFetched;

export default menuSlice.reducer;
