// src/redux/slices/wishlistSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';
import toast from 'react-hot-toast';

// GET wishlist from backend
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('api/wishlist/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ADD product to wishlist via backend
export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      await API.post(`api/wishlist/add/${productId}/`);
      // Re-fetch the full wishlist so state stays in sync with backend
      const response = await API.get('api/wishlist/');
      toast.success('Added to wishlist');
      return response.data;
    } catch (error) {
      toast.error('Failed to add to wishlist');
      return rejectWithValue(error.response?.data);
    }
  }
);

// REMOVE product from wishlist via backend
export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      await API.delete(`api/wishlist/remove/${productId}/`);
      toast.success('Removed from wishlist');
      return productId;
    } catch (error) {
      toast.error('Failed to remove from wishlist');
      return rejectWithValue(error.response?.data);
    }
  }
);

// Helper: extract products array from any backend response shape
const extractProducts = (data) => {
  if (!data) return [];
  // Backend returns { id, products: [...], created_at }
  if (Array.isArray(data.products)) return data.products;
  // Fallback shapes
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = extractProducts(action.payload);
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
      });

    // Add — backend re-fetched, replace items wholesale
    builder
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.items = extractProducts(action.payload);
      });

    // Remove — optimistic: filter out by id immediately
    builder
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default wishlistSlice.reducer;