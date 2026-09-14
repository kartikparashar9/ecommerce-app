const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        statusCode = 409;
        message = `${field} already exists`;
    }

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid resource id";
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
};

module.exports = errorMiddleware;