const ApiError = require("../utils/ApiError");

const signupValidator = (req, res, next) => {
    const {
        name,
        email,
        phone,
        password,
        gender
    } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(400, "Name is required");
    }

    if (!email || !email.trim()) {
        throw new ApiError(400, "Email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email");
    }

    if (!phone || !phone.trim()) {
        throw new ApiError(400, "Phone number is required");
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
        throw new ApiError(400, "Invalid phone number");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    if (!gender) {
        throw new ApiError(400, "Gender is required");
    }

    if (!["male", "female"].includes(gender)) {
        throw new ApiError(400, "Invalid gender");
    }

    next();
};

module.exports = signupValidator;