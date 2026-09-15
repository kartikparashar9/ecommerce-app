const errorMiddleware = (err, req, res, next) => {
  console.error("ERROR:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // =====================================================
  // MONGOOSE / MONGODB CONNECTION & BUFFERING ERRORS
  // Don't expose internal database details to frontend
  // =====================================================

  if (
    err.name === "MongooseError" ||
    err.name === "MongoServerError" ||
    err.name === "MongoNetworkError" ||
    err.name === "MongoTimeoutError" ||
    err.message?.includes("buffering timed out") ||
    err.message?.includes("MongoServerSelectionError") ||
    err.message?.includes("ECONNREFUSED")
  ) {
    statusCode = 503;
    message = "Service temporarily unavailable. Please try again later.";
  }

  // =====================================================
  // MONGOOSE VALIDATION ERROR
  // =====================================================
  else if (err.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  }

  // =====================================================
  // DUPLICATE KEY ERROR
  // =====================================================
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];

    statusCode = 409;
    message = field
      ? `${field} already exists`
      : "Duplicate value already exists";
  }

  // =====================================================
  // INVALID OBJECT ID
  // =====================================================
  else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id";
  }

  // =====================================================
  // UNKNOWN INTERNAL ERROR
  // Don't expose internal implementation details
  // =====================================================
  else if (statusCode >= 500) {
    statusCode = 500;
    message = "Internal server error. Please try again later.";
  }

  // =====================================================
  // RESPONSE
  // =====================================================

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};

module.exports = errorMiddleware;
