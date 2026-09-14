import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/* =====================================================
   REQUEST INTERCEPTOR
===================================================== */

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* =====================================================
   RESPONSE INTERCEPTOR
===================================================== */

API.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401
    ) {
      localStorage.removeItem(
        "accessToken"
      );
    }

    return Promise.reject(error);
  }
);

/* =====================================================
   GET PROFILE
===================================================== */

export const profileApi =
  async () => {
    const response =
      await API.get(
        "/user/profile"
      );

    return response.data;
  };

/* =====================================================
   UPDATE PROFILE
===================================================== */

export const updateProfileApi =
  async (profileData) => {
    const response =
      await API.put(
        "/user/profile",
        profileData
      );

    return response.data;
  };

/* =====================================================
   CHANGE EMAIL
   NO PASSWORD
===================================================== */

export const changeEmailApi =
  async (newEmail) => {
    const response =
      await API.put(
        "/user/change-email",
        {
          newEmail,
        }
      );

    return response.data;
  };

/* =====================================================
   VERIFY EMAIL
===================================================== */

export const verifyEmailApi =
  async (otp) => {
    const response =
      await API.put(
        "/user/verify-email",
        {
          otp,
        }
      );

    return response.data;
  };

/* =====================================================
   CHANGE PHONE
   OTP WILL GO TO CURRENT EMAIL
===================================================== */

export const changePhoneApi =
  async (newPhone) => {
    const response =
      await API.put(
        "/user/change-phone",
        {
          newPhone,
        }
      );

    return response.data;
  };

/* =====================================================
   VERIFY PHONE
===================================================== */

export const verifyPhoneApi =
  async (otp) => {
    const response =
      await API.put(
        "/user/verify-phone",
        {
          otp,
        }
      );

    return response.data;
  };

/* =====================================================
   CHANGE PASSWORD
   OTP WILL GO TO CURRENT EMAIL
===================================================== */

export const changePasswordApi =
  async (newPassword) => {
    const response =
      await API.put(
        "/user/change-password",
        {
          newPassword,
        }
      );

    return response.data;
  };

/* =====================================================
   VERIFY PASSWORD
===================================================== */

export const verifyPasswordApi =
  async (otp) => {
    const response =
      await API.put(
        "/user/verify-password",
        {
          otp,
        }
      );

    return response.data;
  };

/* =====================================================
   DELETE ACCOUNT
===================================================== */

export const deleteAccountApi =
  async (data) => {
    const response =
      await API.delete(
        "/user/delete-account",
        {
          data,
        }
      );

    return response.data;
  };

export default API;