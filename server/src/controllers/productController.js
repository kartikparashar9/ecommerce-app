const mongoose = require("mongoose");

const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const Seller = require("../models/sellerModel");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// =====================================================
// HELPERS
// =====================================================

const generateSlug = (value) => {
  return value
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
// Unique Slug
// -----------------------------------------------------

const generateUniqueSlug = async (name, excludeProductId = null) => {
  const baseSlug = generateSlug(name);

  if (!baseSlug) {
    throw new ApiError(400, "Unable to generate valid product slug");
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = {
      slug,
    };

    if (excludeProductId) {
      query._id = {
        $ne: excludeProductId,
      };
    }

    const exists = await Product.exists(query);

    if (!exists) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;

    counter++;
  }
};

// -----------------------------------------------------
// Final Price
// -----------------------------------------------------

const calculateFinalPrice = (basePrice, discount = 0) => {
  const price = Number(basePrice);

  const discountValue = Number(discount);

  if (!Number.isFinite(price) || !Number.isFinite(discountValue)) {
    throw new ApiError(400, "Invalid price or discount");
  }

  if (price < 0) {
    throw new ApiError(400, "Base price cannot be negative");
  }

  if (discountValue < 0 || discountValue > 100) {
    throw new ApiError(400, "Discount must be between 0 and 100");
  }

  return Number((price - (price * discountValue) / 100).toFixed(2));
};

// -----------------------------------------------------
// Total Stock
// -----------------------------------------------------

const calculateTotalStock = (variants = []) => {
  return variants.reduce((total, variant) => {
    if (variant.isActive === false) {
      return total;
    }

    return total + Number(variant.stock || 0);
  }, 0);
};

// -----------------------------------------------------
// Current Seller
// -----------------------------------------------------

const getCurrentSeller = async (userId) => {
  if (!userId) {
    throw new ApiError(401, "Authenticated user not found");
  }

  const seller = await Seller.findOne({
    user: userId,

    isDeleted: {
      $ne: true,
    },
  });

  if (!seller) {
    throw new ApiError(404, "Seller profile not found");
  }

  return seller;
};

// -----------------------------------------------------
// Validate Seller
// -----------------------------------------------------

const validateSeller = async (userId) => {
  const seller = await getCurrentSeller(userId);

  if (seller.isBlocked) {
    throw new ApiError(403, "Seller account is blocked");
  }

  if (seller.isActive === false) {
    throw new ApiError(403, "Seller account is inactive");
  }

  if (seller.verificationStatus && seller.verificationStatus !== "approved") {
    throw new ApiError(403, "Seller account is not approved");
  }

  return seller;
};

// -----------------------------------------------------
// Validate Category
// -----------------------------------------------------

const validateCategory = async (categoryId) => {
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new ApiError(400, "Valid category ID is required");
  }

  const category = await Category.findOne({
    _id: categoryId,

    isDeleted: {
      $ne: true,
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (!category.isActive) {
    throw new ApiError(400, "Selected category is inactive");
  }

  if (category.parentCategory) {
    throw new ApiError(
      400,
      "Selected category is a subcategory. Please provide the parent category as category",
    );
  }

  return category;
};

// -----------------------------------------------------
// Validate Subcategory
// -----------------------------------------------------

const validateSubcategory = async (subcategoryId, categoryId) => {
  if (
    subcategoryId === undefined ||
    subcategoryId === null ||
    subcategoryId === ""
  ) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
    throw new ApiError(400, "Invalid subcategory ID");
  }

  const subcategory = await Category.findOne({
    _id: subcategoryId,

    isDeleted: {
      $ne: true,
    },
  });

  if (!subcategory) {
    throw new ApiError(404, "Subcategory not found");
  }

  if (!subcategory.isActive) {
    throw new ApiError(400, "Selected subcategory is inactive");
  }

  if (!subcategory.parentCategory) {
    throw new ApiError(400, "Selected category is not a subcategory");
  }

  if (subcategory.parentCategory.toString() !== categoryId.toString()) {
    throw new ApiError(
      400,
      "Selected subcategory does not belong to the selected category",
    );
  }

  return subcategory;
};

// -----------------------------------------------------
// Validate Brand
// -----------------------------------------------------

const validateBrand = async (brandId) => {
  if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
    throw new ApiError(400, "Valid brand ID is required");
  }

  const brand = await Brand.findOne({
    _id: brandId,

    isDeleted: {
      $ne: true,
    },
  });

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  if (!brand.isActive) {
    throw new ApiError(400, "Selected brand is inactive");
  }

  return brand;
};

// -----------------------------------------------------
// Validate Category + Brand
// -----------------------------------------------------

const validateCategoryAndBrand = async (categoryId, brandId) => {
  const [category, brand] = await Promise.all([
    validateCategory(categoryId),
    validateBrand(brandId),
  ]);

  return {
    category,
    brand,
  };
};

// -----------------------------------------------------
// Validate Variant SKUs
// -----------------------------------------------------

const validateVariantSKUs = async (variants = [], excludeProductId = null) => {
  if (!Array.isArray(variants)) {
    throw new ApiError(400, "Variants must be an array");
  }

  if (!variants.length) {
    return;
  }

  const skus = variants.map((variant) => {
    if (!variant || typeof variant.sku !== "string" || !variant.sku.trim()) {
      throw new ApiError(400, "Every variant must have a SKU");
    }

    return variant.sku.trim().toUpperCase();
  });

  const uniqueSKUs = new Set(skus);

  if (uniqueSKUs.size !== skus.length) {
    throw new ApiError(409, "Duplicate SKU found in product variants");
  }

  const query = {
    "variants.sku": {
      $in: skus,
    },

    isDeleted: {
      $ne: true,
    },
  };

  if (excludeProductId) {
    query._id = {
      $ne: excludeProductId,
    };
  }

  const existingProduct = await Product.findOne(query);

  if (existingProduct) {
    throw new ApiError(409, "One or more variant SKUs already exist");
  }
};

// -----------------------------------------------------
// Normalize Variants
// -----------------------------------------------------

const normalizeVariants = (variants = []) => {
  return variants.map((variant) => {
    const price = Number(variant.price);

    const stock = Number(variant.stock);

    if (!Number.isFinite(price) || price < 0) {
      throw new ApiError(400, `Invalid price for variant ${variant.sku}`);
    }

    if (!Number.isInteger(stock) || stock < 0) {
      throw new ApiError(400, `Invalid stock for variant ${variant.sku}`);
    }

    return {
      sku: variant.sku.trim().toUpperCase(),

      color: typeof variant.color === "string" ? variant.color.trim() : "",

      size: typeof variant.size === "string" ? variant.size.trim() : "",

      price,

      stock,

      image: typeof variant.image === "string" ? variant.image.trim() : "",

      isActive: variant.isActive !== false,
    };
  });
};

// =====================================================
// CREATE PRODUCT
// =====================================================

const createProduct = asyncHandler(async (req, res) => {
  const seller = await validateSeller(req.user._id);

  const {
    name,
    description,
    shortDescription,
    category,
    subcategory,
    brand,
    images,
    basePrice,
    discount = 0,
    lowStockThreshold = 5,
    variants = [],
    attributes = {},
  } = req.body;

  // -------------------------------------------------
  // Basic Validation
  // -------------------------------------------------

  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Product name is required");
  }

  if (typeof description !== "string" || !description.trim()) {
    throw new ApiError(400, "Product description is required");
  }

  if (basePrice === undefined || basePrice === null || basePrice === "") {
    throw new ApiError(400, "Base price is required");
  }

  // -------------------------------------------------
  // Category + Brand
  // -------------------------------------------------

  await validateCategoryAndBrand(category, brand);

  await validateSubcategory(subcategory, category);

  // -------------------------------------------------
  // Duplicate
  // -------------------------------------------------

  const existingProduct = await Product.findOne({
    name: {
      $regex: `^${name.trim()}$`,
      $options: "i",
    },

    seller: seller._id,

    isDeleted: {
      $ne: true,
    },
  });

  if (existingProduct) {
    throw new ApiError(409, "You already have a product with this name");
  }

  // -------------------------------------------------
  // Slug
  // -------------------------------------------------

  const slug = await generateUniqueSlug(name);

  // -------------------------------------------------
  // Variants
  // -------------------------------------------------

  await validateVariantSKUs(variants);

  const normalizedVariants = normalizeVariants(variants);

  // -------------------------------------------------
  // Price
  // -------------------------------------------------

  const numericBasePrice = Number(basePrice);

  const numericDiscount = Number(discount);

  if (!Number.isFinite(numericBasePrice) || numericBasePrice < 0) {
    throw new ApiError(400, "Invalid base price");
  }

  if (
    !Number.isFinite(numericDiscount) ||
    numericDiscount < 0 ||
    numericDiscount > 100
  ) {
    throw new ApiError(400, "Discount must be between 0 and 100");
  }

  const finalPrice = calculateFinalPrice(numericBasePrice, numericDiscount);

  // -------------------------------------------------
  // Images
  // -------------------------------------------------

  if (images !== undefined && !Array.isArray(images)) {
    throw new ApiError(400, "Images must be an array");
  }

  const productImages = Array.isArray(images)
    ? images
        .filter((image) => typeof image === "string")
        .map((image) => image.trim())
        .filter(Boolean)
    : [];

  if (productImages.length > 10) {
    throw new ApiError(400, "Product cannot have more than 10 images");
  }

  // -------------------------------------------------
  // Low Stock Threshold
  // -------------------------------------------------

  const threshold = Number(lowStockThreshold);

  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new ApiError(400, "Invalid low stock threshold");
  }

  const totalStock = calculateTotalStock(normalizedVariants);

  // -------------------------------------------------
  // Create
  // -------------------------------------------------

  const product = await Product.create({
    name: name.trim(),

    slug,

    description: description.trim(),

    shortDescription:
      typeof shortDescription === "string" ? shortDescription.trim() : "",

    category,

    subcategory: subcategory || null,

    brand,

    seller: seller._id,

    images: productImages,

    basePrice: numericBasePrice,

    discount: numericDiscount,

    finalPrice,

    totalStock,

    lowStockThreshold: threshold,

    variants: normalizedVariants,

    attributes: attributes && typeof attributes === "object" ? attributes : {},

    isActive: true,

    isFeatured: false,

    isDeleted: false,

    deletedAt: null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Product created successfully", product));
});

// =====================================================
// SELLER CATEGORIES
// =====================================================

const getSellerCategories = asyncHandler(async (req, res) => {
  await validateSeller(req.user._id);

  const categories = await Category.find({
    isActive: true,

    isDeleted: {
      $ne: true,
    },

    parentCategory: null,
  })
    .select("name slug description image parentCategory")
    .sort({
      name: 1,
    })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Categories fetched successfully", categories));
});

// =====================================================
// SELLER SUBCATEGORIES
// =====================================================

const getSellerSubcategories = asyncHandler(async (req, res) => {
  await validateSeller(req.user._id);

  const { categoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }

  await validateCategory(categoryId);

  const subcategories = await Category.find({
    parentCategory: categoryId,

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

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Subcategories fetched successfully", subcategories),
    );
});

// =====================================================
// SELLER BRANDS
// =====================================================

const getSellerBrands = asyncHandler(async (req, res) => {
  await validateSeller(req.user._id);

  const brands = await Brand.find({
    isActive: true,

    isDeleted: {
      $ne: true,
    },
  })
    .select("name slug description logo website")
    .sort({
      name: 1,
    })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Brands fetched successfully", brands));
});

// =====================================================
// PRODUCT FILTER HELPER
// =====================================================

const applyProductFilters = (
  query,
  { search, category, brand, seller, minPrice, maxPrice, isActive, isFeatured },
) => {
  if (search && typeof search === "string" && search.trim()) {
    query.$text = {
      $search: search.trim(),
    };
  }

  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      throw new ApiError(400, "Invalid category ID");
    }

    query.category = category;
  }

  if (brand) {
    if (!mongoose.Types.ObjectId.isValid(brand)) {
      throw new ApiError(400, "Invalid brand ID");
    }

    query.brand = brand;
  }

  if (seller) {
    if (!mongoose.Types.ObjectId.isValid(seller)) {
      throw new ApiError(400, "Invalid seller ID");
    }

    query.seller = seller;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter = {};

    if (minPrice !== undefined) {
      const min = Number(minPrice);

      if (!Number.isFinite(min) || min < 0) {
        throw new ApiError(400, "Invalid minimum price");
      }

      priceFilter.$gte = min;
    }

    if (maxPrice !== undefined) {
      const max = Number(maxPrice);

      if (!Number.isFinite(max) || max < 0) {
        throw new ApiError(400, "Invalid maximum price");
      }

      priceFilter.$lte = max;
    }

    if (
      priceFilter.$gte !== undefined &&
      priceFilter.$lte !== undefined &&
      priceFilter.$gte > priceFilter.$lte
    ) {
      throw new ApiError(
        400,
        "Minimum price cannot be greater than maximum price",
      );
    }

    query.finalPrice = priceFilter;
  }

  if (isActive !== undefined) {
    if (!["true", "false"].includes(isActive)) {
      throw new ApiError(400, "isActive must be true or false");
    }

    query.isActive = isActive === "true";
  }

  if (isFeatured !== undefined) {
    if (!["true", "false"].includes(isFeatured)) {
      throw new ApiError(400, "isFeatured must be true or false");
    }

    query.isFeatured = isFeatured === "true";
  }
};

