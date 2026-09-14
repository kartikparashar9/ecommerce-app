const ApiError = require("../utils/ApiError");

const loginValidator = (req, res, next) => {
    const {
        email,
        phone,
        password
    } = req.body;

    if (!email && !phone) {
        throw new ApiError(
            400,
            "Email or phone number is required"
        );
    }

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new ApiError(
                400,
                "Invalid email"
            );
        }
    }

    if (phone) {
        const phoneRegex = /^[6-9]\d{9}$/;

        if (!phoneRegex.test(phone)) {
            throw new ApiError(
                400,
                "Invalid phone number"
            );
        }
    }

    if (!password) {
        throw new ApiError(
            400,
            "Password is required"
        );
    }

    next();
};

module.exports = loginValidator;