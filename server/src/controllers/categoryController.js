const mongoose = require("mongoose");

const Category = require("../models/categoryModel");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// =====================================================
// HELPERS
// =====================================================

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

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeCategoryName = (name) => {
  if (typeof name !== "string") {
    throw new ApiError(400, "Category name is required");
  }

  const normalized = name.trim();

  if (!normalized) {
    throw new ApiError(400, "Category name is required");
  }

  if (normalized.length < 2) {
    throw new ApiError(400, "Category name must be at least 2 characters");
  }

  if (normalized.length > 100) {
    throw new ApiError(400, "Category name cannot exceed 100 characters");
  }

  return normalized;
};

const createUniqueSlug = async (name, excludeId = null) => {
  const baseSlug = generateSlug(name);

  if (!baseSlug) {
    throw new ApiError(400, "Unable to generate valid category slug");
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = {
      slug,
    };

    if (excludeId) {
      query._id = {
        $ne: excludeId,
      };
    }

    const exists = await Category.exists(query);

    if (!exists) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// =====================================================
// CREATE CATEGORY
// =====================================================

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parentCategory } = req.body;

  const normalizedName = normalizeCategoryName(name);

  let normalizedParent = null;

  if (
    parentCategory !== undefined &&
    parentCategory !== null &&
    parentCategory !== ""
  ) {
    if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
      throw new ApiError(400, "Invalid parent category ID");
    }

    const parent = await Category.findOne({
      _id: parentCategory,
      isDeleted: {
        $ne: true,
      },
    });

    if (!parent) {
      throw new ApiError(404, "Parent category not found");
    }

    if (!parent.isActive) {
      throw new ApiError(
        400,
        "Cannot create category under an inactive parent category",
      );
    }

    normalizedParent = parent._id;
  }

  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${escapeRegex(normalizedName)}$`,
      $options: "i",
    },

    parentCategory: normalizedParent,

    isDeleted: {
      $ne: true,
    },
  });

  if (existingCategory) {
    throw new ApiError(409, "Category with this name already exists");
  }

  const slug = await createUniqueSlug(normalizedName);

  const category = await Category.create({
    name: normalizedName,

    slug,

    description: typeof description === "string" ? description.trim() : "",

    image: typeof image === "string" ? image.trim() : "",

    parentCategory: normalizedParent,

    createdBy: req.user._id,

    isActive: true,
  });

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

  const isAdmin = req.user?.role === "admin";

  const currentPage = Math.max(Number(page) || 1, 1);

  const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const normalizedSearch = typeof search === "string" ? search.trim() : "";

  if (!["all", "active", "inactive"].includes(status)) {
    throw new ApiError(400, "Invalid category status");
  }

  const filter = {
    isDeleted: {
      $ne: true,
    },
  };

  if (!isAdmin) {
    filter.isActive = true;
  } else {
    if (status === "active") {
      filter.isActive = true;
    }

    if (status === "inactive") {
      filter.isActive = false;
    }
  }

  if (normalizedSearch) {
    filter.$text = {
      $search: normalizedSearch,
    };
  }

  if (parentCategory === "root") {
    filter.parentCategory = null;
  } else if (parentCategory) {
    if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
      throw new ApiError(400, "Invalid parent category ID");
    }

    filter.parentCategory = parentCategory;
  }

  const skip = (currentPage - 1) * perPage;

  let categoryQuery = Category.find(filter);

  if (!isAdmin) {
    categoryQuery = categoryQuery
      .select("name slug description image parentCategory")
      .populate("parentCategory", "name slug");
  } else {
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

  const totalPages = Math.ceil(totalCategories / perPage);

  return res.status(200).json(
    new ApiResponse(200, "Categories fetched successfully", {
      categories,

      pagination: {
        currentPage,
        limit: perPage,
        totalCategories,
        totalPages,

        hasNextPage: currentPage < totalPages,

        hasPreviousPage: currentPage > 1,
      },
    }),
  );
});

// =====================================================
// GET CATEGORY BY ID
// =====================================================

const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const isAdmin = req.user?.role === "admin";

  let categoryQuery;

  if (!isAdmin) {
    categoryQuery = Category.findOne({
      _id: id,
      isActive: true,
      isDeleted: {
        $ne: true,
      },
    })
      .select("name slug description image parentCategory")
      .populate("parentCategory", "name slug");
  } else {
    categoryQuery = Category.findOne({
      _id: id,
      isDeleted: {
        $ne: true,
      },
    })
      .populate("parentCategory", "name slug")
      .populate("createdBy", "name email");
  }

  const category = await categoryQuery.lean();

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Category fetched successfully", category));
});

// =====================================================
// GET SUBCATEGORIES
// =====================================================

const getSubcategories = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const parentCategory = await Category.findOne({
    _id: id,
    isActive: true,
    isDeleted: {
      $ne: true,
    },
  }).select("_id name slug");

  if (!parentCategory) {
    throw new ApiError(404, "Category not found");
  }

  const subcategories = await Category.find({
    parentCategory: id,
    isActive: true,
    isDeleted: {
      $ne: true,
    },
  })
    .select("name slug description image parentCategory")
    .sort({
      name: 1,
    })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, "Subcategories fetched successfully", {
      subcategories,
    }),
  );
});

// =====================================================
// UPDATE CATEGORY
// =====================================================

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { name, description, image, parentCategory, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const category = await Category.findOne({
    _id: id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // -------------------------------------------------
  // Target Parent
  // -------------------------------------------------

  let targetParent = category.parentCategory;

  if (parentCategory !== undefined) {
    if (parentCategory === null || parentCategory === "") {
      targetParent = null;
    } else {
      if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
        throw new ApiError(400, "Invalid parent category ID");
      }

      if (parentCategory.toString() === id.toString()) {
        throw new ApiError(400, "A category cannot be its own parent");
      }

      const parent = await Category.findOne({
        _id: parentCategory,
        isDeleted: {
          $ne: true,
        },
      });

      if (!parent) {
        throw new ApiError(404, "Parent category not found");
      }

      if (!parent.isActive) {
        throw new ApiError(400, "Cannot assign an inactive parent category");
      }

      targetParent = parent._id;
    }
  }

  // -------------------------------------------------
  // Target Name
  // -------------------------------------------------

  let targetName = category.name;

  if (name !== undefined) {
    targetName = normalizeCategoryName(name);
  }

  // -------------------------------------------------
  // Duplicate
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

    isDeleted: {
      $ne: true,
    },
  });

  if (duplicateCategory) {
    throw new ApiError(409, "Category with this name already exists");
  }

  // -------------------------------------------------
  // Name + Slug
  // -------------------------------------------------

  if (name !== undefined) {
    category.name = targetName;

    category.slug = await createUniqueSlug(targetName, id);
  }

  // -------------------------------------------------
  // Description
  // -------------------------------------------------

  if (description !== undefined) {
    if (typeof description !== "string") {
      throw new ApiError(400, "Description must be a string");
    }

    category.description = description.trim();
  }

  // -------------------------------------------------
  // Image
  // -------------------------------------------------

  if (image !== undefined) {
    if (typeof image !== "string") {
      throw new ApiError(400, "Image must be a string");
    }

    category.image = image.trim();
  }

  // -------------------------------------------------
  // Parent
  // -------------------------------------------------

  if (parentCategory !== undefined) {
    category.parentCategory = targetParent;
  }

  // -------------------------------------------------
  // Status
  // -------------------------------------------------

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "isActive must be a boolean");
    }

    category.isActive = isActive;
  }

  await category.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Category updated successfully", category));
});

// =====================================================
// DELETE CATEGORY
// =====================================================

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const category = await Category.findOne({
    _id: id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const childCategoryExists = await Category.exists({
    parentCategory: id,
    isDeleted: {
      $ne: true,
    },
  });

  if (childCategoryExists) {
    throw new ApiError(400, "Cannot delete category with child categories");
  }

  await Category.deleteOne({
    _id: id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Category deleted successfully", null));
});

// =====================================================
// TOGGLE CATEGORY STATUS
// =====================================================

const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const category = await Category.findOne({
    _id: id,
    isDeleted: {
      $ne: true,
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  category.isActive = !category.isActive;

  await category.save();

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
  getSubcategories,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
};
