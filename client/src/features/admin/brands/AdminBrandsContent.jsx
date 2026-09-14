import { useEffect, useMemo, useRef, useState } from "react";

import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Power,
  X,
  RotateCcw,
  UploadCloud,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Tags,
  Globe2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import {
  getAllBrands,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand,
} from "../AdminApi";

import "../component/AdminPagination.css";
import "./AdminBrandsContent.css";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  website: "",
};

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg"];

/* =========================================================
   BACKEND URL
   ========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

/* =========================================================
   LOGO URL HELPER
   ========================================================= */

const getBrandLogoUrl = (logo = "") => {
  if (!logo) return "";

  const value = String(logo).trim();

  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (value.startsWith("blob:")) {
    return value;
  }
  if (value.startsWith("data:")) {
    return value;
  }
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
};

/* =========================================================
   SLUG
   ========================================================= */

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/* =========================================================
   RESPONSE NORMALIZATION
   ========================================================= */

const normalizeResponse = (response) => {
  const body = response?.data ?? {};

  const data = body?.data !== undefined ? body.data : body;

  if (Array.isArray(data)) {
    return {
      brands: data,
      pagination: body?.pagination || {},
      stats: body?.stats || {},
    };
  }

  return {
    brands: Array.isArray(data?.brands) ? data.brands : [],

    pagination: data?.pagination || body?.pagination || {},

    stats: data?.stats || body?.stats || {},
  };
};

/* =========================================================
   PAGINATION HELPERS
   ========================================================= */

const getTotalItems = (pagination = {}, brands = []) =>
  Number(
    pagination?.totalItems ??
      pagination?.totalBrands ??
      pagination?.totalDocs ??
      pagination?.total ??
      pagination?.count ??
      brands.length,
  );

const getTotalPages = (pagination = {}, totalItems, limit) =>
  Number(
    pagination?.totalPages ??
      pagination?.pages ??
      Math.max(1, Math.ceil(totalItems / limit)),
  ) || 1;

const getCurrentPage = (pagination = {}, page) =>
  Number(pagination?.currentPage ?? pagination?.page ?? page) || page;

