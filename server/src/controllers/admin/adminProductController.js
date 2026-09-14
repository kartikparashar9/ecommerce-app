const Product = require("../../models/productModel");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");


// =====================================================
// GET ALL PRODUCTS - ADMIN
// GET /api/admin/products
// =====================================================

const getAllProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        seller,
        category,
        subcategory,
        brand,
        isActive,
        isFeatured,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;


    // =================================================
    // PAGINATION
    // =================================================

    const currentPage = Math.max(Number(page) || 1, 1);

    const pageLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
    );


    // =================================================
    // BASE QUERY
    // =================================================

    const query = {
        isDeleted: false,
    };


    // =================================================
    // SEARCH
    // =================================================

    if (search && search.trim()) {
        query.$or = [
            {
                name: {
                    $regex: search.trim(),
                    $options: "i",
                },
            },
            {
                slug: {
                    $regex: search.trim(),
                    $options: "i",
                },
            },
        ];
    }


    // =================================================
    // SELLER FILTER
    // =================================================

    if (seller) {
        query.seller = seller;
    }


    // =================================================
    // CATEGORY FILTER
    // =================================================

    if (category) {
        query.category = category;
    }


    // =================================================
    // SUBCATEGORY FILTER
    // =================================================

    if (subcategory) {
        query.subcategory = subcategory;
    }


    // =================================================
    // BRAND FILTER
    // =================================================

    if (brand) {
        query.brand = brand;
    }


    // =================================================
    // ACTIVE FILTER
    // =================================================

    if (isActive !== undefined) {

        if (
            !["true", "false"].includes(
                String(isActive)
            )
        ) {
            throw new ApiError(
                400,
                "isActive must be true or false"
            );
        }

        query.isActive =
            String(isActive) === "true";
    }


    // =================================================
    // FEATURED FILTER
    // =================================================

    if (isFeatured !== undefined) {

        if (
            !["true", "false"].includes(
                String(isFeatured)
            )
        ) {
            throw new ApiError(
                400,
                "isFeatured must be true or false"
            );
        }

        query.isFeatured =
            String(isFeatured) === "true";
    }


    // =================================================
    // SORTING
    // =================================================

    const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "name",
        "basePrice",
        "finalPrice",
        "totalStock",
        "totalSold",
        "averageRating",
    ];

    const safeSortBy =
        allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

    const sortDirection =
        sortOrder === "asc"
            ? 1
            : -1;


    const skip =
        (currentPage - 1) * pageLimit;


    // =================================================
    // DATABASE
    // =================================================

    const [
        products,
        totalProducts,
    ] = await Promise.all([

        Product.find(query)

            // -----------------------------------------
            // SELLER
            // -----------------------------------------

            .populate({
                path: "seller",
                select: "businessName verificationStatus isActive isBlocked",
                populate: {
                    path: "user",
                    select: "name email avatar",
                },
            })

            // -----------------------------------------
            // CATEGORY
            // -----------------------------------------

            .populate(
                "category",
                "name slug"
            )

            // -----------------------------------------
            // SUBCATEGORY
            // -----------------------------------------

            .populate(
                "subcategory",
                "name slug"
            )

            // -----------------------------------------
            // BRAND
            // -----------------------------------------

            .populate(
                "brand",
                "name slug"
            )

            .sort({
                [safeSortBy]:
                    sortDirection,
            })

            .skip(skip)

            .limit(pageLimit)

            .lean(),


        Product.countDocuments(query),
    ]);


    // =================================================
    // PAGINATION
    // =================================================

    const totalPages = Math.ceil(
        totalProducts / pageLimit
    );


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,

                pagination: {
                    totalProducts,

                    totalPages,

                    currentPage,

                    limit: pageLimit,

                    hasNextPage:
                        currentPage <
                        totalPages,

                    hasPreviousPage:
                        currentPage > 1,
                },
            },

            "Products fetched successfully"
        )
    );
});


// =====================================================
// GET SINGLE PRODUCT - ADMIN
// GET /api/admin/products/:productId
// =====================================================

const getProductById = asyncHandler(
    async (req, res) => {

        const { productId } =
            req.params;


        // =================================================
        // FIND PRODUCT
        // =================================================

        const product =
            await Product.findOne({
                _id: productId,
                isDeleted: false,
            })

                // -----------------------------------------
                // SELLER
                // -----------------------------------------

                .populate({
                    path: "seller",

                    select: `
                        businessName
                        businessType
                        businessEmail
                        businessPhone
                        verificationStatus
                        isActive
                        isBlocked
                    `,

                    populate: {
                        path: "user",

                        select: `
                            name
                            email
                            avatar
                        `,
                    },
                })

                // -----------------------------------------
                // CATEGORY
                // -----------------------------------------

                .populate(
                    "category",
                    "name slug"
                )

                // -----------------------------------------
                // SUBCATEGORY
                // -----------------------------------------

                .populate(
                    "subcategory",
                    "name slug"
                )

                // -----------------------------------------
                // BRAND
                // -----------------------------------------

                .populate(
                    "brand",
                    "name slug"
                );


        if (!product) {

            throw new ApiError(
                404,
                "Product not found"
            );
        }


        return res.status(200).json(
            new ApiResponse(
                200,

                product,

                "Product fetched successfully"
            )
        );
    }
);


// =====================================================
// ACTIVATE PRODUCT
// PATCH /api/admin/products/:productId/activate
// =====================================================

const activateProduct =
    asyncHandler(async (req, res) => {

        const { productId } =
            req.params;


        const product =
            await Product.findOne({
                _id: productId,
                isDeleted: false,
            });


        if (!product) {

            throw new ApiError(
                404,
                "Product not found"
            );
        }


        if (product.isActive) {

            throw new ApiError(
                400,
                "Product is already active"
            );
        }


        product.isActive = true;


        await product.save({
            validateBeforeSave: false,
        });


        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    productId:
                        product._id,

                    isActive:
                        product.isActive,
                },

                "Product activated successfully"
            )
        );
    });


// =====================================================
// DEACTIVATE PRODUCT
// PATCH /api/admin/products/:productId/deactivate
// =====================================================

const deactivateProduct =
    asyncHandler(async (req, res) => {

        const { productId } =
            req.params;


        const product =
            await Product.findOne({
                _id: productId,
                isDeleted: false,
            });


        if (!product) {

            throw new ApiError(
                404,
                "Product not found"
            );
        }


        if (!product.isActive) {

            throw new ApiError(
                400,
                "Product is already inactive"
            );
        }


        product.isActive = false;


        await product.save({
            validateBeforeSave: false,
        });


        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    productId:
                        product._id,

                    isActive:
                        product.isActive,
                },

                "Product deactivated successfully"
            )
        );
    });


// =====================================================
// FEATURE PRODUCT
// PATCH /api/admin/products/:productId/feature
// =====================================================

const featureProduct =
    asyncHandler(async (req, res) => {

        const { productId } =
            req.params;


        const product =
            await Product.findOne({
                _id: productId,
                isDeleted: false,
            });


        if (!product) {

            throw new ApiError(
                404,
                "Product not found"
            );
        }


        if (product.isFeatured) {

            throw new ApiError(
                400,
                "Product is already featured"
            );
        }


        product.isFeatured = true;


        await product.save({
            validateBeforeSave: false,
        });


        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    productId:
                        product._id,

                    isFeatured:
                        product.isFeatured,
                },

                "Product featured successfully"
            )
        );
    });


// =====================================================
// UNFEATURE PRODUCT
// PATCH /api/admin/products/:productId/unfeature
// =====================================================

const unfeatureProduct =
    asyncHandler(async (req, res) => {

        const { productId } =
            req.params;


        const product =
            await Product.findOne({
                _id: productId,
                isDeleted: false,
            });


        if (!product) {

            throw new ApiError(
                404,
                "Product not found"
            );
        }


        if (!product.isFeatured) {

            throw new ApiError(
                400,
                "Product is not featured"
            );
        }


        product.isFeatured = false;


        await product.save({
            validateBeforeSave: false,
        });


        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    productId:
                        product._id,

                    isFeatured:
                        product.isFeatured,
                },

                "Product removed from featured successfully"
            )
        );
    });


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAllProducts,

    getProductById,

    activateProduct,

    deactivateProduct,

    featureProduct,

    unfeatureProduct,

};