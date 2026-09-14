import API from "../../api/Api";

// =====================================================
// RESPONSE NORMALIZER
// =====================================================

const normalizeResponse = (response) => {
  const body = response?.data ?? {};

  const actualData =
    body?.data !== undefined && typeof body.data !== "string"
      ? body.data
      : body?.message && typeof body.message === "object"
        ? body.message
        : (body?.data ?? null);

  return {
    ...response,
    data: {
      ...body,
      data: actualData,
    },
  };
};

// =====================================================
// REQUEST HELPER
// =====================================================

const request = async (promise) => {
  return normalizeResponse(await promise);
};

// =====================================================
// ADMIN DASHBOARD
// =====================================================

export const getAdminDashboard = async () => {
  return request(API.get("/admin/dashboard"));
};

export const getDashboardOverview = async () => {
  return request(API.get("/admin/analytics/dashboard"));
};

// =====================================================
// ADMIN USERS
// =====================================================

export const getAllUsers = async (params = {}) => {
  return request(
    API.get("/admin/users", {
      params,
    }),
  );
};

export const getUserById = async (userId) => {
  return request(API.get(`/admin/users/${userId}`));
};

export const updateUser = async (userId, userData) => {
  return request(
    API.put(`/admin/users/${userId}`, userData),
  );
};

export const blockUser = async (userId) => {
  return request(
    API.patch(`/admin/users/${userId}/block`),
  );
};

export const unblockUser = async (userId) => {
  return request(
    API.patch(`/admin/users/${userId}/unblock`),
  );
};

export const deleteUser = async (userId) => {
  return request(
    API.delete(`/admin/users/${userId}`),
  );
};

// =====================================================
// ADMIN SELLERS
// =====================================================

export const getAllSellers = async (params = {}) => {
  return request(
    API.get("/seller/admin/all", {
      params,
    }),
  );
};

export const getSellerById = async (sellerId) => {
  return request(
    API.get(`/seller/admin/${sellerId}`),
  );
};

export const approveSeller = async (sellerId) => {
  return request(
    API.patch(`/seller/admin/${sellerId}/approve`),
  );
};

export const rejectSeller = async (
  sellerId,
  rejectionData = {},
) => {
  return request(
    API.patch(
      `/seller/admin/${sellerId}/reject`,
      rejectionData,
    ),
  );
};

export const activateSeller = async (sellerId) => {
  return request(
    API.patch(`/seller/admin/${sellerId}/activate`),
  );
};

export const deactivateSeller = async (sellerId) => {
  return request(
    API.patch(`/seller/admin/${sellerId}/deactivate`),
  );
};

export const blockSeller = async (
  sellerId,
  blockReason = "Blocked by administrator",
) => {
  return request(
    API.patch(
      `/seller/admin/${sellerId}/block`,
      {
        blockReason,
      },
    ),
  );
};

export const unblockSeller = async (sellerId) => {
  return request(
    API.patch(`/seller/admin/${sellerId}/unblock`),
  );
};

// =====================================================
// ADMIN PRODUCTS
// =====================================================

export const getAdminProducts = async (params = {}) => {
  return request(
    API.get("/admin/products", {
      params,
    }),
  );
};

// Compatibility alias
export const getAllAdminProducts = getAdminProducts;

export const getAdminProductById = async (productId) => {
  return request(
    API.get(`/admin/products/${productId}`),
  );
};

export const activateProduct = async (productId) => {
  return request(
    API.patch(
      `/admin/products/${productId}/activate`,
    ),
  );
};

export const deactivateProduct = async (productId) => {
  return request(
    API.patch(
      `/admin/products/${productId}/deactivate`,
    ),
  );
};

export const featureProduct = async (productId) => {
  return request(
    API.patch(
      `/admin/products/${productId}/feature`,
    ),
  );
};

export const unfeatureProduct = async (productId) => {
  return request(
    API.patch(
      `/admin/products/${productId}/unfeature`,
    ),
  );
};

// =====================================================
// ADMIN ORDERS
// =====================================================

export const getAllAdminOrders = async (params = {}) => {
  return request(
    API.get("/admin/orders", {
      params,
    }),
  );
};

export const getAdminOrderById = async (orderId) => {
  return request(
    API.get(`/admin/orders/${orderId}`),
  );
};

export const updateAdminOrderStatus = async (
  orderId,
  orderStatus,
) => {
  return request(
    API.patch(
      `/admin/orders/${orderId}/status`,
      {
        status: orderStatus,
      },
    ),
  );
};

export const cancelAdminOrder = async (
  orderId,
  cancelData = {},
) => {
  return request(
    API.patch(
      `/admin/orders/${orderId}/cancel`,
      cancelData,
    ),
  );
};

