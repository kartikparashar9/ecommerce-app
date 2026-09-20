import API from "../../api/Api";

/* =====================================================
   SIGNUP
===================================================== */

export const signupApi = async (userData) => {
  const response = await API.post("/auth/signup", userData);

  return response.data;
};

/* =====================================================
   VERIFY SIGNUP OTP
===================================================== */

export const verifySignupOTPApi = async (otpData) => {
  const response = await API.post("/auth/verify-otp", otpData);

  return response.data;
};

/* =====================================================
   LOGIN
===================================================== */

export const loginApi = async (loginData) => {
  const response = await API.post("/auth/login", loginData);

  return response.data;
};

/* =====================================================
   FORGOT PASSWORD
===================================================== */

export const forgotPasswordApi = async (data) => {
  const response = await API.post("/auth/forgot-password", data);

  return response.data;
};

/* =====================================================
   RESET PASSWORD
===================================================== */

export const resetPasswordApi = async (data) => {
  const response = await API.post("/auth/reset-password", data);

  return response.data;
};

/* =====================================================
   UPDATE PROFILE
===================================================== */

export const updateProfileApi = async (userData) => {
  const response = await API.put("/user/profile", userData);

  return response.data;
};

/* =====================================================
   GOOGLE LOGIN
===================================================== */

export const googleLoginApi = async (googleData) => {
  const response = await API.post("/auth/google-login", googleData);

  return response.data;
};

/* =====================================================
   LOGOUT
===================================================== */

export const logoutApi = async () => {
  const response = await API.post("/auth/logout");

  return response.data;
};

export default API;
