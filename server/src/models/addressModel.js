const mongoose = require("mongoose");

// =====================================================
// ADDRESS SCHEMA
// =====================================================

const addressSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // User
        // -------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },

        // -------------------------------------------------
        // Address Type
        // -------------------------------------------------

        type: {
            type: String,
            enum: {
                values: ["home", "work", "other"],
                message:
                    "Address type must be home, work, or other",
            },
            default: "home",
            lowercase: true,
            trim: true,
        },

        // -------------------------------------------------
        // Receiver Name
        // -------------------------------------------------

        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [
                2,
                "Name must be at least 2 characters",
            ],
            maxlength: [
                100,
                "Name cannot exceed 100 characters",
            ],
        },

        // -------------------------------------------------
        // Phone
        // -------------------------------------------------

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            match: [
                /^[6-9]\d{9}$/,
                "Please provide a valid 10-digit Indian mobile number",
            ],
        },

        // -------------------------------------------------
        // Address Line 1
        // -------------------------------------------------

        addressLine1: {
            type: String,
            required: [true, "Address line 1 is required"],
            trim: true,
            minlength: [
                3,
                "Address line 1 must be at least 3 characters",
            ],
            maxlength: [
                200,
                "Address line 1 cannot exceed 200 characters",
            ],
        },

        // -------------------------------------------------
        // Address Line 2
        // -------------------------------------------------

        addressLine2: {
            type: String,
            trim: true,
            maxlength: [
                200,
                "Address line 2 cannot exceed 200 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // Landmark
        // -------------------------------------------------

        landmark: {
            type: String,
            trim: true,
            maxlength: [
                150,
                "Landmark cannot exceed 150 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // City
        // -------------------------------------------------

        city: {
            type: String,
            required: [true, "City is required"],
            trim: true,
            maxlength: [
                100,
                "City cannot exceed 100 characters",
            ],
        },

        // -------------------------------------------------
        // State
        // -------------------------------------------------

        state: {
            type: String,
            required: [true, "State is required"],
            trim: true,
            maxlength: [
                100,
                "State cannot exceed 100 characters",
            ],
        },

        // -------------------------------------------------
        // Country
        // -------------------------------------------------

        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
            default: "India",
            maxlength: [
                100,
                "Country cannot exceed 100 characters",
            ],
        },

        // -------------------------------------------------
        // Postal Code / PIN
        // -------------------------------------------------

        postalCode: {
            type: String,
            required: [true, "Postal code is required"],
            trim: true,
            match: [
                /^[1-9][0-9]{5}$/,
                "Please provide a valid 6-digit Indian postal code",
            ],
        },

        // -------------------------------------------------
        // Default Address
        // -------------------------------------------------

        isDefault: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// INDEX
// =====================================================

addressSchema.index({
    user: 1,
    createdAt: -1,
});

// =====================================================
// EXPORT
// =====================================================

const Address = mongoose.model(
    "Address",
    addressSchema
);

module.exports = Address;