import React, { useEffect, useRef, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { AnimatePresence, motion } from "framer-motion";

import { Link, useNavigate } from "react-router-dom";

import {
  FiHeart,
  FiMenu,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiChevronDown,
  FiPackage,
  FiMapPin,
} from "react-icons/fi";

import Logout from "../../auth/component/Logout";
import { profileApi } from "../../profile/profileApi";
import { fetchCart } from "../../cart/CartSlice";
import { fetchWishlist } from "../../wishlist/WishlistSlice";
import { resolveMediaUrl, getInitial } from "../../utils/media";
import "./Navbar.css";

// =====================================================
// NAVIGATION
// =====================================================

const NAV_ITEMS = [
  {
    label: "Home",
    to: "/",
  },
  {
    label: "Fashion",
    to: "/fashion",
  },
  {
    label: "Accessories",
    to: "/accessories",
  },
  {
    label: "Beauty",
    to: "/beauty",
  },
  {
    label: "Electronics",
    to: "/electronics",
  },
];

// =====================================================
// COMPONENT
// =====================================================

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);

  const isAuthenticated = Boolean(
    useSelector((state) => state.auth?.isAuthenticated),
  );

  const cartItems = useSelector((state) => state.cart?.items || []);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  // ===================================================
  // PROFILE
  // ===================================================

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      return undefined;
    }

    let active = true;

    const loadProfile = async () => {
      try {
        const response = await profileApi();

        const data = response?.message?.name
          ? response.message
          : response?.data?.name
            ? response.data
            : response?.message || response?.data || {};

        if (active) {
          setUser(data);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // ===================================================
  // CART / WISHLIST
  // ===================================================

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    dispatch(fetchCart());
    dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated]);

  // ===================================================
  // SCROLL
  // ===================================================

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ===================================================
  // OUTSIDE CLICK
  // ===================================================

  useEffect(() => {
    const onOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", onOutside);

    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ===================================================
  // MOBILE MENU
  // ===================================================

  useEffect(() => {
    document.body.classList.toggle("navbar-menu-open", menuOpen);

    return () => document.body.classList.remove("navbar-menu-open");
  }, [menuOpen]);

  // ===================================================
  // SEARCH
  // ===================================================

  const submitSearch = (event) => {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      return;
    }

    setMenuOpen(false);

    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  // ===================================================
  // COUNTS
  // ===================================================

  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item?.quantity) || 0),
    0,
  );

  const wishlistCount = wishlistItems.length;

  // ===================================================
  // USER
  // ===================================================

  const userName = user?.name || "Account";

  const avatar = resolveMediaUrl(user?.avatar);

  // ===================================================
  // CLOSE MENUS
  // ===================================================

  const closeMenus = () => {
    setMenuOpen(false);
    setShowDropdown(false);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <motion.nav
      className={`navbar ${scrolled ? "navbar-shadow" : ""}`}
      initial={{
        y: -60,
      }}
      animate={{
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
    >
      <div className="navbar-inner">
        {/* BRAND */}

        <Link to="/" className="navbar-brand" onClick={closeMenus}>
          Just<span>Buy</span>
        </Link>

        {/* DESKTOP NAV */}

        <div className="navbar-desktop-links" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} onClick={closeMenus}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* SEARCH */}

        <form className="navbar-search" onSubmit={submitSearch}>
          <FiSearch aria-hidden="true" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
          />
        </form>

        {/* ACTIONS */}

        <div className="navbar-actions">
          {/* WISHLIST */}

          {isAuthenticated && (
            <Link
              to="/wishlist"
              className="navbar-icon"
              aria-label={`Wishlist${
                wishlistCount ? `, ${wishlistCount} items` : ""
              }`}
            >
              <FiHeart />

              {wishlistCount > 0 && (
                <span className="navbar-badge">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* CART */}

          {isAuthenticated && (
            <Link
              to="/cart"
              className="navbar-icon"
              aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            >
              <FiShoppingCart />

              {cartCount > 0 && (
                <span className="navbar-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* ACCOUNT */}

          <div className="navbar-account" ref={dropdownRef}>
            <button
              type="button"
              className="navbar-account-button"
              onClick={() => setShowDropdown((value) => !value)}
              aria-expanded={showDropdown}
              aria-label="Account menu"
            >
              {avatar ? (
                <img src={avatar} alt="" />
              ) : (
                <span className="navbar-avatar-fallback">
                  {getInitial(userName)}
                </span>
              )}

              <span>{userName}</span>

              <FiChevronDown />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  className="navbar-dropdown"
                  initial={{
                    opacity: 0,
                    y: -6,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -6,
                  }}
                >
                  {isAuthenticated ? (
                    <>
                      <div className="navbar-dropdown__user">
                        <strong>{userName}</strong>

                        <small>{user?.email || ""}</small>
                      </div>

                      {/* PROFILE */}

                      <Link to="/profile" onClick={closeMenus}>
                        <FiUser />
                        Profile
                      </Link>

                      {/* MY ORDERS */}

                      <Link to="/orders" onClick={closeMenus}>
                        <FiPackage />
                        My Orders
                      </Link>

                      {/* TRACK ORDERS */}

                      <Link to="/orders" onClick={closeMenus}>
                        <FiMapPin />
                        Track Orders
                      </Link>

                      {/* LOGOUT */}

                      <Logout />
                    </>
                  ) : (
                    <Link to="/login" onClick={closeMenus}>
                      <FiUser />
                      Login
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MOBILE */}

          <button
            type="button"
            className="navbar-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* MOBILE PANEL */}

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="navbar-mobile-panel"
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
          >
            <form className="navbar-mobile-search" onSubmit={submitSearch}>
              <FiSearch />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                aria-label="Mobile product search"
              />
            </form>

            <nav
              className="navbar-mobile-links"
              aria-label="Mobile primary navigation"
            >
              {NAV_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} onClick={closeMenus}>
                  {item.label}
                </Link>
              ))}

              {isAuthenticated && (
                <>
                  <Link to="/orders" onClick={closeMenus}>
                    My Orders
                  </Link>

                  <Link to="/orders" onClick={closeMenus}>
                    Track Orders
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