const getPageNumbers = (currentPage, totalPages) => {
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

/* =========================================================
   COMPONENT
   ========================================================= */

const AdminBrandsContent = () => {
  const [brands, setBrands] = useState([]);

  const [search, setSearch] = useState("");

  const [active, setActive] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({});

  const [stats, setStats] = useState({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [modal, setModal] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [logoFile, setLogoFile] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");

  const [formErrors, setFormErrors] = useState({});

  const [logoError, setLogoError] = useState("");

  const [saving, setSaving] = useState(false);

  const [busyId, setBusyId] = useState(null);

  const fileInputRef = useRef(null);

  const objectUrlRef = useRef(null);

  const LIMIT = 10;

  /* =========================================================
     CLEANUP OBJECT URL
     ========================================================= */

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  /* =========================================================
     LOAD BRANDS
     ========================================================= */

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllBrands({
        page,
        limit: LIMIT,
        search: search.trim() || undefined,
        isActive: active === "" ? undefined : active,
      });

      const normalized = normalizeResponse(response);

      setBrands(normalized.brands);

      setPagination(normalized.pagination);

      setStats(normalized.stats);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load brands.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBrands();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search, active]);

  /* =========================================================
     PAGINATION
     ========================================================= */

  const totalItems = useMemo(
    () => getTotalItems(pagination, brands),
    [pagination, brands],
  );

  const totalPages = useMemo(
    () => getTotalPages(pagination, totalItems, LIMIT),
    [pagination, totalItems],
  );

  const currentPage = useMemo(
    () => getCurrentPage(pagination, page),
    [pagination, page],
  );

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const hasPreviousPage = pagination?.hasPreviousPage ?? currentPage > 1;

  const hasNextPage = pagination?.hasNextPage ?? currentPage < totalPages;

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * LIMIT + 1;

  const rangeEnd = Math.min(currentPage * LIMIT, totalItems);

  /* =========================================================
     STATS
     ========================================================= */

  const totalBrands =
    stats?.totalBrands ??
    stats?.total ??
    pagination?.totalItems ??
    pagination?.totalBrands ??
    totalItems;

  const activeBrands = stats?.activeBrands ?? stats?.active ?? null;

  const inactiveBrands = stats?.inactiveBrands ?? stats?.inactive ?? null;

  const brandsWithWebsite =
    stats?.brandsWithWebsite ?? stats?.withWebsite ?? null;

  /* =========================================================
     RESET FILTERS
     ========================================================= */

  const resetFilters = () => {
    setSearch("");
    setActive("");
    setPage(1);
  };

  /* =========================================================
     PREVIEW CLEANUP
     ========================================================= */

  const cleanupObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);

      objectUrlRef.current = null;
    }
  };

  /* =========================================================
     MODAL
     ========================================================= */

  const closeModal = () => {
    if (saving) return;

    cleanupObjectUrl();

    setModal(null);

    setForm(EMPTY_FORM);

    setLogoFile(null);

    setLogoPreview("");

    setFormErrors({});

    setLogoError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openCreateModal = () => {
    cleanupObjectUrl();

    setForm(EMPTY_FORM);

    setLogoFile(null);

    setLogoPreview("");

    setFormErrors({});

    setLogoError("");

    setModal({
      mode: "create",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditModal = (brand) => {
    cleanupObjectUrl();

    setForm({
      name: brand?.name || "",
      slug: brand?.slug || "",
      description: brand?.description || "",
      website: brand?.website || "",
    });

    setLogoFile(null);

    /*
     * IMPORTANT:
     * Convert backend logo path
     * into complete backend URL.
     */
    setLogoPreview(getBrandLogoUrl(brand?.logo || ""));

    setFormErrors({});

    setLogoError("");

    setModal({
      mode: "edit",
      id: brand?._id,
      existingLogo: brand?.logo || "",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     FORM INPUT
     ========================================================= */

  const handleNameChange = (value) => {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: modal?.mode === "create" ? slugify(value) : previous.slug,
    }));

    if (formErrors.name) {
      setFormErrors((previous) => ({
        ...previous,
        name: "",
      }));
    }
  };

  const handleSlugChange = (value) => {
    setForm((previous) => ({
      ...previous,
      slug: slugify(value),
    }));

    if (formErrors.slug) {
      setFormErrors((previous) => ({
        ...previous,
        slug: "",
      }));
    }
  };

  /* =========================================================
     LOGO VALIDATION
     ========================================================= */

  const validateLogo = (file, isEdit = false) => {
    if (!file) {
      if (!isEdit) {
        return "Brand logo is required.";
      }

      return "";
    }

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return "Only PNG, JPG, and JPEG " + "images are allowed.";
    }

    if (file.size > MAX_LOGO_SIZE) {
      return "Logo size must not exceed 2 MB.";
    }

    return "";
  };

  /* =========================================================
     LOGO SELECT
     ========================================================= */

  const handleLogoSelect = (file) => {
    setLogoError("");

    if (!file) return;

    const validationError = validateLogo(file, modal?.mode === "edit");

    if (validationError) {
      setLogoFile(null);

      setLogoError(validationError);

      cleanupObjectUrl();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    cleanupObjectUrl();

    const previewUrl = URL.createObjectURL(file);

    objectUrlRef.current = previewUrl;

    setLogoFile(file);

    setLogoPreview(previewUrl);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    handleLogoSelect(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];

    handleLogoSelect(file);
  };

  /* =========================================================
     REMOVE NEW LOGO
     ========================================================= */

  const removeLogo = () => {
    cleanupObjectUrl();

    setLogoFile(null);

    /*
     * In edit mode, removing a newly selected
     * replacement should restore the existing logo.
     */
    setLogoPreview(
      modal?.mode === "edit" ? getBrandLogoUrl(modal?.existingLogo || "") : "",
    );

    setLogoError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     FORM VALIDATION
     ========================================================= */

  const validateForm = () => {
    const errors = {};

    const name = form.name.trim();

    const slug = form.slug.trim();

    const description = form.description.trim();

    const website = form.website.trim();

    if (!name) {
      errors.name = "Brand name is required.";
    } else if (name.length < 2) {
      errors.name = "Brand name must be at least 2 characters.";
    } else if (name.length > 100) {
      errors.name = "Brand name cannot exceed 100 characters.";
    }

    if (!slug) {
      errors.slug = "Brand slug is required.";
    } else if (slug.length < 2) {
      errors.slug = "Brand slug must be at least 2 characters.";
    } else if (slug.length > 100) {
      errors.slug = "Brand slug cannot exceed 100 characters.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.slug =
        "Slug can contain lowercase letters, numbers, and hyphens only.";
    }

    if (description.length > 500) {
      errors.description = "Description cannot exceed 500 characters.";
    }

    if (website) {
      try {
        const url = new URL(website);

        if (!["http:", "https:"].includes(url.protocol)) {
          errors.website = "Website must start with http:// or https://.";
        }
      } catch {
        errors.website = "Please enter a valid website URL.";
      }
    }

    setFormErrors(errors);

    const logoValidationError = validateLogo(logoFile, modal?.mode === "edit");

    setLogoError(logoValidationError);

    return Object.keys(errors).length === 0 && !logoValidationError;
  };

  /* =========================================================
     CREATE / UPDATE
     ========================================================= */

  const submit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", form.name.trim());

      formData.append("slug", form.slug.trim().toLowerCase());

      formData.append("description", form.description.trim());

      formData.append("website", form.website.trim());

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      if (modal?.mode === "edit") {
        await updateBrand(modal.id, formData);
      } else {
        await createBrand(formData);
      }

      /*
       * Close modal manually instead of
       * calling closeModal() while saving=true.
       */
      cleanupObjectUrl();

      setModal(null);
      setForm(EMPTY_FORM);
      setLogoFile(null);
      setLogoPreview("");
      setFormErrors({});
      setLogoError("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadBrands();
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Unable to save brand.";

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     TOGGLE STATUS
     ========================================================= */

  const handleToggleStatus = async (brand) => {
    if (!brand?._id) return;

    try {
      setBusyId(brand._id);

      await toggleBrandStatus(brand._id);

      await loadBrands();
    } catch (err) {
      alert(err?.response?.data?.message || "Unable to change brand status.");
    } finally {
      setBusyId(null);
    }
  };

  /* =========================================================
     DELETE
     ========================================================= */

  const handleDelete = async (brand) => {
    if (!brand?._id) return;

    const confirmed = window.confirm(
      `Delete "${brand.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setBusyId(brand._id);

      await deleteBrand(brand._id);

      if (brands.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await loadBrands();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Unable to delete brand.");
    } finally {
      setBusyId(null);
    }
  };

  /* =========================================================
     FALLBACK
     ========================================================= */

  const getBrandInitial = (name = "") =>
    name.trim().charAt(0).toUpperCase() || "B";

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="admin-brands-content">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="admin-brands-header">
        <div className="admin-brands-heading">
          <div className="admin-brands-heading-icon">
            <Tags size={23} />
          </div>

          <div>
            <h1>Manage Brands</h1>

            <p>Manage the brands available to sellers and customers.</p>
          </div>
        </div>

        <button
          type="button"
          className="brand-primary-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add Brand
        </button>
      </div>

      {/* ======================================================
          SUMMARY
          ====================================================== */}

      <div className="admin-brand-summary">
        <div className="brand-summary-card">
          <div className="brand-summary-icon blue">
            <Tags size={21} />
          </div>

          <div>
            <span>Total Brands</span>

            <strong>{totalBrands}</strong>
          </div>
        </div>

        <div className="brand-summary-card">
          <div className="brand-summary-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Active Brands</span>

            <strong>{activeBrands !== null ? activeBrands : "—"}</strong>
          </div>
        </div>

        <div className="brand-summary-card">
          <div className="brand-summary-icon red">
            <XCircle size={21} />
          </div>

          <div>
            <span>Inactive Brands</span>

            <strong>{inactiveBrands !== null ? inactiveBrands : "—"}</strong>
          </div>
        </div>

        <div className="brand-summary-card">
          <div className="brand-summary-icon purple">
            <Globe2 size={21} />
          </div>

          <div>
            <span>With Website</span>

            <strong>
              {brandsWithWebsite !== null ? brandsWithWebsite : "—"}
            </strong>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTERS
          ====================================================== */}

      <div className="admin-brands-filter-card">
        <div className="brand-search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by brand name, slug or website..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          {search && (
            <button
              type="button"
              className="brand-search-clear"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <select
          value={active}
          onChange={(event) => {
            setActive(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All Status</option>

          <option value="true">Active</option>

          <option value="false">Inactive</option>
        </select>

        <button
          type="button"
          className="brand-reset-btn"
          onClick={resetFilters}
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && brands.length > 0 && (
        <div className="brand-inline-error">
          <AlertCircle size={17} />

          <span>{error}</span>

          <button type="button" onClick={loadBrands}>
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          TABLE
          ====================================================== */}

      {loading ? (
        <div className="admin-brand-state">
          <Loader2 className="brand-loading-icon" size={28} />

          <strong>Loading brands...</strong>

          <span>Please wait while we fetch your brands.</span>
        </div>
      ) : error && !brands.length ? (
        <div className="admin-brand-state error">
          <AlertCircle size={30} />

          <strong>Unable to load brands</strong>

          <span>{error}</span>

          <button
            type="button"
            className="brand-secondary-btn"
            onClick={loadBrands}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="admin-brands-table-card">
          <div className="brand-table-wrapper">
            <table className="admin-brands-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Slug</th>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th className="brand-actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!brands.length ? (
                  <tr>
                    <td colSpan="6">
                      <div className="brand-empty-state">
                        <div className="brand-empty-icon">
                          <Tags size={25} />
                        </div>

                        <strong>No brands found</strong>

                        <span>Try changing your search or filters.</span>

                        {(search || active) && (
                          <button type="button" onClick={resetFilters}>
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => {
                    const isBusy = busyId === brand._id;

                    const logoUrl = getBrandLogoUrl(brand?.logo || "");

                    return (
                      <tr key={brand._id}>
                        {/* BRAND */}

                        <td>
                          <div className="brand-info">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={`${brand.name} logo`}
                                className="brand-table-logo"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";

                                  const fallback =
                                    event.currentTarget.nextElementSibling;

                                  if (fallback) {
                                    fallback.style.display = "grid";
                                  }
                                }}
                              />
                            ) : null}

                            <div
                              className="brand-logo-fallback"
                              style={{
                                display: logoUrl ? "none" : "grid",
                              }}
                            >
                              {getBrandInitial(brand.name)}
                            </div>

                            <div className="brand-name-block">
                              <strong>{brand.name}</strong>

                              {brand.description && (
                                <span>
                                  {brand.description.length > 55
                                    ? `${brand.description.slice(0, 55)}...`
                                    : brand.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SLUG */}

                        <td>
                          <span className="brand-slug">{brand.slug}</span>
                        </td>

                        {/* WEBSITE */}

                        <td>
                          {brand.website ? (
                            <a
                              className="brand-website"
                              href={brand.website}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span>
                                {brand.website.replace(/^https?:\/\//i, "")}
                              </span>

                              <ExternalLink size={13} />
                            </a>
                          ) : (
                            <span className="brand-no-value">—</span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`brand-status ${
                              brand.isActive ? "active" : "inactive"
                            }`}
                          >
                            <span className="status-dot" />

                            {brand.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* CREATED */}

                        <td>
                          <span className="brand-created-date">
                            {brand.createdAt
                              ? new Date(brand.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="admin-brand-actions">
                            <button
                              type="button"
                              className="brand-action-btn edit"
                              title="Edit brand"
                              disabled={isBusy}
                              onClick={() => openEditModal(brand)}
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              className={`brand-action-btn power ${
                                brand.isActive ? "active" : "inactive"
                              }`}
                              title={
                                brand.isActive
                                  ? "Deactivate brand"
                                  : "Activate brand"
                              }
                              disabled={isBusy}
                              onClick={() => handleToggleStatus(brand)}
                            >
                              {isBusy ? (
                                <Loader2 size={16} className="spin" />
                              ) : (
                                <Power size={16} />
                              )}
                            </button>

                            <button
                              type="button"
                              className="brand-action-btn delete"
                              title="Delete brand"
                              disabled={isBusy}
                              onClick={() => handleDelete(brand)}
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

          {/* =================================================
              FOOTER
              ================================================= */}

          <div className="admin-brands-table-footer">
            <span>
              {totalItems > 0 ? (
                <>
                  Showing{" "}
                  <strong>
                    {rangeStart}-{rangeEnd}
                  </strong>{" "}
                  of <strong>{totalItems}</strong> brands
                </>
              ) : (
                "Showing 0 brands"
              )}
            </span>

            <div className="brand-pagination">
              <button
                type="button"
                disabled={!hasPreviousPage}
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              {pageNumbers.map((item) => {
                if (typeof item === "string") {
                  return (
                    <span key={item} className="brand-pagination-ellipsis">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    type="button"
                    key={item}
                    className={item === currentPage ? "current" : ""}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={!hasNextPage}
                onClick={() =>
                  setPage((previous) => Math.min(totalPages, previous + 1))
                }
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          CREATE / EDIT MODAL
          ====================================================== */}

      {modal && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <form className="admin-brand-modal" onSubmit={submit}>
            {/* HEADER */}

            <div className="brand-modal-header">
              <div>
                <span className="brand-modal-eyebrow">
                  {modal.mode === "edit" ? "Brand Management" : "New Brand"}
                </span>

                <h2>{modal.mode === "edit" ? "Edit Brand" : "Create Brand"}</h2>

                <p>
                  {modal.mode === "edit"
                    ? "Update the brand information below."
                    : "Add a new brand to your marketplace."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* BODY */}

            <div className="brand-modal-body">
              {/* NAME */}

              <div className="brand-form-group">
                <label htmlFor="brand-name">
                  Brand Name <span>*</span>
                </label>

                <input
                  id="brand-name"
                  type="text"
                  placeholder="e.g. Nike"
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className={formErrors.name ? "input-error" : ""}
                />

                {formErrors.name && (
                  <small className="field-error">{formErrors.name}</small>
                )}
              </div>

              {/* SLUG */}

              <div className="brand-form-group">
                <div className="brand-label-row">
                  <label htmlFor="brand-slug">
                    Slug <span>*</span>
                  </label>

                  <span>
                    {form.slug.length}
                    /100
                  </span>
                </div>

                <input
                  id="brand-slug"
                  type="text"
                  placeholder="nike"
                  maxLength={100}
                  value={form.slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  className={formErrors.slug ? "input-error" : ""}
                />

                {formErrors.slug && (
                  <small className="field-error">{formErrors.slug}</small>
                )}
              </div>

              {/* DESCRIPTION */}

              <div className="brand-form-group">
                <div className="brand-label-row">
                  <label htmlFor="brand-description">Description</label>

                  <span>
                    {form.description.length}
                    /500
                  </span>
                </div>

                <textarea
                  id="brand-description"
                  placeholder="Write a short description about this brand..."
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  className={formErrors.description ? "input-error" : ""}
                />

                {formErrors.description && (
                  <small className="field-error">
                    {formErrors.description}
                  </small>
                )}
              </div>

              {/* WEBSITE */}

              <div className="brand-form-group">
                <label htmlFor="brand-website">Website URL</label>

                <div className="brand-input-with-icon">
                  <Globe2 size={16} />

                  <input
                    id="brand-website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={form.website}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        website: event.target.value,
                      }))
                    }
                    className={formErrors.website ? "input-error" : ""}
                  />
                </div>

                {formErrors.website && (
                  <small className="field-error">{formErrors.website}</small>
                )}
              </div>

              {/* LOGO */}

              <div className="brand-form-group">
                <div className="brand-label-row">
                  <label>
                    Brand Logo {modal.mode === "create" && <span>*</span>}
                  </label>

                  <span>PNG/JPG/JPEG • Max 2 MB</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="brand-hidden-file-input"
                  onChange={handleFileChange}
                />

                <div
                  className={`brand-upload-box ${
                    logoError ? "upload-error" : ""
                  } ${logoPreview ? "has-preview" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onDrop={handleDrop}
                >
                  {logoPreview ? (
                    <div className="brand-upload-preview">
                      <img
                        src={logoPreview}
                        alt="Brand logo preview"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />

                      <div className="brand-preview-info">
                        <strong>
                          {logoFile ? logoFile.name : "Current brand logo"}
                        </strong>

                        {logoFile && (
                          <span>
                            {(logoFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </div>

                      <div className="brand-preview-actions">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Replace
                        </button>

                        {logoFile && (
                          <button
                            type="button"
                            className="remove"
                            onClick={removeLogo}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="brand-upload-trigger"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="brand-upload-icon">
                        <UploadCloud size={27} />
                      </div>

                      <strong>Click to upload or drag & drop</strong>

                      <span>PNG, JPG or JPEG • Maximum 2 MB</span>
                    </button>
                  )}
                </div>

                {logoError && (
                  <small className="field-error">{logoError}</small>
                )}

                <div className="brand-upload-hint">
                  <ImageIcon size={15} />

                  <span>
                    Recommended size: <strong>200 × 200px</strong>. Use a clear
                    square logo for the best result.
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="brand-modal-footer">
              <button
                type="button"
                className="brand-cancel-btn"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="brand-save-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="spin" />
                    Saving...
                  </>
                ) : (
                  <>{modal.mode === "edit" ? "Update Brand" : "Save Brand"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminBrandsContent;
