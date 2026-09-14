import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchProducts } from "../../ProductSlice";
import ProductCard from "../../component/ProductCard/ProductCard";
import "./SearchResults.css";

const SearchResults = () => {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const q = params.get("q")?.trim() || "";
  const [page, setPage] = useState(1);
  const { items, pagination, loading, error } = useSelector(
    (state) => state.products,
  );
  useEffect(() => {
    setPage(1);
  }, [q]);
  useEffect(() => {
    dispatch(fetchProducts({ page, limit: 20, search: q }));
  }, [dispatch, page, q]);
  return (
    <main className="search-results-page">
      <header>
        <span>
          <Search size={16} /> Search Results
        </span>
        <h1>{q ? `Results for “${q}”` : "All Products"}</h1>
        <p>{pagination?.totalProducts || items.length || 0} products found</p>
      </header>
      {loading && (
        <div className="search-results-status">Loading products...</div>
      )}
      {!loading && error && (
        <div className="search-results-status error">{error}</div>
      )}
      {!loading && !error && !items.length && (
        <div className="search-results-status">
          No products found. Try another search.
        </div>
      )}
      <div className="search-results-grid">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {pagination?.totalPages > 1 && (
        <div className="search-results-pagination">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};
export default SearchResults;
