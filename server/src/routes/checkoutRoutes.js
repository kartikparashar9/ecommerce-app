const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLER
// =====================================================

const {
  getCheckoutSummary,
  validateCheckoutData,
} = require("../controllers/checkoutController");

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// VALIDATOR
// =====================================================

const { validateCheckout } = require("../validator/checkoutValidator");

// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authMiddleware);

// =====================================================
// CHECKOUT SUMMARY
// =====================================================

// POST /api/checkout/summary

router.post("/summary", validateCheckout, getCheckoutSummary);

// =====================================================
// CHECKOUT VALIDATION
// =====================================================

// POST /api/checkout/validate

router.post("/validate", validateCheckout, validateCheckoutData);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
