const express = require("express");

const router = express.Router();

const {
    uploadProductImages,
    deleteProductImage,
    setPrimaryProductImage,
} = require("../controllers/productImageController");

const authMiddleware = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const isApprovedSeller = require("../middleware/isApprovedSeller");

const {
    productLimiter,
} = require("../middleware/rateLimitterMiddleware");

const {
    uploadProductImages: uploadProductImagesMiddleware,
} = require("../middleware/uploadMiddleware");

router.post(
    "/:productId/images",
    authMiddleware,
    authorizeRoles("seller"),
    isApprovedSeller,
    productLimiter,
    uploadProductImagesMiddleware.array(
        "images",
        10
    ),
    uploadProductImages
);

router.delete(
    "/:productId/images",
    authMiddleware,
    authorizeRoles("seller"),
    isApprovedSeller,
    productLimiter,
    deleteProductImage
);

router.patch(
    "/:productId/images/primary",
    authMiddleware,
    authorizeRoles("seller"),
    isApprovedSeller,
    productLimiter,
    setPrimaryProductImage
);

module.exports = router;