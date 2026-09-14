import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useSelector } from "react-redux";

const MarketplaceGuard = () => {
  const location = useLocation();

  // =====================================================
  // AUTH STATE
  // =====================================================

  const authState = useSelector(
    (state) => state.auth || {},
  );

  let user = authState.user;

  const accessToken =
    authState.accessToken ||
    localStorage.getItem("accessToken");

  // =====================================================
  // USER FALLBACK FROM LOCAL STORAGE
  // =====================================================

  if (!user) {
    try {
      const storedUser =
        localStorage.getItem("user");

      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error(
        "Failed to parse stored user:",
        error,
      );
    }
  }

  // =====================================================
  // GUEST
  //
  // User is not logged in.
  // Marketplace is public.
  // =====================================================

  if (!accessToken) {
    return <Outlet />;
  }

  // =====================================================
  // ADMIN
  //
  // Admin must NEVER see the user marketplace.
  // =====================================================

  if (user?.role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  // =====================================================
  // SELLER
  //
  // Seller must NEVER see the normal user marketplace.
  //
  // IMPORTANT:
  // Seller status/profile checking is handled by
  // SellerProtectedGuard.
  //
  // Here we only prevent seller from entering:
  // /
  // /fashion
  // /beauty
  // /accessories
  // /electronics
  // /search
  // /product/*
  // =====================================================

  if (user?.role === "seller") {
    return (
      <Navigate
        to="/seller"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // =====================================================
  // NORMAL USER
  //
  // Normal authenticated user can access marketplace.
  // =====================================================

  return <Outlet />;
};

export default MarketplaceGuard;

