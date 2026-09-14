const User = require("../models/userModel");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const {
    verifyAccessToken
} = require("../utils/jwt");


const authMiddleware = asyncHandler(async (req, res, next) => {

    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(
            401,
            "Authorization token required"
        );
    }


    const token = authHeader.split(" ")[1];


    if (!token) {
        throw new ApiError(
            401,
            "Invalid token format"
        );
    }


    const decoded = verifyAccessToken(
        token
    );


    const user = await User.findById(
        decoded.id
    ).select("-password");


    if (!user) {
        throw new ApiError(
            401,
            "User not found"
        );
    }


    // Blocked accounts remain readable but cannot perform
    // authenticated write/delete actions.
    const isReadOnlyMethod = [
        "GET",
        "HEAD",
        "OPTIONS",
    ].includes(req.method);

    if (user.isBlocked && !isReadOnlyMethod) {
        throw new ApiError(
            403,
            "Account is blocked. Your account is read-only."
        );
    }


    req.user = user;

    next();

});


module.exports = authMiddleware;