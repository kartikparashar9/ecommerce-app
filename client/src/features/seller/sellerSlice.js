import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createSellerApi,
  getMySellerApi,
  updateMySellerApi,
  getMyProductsApi,
  getSellerOrdersApi,
} from "./sellerApi";

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (typeof message === "string") return message;
  if (Array.isArray(error?.response?.data?.errors)) {
    return error.response.data.errors
      .map((item) => item?.msg || item?.message)
      .filter(Boolean)
      .join(" | ");
  }

  return error?.response?.data?.error || error?.message || fallback;
};

const isSellerObject = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      value._id &&
      (value.businessName || value.verificationStatus),
  );

const extractSeller = (response) => {
  if (!response || typeof response !== "object") return null;

  // Backend ApiResponse: response.data = Seller
  if (isSellerObject(response.data)) return response.data;

  // Defensive support for older wrappers.
  if (isSellerObject(response.seller)) return response.seller;
  if (isSellerObject(response.data?.seller)) return response.data.seller;

  return isSellerObject(response) ? response : null;
};

const extractCollection = (response, key) => {
  if (!response || typeof response !== "object") {
    return { items: [], pagination: null };
  }

  const payload = response.data ?? response;
  const nested = payload?.data ?? payload;

  return {
    items: Array.isArray(payload?.[key])
      ? payload[key]
      : Array.isArray(nested?.[key])
        ? nested[key]
        : Array.isArray(payload)
          ? payload
          : [],
    pagination:
      payload?.pagination ?? nested?.pagination ?? null,
  };
};

export const fetchMySellerProfile = createAsyncThunk(
  "seller/fetchMySellerProfile",
  async ({ force = false } = {}, { rejectWithValue }) => {
    try {
      const response = await getMySellerApi();
      const seller = extractSeller(response);

      if (!seller) {
        return rejectWithValue({
          status: 502,
          message: "Seller profile response is invalid.",
          isNotFound: false,
        });
      }

      return seller;
    } catch (error) {
      const status = error?.response?.status;

      return rejectWithValue({
        status,
        message: getErrorMessage(error, "Failed to fetch seller profile"),
        isNotFound: status === 404,
      });
    }
  },
  {
    condition: ({ force = false } = {}, { getState }) => {
      if (force) return true;

      const seller = getState()?.seller;
      return !seller?.profileLoading && !seller?.profileFetched;
    },
  },
);

export const createSellerProfile = createAsyncThunk(
  "seller/createSellerProfile",
  async (sellerData, { rejectWithValue }) => {
    try {
      const response = await createSellerApi(sellerData);
      const seller = extractSeller(response);

      if (!seller) {
        return rejectWithValue("Seller profile response is invalid.");
      }

      return seller;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to create seller profile"),
      );
    }
  },
);

export const updateSellerProfile = createAsyncThunk(
  "seller/updateSellerProfile",
  async (sellerData, { rejectWithValue }) => {
    try {
      const response = await updateMySellerApi(sellerData);
      const seller = extractSeller(response);

      if (!seller) {
        return rejectWithValue("Seller profile response is invalid.");
      }

      return seller;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update seller profile"),
      );
    }
  },
);

export const fetchSellerProducts = createAsyncThunk(
  "seller/fetchSellerProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await getMyProductsApi(params);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch seller products"),
      );
    }
  },
);

export const fetchSellerOrders = createAsyncThunk(
  "seller/fetchSellerOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getSellerOrdersApi(params);
      const { items, pagination } = extractCollection(response, "orders");

      return {
        orders: items,
        pagination,
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch seller orders"),
      );
    }
  },
);

const initialState = {
  profile: null,
  hasProfile: false,
  profileFetched: false,
  profileLoading: false,

  products: [],
  productsPagination: null,
  productsLoading: false,

  orders: [],
  ordersPagination: null,
  ordersLoading: false,

  error: null,
  successMessage: null,
};

const sellerSlice = createSlice({
  name: "seller",
  initialState,

  reducers: {
    clearSellerErrors: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    orderUpdatedLocally: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.orders.findIndex((order) => order._id === updatedOrder?._id);

      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }
    },

    resetSellerState: () => ({ ...initialState }),
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMySellerProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchMySellerProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profileFetched = true;
        state.profile = action.payload;
        state.hasProfile = true;
        state.error = null;
      })
      .addCase(fetchMySellerProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileFetched = true;

        if (action.payload?.isNotFound) {
          state.profile = null;
          state.hasProfile = false;
          state.error = null;
          return;
        }

        state.error =
          action.payload?.message || "Failed to fetch seller profile";
      })

      .addCase(createSellerProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createSellerProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profileFetched = true;
        state.profile = action.payload;
        state.hasProfile = true;
        state.error = null;
        state.successMessage =
          "Seller business profile created successfully.";
      })
      .addCase(createSellerProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload || "Failed to create seller profile";
      })

      .addCase(updateSellerProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateSellerProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profileFetched = true;
        state.profile = action.payload;
        state.hasProfile = true;
        state.error = null;
        state.successMessage = "Business profile updated successfully.";
      })
      .addCase(updateSellerProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload || "Failed to update seller profile";
      })

      .addCase(fetchSellerProducts.pending, (state) => {
        state.productsLoading = true;
        state.error = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.productsLoading = false;
        const { items, pagination } = extractCollection(
          action.payload,
          "products",
        );
        state.products = items;
        state.productsPagination = pagination;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.productsLoading = false;
        state.error = action.payload || "Failed to fetch seller products";
      })

      .addCase(fetchSellerOrders.pending, (state) => {
        state.ordersLoading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload.orders;
        state.ordersPagination = action.payload.pagination;
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.error = action.payload || "Failed to fetch seller orders";
      });
  },
});

export const { clearSellerErrors, orderUpdatedLocally, resetSellerState } = sellerSlice.actions;

export default sellerSlice.reducer;
