import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "./ResetPassword.css";

import { resetPasswordApi } from "../AuthApi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /*
    Forgot password page se email aa raha hai
  */

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    /* =========================================
       VALIDATION
    ========================================= */

    if (!email) {
      setError(
        "Email information is missing. Please request OTP again."
      );
      return;
    }

    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError(
        "OTP must be exactly 6 digits"
      );
      return;
    }

    if (!newPassword) {
      setError(
        "New password is required"
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Confirm password is required"
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "Passwords do not match"
      );
      return;
    }


    /* =========================================
       API
    ========================================= */

    try {
      setLoading(true);

      const response =
        await resetPasswordApi({
          email,
          otp,
          newPassword,
          confirmPassword,
        });

      console.log(
        "Reset password response:",
        response
      );

      setSuccess(
        response?.message ||
          "Password reset successfully."
      );

      /*
        Password successfully reset
        hone ke baad login page.
      */

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (error) {

      console.error(
        "Reset password failed:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to reset password.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="reset-page">

      <motion.div
        className="reset-card"

        initial={{
          opacity: 0,
          y: 50,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          duration: 0.6,
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="reset-header">

          <div className="reset-icon">
            🔐
          </div>

          <h1>
            Reset Password
          </h1>

          <p>
            Enter the OTP sent to your email
            and create a new password.
          </p>

          {email && (
            <small>
              OTP sent to: {email}
            </small>
          )}

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          className="reset-form"
          onSubmit={handleSubmit}
        >

          {/* OTP */}

          <div className="input-group">

            <label>
              OTP
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6 digit OTP"
              value={otp}
              onChange={(e) => {
                const value =
                  e.target.value.replace(
                    /\D/g,
                    ""
                  );

                setOtp(value);
              }}
              disabled={loading}
            />

          </div>


          {/* NEW PASSWORD */}

          <div className="input-group">

            <label>
              New Password
            </label>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              disabled={loading}
            />

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="input-group">

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
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


          {/* BUTTON */}

          <motion.button
            type="submit"

            whileHover={{
              scale: loading ? 1 : 1.03,
            }}

            whileTap={{
              scale: loading ? 1 : 0.97,
            }}

            disabled={loading}
          >

            {loading
              ? "Resetting..."
              : "Reset Password"}

          </motion.button>

        </form>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="reset-footer">

          <Link to="/login">
            ← Back to Login
          </Link>

        </div>

      </motion.div>

    </div>
  );
};

export default ResetPassword;