// =====================================================
// ADMIN ANALYTICS
// =====================================================

export const getOrderAnalytics = async (params = {}) => {
  return request(
    API.get("/admin/analytics/orders", {
      params,
    }),
  );
};

export const getRevenueAnalytics = async (params = {}) => {
  return request(
    API.get("/admin/analytics/revenue", {
      params,
    }),
  );
};

export const getSalesTrends = async (params = {}) => {
  return request(
    API.get("/admin/analytics/sales-trends", {
      params,
    }),
  );
};

export const getTopProducts = async (params = {}) => {
  return request(
    API.get("/admin/analytics/top-products", {
      params,
    }),
  );
};

export const getTopSellers = async (params = {}) => {
  return request(
    API.get("/admin/analytics/top-sellers", {
      params,
    }),
  );
};

export const getUserAnalytics = async (params = {}) => {
  return request(
    API.get("/admin/analytics/users", {
      params,
    }),
  );
};

// =====================================================
// CATEGORIES
// =====================================================

export const getCategories = async (params = {}) => {
  return request(
    API.get("/categories", {
      params,
    }),
  );
};

export const getCategoryById = async (id) => {
  return request(
    API.get(`/categories/${id}`),
  );
};

export const createCategory = async (payload) => {
  return request(
    API.post("/categories", payload),
  );
};

export const updateCategory = async (
  id,
  payload,
) => {
  return request(
    API.put(`/categories/${id}`, payload),
  );
};

export const toggleCategoryStatus = async (id) => {
  return request(
    API.patch(
      `/categories/${id}/toggle-status`,
    ),
  );
};

export const deleteCategory = async (id) => {
  return request(
    API.delete(`/categories/${id}`),
  );
};

// =====================================================
// BRANDS
// =====================================================

export const getAllBrands = async (params = {}) => {
  return request(
    API.get("/brands", {
      params,
    }),
  );
};

export const getBrandById = async (id) => {
  return request(
    API.get(`/brands/${id}`),
  );
};

export const createBrand = async (payload) => {
  return request(
    API.post("/brands", payload),
  );
};

export const updateBrand = async (
  id,
  payload,
) => {
  return request(
    API.put(`/brands/${id}`, payload),
  );
};

export const toggleBrandStatus = async (id) => {
  return request(
    API.patch(
      `/brands/${id}/toggle-status`,
    ),
  );
};

export const deleteBrand = async (id) => {
  return request(
    API.delete(`/brands/${id}`),
  );
};

// =====================================================
// REVIEWS
// =====================================================

export const getAllReviewsAdmin = async (
  params = {},
) => {
  return request(
    API.get("/reviews/admin", {
      params,
    }),
  );
};

export const moderateReview = async (
  reviewId,
  payload,
) => {
  return request(
    API.patch(
      `/reviews/admin/${reviewId}`,
      payload,
    ),
  );
};

export const deleteReviewAdmin = async (
  reviewId,
) => {
  return request(
    API.delete(
      `/reviews/admin/${reviewId}`,
    ),
  );
};

// =====================================================
// ADMIN PROFILE
// =====================================================

export const getMyProfile = async () => {
  return request(
    API.get("/user/profile"),
  );
};

export const updateMyProfile = async (
  payload,
) => {
  return request(
    API.put("/user/profile", payload),
  );
};

// =====================================================
// ADMIN LOGOUT
// =====================================================

export const logoutAdmin = async () => {
  try {
    await API.post("/auth/logout");
  } catch (error) {
    console.warn(
      "Logout request completed with local cleanup:",
      error?.message,
    );
  } finally {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
  }
};

// =====================================================
// NOTIFICATIONS
// =====================================================

export const getMyNotifications = async (
  params = {},
) => {
  return request(
    API.get("/notifications", {
      params,
    }),
  );
};

export const getUnreadNotificationCount =
  async () => {
    return request(
      API.get(
        "/notifications/unread-count",
      ),
    );
  };

export const createNotification = async (
  payload,
) => {
  return request(
    API.post(
      "/notifications/admin",
      payload,
    ),
  );
};

export const markNotificationAsRead =
  async (notificationId) => {
    return request(
      API.patch(
        `/notifications/${notificationId}/read`,
      ),
    );
  };

export const markAllNotificationsAsRead =
  async () => {
    return request(
      API.patch(
        "/notifications/read-all",
      ),
    );
  };

export const deleteNotification = async (
  notificationId,
) => {
  return request(
    API.delete(
      `/notifications/${notificationId}`,
    ),
  );
};

export const deleteAllReadNotifications =
  async () => {
    return request(
      API.delete(
        "/notifications/read",
      ),
    );
  };