import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getBrandsApi } from "./BrandApi";

export const fetchBrands = createAsyncThunk("brands/fetch", async (params, { rejectWithValue }) => {
  try { return await getBrandsApi(params); }
  catch (e) { return rejectWithValue(e?.response?.data?.message || "Unable to load brands"); }
});

const slice = createSlice({
  name: "brands",
  initialState: { items: [], pagination: null, loading: false, error: null },
  reducers: { clearBrandError: (state) => { state.error = null; } },
  extraReducers: (builder) => builder
    .addCase(fetchBrands.pending, (state) => { state.loading = true; state.error = null; })
    .addCase(fetchBrands.fulfilled, (state, action) => {
      state.loading = false;
      const d = action.payload?.data ?? action.payload;
      state.items = Array.isArray(d) ? d : d?.brands || [];
      state.pagination = action.payload?.pagination || d?.pagination || null;
    })
    .addCase(fetchBrands.rejected, (state, action) => { state.loading = false; state.error = action.payload; }),
});

export const { clearBrandError } = slice.actions;
export default slice.reducer;
