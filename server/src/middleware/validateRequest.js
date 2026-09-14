const { validationResult } = require("express-validator");

const ApiError = require("../utils/ApiError");

// =====================================================
// VALIDATE REQUEST MIDDLEWARE
// =====================================================

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((error) => ({
            field: error.path,
            message: error.msg,
        }));

        const errorMessage = formattedErrors
            .map((error) => `${error.field}: ${error.message}`)
            .join(" | ");

        return next(
            new ApiError(
                400,
                errorMessage
            )
        );
    }

    next();
};

module.exports = validateRequest;