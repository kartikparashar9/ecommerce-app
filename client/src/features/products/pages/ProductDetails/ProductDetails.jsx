import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import { addToCart, fetchCart } from "../../../cart/CartSlice";

import {
  addToWishlist,
  fetchWishlist,
  removeFromWishlist,
} from "../../../wishlist/WishlistSlice";

import {
  clearCurrentProduct,
  fetchProductBySlug,
  fetchProducts,
} from "../../ProductSlice";

import ProductGallery from "../../component/ProductGallery/ProductGallery";
import ProductInfo from "../../component/ProductInfo/ProductInfo";
import ProductVariants from "../../component/PropductVariants/ProductVariants";
import ProductActions from "../../component/ProductActions/ProductActions";
import ProductDescription from "../../component/ProductDescription/ProductDescription";
import ProductReviews from "../../component/ProductReviews/ProductReviews";
import ProductCard from "../../component/ProductCard/ProductCard";

import "./ProductDetails.css";

// =====================================================
// HELPERS
// =====================================================

const getProductId = (product) => {
  if (!product) {
    return null;
  }

  return product._id || product.id || null;
};

const getWishlistProductId = (item) => {
  if (!item) {
    return null;
  }

  return (
    item?.product?._id ||
    item?.product?.id ||
    item?.productId ||
    item?._id ||
    item?.id ||
    null
  );
};

const getCartProductId = (item) => {
  if (!item) {
    return null;
  }

  return (
    item?.product?._id ||
    item?.product?.id ||
    item?.productId ||
    (typeof item?.product === "string" ? item.product : null) ||
    null
  );
};

const getCategoryId = (product) => {
  if (!product) {
    return null;
  }

  if (product.categoryId) {
    return product.categoryId;
  }

  if (product.category && typeof product.category === "object") {
    return product.category._id || null;
  }

  if (typeof product.category === "string") {
    return product.category;
  }

  return null;
};

// =====================================================
// PRODUCT DETAILS
// =====================================================

