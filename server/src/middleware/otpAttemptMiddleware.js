const {
    checkOTPAttempt
} = require("../services/otpAttemptService");

const ApiError = require("../utils/ApiError");

const otpAttemptLimit = (req, res, next) => {
    try {
        const key = req.body.email || req.body.phone;

        if (key) {
            checkOTPAttempt(key);
        }

        next();

    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message
        );
    }
};

module.exports = otpAttemptLimit;