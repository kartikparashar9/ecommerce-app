import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const TOKEN_KEY = "accessToken";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  try {
    const user = localStorage.getItem("user");

    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function RoleProtected({ allowedRoles = [] }) {
  const location = useLocation();

  const [auth, setAuth] = useState(() => ({
    token: getToken(),
    user: getUser(),
  }));

  useEffect(() => {
    const checkAuth = () => {
      setAuth({
        token: getToken(),
        user: getUser(),
      });
    };

    checkAuth();

    const interval = setInterval(checkAuth, 500);

    const handleStorageChange = (event) => {
      if (event.key === TOKEN_KEY || event.key === "user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // No token
  if (!auth.token) {
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

  const role = auth.user?.role || auth.user?.user?.role;

  // Wrong role
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RoleProtected;
