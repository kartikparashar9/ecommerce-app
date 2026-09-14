const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// Validate Date
// -----------------------------------------------------

const isValidDate = (value) => {
    if (!value) {
        return true;
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime());
};

// -----------------------------------------------------
// Validate Date Range
// -----------------------------------------------------

const validateDateRange = (
    req,
    res,
    next
) => {
    try {
        const {
            startDate,
            endDate,
        } = req.query;

        // ---------------------------------------------
        // Start Date
        // ---------------------------------------------

        if (
            startDate &&
            !isValidDate(startDate)
        ) {
            throw new ApiError(
                400,
                "Invalid start date"
            );
        }

        // ---------------------------------------------
        // End Date
        // ---------------------------------------------

        if (
            endDate &&
            !isValidDate(endDate)
        ) {
            throw new ApiError(
                400,
                "Invalid end date"
            );
        }

        // ---------------------------------------------
        // Date Range
        // ---------------------------------------------

        if (
            startDate &&
            endDate
        ) {
            const start =
                new Date(startDate);

            const end =
                new Date(endDate);

            if (end < start) {
                throw new ApiError(
                    400,
                    "End date cannot be before start date"
                );
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// VALIDATE GROUP BY
// =====================================================

const validateGroupBy = (
    req,
    res,
    next
) => {
    try {
        const {
            groupBy,
        } = req.query;

        if (!groupBy) {
            return next();
        }

        const allowedValues = [
            "daily",
            "monthly",
        ];

        if (
            !allowedValues.includes(
                String(groupBy).toLowerCase()
            )
        ) {
            throw new ApiError(
                400,
                "groupBy must be daily or monthly"
            );
        }

        req.query.groupBy =
            String(groupBy).toLowerCase();

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// VALIDATE LIMIT
// =====================================================

const validateLimit = (
    req,
    res,
    next
) => {
    try {
        const {
            limit,
        } = req.query;

        if (
            limit === undefined ||
            limit === ""
        ) {
            return next();
        }

        const numericLimit =
            Number(limit);

        if (
            !Number.isInteger(
                numericLimit
            ) ||
            numericLimit < 1 ||
            numericLimit > 100
        ) {
            throw new ApiError(
                400,
                "Limit must be an integer between 1 and 100"
            );
        }

        req.query.limit =
            numericLimit;

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// DATE RANGE ANALYTICS VALIDATOR
// =====================================================

const validateAnalyticsDateRange = (
    req,
    res,
    next
) => {
    validateDateRange(
        req,
        res,
        (error) => {
            if (error) {
                return next(error);
            }

            next();
        }
    );
};

// =====================================================
// SALES / USER TRENDS VALIDATOR
// =====================================================

const validateTrendAnalytics = (
    req,
    res,
    next
) => {
    validateDateRange(
        req,
        res,
        (dateError) => {
            if (dateError) {
                return next(dateError);
            }

            validateGroupBy(
                req,
                res,
                next
            );
        }
    );
};

// =====================================================
// TOP PRODUCTS / SELLERS VALIDATOR
// =====================================================

const validateTopAnalytics = (
    req,
    res,
    next
) => {
    validateDateRange(
        req,
        res,
        (dateError) => {
            if (dateError) {
                return next(dateError);
            }

            validateLimit(
                req,
                res,
                next
            );
        }
    );
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateDateRange,
    validateGroupBy,
    validateLimit,
    validateAnalyticsDateRange,
    validateTrendAnalytics,
    validateTopAnalytics,
};