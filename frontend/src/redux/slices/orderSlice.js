// src/redux/slices/orderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../api/orders';
import toast from 'react-hot-toast';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrders();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'orders/fetchOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrder(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (data, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.createOrder(data);
      toast.success('Order created successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create order');
      return rejectWithValue(error.response?.data);
    }
  }
);

export const trackOrder = createAsyncThunk(
  'orders/trackOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.trackOrder(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.cancelOrder(id);
      toast.success('Order cancelled successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to cancel order');
      return rejectWithValue(error.response?.data);
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    currentOrder: null,
    tracking: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.results || action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to load orders';
      });

    // Fetch Single Order
    builder
      .addCase(fetchOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to load order';
      });

    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.order;
        state.orders.unshift(action.payload.order);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create order';
      });

    // Track Order
    builder
      .addCase(trackOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(trackOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.tracking = action.payload;
      })
      .addCase(trackOrder.rejected, (state) => {
        state.loading = false;
      });

    // Cancel Order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentOrder) {
          state.currentOrder.status = 'cancelled';
        }
        const orderIndex = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'cancelled';
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to cancel order';
      });
  },
});

export default orderSlice.reducer;
