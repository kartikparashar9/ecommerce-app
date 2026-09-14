import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./ProductGallery.css";
const ProductGallery = ({ images = [], productName = "" }) => {
  // =====================================================
  // NORMALIZE IMAGE DATA
  // =====================================================

  const validImages = useMemo(() => {
    if (!Array.isArray(images)) {
      return [];
    }

    return images
      .filter((image) => typeof image === "string" && image.trim().length > 0)
      .map((image) => image.trim())
      .slice(0, 10);
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);

  const hasMultipleImages = validImages.length > 1;

  // =====================================================
  // NEXT IMAGE
  // =====================================================

  const nextImage = useCallback(() => {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex((currentIndex) =>
      currentIndex >= validImages.length - 1 ? 0 : currentIndex + 1,
    );
  }, [hasMultipleImages, validImages.length]);

  // =====================================================
  // PREVIOUS IMAGE
  // =====================================================

  const previousImage = useCallback(() => {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex((currentIndex) =>
      currentIndex <= 0 ? validImages.length - 1 : currentIndex - 1,
    );
  }, [hasMultipleImages, validImages.length]);

  // =====================================================
  // AUTO SLIDE
  // =====================================================

  useEffect(() => {
    if (!hasMultipleImages) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      nextImage();
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasMultipleImages, nextImage]);

  // =====================================================
  // RESET ACTIVE IMAGE WHEN PRODUCT IMAGES CHANGE
  // =====================================================

  useEffect(() => {
    setActiveIndex((currentIndex) => {
      if (validImages.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, validImages.length - 1);
    });
  }, [validImages]);

  // =====================================================
  // KEYBOARD NAVIGATION
  // =====================================================

  useEffect(() => {
    if (!hasMultipleImages) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        previousImage();
      }

      if (event.key === "ArrowRight") {
        nextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleImages, nextImage, previousImage]);

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (validImages.length === 0) {
    return (
      <div className="product-gallery product-gallery--empty">
        <span>No product image available</span>
      </div>
    );
  }

  const activeImage = validImages[activeIndex] || validImages[0];
  console.log(activeImage)

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="product-gallery">
      {/* =================================================
          THUMBNAILS
          ================================================= */}

      <div className="product-gallery__thumbnails">
        {validImages.map((image, index) => (
          <button
            type="button"
            key={`${image}-${index}`}
            className={`product-gallery__thumbnail ${
              activeIndex === index ? "product-gallery__thumbnail--active" : ""
            }`}
            onClick={() => setActiveIndex(index)}
            aria-label={`View image ${index + 1}`}
            aria-current={activeIndex === index ? "true" : undefined}
          >
            <img
              src={image}
              alt={`${productName || "Product"} ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </button>
        ))}
      </div>

      {/* =================================================
          MAIN IMAGE
          ================================================= */}

      <div className="product-gallery__main">
        <span className="product-gallery__discount">
          {activeIndex + 1}/{validImages.length}
        </span>

        <img
          src={activeImage}
          alt={`${productName || "Product"} ${activeIndex + 1}`}
          className="product-gallery__main-image"
          loading="eager"
          decoding="async"
        />

        {/* =================================================
            PREVIOUS
            ================================================= */}

        {hasMultipleImages && (
          <button
            type="button"
            className="product-gallery__arrow product-gallery__arrow--previous"
            onClick={previousImage}
            aria-label="Previous product image"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M15 18l-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* =================================================
            NEXT
            ================================================= */}

        {hasMultipleImages && (
          <button
            type="button"
            className="product-gallery__arrow product-gallery__arrow--next"
            onClick={nextImage}
            aria-label="Next product image"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M9 18l6-6-6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* =================================================
          DOTS
          ================================================= */}

      {hasMultipleImages && (
        <div className="product-gallery__dots">
          {validImages.map((_, index) => (
            <button
              type="button"
              key={index}
              className={`product-gallery__dot ${
                activeIndex === index ? "product-gallery__dot--active" : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to image ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
