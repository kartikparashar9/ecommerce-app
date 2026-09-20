import React, { useEffect, useRef, useState } from "react";
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

import { loginApi, googleLoginApi } from "../../AuthApi";
import { setCredentials } from "../../AuthSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  /* =====================================================
     NORMAL LOGIN STATES
  ===================================================== */

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  /* =====================================================
     GOOGLE LOGIN STATES
  ===================================================== */

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGooglePopup, setShowGooglePopup] = useState(false);

  const [selectedGender, setSelectedGender] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [googleToken, setGoogleToken] = useState(null);

  const googleButtonRef = useRef(null);
  const googleInitialized = useRef(false);

  /* =====================================================
     REDIRECT USER
  ===================================================== */

  const redirectUser = (user) => {
    console.log("REDIRECT USER:", user);

    const role = String(
      user?.role || user?.userRole || user?.accountType || "",
    ).toLowerCase();


    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (role === "seller") {
      navigate("/seller", { replace: true });
      return;
    }

    if (role === "user") {
      navigate("/", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  /* =====================================================
     NORMAL LOGIN
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
        }),
      );

      redirectUser(user);
    } catch (error) {
      console.error("NORMAL LOGIN FAILED:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Login failed. Please check your email and password.";

      setLoginError(message);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     GOOGLE LOGIN CALLBACK
  ===================================================== */

  const handleGoogleCredential = (response) => {
    try {
      setLoginError("");

      const token = response?.credential;

      if (!token) {
        throw new Error("Google authentication token was not received.");
      }

      setGoogleToken(token);

      /*
       * Open profile completion popup.
       */

      setShowGooglePopup(true);
    } catch (error) {
      console.error("Google authentication failed:", error);

      setLoginError(error?.message || "Google login failed. Please try again.");
    }
  };

  /* =====================================================
     INITIALIZE GOOGLE BUTTON
  ===================================================== */

  useEffect(() => {
    let intervalId;

    const initializeGoogle = () => {
      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        return false;
      }

      if (!googleButtonRef.current) {
        return false;
      }

      if (googleInitialized.current) {
        return true;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        console.error("VITE_GOOGLE_CLIENT_ID is missing.");

        setLoginError("Google login is not configured.");

        return false;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      /*
       * Remove previously generated button.
       */

      googleButtonRef.current.innerHTML = "";

      /*
       * Google generated button.
       */

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 300,
      });

      googleInitialized.current = true;

      return true;
    };

    /*
     * Try immediately.
     */

    if (!initializeGoogle()) {
      intervalId = setInterval(() => {
        const initialized = initializeGoogle();

        if (initialized) {
          clearInterval(intervalId);
        }
      }, 200);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  /* =====================================================
     SUBMIT GOOGLE LOGIN
  ===================================================== */

  const handleGoogleLogin = async () => {
    try {
      setLoginError("");

      if (!googleToken) {
        setLoginError("Google authentication expired. Please try again.");

        setShowGooglePopup(false);

        return;
      }

      if (!selectedGender) {
        setLoginError("Please select your gender.");
        return;
      }

      if (!selectedRole) {
        setLoginError("Please select account type.");
        return;
      }

      /*
       * Admin can NEVER be selected from frontend.
       */

      if (!["user", "seller"].includes(selectedRole)) {
        setLoginError("Invalid account type.");
        return;
      }

      setGoogleLoading(true);

      const response = await googleLoginApi({
        token: googleToken,
        gender: selectedGender,
        role: selectedRole,
      });

      const accessToken = response?.data?.accessToken || response?.accessToken;

      const user = response?.data?.user || response?.user || null;

      if (!accessToken) {
        throw new Error("Access token not received from Google login.");
      }

      if (!user) {
        throw new Error("User data not received from Google login.");
      }

      dispatch(
        setCredentials({
          user,
          accessToken,
        }),
      );

      /*
       * Clear Google states.
       */

      setShowGooglePopup(false);
      setGoogleToken(null);
      setSelectedGender("");
      setSelectedRole("");
      setLoginError("");

      redirectUser(user);
    } catch (error) {
      console.error("Google login failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Google login failed. Please try again.";

      setLoginError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  /* =====================================================
     CANCEL GOOGLE LOGIN
  ===================================================== */

  const cancelGoogleLogin = () => {
    if (googleLoading) {
      return;
    }

    setShowGooglePopup(false);
    setGoogleToken(null);
    setSelectedGender("");
    setSelectedRole("");
    setLoginError("");
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <>
      <div className="login-page">
        {/* =================================================
            LEFT / DECORATIVE SIDE
        ================================================= */}

        <motion.div
          className="right-side"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="shopping-bag"
            animate={{
              y: [-15, 15, -15],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
            }}
          >
            <FaShoppingBag />

            <h2>Shop More</h2>

            <p>Best Fashion Collection</p>
          </motion.div>

          <motion.div
            className="fashion-card"
            animate={{
              y: [15, -15, 15],
            }}
            transition={{
              repeat: Infinity,
              duration: 6,
            }}
          >
            <FaTshirt />

            <h3>Fashion Sale</h3>

            <span>Up to 70% OFF</span>
          </motion.div>

          <motion.div
            className="shoe-card"
            animate={{
              y: [-15, 15, -15],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
            }}
          >
            <h2>👟</h2>

            <p>Trending Sneakers</p>
          </motion.div>

          <motion.div
            className="payment-card"
            animate={{
              y: [12, -12, 12],
              rotate: [-2, 2, -2],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
            }}
          >
            <FaCreditCard />

            <h4>100% Secure</h4>

            <p>Safe Payments</p>
          </motion.div>

          <motion.div
            className="delivery-card"
            animate={{
              y: [-10, 10, -10],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
            }}
          >
            <FaShippingFast />

            <h4>Fast Delivery</h4>

            <p>Free Shipping</p>
          </motion.div>

          <motion.div
            className="discount-card"
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
            }}
          >
            <h2>70%</h2>

            <span>OFF</span>
          </motion.div>

          <motion.div
            className="circle circle-one"
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
            }}
            transition={{
              repeat: Infinity,
              duration: 6,
            }}
          />

          <motion.div
            className="circle circle-two"
            animate={{
              y: [20, -20, 20],
              x: [10, -10, 10],
            }}
            transition={{
              repeat: Infinity,
              duration: 7,
            }}
          />

          <motion.div
            className="circle circle-three"
            animate={{
              y: [-15, 15, -15],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
            }}
          />
        </motion.div>

        {/* =================================================
            LOGIN SIDE
        ================================================= */}

        <motion.div
          className="left-side"
          initial={{
            x: -80,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          transition={{
            duration: 0.8,
          }}
        >
          <div className="login-card">
            {/* BRAND */}

            <div className="brand">
              <div className="brand-icon">
                <FaShoppingBag />
              </div>

              <h1>JustBuy</h1>

              <p>Fashion • Electronics • Lifestyle</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
              {/* EMAIL */}

              <div className="input-box">
                <FaEnvelope className="input-icon" />

                <input
                  type="email"
                  placeholder="Enter your email"
                  {...register("email", {
                    required: "Email is required",
                  })}
                />
              </div>

              {errors.email && <p className="error">{errors.email.message}</p>}

              {/* PASSWORD */}

              <div className="input-box">
                <FaLock className="input-icon" />

                <input
                  type="password"
                  placeholder="Enter password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
              </div>

              {errors.password && (
                <p className="error">{errors.password.message}</p>
              )}

              {/* LOGIN ERROR */}

              {loginError && <p className="error">{loginError}</p>}

              {/* FORGOT PASSWORD */}

              <div className="forgot-row">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              {/* LOGIN */}

              <button
                className="login-btn"
                type="submit"
                disabled={loading || googleLoading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              {/* DIVIDER */}

              <div className="divider">
                <span>OR</span>
              </div>

              {/* GOOGLE */}

              <div className="social-buttons">
                {/* IMPORTANT:
                    Google gets separate wrapper
                */}

                <div ref={googleButtonRef} className="google-login-wrapper" />
              </div>

              {/* SIGNUP */}

              <div className="signup-link">
                New to JustBuy? <Link to="/signup">Create Account</Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* =====================================================
          GOOGLE PROFILE POPUP
      ===================================================== */}

      {showGooglePopup && (
        <div className="google-popup-overlay" onClick={cancelGoogleLogin}>
          <div
            className="google-popup"
            onClick={(event) => event.stopPropagation()}
          >
            {/* GOOGLE ICON */}

            <div className="google-popup-icon">
              <FcGoogle />
            </div>

            {/* TITLE */}

            <h2>Complete Your Profile</h2>

            <p className="google-popup-description">
              Select your gender and account type to continue with Google.
            </p>

            {/* =================================================
                GENDER
            ================================================= */}

            <h3 className="google-popup-heading">Select Gender</h3>

            <div className="google-option-group">
              <button
                type="button"
                className={`google-option-btn ${
                  selectedGender === "male" ? "selected" : ""
                }`}
                disabled={googleLoading}
                onClick={() => setSelectedGender("male")}
              >
                Male
              </button>

              <button
                type="button"
                className={`google-option-btn ${
                  selectedGender === "female" ? "selected" : ""
                }`}
                disabled={googleLoading}
                onClick={() => setSelectedGender("female")}
              >
                Female
              </button>
            </div>

            {/* =================================================
                ACCOUNT TYPE
            ================================================= */}

            <h3 className="google-popup-heading">Select Account Type</h3>

            <div className="google-option-group">
              <button
                type="button"
                className={`google-option-btn ${
                  selectedRole === "user" ? "selected" : ""
                }`}
                disabled={googleLoading}
                onClick={() => setSelectedRole("user")}
              >
                User
              </button>

              <button
                type="button"
                className={`google-option-btn ${
                  selectedRole === "seller" ? "selected" : ""
                }`}
                disabled={googleLoading}
                onClick={() => setSelectedRole("seller")}
              >
                Seller
              </button>
            </div>

            {/* ERROR */}

            {loginError && (
              <p className="error google-popup-error">{loginError}</p>
            )}

            {/* CONTINUE */}

            <button
              type="button"
              className="login-btn google-continue-btn"
              disabled={googleLoading || !selectedGender || !selectedRole}
              onClick={handleGoogleLogin}
            >
              {googleLoading ? "Logging in..." : "Continue with Google"}
            </button>

            {/* CANCEL */}

            <button
              type="button"
              className="google-cancel-btn"
              disabled={googleLoading}
              onClick={cancelGoogleLogin}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
