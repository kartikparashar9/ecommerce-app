const express = require("express");

const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  getSubcategories,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const { categoryLimiter } = require("../middleware/rateLimitterMiddleware");

const {
  validateCategoryCreate,
  validateCategoryUpdate,
} = require("../validator/categoryValidator");

// =====================================================
// PUBLIC ROUTES
// =====================================================

router.get("/", getCategories);

router.get("/:id/subcategories", getSubcategories);

router.get("/:id", getCategoryById);

// =====================================================
// ADMIN ROUTES
// =====================================================

router.use(authMiddleware, categoryLimiter, authorizeRoles("admin"));

router.post("/", validateCategoryCreate, createCategory);

router.put("/:id", validateCategoryUpdate, updateCategory);

router.patch("/:id/toggle-status", toggleCategoryStatus);

router.delete("/:id", deleteCategory);

module.exports = router;
