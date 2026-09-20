import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Heart } from "lucide-react";

import { fetchWishlist } from "../../wishlist/WishlistSlice";
import ProductCard from "../../products/component/ProductCard/ProductCard";
import "../../user/component/UserPages.css";
import "./Wishlist.css";

const getProduct = (item) =>
  item?.product && typeof item.product === "object"
    ? item.product
    : item;

const WishlistPage = () => {
  const dispatch = useDispatch();

  const {
    items = [],
    loading,
    error,
  } = useSelector((state) => state.wishlist || {});

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const products = items
    .map(getProduct)
    .filter(
      (product) =>
        product && (product._id || product.id),
    );

  return (
    <main className="user-page">
      <header className="user-page__header">
        <div>
          <span className="user-eyebrow">
            SAVED PRODUCTS
          </span>
          <h1>My Wishlist</h1>
          <p>
            {products.length} saved product
            {products.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {error && (
        <div className="user-alert">{error}</div>
      )}

      {loading && !products.length ? (
        <div className="user-state">
          Loading wishlist...
        </div>
      ) : !products.length ? (
        <div className="user-empty">
          <Heart size={36} />
          <h2>Your wishlist is empty</h2>
          <p>
            Save products you want to revisit later.
          </p>
        </div>
      ) : (
        <div className="user-product-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default WishlistPage;
