// src/store/slices/appSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from '../../types';
import {
  fetchVehicles,
  fetchDrivers,
  fetchMills,
  fetchTrips,
  fetchCollections
} from '../../services/api';

// Async thunks for data fetching
export const loadVehicles = createAsyncThunk(
  'app/loadVehicles',
  async (_, { getState }) => {
    const state = getState() as { auth: { user: any } };
    const user = state.auth.user;
    const millId = user?.role === 'client' ? user.millId : undefined;
    const response = await fetchVehicles(1, 1000, millId);
    return response.data;
  }
);

export const loadDrivers = createAsyncThunk(
  'app/loadDrivers',
  async () => {
    const response = await fetchDrivers(1, 1000);
    return response.data;
  }
);

export const loadMills = createAsyncThunk(
  'app/loadMills',
  async (_, { getState }) => {
    const state = getState() as { auth: { user: any } };
    const user = state.auth.user;
    const millId = user?.role === 'client' ? user.millId : undefined;
    
    if (millId) {
      // For clients, we only return their specific mill
      const response = await fetchMills(1, 1000);
      return response.data.filter(mill => mill.id === millId);
    }
    
    const response = await fetchMills(1, 1000);
    return response.data;
  }
);

export const loadTrips = createAsyncThunk(
  'app/loadTrips',
  async (_, { getState }) => {
    const state = getState() as { auth: { user: any } };
    const user = state.auth.user;
    const millId = user?.role === 'client' ? user.millId : undefined;
    const response = await fetchTrips(1, 1000, millId);
    return response.data;
  }
);

export const loadCollections = createAsyncThunk(
  'app/loadCollections',
  async (_, { getState }) => {
    const state = getState() as { auth: { user: any } };
    const user = state.auth.user;
    const millId = user?.role === 'client' ? user.millId : undefined;
    const response = await fetchCollections(1, 1000, millId);
    return response.data;
  }
);

const initialState: AppState = {
  vehicles: [],
  drivers: [],
  mills: [],
  trips: [],
  collections: [],
  loading: false,
  error: null
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load vehicles
      .addCase(loadVehicles.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadVehicles.fulfilled, (state, action) => {
        state.vehicles = action.payload;
        state.loading = false;
      })
      .addCase(loadVehicles.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to load vehicles';
        state.loading = false;
      })
      // Load drivers
      .addCase(loadDrivers.fulfilled, (state, action) => {
        state.drivers = action.payload;
      })
      // Load mills
      .addCase(loadMills.fulfilled, (state, action) => {
        state.mills = action.payload;
      })
      // Load trips
      .addCase(loadTrips.fulfilled, (state, action) => {
        state.trips = action.payload;
      })
      // Load collections
      .addCase(loadCollections.fulfilled, (state, action) => {
        state.collections = action.payload;
      });
  }
});

export const { setLoading, setError, clearError } = appSlice.actions;
export default appSlice.reducer;