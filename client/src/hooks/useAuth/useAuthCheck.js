import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCredentials } from "../../features/auth/AuthSlice";

export default function useAuthCheck({ redirectTo = "/login" } = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { dispatch(clearCredentials()); navigate(redirectTo, { replace: true }); }
  }, [dispatch, navigate, redirectTo]);
  return Boolean(localStorage.getItem("accessToken"));
}
