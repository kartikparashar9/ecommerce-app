import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";

const heroSlides = [
  {
    id: 1,
    badge: "NEW COLLECTION",
    title: "Everything You Need,",
    highlight: "All in One Place.",
    description:
      "Discover quality products, trending styles, and everyday essentials at prices you'll love.",
    buttonText: "Shop Now",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 2,
    badge: "TRENDING NOW",
    title: "Upgrade Your",
    highlight: "Everyday Style.",
    description:
      "Explore our latest collection of fashion, accessories, electronics and lifestyle products.",
    buttonText: "Explore Collection",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 3,
    badge: "SPECIAL OFFERS",
    title: "Better Products,",
    highlight: "Better Prices.",
    description:
      "Grab exclusive deals on selected products before they're gone.",
    buttonText: "View Deals",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85",
  },
];

const HeroSection = ({ onShopNow }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentSlide = heroSlides[activeSlide];

  const goToNextSlide = () => {
    setActiveSlide((previous) =>
      previous === heroSlides.length - 1
        ? 0
        : previous + 1
    );
  };

  const goToPreviousSlide = () => {
    setActiveSlide((previous) =>
      previous === 0
        ? heroSlides.length - 1
        : previous - 1
    );
  };

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timer = setInterval(() => {
      goToNextSlide();
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [isPaused]);

  return (
    <section className="hero-section">
      <div
        className="hero-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background decoration */}
        <div className="hero-decoration hero-decoration-one" />
        <div className="hero-decoration hero-decoration-two" />

        {/* LEFT CONTENT */}
        <motion.div
          key={`content-${currentSlide.id}`}
          className="hero-content"
          initial={{
            opacity: 0,
            x: -30,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.55,
          }}
        >
          <span className="hero-badge">
            <span className="hero-badge-dot" />
            {currentSlide.badge}
          </span>

          <h1>
            {currentSlide.title}
            <br />
            <span>{currentSlide.highlight}</span>
          </h1>

          <p>{currentSlide.description}</p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-primary-btn"
              onClick={onShopNow}
            >
              {currentSlide.buttonText}
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="hero-secondary-btn"
            >
              <ShoppingBag size={18} />
              Browse Products
            </button>
          </div>

          {/* Trust information */}
          <div className="hero-trust">
            <div className="hero-trust-item">
              <strong>10K+</strong>
              <span>Products</span>
            </div>

            <div className="hero-trust-divider" />

            <div className="hero-trust-item">
              <strong>50K+</strong>
              <span>Customers</span>
            </div>

            <div className="hero-trust-divider" />

            <div className="hero-trust-item">
              <strong>4.9</strong>
              <span>Customer Rating</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div
          key={`image-${currentSlide.id}`}
          className="hero-visual"
          initial={{
            opacity: 0,
            scale: 0.94,
            x: 30,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          <div className="hero-image-background" />

          <div className="hero-image-frame">
            <img
              src={currentSlide.image}
              alt={currentSlide.highlight}
              className="hero-image"
            />
          </div>

          {/* Floating card */}
          <motion.div
            className="hero-floating-card"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="hero-floating-icon">
              <ShoppingBag size={18} />
            </div>

            <div>
              <strong>Best Choice</strong>
              <span>Shop with confidence</span>
            </div>
          </motion.div>
        </motion.div>

        {/* PREVIOUS */}
        <button
          type="button"
          className="hero-navigation hero-navigation-prev"
          onClick={goToPreviousSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft size={21} />
        </button>

        {/* NEXT */}
        <button
          type="button"
          className="hero-navigation hero-navigation-next"
          onClick={goToNextSlide}
          aria-label="Next slide"
        >
          <ChevronRight size={21} />
        </button>

        {/* INDICATORS */}
        <div className="hero-indicators">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={
                index === activeSlide
                  ? "hero-indicator active"
                  : "hero-indicator"
              }
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={
                index === activeSlide
                  ? "true"
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;