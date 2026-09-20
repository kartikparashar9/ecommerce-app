import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from "./CartApi";
import { getProductByIdApi } from "../products/ProductApi";
import { normalizeProduct } from "../products/ProductSlice";

const unwrap = (value) => value?.data ?? value;

const getCartData = (payload) => {
  const data = unwrap(payload);

  if (Array.isArray(data)) return { items: data, summary: null };

  if (data?.cart && typeof data.cart === "object") {
    return {
      items: Array.isArray(data.cart.items) ? data.cart.items : [],
      summary: data.summary || data.cart.summary || data.cart,
    };
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    summary: data?.summary || null,
  };
};

const getProductId = (item) =>
  item?.product?._id ||
  item?.product?.id ||
  item?.productId ||
  (typeof item?.product === "string" ? item.product : null);

const getItemId = (item) =>
  item?._id || item?.id || item?.cartItemId || null;

const sameProduct = (item, productId, variantId) => {
  const itemProductId = getProductId(item);
  const itemVariantId = item?.variantId || item?.variant?._id || null;

  return (
    String(itemProductId) === String(productId) &&
    String(itemVariantId || "") === String(variantId || "")
  );
};

const hydrateCartItems = async (items) =>
  Promise.all(
    items.map(async (item) => {
      if (!item) return item;

      const existingProduct =
        item.product && typeof item.product === "object"
          ? normalizeProduct(item.product)
          : null;

      if (
        existingProduct?.name &&
        (existingProduct.image || existingProduct.images?.length)
      ) {
        return { ...item, product: existingProduct };
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

const prepareCartResult = async (payload) => {
  const { items, summary } = getCartData(payload);
  return { items: await hydrateCartItems(items), summary };
};

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await prepareCartResult(await getCartApi());
    } catch (error) {
      return rejectWithValue(getError(error, "Unable to load cart"));
    }
  },
);

export const addToCart = createAsyncThunk(
  "cart/add",
  async (payload, { dispatch, requestId, rejectWithValue }) => {
    const productId = payload?.productId;
    const variantId = payload?.variantId || null;

    try {
      dispatch(
        optimisticAddItem({
          requestId,
          productId,
          variantId,
          quantity: Number(payload?.quantity) || 1,
          product: payload?.product || null,
        }),
      );

      return await prepareCartResult(await addToCartApi(payload));
    } catch (error) {
      dispatch(rollbackAddItem(requestId));
      return rejectWithValue(getError(error, "Unable to add item"));
    }
  },
);

export const updateCartItem = createAsyncThunk(
  "cart/update",
  async ({ itemId, payload }, { dispatch, requestId, rejectWithValue }) => {
    try {
      dispatch(
        optimisticUpdateQuantity({
          requestId,
          itemId,
          quantity: Number(payload?.quantity),
        }),
      );

      return await prepareCartResult(
        await updateCartItemApi(itemId, payload),
      );
    } catch (error) {
      dispatch(rollbackQuantityUpdate(requestId));
      return rejectWithValue(getError(error, "Unable to update cart"));
    }
  },
);

export const removeCartItem = createAsyncThunk(
  "cart/remove",
  async (itemId, { dispatch, requestId, rejectWithValue }) => {
    try {
      dispatch(optimisticRemoveItem({ requestId, itemId }));
      await removeCartItemApi(itemId);
      return itemId;
    } catch (error) {
      dispatch(rollbackRemoveItem(requestId));
      return rejectWithValue(getError(error, "Unable to remove item"));
    }
  },
);

export const clearCart = createAsyncThunk(
  "cart/clear",
  async (_, { dispatch, requestId, rejectWithValue }) => {
    try {
      dispatch(optimisticClearCart(requestId));
      await clearCartApi();
      return true;
    } catch (error) {
      dispatch(rollbackClearCart(requestId));
      return rejectWithValue(getError(error, "Unable to clear cart"));
    }
  },
);

const initialState = {
  items: [],
  summary: null,
  loading: false,
  error: null,
  optimistic: {},
};

const slice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    clearCartLocal: (state) => {
      state.items = [];
      state.summary = null;
      state.optimistic = {};
    },
    optimisticAddItem: (state, action) => {
      const {
        requestId,
        productId,
        variantId,
        quantity,
        product,
      } = action.payload;

      const existingIndex = state.items.findIndex((item) =>
        sameProduct(item, productId, variantId),
      );

      if (existingIndex >= 0) {
        const item = state.items[existingIndex];
        state.optimistic[requestId] = {
          type: "add-existing",
          itemId: getItemId(item),
          previousQuantity: Number(item.quantity) || 0,
        };
        item.quantity =
          (Number(item.quantity) || 0) + (Number(quantity) || 1);
        return;
      }

      const optimisticItem = {
        _id: `optimistic-${requestId}`,
        productId,
        product: product || null,
        variantId: variantId || undefined,
        quantity: Number(quantity) || 1,
        __optimisticRequestId: requestId,
      };

      state.optimistic[requestId] = {
        type: "add-new",
        itemId: optimisticItem._id,
      };
      state.items.push(optimisticItem);
    },
    rollbackAddItem: (state, action) => {
      const operation = state.optimistic[action.payload];
      if (!operation) return;

      if (operation.type === "add-new") {
        state.items = state.items.filter(
          (item) => getItemId(item) !== operation.itemId,
        );
      } else if (operation.type === "add-existing") {
        const item = state.items.find(
          (currentItem) =>
            String(getItemId(currentItem)) === String(operation.itemId),
        );
        if (item) item.quantity = operation.previousQuantity;
      }

      delete state.optimistic[action.payload];
    },
    optimisticUpdateQuantity: (state, action) => {
      const { requestId, itemId, quantity } = action.payload;
      const item = state.items.find(
        (currentItem) =>
          String(getItemId(currentItem)) === String(itemId),
      );
      if (!item) return;

      state.optimistic[requestId] = {
        type: "update",
        itemId,
        previousQuantity: Number(item.quantity) || 0,
      };
      item.quantity = quantity;
    },
    rollbackQuantityUpdate: (state, action) => {
      const operation = state.optimistic[action.payload];
      if (!operation || operation.type !== "update") return;

      const item = state.items.find(
        (currentItem) =>
          String(getItemId(currentItem)) === String(operation.itemId),
      );
      if (item) item.quantity = operation.previousQuantity;

      delete state.optimistic[action.payload];
    },
    optimisticRemoveItem: (state, action) => {
      const { requestId, itemId } = action.payload;
      const index = state.items.findIndex(
        (item) => String(getItemId(item)) === String(itemId),
      );
      if (index < 0) return;

      state.optimistic[requestId] = {
        type: "remove",
        index,
        item: state.items[index],
      };
      state.items.splice(index, 1);
    },
    rollbackRemoveItem: (state, action) => {
      const operation = state.optimistic[action.payload];
      if (!operation || operation.type !== "remove") return;

      const alreadyPresent = state.items.some(
        (item) =>
          String(getItemId(item)) === String(getItemId(operation.item)),
      );
      if (!alreadyPresent) {
        state.items.splice(
          Math.min(operation.index, state.items.length),
          0,
          operation.item,
        );
      }

      delete state.optimistic[action.payload];
    },
    optimisticClearCart: (state, action) => {
      state.optimistic[action.payload] = {
        type: "clear",
        items: state.items,
        summary: state.summary,
      };
      state.items = [];
      state.summary = null;
    },
    rollbackClearCart: (state, action) => {
      const operation = state.optimistic[action.payload];
      if (!operation || operation.type !== "clear") return;

      state.items = operation.items;
      state.summary = operation.summary;
      delete state.optimistic[action.payload];
    },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      state.loading = false;
      state.error = null;
      state.items = action.payload?.items || [];
      state.summary = action.payload?.summary || null;
      state.optimistic = {};
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => {
        state.error = null;
      })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(updateCartItem.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeCartItem.pending, (state) => {
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.error = null;
        state.items = state.items.filter(
          (item) => String(getItemId(item)) !== String(action.payload),
        );
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(clearCart.pending, (state) => {
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.error = null;
        state.items = [];
        state.summary = null;
        state.optimistic = {};
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearCartError,
  clearCartLocal,
  optimisticAddItem,
  rollbackAddItem,
  optimisticUpdateQuantity,
  rollbackQuantityUpdate,
  optimisticRemoveItem,
  rollbackRemoveItem,
  optimisticClearCart,
  rollbackClearCart,
} = slice.actions;

export default slice.reducer;
