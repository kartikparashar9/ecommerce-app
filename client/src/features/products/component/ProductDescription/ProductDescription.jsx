import React, { useMemo } from "react";

import "./ProductDescription.css";

const ProductDescription = ({ product }) => {
  const description = useMemo(() => {
    const value = product?.description;

    return typeof value === "string" ? value.trim() : "";
  }, [product?.description]);

  const shortDescription = useMemo(() => {
    const value = product?.shortDescription;

    return typeof value === "string" ? value.trim() : "";
  }, [product?.shortDescription]);

  if (!product) {
    return null;
  }

  const brandName =
    typeof product.brandName === "string" && product.brandName.trim()
      ? product.brandName.trim()
      : typeof product.brand?.name === "string"
        ? product.brand.name.trim()
        : "—";

  const categoryName =
    typeof product.categoryName === "string" && product.categoryName.trim()
      ? product.categoryName.trim()
      : typeof product.category?.name === "string"
        ? product.category.name.trim()
        : "—";

  const totalReviews = Number(product.totalReviews ?? product.ratingCount ?? 0);

  const reviewCount = Number.isFinite(totalReviews)
    ? Math.max(0, totalReviews)
    : 0;

  const averageRating = Number(product.averageRating ?? product.rating ?? 0);

  const rating = Number.isFinite(averageRating)
    ? Math.min(Math.max(averageRating, 0), 5)
    : 0;

  return (
    <section className="product-description">
      <h2>About this product</h2>

      {shortDescription && (
        <p className="product-description__short">{shortDescription}</p>
      )}

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
          <strong>{rating.toFixed(1)}/5</strong>
        </div>
      </div>
    </section>
  );
};

export default ProductDescription;
