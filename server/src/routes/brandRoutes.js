const express = require("express");

const router = express.Router();

const {
  createBrand,
  getAllBrands,
  getActiveBrands,
  getBrandById,
  getBrandBySlug,
  updateBrand,
  toggleBrandStatus,
  deleteBrand,
} = require("../controllers/brandController");

const authMiddleware = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const { brandLimiter } = require("../middleware/rateLimitterMiddleware");

const { uploadBrandLogo } = require("../middleware/brandUploadMiddleware");

const {
  validateCreateBrand,
  validateUpdateBrand,
  validateBrandId,
} = require("../validator/brandValidator");

// =====================================================
// RATE LIMIT
// =====================================================

router.use(brandLimiter);

// =====================================================
// PUBLIC
// =====================================================

router.get("/active", getActiveBrands);

router.get("/slug/:slug", getBrandBySlug);

// =====================================================
// PROTECTED
// =====================================================

router.get("/", authMiddleware, getAllBrands);

router.get("/:brandId", authMiddleware, validateBrandId, getBrandById);

// =====================================================
// ADMIN - CREATE
// =====================================================

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  uploadBrandLogo.single("logo"),
  validateCreateBrand,
  createBrand,
);

// =====================================================
// ADMIN - UPDATE
// =====================================================

router.put(
  "/:brandId",
  authMiddleware,
  authorizeRoles("admin"),
  validateBrandId,
  uploadBrandLogo.single("logo"),
  validateUpdateBrand,
  updateBrand,
);

// =====================================================
// ADMIN - TOGGLE STATUS
// =====================================================

router.patch(
  "/:brandId/toggle-status",
  authMiddleware,
  authorizeRoles("admin"),
  validateBrandId,
  toggleBrandStatus,
);

// =====================================================
// ADMIN - DELETE
// =====================================================

router.delete(
  "/:brandId",
  authMiddleware,
  authorizeRoles("admin"),
  validateBrandId,
  deleteBrand,
);

module.exports = router;
