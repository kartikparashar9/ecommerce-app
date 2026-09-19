const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

// =====================================================
// CHECKOUT VALIDATOR
// =====================================================

const validateCheckout = (req, res, next) => {
  const { addressId, paymentMethod = "cod" } = req.body;

  // -------------------------------------------------
  // ADDRESS
  // -------------------------------------------------

  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    return next(new ApiError(400, "Valid addressId is required"));
  }

  // -------------------------------------------------
  // PAYMENT METHOD
  // -------------------------------------------------

  if (typeof paymentMethod !== "string") {
    return next(new ApiError(400, "Payment method is required"));
  }

  const normalizedPaymentMethod = paymentMethod.trim().toLowerCase();

  if (!["cod", "online"].includes(normalizedPaymentMethod)) {
    return next(
      new ApiError(400, "Payment method must be either cod or online"),
    );
  }

  req.body.paymentMethod = normalizedPaymentMethod;

  next();
};

module.exports = {
  validateCheckout,
};
