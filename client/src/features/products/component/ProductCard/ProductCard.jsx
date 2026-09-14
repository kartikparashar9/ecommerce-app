import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star, Check } from "lucide-react";

import { addToCart } from "../../../cart/CartSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../../wishlist/WishlistSlice";

import "./ProductCard.css";

// =====================================================
// HELPERS
// =====================================================

const getWishlistProductId = (item) => {
  return (
    item?._id ||
    item?.product?._id ||
    item?.product?.id ||
    item?.productId ||
    item?.id ||
    null
  );
};

const getProductId = (product) => {
  return product?._id || product?.id || null;
};

const getProductSlug = (product) => {
  return typeof product?.slug === "string" && product.slug.trim()
    ? product.slug.trim()
    : "";
};

const getAvailableVariant = (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  return (
    variants.find(
      (variant) =>
        variant && variant.isActive !== false && Number(variant.stock) > 0,
    ) ||
    variants.find((variant) => variant && variant.isActive !== false) ||
    null
  );
};

// =====================================================
// COMPONENT
// =====================================================

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [cartBusy, setCartBusy] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [message, setMessage] = useState("");

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  // =====================================================
  // PRODUCT DATA
  // =====================================================

  const productId = getProductId(product);
  const slug = getProductSlug(product);

  const {
    name = "Product",
    shortDescription = "",
    categoryName = "",
    image = "",
    price = 0,
    oldPrice = 0,
    discount = 0,
    rating = 0,
    ratingCount = 0,
    stock = 0,
    variants = [],
  } = product || {};

  // =====================================================
  // VARIANT
  // =====================================================

  const firstAvailableVariant = useMemo(
    () => getAvailableVariant(variants),
    [variants],
  );

  // =====================================================
  // STOCK
  // =====================================================

  const productStock = Number(stock);

  const availableStock = Number.isFinite(productStock)
    ? Math.max(0, productStock)
    : 0;

  const hasVariants = Array.isArray(variants) && variants.length > 0;

  const variantStock = Number(firstAvailableVariant?.stock);

  const isOutOfStock = hasVariants
    ? !firstAvailableVariant ||
      !Number.isFinite(variantStock) ||
      variantStock <= 0
    : availableStock <= 0;

  // =====================================================
  // WISHLIST STATUS
  // =====================================================

  const wishlisted = useMemo(() => {
    if (!productId || !Array.isArray(wishlistItems)) {
      return false;
    }

    return wishlistItems.some(
      (item) => String(getWishlistProductId(item)) === String(productId),
    );
  }, [wishlistItems, productId]);

  // =====================================================
  // MESSAGE
  // =====================================================

  const showMessage = (text) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 1600);
  };

  // =====================================================
  // OPEN PRODUCT
  // =====================================================

  const openProduct = () => {
    if (!slug) {
      return;
    }

    navigate(`/product/${encodeURIComponent(slug)}`);
  };

  // =====================================================
  // KEYBOARD NAVIGATION
  // =====================================================

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleCart = async (event) => {
    event.stopPropagation();

    if (isOutOfStock || !productId || cartBusy) {
      return;
    }

    setCartBusy(true);

    try {
      await dispatch(
        addToCart({
          productId: String(productId),
          variantId: firstAvailableVariant?._id
            ? String(firstAvailableVariant._id)
            : null,
          quantity: 1,
        }),
      ).unwrap();

      showMessage("Added to cart");
    } catch (error) {
      showMessage(
        typeof error === "string"
          ? error
          : error?.message || "Unable to add to cart",
      );
    } finally {
      setCartBusy(false);
    }
  };

  // =====================================================
  // WISHLIST
  // =====================================================

  const handleWishlist = async (event) => {
    event.stopPropagation();

    if (!productId || wishlistBusy) {
      return;
    }

    setWishlistBusy(true);

    try {
      if (wishlisted) {
        await dispatch(removeFromWishlist(String(productId))).unwrap();

        showMessage("Removed from wishlist");
      } else {
        await dispatch(addToWishlist(String(productId))).unwrap();

        showMessage("Added to wishlist");
      }
    } catch (error) {
      showMessage(
        typeof error === "string"
          ? error
          : error?.message || "Unable to update wishlist",
      );
    } finally {
      setWishlistBusy(false);
    }
  };

  // =====================================================
  // INVALID PRODUCT
  // =====================================================

  if (!product) {
    return null;
  }

  // =====================================================
  // SAFE DISPLAY VALUES
  // =====================================================

  const numericPrice = Number.isFinite(Number(price)) ? Number(price) : 0;

  const numericOldPrice = Number.isFinite(Number(oldPrice))
    ? Number(oldPrice)
    : 0;

  const numericDiscount = Number.isFinite(Number(discount))
    ? Math.max(0, Number(discount))
    : 0;

  const numericRating = Number.isFinite(Number(rating))
    ? Math.min(Math.max(Number(rating), 0), 5)
    : 0;

  const numericRatingCount = Number.isFinite(Number(ratingCount))
    ? Math.max(0, Number(ratingCount))
    : 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <article
      className="product-card"
      onClick={openProduct}
      role="link"
      tabIndex={slug ? 0 : -1}
      onKeyDown={handleCardKeyDown}
    >
      {/* =================================================
          IMAGE
          ================================================= */}

      <div className="product-card__image-wrapper">
        {numericDiscount > 0 && (
          <span className="product-card__discount">{numericDiscount}% OFF</span>
        )}

        {/* =================================================
            WISHLIST
            ================================================= */}

        <button
          type="button"
          className={`product-card__wishlist ${
            wishlisted ? "product-card__wishlist--active" : ""
          }`}
          onClick={handleWishlist}
          disabled={wishlistBusy}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
        >
          <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
        </button>

        {/* =================================================
            PRODUCT IMAGE
            ================================================= */}

        {typeof image === "string" && image.trim() ? (
          <img
            src={image}
            alt={name}
            className="product-card__image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="product-card__image-placeholder">No image</div>
        )}

        {/* =================================================
            CART
            ================================================= */}

        <button
          type="button"
          className="product-card__cart"
          onClick={handleCart}
          disabled={isOutOfStock || cartBusy}
        >
          {isOutOfStock ? (
            "Out of Stock"
          ) : cartBusy ? (
            "Please wait..."
          ) : (
            <>
              <ShoppingCart size={16} />
              Add to Cart
            </>
          )}
        </button>
      </div>

      {/* =================================================
          CONTENT
          ================================================= */}

      <div className="product-card__content">
        {categoryName && (
          <span className="product-card__category">{categoryName}</span>
        )}

        <h3 className="product-card__name">{name}</h3>

        {shortDescription && (
          <p className="product-card__description">{shortDescription}</p>
        )}

        {/* =================================================
            RATING
            ================================================= */}

        <div className="product-card__rating">
          <span className="product-card__stars">
            <Star size={14} fill="currentColor" />

            {numericRating.toFixed(1)}
          </span>

          <span className="product-card__rating-count">
            ({numericRatingCount})
          </span>
        </div>

        {/* =================================================
            PRICE
            ================================================= */}

        <div className="product-card__price">
          <strong>₹{numericPrice.toLocaleString("en-IN")}</strong>

          {numericOldPrice > numericPrice && (
            <del>₹{numericOldPrice.toLocaleString("en-IN")}</del>
          )}

          {numericDiscount > 0 && <span>{numericDiscount}% off</span>}
        </div>

        {/* =================================================
            ACTION MESSAGE
            ================================================= */}

        {message && (
          <span className="product-card__message">
            <Check size={13} />
            {message}
          </span>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
