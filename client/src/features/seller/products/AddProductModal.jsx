import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  createProductApi,
  getSellerCategoriesApi,
  getSellerBrandsApi,
  uploadProductImagesApi,
} from "../sellerApi";
import { fetchSellerProducts } from "../sellerSlice";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import "./AddProductModal.css";

const AddProductModal = ({ onClose }) => {
  const dispatch = useDispatch();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    brand: "",
    basePrice: "",
    discount: 0,
    lowStockThreshold: 5,
    images: [],
    variants: [{ sku: "", color: "", size: "", price: "", stock: 0 }],
  });

  // =====================================================
  // LOAD CATEGORIES / BRANDS
  // =====================================================

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          getSellerCategoriesApi(),
          getSellerBrandsApi(),
        ]);

        setCategories(catRes?.data || []);
        setBrands(brandRes?.data || []);
      } catch (err) {
        console.error("Failed to load categories/brands", err);
      }
    };

    loadCategoryData();
  }, []);

  // =====================================================
  // CLEANUP IMAGE PREVIEW URLS
  // =====================================================

  useEffect(() => {
    return () => {
      formData.images.forEach((image) => {
        if (image?.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [formData.images]);

  // =====================================================
  // GENERAL FORM HANDLING
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // IMAGE HANDLING
  // =====================================================

  const handleImageChange = (index, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError(null);

    const preview = URL.createObjectURL(file);

    setFormData((prev) => {
      const newImages = [...prev.images];

      // Revoke previous preview if replacing an image
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview);
      }

      newImages[index] = {
        file,
        preview,
      };

      return {
        ...prev,
        images: newImages,
      };
    });
  };

  const addImageInput = () => {
    if (formData.images.length >= 10) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, null],
    }));
  };

  const removeImageInput = (index) => {
    setFormData((prev) => {
      const imageToRemove = prev.images[index];

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      };
    });
  };

  // =====================================================
  // VARIANT HANDLING
  // =====================================================

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];

    newVariants[index] = {
      ...newVariants[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      variants: newVariants,
    }));
  };

  const addVariantInput = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: "",
          color: "",
          size: "",
          price: "",
          stock: 0,
        },
      ],
    }));
  };

  const removeVariantInput = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // -------------------------------------------------
      // Keep only actual selected files
      // -------------------------------------------------

      const selectedImages = formData.images
        .filter((image) => image?.file)
        .map((image) => image.file);

      // -------------------------------------------------
      // Create product WITHOUT images
      // -------------------------------------------------

      const productData = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        category: formData.category,
        brand: formData.brand,
        basePrice: Number(formData.basePrice),
        discount: Number(formData.discount || 0),
        lowStockThreshold: Number(formData.lowStockThreshold || 5),

        variants: formData.variants.map((v) => ({
          ...v,
          price: Number(v.price || formData.basePrice),
          stock: Number(v.stock || 0),
        })),
      };

      // -------------------------------------------------
      // STEP 1: Create product
      // -------------------------------------------------

      const productResponse = await createProductApi(productData);

      const product = productResponse?.data;

      if (!product?._id) {
        throw new Error(
          "Product was created, but product ID was not returned by the server.",
        );
      }

      // -------------------------------------------------
      // STEP 2: Upload local PC images
      // -------------------------------------------------

      if (selectedImages.length > 0) {
        await uploadProductImagesApi(product._id, selectedImages);
      }

      // -------------------------------------------------
      // Refresh seller products
      // -------------------------------------------------

      dispatch(fetchSellerProducts());

      onClose();
    } catch (err) {
      console.error("Failed to create product:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create product",
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="product-modal-backdrop">
      <div className="product-modal-card">
        <div className="product-modal-header">
          <h3 className="product-modal-title">Add New Store Product</h3>

          <button
            type="button"
            onClick={onClose}
            className="product-modal-close-btn"
          >
            <FiX />
          </button>
        </div>

        {error && <div className="seller-setup-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* =====================================================
              PRODUCT NAME
          ===================================================== */}

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Product Name *</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Wireless Noise Cancelling Headphones"
              className="seller-setup-input"
            />
          </div>

          {/* =====================================================
              CATEGORY / BRAND
          ===================================================== */}

          <div className="product-modal-grid-2">
            <div>
              <label className="seller-setup-label">Category *</label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="seller-setup-input"
              >
                <option value="">Select Category</option>

                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="seller-setup-label">Brand *</label>

              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="seller-setup-input"
              >
                <option value="">Select Brand</option>

                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =====================================================
              PRICE
          ===================================================== */}

          <div className="product-modal-grid-2">
            <div>
              <label className="seller-setup-label">Base Price (₹) *</label>

              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                required
                min="0"
                placeholder="1999"
                className="seller-setup-input"
              />
            </div>

            <div>
              <label className="seller-setup-label">Discount (%)</label>

              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                min="0"
                max="100"
                placeholder="10"
                className="seller-setup-input"
              />
            </div>
          </div>

          {/* =====================================================
              DESCRIPTION
          ===================================================== */}

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Description *</label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Full product description..."
              className="seller-setup-textarea"
            />
          </div>

          {/* =====================================================
              IMAGES
          ===================================================== */}

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Product Images</label>

            {formData.images.map((image, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <input
                    id={`product-image-${idx}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageChange(idx, e.target.files?.[0])
                    }
                    className="seller-setup-input"
                  />

                  {/* IMAGE PREVIEW */}

                  {image?.preview && (
                    <div
                      style={{
                        position: "relative",
                        marginTop: "8px",
                        width: "90px",
                        height: "90px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #ddd",
                      }}
                    >
                      <img
                        src={image.preview}
                        alt={`Product ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* REMOVE IMAGE BLOCK */}

                <button
                  type="button"
                  onClick={() => removeImageInput(idx)}
                  className="my-products-icon-btn delete"
                  title="Remove image"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}

            {/* ADD IMAGE */}

            <button
              type="button"
              onClick={addImageInput}
              className="seller-action-btn"
              style={{ marginTop: "6px" }}
              disabled={formData.images.length >= 10}
            >
              <FiPlus /> Add Image
            </button>

            {formData.images.length >= 10 && (
              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                }}
              >
                Maximum 10 images allowed.
              </small>
            )}
          </div>

          {/* =====================================================
              VARIANTS
          ===================================================== */}

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">
              Variants (SKU, Color, Size, Stock)
            </label>

            {formData.variants.map((v, idx) => (
              <div
                key={idx}
                className="product-modal-grid-3"
                style={{
                  marginBottom: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="SKU *"
                  value={v.sku}
                  onChange={(e) =>
                    handleVariantChange(idx, "sku", e.target.value)
                  }
                  required
                  className="seller-setup-input"
                />

                <input
                  type="text"
                  placeholder="Color"
                  value={v.color}
                  onChange={(e) =>
                    handleVariantChange(idx, "color", e.target.value)
                  }
                  className="seller-setup-input"
                />

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <input
                    type="number"
                    placeholder="Stock *"
                    value={v.stock}
                    onChange={(e) =>
                      handleVariantChange(idx, "stock", e.target.value)
                    }
                    required
                    min="0"
                    className="seller-setup-input"
                  />

                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantInput(idx)}
                      className="my-products-icon-btn delete"
                      style={{ marginTop: "4px" }}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addVariantInput}
              className="seller-action-btn"
              style={{ marginTop: "6px" }}
            >
              <FiPlus /> Add Variant
            </button>
          </div>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <div className="product-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="product-modal-cancel-btn"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="product-modal-submit-btn"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
