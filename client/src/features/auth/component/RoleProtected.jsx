import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const RoleProtected = ({ allowedRoles = [] }) => {
  const location = useLocation();

  // =====================================================
  // AUTH STATE
  // =====================================================

  const authState = useSelector((state) => state.auth || {});

  let currentUser = authState.user;

  const token = authState.accessToken || localStorage.getItem("accessToken");

  // =====================================================
  // LOCAL STORAGE FALLBACK
  // =====================================================

  if (!currentUser) {
    try {
      const storedUser = localStorage.getItem("user");

      currentUser = storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse stored user:", error);
    }
  }

  // =====================================================
  // NOT AUTHENTICATED
  // =====================================================

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // =====================================================
  // USER NOT YET AVAILABLE
  //
  // Do not immediately send authenticated users to "/".
  // =====================================================

  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Verifying account...</p>
      </div>
    );
  }

  // =====================================================
  // ROLE NOT ALLOWED
  // =====================================================

  if (!allowedRoles.includes(currentUser.role)) {
    // ---------------------------------------------------
    // ADMIN
    // ---------------------------------------------------

    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // ---------------------------------------------------
    // SELLER
    // ---------------------------------------------------

    if (currentUser.role === "seller") {
      return <Navigate to="/seller" replace />;
    }

    // ---------------------------------------------------
    // NORMAL USER / FALLBACK
    // ---------------------------------------------------

    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleProtected;
