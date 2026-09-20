import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import ProfileInput from "./ProfileInput";

import { changeEmailApi, updateProfileApi } from "../profileApi.js";

import { setUser } from "../../auth/AuthSlice";

const EditProfileForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // =====================================================
  // REDUX
  // =====================================================

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // =====================================================
  // FORM STATE
  // =====================================================

  const [userData, setUserData] = useState({
    avatar: "",
    name: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  // =====================================================
  // EMAIL OTP STATE
  // =====================================================

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  // =====================================================
  // API BASE URL
  // =====================================================

  const API_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");

  // =====================================================
  // AVATAR URL
  // =====================================================

  const getAvatarUrl = (avatar) => {
    if (!avatar) {
      return "";
    }

    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }

    return `${API_URL}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
  };

  // =====================================================
  // LOAD USER FROM REDUX
  // =====================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    setUserData({
      avatar: user.avatar || "",
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  // =====================================================
  // VALIDATION
  // =====================================================

  const validate = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim()) {
          return "Name is required";
        }

        if (value.trim().length < 3) {
          return "Minimum 3 characters";
        }

        return "";

      case "email":
        if (!value.trim()) {
          return "Email is required";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Invalid email address";
        }

        return "";

      default:
        return "";
    }
  };

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validate(name, value),
    }));

    setSuccessMessage("");
    setServerError("");

    /*
      Agar user email dobara change karta hai,
      toh previous OTP state reset karo.
    */

    if (name === "email") {
      setEmailOtpSent(false);
      setPendingEmail("");
    }
  };

  // =====================================================
  // SAVE CHANGES
  // =====================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setServerError("Please login again.");
      return;
    }

    // ===================================================
    // VALIDATION
    // ===================================================

    const newErrors = {};

    ["name", "email"].forEach((field) => {
      const error = validate(field, userData[field]);

      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // ===================================================
    // CHECK WHAT CHANGED
    // ===================================================

    const nameChanged = userData.name.trim() !== (user?.name || "").trim();

    const emailChanged =
      userData.email.trim().toLowerCase() !==
      (user?.email || "").trim().toLowerCase();

    /*
      Phone intentionally ignored.
      Phone cannot be changed.
    */

    if (!nameChanged && !emailChanged) {
      setSuccessMessage("No changes to update.");
      return;
    }

    try {
      setLoading(true);
      setServerError("");
      setSuccessMessage("");

      let updatedUser = {
        ...user,
      };

      // =================================================
      // 1. UPDATE NAME
      // =================================================

      if (nameChanged) {
        const response = await updateProfileApi({
          name: userData.name.trim(),
        });

  
        /*
          Backend response:

          {
            success: true,
            statusCode: 200,
            message: {
              name: "...",
              email: "...",
              avatar: "...",
              phone: "..."
            },
            data: "Profile updated successfully"
          }

          User data is inside response.message
        */

        const profileUser = response?.message || null;

        if (profileUser) {
          updatedUser = {
            ...updatedUser,
            ...profileUser,
          };
        } else {
          updatedUser = {
            ...updatedUser,
            name: userData.name.trim(),
          };
        }

        // =================================================
        // UPDATE REDUX
        // =================================================

        dispatch(setUser(updatedUser));

        // =================================================
        // UPDATE LOCAL FORM
        // =================================================

        setUserData((prev) => ({
          ...prev,
          name: updatedUser.name || userData.name.trim(),
          avatar: updatedUser.avatar || prev.avatar,
          email: updatedUser.email || prev.email,
          phone: updatedUser.phone || prev.phone,
        }));
      }

      // =================================================
      // 2. EMAIL CHANGE
      // =================================================

      if (emailChanged) {
        const newEmail = userData.email.trim().toLowerCase();

        const response = await changeEmailApi(newEmail);

  
        /*
          Email Redux mein abhi update nahi hoga.

          Pehle OTP send hoga.
          OTP verification ke baad email update hoga.
        */

        setPendingEmail(newEmail);

        setEmailOtpSent(true);

        setSuccessMessage(
          response?.message || "OTP sent to your new email address.",
        );

        return;
      }

      // =================================================
      // NAME ONLY
      // =================================================

      if (nameChanged && !emailChanged) {
        setSuccessMessage("Profile updated successfully.");
      }
    } catch (error) {
      console.error("Profile update failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update profile.";

      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VERIFY EMAIL
  // =====================================================

  const handleVerifyEmail = () => {
    if (!pendingEmail) {
      return;
    }

    navigate("/verify-email", {
      state: {
        email: pendingEmail,
      },
    });
  };

  // =====================================================
  // NO USER
  // =====================================================

  if (!user) {
    return (
      <div className="edit-profile-card">
        <h2>Profile</h2>

        <p>Please login to view your profile.</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <form className="edit-profile-card" onSubmit={handleSave}>
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="profile-header">
        <h2>Edit Profile</h2>

        <p>Update your personal information.</p>
      </div>

      {/* =================================================
          AVATAR
      ================================================= */}

      <div className="avatar-wrapper">
        {userData.avatar && (
          <img
            src={getAvatarUrl(userData.avatar)}
            alt={userData.name || "Profile"}
          />
        )}

        <span>Avatar cannot be changed</span>
      </div>

      {/* =================================================
          NAME
      ================================================= */}

      <div className="form-group">
        <label>Full Name</label>

        <input
          type="text"
          name="name"
          value={userData.name}
          onChange={handleChange}
          placeholder="Enter your name"
        />

        {errors.name && <small className="error-text">{errors.name}</small>}
      </div>

      {/* =================================================
          EMAIL
      ================================================= */}

      <ProfileInput
        label="Email Address"
        type="email"
        name="email"
        value={userData.email}
        placeholder="Enter email"
        onChange={handleChange}
      />

      {errors.email && <small className="error-text">{errors.email}</small>}

      {/* =================================================
          PHONE
      ================================================= */}

      <ProfileInput
        label="Mobile Number"
        type="tel"
        name="phone"
        value={userData.phone}
        placeholder="Mobile number"
        readOnly
      />
      <small className="form-info">Mobile number cannot be changed.</small>

      {/* =================================================
          SERVER ERROR
      ================================================= */}

      {serverError && <p className="error-text">{serverError}</p>}

      {/* =================================================
          SUCCESS
      ================================================= */}

      {successMessage && <p className="success-text">{successMessage}</p>}

      {/* =================================================
          ACTION BUTTON
      ================================================= */}

      {emailOtpSent ? (
        <button
          type="button"
          className="save-btn"
          disabled={loading}
          onClick={handleVerifyEmail}
        >
          Verify OTP
        </button>
      ) : (
        <button type="submit" className="save-btn" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      )}
    </form>
  );
};

export default EditProfileForm;
