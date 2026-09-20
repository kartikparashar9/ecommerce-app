import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Heart,
  ShoppingCart,
  Star,
} from "lucide-react";

import { addToCart } from "../../../cart/CartSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../../wishlist/WishlistSlice";
import { resolveMediaUrl } from "../../../utils/media";
import "./ProductCard.css";

const getId = (value) =>
  value?._id || value?.id || value?.productId || value?.product?._id || null;

const getAvailableVariant = (variants) => {
  if (!Array.isArray(variants) || !variants.length) return null;

  return (
    variants.find(
      (variant) =>
        variant &&
        variant.isActive !== false &&
        Number(variant.stock) > 0,
    ) || null
  );
};

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [cartBusy, setCartBusy] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [message, setMessage] = useState("");

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const isAuthenticated = Boolean(
    useSelector((state) => state.auth?.isAuthenticated),
  );

  const productId = getId(product);
  const slug =
    typeof product?.slug === "string" ? product.slug.trim() : "";

  const name = product?.name || "Product";
  const description =
    product?.shortDescription || product?.description || "";

  const categoryName =
    product?.categoryName ||
    product?.category?.name ||
    product?.category ||
    "";

  const image = resolveMediaUrl(
    product?.image ||
      product?.images?.[0] ||
      product?.thumbnail,
  );


  const rating = Math.min(
    Math.max(
      Number(product?.averageRating ?? product?.rating ?? 0) || 0,
      0,
    ),
    5,
  );

  const ratingCount = Math.max(
    Number(product?.totalReviews ?? product?.ratingCount ?? 0) || 0,
    0,
  );

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const firstAvailableVariant = useMemo(
    () => getAvailableVariant(variants),
    [variants],
  );

  const oldPrice = Number(
    firstAvailableVariant?.price ??
      product?.basePrice ??
      product?.mrp ??
      product?.oldPrice ??
      product?.originalPrice ??
      0,
  );

  const discount = Math.min(Math.max(Number(product?.discount ?? 0) || 0, 0), 100);
  const price = Math.max(0, Math.round((oldPrice - (oldPrice * discount) / 100) * 100) / 100);

  const stock = Math.max(
    Number(
      firstAvailableVariant?.stock ??
        product?.totalStock ??
        product?.stock ??
        product?.quantity ??
        0,
    ) || 0,
    0,
  );

  const isOutOfStock = stock <= 0;

  const wishlisted = useMemo(
    () =>
      Boolean(productId) &&
      wishlistItems.some(
        (item) => String(getId(item)) === String(productId),
      ),
    [wishlistItems, productId],
  );

  const inCart = useMemo(
    () =>
      Boolean(productId) &&
      cartItems.some(
        (item) =>
          String(
            item?.product?._id ||
              item?.product?.id ||
              item?.productId,
          ) === String(productId),
      ),
    [cartItems, productId],
  );

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1800);
  };

  const requireAuth = () => {
    if (isAuthenticated) return true;

    navigate("/login", {
      state: { from: window.location.pathname },
    });

    return false;
  };

  const openProduct = () => {
    if (slug) navigate(`/product/${encodeURIComponent(slug)}`);
  };

  const handleCardKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === " ") && slug) {
      event.preventDefault();
      openProduct();
    }
  };

  const handleCart = async (event) => {
    event.stopPropagation();

    if (
      !productId ||
      isOutOfStock ||
      inCart ||
      cartBusy ||
      !requireAuth()
    ) {
      return;
    }

    setCartBusy(true);

    try {
      await dispatch(
        addToCart({
          productId: String(productId),
          product,
          quantity: 1,
          ...(firstAvailableVariant?._id
            ? { variantId: String(firstAvailableVariant._id) }
            : {}),
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

  const handleWishlist = async (event) => {
    event.stopPropagation();

    if (!productId || wishlistBusy || !requireAuth()) return;

    setWishlistBusy(true);

    try {
      if (wishlisted) {
        await dispatch(
          removeFromWishlist(String(productId)),
        ).unwrap();
        showMessage("Removed from wishlist");
      } else {
        await dispatch(
          addToWishlist({
            productId: String(productId),
            product,
          }),
        ).unwrap();
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

  if (!product) return null;

  return (
    <article
      className="product-card"
      onClick={openProduct}
      role={slug ? "link" : undefined}
      tabIndex={slug ? 0 : -1}
      onKeyDown={handleCardKeyDown}
    >
      <div className="product-card__image-wrapper">
        {discount > 0 && (
          <span className="product-card__discount">
            {discount}% OFF
          </span>
        )}

        {inCart && (
          <span className="product-card__cart-mark">
            <Check size={12} /> In Cart
          </span>
        )}

        <button
          type="button"
          className={`product-card__wishlist ${
            wishlisted ? "product-card__wishlist--active" : ""
          }`}
          onClick={handleWishlist}
          disabled={wishlistBusy}
          aria-label={
            wishlisted
              ? `Remove ${name} from wishlist`
              : `Add ${name} to wishlist`
          }
          aria-pressed={wishlisted}
        >
          <Heart
            size={18}
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>

        {image ? (
          <img
            src={image}
            alt={name}
            className="product-card__image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="product-card__image-placeholder">
            No image
          </div>
        )}

        <button
          type="button"
          className={`product-card__cart ${
            inCart ? "product-card__cart--added" : ""
          }`}
          onClick={handleCart}
          disabled={isOutOfStock || inCart || cartBusy}
        >
          {isOutOfStock ? (
            "Out of Stock"
          ) : inCart ? (
            <>
              <Check size={16} /> In Cart
            </>
          ) : cartBusy ? (
            "Please wait..."
          ) : (
            <>
              <ShoppingCart size={16} /> Add to Cart
            </>
          )}
        </button>
      </div>

      <div className="product-card__content">
        {categoryName && (
          <span className="product-card__category">
            {categoryName}
          </span>
        )}

        <h3 className="product-card__name">{name}</h3>

        {description && (
          <p className="product-card__description">
            {description}
          </p>
        )}

        <div
          className="product-card__rating"
          aria-label={`${rating.toFixed(
            1,
          )} out of 5 from ${ratingCount} reviews`}
        >
          <span className="product-card__stars">
            <Star size={14} fill="currentColor" />{" "}
            {rating.toFixed(1)}
          </span>
          <span className="product-card__rating-count">
            ({ratingCount})
          </span>
        </div>

        <div className="product-card__price">
          <strong>
            ₹{price.toLocaleString("en-IN")}
          </strong>

          {oldPrice > price && (
            <del>
              MRP ₹{oldPrice.toLocaleString("en-IN")}
            </del>
          )}

          {discount > 0 && <span>{discount}% off</span>}
        </div>

        {message && (
          <span
            className="product-card__message"
            role="status"
          >
            <Check size={13} /> {message}
          </span>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
