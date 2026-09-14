import React, { useEffect, useMemo } from "react";

import "./ProductVariants.css";

const ProductVariants = ({
  variants = [],
  selectedVariant,
  onVariantChange,
}) => {
  // =====================================================
  // ACTIVE VARIANTS
  // =====================================================

  const activeVariants = useMemo(() => {
    if (!Array.isArray(variants)) {
      return [];
    }

    return variants.filter(
      (variant) =>
        variant &&
        typeof variant === "object" &&
        variant.isActive !== false,
    );
  }, [variants]);

  // =====================================================
  // COLORS
  // =====================================================

  const colors = useMemo(() => {
    return [
      ...new Set(
        activeVariants
          .map((variant) => variant.color)
          .filter(
            (color) =>
              typeof color === "string" && color.trim().length > 0,
          )
          .map((color) => color.trim()),
      ),
    ];
  }, [activeVariants]);

  // =====================================================
  // SIZES
  // =====================================================

  const sizes = useMemo(() => {
    return [
      ...new Set(
        activeVariants
          .map((variant) => variant.size)
          .filter(
            (size) =>
              typeof size === "string" && size.trim().length > 0,
          )
          .map((size) => size.trim()),
      ),
    ];
  }, [activeVariants]);

  // =====================================================
  // DEFAULT VARIANT
  // =====================================================

  useEffect(() => {
    if (!activeVariants.length || selectedVariant) {
      return;
    }

    const firstAvailableVariant =
      activeVariants.find(
        (variant) => Number(variant.stock) > 0,
      ) || activeVariants[0];

    onVariantChange?.(firstAvailableVariant);
  }, [activeVariants, selectedVariant, onVariantChange]);

  // =====================================================
  // NO VARIANTS
  // =====================================================

  if (!activeVariants.length) {
    return null;
  }

  const selectedColor = selectedVariant?.color || null;
  const selectedSize = selectedVariant?.size || null;

  // =====================================================
  // FIND VARIANT
  // =====================================================

  const selectVariant = (
    color = selectedColor,
    size = selectedSize,
  ) => {
    const exactVariant = activeVariants.find((variant) => {
      const colorMatches = color
        ? variant.color === color
        : !variant.color;

      const sizeMatches = size
        ? variant.size === size
        : !variant.size;

      return colorMatches && sizeMatches;
    });

    const fallbackVariant = activeVariants.find((variant) => {
      const colorMatches = color
        ? variant.color === color
        : true;

      const sizeMatches = size
        ? variant.size === size
        : true;

      return colorMatches && sizeMatches;
    });

    const availableVariant =
      exactVariant?.stock > 0
        ? exactVariant
        : fallbackVariant?.stock > 0
          ? fallbackVariant
          : exactVariant || fallbackVariant;

    onVariantChange?.(
      availableVariant || activeVariants[0],
    );
  };

  // =====================================================
  // CHECK OPTION AVAILABILITY
  // =====================================================

  const optionAvailable = (type, value) => {
    return activeVariants.some((variant) => {
      const stock = Number(variant.stock) || 0;

      // Out-of-stock variants should not make an option
      // appear available.
      if (stock <= 0) {
        return false;
      }

      if (type === "color") {
        return (
          variant.color === value &&
          (!selectedSize ||
            !variant.size ||
            variant.size === selectedSize)
        );
      }

      return (
        variant.size === value &&
        (!selectedColor ||
          !variant.color ||
          variant.color === selectedColor)
      );
    });
  };

  // =====================================================
  // SELECTED VARIANT STOCK
  // =====================================================

  const selectedStock =
    selectedVariant?.stock !== undefined &&
    selectedVariant?.stock !== null
      ? Number(selectedVariant.stock) || 0
      : null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="product-variants">
      {/* =================================================
          COLOR OPTIONS
          ================================================= */}

      {colors.length > 0 && (
        <div className="product-variants__group">
          <div className="product-variants__label">
            <strong>Color</strong>

            {selectedColor && (
              <span>{selectedColor}</span>
            )}
          </div>

          <div className="product-variants__options">
            {colors.map((color) => {
              const available = optionAvailable(
                "color",
                color,
              );

              return (
                <button
                  type="button"
                  key={color}
                  disabled={!available}
                  className={`product-variants__option ${
                    selectedColor === color
                      ? "product-variants__option--selected"
                      : ""
                  }`}
                  onClick={() =>
                    selectVariant(color, selectedSize)
                  }
                  aria-pressed={
                    selectedColor === color
                  }
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================
          SIZE OPTIONS
          ================================================= */}

      {sizes.length > 0 && (
        <div className="product-variants__group">
          <div className="product-variants__label">
            <strong>Size</strong>

            {selectedSize && (
              <span>{selectedSize}</span>
            )}
          </div>

          <div className="product-variants__options">
            {sizes.map((size) => {
              const available = optionAvailable(
                "size",
                size,
              );

              return (
                <button
                  type="button"
                  key={size}
                  disabled={!available}
                  className={`product-variants__option ${
                    selectedSize === size
                      ? "product-variants__option--selected"
                      : ""
                  }`}
                  onClick={() =>
                    selectVariant(selectedColor, size)
                  }
                  aria-pressed={
                    selectedSize === size
                  }
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================
          VARIANT AVAILABILITY
          ================================================= */}

      {selectedStock !== null && (
        <div
          className={`product-variants__availability ${
            selectedStock > 0
              ? "is-available"
              : "is-unavailable"
          }`}
        >
          {selectedStock > 0
            ? selectedStock <= 5
              ? `Only ${selectedStock} available`
              : `${selectedStock} available`
            : "This variant is out of stock"}
        </div>
      )}
    </div>
  );
};

export default ProductVariants;

