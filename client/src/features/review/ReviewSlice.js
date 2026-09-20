import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getProductReviewsApi,
  createReviewApi,
  updateReviewApi,
  deleteReviewApi,
} from "./ReviewApi";

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetch",
  async ({ productId, params }, { rejectWithValue }) => {
    try {
      return await getProductReviewsApi(productId, params);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to load reviews"));
    }
  },
);

export const createReview = createAsyncThunk(
  "reviews/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createReviewApi(payload);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to create review"));
    }
  },
);

export const updateReview = createAsyncThunk(
  "reviews/update",
  async ({ reviewId, payload }, { rejectWithValue }) => {
    try {
      return await updateReviewApi(reviewId, payload);
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to update review"));
    }
  },
);

export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async (reviewId, { rejectWithValue }) => {
    try {
      await deleteReviewApi(reviewId);

      return reviewId;
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to delete review"));
    }
  },
);

const initialState = {
  items: [],
  pagination: null,
  loading: false,
  error: null,
};

const reviewSlice = createSlice({
  name: "reviews",

  initialState,

  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;

        const data = action.payload?.data ?? action.payload;

        state.items = Array.isArray(data)
          ? data
          : Array.isArray(data?.reviews)
            ? data.reviews
            : [];

        state.pagination =
          action.payload?.pagination || data?.pagination || null;
      })

      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createReview.fulfilled, (state, action) => {
        const review = action.payload?.data ?? action.payload;

        if (review) {
          state.items = [review, ...state.items];
        }
      })

      .addCase(createReview.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(updateReview.fulfilled, (state, action) => {
        const review = action.payload?.data ?? action.payload;

        if (!review?._id) {
          return;
        }

        state.items = state.items.map((item) =>
          String(item?._id) === String(review._id) ? review : item,
        );
      })

      .addCase(updateReview.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(deleteReview.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => String(item?._id) !== String(action.payload),
        );
      })

      .addCase(deleteReview.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearReviewError } = reviewSlice.actions;

export default reviewSlice.reducer;
