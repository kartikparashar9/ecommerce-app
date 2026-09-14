import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({
  allowedRoles = [],
}) => {
  const location = useLocation();

  // =====================================================
  // AUTH STATE
  // =====================================================

  const authState = useSelector(
    (state) => state.auth || {},
  );

  let currentUser = authState.user;

  const token =
    authState.accessToken ||
    localStorage.getItem("accessToken");

  // =====================================================
  // USER FALLBACK
  // =====================================================

  if (!currentUser) {
    try {
      const storedUser =
        localStorage.getItem("user");

      currentUser = storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch (error) {
      console.error(
        "Failed to parse stored user:",
        error,
      );
    }
  }

  // =====================================================
  // NOT LOGGED IN
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
  // ROLE PROTECTION
  // =====================================================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(
      currentUser?.role,
    )
  ) {
    // ---------------------------------------------------
    // ADMIN
    // ---------------------------------------------------

    if (
      currentUser?.role === "admin"
    ) {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    // ---------------------------------------------------
    // SELLER
    // ---------------------------------------------------

    if (
      currentUser?.role === "seller"
    ) {
      return (
        <Navigate
          to="/seller"
          replace
        />
      );
    }

    // ---------------------------------------------------
    // UNKNOWN / NORMAL FALLBACK
    // ---------------------------------------------------

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

