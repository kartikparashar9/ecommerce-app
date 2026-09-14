import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Star,
  Check,
} from "lucide-react";

const ProductCard = ({
  product,
  onAddToCart,
  onWishlistToggle,
  isWishlisted = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);

    if (onAddToCart) {
      await onAddToCart(product);
    }

    setTimeout(() => {
      setIsAdding(false);
    }, 700);
  };

  const handleWishlist = () => {
    if (onWishlistToggle) {
      onWishlistToggle(product);
    }
  };

  return (
    <motion.article
      className="product-card"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <div className="product-image-wrapper">
        {product.discount && (
          <span className="product-discount">
            {product.discount}% OFF
          </span>
        )}

        <button
          type="button"
          className={`wishlist-btn ${
            isWishlisted ? "wishlisted" : ""
          }`}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
        >
          <Heart
            size={18}
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>

        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
        />

        <motion.button
          type="button"
          className="quick-cart-btn"
          onClick={handleAddToCart}
          disabled={isAdding}
          whileTap={{ scale: 0.97 }}
        >
          {isAdding ? (
            <>
              <Check size={17} />
              Added
            </>
          ) : (
            <>
              <ShoppingCart size={17} />
              Add to Cart
            </>
          )}
        </motion.button>
      </div>

      <div className="product-info">
        <p className="product-category">
          {product.category}
        </p>

        <h3 title={product.name}>
          {product.name}
        </h3>

        <div className="product-rating">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                fill={
                  star <= Math.round(product.rating)
                    ? "currentColor"
                    : "none"
                }
              />
            ))}
          </div>

          <span>
            ({product.reviews})
          </span>
        </div>

        <div className="product-price">
          <strong>
            ${Number(product.price).toFixed(2)}
          </strong>

          {product.originalPrice && (
            <del>
              $
              {Number(product.originalPrice).toFixed(2)}
            </del>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;