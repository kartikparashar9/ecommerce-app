import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCheckoutSummaryApi,
  validateCheckoutApi,
} from "./CheckoutApi";

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const fetchCheckoutSummary = createAsyncThunk(
  "checkout/summary",
  async (payload, { rejectWithValue }) => {
    try {
      return await getCheckoutSummaryApi(payload);
    } catch (error) {
      return rejectWithValue(
        getError(error, "Unable to load checkout"),
      );
    }
  },
);

export const validateCheckout = createAsyncThunk(
  "checkout/validate",
  async (payload, { rejectWithValue }) => {
    try {
      return await validateCheckoutApi(payload);
    } catch (error) {
      return rejectWithValue(
        getError(error, "Unable to validate checkout"),
      );
    }
  },
);

const initialState = {
  summary: null,
  validation: null,
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    clearCheckoutError: (state) => {
      state.error = null;
    },
    clearCheckoutState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCheckoutSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCheckoutSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.summary = action.payload?.data ?? action.payload;
      })
      .addCase(fetchCheckoutSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(validateCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.validation = null;
      })
      .addCase(validateCheckout.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.validation = action.payload?.data ?? action.payload;
      })
      .addCase(validateCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCheckoutError,
  clearCheckoutState,
} = slice.actions;

export default slice.reducer;
