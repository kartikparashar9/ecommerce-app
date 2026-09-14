import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import { addToCart } from "../../../cart/CartSlice";

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
    item._id ||
    item.product?._id ||
    item.product?.id ||
    item.productId ||
    item.id ||
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

  const isAuthenticated = Boolean(authState.isAuthenticated);

  const wishlistItems = Array.isArray(wishlistState.items)
    ? wishlistState.items
    : [];

  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  // ===================================================
  // FETCH PRODUCT BY SLUG
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

    // Clear old product before loading the new one.
    dispatch(clearCurrentProduct());

    // IMPORTANT:
    // Dispatch the thunk only once.
    // Do not console.log(dispatch(...)) because that returns
    // the Redux Toolkit thunk Promise.
    dispatch(fetchProductBySlug(decodedSlug));
  }, [dispatch, slug]);

  // ===================================================
  // SELECT DEFAULT VARIANT
  // ===================================================

  useEffect(() => {
    if (
      !currentProduct ||
      !Array.isArray(currentProduct.variants) ||
      currentProduct.variants.length === 0
    ) {
      setSelectedVariant(null);
      return;
    }

    const activeVariants = currentProduct.variants.filter(
      (variant) => variant && variant.isActive !== false,
    );

    if (activeVariants.length === 0) {
      setSelectedVariant(null);
      return;
    }

    const availableVariant =
      activeVariants.find((variant) => Number(variant.stock) > 0) ||
      activeVariants[0];

    setSelectedVariant(availableVariant);
  }, [currentProduct]);

  // ===================================================
  // FETCH WISHLIST
  // ===================================================

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated]);

  // ===================================================
  // FETCH RELATED PRODUCTS
  // ===================================================

  useEffect(() => {
    const categoryId = getCategoryId(currentProduct);

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
  }, [dispatch, currentProduct]);

  // ===================================================
  // RELATED PRODUCTS
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

        // Do not show the current product.
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
      const wishlistProductId = getWishlistProductId(item);

      if (!wishlistProductId) {
        return false;
      }

      return String(wishlistProductId) === String(currentId);
    });
  }, [wishlistItems, currentProduct]);

  // ===================================================
  // MESSAGE
  // ===================================================

  const showMessage = useCallback((text) => {
    setActionMessage(text);

    window.setTimeout(() => {
      setActionMessage("");
    }, 1800);
  }, []);

  // ===================================================
  // AUTH CHECK
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
            variantId: variantId || selectedVariant?._id || undefined,
            quantity: Number(quantity) || 1,
          }),
        ).unwrap();

        showMessage("Product added to cart");
      } catch (error) {
        const errorMessage =
          typeof error === "string"
            ? error
            : error?.message || "Unable to add product to cart";

        showMessage(errorMessage);
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
            variantId: variantId || selectedVariant?._id || undefined,
            quantity: Number(quantity) || 1,
          }),
        ).unwrap();

        navigate("/cart");
      } catch (error) {
        const errorMessage =
          typeof error === "string"
            ? error
            : error?.message || "Unable to continue to cart";

        showMessage(errorMessage);
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
        await dispatch(addToWishlist(String(productId))).unwrap();

        showMessage("Added to wishlist");
      }
    } catch (error) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "Unable to update wishlist";

      showMessage(errorMessage);
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
  // ERROR / PRODUCT NOT FOUND
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
  // PRODUCT ID
  // ===================================================

  const productId = getProductId(currentProduct);

  // ===================================================
  // SAFE PRODUCT VALUES
  // ===================================================

  const productName = currentProduct.name || "Product";

  const productImages = Array.isArray(currentProduct.images)
    ? currentProduct.images
    : [];

  const productVariants = Array.isArray(currentProduct.variants)
    ? currentProduct.variants
    : [];

  const categoryName =
    currentProduct.categoryName ||
    (currentProduct.category && typeof currentProduct.category === "object")
      ? currentProduct.category?.name
      : currentProduct.category || "Product";

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
  navigate;
};

export default ProductDetails;
