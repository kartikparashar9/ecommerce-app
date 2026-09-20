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
  isInCart = false,
}) => {
  const availableStock = useMemo(() => {
    const variantStock =
      selectedVariant?.stock !== undefined && selectedVariant?.stock !== null
        ? Number(selectedVariant.stock)
        : Number(stock);

    return Number.isFinite(variantStock) ? Math.max(0, variantStock) : 0;
  }, [selectedVariant?.stock, stock]);

  const isOutOfStock = availableStock <= 0;

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity((currentQuantity) => {
      if (availableStock <= 0) {
        return 1;
      }

      return Math.min(Math.max(currentQuantity, 1), availableStock);
    });
  }, [availableStock]);

  const increase = () => {
    if (isOutOfStock) {
      return;
    }

    setQuantity((currentQuantity) =>
      Math.min(currentQuantity + 1, availableStock),
    );
  };

  const decrease = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const payload = useMemo(() => {
    const variantId = selectedVariant?._id || selectedVariant?.id || null;

    return {
      quantity,
      variantId: variantId ? String(variantId) : null,
    };
  }, [quantity, selectedVariant]);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    onAddToCart?.(payload);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      return;
    }

    onBuyNow?.(payload);
  };

  return (
    <div className="product-actions">
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

      <div className="product-actions__buttons">
        <button
          type="button"
          className={`product-actions__cart ${
            isInCart ? "product-actions__cart--active" : ""
          }`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart size={18} />

          {isOutOfStock
            ? "Out of Stock"
            : isInCart
              ? "Added to Cart"
              : "Add to Cart"}
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

      <button
        type="button"
        className={`product-actions__wishlist ${
          isWishlisted ? "product-actions__wishlist--active" : ""
        }`}
        onClick={() => onWishlist?.()}
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
