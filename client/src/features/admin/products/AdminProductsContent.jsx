import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  Package,
  Star,
  Check,
  X,
  Power,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  PackageX,
} from "lucide-react";
import {
  getAdminProducts,
  activateProduct,
  deactivateProduct,
  featureProduct,
  unfeatureProduct,
} from "../AdminApi";

import { resolveMediaUrl } from "../../utils/media";
import "./AdminProductsContent.css";

// Helper Product Image Component with graceful error fallback
const ProductImage = ({ src, alt }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const imageUrl = src ? resolveMediaUrl(src) : "";

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={alt || "Product"}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  return <Package size={20} className="product-placeholder-icon" />;
};

const AdminProductsContent = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("search") || ""
  );

  const [active, setActive] = useState("");
  const [featured, setFeatured] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [busy, setBusy] = useState(null);

  const hasActiveFilters = Boolean(search.trim() || active || featured);

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (active) {
        params.isActive = active === "active";
      }

      if (featured) {
        params.isFeatured = featured === "featured";
      }

      const response = await getAdminProducts(params);
      const responseData = response?.data?.data || {};

      let productList = [];
      let paginationData = {};

      if (Array.isArray(responseData)) {
        productList = responseData;
      } else if (responseData && typeof responseData === "object") {
        productList = Array.isArray(responseData.products)
          ? responseData.products
          : [];
        paginationData = responseData.pagination || {};
      }

      setProducts(productList);

      setPagination({
        currentPage: paginationData.currentPage ?? page,
        totalPages: paginationData.totalPages ?? 1,
        totalProducts:
          paginationData.totalProducts ??
          paginationData.total ??
          productList.length,
        hasPreviousPage: Boolean(paginationData.hasPreviousPage ?? page > 1),
        hasNextPage: Boolean(paginationData.hasNextPage ?? false),
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load products. Please check your network connection."
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, active, featured]);

  // =========================================================
  // FETCH WHEN FILTERS CHANGE (DEBOUNCED)
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadProducts]);

  // =========================================================
  // ACTIONS (ACTIVATE / DEACTIVATE / FEATURE / UNFEATURE)
  // =========================================================

  const handleAction = async (id, type) => {
    if (!id || busy) return;

    const actionKey = `${id}-${type}`;

    try {
      setBusy(actionKey);
      setError("");

      const actionFn = {
        activate: activateProduct,
        deactivate: deactivateProduct,
        feature: featureProduct,
        unfeature: unfeatureProduct,
      }[type];

      if (!actionFn) return;

      await actionFn(id);
      await loadProducts();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Product action failed. Please try again.";

      setError(message);
    } finally {
      setBusy(null);
    }
  };

  // =========================================================
  // FILTER HANDLERS
  // =========================================================

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    if (page !== 1) setPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    if (page !== 1) setPage(1);
  };

  const handleActiveChange = (event) => {
    setActive(event.target.value);
    if (page !== 1) setPage(1);
  };

  const handleFeaturedChange = (event) => {
    setFeatured(event.target.value);
    if (page !== 1) setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setActive("");
    setFeatured("");
    if (page !== 1) setPage(1);
  };

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      setPage((cp) => Math.max(1, cp - 1));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPage((cp) => cp + 1);
    }
  };

  // =========================================================
  // INITIAL FULL PAGE LOADING STATE
  // =========================================================

  if (loading && products.length === 0 && !hasActiveFilters && page === 1) {
    return (
      <div className="admin-products-state">
        <div className="admin-products-loader-card">
          <Loader2 size={36} className="admin-spinner" />
          <p>Loading product catalog...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // INITIAL FULL PAGE ERROR STATE
  // =========================================================

  if (error && products.length === 0 && !hasActiveFilters && page === 1) {
    return (
      <div className="admin-products-state error">
        <div className="admin-products-error-card">
          <AlertCircle size={40} />
          <h3>Failed to Load Products</h3>
          <p>{error}</p>
          <button
            type="button"
            className="admin-retry-btn"
            onClick={loadProducts}
          >
            <RotateCcw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="admin-products-content">
      {/* HEADER */}
      <div className="admin-products-page-header">
        <div className="admin-header-title">
          <h1>Products Catalog</h1>
          <p>Review, feature, and control store inventory items.</p>
        </div>

        <div className="admin-products-total">
          <Package size={18} />
          <span>
            <strong>
              {pagination.totalProducts ?? products.length}
            </strong>{" "}
            Products
          </span>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="admin-products-filters-bar">
        <div className="admin-products-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by product name, SKU..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search products"
          />

          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="admin-products-filter-group">
          {/* Status Filter */}
          <select
            value={active}
            onChange={handleActiveChange}
            aria-label="Filter products by active status"
            className="admin-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Featured Filter */}
          <select
            value={featured}
            onChange={handleFeaturedChange}
            aria-label="Filter products by featured status"
            className="admin-select"
          >
            <option value="">All Products</option>
            <option value="featured">Featured</option>
            <option value="normal">Not Featured</option>
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="admin-reset-filters-btn"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* INLINE ERROR BANNER */}
      {error && (
        <div className="admin-products-inline-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            className="close-error-btn"
            onClick={() => setError("")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* TABLE CARD */}
      <div className="admin-products-table-card">
        <div className="admin-products-table-wrapper">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Featured</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="admin-skeleton-row">
                    <td>
                      <div className="admin-product-info">
                        <div className="skeleton skeleton-thumb" />
                        <div className="skeleton-text-group">
                          <div className="skeleton skeleton-line short" />
                          <div className="skeleton skeleton-line long" />
                        </div>
                      </div>
                    </td>
                    <td><div className="skeleton skeleton-line medium" /></td>
                    <td><div className="skeleton skeleton-line medium" /></td>
                    <td><div className="skeleton skeleton-line short" /></td>
                    <td><div className="skeleton skeleton-line short" /></td>
                    <td><div className="skeleton skeleton-badge" /></td>
                    <td><div className="skeleton skeleton-badge" /></td>
                    <td className="text-right">
                      <div className="skeleton skeleton-actions" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="8" className="admin-products-empty">
                    <div className="empty-state-content">
                      <PackageX size={44} className="empty-icon" />
                      <h3>No products found</h3>
                      <p>
                        {hasActiveFilters
                          ? "No products match your current search or filter criteria. Try resetting your parameters."
                          : "There are currently no products in the catalog."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="admin-reset-filters-btn secondary"
                          onClick={handleResetFilters}
                        >
                          <RotateCcw size={14} />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  if (!p?._id) return null;

                  const totalStock = Array.isArray(p.variants)
                    ? p.variants.reduce((n, v) => n + Number(v.stock || 0), 0)
                    : Number(p.totalStock || p.stock || 0);

                  const mainImage = p.image || p.variants?.[0]?.image || "";
                  const price = Number(
                    p.basePrice ?? p.price ?? p.variants?.[0]?.price ?? 0
                  );

                  const isActivating = busy === `${p._id}-activate`;
                  const isDeactivating = busy === `${p._id}-deactivate`;
                  const isFeaturing = busy === `${p._id}-feature`;
                  const isUnfeaturing = busy === `${p._id}-unfeature`;
                  const isRowBusy = Boolean(busy && busy.startsWith(p._id));

                  return (
                    <tr key={p._id} className={isRowBusy ? "row-busy" : ""}>
                      {/* PRODUCT DETAILS */}
                      <td>
                        <div className="admin-product-info">
                          <div className="admin-product-image">
                            <ProductImage src={mainImage} alt={p.name} />
                          </div>

                          <div className="admin-product-details">
                            <strong className="product-name" title={p.name}>
                              {p.name || "Unnamed Product"}
                            </strong>
                            <span className="product-sku">
                              SKU: {p.sku || p.variants?.[0]?.sku || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td>
                        <span className="product-meta">
                          {p.category?.name || "—"}
                        </span>
                      </td>

                      {/* BRAND */}
                      <td>
                        <span className="product-meta">
                          {p.brand?.name || "—"}
                        </span>
                      </td>

                      {/* PRICE */}
                      <td>
                        <strong className="product-price">
                          ₹{price.toLocaleString("en-IN")}
                        </strong>
                      </td>

                      {/* STOCK */}
                      <td>
                        <span
                          className={`product-stock ${
                            totalStock === 0 ? "out-of-stock" : ""
                          }`}
                        >
                          {totalStock}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`product-status ${
                            p.isActive ? "active" : "inactive"
                          }`}
                        >
                          <span className="status-indicator-dot" />
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* FEATURED */}
                      <td>
                        <span
                          className={`product-featured ${
                            p.isFeatured ? "featured" : "normal"
                          }`}
                        >
                          {p.isFeatured && <Star size={12} fill="currentColor" />}
                          {p.isFeatured ? "Featured" : "Normal"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="text-right">
                        <div className="admin-product-actions">
                          {/* ACTIVATE / DEACTIVATE */}
                          {p.isActive ? (
                            <button
                              type="button"
                              className="product-action deactivate"
                              disabled={Boolean(busy)}
                              onClick={() => handleAction(p._id, "deactivate")}
                              title="Deactivate product"
                              aria-label={`Deactivate ${p.name}`}
                            >
                              {isDeactivating ? (
                                <Loader2 size={16} className="admin-btn-spinner" />
                              ) : (
                                <Power size={16} />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="product-action activate"
                              disabled={Boolean(busy)}
                              onClick={() => handleAction(p._id, "activate")}
                              title="Activate product"
                              aria-label={`Activate ${p.name}`}
                            >
                              {isActivating ? (
                                <Loader2 size={16} className="admin-btn-spinner" />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>
                          )}

                          {/* FEATURE / UNFEATURE */}
                          {p.isFeatured ? (
                            <button
                              type="button"
                              className="product-action unfeature"
                              disabled={Boolean(busy)}
                              onClick={() => handleAction(p._id, "unfeature")}
                              title="Remove from featured"
                              aria-label={`Unfeature ${p.name}`}
                            >
                              {isUnfeaturing ? (
                                <Loader2 size={16} className="admin-btn-spinner" />
                              ) : (
                                <X size={16} />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="product-action feature"
                              disabled={Boolean(busy)}
                              onClick={() => handleAction(p._id, "feature")}
                              title="Set as featured"
                              aria-label={`Feature ${p.name}`}
                            >
                              {isFeaturing ? (
                                <Loader2 size={16} className="admin-btn-spinner" />
                              ) : (
                                <Star size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {products.length > 0 && (
          <div className="admin-products-pagination">
            <div className="admin-pagination-info">
              Showing page <strong>{pagination.currentPage || page}</strong> of{" "}
              <strong>{pagination.totalPages || 1}</strong>
            </div>

            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={!pagination?.hasPreviousPage || loading}
                onClick={handlePreviousPage}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                className="admin-pagination-btn"
                disabled={!pagination?.hasNextPage || loading}
                onClick={handleNextPage}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsContent;