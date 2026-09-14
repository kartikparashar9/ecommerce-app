import React, { useMemo } from "react";

import "./ProductDescription.css";

const ProductDescription = ({ product }) => {
  if (!product) {
    return null;
  }

  // =====================================================
  // DESCRIPTION
  // =====================================================

  const description = useMemo(() => {
    if (typeof product.description === "string" && product.description.trim()) {
      return product.description.trim();
    }

    if (
      typeof product.shortDescription === "string" &&
      product.shortDescription.trim()
    ) {
      return product.shortDescription.trim();
    }

    return "";
  }, [product.description, product.shortDescription]);

  // =====================================================
  // PRODUCT DETAILS
  // =====================================================

  const brandName =
    typeof product.brandName === "string" && product.brandName.trim()
      ? product.brandName.trim()
      : "—";

  const categoryName =
    typeof product.categoryName === "string" && product.categoryName.trim()
      ? product.categoryName.trim()
      : "—";

  const totalReviews = Number(product.totalReviews);

  const reviewCount = Number.isFinite(totalReviews)
    ? Math.max(0, totalReviews)
    : 0;

  const averageRating = Number(product.averageRating);

  const rating = Number.isFinite(averageRating)
    ? Math.min(Math.max(averageRating, 0), 5)
    : 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section className="product-description">
      <h2>About this product</h2>

      {description ? (
        <div className="product-description__text">{description}</div>
      ) : (
        <p className="product-description__empty">
          Product description is not available.
        </p>
      )}

      <div className="product-description__details">
        <div>
          <span>Brand</span>
          <strong>{brandName}</strong>
        </div>

        <div>
          <span>Category</span>
          <strong>{categoryName}</strong>
        </div>

        <div>
          <span>Reviews</span>
          <strong>{reviewCount}</strong>
        </div>

        <div>
          <span>Rating</span>
          <strong>{rating.toFixed(1)}/ 5</strong>
        </div>
      </div>
    </section>
  );
};

export default ProductDescription;
