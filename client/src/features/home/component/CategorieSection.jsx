import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    id: 1,
    name: "Fashion",
    items: "120+ Items",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 2,
    name: "Electronics",
    items: "80+ Items",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 3,
    name: "Home & Kitchen",
    items: "150+ Items",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 4,
    name: "Beauty",
    items: "90+ Items",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 5,
    name: "Shoes",
    items: "70+ Items",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 6,
    name: "Accessories",
    items: "60+ Items",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80",
  },
];

const CategorySection = () => {
  return (
    <section className="home-section category-section">
      <div className="section-header">
        <div>
          <span className="section-subtitle">Explore</span>
          <h2>Shop by Categories</h2>
        </div>

        <button className="view-all-btn">
          View All
          <ArrowRight size={17} />
        </button>
      </div>

      <div className="category-grid">
        {categories.map((category, index) => (
          <motion.article
            key={category.id}
            className="category-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: index * 0.08,
            }}
            whileHover={{ y: -8 }}
          >
            <div className="category-image-wrapper">
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
              />

              <div className="category-overlay">
                <span>Explore</span>
              </div>
            </div>

            <div className="category-info">
              <h3>{category.name}</h3>
              <p>{category.items}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;