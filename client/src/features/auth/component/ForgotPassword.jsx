import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

import { forgotPasswordApi } from "../AuthApi";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);

      const response = await forgotPasswordApi(
        email.trim()
      );

      console.log(
        "Forgot password response:",
        response
      );

      setSuccess(
        response?.message ||
          "OTP has been sent to your email."
      );

      /*
        Backend OTP send hone ke baad
        reset-password page par jayenge.

        Email ko state ke through pass kar rahe hain
        taaki reset page ko pata rahe kis account
        ke liye OTP verify karna hai.
      */

      navigate("/reset-password", {
        state: {
          email: email.trim(),
        },
      });

    } catch (error) {
      console.error(
        "Forgot password failed:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to send OTP. Please try again.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">

      {/* Animated Background */}

      <div className="bg-circle circle-one"></div>
      <div className="bg-circle circle-two"></div>
      <div className="bg-circle circle-three"></div>


      <motion.div
        className="forgot-card"

        initial={{
          opacity: 0,
          y: 60,
          scale: 0.95,
        }}

        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}

        transition={{
          duration: 0.6,
          ease: "easeOut",
        }}
      >

        {/* =================================================
            LEFT SECTION
        ================================================= */}

        <motion.div
          className="forgot-left"

          initial={{
            x: -60,
            opacity: 0,
          }}

          animate={{
            x: 0,
            opacity: 1,
          }}

          transition={{
            delay: 0.3,
          }}
        >

          <h1>
            Forgot Password?
          </h1>

          <p>
            Enter your registered email address
            and we'll send you a verification
            code to reset your password.
          </p>

          <div className="illustration">

            <div className="mail-box">
              <span>📧</span>
            </div>

          </div>

        </motion.div>


        {/* =================================================
            RIGHT SECTION
        ================================================= */}

        <motion.div
          className="forgot-right"

          initial={{
            x: 60,
            opacity: 0,
          }}

          animate={{
            x: 0,
            opacity: 1,
          }}

          transition={{
            delay: 0.4,
          }}
        >

          <h2>
            Recover Account
          </h2>


          <form onSubmit={handleSubmit}>

            <div className="input-group">

              <label>
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
              />

            </div>


            {/* ERROR */}

            {error && (
              <p className="error">
                {error}
              </p>
            )}


            {/* SUCCESS */}

            {success && (
              <p className="success">
                {success}
              </p>
            )}


            <motion.button

              whileHover={{
                scale: loading ? 1 : 1.03,
              }}

              whileTap={{
                scale: loading ? 1 : 0.97,
              }}

              type="submit"

              disabled={loading}

              className={
                loading
                  ? "loading-btn"
                  : ""
              }
            >

              {loading ? (
                <>
                  <span className="loader"></span>
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}

            </motion.button>

          </form>


          <div className="bottom-links">

            <Link to="/login">
              ← Back to Login
            </Link>

          </div>

        </motion.div>

      </motion.div>

    </div>
  );
};

export default ForgotPassword;