// =====================================================
// GET ACTIVE PRODUCTS
// =====================================================

const getActiveProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    category,
    brand,
    minPrice,
    maxPrice,
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (pageNumber - 1) * limitNumber;

  const query = {
    isActive: true,
    isDeleted: false,
  };

  applyProductFilters(query, {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
  });

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("subcategory", "name slug parentCategory")
      .populate("brand", "name slug logo")
      .populate("seller", "businessName")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Product.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalProducts / limitNumber);

  return res.status(200).json(
    new ApiResponse(200, "Active products fetched successfully", {
      products,

      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalProducts,
        totalPages,

        hasNextPage: pageNumber < totalPages,

        hasPreviousPage: pageNumber > 1,
      },
    }),
  );
});

// =====================================================
// GET ALL PRODUCTS
// =====================================================

const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    category,
    brand,
    seller,
    minPrice,
    maxPrice,
    isActive,
    isFeatured,
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (pageNumber - 1) * limitNumber;

  const query = {
    isDeleted: false,
  };

  applyProductFilters(query, {
    search,
    category,
    brand,
    seller,
    minPrice,
    maxPrice,
    isActive,
    isFeatured,
  });

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("brand", "name slug logo")
      .populate("seller", "businessName")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Product.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalProducts / limitNumber);

  return res.status(200).json(
    new ApiResponse(200, "Products fetched successfully", {
      products,

      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalProducts,
        totalPages,

        hasNextPage: pageNumber < totalPages,

        hasPreviousPage: pageNumber > 1,
      },
    }),
  );
});

