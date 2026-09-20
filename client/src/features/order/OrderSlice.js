import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getOrdersApi,
  getOrderByIdApi,
  createOrderApi,
  cancelOrderApi,
} from "./OrderApi";

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const fetchOrders = createAsyncThunk(
  "orders/fetch",
  async (params, { rejectWithValue }) => {
    try {
      return await getOrdersApi(params);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to load orders"));
    }
  },
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchById",
  async (orderId, { rejectWithValue }) => {
    try {
      return await getOrderByIdApi(orderId);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to load order"));
    }
  },
);

export const placeOrder = createAsyncThunk(
  "orders/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createOrderApi(payload);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to place order"));
    }
  },
);

export const cancelOrder = createAsyncThunk(
  "orders/cancel",
  async ({ orderId, payload }, { rejectWithValue }) => {
    try {
      return await cancelOrderApi(orderId, payload);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to cancel order"));
    }
  },
);

const getData = (payload) => payload?.data ?? payload;

const slice = createSlice({
  name: "orders",
  initialState: {
    items: [],
    current: null,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const data = getData(action.payload);
        state.items = Array.isArray(data)
          ? data
          : data?.orders || [];
        state.pagination =
          action.payload?.pagination || data?.pagination || null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.current = getData(action.payload);
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.current = getData(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const updated = getData(action.payload);

        if (updated?._id) {
          state.items = state.items.map((order) =>
            String(order?._id) === String(updated._id)
              ? updated
              : order,
          );

          if (
            state.current?._id &&
            String(state.current._id) === String(updated._id)
          ) {
            state.current = updated;
          }
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError } = slice.actions;

export const selectOrders = (state) => state.orders?.items || [];
export const selectCurrentOrder = (state) => state.orders?.current || null;
export const selectOrderLoading = (state) => Boolean(state.orders?.loading);
export const selectOrderError = (state) => state.orders?.error || null;

export default slice.reducer;
