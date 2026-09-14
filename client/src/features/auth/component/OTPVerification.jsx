import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./OTPVerfication.css";

import { verifySignupOTPApi } from "../AuthApi";

const OTP_LENGTH = 6;

const OTPVerification = ({ email, onVerified, signupVerification = false }) => {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));

  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(30);

  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const updatedOTP = [...otp];

    updatedOTP[index] = value;

    setOtp(updatedOTP);

    setError("");

    if (value && index < OTP_LENGTH - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }

    if (
      e.key === "ArrowRight" &&
      index < OTP_LENGTH - 1 &&
      inputRefs.current[index + 1]
    ) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .trim()
      .slice(0, OTP_LENGTH);

    if (!/^\d+$/.test(pastedData)) return;

    const values = pastedData.split("");

    const updatedOTP = new Array(OTP_LENGTH).fill("");

    values.forEach((digit, index) => {
      updatedOTP[index] = digit;
    });

    setOtp(updatedOTP);

    setError("");

    const nextIndex =
      values.length >= OTP_LENGTH ? OTP_LENGTH - 1 : values.length;

    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");

      return;
    }

    if (!email) {
      setError("Email is required for OTP verification.");

      return;
    }

    setLoading(true);

    setError("");

    try {
      const response = await verifySignupOTPApi({
        emailOTP: code,
        email,
      });

      console.log("OTP verification successful:", response);

      if (onVerified) {
        onVerified(response);
      }

      if (signupVerification) {
        navigate("/login", {
          replace: true,
        });
      } else {
        navigate("/signup", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("OTP verification failed:", error);

      const message =
        error.response?.data?.message || "Invalid OTP. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = () => {
    setTimer(30);

    setOtp(new Array(OTP_LENGTH).fill(""));

    setError("");

    inputRefs.current[0]?.focus();
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="otp-page">
      <div className="bg-circle circle-one"></div>

      <div className="bg-circle circle-two"></div>

      <div className="bg-circle circle-three"></div>

      <motion.div
        className="otp-card"
        initial={{
          opacity: 0,
          y: 60,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
      >
        <motion.div
          className="otp-left"
          initial={{
            x: -60,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          transition={{
            delay: 0.2,
          }}
        >
          <h1>OTP Verification</h1>

          <p>
            Enter the 6-digit verification code sent to your registered email
            address.
          </p>

          <div className="otp-icon">
            <span>🔐</span>
          </div>
        </motion.div>

        <motion.div
          className="otp-right"
          initial={{
            x: 60,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          transition={{
            delay: 0.35,
          }}
        >
          <h2>Verify Code</h2>

          <form onSubmit={handleSubmit}>
            <div className="otp-container">
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  whileFocus={{
                    scale: 1.08,
                  }}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="timer-section">
              {timer > 0 ? (
                <span>
                  Resend OTP in <strong>{timer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={resendOTP}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <motion.button
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.98,
              }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loader"></span>
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </motion.button>
          </form>

          <div className="bottom-links">
            <button type="button" className="back-btn" onClick={handleBack}>
              ← Back
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;
