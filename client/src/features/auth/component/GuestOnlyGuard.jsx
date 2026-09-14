import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    return null;
  }
};

const getRoleHome = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "seller") return "/seller/dashboard";
  if (role === "user") return "/";
  return "/login";
};

const GuestOnlyGuard = () => {
  const location = useLocation();
  const authState = useSelector((state) => state.auth || {});
  const token =
    authState.accessToken || localStorage.getItem("accessToken");
  const user = authState.user || getStoredUser();

  if (!token) return <Outlet />;

  if (!user?.role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Navigate to={getRoleHome(user.role)} replace />;
};

export default GuestOnlyGuard;
