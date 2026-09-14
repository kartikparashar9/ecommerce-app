import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Search,
  Pencil,
  Power,
  Trash2,
  RotateCcw,
  X,
  Loader2,
  AlertCircle,
  Package,
  Layers3,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";

import {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../AdminApi";

import "./AdminCategoriesContent.css";

// ============================================================
// HELPERS
// ============================================================

const normalizeCategoryResponse = (response) => {
  const body = response?.data ?? response ?? {};

  const actualData =
    body?.data !== undefined && typeof body.data !== "string"
      ? body.data
      : body;

  if (Array.isArray(actualData)) {
    return {
      categories: actualData,
      pagination: {},
    };
  }

  return {
    categories:
      actualData?.categories ??
      actualData?.data ??
      actualData?.docs ??
      actualData?.results ??
      [],
    pagination:
      actualData?.pagination ??
      body?.pagination ??
      actualData?.meta ??
      body?.meta ??
      {},
  };
};

const getParentId = (category) => {
  if (!category?.parentCategory) return null;

  if (typeof category.parentCategory === "string") {
    return category.parentCategory;
  }

  return category.parentCategory?._id ?? category.parentCategory?.id ?? null;
};

const getProductCount = (category) => {
  if (typeof category?.productCount === "number") {
    return category.productCount;
  }

  if (typeof category?.productsCount === "number") {
    return category.productsCount;
  }

  if (typeof category?.totalProducts === "number") {
    return category.totalProducts;
  }

  if (Array.isArray(category?.products)) {
    return category.products.length;
  }

  // Do not fake a count when API doesn't provide one.
  return null;
};

const getPageNumbers = (currentPage, totalPages) => {
  if (!totalPages || totalPages <= 1) {
    return [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ];
};

// ============================================================
// COMPONENT
// ============================================================

const AdminCategoriesContent = () => {
  const [categories, setCategories] = useState([]);
  const [rootCategories, setRootCategories] = useState([]);

  const [selectedRoot, setSelectedRoot] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [loading, setLoading] = useState(false);
  const [rootLoading, setRootLoading] = useState(false);

  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    parentCategory: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // ============================================================
  // LOAD ROOT OPTIONS
  // ============================================================

  const loadRootOptions = useCallback(async () => {
    try {
      setRootLoading(true);

      const response = await getCategories({
        page: 1,
        limit: 1000,
        parentCategory: "root",
        status: "all",
      });

      const normalized = normalizeCategoryResponse(response);

      setRootCategories(
        Array.isArray(normalized.categories) ? normalized.categories : [],
      );
    } catch (err) {
      console.error("Failed to load root categories:", err);
    } finally {
      setRootLoading(false);
    }
  }, []);

  // ============================================================
  // LOAD ROOT CATEGORIES
  // ============================================================

  const loadRoots = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCategories({
        page,
        limit: 10,
        search: search.trim(),
        status,
        parentCategory: "root",
      });

      const normalized = normalizeCategoryResponse(response);

      setCategories(
        Array.isArray(normalized.categories) ? normalized.categories : [],
      );

      setPagination(normalized.pagination || {});
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load categories.",
      );

      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  // ============================================================
  // LOAD CHILD CATEGORIES
  // ============================================================

  const loadChildren = useCallback(async () => {
    if (!selectedRoot?._id) return;

    try {
      setLoading(true);
      setError("");

      const response = await getCategories({
        page,
        limit: 10,
        search: search.trim(),
        status,
        parentCategory: selectedRoot._id,
      });

      const normalized = normalizeCategoryResponse(response);

      const children = Array.isArray(normalized.categories)
        ? normalized.categories.filter(
            (category) => getParentId(category) === selectedRoot._id,
          )
        : [];

      setCategories(children);
      setPagination(normalized.pagination || {});
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load subcategories.",
      );

      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, selectedRoot]);

  // ============================================================
  // INITIAL ROOT OPTIONS
  // ============================================================

  useEffect(() => {
    loadRootOptions();
  }, [loadRootOptions]);

  // ============================================================
  // SEARCH / FILTER DEBOUNCE
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedRoot) {
        loadChildren();
      } else {
        loadRoots();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [loadRoots, loadChildren, selectedRoot]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalItems = useMemo(() => {
    return (
      pagination?.totalItems ??
      pagination?.totalCategories ??
      pagination?.totalDocs ??
      pagination?.total ??
      pagination?.count ??
      categories.length
    );
  }, [pagination, categories.length]);

  const limit = Number(
    pagination?.limit ?? pagination?.pageSize ?? pagination?.perPage ?? 10,
  );

  const totalPages = useMemo(
    () =>
      pagination?.totalPages ??
      pagination?.pages ??
      Math.max(1, Math.ceil(totalItems / limit)),
    [pagination, totalItems, limit],
  );

  const pageNumbers = useMemo(
    () => getPageNumbers(page, totalPages),
    [page, totalPages],
  );

  const startItem = totalItems > 0 ? (page - 1) * limit + 1 : 0;

  const endItem = totalItems > 0 ? Math.min(page * limit, totalItems) : 0;

  // ============================================================
  // OPEN ROOT
  // ============================================================

  const openRoot = (root) => {
    setSelectedRoot(root);
    setPage(1);
    setSearch("");
    setStatus("all");
    setError("");
  };

  // ============================================================
  // BACK TO ROOTS
  // ============================================================

  const backToRoots = () => {
    setSelectedRoot(null);
    setPage(1);
    setSearch("");
    setStatus("all");
    setError("");
  };

  // ============================================================
  // RESET FILTERS
  // ============================================================

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  // ============================================================
  // FORM
  // ============================================================

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
      parentCategory: selectedRoot?._id || "",
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setModalMode("create");

    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
      parentCategory: selectedRoot?._id || "",
      isActive: true,
    });

    setModalOpen(true);
  };

  const openEditModal = (category) => {
  setModalMode("edit");

  setForm({
    _id: category?._id || category?.id || "",
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    image: category?.image || "",
    parentCategory: getParentId(category) || "",
    isActive:
      typeof category?.isActive === "boolean"
        ? category.isActive
        : true,
  });

  setModalOpen(true);
};

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setModalMode("create");
    resetForm();
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        isActive: form.isActive,
        parentCategory: selectedRoot?._id || form.parentCategory || null,
      };

      if (modalMode === "edit") {
        await updateCategory(form._id || form.id, payload);
      } else {
        await createCategory(payload);
      }

      closeModal();

      setPage(1);

      await Promise.all([
        loadRootOptions(),
        selectedRoot ? loadChildren() : loadRoots(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save category.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TOGGLE STATUS
  // ============================================================

  const handleToggleStatus = async (category) => {
    if (!category?._id) return;

    try {
      setBusyId(category._id);
      setError("");

      await toggleCategoryStatus(category._id);

      if (selectedRoot) {
        await loadChildren();
      } else {
        await loadRoots();
      }

      await loadRootOptions();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update category status.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (category) => {
    if (!category?._id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) return;

    try {
      setBusyId(category._id);
      setError("");

      await deleteCategory(category._id);

      if (categories.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else if (selectedRoot) {
        await loadChildren();
      } else {
        await loadRoots();
      }

      await loadRootOptions();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete category.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // ============================================================
  // STATS
  // ============================================================

  const activeCount = useMemo(
    () => categories.filter((category) => category.isActive).length,
    [categories],
  );

  const inactiveCount = useMemo(
    () => categories.filter((category) => !category.isActive).length,
    [categories],
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-categories-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-categories-header">
        <div className="admin-categories-title-area">
          {selectedRoot ? (
            <button
              type="button"
              className="admin-categories-back-button"
              onClick={backToRoots}
              title="Back to categories"
            >
              <ArrowLeft size={19} />
            </button>
          ) : null}

          <div>
            <div className="admin-categories-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={14} />
              <span>{selectedRoot ? selectedRoot.name : "Categories"}</span>
            </div>

            <h1>Manage Categories</h1>

            <p>
              {selectedRoot
                ? `Manage subcategories under ${selectedRoot.name}.`
                : "Manage your product categories and seller categories."}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="admin-categories-add-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          <span>{selectedRoot ? "Add Subcategory" : "Add Category"}</span>
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error ? (
        <div className="admin-categories-error">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <X size={17} />
          </button>
        </div>
      ) : null}

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="admin-categories-summary">
        <div className="admin-category-summary-card">
          <div className="admin-category-summary-icon">
            {selectedRoot ? <FolderOpen size={20} /> : <Layers3 size={20} />}
          </div>

          <div>
            <span>{selectedRoot ? "Subcategories" : "Categories"}</span>
            <strong>{totalItems}</strong>
          </div>
        </div>

        <div className="admin-category-summary-card">
          <div className="admin-category-summary-icon active">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="admin-category-summary-card">
          <div className="admin-category-summary-icon inactive">
            <XCircle size={20} />
          </div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="admin-categories-toolbar">
        <div className="admin-category-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <select
          className="admin-category-status-filter"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          type="button"
          className="admin-category-reset-button"
          onClick={resetFilters}
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {/* ======================================================
          CURRENT ROOT INFO
      ====================================================== */}

      {selectedRoot ? (
        <div className="admin-selected-root">
          <div className="admin-selected-root-icon">
            <FolderOpen size={21} />
          </div>

          <div>
            <span>Viewing subcategories of</span>
            <strong>{selectedRoot.name}</strong>
          </div>

          <button type="button" onClick={backToRoots}>
            View all categories
          </button>
        </div>
      ) : null}

      {/* ======================================================
          TABLE CARD
      ====================================================== */}

      <div className="admin-categories-card">
        <div className="admin-categories-card-header">
          <div>
            <h2>
              {selectedRoot
                ? `${selectedRoot.name} Subcategories`
                : "All Categories"}
            </h2>

            <span>
              {totalItems > 0
                ? `Showing ${startItem}–${endItem} of ${totalItems}`
                : "No categories found"}
            </span>
          </div>
        </div>

        <div className="admin-categories-table-wrapper">
          <table className="admin-categories-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Status</th>
                <th>Products</th>
                <th className="admin-category-actions-heading">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="admin-category-table-state">
                    <Loader2 size={28} className="admin-category-spinner" />
                    <span>Loading categories...</span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="admin-category-table-state">
                    <div className="admin-category-empty-icon">
                      <Folder size={28} />
                    </div>

                    <strong>No categories found</strong>

                    <span>
                      {search
                        ? "Try changing your search or filters."
                        : "Create your first category to get started."}
                    </span>

                    {!search && status === "all" ? (
                      <button type="button" onClick={openCreateModal}>
                        <Plus size={16} />
                        Add Category
                      </button>
                    ) : null}
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const productCount = getProductCount(category);

                  const isBusy = busyId === category._id;

                  const isRoot = !getParentId(category);

                  return (
                    <tr key={category._id} className="admin-category-row">
                      <td>
                        <div
                          className={`admin-category-name-cell ${
                            selectedRoot ? "is-child" : ""
                          }`}
                        >
                          {selectedRoot ? (
                            <span className="admin-category-tree-line">└─</span>
                          ) : (
                            <button
                              type="button"
                              className="admin-category-open-button"
                              onClick={() => openRoot(category)}
                              title="View subcategories"
                            >
                              <ChevronRight size={17} />
                            </button>
                          )}

                          <div className="admin-category-folder">
                            {isRoot ? (
                              <Folder size={20} />
                            ) : (
                              <FolderOpen size={20} />
                            )}
                          </div>

                          <div className="admin-category-name-content">
                            <strong>{category.name}</strong>

                            {category.description ? (
                              <span>{category.description}</span>
                            ) : (
                              <span className="no-description">
                                No description
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-category-status ${
                            category.isActive ? "active" : "inactive"
                          }`}
                        >
                          <span className="status-dot" />
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-category-product-count">
                          <Package size={16} />

                          <span>
                            {productCount === null ? "—" : productCount}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-category-actions">
                          <button
                            type="button"
                            className="category-action edit"
                            onClick={() => openEditModal(category)}
                            disabled={isBusy}
                            title="Edit category"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className={`category-action ${
                              category.isActive ? "deactivate" : "activate"
                            }`}
                            onClick={() => handleToggleStatus(category)}
                            disabled={isBusy}
                            title={
                              category.isActive
                                ? "Deactivate category"
                                : "Activate category"
                            }
                          >
                            {isBusy ? (
                              <Loader2
                                size={16}
                                className="admin-category-spinner"
                              />
                            ) : (
                              <Power size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            className="category-action delete"
                            onClick={() => handleDelete(category)}
                            disabled={isBusy}
                            title="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {!loading && totalPages > 1 ? (
          <div className="admin-category-pagination">
            <div className="admin-category-pagination-info">
              <span>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
            </div>

            <div className="admin-category-pagination-controls">
              <button
                type="button"
                className="pagination-arrow"
                disabled={page <= 1}
                onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              {pageNumbers.map((pageNumber, index) => {
                if (
                  pageNumber === "ellipsis-start" ||
                  pageNumber === "ellipsis-end"
                ) {
                  return (
                    <span
                      key={`${pageNumber}-${index}`}
                      className="pagination-ellipsis"
                    >
                      …
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`pagination-page ${
                      page === pageNumber ? "active" : ""
                    }`}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                className="pagination-arrow"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((previous) => Math.min(previous + 1, totalPages))
                }
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ======================================================
          MODAL
      ====================================================== */}

      {modalOpen ? (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="admin-category-modal">
            <div className="admin-category-modal-header">
              <div>
                <div className="admin-category-modal-icon">
                  {modalMode === "edit" ? (
                    <Pencil size={19} />
                  ) : (
                    <Plus size={19} />
                  )}
                </div>

                <div>
                  <h3>
                    {modalMode === "edit"
                      ? "Edit Category"
                      : selectedRoot
                        ? "Add Subcategory"
                        : "Add Category"}
                  </h3>

                  <p>
                    {modalMode === "edit"
                      ? "Update category information."
                      : "Create a new category for your store."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form className="admin-category-form" onSubmit={handleSubmit}>
              <div className="admin-category-form-group">
                <label htmlFor="category-name">
                  Category Name
                  <span>*</span>
                </label>

                <input
                  id="category-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Electronics"
                  maxLength={100}
                  required
                />
              </div>

              <div className="admin-category-form-group">
                <label htmlFor="category-slug">Slug</label>

                <input
                  id="category-slug"
                  name="slug"
                  type="text"
                  value={form.slug}
                  onChange={handleFormChange}
                  placeholder="e.g. electronics"
                />
              </div>

              <div className="admin-category-form-group">
                <label htmlFor="category-description">Description</label>

                <textarea
                  id="category-description"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Describe this category..."
                  maxLength={500}
                  rows={4}
                />
              </div>

              <div className="admin-category-form-group">
                <label htmlFor="category-image">Image URL</label>

                <input
                  id="category-image"
                  name="image"
                  type="text"
                  value={form.image}
                  onChange={handleFormChange}
                  placeholder="https://..."
                />
              </div>

              {!selectedRoot ? (
                <div className="admin-category-form-group">
                  <label htmlFor="category-parent">Parent Category</label>

                  <select
                    id="category-parent"
                    name="parentCategory"
                    value={form.parentCategory}
                    onChange={handleFormChange}
                    disabled={rootLoading}
                  >
                    <option value="">None — Root Category</option>

                    {rootCategories.map((root) => (
                      <option key={root._id} value={root._id}>
                        {root.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="admin-category-fixed-parent">
                  <span>Parent Category</span>

                  <div>
                    <FolderOpen size={17} />
                    <strong>{selectedRoot.name}</strong>
                  </div>
                </div>
              )}

              <label className="admin-category-checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleFormChange}
                />

                <span className="custom-checkbox">
                  {form.isActive ? <CheckCircle2 size={15} /> : null}
                </span>

                <span>Category is active</span>
              </label>

              <div className="admin-category-modal-actions">
                <button
                  type="button"
                  className="admin-category-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-category-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="admin-category-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {modalMode === "edit" ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={17} />
                      )}

                      {modalMode === "edit"
                        ? "Update Category"
                        : "Create Category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminCategoriesContent;