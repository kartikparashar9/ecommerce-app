import React, { useEffect, useMemo, useRef, useState } from "react";
import { resolveMediaUrl } from "../../../utils/media";

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

  const activeIndexRef = useRef(0);
  const imageCountRef = useRef(validImages.length);

  // Keep refs synchronized
  useEffect(() => {
    imageCountRef.current = validImages.length;
  }, [validImages.length]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const hasMultipleImages = validImages.length > 1;

  // =====================================================
  // RESET ACTIVE IMAGE ONLY WHEN IMAGE COUNT CHANGES
  // =====================================================

  const previousImageCountRef = useRef(validImages.length);

  useEffect(() => {
    const previousCount = previousImageCountRef.current;
    const currentCount = validImages.length;

    if (previousCount !== currentCount) {
      setActiveIndex((currentIndex) => {
        if (currentCount === 0) {
          return 0;
        }

        return Math.min(currentIndex, currentCount - 1);
      });

      previousImageCountRef.current = currentCount;
    }
  }, [validImages.length]);

  // =====================================================
  // NEXT IMAGE
  // =====================================================

  const nextImage = () => {
    const count = imageCountRef.current;

    if (count <= 1) {
      return;
    }

    setActiveIndex((currentIndex) => {
      const nextIndex = currentIndex >= count - 1 ? 0 : currentIndex + 1;

      activeIndexRef.current = nextIndex;

      return nextIndex;
    });
  };

  // =====================================================
  // PREVIOUS IMAGE
  // =====================================================

  const previousImage = () => {
    const count = imageCountRef.current;

    if (count <= 1) {
      return;
    }

    setActiveIndex((currentIndex) => {
      const previousIndex = currentIndex <= 0 ? count - 1 : currentIndex - 1;

      activeIndexRef.current = previousIndex;

      return previousIndex;
    });
  };

  // =====================================================
  // AUTO SLIDE
  // =====================================================

  useEffect(() => {
    if (validImages.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const count = imageCountRef.current;

      if (count <= 1) {
        return;
      }

      setActiveIndex((currentIndex) => {
        const nextIndex = currentIndex >= count - 1 ? 0 : currentIndex + 1;

        activeIndexRef.current = nextIndex;

        return nextIndex;
      });
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [validImages.length]);

  // =====================================================
  // KEYBOARD NAVIGATION
  // =====================================================

  useEffect(() => {
    if (validImages.length <= 1) {
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
  }, [validImages.length]);

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

  const safeActiveIndex = Math.min(activeIndex, validImages.length - 1);

  const activeImage = validImages[safeActiveIndex] || validImages[0];

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
              safeActiveIndex === index
                ? "product-gallery__thumbnail--active"
                : ""
            }`}
            onClick={() => {
              activeIndexRef.current = index;
              setActiveIndex(index);
            }}
            aria-label={`View image ${index + 1}`}
            aria-current={safeActiveIndex === index ? "true" : undefined}
          >
            <img
              src={resolveMediaUrl(image)}
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
          {safeActiveIndex + 1}/{validImages.length}
        </span>

        <img
          src={resolveMediaUrl(activeImage)}
          alt={`${productName || "Product"} ${safeActiveIndex + 1}`}
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
                safeActiveIndex === index ? "product-gallery__dot--active" : ""
              }`}
              onClick={() => {
                activeIndexRef.current = index;
                setActiveIndex(index);
              }}
              aria-label={`Go to image ${index + 1}`}
              aria-current={safeActiveIndex === index ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
