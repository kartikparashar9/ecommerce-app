import React from "react";
import "./login.css";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, Link } from "react-router-dom";

import { useDispatch } from "react-redux";

import {
  FaShoppingBag,
  FaEnvelope,
  FaLock,
  FaPhoneAlt,
  FaShippingFast,
  FaCreditCard,
  FaTshirt,
} from "react-icons/fa";

import { loginApi } from "../../AuthApi";
import { setCredentials } from "../../AuthSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState("");

  /* =====================================================
     LOGIN
  ===================================================== */

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setLoginError("");

      const response = await loginApi({
        email: data.email,
        password: data.password,
      });

      const accessToken = response?.data?.accessToken || response?.accessToken;
      const user = response?.data?.user || response?.user || null;

      if (!accessToken) {
        throw new Error("Access token not received.");
      }

      if (!user) {
        throw new Error("User data not received.");
      }

      dispatch(
        setCredentials({
          user,
          accessToken,
        })
      );

      // 1. Admin Role Redirect
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // 2. Seller Role Redirect -> Triggers SellerProtectedGuard
      if (user.role === "seller") {
        navigate("/seller/dashboard", { replace: true });
        return;
      }

      // 3. Normal User Redirect
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Login failed. Please try again.";

      setLoginError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE */}

      <motion.div
        className="right-side"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="shopping-bag"
          animate={{ y: [-15, 15, -15] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        >
          <FaShoppingBag />
          <h2>Shop More</h2>
          <p>Best Fashion Collection</p>
        </motion.div>

        <motion.div
          className="fashion-card"
          animate={{ y: [15, -15, 15] }}
          transition={{ repeat: Infinity, duration: 6 }}
        >
          <FaTshirt />
          <h3>Fashion Sale</h3>
          <span>Up to 70% OFF</span>
        </motion.div>

        <motion.div
          className="shoe-card"
          animate={{ y: [-15, 15, -15] }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          <h2>👟</h2>
          <p>Trending Sneakers</p>
        </motion.div>

        <motion.div
          className="payment-card"
          animate={{ y: [12, -12, 12], rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        >
          <FaCreditCard />
          <h4>100% Secure</h4>
          <p>Safe Payments</p>
        </motion.div>

        <motion.div
          className="delivery-card"
          animate={{ y: [-10, 10, -10] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <FaShippingFast />
          <h4>Fast Delivery</h4>
          <p>Free Shipping</p>
        </motion.div>

        <motion.div
          className="discount-card"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          <h2>70%</h2>
          <span>OFF</span>
        </motion.div>

        <motion.div
          className="circle circle-one"
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <motion.div
          className="circle circle-two"
          animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
          transition={{ repeat: Infinity, duration: 7 }}
        />
        <motion.div
          className="circle circle-three"
          animate={{ y: [-15, 15, -15] }}
          transition={{ repeat: Infinity, duration: 5 }}
        />
      </motion.div>

      {/* RIGHT SIDE */}

      <motion.div
        className="left-side"
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="login-card">
          <div className="brand">
            <div className="brand-icon">
              <FaShoppingBag />
            </div>
            <h1>JustBuy</h1>
            <p>Fashion • Electronics • Lifestyle</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="input-box">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                {...register("email", { required: "Email is required" })}
              />
            </div>
            {errors.email && <p className="error">{errors.email.message}</p>}

            <div className="input-box">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Enter password"
                {...register("password", { required: "Password is required" })}
              />
            </div>
            {errors.password && <p className="error">{errors.password.message}</p>}

            {loginError && <p className="error">{loginError}</p>}

            <div className="forgot-row">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="social-buttons">
              <button type="button" className="social-btn">
                <FcGoogle /> Google
              </button>
              <button type="button" className="social-btn">
                <FaPhoneAlt /> Phone
              </button>
            </div>

            <div className="signup-link">
              New to JustBuy? <Link to="/signup">Create Account</Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;