// =====================================================
// GET PRODUCT BY ID
// =====================================================

const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: productId,
    isDeleted: false,
    isActive: true,
  })
    .populate("category", "name slug")
    .populate("subcategory", "name slug parentCategory")
    .populate("brand", "name slug logo website")
    .populate("seller", "businessName")
    .lean();

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Product fetched successfully", product));
});

// =====================================================
// GET PRODUCT BY SLUG
// =====================================================

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (typeof slug !== "string" || !slug.trim()) {
    throw new ApiError(400, "Valid product slug is required");
  }

  const product = await Product.findOne({
    slug: slug.trim().toLowerCase(),

    isDeleted: false,

    isActive: true,
  })
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .populate("brand", "name slug")
    .populate("seller", "businessName")
    .lean();

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Product fetched successfully", product));
});

// =====================================================
// GET MY PRODUCTS
// =====================================================

const getMyProducts = asyncHandler(async (req, res) => {
  const seller = await getCurrentSeller(req.user._id);

  const { page = 1, limit = 20, search = "", isActive } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (pageNumber - 1) * limitNumber;

  const query = {
    seller: seller._id,
    isDeleted: false,
  };

  applyProductFilters(query, {
    search,
    isActive,
  });

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("brand", "name slug logo")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Product.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalProducts / limitNumber);

  return res.status(200).json(
    new ApiResponse(200, "Seller products fetched successfully", {
      products,

      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalProducts,
        totalPages,

        hasNextPage: pageNumber < totalPages,

        hasPreviousPage: pageNumber > 1,
      },
    }),
  );
});

