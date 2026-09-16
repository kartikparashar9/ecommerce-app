const mongoose = require("mongoose");
const Category = require("../models/categoryModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// GENERATE SLUG
// -----------------------------------------------------

const generateSlug = (name) => {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// -----------------------------------------------------
// ESCAPE REGEX
// -----------------------------------------------------

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// -----------------------------------------------------
// CREATE UNIQUE SLUG
// -----------------------------------------------------

const createUniqueSlug = async (name, excludeId = null) => {
  const baseSlug = generateSlug(name);

  let slug = baseSlug;
  let counter = 1;

  const query = {
    slug,
  };

  if (excludeId) {
    query._id = {
      $ne: excludeId,
    };
  }

  while (await Category.exists(query)) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    query.slug = slug;
  }

  return slug;
};

// =====================================================
// CREATE CATEGORY
// =====================================================

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parentCategory } = req.body;

  // -------------------------------------------------
  // NORMALIZE DATA
  // -------------------------------------------------

  const normalizedName = name.trim();
  const normalizedParent = parentCategory || null;

  // -------------------------------------------------
  // CHECK DUPLICATE CATEGORY
  // -------------------------------------------------

  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${escapeRegex(normalizedName)}$`,
      $options: "i",
    },
    parentCategory: normalizedParent,
  });

  if (existingCategory) {
    throw new ApiError(409, "Category with this name already exists");
  }

  // -------------------------------------------------
  // VALIDATE PARENT CATEGORY
  // -------------------------------------------------

  if (normalizedParent) {
    if (!mongoose.Types.ObjectId.isValid(normalizedParent)) {
      throw new ApiError(400, "Invalid parent category ID");
    }

    const parent = await Category.findById(normalizedParent);

    if (!parent) {
      throw new ApiError(404, "Parent category not found");
    }

    if (!parent.isActive) {
      throw new ApiError(
        400,
        "Cannot create category under an inactive parent category",
      );
    }
  }

  // -------------------------------------------------
  // CREATE UNIQUE SLUG
  // -------------------------------------------------

  const slug = await createUniqueSlug(normalizedName);

  // -------------------------------------------------
  // CREATE CATEGORY
  // -------------------------------------------------

  const category = await Category.create({
    name: normalizedName,
    slug,
    description: description?.trim() || "",
    image: image?.trim() || "",
    parentCategory: normalizedParent,
    createdBy: req.user._id,
  });

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  return res
    .status(201)
    .json(new ApiResponse(201, "Category created successfully", category));
});

// =====================================================
// GET ALL CATEGORIES
// =====================================================

const getCategories = asyncHandler(async (req, res) => {
  const {
    search = "",
    parentCategory,
    status = "active",
    page = 1,
    limit = 20,
  } = req.query;

  // -------------------------------------------------
  // PUBLIC / ADMIN
  // -------------------------------------------------

  // GET /categories is public.
  // Admin requests reach this controller with req.user.
  const isAdmin = req.user?.role === "admin";

  // -------------------------------------------------
  // NORMALIZE PAGINATION
  // -------------------------------------------------

  const currentPage = Math.max(Number(page) || 1, 1);

  const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const normalizedSearch = search.trim();

  // -------------------------------------------------
  // VALIDATE STATUS
  // -------------------------------------------------

  if (!["all", "active", "inactive"].includes(status)) {
    throw new ApiError(400, "Invalid category status");
  }

  // -------------------------------------------------
  // DATABASE FILTER
  // -------------------------------------------------

  const filter = {};

  // -------------------------------------------------
  // PUBLIC USER
  // -------------------------------------------------

  // Public users can only see active categories.
  // They cannot request inactive/all categories.
  if (!isAdmin) {
    filter.isActive = true;
  }

  // -------------------------------------------------
  // ADMIN STATUS FILTER
  // -------------------------------------------------

  if (isAdmin) {
    if (status === "active") {
      filter.isActive = true;
    }

    if (status === "inactive") {
      filter.isActive = false;
    }

    // status === "all"
    // No isActive filter is applied.
  }

  // -------------------------------------------------
  // SEARCH
  // -------------------------------------------------

  if (normalizedSearch) {
    filter.$text = {
      $search: normalizedSearch,
    };
  }

  // -------------------------------------------------
  // PARENT CATEGORY
  // -------------------------------------------------

  if (parentCategory === "root") {
    filter.parentCategory = null;
  } else if (parentCategory) {
    if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
      throw new ApiError(400, "Invalid parent category ID");
    }

    filter.parentCategory = parentCategory;
  }

  // -------------------------------------------------
  // PAGINATION
  // -------------------------------------------------

  const skip = (currentPage - 1) * perPage;

  // -------------------------------------------------
  // DATABASE QUERY
  // -------------------------------------------------

  let categoryQuery = Category.find(filter);

  // -------------------------------------------------
  // PUBLIC RESPONSE FIELDS
  // -------------------------------------------------

  if (!isAdmin) {
    categoryQuery = categoryQuery
      .select("name slug description image parentCategory")
      .populate("parentCategory", "name slug");
  }

  // -------------------------------------------------
  // ADMIN RESPONSE FIELDS
  // -------------------------------------------------

  if (isAdmin) {
    categoryQuery = categoryQuery
      .populate("parentCategory", "name slug")
      .populate("createdBy", "name email");
  }

  const [categories, totalCategories] = await Promise.all([
    categoryQuery
      .sort({
        name: 1,
      })
      .skip(skip)
      .limit(perPage)
      .lean(),

    Category.countDocuments(filter),
  ]);

  // -------------------------------------------------
  // PAGINATION DATA
  // -------------------------------------------------

  const totalPages = Math.ceil(totalCategories / perPage);

  const responseData = {
    categories,

    pagination: {
      currentPage,
      limit: perPage,
      totalCategories,
      totalPages,

      hasNextPage: currentPage < totalPages,

      hasPreviousPage: currentPage > 1,
    },
  };

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Categories fetched successfully", responseData),
    );
});

// =====================================================
// GET CATEGORY BY ID
// =====================================================

const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // -------------------------------------------------
  // VALIDATE ID
  // -------------------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // -------------------------------------------------
  // PUBLIC / ADMIN
  // -------------------------------------------------

  const isAdmin = req.user?.role === "admin";

  // -------------------------------------------------
  // DATABASE QUERY
  // -------------------------------------------------

  let categoryQuery;

  // -------------------------------------------------
  // PUBLIC USER
  // -------------------------------------------------

  if (!isAdmin) {
    categoryQuery = Category.findOne({
      _id: id,
      isActive: true,
    })
      .select("name slug description image parentCategory")
      .populate("parentCategory", "name slug");
  }

  // -------------------------------------------------
  // ADMIN
  // -------------------------------------------------

  if (isAdmin) {
    categoryQuery = Category.findById(id)
      .populate("parentCategory", "name slug")
      .populate("createdBy", "name email");
  }

  const category = await categoryQuery.lean();

  // -------------------------------------------------
  // CATEGORY NOT FOUND
  // -------------------------------------------------

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  return res
    .status(200)
    .json(new ApiResponse(200, "Category fetched successfully", category));
});

// =====================================================
// UPDATE CATEGORY
// =====================================================

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { name, description, image, parentCategory, isActive } = req.body;

  // -------------------------------------------------
  // VALIDATE ID
  // -------------------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // -------------------------------------------------
  // FIND CATEGORY
  // -------------------------------------------------

  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // -------------------------------------------------
  // DETERMINE TARGET PARENT
  // -------------------------------------------------

  let targetParent = category.parentCategory;

  if (parentCategory !== undefined) {
    if (parentCategory === null || parentCategory === "") {
      targetParent = null;
    } else {
      // ---------------------------------------------
      // VALIDATE PARENT ID
      // ---------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
        throw new ApiError(400, "Invalid parent category ID");
      }

      // ---------------------------------------------
      // PREVENT SELF PARENT
      // ---------------------------------------------

      if (parentCategory.toString() === id.toString()) {
        throw new ApiError(400, "A category cannot be its own parent");
      }

      // ---------------------------------------------
      // FIND PARENT
      // ---------------------------------------------

      const parent = await Category.findById(parentCategory);

      if (!parent) {
        throw new ApiError(404, "Parent category not found");
      }

      // ---------------------------------------------
      // PARENT MUST BE ACTIVE
      // ---------------------------------------------

      if (!parent.isActive) {
        throw new ApiError(400, "Cannot assign an inactive parent category");
      }

      targetParent = parentCategory;
    }
  }

  // -------------------------------------------------
  // DETERMINE TARGET NAME
  // -------------------------------------------------

  const targetName = name !== undefined ? name.trim() : category.name;

  // -------------------------------------------------
  // CHECK DUPLICATE
  // -------------------------------------------------

  const duplicateCategory = await Category.findOne({
    _id: {
      $ne: id,
    },

    name: {
      $regex: `^${escapeRegex(targetName)}$`,
      $options: "i",
    },

    parentCategory: targetParent,
  });

  if (duplicateCategory) {
    throw new ApiError(409, "Category with this name already exists");
  }

  // -------------------------------------------------
  // UPDATE NAME
  // -------------------------------------------------

  if (name !== undefined) {
    category.name = targetName;

    category.slug = await createUniqueSlug(targetName, id);
  }

  // -------------------------------------------------
  // UPDATE DESCRIPTION
  // -------------------------------------------------

  if (description !== undefined) {
    category.description = description.trim();
  }

  // -------------------------------------------------
  // UPDATE IMAGE
  // -------------------------------------------------

  if (image !== undefined) {
    category.image = image.trim();
  }

  // -------------------------------------------------
  // UPDATE PARENT CATEGORY
  // -------------------------------------------------

  if (parentCategory !== undefined) {
    category.parentCategory = targetParent;
  }

  // -------------------------------------------------
  // UPDATE ACTIVE STATUS
  // -------------------------------------------------

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "isActive must be a boolean");
    }

    category.isActive = isActive;
  }

  // -------------------------------------------------
  // SAVE
  // -------------------------------------------------

  await category.save();

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  return res
    .status(200)
    .json(new ApiResponse(200, "Category updated successfully", category));
});

// =====================================================
// DELETE CATEGORY
// =====================================================

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // -------------------------------------------------
  // VALIDATE ID
  // -------------------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // -------------------------------------------------
  // FIND CATEGORY
  // -------------------------------------------------

  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // -------------------------------------------------
  // CHECK CHILD CATEGORIES
  // -------------------------------------------------

  const childCategoryExists = await Category.exists({
    parentCategory: id,
  });

  if (childCategoryExists) {
    throw new ApiError(400, "Cannot delete category with child categories");
  }

  // -------------------------------------------------
  // DELETE CATEGORY
  // -------------------------------------------------

  await Category.findByIdAndDelete(id);

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  return res
    .status(200)
    .json(new ApiResponse(200, "Category deleted successfully", null));
});

// =====================================================
// TOGGLE CATEGORY STATUS
// =====================================================

const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // -------------------------------------------------
  // VALIDATE ID
  // -------------------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // -------------------------------------------------
  // FIND CATEGORY
  // -------------------------------------------------

  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // -------------------------------------------------
  // TOGGLE STATUS
  // -------------------------------------------------

  category.isActive = !category.isActive;

  await category.save();

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Category ${
          category.isActive ? "activated" : "deactivated"
        } successfully`,
        category,
      ),
    );
});

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
};
