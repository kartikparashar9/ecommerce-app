import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiSettings,
  FiUser,
  FiLogOut,
  FiX,
  FiBarChart2,
} from "react-icons/fi";
import { clearCredentials } from "../../auth/AuthSlice";
import { resetSellerState } from "../sellerSlice";
import "./SellerSidebar.css";

const SellerSidebar = ({ isOpen, onClose, restricted = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(clearCredentials());
    dispatch(resetSellerState());
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const items = [
    { path: "/seller/dashboard", label: "Dashboard", icon: FiGrid },
    { path: "/seller/profile", label: "My Profile", icon: FiUser },
    { path: "/seller/products", label: "Products", icon: FiPackage },
    { path: "/seller/orders", label: "Orders", icon: FiShoppingBag },
    { path: "/seller/analytics", label: "Analytics", icon: FiBarChart2 },
    { path: "/seller/settings", label: "Settings", icon: FiSettings },
  ];

  return (
    <>
      {isOpen && <button className="seller-sidebar-overlay" onClick={onClose} aria-label="Close menu" />}
      <aside className={`seller-sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="seller-brand">
          <div className="seller-brand-mark">S</div>
          <div>
            <strong>ShopHub</strong>
            <span>Seller Center</span>
          </div>
          <button className="seller-sidebar-mobile-close" onClick={onClose} aria-label="Close sidebar">
            <FiX />
          </button>
        </div>

        <div className="seller-sidebar-label">SELLER MENU</div>
        <nav className="seller-nav">
          {items.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) => `seller-nav-link ${isActive ? "active" : ""} ${restricted ? "restricted-link" : ""}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="seller-sidebar-footer">
          <div className="seller-support-card">
            <span>Need help?</span>
            <small>Contact marketplace support.</small>
          </div>
          <button className="seller-logout" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SellerSidebar;
