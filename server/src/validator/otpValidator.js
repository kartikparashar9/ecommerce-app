const ApiError = require("../utils/ApiError");

const signupOTPValidator = (req, res, next) => {
    const {
        emailOTP
    } = req.body;

    if (!emailOTP) {
        throw new ApiError(
            400,
            "Email OTP is required"
        );
    }

    if (!/^\d{6}$/.test(emailOTP)) {
        throw new ApiError(
            400,
            "Email OTP must be 6 digits"
        );
    }

    next();
};

module.exports = signupOTPValidator;