import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Signup.css";
import { useNavigate } from "react-router-dom";

import ProgressBar from "./FormComponent/ProgressBar";
import FormStepOne from "./FormComponent/FormStepOne";
import FormStepTwo from "./FormComponent/FormStepTwo";
import FormStepThree from "./FormComponent/FormStepThree";
import OTPVerification from "../../component/OTPVerification";

import {
  validateName,
  validateEmail,
  validateRole,
  validatePassword,
  validateConfirmPassword,
  validateMobile,
  validateGender,
  validateAvatar,
} from "./validation";

import { signupApi } from "../../AuthApi";

const Signup = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [otpVerification, setOtpVerification] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const [formData, setFormData] = useState({
    avatar: "",
    fullName: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =====================================================
  // HANDLE AVATAR
  // =====================================================

  const handleAvatar = (avatar) => {
    setFormData((prev) => ({
      ...prev,
      avatar,
    }));

    setErrors((prev) => ({
      ...prev,
      avatar: "",
    }));
  };

  // =====================================================
  // STEP 1 VALIDATION
  // =====================================================

  const validateStepOne = () => {
    const newErrors = {};

    if (!validateAvatar(formData.avatar)) {
      newErrors.avatar = "Please choose an avatar.";
    }

    if (!validateName(formData.fullName)) {
      newErrors.fullName = "Name should contain 3-40 letters only.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // STEP 2 VALIDATION
  // =====================================================

  const validateStepTwo = () => {
    const newErrors = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email address.";
    }

    if (!validateRole(formData.role)) {
      newErrors.role = "Please select User or Seller account.";
    }

    if (!validatePassword(formData.password)) {
      newErrors.password =
        "Password must contain at least 8 characters, including uppercase, lowercase, number and special character.";
    }

    if (!validateConfirmPassword(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // STEP 3 VALIDATION
  // =====================================================

  const validateStepThree = () => {
    const newErrors = {};

    if (!validateMobile(formData.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (!validateGender(formData.gender)) {
      newErrors.gender = "Please select a valid gender.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // NEXT STEP
  // =====================================================

  const nextStep = () => {
    if (step === 1 && !validateStepOne()) {
      return;
    }

    if (step === 2 && !validateStepTwo()) {
      return;
    }

    setErrors({});
    setStep((prev) => prev + 1);
  };

  // =====================================================
  // PREVIOUS STEP
  // =====================================================

  const prevStep = () => {
    setErrors({});
    setStep((prev) => prev - 1);
  };

  // =====================================================
  // SIGNUP SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStepThree()) {
      return;
    }

    const signupData = {
      name: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.mobile.trim(),
      password: formData.password,
      gender: formData.gender,
      avatar: formData.avatar,
      role: formData.role,
    };

    setSignupLoading(true);
    setErrors({});

    try {
      const response = await signupApi(signupData);
      console.log("Signup successful:", response);
      setOtpVerification(true);
    } catch (error) {
      console.error("Signup failed:", error);
      const message =
        error.response?.data?.message || "Signup failed. Please try again.";
      alert(message);
    } finally {
      setSignupLoading(false);
    }
  };

  // =====================================================
  // OTP VERIFIED -> REDIRECT TO LOGIN
  // =====================================================

  const handleOTPVerified = (response) => {
    console.log("Account created successfully:", response);
    navigate("/login");
  };

  // =====================================================
  // OTP SCREEN
  // =====================================================

  if (otpVerification) {
    return (
      <OTPVerification
        email={formData.email}
        signupVerification={true}
        onVerified={handleOTPVerified}
      />
    );
  }

  // =====================================================
  // SIGNUP PAGE
  // =====================================================

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* LEFT PANEL */}
        <motion.div
          className="signup-left"
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1>Join JustBuy</h1>
          <p>
            Create your account to enjoy a personalized shopping experience,
            save your wishlist, and track your orders.
          </p>
          <img
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b"
            alt="shopping"
          />
        </motion.div>

        {/* RIGHT PANEL */}
        <motion.div
          className="signup-right"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2>Create Account</h2>

          <ProgressBar step={step} />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 120 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -120 }}
                transition={{ duration: 0.45 }}
              >
                <FormStepOne
                  formData={formData}
                  handleChange={handleChange}
                  handleAvatar={handleAvatar}
                  errors={errors}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 120 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -120 }}
                transition={{ duration: 0.45 }}
              >
                <FormStepTwo
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 120 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: -120 }}
                transition={{ duration: 0.45 }}
              >
                <FormStepThree
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* BUTTONS */}
          <div className="button-group">
            {step > 1 && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className="back-btn"
                onClick={prevStep}
                disabled={signupLoading}
              >
                Back
              </motion.button>
            )}

            {step < 3 && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className="next-btn"
                onClick={nextStep}
                disabled={signupLoading}
              >
                Next
              </motion.button>
            )}

            {step === 3 && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className="signup-btn"
                onClick={handleSubmit}
                disabled={signupLoading}
              >
                {signupLoading ? "Creating Account..." : "Create Account"}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;