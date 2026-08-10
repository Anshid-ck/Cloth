// src/redux/slices/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../api/cart';
import toast from 'react-hot-toast';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (data, { rejectWithValue }) => {
    try {
      const response = await cartAPI.addToCart(data);
      toast.success('Added to cart!');
      return response.data.cart;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add to cart');
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ item_id, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateCart(item_id, { quantity });
      return response.data;
    } catch (error) {
      toast.error('Failed to update cart');
      return rejectWithValue(error.response?.data);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (item_id, { rejectWithValue }) => {
    try {
      const response = await cartAPI.removeFromCart(item_id);
      toast.success('Removed from cart');
      return response.data;
    } catch (error) {
      toast.error('Failed to remove item');
      return rejectWithValue(error.response?.data);
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartAPI.clearCart();
      toast.success('Cart cleared');
      return { items: [], total_price: 0, total_quantity: 0 };
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// Import logout action to clear cart on logout
import { logout } from './authSlice';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0,
    quantity: 0,
    loading: false,
    error: null,
  },
  reducers: {
    // Reset cart state (used on logout)
    resetCart: (state) => {
      state.items = [];
      state.total = 0;
      state.quantity = 0;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total_price || 0;
        state.quantity = action.payload.total_quantity || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to load cart';
      });

    // Add to Cart
    builder
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.total = action.payload.total_price || 0;
        state.quantity = action.payload.total_quantity || 0;
      });

    // Update Cart Item
    builder
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.total = action.payload.total_price || 0;
        state.quantity = action.payload.total_quantity || 0;
      });

    // Remove from Cart
    builder
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.total = action.payload.total_price || 0;
        state.quantity = action.payload.total_quantity || 0;
      });

    // Clear Cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total_price || 0;
        state.quantity = action.payload.total_quantity || 0;
      })
      .addCase(clearCart.rejected, (state) => {
        state.loading = false;
        state.items = [];
        state.total = 0;
        state.quantity = 0;
      });

    // Clear cart on logout
    builder.addCase(logout.fulfilled, (state) => {
      state.items = [];
      state.total = 0;
      state.quantity = 0;
      state.loading = false;
      state.error = null;
    });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
