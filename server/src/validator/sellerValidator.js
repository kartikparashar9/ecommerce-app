const {
    body,
    param,
    query,
} = require("express-validator");

// =====================================================
// REGEX
// =====================================================

const GST_REGEX =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const PAN_REGEX =
    /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const INDIAN_PHONE_REGEX =
    /^[6-9]\d{9}$/;

const POSTAL_CODE_REGEX =
    /^\d{6}$/;

const IFSC_REGEX =
    /^[A-Z]{4}0[A-Z0-9]{6}$/;

const ACCOUNT_NUMBER_REGEX =
    /^[A-Z0-9]{6,30}$/;

// =====================================================
// BUSINESS TYPES
// MUST MATCH SELLER MODEL
// =====================================================

const BUSINESS_TYPES = [
    "individual",
    "proprietorship",
    "partnership",
    "llp",
    "private_limited",
    "public_limited",
    "other",
];

// =====================================================
// REUSABLE OBJECT VALIDATOR
// =====================================================

const isValidObject = (value) => {
    if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value)
    ) {
        throw new Error(
            "Value must be a valid object"
        );
    }

    return true;
};

// =====================================================
// REUSABLE SELLER ID VALIDATION
// =====================================================

const sellerIdValidation = [
    param("sellerId")
        .trim()
        .notEmpty()
        .withMessage("Seller ID is required")
        .isMongoId()
        .withMessage("Invalid seller ID"),
];

// =====================================================
// CREATE SELLER VALIDATION
// =====================================================

const createSellerValidation = [

    // -------------------------------------------------
    // BUSINESS INFORMATION
    // -------------------------------------------------

    body("businessName")
        .trim()
        .notEmpty()
        .withMessage("Business name is required")
        .isLength({
            min: 2,
            max: 200,
        })
        .withMessage(
            "Business name must be between 2 and 200 characters"
        ),

    body("businessDescription")
        .optional()
        .trim()
        .isLength({
            max: 2000,
        })
        .withMessage(
            "Business description cannot exceed 2000 characters"
        ),

    body("businessType")
        .trim()
        .notEmpty()
        .withMessage("Business type is required")
        .isIn(BUSINESS_TYPES)
        .withMessage("Invalid business type"),

    body("businessEmail")
        .trim()
        .notEmpty()
        .withMessage("Business email is required")
        .isEmail()
        .withMessage(
            "Please provide a valid business email"
        )
        .normalizeEmail(),

    body("businessPhone")
        .trim()
        .notEmpty()
        .withMessage("Business phone is required")
        .matches(INDIAN_PHONE_REGEX)
        .withMessage(
            "Please provide a valid 10-digit Indian phone number"
        ),

    // -------------------------------------------------
    // ADDRESS
    // -------------------------------------------------

    body("address")
        .notEmpty()
        .withMessage("Business address is required")
        .custom(isValidObject),

    body("address.addressLine1")
        .trim()
        .notEmpty()
        .withMessage(
            "Address line 1 is required"
        )
        .isLength({
            max: 200,
        })
        .withMessage(
            "Address line 1 cannot exceed 200 characters"
        ),

    body("address.addressLine2")
        .optional()
        .trim()
        .isLength({
            max: 200,
        })
        .withMessage(
            "Address line 2 cannot exceed 200 characters"
        ),

    body("address.city")
        .trim()
        .notEmpty()
        .withMessage("City is required")
        .isLength({
            max: 100,
        })
        .withMessage(
            "City cannot exceed 100 characters"
        ),

    body("address.state")
        .trim()
        .notEmpty()
        .withMessage("State is required")
        .isLength({
            max: 100,
        })
        .withMessage(
            "State cannot exceed 100 characters"
        ),

    body("address.country")
        .optional()
        .trim()
        .isLength({
            max: 100,
        })
        .withMessage(
            "Country cannot exceed 100 characters"
        ),

    body("address.postalCode")
        .trim()
        .notEmpty()
        .withMessage("Postal code is required")
        .matches(POSTAL_CODE_REGEX)
        .withMessage(
            "Please provide a valid 6-digit postal code"
        ),

    // -------------------------------------------------
    // TAX INFORMATION
    // -------------------------------------------------

    body("gstNumber")
        .optional({ checkFalsy: true })
        .trim()
        .toUpperCase()
        .matches(GST_REGEX)
        .withMessage(
            "Please provide a valid GST number"
        ),

    body("panNumber")
        .trim()
        .notEmpty()
        .withMessage("PAN number is required")
        .toUpperCase()
        .matches(PAN_REGEX)
        .withMessage(
            "Please provide a valid PAN number"
        ),

    // -------------------------------------------------
    // BANK DETAILS
    // -------------------------------------------------

    body("bankDetails")
        .notEmpty()
        .withMessage("Bank details are required")
        .custom(isValidObject),

    body("bankDetails.accountHolderName")
        .trim()
        .notEmpty()
        .withMessage(
            "Account holder name is required"
        )
        .isLength({
            min: 2,
            max: 200,
        })
        .withMessage(
            "Account holder name must be between 2 and 200 characters"
        ),

    body("bankDetails.accountNumber")
        .trim()
        .notEmpty()
        .withMessage(
            "Bank account number is required"
        )
        .toUpperCase()
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage(
            "Please provide a valid bank account number"
        ),

    body("bankDetails.ifscCode")
        .trim()
        .notEmpty()
        .withMessage("IFSC code is required")
        .toUpperCase()
        .matches(IFSC_REGEX)
        .withMessage(
            "Please provide a valid IFSC code"
        ),

    body("bankDetails.bankName")
        .optional()
        .trim()
        .isLength({
            max: 200,
        })
        .withMessage(
            "Bank name cannot exceed 200 characters"
        ),
];

