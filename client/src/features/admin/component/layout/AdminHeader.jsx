import { useEffect, useState } from "react";
import { FiBell, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import {
  getMyProfile,
  logoutAdmin,
} from "../../AdminApi";

import { resolveMediaUrl, getInitial } from "../../../utils/media";

import "./AdminHeader.css";

const AdminHeader = ({ setIsOpen }) => {
  const navigate = useNavigate();

  const [avatarError, setAvatarError] = useState(false);

  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  // =========================================================
  // RESET AVATAR ERROR IF ADMIN AVATAR CHANGES
  // =========================================================

  useEffect(() => {
    setAvatarError(false);
  }, [admin?.avatar]);

  // =========================================================
  // GET ADMIN PROFILE
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchAdminProfile = async () => {
      try {
        const response = await getMyProfile();

        const data =
          response?.data?.data ||
          response?.data ||
          null;

        if (mounted && data && typeof data === "object" && !Array.isArray(data)) {
          setAdmin(data);

          // Keep localStorage user information updated
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch (error) {
        console.error(
          "Failed to load admin profile:",
          error?.response?.data?.message || error?.message,
        );
      }
    };

    fetchAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  const avatarUrl = resolveMediaUrl(admin?.avatar);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <header className="admin-header">
      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      <button
        type="button"
        className="admin-mobile-menu-btn"
        onClick={() => setIsOpen?.(true)}
        aria-label="Open admin menu"
      >
        <FiMenu />
      </button>

      {/* =====================================================
          HEADER ACTIONS
      ===================================================== */}

      <div className="admin-header-actions">
        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        <button
          type="button"
          className="admin-notification-btn"
          onClick={() => navigate("/admin/notifications")}
          aria-label="Notifications"
        >
          <FiBell />

          <span
            className="notification-dot"
            aria-hidden="true"
          />
        </button>

        {/* ===================================================
            PROFILE
        =================================================== */}

        <div className="admin-profile">
          <button
            type="button"
            className="admin-profile-button"
            onClick={() => navigate("/admin/settings")}
            aria-label="Open admin settings"
          >
            <div className="admin-avatar">
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={admin?.name || "Admin"}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span>
                  {getInitial(admin?.name, "A")}
                </span>
              )}
            </div>

            <div className="admin-profile-info">
              <strong>
                {admin?.name || "Admin"}
              </strong>

              <span>
                {admin?.role || "Administrator"}
              </span>
            </div>
          </button>
        </div>

        {/* ===================================================
            LOGOUT
        =================================================== */}

        <button
          type="button"
          className="admin-header-logout"
          onClick={handleLogout}
          aria-label="Sign out of admin panel"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;