// =====================================================
// OBJECT ID
// =====================================================

export const isObjectId = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value.trim());

// =====================================================
// POSITIVE INTEGER (FIXED TYPE COERCION BUG)
// =====================================================

export const isPositiveInteger = (value) => {
  if (typeof value !== "number" && typeof value !== "string") {
    return false;
  }
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

// =====================================================
// EMAIL
// =====================================================

export const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// =====================================================
// REQUIRED OBJECT ID
// =====================================================

export const requireId = (value, label = "ID") => {
  const str = String(value ?? "").trim();
  if (!isObjectId(str)) {
    throw new Error(`Valid ${label} is required`);
  }
  return str;
};

// =====================================================
// COMMON VALIDATION HELPERS
// =====================================================

export const isNonEmptyString = (value, maxLength = Infinity) => {
  if (typeof value !== "string") {
    return false;
  }
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 && trimmedValue.length <= maxLength;
};

// =====================================================
// INDIAN PHONE VALIDATION (HANDLES NUMBERS & STRINGS)
// =====================================================

export const isValidIndianPhone = (value) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }
  return /^[6-9]\d{9}$/.test(String(value).trim());
};

// =====================================================
// INDIAN PINCODE VALIDATION (HANDLES NUMBERS & STRINGS)
// =====================================================

export const isValidPincode = (value) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }
  return /^[1-9][0-9]{5}$/.test(String(value).trim());
};

// =====================================================
// ADDRESS PAYLOAD VALIDATION
// =====================================================

export const validateAddressPayload = (payload = {}) => {
  // Payload check
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid address payload");
  }

  // Type
  const type = String(payload.type || "home")
    .trim()
    .toLowerCase();

  if (!["home", "work", "other"].includes(type)) {
    throw new Error("Address type must be home, work, or other");
  }

  // Name
  const name = String(payload.name ?? "").trim();

  if (!name) {
    throw new Error("Name is required");
  }

  if (name.length > 100) {
    throw new Error("Name cannot exceed 100 characters");
  }

  // Phone
  const phone = String(payload.phone ?? "").trim();

  if (!isValidIndianPhone(phone)) {
    throw new Error("Enter a valid 10-digit Indian mobile number");
  }

  // Address Line 1
  const addressLine1 = String(payload.addressLine1 ?? "").trim();

  if (!addressLine1) {
    throw new Error("Address line 1 is required");
  }

  if (addressLine1.length > 200) {
    throw new Error("Address line 1 cannot exceed 200 characters");
  }

  // Address Line 2
  const addressLine2 = String(payload.addressLine2 ?? "").trim();

  if (addressLine2.length > 200) {
    throw new Error("Address line 2 cannot exceed 200 characters");
  }

  // Landmark
  const landmark = String(payload.landmark ?? "").trim();

  if (landmark.length > 150) {
    throw new Error("Landmark cannot exceed 150 characters");
  }

  // City
  const city = String(payload.city ?? "").trim();

  if (!city) {
    throw new Error("City is required");
  }

  if (city.length > 100) {
    throw new Error("City cannot exceed 100 characters");
  }

  // State
  const state = String(payload.state ?? "").trim();

  if (!state) {
    throw new Error("State is required");
  }

  if (state.length > 100) {
    throw new Error("State cannot exceed 100 characters");
  }

  // Country
  const rawCountry = String(payload.country ?? "").trim();
  const country = rawCountry ? rawCountry : "India";

  if (country.length > 100) {
    throw new Error("Country cannot exceed 100 characters");
  }

  // Postal Code
  const postalCode = String(payload.postalCode ?? "").trim();

  if (!isValidPincode(postalCode)) {
    throw new Error("Enter a valid 6-digit postal code");
  }

  // Default
  if (
    payload.isDefault !== undefined &&
    payload.isDefault !== null &&
    typeof payload.isDefault !== "boolean"
  ) {
    throw new Error("isDefault must be true or false");
  }

  // Final Clean Payload
  return {
    type,
    name,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    country,
    postalCode,
    isDefault: Boolean(payload.isDefault),
  };
};