// =====================================================
// UPDATE PRODUCT
// =====================================================

const updateProduct = asyncHandler(async (req, res) => {
  const seller = await validateSeller(req.user._id);

  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: productId,
    seller: seller._id,
    isDeleted: false,
  });

  if (!product) {
    throw new ApiError(
      404,
      "Product not found or you do not have permission to update it",
    );
  }

  const {
    name,
    description,
    shortDescription,
    category,
    subcategory,
    brand,
    images,
    basePrice,
    discount,
    lowStockThreshold,
    variants,
    attributes,
    isActive,
  } = req.body;

  // -------------------------------------------------
  // Category
  // -------------------------------------------------

  if (category !== undefined) {
    await validateCategory(category);

    product.category = category;
  }

  // -------------------------------------------------
  // Subcategory
  // -------------------------------------------------

  if (subcategory !== undefined) {
    const categoryId = category || product.category;

    if (subcategory === null || subcategory === "") {
      product.subcategory = null;
    } else {
      await validateSubcategory(subcategory, categoryId);

      product.subcategory = subcategory;
    }
  }

  // -------------------------------------------------
  // Brand
  // -------------------------------------------------

  if (brand !== undefined) {
    await validateBrand(brand);

    product.brand = brand;
  }

  // -------------------------------------------------
  // Name
  // -------------------------------------------------

  if (name !== undefined) {
    if (typeof name !== "string") {
      throw new ApiError(400, "Product name must be a string");
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      throw new ApiError(400, "Product name must be at least 2 characters");
    }

    if (trimmedName.toLowerCase() !== product.name.toLowerCase()) {
      const duplicate = await Product.findOne({
        name: {
          $regex: `^${trimmedName}$`,
          $options: "i",
        },

        seller: seller._id,

        isDeleted: false,

        _id: {
          $ne: product._id,
        },
      });

      if (duplicate) {
        throw new ApiError(
          409,
          "You already have another product with this name",
        );
      }

      product.name = trimmedName;

      product.slug = await generateUniqueSlug(trimmedName, product._id);
    }
  }

  // -------------------------------------------------
  // Description
  // -------------------------------------------------

  if (description !== undefined) {
    if (typeof description !== "string") {
      throw new ApiError(400, "Description must be a string");
    }

    product.description = description.trim();
  }

  // -------------------------------------------------
  // Short Description
  // -------------------------------------------------

  if (shortDescription !== undefined) {
    if (typeof shortDescription !== "string") {
      throw new ApiError(400, "Short description must be a string");
    }

    product.shortDescription = shortDescription.trim();
  }

  // -------------------------------------------------
  // Images
  // -------------------------------------------------

  if (images !== undefined) {
    if (!Array.isArray(images)) {
      throw new ApiError(400, "Images must be an array");
    }

    if (images.length > 10) {
      throw new ApiError(400, "Product cannot have more than 10 images");
    }

    product.images = images
      .filter((image) => typeof image === "string")
      .map((image) => image.trim())
      .filter(Boolean);
  }

  // -------------------------------------------------
  // Base Price
  // -------------------------------------------------

  if (basePrice !== undefined) {
    const value = Number(basePrice);

    if (!Number.isFinite(value) || value < 0) {
      throw new ApiError(400, "Invalid base price");
    }

    product.basePrice = value;
  }

  // -------------------------------------------------
  // Discount
  // -------------------------------------------------

  if (discount !== undefined) {
    const value = Number(discount);

    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new ApiError(400, "Discount must be between 0 and 100");
    }

    product.discount = value;
  }

  // -------------------------------------------------
  // Final Price
  // -------------------------------------------------

  if (basePrice !== undefined || discount !== undefined) {
    product.finalPrice = calculateFinalPrice(
      product.basePrice,
      product.discount,
    );
  }

  // -------------------------------------------------
  // Low Stock Threshold
  // -------------------------------------------------

  if (lowStockThreshold !== undefined) {
    const value = Number(lowStockThreshold);

    if (!Number.isInteger(value) || value < 0) {
      throw new ApiError(400, "Invalid low stock threshold");
    }

    product.lowStockThreshold = value;
  }

  // -------------------------------------------------
  // Variants
  // -------------------------------------------------

  if (variants !== undefined) {
    await validateVariantSKUs(variants, product._id);

    const normalizedVariants = normalizeVariants(variants);

    product.variants = normalizedVariants;

    product.totalStock = calculateTotalStock(normalizedVariants);
  }

  // -------------------------------------------------
  // Attributes
  // -------------------------------------------------

  if (attributes !== undefined) {
    if (
      !attributes ||
      typeof attributes !== "object" ||
      Array.isArray(attributes)
    ) {
      throw new ApiError(400, "Attributes must be an object");
    }

    product.attributes = attributes;
  }

  // -------------------------------------------------
  // Active Status
  // -------------------------------------------------

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "isActive must be a boolean");
    }

    product.isActive = isActive;
  }

  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Product updated successfully", product));
});

