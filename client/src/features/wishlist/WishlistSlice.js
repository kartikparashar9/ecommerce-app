import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
} from "./WishlistApi";
import { getProductByIdApi } from "../products/ProductApi";
import { normalizeProduct } from "../products/ProductSlice";

const unwrap = (value) => value?.data ?? value;

const getItems = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  return data?.items || data?.wishlist?.items || [];
};

const getProductId = (item) =>
  item?.product?._id ||
  item?.product?.id ||
  item?.productId ||
  (typeof item?.product === "string" ? item.product : null) ||
  (item?._id && !item?.createdAt ? item._id : null);

const hydrateWishlistItems = async (items) =>
  Promise.all(
    items.map(async (item) => {
      if (!item) return item;

      const existing =
        item.product && typeof item.product === "object"
          ? normalizeProduct(item.product)
          : null;

      if (existing?.name && (existing.image || existing.images?.length)) {
        return { ...item, product: existing };
      }

      const productId = getProductId(item);
      if (!productId) return item;

      try {
        const product = normalizeProduct(await getProductByIdApi(productId));
        return product ? { ...item, product } : item;
      } catch {
        return item;
      }
    }),
  );

const prepare = async (payload) => ({
  items: await hydrateWishlistItems(getItems(payload)),
});

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await prepare(await getWishlistApi());
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to load wishlist"));
    }
  },
);

export const addToWishlist = createAsyncThunk(
  "wishlist/add",
  async (payload, { dispatch, requestId, rejectWithValue }) => {
    const productId =
      typeof payload === "object" ? payload?.productId : payload;
    const product =
      typeof payload === "object" ? payload?.product : null;

    try {
      dispatch(
        optimisticAddWishlist({
          requestId,
          productId,
          product,
        }),
      );

      return await prepare(await addToWishlistApi(productId));
    } catch (error) {
      dispatch(rollbackAddWishlist(requestId));
      return rejectWithValue(
        getError(error, "Unable to add to wishlist"),
      );
    }
  },
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/remove",
  async (productId, { dispatch, requestId, rejectWithValue }) => {
    try {
      dispatch(optimisticRemoveWishlist({ requestId, productId }));
      await removeFromWishlistApi(productId);
      return productId;
    } catch (error) {
      dispatch(rollbackRemoveWishlist(requestId));
      return rejectWithValue(
        getError(error, "Unable to remove from wishlist"),
      );
    }
  },
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  optimistic: {},
};

const slice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
    optimisticAddWishlist: (state, action) => {
      const { requestId, productId, product } = action.payload;
      const exists = state.items.some(
        (item) => String(getProductId(item)) === String(productId),
      );
      if (exists) return;

      const item = {
        _id: `optimistic-${requestId}`,
        productId,
        product: product || null,
      };

      state.optimistic[requestId] = { type: "add", itemId: item._id };
      state.items.unshift(item);
    },
    rollbackAddWishlist: (state, action) => {
      const operation = state.optimistic[action.payload];
      if (!operation) return;
      state.items = state.items.filter(
        (item) => String(item?._id) !== String(operation.itemId),
      );
      delete state.optimistic[action.payload];
    },
    optimisticRemoveWishlist: (state, action) => {
      const { requestId, productId } = action.payload;
      const index = state.items.findIndex(
        (item) => String(getProductId(item)) === String(productId),
      );
      if (index < 0) return;

      state.optimistic[requestId] = {
        type: "remove",
        index,
        item: state.items[index],
      };
      state.items.splice(index, 1);
    },
    rollbackRemoveWishlist: (state, action) => {
      const operation = state.optimistic[action.payload];
      if (!operation || operation.type !== "remove") return;

      const exists = state.items.some(
        (item) =>
          String(getProductId(item)) ===
          String(getProductId(operation.item)),
      );
      if (!exists) {
        state.items.splice(
          Math.min(operation.index, state.items.length),
          0,
          operation.item,
        );
      }
      delete state.optimistic[action.payload];
    },
  },
  extraReducers: (builder) => {
    const setWishlist = (state, action) => {
      state.loading = false;
      state.error = null;
      state.items = action.payload?.items || [];
      state.optimistic = {};
    };

    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, setWishlist)
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, setWishlist)
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeFromWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.error = null;
        state.items = state.items.filter(
          (item) => String(getProductId(item)) !== String(action.payload),
        );
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearWishlistError,
  optimisticAddWishlist,
  rollbackAddWishlist,
  optimisticRemoveWishlist,
  rollbackRemoveWishlist,
} = slice.actions;

export default slice.reducer;
