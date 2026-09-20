import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
} from "lucide-react";

import { fetchCategories } from "../../categories/CategorieSlice";
import { fetchProducts, selectProducts } from "../../products/ProductSlice";
import { resolveMediaUrl } from "../../utils/media";
import ProductCard from "../../products/component/ProductCard/ProductCard";
import "./Home.css";

const getId = (item) => item?._id || item?.id || null;

const getVisitScore = (category) =>
  Number(
    category?.visitCount ??
      category?.views ??
      category?.viewCount ??
      category?.visits ??
      category?.productCount ??
      0,
  ) || 0;

const getParentId = (category) => {
  if (!category?.parentCategory) return null;
  if (typeof category.parentCategory === "string") {
    return category.parentCategory;
  }
  return category.parentCategory?._id || category.parentCategory?.id || null;
};

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const products = useSelector(selectProducts);
  const productState = useSelector((state) => state.products || {});
  const categoryState = useSelector((state) => state.categories || {});

  const [activeSlide, setActiveSlide] = useState(0);

  const categories = useMemo(
    () =>
      (Array.isArray(categoryState.items) ? categoryState.items : []).filter(
        (item) => item?.isActive !== false,
      ),
    [categoryState.items],
  );

  useEffect(() => {
    dispatch(
      fetchCategories({
        status: "active",
        page: 1,
        limit: 100,
      }),
    );

    dispatch(
      fetchProducts({
        page: 1,
        limit: 100,
      }),
    );
  }, [dispatch]);

  const latestProducts = useMemo(
    () =>
      [...products]
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0) -
            new Date(a?.createdAt || 0),
        )
        .slice(0, 4),
    [products],
  );

  const heroProducts = useMemo(
    () =>
      [...products]
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0) -
            new Date(a?.createdAt || 0),
        )
        .slice(0, 3),
    [products],
  );

  useEffect(() => {
    setActiveSlide((current) =>
      heroProducts.length ? current % heroProducts.length : 0,
    );
  }, [heroProducts.length]);

  useEffect(() => {
    if (heroProducts.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroProducts.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [heroProducts.length]);

  const parentCategories = useMemo(() => {
    return [...categories]
      .filter((category) => !getParentId(category))
      .sort((a, b) => getVisitScore(b) - getVisitScore(a))
      .slice(0, 5);
  }, [categories]);

  const dealProducts = useMemo(
    () =>
      [...products]
        .filter((product) => Number(product?.discount) > 0)
        .sort(
          (a, b) =>
            Number(b?.discount || 0) - Number(a?.discount || 0),
        )
        .slice(0, 4),
    [products],
  );

  const heroProduct = heroProducts[activeSlide] || null;

  const heroImage = resolveMediaUrl(
    heroProduct?.image || heroProduct?.images?.[0],
  );

  const goToCategory = (category) => {
    const id = getId(category);
    if (id) {
      navigate(`/search?category=${encodeURIComponent(id)}`);
    }
  };

  const goToProducts = () => navigate("/search");

  const moveSlide = (direction) => {
    if (!heroProducts.length) return;

    setActiveSlide(
      (current) =>
        (current + direction + heroProducts.length) %
        heroProducts.length,
    );
  };

  return (
    <main className="home-page">
      <section className="home-hero" aria-label="New products">
        <div className="home-hero__content">
          <span className="home-eyebrow">NEW ARRIVAL</span>
          <h1>
            Discover <span>{heroProduct?.name || "new products"}</span>
          </h1>
          <p>
            {heroProduct?.description ||
              heroProduct?.shortDescription ||
              "Explore the latest products added to JustBuy."}
          </p>

          <button
            type="button"
            className="home-primary-button"
            onClick={
              heroProduct?.slug
                ? () =>
                    navigate(
                      `/product/${encodeURIComponent(heroProduct.slug)}`,
                    )
                : goToProducts
            }
          >
            View Product <ArrowRight size={18} />
          </button>

          <div className="home-hero__meta">
            <span>{heroProducts.length || 0} latest products</span>
            <span>{parentCategories.length} main categories</span>
          </div>
        </div>

        <div className="home-hero__visual">
          {heroImage ? (
            <img
              src={heroImage}
              alt={heroProduct?.name || "New product"}
            />
          ) : (
            <PackageSearch size={72} />
          )}

          {heroProducts.length > 1 && (
            <>
              <div className="home-hero__dots">
                {heroProducts.map((product, index) => (
                  <button
                    type="button"
                    key={getId(product) || index}
                    className={
                      index === activeSlide
                        ? "active"
                        : ""
                    }
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Show new product ${index + 1}`}
                  />
                ))}
              </div>

              <div className="home-hero__controls">
                <button
                  type="button"
                  onClick={() => moveSlide(-1)}
                  aria-label="Previous new product"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => moveSlide(1)}
                  aria-label="Next new product"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <span className="home-eyebrow">EXPLORE</span>
            <h2>Shop by Category</h2>
          </div>
          <button type="button" onClick={goToProducts}>
            View All <ArrowRight size={16} />
          </button>
        </div>

        {categoryState.loading ? (
          <div className="home-state">Loading categories...</div>
        ) : categoryState.error ? (
          <div className="home-state home-state--error">
            {categoryState.error}
          </div>
        ) : !parentCategories.length ? (
          <div className="home-state">
            No main categories available.
          </div>
        ) : (
          <div className="home-category-grid">
            {parentCategories.map((category) => {
              const image = resolveMediaUrl(category?.image);

              return (
                <button
                  type="button"
                  className="home-category-card"
                  key={getId(category) || category.name}
                  onClick={() => goToCategory(category)}
                >
                  <div className="home-category-card__image">
                    {image ? (
                      <img
                        src={image}
                        alt={category.name}
                        loading="lazy"
                      />
                    ) : (
                      <PackageSearch size={32} />
                    )}
                  </div>
                  <strong>{category.name}</strong>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <span className="home-eyebrow">DEALS</span>
            <h2>Discounted Products</h2>
          </div>
          <button type="button" onClick={goToProducts}>
            View All <ArrowRight size={16} />
          </button>
        </div>

        {productState.loading ? (
          <div className="home-product-grid home-product-grid--skeleton">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="home-skeleton" key={index} />
            ))}
          </div>
        ) : productState.error ? (
          <div className="home-state home-state--error">
            {productState.error}
          </div>
        ) : dealProducts.length ? (
          <div className="home-product-grid">
            {dealProducts.map((product) => (
              <ProductCard
                key={getId(product)}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="home-state">
            No discounted products available.
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <span className="home-eyebrow">LATEST</span>
            <h2>New Arrivals</h2>
          </div>
          <button type="button" onClick={goToProducts}>
            View All <ArrowRight size={16} />
          </button>
        </div>

        {!productState.loading && latestProducts.length ? (
          <div className="home-product-grid">
            {latestProducts.map((product) => (
              <ProductCard
                key={getId(product)}
                product={product}
              />
            ))}
          </div>
        ) : !productState.loading ? (
          <div className="home-state">
            No products available yet.
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default Home;