// =====================================================
// TOGGLE PRODUCT STATUS
// =====================================================

const toggleProductStatus = asyncHandler(async (req, res) => {
  const seller = await validateSeller(req.user._id);

  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: productId,
    seller: seller._id,
    isDeleted: false,
  });

  if (!product) {
    throw new ApiError(404, "Product not found or you do not have permission");
  }

  product.isActive = !product.isActive;

  await product.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Product ${
          product.isActive ? "activated" : "deactivated"
        } successfully`,
        product,
      ),
    );
});

// =====================================================
// DELETE PRODUCT
// =====================================================

const deleteProduct = asyncHandler(async (req, res) => {
  const seller = await validateSeller(req.user._id);

  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: productId,
    seller: seller._id,
    isDeleted: false,
  });

  if (!product) {
    throw new ApiError(
      404,
      "Product not found or you do not have permission to delete it",
    );
  }

  // Keep existing permanent-delete behavior.
  await Product.deleteOne({
    _id: product._id,
    seller: seller._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Product deleted successfully", null));
});

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createProduct,

  getSellerCategories,
  getSellerSubcategories,
  getSellerBrands,

  getAllProducts,
  getActiveProducts,
  getProductById,
  getProductBySlug,

  getMyProducts,

  updateProduct,
  deleteProduct,
  toggleProductStatus,
};
