import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../products/component/ProductCard/ProductCard";
import { getCategoriesApi } from "../CategorieApi";
import { fetchProducts } from "../../products/ProductSlice";
import "./Category.css";

const unwrap = (response) => { const body = response?.data ?? response ?? {}; return body?.data ?? body; };

function Category({ data }) {
  const navigate = useNavigate(); const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.products);
  const [categoryId, setCategoryId] = useState(""); const [categoryLoading, setCategoryLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadCategory = async () => {
      if (!data?.key) return;
      setCategoryLoading(true);
      try { const raw = unwrap(await getCategoriesApi()); const categories = Array.isArray(raw) ? raw : raw?.categories || []; const match = categories.find((c) => c?.slug === data.key || c?.name?.toLowerCase() === data.title?.toLowerCase()); if (active && match?._id) { setCategoryId(match._id); dispatch(fetchProducts({ page: 1, limit: 20, category: match._id })); } }
      finally { if (active) setCategoryLoading(false); }
    };
    loadCategory(); return () => { active = false; };
  }, [data?.key, data?.title, dispatch]);

  const products = useMemo(() => (items || []).filter((p) => !categoryId || String(p.categoryId) === String(categoryId)), [items, categoryId]);
  if (!data) return <main className="jb-category-error"><h1>Category Not Found</h1><button type="button" onClick={() => navigate("/")}>Go Home</button></main>;

  const handleExplore = () => navigate(`/search?q=${encodeURIComponent(data.title)}`);
  return <main className="jb-category-page" style={{ "--category-accent": data.accent }}>
    <section className="jb-category-hero"><div className="jb-category-hero-content"><span className="jb-category-eyebrow">{data.eyebrow}</span><h1>{data.heading}<br /><span>{data.highlightedHeading}</span></h1><p>{data.description}</p><button type="button" className="jb-category-primary-btn" onClick={handleExplore}>Explore {data.title}<span>→</span></button></div><div className="jb-category-hero-image-area"><div className="jb-category-hero-circle" /><img src={data.heroImage} alt={data.title} className="jb-category-hero-image" /></div><button type="button" className="jb-category-arrow jb-category-arrow-left" aria-label="Previous">‹</button><button type="button" className="jb-category-arrow jb-category-arrow-right" aria-label="Next">›</button></section>
    <section className="jb-category-section"><div className="jb-category-section-heading"><div><span>EXPLORE</span><h2>Shop by {data.title} Categories</h2></div><button type="button" onClick={handleExplore}>View All →</button></div><div className="jb-category-list">{data.categories.map((category) => <button type="button" className="jb-category-item" key={category.name} onClick={() => navigate(`/search?q=${encodeURIComponent(category.name)}`)}><div className="jb-category-item-image"><img src={category.image} alt={category.name} /></div><strong>{category.name}</strong></button>)}</div></section>
    <section className="jb-category-section jb-products-section"><div className="jb-category-section-heading"><div><span>JUST FOR YOU</span><h2>Products</h2></div></div>{(loading || categoryLoading) && <p>Loading products...</p>}{!loading && !categoryLoading && error && <p>{error}</p>}{!loading && !categoryLoading && !error && !products.length && <p>No products available in this category yet.</p>}<div className="jb-category-products">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
  </main>;
}
export default Category;
