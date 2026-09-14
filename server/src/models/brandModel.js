const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true,
            minlength: [2, "Brand name must be at least 2 characters"],
            maxlength: [100, "Brand name cannot exceed 100 characters"],
        },

        slug: {
            type: String,
            required: [true, "Brand slug is required"],
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
            default: "",
        },

        logo: {
            type: String,
            trim: true,
            default: "",
        },

        website: {
            type: String,
            trim: true,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

brandSchema.index({ name: 1 });
brandSchema.index({ isActive: 1, createdAt: -1 });

const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand;