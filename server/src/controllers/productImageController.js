const mongoose = require("mongoose");

const Product = require("../models/productModel");
const Seller = require("../models/sellerModel");

const cloudinary = require("../config/cloudinary");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

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

const validateProductId = (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }
};

const findSellerProduct = async (productId, userId) => {
  validateProductId(productId);

  const seller = await getCurrentSeller(userId);

  const product = await Product.findOne({
    _id: productId,
    seller: seller._id,
    isDeleted: false,
  });

  if (!product) {
    throw new ApiError(
      404,
      "Product not found or you do not have permission to modify it",
    );
  }

  return {
    seller,
    product,
  };
};

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
};

const getPublicIdFromUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  try {
    const url = new URL(imageUrl);

    const pathname = url.pathname;

    const uploadIndex = pathname.indexOf("/upload/");

    if (uploadIndex === -1) {
      return null;
    }

    let publicPath = pathname.substring(uploadIndex + "/upload/".length);

    publicPath = publicPath.replace(/^v\d+\//, "");

    const lastDotIndex = publicPath.lastIndexOf(".");

    if (lastDotIndex !== -1) {
      publicPath = publicPath.substring(0, lastDotIndex);
    }

    return publicPath;
  } catch (error) {
    return null;
  }
};

const deleteFromCloudinary = async (imageUrl) => {
  const publicId = getPublicIdFromUrl(imageUrl);

  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};

const deleteMultipleCloudinaryImages = async (images = []) => {
  if (!Array.isArray(images)) {
    return;
  }

  await Promise.allSettled(
    images.map((imageUrl) => deleteFromCloudinary(imageUrl)),
  );
};

const uploadProductImages = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }

  const { product } = await findSellerProduct(productId, req.user._id);

  const existingImages = product.images || [];

  const totalImages = existingImages.length + req.files.length;

  if (totalImages > 10) {
    throw new ApiError(400, "A product cannot have more than 10 images");
  }

  let uploadedImages = [];

  try {
    const uploadResults = await Promise.all(
      req.files.map((file) =>
        uploadToCloudinary(file.buffer, `ecommerce/products/${product._id}`),
      ),
    );

    uploadedImages = uploadResults.map((result) => result.secure_url);

    product.images = [...existingImages, ...uploadedImages];

    await product.save();
  } catch (error) {
    await deleteMultipleCloudinaryImages(uploadedImages);

    throw new ApiError(500, error.message || "Failed to upload product images");
  }

  return res.status(200).json(
    new ApiResponse(200, "Product images uploaded successfully", {
      productId: product._id,
      images: product.images,
    }),
  );
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const { image } = req.body;

  if (!image || typeof image !== "string" || !image.trim()) {
    throw new ApiError(400, "Image URL is required");
  }

  const imageUrl = image.trim();

  const { product } = await findSellerProduct(productId, req.user._id);

  const imageIndex = product.images.indexOf(imageUrl);

  if (imageIndex === -1) {
    throw new ApiError(404, "Image not found in this product");
  }

  product.images.splice(imageIndex, 1);

  await product.save();

  try {
    await deleteFromCloudinary(imageUrl);
  } catch (error) {
    console.error("Failed to delete Cloudinary image:", error.message);
  }

  return res.status(200).json(
    new ApiResponse(200, "Product images uploaded successfully", {
      productId: product._id,
      images: product.images,
    }),
  );
});

const setPrimaryProductImage = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const { image } = req.body;

  if (!image || typeof image !== "string" || !image.trim()) {
    throw new ApiError(400, "Image URL is required");
  }

  const imageUrl = image.trim();
  const { product } = await findSellerProduct(productId, req.user._id);
  const imageExists = product.images.includes(imageUrl);

  if (!imageExists) {
    throw new ApiError(404, "Image does not belong to this product");
  }

  product.images = [
    imageUrl,
    ...product.images.filter((item) => item !== imageUrl),
  ];

  await product.save();

  return res.status(200).json(
    new ApiResponse(200, "Primary product image updated successfully", {
      productId: product._id,
      primaryImage: product.images[0],
      images: product.images,
    }),
  );
});

module.exports = {
  uploadProductImages,
  deleteProductImage,
  setPrimaryProductImage,
};
