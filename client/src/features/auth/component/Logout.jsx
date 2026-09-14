import React from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutApi } from "../../auth/AuthApi";
import { clearCredentials } from "../../auth/AuthSlice";

const Logout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      /* Redux clear */
      dispatch(clearCredentials());
      navigate("/login");

      /* Local storage clear */
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      /* Session clear */
      sessionStorage.clear();

      /* Redirect */
      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <button className="logout-btn" onClick={handleLogout}>
      <FiLogOut />
      <span>Logout</span>
    </button>
  );
};

export default Logout;
