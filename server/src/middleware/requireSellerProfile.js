const Seller = require("../models/sellerModel");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GATED BUSINESS ACCESS MIDDLEWARE
 * If req.user.role === "seller", checks if a Seller profile exists in DB.
 * If missing (e.g. after rejection), blocks access with 403 & requireBusinessDetails: true.
 */
const requireSellerProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user._id || req.user.id;

    const seller = await Seller.findOne({
        user: userId,
        isDeleted: false,
    });

    // 1. Seller business document missing in DB (After rejection or before initial submission)
    if (!seller) {
        return res.status(403).json(
            new ApiResponse(
                403,
                { requireBusinessDetails: true },
                "Seller business details missing. Please fill business details form to submit application."
            )
        );
    }

    // 2. Account Blocked by Admin
    if (seller.isBlocked) {
        throw new ApiError(403, `Seller account is blocked. Reason: ${seller.blockReason || "N/A"}`);
    }

    // 3. Account Inactive
    if (!seller.isActive) {
        throw new ApiError(403, "Seller account is currently inactive.");
    }

    // 4. Application Pending Admin Approval
    if (seller.verificationStatus === "pending") {
        return res.status(403).json(
            new ApiResponse(
                403,
                { verificationStatus: "pending" },
                "Your seller business application is pending admin approval."
            )
        );
    }

    // 5. Application Rejected
    if (seller.verificationStatus === "rejected") {
        return res.status(403).json(
            new ApiResponse(
                403,
                { requireBusinessDetails: true, rejectionReason: seller.rejectionReason },
                "Your previous application was rejected. Please fill business details again."
            )
        );
    }

    req.seller = seller;
    next();
});

module.exports = requireSellerProfile;