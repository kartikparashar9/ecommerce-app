import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, PackageSearch, SlidersHorizontal } from "lucide-react";

import ProductCard from "../../products/component/ProductCard/ProductCard";
import { getCategoriesApi, getSubcategoriesApi } from "../CategorieApi";
import { fetchProducts, selectProducts } from "../../products/ProductSlice";
import { getProductsApi } from "../../products/ProductApi";
import { fetchBrands } from "../../brands/BrandSlice";
import { resolveMediaUrl } from "../../utils/media";
import "./Category.css";

const unwrap = (response) => response?.data ?? response ?? {};
const getId = (item) => item?._id || item?.id || null;

const Category = ({ data }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  const products = useSelector(selectProducts);
  const productState = useSelector((state) => state.products || {});
  const brandState = useSelector((state) => state.brands || {});

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [categoryBrandIds, setCategoryBrandIds] = useState([]);

  const requestedName = data?.title || data?.name || data?.key || "";

  const brand = params.get("brand") || "";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const subcategory = params.get("subcategory") || "";

  const [draftMin, setDraftMin] = useState(minPrice);
  const [draftMax, setDraftMax] = useState(maxPrice);

  useEffect(() => {
    setDraftMin(minPrice);
    setDraftMax(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!requestedName) {
        setCategory(null);
        setLoadingCategory(false);
        return;
      }

      try {
        setLoadingCategory(true);
        setCategoryError("");

        const response = await getCategoriesApi({
          status: "active",
          page: 1,
          limit: 100,
        });

        const body = unwrap(response);
        const list = Array.isArray(body) ? body : body?.categories || [];

        const match = list.find(
          (item) =>
            item?.slug?.toLowerCase() === String(requestedName).toLowerCase() ||
            item?.name?.toLowerCase() === String(requestedName).toLowerCase(),
        );

        if (!active) return;

        if (!match) {
          setCategory(null);
          setSubcategories([]);
          setCategoryError("Category is not available.");
          return;
        }

        setCategory(match);

        const id = getId(match);

        if (id) {
          try {
            const subResponse = await getSubcategoriesApi(id);
            const subBody = unwrap(subResponse);
            const subList = Array.isArray(subBody)
              ? subBody
              : subBody?.subcategories || subBody?.categories || [];

            if (active) {
              setSubcategories(
                subList.filter((item) => item?.isActive !== false),
              );
            }
          } catch {
            if (active) setSubcategories([]);
          }
        }
      } catch (error) {
        if (active) {
          setCategoryError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load category",
          );
        }
      } finally {
        if (active) setLoadingCategory(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [requestedName]);

  const categoryId = getId(category);

  const selectedProductCategory = subcategory || categoryId;

  useEffect(() => {
    if (!selectedProductCategory) return;

    dispatch(
      fetchProducts({
        page: 1,
        limit: 40,
        category: selectedProductCategory,
        brand,
        minPrice,
        maxPrice,
      }),
    );
  }, [dispatch, selectedProductCategory, brand, minPrice, maxPrice]);

  useEffect(() => {
    if (!selectedProductCategory) {
      setCategoryBrandIds([]);
      return undefined;
    }

    let active = true;

    dispatch(
      fetchBrands({
        status: "active",
        page: 1,
        limit: 100,
      }),
    );

    const loadCategoryBrands = async () => {
      try {
        const response = await getProductsApi({
          page: 1,
          limit: 100,
          category: selectedProductCategory,
        });

        const categoryItems = Array.isArray(response?.products)
          ? response.products
          : [];

        const ids = [
          ...new Set(
            categoryItems
              .map(
                (item) =>
                  item?.brand?._id ||
                  item?.brand?.id ||
                  item?.brandId ||
                  (typeof item?.brand === "string" ? item.brand : null),
              )
              .filter(Boolean)
              .map(String),
          ),
        ];

        if (active) setCategoryBrandIds(ids);
      } catch {
        if (active) setCategoryBrandIds([]);
      }
    };

    loadCategoryBrands();

    return () => {
      active = false;
    };
  }, [dispatch, selectedProductCategory]);

  const categoryProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  );

  const brands = useMemo(() => {
    const activeBrands = (
      Array.isArray(brandState.items) ? brandState.items : []
    ).filter((item) => item?.isActive !== false);

    if (!categoryBrandIds.length) return activeBrands;

    return activeBrands.filter((item) =>
      categoryBrandIds.includes(String(getId(item))),
    );
  }, [brandState.items, categoryBrandIds]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(params);

    if (value) next.set(key, value);
    else next.delete(key);

    setParams(next);
  };

  const applyPrice = () => {
    const next = new URLSearchParams(params);

    if (draftMin) next.set("minPrice", draftMin);
    else next.delete("minPrice");

    if (draftMax) next.set("maxPrice", draftMax);
    else next.delete("maxPrice");

    setParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (subcategory) next.set("subcategory", subcategory);
    setParams(next);
    setDraftMin("");
    setDraftMax("");
  };

  const selectSubcategory = (item) => {
    const id = getId(item);
    if (!id) return;

    const next = new URLSearchParams(params);
    next.set("subcategory", id);
    setParams(next);
  };

  if (loadingCategory) {
    return (
      <main className="jb-category-page">
        <div className="jb-category-state">Loading category...</div>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="jb-category-page">
        <div className="jb-category-state jb-category-state--error">
          <h1>Category not found</h1>
          <p>{categoryError || "This category is not available."}</p>
          <button type="button" onClick={() => navigate("/search")}>
            Browse Products
          </button>
        </div>
      </main>
    );
  }

  const categoryName = category.name || requestedName;
  const heroImage = resolveMediaUrl(category.image);

  return (
    <main className="jb-category-page">
      <section className="jb-category-hero">
        <div className="jb-category-hero-content">
          <span className="jb-category-eyebrow">{categoryName}</span>
          <h1>
            Explore <span>{categoryName}</span>
          </h1>
          <p>
            {category.description ||
              `Browse products available in ${categoryName}.`}
          </p>
          <button
            type="button"
            className="jb-category-primary-btn"
            onClick={() =>
              navigate(`/search?category=${encodeURIComponent(categoryId)}`)
            }
          >
            Browse Products <ArrowRight size={17} />
          </button>
        </div>

        <div className="jb-category-hero-image-area">
          {heroImage ? (
            <img
              src={heroImage}
              alt={categoryName}
              className="jb-category-hero-image"
            />
          ) : (
            <PackageSearch size={70} />
          )}
        </div>
      </section>

      {subcategories.length > 0 && (
        <section className="jb-category-section jb-subcategories-section">
          <div className="jb-category-section-heading jb-subcategories-heading">
            <div>
              <span>EXPLORE COLLECTION</span>
              <h2>Shop by Subcategory</h2>
              <p>Find exactly what you are looking for in {categoryName}.</p>
            </div>

            {subcategories.length > 0 && (
              <div className="jb-subcategories-count">
                {subcategories.length}{" "}
                {subcategories.length === 1 ? "Category" : "Categories"}
              </div>
            )}
          </div>

          <div className="jb-category-list">
            {subcategories.map((item) => {
              const itemId = getId(item);
              const imageUrl = resolveMediaUrl(item.image);
              const isActive = subcategory === itemId;

              return (
                <button
                  type="button"
                  className={`jb-category-item ${isActive ? "active" : ""}`}
                  key={itemId || item.name}
                  onClick={() => selectSubcategory(item)}
                  aria-pressed={isActive}
                  aria-label={`Browse ${item.name}`}
                >
                  <div className="jb-category-item-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.name} loading="lazy" />
                    ) : (
                      <PackageSearch size={34} strokeWidth={1.6} />
                    )}

                    <span className="jb-category-item-arrow">
                      <ArrowRight size={15} />
                    </span>
                  </div>

                  <div className="jb-category-item-content">
                    <strong title={item.name}>{item.name}</strong>

                    <span className="jb-category-item-link">
                      Explore
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="jb-category-section jb-products-section">
        <div className="jb-category-section-heading">
          <div>
            <span>PRODUCTS</span>
            <h2>
              {subcategory ? "Filtered Products" : `${categoryName} Products`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/search?category=${encodeURIComponent(
                  selectedProductCategory,
                )}`,
              )
            }
          >
            View All <ArrowRight size={16} />
          </button>
        </div>

        <div className="jb-category-filters">
          <div className="jb-category-filter-title">
            <SlidersHorizontal size={16} />
            <strong>Filter products</strong>
          </div>

          <label>
            Brand
            <select
              value={brand}
              onChange={(event) => updateFilter("brand", event.target.value)}
            >
              <option value="">All brands</option>
              {brands.map((item) => (
                <option key={getId(item) || item.name} value={getId(item)}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Min price
            <input
              inputMode="numeric"
              value={draftMin}
              onChange={(event) =>
                setDraftMin(event.target.value.replace(/\D/g, ""))
              }
              placeholder="₹ Min"
            />
          </label>

          <label>
            Max price
            <input
              inputMode="numeric"
              value={draftMax}
              onChange={(event) =>
                setDraftMax(event.target.value.replace(/\D/g, ""))
              }
              placeholder="₹ Max"
            />
          </label>

          <button
            type="button"
            className="jb-category-filter-apply"
            onClick={applyPrice}
          >
            Apply
          </button>

          <button
            type="button"
            className="jb-category-filter-clear"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        {productState.loading && (
          <div className="jb-category-state">Loading products...</div>
        )}

        {!productState.loading && productState.error && (
          <div className="jb-category-state jb-category-state--error">
            {productState.error}
          </div>
        )}

        {!productState.loading &&
          !productState.error &&
          !categoryProducts.length && (
            <div className="jb-category-state">
              No products available for these filters.
            </div>
          )}

        {!productState.loading &&
          !productState.error &&
          categoryProducts.length > 0 && (
            <div className="jb-category-products">
              {categoryProducts.map((product) => (
                <ProductCard key={getId(product)} product={product} />
              ))}
            </div>
          )}
      </section>
    </main>
  );
};

export default Category;
