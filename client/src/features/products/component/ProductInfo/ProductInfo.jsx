import React from "react";

import "./ProductInfo.css";

const ProductInfo = ({ product, selectedVariant }) => {
  if (!product) {
    return null;
  }

  // =====================================================
  // BASIC PRODUCT DATA
  // =====================================================

  const name = product.name || "Product";

  const shortDescription = product.shortDescription || "";

  const categoryName =
    product.categoryName ||
    (product.category && typeof product.category === "object"
      ? product.category.name
      : product.category) ||
    "";

  const brandName =
    product.brandName ||
    (product.brand && typeof product.brand === "object"
      ? product.brand.name
      : product.brand) ||
    "";

  // =====================================================
  // PRICE
  // =====================================================

  const productFinalPrice = Number(product.finalPrice ?? product.price ?? 0);

  const productBasePrice = Number(product.basePrice ?? product.oldPrice ?? 0);

  const discount = Number(product.discount ?? 0);

  const variantPrice = Number(selectedVariant?.price);

  const displayPrice =
    Number.isFinite(variantPrice) && variantPrice > 0
      ? variantPrice
      : Number.isFinite(productFinalPrice)
        ? productFinalPrice
        : 0;

  const displayOldPrice = Number.isFinite(productBasePrice)
    ? productBasePrice
    : 0;

  // =====================================================
  // RATING
  // =====================================================

  const rating = Number(product.averageRating ?? product.rating ?? 0);

  const totalReviews = Number(product.totalReviews ?? product.ratingCount ?? 0);

  const safeRating = Number.isFinite(rating) ? rating : 0;

  const safeTotalReviews = Number.isFinite(totalReviews) ? totalReviews : 0;

  // =====================================================
  // STOCK
  // =====================================================

  const productStock = Number(product.totalStock ?? product.stock ?? 0);

  const variantStock = Number(selectedVariant?.stock);

  const stock =
    Number.isFinite(variantStock) && selectedVariant
      ? variantStock
      : Number.isFinite(productStock)
        ? productStock
        : 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="product-info">
      {/* =================================================
          BRAND
      ================================================= */}

      {brandName && <span className="product-info__brand">{brandName}</span>}

      {/* =================================================
          PRODUCT NAME
      ================================================= */}

      <h1 className="product-info__name">{name}</h1>

      {/* =================================================
          RATING
      ================================================= */}

      <div className="product-info__rating-row">
        <span className="product-info__rating">
          <span>{safeRating.toFixed(1)}</span>

          <span>★</span>
        </span>

        <span className="product-info__reviews">
          {safeTotalReviews} Ratings & Reviews
        </span>
      </div>

      {/* =================================================
          CATEGORY
      ================================================= */}

      {categoryName && (
        <div className="product-info__category">
          Category:
          <strong>{categoryName}</strong>
        </div>
      )}

      {/* =================================================
          SHORT DESCRIPTION
      ================================================= */}

      {shortDescription && (
        <p className="product-info__short-description">{shortDescription}</p>
      )}

      <div className="product-info__divider" />

      {/* =================================================
          PRICE
      ================================================= */}

      <div className="product-info__price-row">
        <strong className="product-info__price">
          ₹{displayPrice.toLocaleString("en-IN")}
        </strong>

        {displayOldPrice > displayPrice && (
          <del className="product-info__old-price">
            ₹{displayOldPrice.toLocaleString("en-IN")}
          </del>
        )}

        {discount > 0 && (
          <span className="product-info__discount">{discount}% OFF</span>
        )}
      </div>

      {/* =================================================
          TAX
      ================================================= */}

      <p className="product-info__tax">Inclusive of all taxes</p>

      {/* =================================================
          STOCK
      ================================================= */}

      <div
        className={`product-info__stock ${
          stock > 0
            ? "product-info__stock--available"
            : "product-info__stock--unavailable"
        }`}
      >
        {stock > 0 ? (
          <>
            <span>✓</span>

            {stock <= 5 ? `Only ${stock} left` : "In Stock"}
          </>
        ) : (
          <>
            <span>×</span>
            Out of Stock
          </>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
