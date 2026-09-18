import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  updateProductApi,
  getSellerCategoriesApi,
  getSellerBrandsApi,
  uploadProductImagesApi,
  deleteProductImageApi,
  setPrimaryProductImageApi,
} from "../sellerApi";
import { fetchSellerProducts } from "../sellerSlice";
import { FiX, FiPlus, FiTrash2, FiStar } from "react-icons/fi";
import "./AddProductModal.css";

const makeVariant = (variant = {}, fallbackPrice = "") => ({
  sku: variant.sku || "",
  color: variant.color || "",
  size: variant.size || "",
  price: variant.price ?? fallbackPrice,
  stock: variant.stock ?? 0,
});

const EditProductModal = ({ product, onClose }) => {
  const dispatch = useDispatch();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const imagesRef = useRef([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    subcategory: "",
    brand: "",
    basePrice: "",
    discount: 0,
    lowStockThreshold: 5,
    variants: [],
    isActive: true,
  });

  useEffect(() => {
    if (!product) return;

    setFormData({
      name: product.name || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      category: product.category?._id || product.category || "",
      subcategory: product.subcategory?._id || product.subcategory || "",
      brand: product.brand?._id || product.brand || "",
      basePrice: product.basePrice ?? "",
      discount: product.discount ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      variants:
        Array.isArray(product.variants) && product.variants.length
          ? product.variants.map((variant) => makeVariant(variant, product.basePrice))
          : [{ sku: "", color: "", size: "", price: product.basePrice ?? "", stock: product.totalStock ?? 0 }],
      isActive: product.isActive !== false,
    });

    setImages(
      Array.isArray(product.images)
        ? product.images.map((url) => ({ type: "existing", url }))
        : [],
    );
  }, [product]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [categoryResponse, brandResponse] = await Promise.all([
          getSellerCategoriesApi(),
          getSellerBrandsApi(),
        ]);

        setCategories(Array.isArray(categoryResponse?.data) ? categoryResponse.data : []);
        setBrands(Array.isArray(brandResponse?.data) ? brandResponse.data : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load product options.");
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image?.type === "new" && image.preview) URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  };

  const addVariant = () => {
    setFormData((previous) => ({
      ...previous,
      variants: [
        ...previous.variants,
        { sku: "", color: "", size: "", price: previous.basePrice || "", stock: 0 },
      ],
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length <= 1) return;
    setFormData((previous) => ({
      ...previous,
      variants: previous.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  };

  const addImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Each image must be smaller than 5MB.");
      return;
    }
    if (images.length >= 10) {
      setError("A product can have maximum 10 images.");
      return;
    }

    setError("");
    setImages((previous) => [
      ...previous,
      { type: "new", file, preview: URL.createObjectURL(file) },
    ]);
  };

  const removeImage = (index) => {
    setImages((previous) => {
      const image = previous[index];
      if (image?.type === "new" && image.preview) URL.revokeObjectURL(image.preview);
      return previous.filter((_, imageIndex) => imageIndex !== index);
    });
  };

  const setPrimary = async (index) => {
    const image = images[index];
    if (!image || image.type !== "existing" || !product?._id) return;

    try {
      setLoading(true);
      setError("");
      const response = await setPrimaryProductImageApi(product._id, image.url);
      const updatedImages = response?.data?.images;

      if (Array.isArray(updatedImages)) {
        const newImages = images.filter((item) => item.type === "new");
        setImages([
          ...updatedImages.map((url) => ({ type: "existing", url })),
          ...newImages,
        ]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to set primary image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!product?._id) return;

    setLoading(true);
    setError("");

    try {
      const originalImages = Array.isArray(product.images) ? product.images : [];
      const keptExistingImages = images
        .filter((image) => image.type === "existing")
        .map((image) => image.url);
      const removedImages = originalImages.filter((url) => !keptExistingImages.includes(url));
      const newImages = images
        .filter((image) => image.type === "new")
        .map((image) => image.file);

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim(),
        category: formData.category,
        subcategory:
          formData.category === (product.category?._id || product.category)
            ? formData.subcategory || null
            : null,
        brand: formData.brand,
        basePrice: Number(formData.basePrice),
        discount: Number(formData.discount || 0),
        lowStockThreshold: Number(formData.lowStockThreshold || 0),
        variants: formData.variants.map((variant) => ({
          ...variant,
          price: Number(variant.price || formData.basePrice),
          stock: Number(variant.stock || 0),
        })),
        isActive: Boolean(formData.isActive),
      };

      // 1. Update the existing product. Never create a new product here.
      await updateProductApi(product._id, updateData);

      // 2. Remove deleted existing images.
      for (const image of removedImages) {
        await deleteProductImageApi(product._id, image);
      }

      // 3. Upload newly selected files.
      if (newImages.length) {
        await uploadProductImagesApi(product._id, newImages);
      }

      // 4. Re-fetch the current filtered product list so the table updates immediately.
      await dispatch(fetchSellerProducts()).unwrap();
      onClose();
    } catch (err) {
      console.error("Update product error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <div className="product-modal-backdrop">
      <div className="product-modal-card">
        <div className="product-modal-header">
          <h3 className="product-modal-title">Edit Store Product</h3>
          <button type="button" onClick={onClose} className="product-modal-close-btn" disabled={loading}>
            <FiX />
          </button>
        </div>

        {error && <div className="seller-setup-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Product Name *</label>
            <input className="seller-setup-input" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="product-modal-grid-2">
            <div>
              <label className="seller-setup-label">Category *</label>
              <select className="seller-setup-input" name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="seller-setup-label">Brand *</label>
              <select className="seller-setup-input" name="brand" value={formData.brand} onChange={handleChange} required>
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>{brand.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="product-modal-grid-2">
            <div>
              <label className="seller-setup-label">Base Price (₹) *</label>
              <input className="seller-setup-input" type="number" min="0" name="basePrice" value={formData.basePrice} onChange={handleChange} required />
            </div>
            <div>
              <label className="seller-setup-label">Discount (%)</label>
              <input className="seller-setup-input" type="number" min="0" max="100" name="discount" value={formData.discount} onChange={handleChange} />
            </div>
          </div>

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Short Description</label>
            <input className="seller-setup-input" name="shortDescription" value={formData.shortDescription} onChange={handleChange} />
          </div>

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Description *</label>
            <textarea className="seller-setup-textarea" name="description" value={formData.description} onChange={handleChange} rows="3" required />
          </div>

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Low Stock Threshold</label>
            <input className="seller-setup-input" type="number" min="0" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} />
          </div>

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Product Images</label>
            <div style={{ display: "grid", gap: "10px" }}>
              {images.map((image, index) => (
                <div key={`${image.url || image.preview}-${index}`} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <img
                    src={image.type === "existing" ? image.url : image.preview}
                    alt={`Product ${index + 1}`}
                    style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <div style={{ flex: 1, fontSize: "12px", color: "#64748b" }}>
                    {image.type === "existing" ? (index === 0 ? "Primary image" : "Product image") : "New image"}
                  </div>
                  {image.type === "existing" && index !== 0 && (
                    <button type="button" className="my-products-icon-btn" title="Set primary" onClick={() => setPrimary(index)} disabled={loading}>
                      <FiStar />
                    </button>
                  )}
                  <button type="button" className="my-products-icon-btn delete" title="Remove image" onClick={() => removeImage(index)} disabled={loading}>
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            {images.length < 10 && (
              <label className="seller-action-btn" style={{ display: "inline-flex", marginTop: "10px", cursor: loading ? "not-allowed" : "pointer" }}>
                <FiPlus /> Add Image
                <input type="file" accept="image/*" onChange={addImage} disabled={loading} style={{ display: "none" }} />
              </label>
            )}
          </div>

          <div className="seller-setup-field" style={{ marginBottom: "16px" }}>
            <label className="seller-setup-label">Variants (SKU, Color, Size, Stock)</label>
            {formData.variants.map((variant, index) => (
              <div key={index} className="product-modal-grid-3" style={{ marginBottom: "8px", alignItems: "center" }}>
                <input className="seller-setup-input" placeholder="SKU *" value={variant.sku} onChange={(event) => handleVariantChange(index, "sku", event.target.value)} required />
                <input className="seller-setup-input" placeholder="Color" value={variant.color} onChange={(event) => handleVariantChange(index, "color", event.target.value)} />
                <div style={{ display: "flex", gap: "6px" }}>
                  <input className="seller-setup-input" type="number" min="0" placeholder="Stock *" value={variant.stock} onChange={(event) => handleVariantChange(index, "stock", event.target.value)} required />
                  {formData.variants.length > 1 && (
                    <button type="button" className="my-products-icon-btn delete" onClick={() => removeVariant(index)} disabled={loading} title="Remove variant">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="seller-action-btn" onClick={addVariant} disabled={loading}>
              <FiPlus /> Add Variant
            </button>
          </div>

          <div className="product-modal-footer">
            <button type="button" onClick={onClose} className="product-modal-cancel-btn" disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading} className="product-modal-submit-btn">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
