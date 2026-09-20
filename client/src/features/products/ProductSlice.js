import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getProductsApi, getProductBySlugApi } from "./ProductApi";

const firstFiniteNumber = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
};

const normalizeImage = (image) => {
  if (typeof image === "string" && image.trim()) return image.trim();
  if (image && typeof image === "object") {
    return image.url || image.secure_url || image.path || image.src || "";
  }
  return "";
};

export const normalizeProduct = (product) => {
  if (!product || typeof product !== "object") return null;

  const category =
    product.category && typeof product.category === "object"
      ? product.category
      : null;

  const brand =
    product.brand && typeof product.brand === "object"
      ? product.brand
      : null;

  const rawImages = Array.isArray(product.images)
    ? product.images
    : product.image
      ? [product.image]
      : [];

  const images = rawImages.map(normalizeImage).filter(Boolean);

  const variants = Array.isArray(product.variants)
    ? product.variants.filter(Boolean)
    : [];

  const displayVariant =
    variants.find(
      (variant) =>
        variant &&
        variant.isActive !== false &&
        Number(variant.stock) > 0,
    ) ||
    variants.find((variant) => variant && variant.isActive !== false) ||
    null;

  // Variant price is the MRP. Product.discount is applied to that MRP
  // so the frontend follows the same pricing contract as the backend.
  const basePrice = firstFiniteNumber(
    displayVariant?.price,
    product.basePrice,
    product.mrp,
    product.originalPrice,
    product.oldPrice,
    product.price,
  );

  const discount = Math.min(
    Math.max(firstFiniteNumber(product.discount, 0), 0),
    100,
  );

  const productDiscount = Math.round(((basePrice * discount) / 100) * 100) / 100;
  const finalPrice = Math.max(0, Math.round((basePrice - productDiscount) * 100) / 100);

  const averageRating = firstFiniteNumber(
    product.averageRating,
    product.rating,
  );

  const totalReviews = firstFiniteNumber(
    product.totalReviews,
    product.ratingCount,
    product.reviewCount,
  );

  const totalStock = firstFiniteNumber(
    product.totalStock,
    product.stock,
    product.quantity,
  );

  const totalSold = firstFiniteNumber(
    product.totalSold,
    product.soldCount,
  );

  const description =
    typeof product.description === "string" && product.description.trim()
      ? product.description.trim()
      : typeof product.shortDescription === "string"
        ? product.shortDescription.trim()
        : "";

  const shortDescription =
    typeof product.shortDescription === "string" &&
    product.shortDescription.trim()
      ? product.shortDescription.trim()
      : description;

  return {
    ...product,
    id: product._id ? String(product._id) : "",
    _id: product._id ? String(product._id) : "",
    slug:
      typeof product.slug === "string" && product.slug.trim()
        ? product.slug.trim()
        : "",
    images,
    image: images[0] || "",
    description,
    shortDescription,
    finalPrice,
    basePrice,
    discount,
    price: finalPrice,
    oldPrice: basePrice,
    mrp: basePrice,
    sellingPrice: finalPrice,
    averageRating: Math.min(Math.max(averageRating, 0), 5),
    totalReviews: Math.max(totalReviews, 0),
    rating: Math.min(Math.max(averageRating, 0), 5),
    ratingCount: Math.max(totalReviews, 0),
    totalStock: Math.max(totalStock, 0),
    totalSold: Math.max(totalSold, 0),
    stock: Math.max(totalStock, 0),
    soldCount: Math.max(totalSold, 0),
    variants,
    categoryName:
      category?.name ||
      (typeof product.category === "string" ? product.category : ""),
    categoryId:
      category?._id ||
      (typeof product.category === "string" ? product.category : ""),
    brandName:
      brand?.name || (typeof product.brand === "string" ? product.brand : ""),
    brandId:
      brand?._id ||
      (typeof product.brand === "string" ? product.brand : ""),
  };
};

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const result = await getProductsApi(params);
      const products = (Array.isArray(result?.products) ? result.products : [])
        .map(normalizeProduct)
        .filter(Boolean);

      return {
        products,
        pagination: result?.pagination || null,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load products",
      );
    }
  },
);

export const fetchProductBySlug = createAsyncThunk(
  "products/fetchProductBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      if (!slug?.trim()) throw new Error("Product slug is required");

      const product = normalizeProduct(await getProductBySlugApi(slug));
      if (!product) throw new Error("Product not found");

      return product;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load product",
      );
    }
  },
);

const initialState = {
  items: [],
  currentProduct: null,
  pagination: {
    currentPage: 1,
    limit: 20,
    totalProducts: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  loading: false,
  currentLoading: false,
  error: null,
  currentError: null,
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.currentError = null;
      state.currentLoading = false;
    },
    clearProductError: (state) => {
      state.error = null;
      state.currentError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductBySlug.pending, (state) => {
        state.currentLoading = true;
        state.currentError = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentError = action.payload;
      });
  },
});

export const { clearCurrentProduct, clearProductError } = productSlice.actions;

export const selectProducts = (state) => state.products?.items || [];
export const selectCurrentProduct = (state) =>
  state.products?.currentProduct || null;
export const selectProductsLoading = (state) =>
  Boolean(state.products?.loading);
export const selectCurrentProductLoading = (state) =>
  Boolean(state.products?.currentLoading);
export const selectProductsError = (state) => state.products?.error || null;
export const selectCurrentProductError = (state) =>
  state.products?.currentError || null;

export default productSlice.reducer;