const ProductDetails = () => {
  const { slug } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ===================================================
  // REDUX STATE
  // ===================================================

  const productsState = useSelector((state) => state.products || {});

  const { currentProduct, currentLoading, currentError, items } = productsState;

  const authState = useSelector((state) => state.auth || {});

  const wishlistState = useSelector((state) => state.wishlist || {});

  const cartState = useSelector((state) => state.cart || {});

  const isAuthenticated = Boolean(authState.isAuthenticated);

  const wishlistItems = Array.isArray(wishlistState.items)
    ? wishlistState.items
    : [];

  // IMPORTANT:
  // CartSlice may use items as the cart array.
  // Keep it safely normalized.
  const cartItems = Array.isArray(cartState.items) ? cartState.items : [];

  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [selectedVariant, setSelectedVariant] = useState(null);

  const [actionMessage, setActionMessage] = useState("");

  // ===================================================
  // FETCH PRODUCT
  // ===================================================

  useEffect(() => {
    if (!slug) {
      return;
    }

    let decodedSlug = "";

    try {
      decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
    } catch {
      decodedSlug = slug.trim().toLowerCase();
    }

    if (!decodedSlug) {
      return;
    }

    // Clear only when slug changes.
    dispatch(clearCurrentProduct());

    // Fetch exactly once.
    dispatch(fetchProductBySlug(decodedSlug));
  }, [dispatch, slug]);

  // ===================================================
  // DEFAULT VARIANT
  // ===================================================

  useEffect(() => {
    const variants = Array.isArray(currentProduct?.variants)
      ? currentProduct.variants
      : [];

    if (variants.length === 0) {
      setSelectedVariant((previous) => (previous === null ? previous : null));

      return;
    }

    const activeVariants = variants.filter(
      (variant) => variant && variant.isActive !== false,
    );

    if (activeVariants.length === 0) {
      setSelectedVariant((previous) => (previous === null ? previous : null));

      return;
    }

    setSelectedVariant((previous) => {
      // Keep the user's selected variant.
      if (previous?._id) {
        const sameVariant = activeVariants.find(
          (variant) => String(variant._id) === String(previous._id),
        );

        if (sameVariant) {
          return sameVariant;
        }
      }

      // Select first available variant.
      return (
        activeVariants.find((variant) => Number(variant.stock) > 0) ||
        activeVariants[0]
      );
    });
  }, [currentProduct?.variants]);

  // ===================================================
  // LOAD CART + WISHLIST
  // ===================================================

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    dispatch(fetchWishlist());
    dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  // ===================================================
  // CATEGORY ID
  // ===================================================

  const categoryId = useMemo(
    () => getCategoryId(currentProduct),
    [
      currentProduct?.categoryId,
      currentProduct?.category?._id,
      currentProduct?.category,
    ],
  );

  // ===================================================
  // RELATED PRODUCTS
  // ===================================================

  useEffect(() => {
    if (!categoryId) {
      return;
    }

    dispatch(
      fetchProducts({
        page: 1,
        limit: 12,
        category: categoryId,
      }),
    );
  }, [dispatch, categoryId]);

  // ===================================================
  // RELATED PRODUCTS DATA
  // ===================================================

  const relatedProducts = useMemo(() => {
    if (!Array.isArray(items)) {
      return [];
    }

    const currentId = getProductId(currentProduct);

    return items
      .filter((product) => {
        if (!product) {
          return false;
        }

        const productId = getProductId(product);

        if (!productId) {
          return false;
        }

        // Do not show current product.
        if (currentId && String(productId) === String(currentId)) {
          return false;
        }

        return true;
      })
      .slice(0, 4);
  }, [items, currentProduct]);

  // ===================================================
  // WISHLIST STATUS
  // ===================================================

  const isWishlisted = useMemo(() => {
    const currentId = getProductId(currentProduct);

    if (!currentId) {
      return false;
    }

    return wishlistItems.some((item) => {
      const wishlistId = getWishlistProductId(item);

      if (!wishlistId) {
        return false;
      }

      return String(wishlistId) === String(currentId);
    });
  }, [wishlistItems, currentProduct]);

  // ===================================================
  // CART STATUS
  // ===================================================

  const isInCart = useMemo(() => {
    const currentId = getProductId(currentProduct);

    if (!currentId) {
      return false;
    }

    return cartItems.some((item) => {
      const cartProductId = getCartProductId(item);

      if (!cartProductId) {
        return false;
      }

      return String(cartProductId) === String(currentId);
    });
  }, [cartItems, currentProduct]);

  // ===================================================
  // MESSAGE
  // ===================================================

  const showMessage = useCallback((message) => {
    setActionMessage(message);

    window.setTimeout(() => {
      setActionMessage("");
    }, 1800);
  }, []);

  // ===================================================
  // AUTH
  // ===================================================

  const requireAuth = useCallback(() => {
    if (isAuthenticated) {
      return true;
    }

    navigate("/login", {
      state: {
        from: window.location.pathname,
      },
    });

    return false;
  }, [isAuthenticated, navigate]);

  // ===================================================
  // ADD TO CART
  // ===================================================

  const handleAddToCart = useCallback(
    async ({ quantity = 1, variantId = null }) => {
      if (!currentProduct) {
        return;
      }

      if (!requireAuth()) {
        return;
      }

      const productId = getProductId(currentProduct);

      if (!productId) {
        showMessage("Product information is incomplete");

        return;
      }

      try {
        await dispatch(
          addToCart({
            productId: String(productId),
            product: currentProduct,
            variantId: variantId || selectedVariant?._id || undefined,
            quantity: Number(quantity) || 1,
          }),
        ).unwrap();

        showMessage("Product added to cart");
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "Unable to add product to cart";

        showMessage(message);
      }
    },
    [currentProduct, dispatch, requireAuth, selectedVariant, showMessage],
  );

  // ===================================================
  // BUY NOW
  // ===================================================

  const handleBuyNow = useCallback(
    async ({ quantity = 1, variantId = null }) => {
      if (!currentProduct) {
        return;
      }

      if (!requireAuth()) {
        return;
      }

      const productId = getProductId(currentProduct);

      if (!productId) {
        showMessage("Product information is incomplete");

        return;
      }

      try {
        await dispatch(
          addToCart({
            productId: String(productId),
            product: currentProduct,
            variantId: variantId || selectedVariant?._id || undefined,
            quantity: Number(quantity) || 1,
          }),
        ).unwrap();

        navigate("/cart");
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "Unable to continue to cart";

        showMessage(message);
      }
    },
    [
      currentProduct,
      dispatch,
      navigate,
      requireAuth,
      selectedVariant,
      showMessage,
    ],
  );

  // ===================================================
  // WISHLIST
  // ===================================================

  const handleWishlist = useCallback(async () => {
    if (!currentProduct) {
      return;
    }

    if (!requireAuth()) {
      return;
    }

    const productId = getProductId(currentProduct);

    if (!productId) {
      showMessage("Product information is incomplete");

      return;
    }

    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(String(productId))).unwrap();

        showMessage("Removed from wishlist");
      } else {
        await dispatch(
          addToWishlist({
            productId: String(productId),
            product: currentProduct,
          }),
        ).unwrap();

        showMessage("Added to wishlist");
      }
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Unable to update wishlist";

      showMessage(message);
    }
  }, [currentProduct, dispatch, isWishlisted, requireAuth, showMessage]);

  // ===================================================
  // LOADING
  // ===================================================

  if (currentLoading) {
    return (
      <main className="product-details-page">
        <div className="product-details-page__loading">
          <div className="product-details-page__spinner" />

          <p>Loading product...</p>
        </div>
      </main>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (currentError || !currentProduct) {
    return (
      <main className="product-details-page">
        <div className="product-details-page__error">
          <h1>Product not found</h1>

          <p>{currentError || "This product is no longer available."}</p>

          <button type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </main>
    );
  }

  // ===================================================
  // PRODUCT VALUES
  // ===================================================

  const productId = getProductId(currentProduct);

  const productName = currentProduct.name || "Product";

  const productImages = Array.isArray(currentProduct.images)
    ? currentProduct.images
    : [];

  const productVariants = Array.isArray(currentProduct.variants)
    ? currentProduct.variants
    : [];

  const categoryName =
    currentProduct.categoryName ||
    (currentProduct.category && typeof currentProduct.category === "object"
      ? currentProduct.category.name
      : currentProduct.category) ||
    "Product";

  const productStock = Number(
    selectedVariant?.stock ??
      currentProduct.stock ??
      currentProduct.totalStock ??
      0,
  );

  const rating = Number(
    currentProduct.rating ?? currentProduct.averageRating ?? 0,
  );

  const ratingCount = Number(
    currentProduct.ratingCount ?? currentProduct.totalReviews ?? 0,
  );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <main className="product-details-page">
      {/* =================================================
          BREADCRUMB
      ================================================= */}

      <div className="product-details-page__breadcrumb">
        <button type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} />
          Back
        </button>

        <span>›</span>

        <span>{categoryName}</span>

        <span>›</span>

        <strong>{productName}</strong>
      </div>

      {/* =================================================
          TOAST
      ================================================= */}

      {actionMessage && (
        <div className="product-details-page__toast" role="status">
          {actionMessage}
        </div>
      )}

      {/* =================================================
          MAIN PRODUCT
      ================================================= */}

      <section className="product-details-page__main">
        {/* ===============================================
            GALLERY
        =============================================== */}

        <div className="product-details-page__gallery">
          <ProductGallery images={productImages} productName={productName} />
        </div>

        {/* ===============================================
            INFORMATION
        =============================================== */}

        <div className="product-details-page__information">
          <ProductInfo
            product={currentProduct}
            selectedVariant={selectedVariant}
          />

          <ProductVariants
            variants={productVariants}
            selectedVariant={selectedVariant}
            onVariantChange={setSelectedVariant}
          />

          <ProductActions
            stock={productStock}
            selectedVariant={selectedVariant}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onWishlist={handleWishlist}
            isWishlisted={isWishlisted}
            isInCart={isInCart}
          />
        </div>
      </section>

      {/* =================================================
          DESCRIPTION + REVIEWS
      ================================================= */}

      <section className="product-details-page__lower">
        <ProductDescription product={currentProduct} />

        {productId && (
          <ProductReviews
            productId={productId}
            averageRating={rating}
            totalReviews={ratingCount}
          />
        )}
      </section>

      {/* =================================================
          RELATED PRODUCTS
      ================================================= */}

      {relatedProducts.length > 0 && (
        <section className="product-details-page__related">
          <div className="product-details-page__related-heading">
            <div>
              <span>MORE TO EXPLORE</span>

              <h2>Related Products</h2>
            </div>
          </div>

          <div className="product-details-page__related-grid">
            {relatedProducts.map((product) => {
              const id = getProductId(product);

              if (!id) {
                return null;
              }

              return <ProductCard key={id} product={product} />;
            })}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetails;
