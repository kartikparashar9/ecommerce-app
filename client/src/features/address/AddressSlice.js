import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getAddressesApi,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
} from "./AddressApi";

// =====================================================
// RESPONSE NORMALIZERS
// =====================================================

const getAddressList = (payload) => {
  const resData = payload?.data ?? payload;

  if (Array.isArray(resData)) {
    return resData;
  }

  if (Array.isArray(resData?.addresses)) {
    return resData.addresses;
  }

  return [];
};

const getAddressObject = (payload) => {
  const resData = payload?.data ?? payload;

  if (resData?._id || resData?.id) {
    return resData;
  }

  if (resData?.address?._id || resData?.address?.id) {
    return resData.address;
  }

  return null;
};

// Helper to extract item ID safely
const getItemId = (item) => item?._id || item?.id;

// =====================================================
// FETCH ADDRESSES
// =====================================================

export const fetchAddresses = createAsyncThunk(
  "addresses/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await getAddressesApi();
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load addresses",
      );
    }
  },
);

// =====================================================
// CREATE ADDRESS
// =====================================================

export const createAddress = createAsyncThunk(
  "addresses/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createAddressApi(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create address",
      );
    }
  },
);

// =====================================================
// UPDATE ADDRESS
// =====================================================

export const updateAddress = createAsyncThunk(
  "addresses/update",
  async ({ addressId, payload }, { rejectWithValue }) => {
    try {
      return await updateAddressApi(addressId, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update address",
      );
    }
  },
);

// =====================================================
// DELETE ADDRESS
// =====================================================

export const deleteAddress = createAsyncThunk(
  "addresses/delete",
  async (addressId, { rejectWithValue }) => {
    try {
      await deleteAddressApi(addressId);
      return addressId;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete address",
      );
    }
  },
);

// =====================================================
// SET DEFAULT ADDRESS
// =====================================================

export const setDefaultAddress = createAsyncThunk(
  "addresses/default",
  async (addressId, { rejectWithValue }) => {
    try {
      return await setDefaultAddressApi(addressId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to set default address",
      );
    }
  },
);

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  items: [],
  loading: false,
  saving: false, // Added saving state for mutations
  error: null,
};

// =====================================================
// SLICE
// =====================================================

const slice = createSlice({
  name: "addresses",
  initialState,
  reducers: {
    clearAddressError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // =================================================
    // FETCH
    // =================================================
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = getAddressList(action.payload);
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load addresses";
      });

    // =================================================
    // CREATE
    // =================================================
    builder
      .addCase(createAddress.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.saving = false;
        const newAddress = getAddressObject(action.payload);

        if (!newAddress) return;

        if (newAddress.isDefault) {
          state.items.forEach((item) => {
            item.isDefault = false;
          });
        }

        state.items.push(newAddress);
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to create address";
      });

    // =================================================
    // UPDATE
    // =================================================
    builder
      .addCase(updateAddress.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.saving = false;
        const updatedAddress = getAddressObject(action.payload);
        const updatedId = getItemId(updatedAddress);

        if (!updatedId) return;

        // FIXED: Replaces address object AND manages default flag across items
        state.items = state.items.map((item) => {
          if (getItemId(item) === updatedId) {
            return updatedAddress;
          }
          return updatedAddress.isDefault
            ? { ...item, isDefault: false }
            : item;
        });
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to update address";
      });

    // =================================================
    // DELETE
    // =================================================
    builder
      .addCase(deleteAddress.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.items = state.items.filter(
          (item) => getItemId(item) !== deletedId,
        );
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.error = action.payload || "Unable to delete address";
      });

    // =================================================
    // SET DEFAULT
    // =================================================
    builder
      .addCase(setDefaultAddress.pending, (state) => {
        state.error = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        const address = getAddressObject(action.payload);
        const defaultId = getItemId(address) || action.meta?.arg;

        if (!defaultId) return;

        state.items.forEach((item) => {
          item.isDefault = getItemId(item) === defaultId;
        });
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.error = action.payload || "Unable to set default address";
      });
  },
});

export const { clearAddressError } = slice.actions;

export default slice.reducer;
