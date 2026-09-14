import API from "../../api/Api";

// ApiResponse from the backend is:
// { success, statusCode, message, data }
const unwrap = (axiosResponse) => axiosResponse?.data ?? null;

// =====================================================
// SELLER PROFILE
// =====================================================

export const createSellerApi = async (sellerData) =>
  unwrap(await API.post("/seller", sellerData));

export const getMySellerApi = async () => unwrap(await API.get("/seller/me"));

export const updateMySellerApi = async (sellerData) =>
  unwrap(await API.put("/seller/me", sellerData));

export const deleteMySellerApi = async () =>
  unwrap(await API.delete("/seller/me"));

// =====================================================
// SELLER PRODUCTS
// =====================================================

export const getMyProductsApi = async (params = {}) =>
  unwrap(await API.get("/products/seller/my-products", { params }));

export const getSellerCategoriesApi = async () =>
  unwrap(await API.get("/products/seller/categories"));

export const getSellerSubcategoriesApi = async (categoryId) =>
  unwrap(
    await API.get(`/products/seller/categories/${categoryId}/subcategories`),
  );

export const getSellerBrandsApi = async () =>
  unwrap(await API.get("/products/seller/brands"));

export const createProductApi = async (productData) =>
  unwrap(await API.post("/products", productData));

export const updateProductApi = async (productId, productData) =>
  unwrap(await API.put(`/products/${productId}`, productData));

// =====================================================
// PRODUCT IMAGES
// =====================================================

export const uploadProductImagesApi = async (productId, images = []) => {
  const formData = new FormData();

  images.forEach((image) => {
    formData.append("images", image);
  });

  return unwrap(await API.post(`/products/${productId}/images`, formData));
};

export const deleteProductImageApi = async (productId, image) =>
  unwrap(
    await API.delete(`/products/${productId}/images`, {
      data: { image },
    }),
  );

export const setPrimaryProductImageApi = async (productId, image) =>
  unwrap(await API.patch(`/products/${productId}/images/primary`, { image }));

// =====================================================
// PRODUCT STATUS
// =====================================================

export const toggleProductStatusApi = async (productId) =>
  unwrap(await API.patch(`/products/${productId}/toggle-status`));

export const deleteProductApi = async (productId) =>
  unwrap(await API.delete(`/products/${productId}`));

// =====================================================
// SELLER ORDERS
// =====================================================

export const getSellerOrdersApi = async (params = {}) =>
  unwrap(await API.get("/seller/orders", { params }));

export const getSellerOrderByIdApi = async (orderId) =>
  unwrap(await API.get(`/seller/orders/${orderId}`));

export const updateSellerOrderStatusApi = async (orderId, status) =>
  unwrap(await API.patch(`/seller/orders/${orderId}/status`, { status }));
