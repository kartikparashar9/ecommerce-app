import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCategoriesApi,
  getCategoryByIdApi,
  getSubcategoriesApi,
} from "./CategorieApi";

export const fetchCategories = createAsyncThunk(
  "categories/fetch",
  async (params, { rejectWithValue }) => {
    try {
      return await getCategoriesApi(params);
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message || "Unable to load categories",
      );
    }
  },
);
export const fetchCategoryById = createAsyncThunk(
  "categories/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await getCategoryByIdApi(id);
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message || "Unable to load category",
      );
    }
  },
);
export const fetchSubcategories = createAsyncThunk(
  "categories/fetchSubcategories",
  async (id, { rejectWithValue }) => {
    try {
      return await getSubcategoriesApi(id);
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message || "Unable to load subcategories",
      );
    }
  },
);

const slice = createSlice({
  name: "categories",
  initialState: {
    items: [],
    current: null,
    subcategories: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        const d = action.payload?.data ?? action.payload;
        state.items = Array.isArray(d) ? d : d?.categories || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.current = action.payload?.data ?? action.payload;
      })
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        const d = action.payload?.data ?? action.payload;
        state.subcategories = Array.isArray(d)
          ? d
          : d?.categories || d?.subcategories || [];
      }),
});

export const { clearCategoryError } = slice.actions;
export default slice.reducer;
