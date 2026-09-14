import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProductCard from "../../products/component/ProductCard/ProductCard";
import useCountdown from "../../../hooks/useCountDown/useCountdown";
import { fetchProducts } from "../../products/ProductSlice";

const formatTime = (value) => String(value).padStart(2, "0");
const DealOfTheDay = () => {
  const dispatch = useDispatch(); const { items, loading, error } = useSelector((state) => state.products); const { hours, minutes, seconds } = useCountdown(12);
  useEffect(() => { dispatch(fetchProducts({ page: 1, limit: 50 })); }, [dispatch]);
  const deals = useMemo(() => { const eligible = (items || []).filter((p) => Number(p.discount) > 0 && Number(p.stock) > 0); if (!eligible.length) return []; const day = Math.floor(Date.now() / 86400000); const start = day % eligible.length; return Array.from({ length: Math.min(4, eligible.length) }, (_, i) => eligible[(start + i) % eligible.length]); }, [items]);
  return <section className="home-section deals-section"><div className="section-header"><div className="deal-heading"><span className="section-subtitle">Limited Time</span><h2>Deal of the Day</h2></div><div className="deal-countdown" aria-label="Deal countdown"><div><strong>{formatTime(hours)}</strong><span>HRS</span></div><span>:</span><div><strong>{formatTime(minutes)}</strong><span>MIN</span></div><span>:</span><div><strong>{formatTime(seconds)}</strong><span>SEC</span></div></div><button type="button" className="view-all-btn">View All Deals <ArrowRight size={17} /></button></div>{loading && <p>Loading deals...</p>}{!loading && error && <p>{error}</p>}{!loading && !error && !deals.length && <p>No deals available right now.</p>}<motion.div className="product-grid" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: {}, visible: { transition: { staggerChildren: .08 } } }}>{deals.map((product) => <motion.div key={product.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}><ProductCard product={product} /></motion.div>)}</motion.div></section>;
}; export default DealOfTheDay;
