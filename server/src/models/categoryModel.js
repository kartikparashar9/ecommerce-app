const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            minlength: [2, "Category name must be at least 2 characters"],
            maxlength: [100, "Category name cannot exceed 100 characters"]
        },

        slug: {
            type: String,
            required: [true, "Category slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, "Category description cannot exceed 500 characters"],
            default: ""
        },

        image: {
            type: String,
            trim: true,
            default: ""
        },

        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
            index: true
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

categorySchema.index({
    name: "text",
    description: "text"
});

categorySchema.index({
    parentCategory: 1,
    isActive: 1
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;