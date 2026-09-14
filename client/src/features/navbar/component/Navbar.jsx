import React, { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import Logout from "../../auth/component/Logout";
import { profileApi } from "../../profile/profileApi";

import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import {
  FiSearch,
  FiHeart,
  FiShoppingCart,
  FiSun,
  FiMoon,
  FiChevronDown,
  FiUser,
  FiLock,
  FiLogOut,
} from "react-icons/fi";

import maleAvatar from "../../../assets/images/male-avatar.jpg";

import { NavLinks } from "./Navlinks";

const Navbar = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Change this after login integration
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
  });

  // ================= FETCH LOGGED-IN USER =================
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await profileApi();

        const userData = response?.message;

        const API_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");

        setUser({
          name: userData?.name || "",
          email: userData?.email || "",
          avatar: userData?.avatar ? `${API_URL}${userData.avatar}` : "",
        });
      } catch (error) {
        console.error(
          "Failed to fetch user profile:",
          error.response?.data || error.message,
        );

        setUser({
          name: "",
          email: "",
          avatar: "",
        });
      }
    };

    fetchUserProfile();
  }, []);

  // Dark Mode....
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [darkMode]);

  // Scrollbar....
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dropdown....
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.nav
      className={`navbar ${scrolled ? "navbar-shadow" : ""}`}
      initial={{ y: -70 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* ================= LEFT ================= */}

      <motion.div className="navbar-left" whileHover={{ scale: 1.05 }}>
        {/* <img
          src={logo}
          alt="logo"
          className="navbar-logo"
        /> */}

        <h2 className="logo-title">
          <a href="/">
            Just<span>Buy</span>
          </a>
        </h2>
      </motion.div>

      {/* ================= CENTER ================= */}

      <div className="navbar-center">
        <ul className="nav-links">
          {NavLinks.map((item) => (
            <motion.li
              key={item.id}
              whileHover={{
                y: -4,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
              }}
            >
              <a href={item.link}>{item.title}</a>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* ================= RIGHT ================= */}

      <div className="navbar-right">
        {/* Search */}

        <form className="search-box" onSubmit={(event) => { event.preventDefault(); const value = search.trim(); if (value) navigate(`/search?q=${encodeURIComponent(value)}`); }}>
          <FiSearch className="search-icon" />
          <input type="search" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
        </form>

        {/* Theme */}

        <motion.button
          whileTap={{ scale: 0.8 }}
          whileHover={{ rotate: 180 }}
          className="icon-btn"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <FiSun /> : <FiMoon />}
        </motion.button>

        {/* Wishlist */}

        <motion.div whileHover={{ scale: 1.15 }}>
          <Link to="/wishlist" className="icon-wrapper">
            <FiHeart />
            <span className="badge">2</span>
          </Link>
        </motion.div>

        {/* Cart */}

        <motion.div whileHover={{ scale: 1.15 }}>
          <Link to="/cart" className="icon-wrapper">
            <FiShoppingCart />
            <span className="badge">3</span>
          </Link>
        </motion.div>

        {/* User */}

        <div className="profile-wrapper" ref={dropdownRef}>
          <motion.div
            className="profile-box"
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <img src={user.avatar} alt="avatar" className="avatar" />

            <span className="username">{user.name}</span>

            <FiChevronDown />
          </motion.div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                className="profile-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="dropdown-header">
                  <img
                    src={user.avatar}
                    className="dropdown-avatar"
                    alt="avatar"
                  />

                  <h4>{user.name}</h4>

                  <p>{user.email}</p>
                </div>

                <Link to="/profile" className="dropdown-item">
                  <FiUser />
                  Edit Profile
                </Link>

                <Link to="/reset-password" className="dropdown-item">
                  <FiLock />
                  Reset Password
                </Link>

                <Logout />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
