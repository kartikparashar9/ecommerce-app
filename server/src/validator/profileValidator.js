const ApiError = require("../utils/ApiError");

const updateProfileValidator = (req, res, next) => {
    const {
        name,
        gender,
        avatar
    } = req.body;

    if (name && !name.trim()) {
        throw new ApiError(
            400,
            "Name cannot be empty"
        );
    }

    if (gender && !["male", "female"].includes(gender)) {
        throw new ApiError(
            400,
            "Invalid gender"
        );
    }

    if (avatar && typeof avatar !== "string") {
        throw new ApiError(
            400,
            "Invalid avatar"
        );
    }

    next();
};


const changePasswordValidator = (req, res, next) => {
    const {
        oldPassword,
        newPassword
    } = req.body;

    if (!oldPassword) {
        throw new ApiError(
            400,
            "Old password is required"
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

    next();
};


const changeEmailValidator = (req, res, next) => {
    const {
        newEmail,
    } = req.body;

    if (!newEmail) {
        throw new ApiError(
            400,
            "New email are required"
        );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(newEmail)) {
        throw new ApiError(
            400,
            "Invalid email"
        );
    }

    next();
};


const changePhoneValidator = (req, res, next) => {
    const {
        newPhone,
        password
    } = req.body;

    if (!newPhone) {
        throw new ApiError(
            400,
            "New phone are required"
        );
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(newPhone)) {
        throw new ApiError(
            400,
            "Invalid phone number"
        );
    }

    next();
};


const deleteAccountValidator = (req, res, next) => {
    const {
        password
    } = req.body;

    if (!password) {
        throw new ApiError(
            400,
            "Password is required"
        );
    }

    next();
};


module.exports = {
    updateProfileValidator,
    changePasswordValidator,
    changeEmailValidator,
    changePhoneValidator,
    deleteAccountValidator
};