// =====================================================
// UPDATE SELLER VALIDATION
// =====================================================

const updateSellerValidation = [

    body()
        .custom((value, { req }) => {
            const allowedFields = [
                "businessName",
                "businessDescription",
                "businessType",
                "businessEmail",
                "businessPhone",
                "address",
                "gstNumber",
                "panNumber",
                "bankDetails",
            ];

            const hasValidField =
                allowedFields.some(
                    (field) =>
                        req.body[field] !== undefined
                );

            if (!hasValidField) {
                throw new Error(
                    "At least one valid field is required for update"
                );
            }

            return true;
        }),

    // -------------------------------------------------
    // BUSINESS INFORMATION
    // -------------------------------------------------

    body("businessName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Business name cannot be empty"
        )
        .isLength({
            min: 2,
            max: 200,
        })
        .withMessage(
            "Business name must be between 2 and 200 characters"
        ),

    body("businessDescription")
        .optional()
        .trim()
        .isLength({
            max: 2000,
        })
        .withMessage(
            "Business description cannot exceed 2000 characters"
        ),

    body("businessType")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Business type cannot be empty"
        )
        .isIn(BUSINESS_TYPES)
        .withMessage(
            "Invalid business type"
        ),

    body("businessEmail")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Business email cannot be empty"
        )
        .isEmail()
        .withMessage(
            "Please provide a valid business email"
        )
        .normalizeEmail(),

    body("businessPhone")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Business phone cannot be empty"
        )
        .matches(INDIAN_PHONE_REGEX)
        .withMessage(
            "Please provide a valid 10-digit Indian phone number"
        ),

    // -------------------------------------------------
    // ADDRESS
    // -------------------------------------------------

    body("address")
        .optional()
        .custom(isValidObject),

    body("address.addressLine1")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Address line 1 cannot be empty"
        )
        .isLength({
            max: 200,
        })
        .withMessage(
            "Address line 1 cannot exceed 200 characters"
        ),

    body("address.addressLine2")
        .optional()
        .trim()
        .isLength({
            max: 200,
        })
        .withMessage(
            "Address line 2 cannot exceed 200 characters"
        ),

    body("address.city")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "City cannot be empty"
        )
        .isLength({
            max: 100,
        })
        .withMessage(
            "City cannot exceed 100 characters"
        ),

    body("address.state")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "State cannot be empty"
        )
        .isLength({
            max: 100,
        })
        .withMessage(
            "State cannot exceed 100 characters"
        ),

    body("address.country")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Country cannot be empty"
        )
        .isLength({
            max: 100,
        })
        .withMessage(
            "Country cannot exceed 100 characters"
        ),

    body("address.postalCode")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Postal code cannot be empty"
        )
        .matches(POSTAL_CODE_REGEX)
        .withMessage(
            "Please provide a valid 6-digit postal code"
        ),

    // -------------------------------------------------
    // TAX INFORMATION
    // -------------------------------------------------

    body("gstNumber")
        .optional()
        .trim()
        .toUpperCase()
        .custom((value) => {
            if (!value) {
                return true;
            }

            if (!GST_REGEX.test(value)) {
                throw new Error(
                    "Please provide a valid GST number"
                );
            }

            return true;
        }),

    body("panNumber")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "PAN number cannot be empty"
        )
        .toUpperCase()
        .matches(PAN_REGEX)
        .withMessage(
            "Please provide a valid PAN number"
        ),

    // -------------------------------------------------
    // BANK DETAILS
    // -------------------------------------------------

    body("bankDetails")
        .optional()
        .custom(isValidObject),

    body("bankDetails.accountHolderName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Account holder name cannot be empty"
        )
        .isLength({
            min: 2,
            max: 200,
        })
        .withMessage(
            "Account holder name must be between 2 and 200 characters"
        ),

    body("bankDetails.accountNumber")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Bank account number cannot be empty"
        )
        .toUpperCase()
        .matches(ACCOUNT_NUMBER_REGEX)
        .withMessage(
            "Please provide a valid bank account number"
        ),

    body("bankDetails.ifscCode")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "IFSC code cannot be empty"
        )
        .toUpperCase()
        .matches(IFSC_REGEX)
        .withMessage(
            "Please provide a valid IFSC code"
        ),

    body("bankDetails.bankName")
        .optional()
        .trim()
        .isLength({
            max: 200,
        })
        .withMessage(
            "Bank name cannot exceed 200 characters"
        ),
];

