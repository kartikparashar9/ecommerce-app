// =====================================================
// NAME VALIDATION
// =====================================================

export const validateName = (name) => {
  if (!name || typeof name !== "string") {
    return false;
  }

  const trimmedName = name.trim();

  // Only letters and spaces
  // Minimum 3 and maximum 40 characters
  const nameRegex = /^[A-Za-z\s]{3,40}$/;

  return nameRegex.test(trimmedName);
};


// =====================================================
// EMAIL VALIDATION
// =====================================================

export const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmedEmail = email.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(trimmedEmail);
};


// =====================================================
// ROLE VALIDATION
// =====================================================

export const validateRole = (role) => {
  if (!role || typeof role !== "string") {
    return false;
  }

  return ["user", "seller"].includes(role.toLowerCase());
};


// =====================================================
// PASSWORD VALIDATION
// =====================================================

export const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return false;
  }

  /*
    Password must contain:

    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character
  */

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  return passwordRegex.test(password);
};


// =====================================================
// CONFIRM PASSWORD VALIDATION
// =====================================================

export const validateConfirmPassword = (
  password,
  confirmPassword
) => {
  if (
    !password ||
    !confirmPassword ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return false;
  }

  return password === confirmPassword;
};


// =====================================================
// MOBILE VALIDATION
// =====================================================

export const validateMobile = (mobile) => {
  if (!mobile || typeof mobile !== "string") {
    return false;
  }

  const trimmedMobile = mobile.trim();

  // Indian mobile number
  // Starts with 6, 7, 8, or 9
  // Total 10 digits

  const mobileRegex = /^[6-9]\d{9}$/;

  return mobileRegex.test(trimmedMobile);
};


// =====================================================
// GENDER VALIDATION
// =====================================================

export const validateGender = (gender) => {
  if (!gender || typeof gender !== "string") {
    return false;
  }

  return ["male", "female"].includes(
    gender.toLowerCase()
  );
};


// =====================================================
// AVATAR VALIDATION
// =====================================================

export const validateAvatar = (avatar) => {
  if (!avatar || typeof avatar !== "string") {
    return false;
  }

  return avatar.trim().length > 0;
};