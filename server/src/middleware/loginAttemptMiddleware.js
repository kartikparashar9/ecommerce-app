const {
    checkLoginAttempt
} = require("../services/loginAttemptService");

const ApiError = require("../utils/ApiError");

const loginAttemptLimit = (req, res, next) => {
    try {
        const key = req.body.email || req.body.phone;

        if (key) {
            checkLoginAttempt(key);
        }

        next();
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message
        );
    }
};

module.exports = loginAttemptLimit;