// =====================================================
// ADMIN VALIDATIONS
// =====================================================

const approveSellerValidation = [
    ...sellerIdValidation,
];

const rejectSellerValidation = [

    ...sellerIdValidation,

    body("rejectionReason")
        .trim()
        .notEmpty()
        .withMessage(
            "Rejection reason is required"
        )
        .isLength({
            min: 5,
            max: 1000,
        })
        .withMessage(
            "Rejection reason must be between 5 and 1000 characters"
        ),
];

const activateSellerValidation = [
    ...sellerIdValidation,
];

const deactivateSellerValidation = [
    ...sellerIdValidation,
];

const blockSellerValidation = [

    ...sellerIdValidation,

    body("blockReason")
        .trim()
        .notEmpty()
        .withMessage(
            "Block reason is required"
        )
        .isLength({
            min: 5,
            max: 1000,
        })
        .withMessage(
            "Block reason must be between 5 and 1000 characters"
        ),
];

const unblockSellerValidation = [
    ...sellerIdValidation,
];

// =====================================================
// ADMIN - GET ALL SELLERS
// =====================================================

const getAllSellersValidation = [

    query("page")
        .optional()
        .isInt({
            min: 1,
        })
        .withMessage(
            "Page must be a positive integer"
        )
        .toInt(),

    query("limit")
        .optional()
        .isInt({
            min: 1,
            max: 100,
        })
        .withMessage(
            "Limit must be between 1 and 100"
        )
        .toInt(),

    query("status")
        .optional()
        .trim()
        .isIn([
            "pending",
            "approved",
        ])
        .withMessage(
            "Status must be pending or approved"
        ),

    query("isActive")
        .optional()
        .isBoolean()
        .withMessage(
            "isActive must be true or false"
        )
        .toBoolean(),

    query("isBlocked")
        .optional()
        .isBoolean()
        .withMessage(
            "isBlocked must be true or false"
        )
        .toBoolean(),

    query("search")
        .optional()
        .trim()
        .isLength({
            min: 1,
            max: 100,
        })
        .withMessage(
            "Search query must be between 1 and 100 characters"
        ),
];

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createSellerValidation,
    updateSellerValidation,

    sellerIdValidation,

    approveSellerValidation,
    rejectSellerValidation,

    activateSellerValidation,
    deactivateSellerValidation,

    blockSellerValidation,
    unblockSellerValidation,

    getAllSellersValidation,
};