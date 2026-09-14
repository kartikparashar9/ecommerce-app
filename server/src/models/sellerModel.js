const mongoose = require("mongoose");

// =====================================================
// SELLER SCHEMA
// =====================================================

const sellerSchema = new mongoose.Schema(
    {
        // =====================================================
        // USER RELATION
        // =====================================================

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Seller user is required"],
            unique: true,
        },

        // =====================================================
        // BUSINESS INFORMATION
        // =====================================================

        businessName: {
            type: String,
            required: [true, "Business name is required"],
            trim: true,
            minlength: [
                2,
                "Business name must be at least 2 characters",
            ],
            maxlength: [
                200,
                "Business name cannot exceed 200 characters",
            ],
        },

        businessDescription: {
            type: String,
            trim: true,
            maxlength: [
                2000,
                "Business description cannot exceed 2000 characters",
            ],
            default: "",
        },

        businessEmail: {
            type: String,
            required: [true, "Business email is required"],
            trim: true,
            lowercase: true,
            match: [
                /^\S+@\S+\.\S+$/,
                "Please provide a valid business email",
            ],
        },

        businessPhone: {
            type: String,
            required: [true, "Business phone is required"],
            trim: true,
            match: [
                /^[6-9]\d{9}$/,
                "Please provide a valid 10-digit Indian phone number",
            ],
        },

        businessType: {
            type: String,
            required: [true, "Business type is required"],
            enum: [
                "individual",
                "proprietorship",
                "partnership",
                "llp",
                "private_limited",
                "public_limited",
                "other",
            ],
        },

        // =====================================================
        // TAX INFORMATION
        // =====================================================

        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
            match: [
                /^(|[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])$/,
                "Please provide a valid GST number",
            ],
        },

        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
            required: [true, "PAN number is required"],
            match: [
                /^[A-Z]{5}[0-9]{4}[A-Z]$/,
                "Please provide a valid PAN number",
            ],
        },

        // =====================================================
        // BUSINESS ADDRESS
        // =====================================================

        address: {
            addressLine1: {
                type: String,
                trim: true,
                required: [
                    true,
                    "Address line 1 is required",
                ],
            },

            addressLine2: {
                type: String,
                trim: true,
                default: "",
            },

            city: {
                type: String,
                trim: true,
                required: [
                    true,
                    "City is required",
                ],
            },

            state: {
                type: String,
                trim: true,
                required: [
                    true,
                    "State is required",
                ],
            },

            country: {
                type: String,
                trim: true,
                default: "India",
            },

            postalCode: {
                type: String,
                trim: true,
                required: [
                    true,
                    "Postal code is required",
                ],
                match: [
                    /^\d{6}$/,
                    "Please provide a valid 6-digit postal code",
                ],
            },
        },

        // =====================================================
        // BANK DETAILS
        // =====================================================

        bankDetails: {
            accountHolderName: {
                type: String,
                trim: true,
                required: [
                    true,
                    "Account holder name is required",
                ],
            },

            accountNumber: {
                type: String,
                trim: true,
                required: [
                    true,
                    "Bank account number is required",
                ],
                select: false,
            },

            ifscCode: {
                type: String,
                trim: true,
                uppercase: true,
                required: [
                    true,
                    "IFSC code is required",
                ],
                match: [
                    /^[A-Z]{4}0[A-Z0-9]{6}$/,
                    "Please provide a valid IFSC code",
                ],
            },

            bankName: {
                type: String,
                trim: true,
                default: "",
            },
        },

        // =====================================================
        // VERIFICATION STATUS
        // =====================================================

        verificationStatus: {
            type: String,
            enum: ["pending", "approved"],
            default: "pending",
            index: true,
        },

        // =====================================================
        // APPROVAL INFORMATION
        // =====================================================

        approvedAt: {
            type: Date,
            default: null,
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // =====================================================
        // SELLER OPERATION STATUS
        // =====================================================

        isActive: {
            type: Boolean,
            default: false,
            index: true,
        },

        isBlocked: {
            type: Boolean,
            default: false,
            index: true,
        },

        blockReason: {
            type: String,
            trim: true,
            default: "",
        },

        blockedAt: {
            type: Date,
            default: null,
        },

        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },

    {
        timestamps: true,
    }
);

// =====================================================
// DATABASE INDEXES
// =====================================================

// Useful for admin seller management.

sellerSchema.index({
    verificationStatus: 1,
    createdAt: -1,
});

sellerSchema.index({
    isActive: 1,
    isBlocked: 1,
});

// =====================================================
// MODEL
// =====================================================

const Seller = mongoose.model(
    "Seller",
    sellerSchema
);

module.exports = Seller;