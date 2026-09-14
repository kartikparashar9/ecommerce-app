const ApiError = require("../utils/ApiError");

const resetPasswordValidator = (req, res, next) => {
    const {
        otp,
        newPassword,
        confirmPassword
    } = req.body;

    if (!otp) {
        throw new ApiError(
            400,
            "OTP is required"
        );
    }

    if (!/^\d{6}$/.test(otp)) {
        throw new ApiError(
            400,
            "Invalid OTP"
        );
    }

    if (!newPassword) {
        throw new ApiError(
            400,
            "New password is required"
        );
    }

    if (newPassword.length < 6) {
        throw new ApiError(
            400,
            "Password must be at least 6 characters"
        );
    }

    if (!confirmPassword) {
        throw new ApiError(
            400,
            "Confirm password is required"
        );
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(
            400,
            "Passwords do not match"
        );
    }

    next();
};

module.exports = resetPasswordValidator;