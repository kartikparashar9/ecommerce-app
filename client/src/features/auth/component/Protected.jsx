import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const TOKEN_KEY = "accessToken";

function ProtectedRoute() {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;