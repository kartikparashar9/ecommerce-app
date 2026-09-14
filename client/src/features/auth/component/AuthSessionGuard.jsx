import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { clearCredentials } from "../AuthSlice";

const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

const hasAccessToken = () => Boolean(localStorage.getItem("accessToken"));

const AuthSessionGuard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useSelector((state) => state.auth || {});
  const hadSession = useRef(Boolean(accessToken || localStorage.getItem("accessToken")));

  useEffect(() => {
    const checkSession = () => {
      const token = hasAccessToken();

      if (token) {
        hadSession.current = true;
        return;
      }

      if (!hadSession.current) return;

      hadSession.current = false;
      dispatch(clearCredentials());

      if (!AUTH_ROUTES.has(location.pathname)) {
        navigate("/login", {
          replace: true,
          state: { sessionExpired: true },
        });
      }
    };

    checkSession();

    const intervalId = window.setInterval(checkSession, 500);
    const handleStorage = (event) => {
      if (event.key === "accessToken" || event.key === "user" || event.key === null) {
        checkSession();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
    };
  }, [dispatch, navigate, location.pathname]);

  return null;
};

export default AuthSessionGuard;
