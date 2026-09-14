const validateCategoryCreate = (req, res, next) => {
    const { name, description, image, parentCategory } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Category name is required"
        });
    }

    if (name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "Category name must be at least 2 characters"
        });
    }

    if (name.trim().length > 100) {
        return res.status(400).json({
            success: false,
            message: "Category name cannot exceed 100 characters"
        });
    }

    if (description && description.trim().length > 500) {
        return res.status(400).json({
            success: false,
            message: "Category description cannot exceed 500 characters"
        });
    }

    if (image !== undefined && typeof image !== "string") {
        return res.status(400).json({
            success: false,
            message: "Image must be a string"
        });
    }

    if (
        parentCategory !== undefined &&
        parentCategory !== null &&
        parentCategory !== ""
    ) {
        const mongoose = require("mongoose");

        if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
            return res.status(400).json({
                success: false,
                message: "Invalid parent category ID"
            });
        }
    }

    next();
};

const validateCategoryUpdate = (req, res, next) => {
    const { name, description, image, parentCategory, isActive } = req.body;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            message: "At least one field is required for update"
        });
    }

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name must be a valid string"
            });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Category name must be at least 2 characters"
            });
        }

        if (name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Category name cannot exceed 100 characters"
            });
        }
    }

    if (description !== undefined) {
        if (
            typeof description !== "string" ||
            description.trim().length > 500
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category description"
            });
        }
    }

    if (image !== undefined && typeof image !== "string") {
        return res.status(400).json({
            success: false,
            message: "Image must be a string"
        });
    }

    if (
        parentCategory !== undefined &&
        parentCategory !== null &&
        parentCategory !== ""
    ) {
        const mongoose = require("mongoose");

        if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
            return res.status(400).json({
                success: false,
                message: "Invalid parent category ID"
            });
        }
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "isActive must be a boolean"
        });
    }

    next();
};

module.exports = {
    validateCategoryCreate,
    validateCategoryUpdate
};