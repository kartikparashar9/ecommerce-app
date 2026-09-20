import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const TOKEN_KEY = "accessToken";

const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

function ProtectedRoute() {
  const location = useLocation();

  const [token, setToken] = useState(() => getToken());

  useEffect(() => {
    const checkToken = () => {
      setToken(getToken());
    };

    checkToken();

    const interval = setInterval(checkToken, 500);

    const handleStorageChange = (event) => {
      if (event.key === TOKEN_KEY) {
        checkToken();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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
