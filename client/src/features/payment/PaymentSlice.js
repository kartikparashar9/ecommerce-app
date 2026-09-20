import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createPaymentOrderApi,
  verifyPaymentApi,
  getPaymentByOrderApi,
} from "./PaymentApi";

// =====================================================
// HELPERS
// =====================================================

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const getData = (payload) => payload?.data ?? payload;

// =====================================================
// CREATE PAYMENT ORDER
// =====================================================

export const createPaymentOrder = createAsyncThunk(
  "payment/createOrder",
  async (payload, { rejectWithValue }) => {
    try {
      return await createPaymentOrderApi(payload);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to create payment order"));
    }
  },
);

// =====================================================
// VERIFY PAYMENT
// =====================================================

export const verifyPayment = createAsyncThunk(
  "payment/verify",
  async (payload, { rejectWithValue }) => {
    try {
      return await verifyPaymentApi(payload);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to verify payment"));
    }
  },
);

// =====================================================
// GET PAYMENT BY ORDER
// =====================================================

export const fetchPaymentByOrder = createAsyncThunk(
  "payment/fetchByOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      return await getPaymentByOrderApi(orderId);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to load payment"));
    }
  },
);

// =====================================================
// SLICE
// =====================================================

const slice = createSlice({
  name: "payment",

  initialState: {
    payment: null,
    loading: false,
    error: null,
    success: false,
  },

  reducers: {
    clearPaymentState: (state) => {
      state.payment = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },

  extraReducers: (builder) => {
    builder

      // -----------------------------------------------
      // CREATE PAYMENT
      // -----------------------------------------------

      .addCase(createPaymentOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.payment = getData(action.payload);
      })

      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // -----------------------------------------------
      // VERIFY
      // -----------------------------------------------

      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.payment = getData(action.payload);
      })

      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // -----------------------------------------------
      // PAYMENT BY ORDER
      // -----------------------------------------------

      .addCase(fetchPaymentByOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPaymentByOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.payment = getData(action.payload);
      })

      .addCase(fetchPaymentByOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentState } = slice.actions;

export default slice.reducer;
