const Seller = require("../models/sellerModel");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Middleware to ensure that the authenticated user
 * has an approved, active, and unblocked seller account.
 */
const isApprovedSeller = asyncHandler(
    async (req, res, next) => {
        const seller = await Seller.findOne({
            user: req.user._id,
        });

        // ---------------------------------------------
        // SELLER PROFILE EXISTS
        // ---------------------------------------------

        if (!seller) {
            throw new ApiError(
                403,
                "Seller profile not found. Please submit a seller application."
            );
        }

        // ---------------------------------------------
        // SELLER MUST BE APPROVED
        // ---------------------------------------------

        if (
            seller.verificationStatus !==
            "approved"
        ) {
            throw new ApiError(
                403,
                "Your seller application has not been approved yet."
            );
        }

        // ---------------------------------------------
        // SELLER MUST NOT BE BLOCKED
        // ---------------------------------------------

        if (seller.isBlocked) {
            throw new ApiError(
                403,
                "Your seller account is blocked."
            );
        }

        // ---------------------------------------------
        // SELLER MUST BE ACTIVE
        // ---------------------------------------------

        if (!seller.isActive) {
            throw new ApiError(
                403,
                "Your seller account is currently inactive."
            );
        }

        // ---------------------------------------------
        // ATTACH SELLER TO REQUEST
        // ---------------------------------------------

        req.seller = seller;

        next();
    }
);

module.exports = isApprovedSeller;