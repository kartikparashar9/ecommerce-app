import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { fetchProducts, selectProducts } from "../../ProductSlice";
import { fetchCategories } from "../../../categories/CategorieSlice";
import { fetchBrands } from "../../../brands/BrandSlice";
import ProductCard from "../../component/ProductCard/ProductCard";
import "./SearchResults.css";

const SearchResults = () => {
  const [params, setParams] = useSearchParams();
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const productState = useSelector((state) => state.products || {});
  const categoryState = useSelector((state) => state.categories || {});
  const brandState = useSelector((state) => state.brands || {});

  const q = params.get("q")?.trim() || "";
  const category = params.get("category")?.trim() || "";
  const brand = params.get("brand")?.trim() || "";
  const minPrice = params.get("minPrice")?.trim() || "";
  const maxPrice = params.get("maxPrice")?.trim() || "";
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftMinPrice, setDraftMinPrice] = useState(minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);

  useEffect(() => {
    setPage(1);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
  }, [q, category, brand, minPrice, maxPrice]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        page,
        limit: 20,
        search: q,
        category,
        brand,
        minPrice,
        maxPrice,
      }),
    );
  }, [dispatch, page, q, category, brand, minPrice, maxPrice]);

  useEffect(() => {
    dispatch(fetchCategories({ status: "active", page: 1, limit: 50 }));
    dispatch(fetchBrands({ status: "active", page: 1, limit: 50 }));
  }, [dispatch]);

  const categories = useMemo(
    () => (Array.isArray(categoryState.items) ? categoryState.items : []).filter((item) => item?.isActive !== false),
    [categoryState.items],
  );
  const brands = useMemo(
    () => (Array.isArray(brandState.items) ? brandState.items : []).filter((item) => item?.isActive !== false),
    [brandState.items],
  );

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setFiltersOpen(false);
  };

  const applyPriceFilter = () => {
    const next = new URLSearchParams(params);
    if (draftMinPrice) next.set("minPrice", draftMinPrice);
    else next.delete("minPrice");
    if (draftMaxPrice) next.set("maxPrice", draftMaxPrice);
    else next.delete("maxPrice");
    setParams(next);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    setParams(next);
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setFiltersOpen(false);
  };

  const total = productState.pagination?.totalProducts ?? products.length;

  return (
    <main className="search-results-page">
      <header className="search-results-header">
        <div>
          <span className="search-results-eyebrow"><Search size={15} /> Search</span>
          <h1>{q ? `Results for “${q}”` : "All Products"}</h1>
          <p>{total} products found</p>
        </div>
        <button type="button" className="search-filter-toggle" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}>
          <SlidersHorizontal size={17} /> Filters
        </button>
      </header>

      <div className={`search-results-layout ${filtersOpen ? "is-open" : ""}`}>
        <aside className="search-results-filters" aria-label="Product filters">
          <div className="search-results-filters__top"><strong>Filters</strong><button type="button" onClick={clearFilters}>Clear</button></div>
          <label>Category<select value={category} onChange={(e) => updateParam("category", e.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item._id || item.id} value={item._id || item.id}>{item.name}</option>)}</select></label>
          <label>Brand<select value={brand} onChange={(e) => updateParam("brand", e.target.value)}><option value="">All brands</option>{brands.map((item) => <option key={item._id || item.id} value={item._id || item.id}>{item.name}</option>)}</select></label>
          <div className="search-results-price"><span>Price range</span><div><input inputMode="numeric" value={draftMinPrice} onChange={(e) => setDraftMinPrice(e.target.value.replace(/\D/g, ""))} placeholder="Min" aria-label="Minimum price" /><input inputMode="numeric" value={draftMaxPrice} onChange={(e) => setDraftMaxPrice(e.target.value.replace(/\D/g, ""))} placeholder="Max" aria-label="Maximum price" /></div><button type="button" className="search-results-apply" onClick={applyPriceFilter}>Apply</button></div>
        </aside>

        <section className="search-results-content">
          {productState.loading && <div className="search-results-status">Loading products...</div>}
          {!productState.loading && productState.error && <div className="search-results-status error">{productState.error}</div>}
          {!productState.loading && !productState.error && !products.length && <div className="search-results-status">No products found. Try changing your search or filters.</div>}
          {!productState.loading && !productState.error && products.length > 0 && <div className="search-results-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}

          {productState.pagination?.totalPages > 1 && <div className="search-results-pagination"><button type="button" disabled={!productState.pagination.hasPreviousPage || productState.loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span>{productState.pagination.currentPage || page} / {productState.pagination.totalPages}</span><button type="button" disabled={!productState.pagination.hasNextPage || productState.loading} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
        </section>
      </div>
      {filtersOpen && <button type="button" className="search-filter-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)}><X size={1} /></button>}
    </main>
  );
};

export default SearchResults;
