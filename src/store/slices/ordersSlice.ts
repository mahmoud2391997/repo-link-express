
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Order, getOrders, createOrder, updateOrder, deleteOrder } from '@/services/supabaseService';

interface OrdersState {
  orders: any[];
  loading: boolean;
  error: string | null;
  filter: string | null;
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
  filter: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (status?: string) => {
    const orders = await getOrders(status);
    return orders;
  }
);

export const addOrder = createAsyncThunk(
  'orders/addOrder',
  async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    const newOrder = await createOrder(orderData);
    return newOrder;
  }
);

export const editOrder = createAsyncThunk(
  'orders/editOrder',
  async (params: { id: string; updates: Partial<Order> }) => {
    const { id, updates } = params;
    const updatedOrder = await updateOrder(id, updates);
    return updatedOrder;
  }
);

export const removeOrder = createAsyncThunk('orders/removeOrder', async (id: string) => {
  await deleteOrder(id);
  return id;
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      // Add order
      .addCase(addOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      // Edit order
      .addCase(editOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      // Remove order
      .addCase(removeOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter(order => order.id !== action.payload);
      });
  },
});

export const { setFilter, clearError } = ordersSlice.actions;
export default ordersSlice.reducer;
