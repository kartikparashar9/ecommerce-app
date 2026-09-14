import React, { useEffect, useMemo, useState } from "react";
import { Heart, ShoppingCart, Zap } from "lucide-react";

import "./ProductActions.css";

const ProductActions = ({
  stock = 0,
  selectedVariant = null,
  onAddToCart,
  onBuyNow,
  onWishlist,
  isWishlisted = false,
}) => {
  // =====================================================
  // STOCK
  // =====================================================

  const availableStock = useMemo(() => {
    const variantStock =
      selectedVariant?.stock !== undefined && selectedVariant?.stock !== null
        ? Number(selectedVariant.stock)
        : Number(stock);

    return Number.isFinite(variantStock) ? Math.max(0, variantStock) : 0;
  }, [selectedVariant?.stock, stock]);

  const isOutOfStock = availableStock <= 0;

  // =====================================================
  // QUANTITY
  // =====================================================

  const [quantity, setQuantity] = useState(1);

  // Keep quantity valid whenever selected variant/stock changes.
  useEffect(() => {
    setQuantity((currentQuantity) => {
      if (availableStock <= 0) {
        return 1;
      }

      return Math.min(Math.max(currentQuantity, 1), availableStock);
    });
  }, [availableStock]);

  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  const increase = () => {
    if (isOutOfStock) {
      return;
    }

    setQuantity((currentQuantity) =>
      Math.min(currentQuantity + 1, availableStock),
    );
  };

  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  const decrease = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  // =====================================================
  // API PAYLOAD
  // =====================================================

  const payload = useMemo(() => {
    const variantId = selectedVariant?._id || selectedVariant?.id || null;

    return {
      quantity,
      variantId: variantId ? String(variantId) : null,
    };
  }, [quantity, selectedVariant]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    onAddToCart?.(payload);
  };

  // =====================================================
  // BUY NOW
  // =====================================================

  const handleBuyNow = () => {
    if (isOutOfStock) {
      return;
    }

    onBuyNow?.(payload);
  };

  // =====================================================
  // WISHLIST
  // =====================================================

  const handleWishlist = () => {
    onWishlist?.();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="product-actions">
      {/* =================================================
          QUANTITY
          ================================================= */}

      {!isOutOfStock && (
        <div className="product-actions__quantity">
          <span>Quantity</span>

          <div>
            <button
              type="button"
              onClick={decrease}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>

            <strong>{quantity}</strong>

            <button
              type="button"
              onClick={increase}
              disabled={quantity >= availableStock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          CART / BUY NOW
          ================================================= */}

      <div className="product-actions__buttons">
        <button
          type="button"
          className="product-actions__cart"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart size={18} />

          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>

        <button
          type="button"
          className="product-actions__buy"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
        >
          <Zap size={17} />

          {isOutOfStock ? "Out of Stock" : "Buy Now"}
        </button>
      </div>

      {/* =================================================
          WISHLIST
          ================================================= */}

      <button
        type="button"
        className={`product-actions__wishlist ${
          isWishlisted ? "product-actions__wishlist--active" : ""
        }`}
        onClick={handleWishlist}
        aria-pressed={isWishlisted}
        aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />

        {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      </button>
    </div>
  );
};

export default ProductActions;
