const mongoose = require("mongoose");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// CREATE ADDRESS VALIDATOR
// =====================================================

const validateCreateAddress = (req, res, next) => {
    const {
        type,
        name,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        country,
        postalCode,
        isDefault,
    } = req.body;

    // -------------------------------------------------
    // Name
    // -------------------------------------------------

    if (
        typeof name !== "string" ||
        !name.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Name is required",
        });
    }

    // -------------------------------------------------
    // Phone
    // -------------------------------------------------

    if (
        typeof phone !== "string" ||
        !/^[6-9]\d{9}$/.test(phone.trim())
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Please provide a valid 10-digit Indian mobile number",
        });
    }

    // -------------------------------------------------
    // Address Line 1
    // -------------------------------------------------

    if (
        typeof addressLine1 !== "string" ||
        !addressLine1.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Address line 1 is required",
        });
    }

    // -------------------------------------------------
    // City
    // -------------------------------------------------

    if (
        typeof city !== "string" ||
        !city.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "City is required",
        });
    }

    // -------------------------------------------------
    // State
    // -------------------------------------------------

    if (
        typeof state !== "string" ||
        !state.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "State is required",
        });
    }

    // -------------------------------------------------
    // Postal Code
    // -------------------------------------------------

    if (
        typeof postalCode !== "string" ||
        !/^[1-9][0-9]{5}$/.test(
            postalCode.trim()
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Please provide a valid 6-digit Indian postal code",
        });
    }

    // -------------------------------------------------
    // Type
    // -------------------------------------------------

    if (
        type !== undefined &&
        !["home", "work", "other"].includes(
            String(type).toLowerCase()
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Address type must be home, work, or other",
        });
    }

    // -------------------------------------------------
    // isDefault
    // -------------------------------------------------

    if (
        isDefault !== undefined &&
        typeof isDefault !== "boolean"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "isDefault must be a boolean",
        });
    }

    // -------------------------------------------------
    // Optional Fields
    // -------------------------------------------------

    if (
        addressLine2 !== undefined &&
        typeof addressLine2 !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Address line 2 must be a string",
        });
    }

    if (
        landmark !== undefined &&
        typeof landmark !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Landmark must be a string",
        });
    }

    if (
        country !== undefined &&
        typeof country !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Country must be a string",
        });
    }

    next();
};

// =====================================================
// UPDATE ADDRESS VALIDATOR
// =====================================================

const validateUpdateAddress = (
    req,
    res,
    next
) => {
    const {
        type,
        name,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        country,
        postalCode,
        isDefault,
    } = req.body;

    // -------------------------------------------------
    // Empty Body
    // -------------------------------------------------

    if (
        !req.body ||
        Object.keys(req.body).length === 0
    ) {
        return res.status(400).json({
            success: false,
            message:
                "At least one field is required to update",
        });
    }

    // -------------------------------------------------
    // Type
    // -------------------------------------------------

    if (
        type !== undefined &&
        !["home", "work", "other"].includes(
            String(type).toLowerCase()
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Address type must be home, work, or other",
        });
    }

    // -------------------------------------------------
    // Name
    // -------------------------------------------------

    if (
        name !== undefined &&
        (
            typeof name !== "string" ||
            !name.trim()
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid name",
        });
    }

    // -------------------------------------------------
    // Phone
    // -------------------------------------------------

    if (
        phone !== undefined &&
        (
            typeof phone !== "string" ||
            !/^[6-9]\d{9}$/.test(
                phone.trim()
            )
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Please provide a valid 10-digit Indian mobile number",
        });
    }

    // -------------------------------------------------
    // Address Line 1
    // -------------------------------------------------

    if (
        addressLine1 !== undefined &&
        (
            typeof addressLine1 !== "string" ||
            !addressLine1.trim()
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid address line 1",
        });
    }

    // -------------------------------------------------
    // City
    // -------------------------------------------------

    if (
        city !== undefined &&
        (
            typeof city !== "string" ||
            !city.trim()
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid city",
        });
    }

    // -------------------------------------------------
    // State
    // -------------------------------------------------

    if (
        state !== undefined &&
        (
            typeof state !== "string" ||
            !state.trim()
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid state",
        });
    }

    // -------------------------------------------------
    // Postal Code
    // -------------------------------------------------

    if (
        postalCode !== undefined &&
        (
            typeof postalCode !== "string" ||
            !/^[1-9][0-9]{5}$/.test(
                postalCode.trim()
            )
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Please provide a valid 6-digit Indian postal code",
        });
    }

    // -------------------------------------------------
    // Boolean
    // -------------------------------------------------

    if (
        isDefault !== undefined &&
        typeof isDefault !== "boolean"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "isDefault must be a boolean",
        });
    }

    next();
};

// =====================================================
// ID VALIDATOR
// =====================================================

const validateAddressId = (
    req,
    res,
    next
) => {
    const { addressId } = req.params;

    if (!isValidObjectId(addressId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid address ID",
        });
    }

    next();
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    validateCreateAddress,
    validateUpdateAddress,
    validateAddressId,
};