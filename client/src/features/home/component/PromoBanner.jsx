import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const PromoBanners = () => {
  return (
    <section className="home-section promo-section">

      <motion.article
        className="promo-banner promo-sale"
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <div className="promo-content">
          <span>Up to 50% Off</span>

          <h2>Summer Sale</h2>

          <p>
            Get amazing deals on top brands.
          </p>

          <button className="primary-btn">
            Shop Now
            <ArrowRight size={17} />
          </button>
        </div>

        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=80"
          alt="Summer sale"
          loading="lazy"
        />
      </motion.article>

      <motion.article
        className="promo-banner promo-new"
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <div className="promo-content">
          <span>New Collection</span>

          <h2>New Arrivals</h2>

          <p>
            Discover our latest products.
          </p>

          <button className="primary-btn">
            Explore Now
            <ArrowRight size={17} />
          </button>
        </div>

        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"
          alt="New shoes collection"
          loading="lazy"
        />
      </motion.article>

    </section>
  );
};

export default PromoBanners;