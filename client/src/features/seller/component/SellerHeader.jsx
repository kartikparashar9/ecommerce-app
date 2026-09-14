import React from "react";
import { useSelector } from "react-redux";
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiMenu,
  FiAlertTriangle,
  FiUser,
} from "react-icons/fi";
import "./SellerHeader.css";

import { resolveMediaUrl, getInitial } from "../../utils/media";

const SellerHeader = ({ onMenuClick }) => {
  const { user } = useSelector((state) => state.auth || {});
  const { profile } = useSelector((state) => state.seller || {});

  const status = profile?.verificationStatus;
  const blocked = profile?.isBlocked;
  const inactive = profile?.isActive === false;

  const badge = blocked
    ? ["restricted", "Blocked", FiAlertTriangle]
    : inactive
      ? ["inactive", "Inactive", FiAlertTriangle]
      : status === "pending"
        ? ["pending", "Pending Approval", FiClock]
        : ["approved", "Verified Seller", FiCheckCircle];

  const [className, label, Icon] = badge;

  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  const avatarUrl = resolveMediaUrl(user?.avatar);

  return (
    <header className="seller-header">
      <button
        className="seller-menu-button"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <FiMenu />
      </button>

      <div className="seller-header-store">
        <span className="seller-header-eyebrow">SELLER CENTER</span>
        <h1>{profile?.businessName || "Your Store"}</h1>
      </div>

      <div className="seller-header-actions">
        <span className={`seller-status ${className}`}>
          <Icon /> {label}
        </span>
        <button className="seller-notification" aria-label="Notifications">
          <FiBell />
          <i />
        </button>
        <div className="seller-user-chip">
          <div className="seller-user-avatar">
            {user?.avatar ? (
              <img src={avatarUrl} alt="Profile" />
            ) : (
              <FiUser />
            )}
          </div>
          <div className="seller-user-copy">
            <strong>{user?.name || "Seller"}</strong>
            <span>{user?.email || ""}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;
