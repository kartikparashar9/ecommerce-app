import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fetchProducts } from "../../products/ProductSlice";
import ProductCard from "../../products/component/ProductCard/ProductCard";

const NewArrivals = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.products);
  useEffect(() => { dispatch(fetchProducts({ page: 1, limit: 50 })); }, [dispatch]);
  const products = [...(items || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4);
  return <section className="home-section arrivals-section"><div className="section-header"><div><span className="section-subtitle">Just Arrived</span><h2>New Arrivals</h2></div><button type="button" className="view-all-btn">View All <ArrowRight size={17} /></button></div>{loading && <div className="product-grid"><p>Loading products...</p></div>}{!loading && error && <p>{error}</p>}{!loading && !error && products.length === 0 && <p>No new products available right now.</p>}<div className="product-grid arrivals-grid">{products.map((product, index) => <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .35, delay: index * .06 }}><ProductCard product={product} /></motion.div>)}</div></section>;
};
export default NewArrivals;
