const mongoose = require("mongoose");

const ApiError = require(
    "../utils/ApiError"
);

// =====================================================
// CREATE BRAND VALIDATION
// =====================================================

const validateCreateBrand = (
    req,
    res,
    next
) => {
    const {
        name,
        slug,
        description,
        website,
    } = req.body;

    // NAME
    if (
        !name ||
        typeof name !== "string" ||
        !name.trim()
    ) {
        throw new ApiError(
            400,
            "Brand name is required"
        );
    }

    if (name.trim().length < 2) {
        throw new ApiError(
            400,
            "Brand name must be at least 2 characters"
        );
    }

    if (name.trim().length > 100) {
        throw new ApiError(
            400,
            "Brand name cannot exceed 100 characters"
        );
    }

    // SLUG
    if (
        slug !== undefined &&
        typeof slug !== "string"
    ) {
        throw new ApiError(
            400,
            "Slug must be a string"
        );
    }

    // DESCRIPTION
    if (
        description !== undefined &&
        typeof description !== "string"
    ) {
        throw new ApiError(
            400,
            "Description must be a string"
        );
    }

    if (
        typeof description === "string" &&
        description.trim().length > 500
    ) {
        throw new ApiError(
            400,
            "Description cannot exceed 500 characters"
        );
    }

    // WEBSITE
    if (
        website !== undefined &&
        typeof website !== "string"
    ) {
        throw new ApiError(
            400,
            "Website must be a string"
        );
    }

    // LOGO REQUIRED ON CREATE
    if (!req.file) {
        throw new ApiError(
            400,
            "Brand logo is required"
        );
    }

    next();
};

// =====================================================
// UPDATE BRAND VALIDATION
// =====================================================

const validateUpdateBrand = (
    req,
    res,
    next
) => {
    const {
        name,
        slug,
        description,
        website,
        isActive,
    } = req.body;

    const hasBodyFields =
        Object.keys(req.body).length > 0;

    const hasNewLogo = !!req.file;

    if (
        !hasBodyFields &&
        !hasNewLogo
    ) {
        throw new ApiError(
            400,
            "At least one field is required for update"
        );
    }

    // NAME
    if (name !== undefined) {
        if (
            typeof name !== "string" ||
            !name.trim()
        ) {
            throw new ApiError(
                400,
                "Brand name must be a valid string"
            );
        }

        if (name.trim().length < 2) {
            throw new ApiError(
                400,
                "Brand name must be at least 2 characters"
            );
        }

        if (name.trim().length > 100) {
            throw new ApiError(
                400,
                "Brand name cannot exceed 100 characters"
            );
        }
    }

    // SLUG
    if (
        slug !== undefined &&
        typeof slug !== "string"
    ) {
        throw new ApiError(
            400,
            "Slug must be a string"
        );
    }

    // DESCRIPTION
    if (
        description !== undefined &&
        typeof description !== "string"
    ) {
        throw new ApiError(
            400,
            "Description must be a string"
        );
    }

    if (
        typeof description === "string" &&
        description.trim().length > 500
    ) {
        throw new ApiError(
            400,
            "Description cannot exceed 500 characters"
        );
    }

    // WEBSITE
    if (
        website !== undefined &&
        typeof website !== "string"
    ) {
        throw new ApiError(
            400,
            "Website must be a string"
        );
    }

    // MULTIPART BOOLEAN
    if (isActive !== undefined) {
        if (
            isActive !== true &&
            isActive !== false &&
            isActive !== "true" &&
            isActive !== "false"
        ) {
            throw new ApiError(
                400,
                "isActive must be a boolean"
            );
        }
    }

    next();
};

// =====================================================
// BRAND ID
// =====================================================

const validateBrandId = (
    req,
    res,
    next
) => {
    const {
        brandId,
    } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(
            brandId
        )
    ) {
        throw new ApiError(
            400,
            "Invalid brand ID"
        );
    }

    next();
};

module.exports = {
    validateCreateBrand,
    validateUpdateBrand,
    validateBrandId,
};