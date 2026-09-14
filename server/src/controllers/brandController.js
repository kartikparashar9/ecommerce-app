const Brand = require("../models/brandModel");

const asyncHandler = require(
    "../utils/asyncHandler"
);

const ApiError = require(
    "../utils/ApiError"
);

const ApiResponse = require(
    "../utils/ApiResponse"
);

const fs = require("fs");
const path = require("path");

// =====================================================
// SLUG GENERATOR
// =====================================================

const generateSlug = (name) => {
    return name
        .toString()
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9\s-]/g,
            ""
        )
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );
};

// =====================================================
// UNIQUE SLUG
// =====================================================

const generateUniqueSlug = async (
    name,
    excludeId = null
) => {
    const baseSlug =
        generateSlug(name);

    if (!baseSlug) {
        throw new ApiError(
            400,
            "Unable to generate valid slug from brand name"
        );
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const query = {
            slug,
        };

        if (excludeId) {
            query._id = {
                $ne: excludeId,
            };
        }

        const existingBrand =
            await Brand.findOne(query);

        if (!existingBrand) {
            return slug;
        }

        slug =
            `${baseSlug}-${counter}`;

        counter++;
    }
};

// =====================================================
// DELETE LOCAL LOGO
// =====================================================

const deleteLocalLogo = (
    logoPath
) => {
    if (
        !logoPath ||
        typeof logoPath !== "string"
    ) {
        return;
    }

    if (
        !logoPath.startsWith(
            "/brands/"
        )
    ) {
        return;
    }

    const filename =
        path.basename(logoPath);

    const fullPath =
        path.join(
            __dirname,
            "../../public/brands",
            filename
        );

    if (fs.existsSync(fullPath)) {
        fs.unlink(
            fullPath,
            (error) => {
                if (error) {
                    console.error(
                        "Failed to delete old brand logo:",
                        error
                    );
                }
            }
        );
    }
};

// =====================================================
// CREATE BRAND
// =====================================================

const createBrand =
    asyncHandler(
        async (req, res) => {
            const {
                name,
                slug,
                description,
                website,
            } = req.body;

            const trimmedName =
                name.trim();

            // -----------------------------------------
            // DUPLICATE NAME
            // -----------------------------------------

            const existingName =
                await Brand.findOne({
                    name: {
                        $regex:
                            `^${trimmedName}$`,
                        $options: "i",
                    },
                });

            if (existingName) {
                throw new ApiError(
                    409,
                    "Brand with this name already exists"
                );
            }

            // -----------------------------------------
            // SLUG
            // -----------------------------------------

            let finalSlug;

            if (
                slug &&
                slug.trim()
            ) {
                finalSlug =
                    generateSlug(
                        slug
                    );

                if (!finalSlug) {
                    throw new ApiError(
                        400,
                        "Invalid brand slug"
                    );
                }

                const existingSlug =
                    await Brand.findOne({
                        slug: finalSlug,
                    });

                if (existingSlug) {
                    throw new ApiError(
                        409,
                        "Brand with this slug already exists"
                    );
                }
            } else {
                finalSlug =
                    await generateUniqueSlug(
                        trimmedName
                    );
            }

            // -----------------------------------------
            // LOGO
            // -----------------------------------------

            if (!req.file) {
                throw new ApiError(
                    400,
                    "Brand logo is required"
                );
            }

            const logoPath =
                `/brands/${req.file.filename}`;

            // -----------------------------------------
            // CREATE
            // -----------------------------------------

            const brand =
                await Brand.create({
                    name: trimmedName,

                    slug: finalSlug,

                    description:
                        description?.trim() ||
                        "",

                    logo: logoPath,

                    website:
                        website?.trim() ||
                        "",

                    isActive: true,

                    createdBy:
                        req.user._id,
                });

            return res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        brand,
                        "Brand created successfully"
                    )
                );
        }
    );

// =====================================================
// GET ALL BRANDS
// =====================================================

const getAllBrands =
    asyncHandler(
        async (req, res) => {
            const {
                page = 1,
                limit = 10,
                search = "",
                isActive,
            } = req.query;

            const pageNumber =
                Math.max(
                    Number(page),
                    1
                );

            const limitNumber =
                Math.min(
                    Math.max(
                        Number(limit),
                        1
                    ),
                    100
                );

            const skip =
                (pageNumber - 1) *
                limitNumber;

            const query = {};

            if (
                search &&
                search.trim()
            ) {
                const searchValue =
                    search.trim();

                query.$or = [
                    {
                        name: {
                            $regex:
                                searchValue,
                            $options:
                                "i",
                        },
                    },
                    {
                        slug: {
                            $regex:
                                searchValue,
                            $options:
                                "i",
                        },
                    },
                ];
            }

            if (
                isActive !==
                undefined
            ) {
                if (
                    isActive ===
                    "true"
                ) {
                    query.isActive =
                        true;
                }

                if (
                    isActive ===
                    "false"
                ) {
                    query.isActive =
                        false;
                }
            }

            const [
                brands,
                totalBrands,
            ] = await Promise.all([
                Brand.find(query)
                    .populate(
                        "createdBy",
                        "name email role"
                    )
                    .sort({
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(
                        limitNumber
                    )
                    .lean(),

                Brand.countDocuments(
                    query
                ),
            ]);

            const totalPages =
                Math.ceil(
                    totalBrands /
                        limitNumber
                );

            const data = {
                brands,

                pagination: {
                    currentPage:
                        pageNumber,

                    limit:
                        limitNumber,

                    totalBrands,

                    totalPages,

                    hasNextPage:
                        pageNumber <
                        totalPages,

                    hasPreviousPage:
                        pageNumber > 1,
                },
            };

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        data,
                        "Brands fetched successfully"
                    )
                );
        }
    );

// =====================================================
// GET ACTIVE BRANDS
// =====================================================

const getActiveBrands =
    asyncHandler(
        async (req, res) => {
            const brands =
                await Brand.find({
                    isActive: true,
                })
                    .sort({
                        name: 1,
                    })
                    .lean();

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        brands,
                        "Active brands fetched successfully"
                    )
                );
        }
    );

// =====================================================
// GET BRAND BY ID
// =====================================================

const getBrandById =
    asyncHandler(
        async (req, res) => {
            const {
                brandId,
            } = req.params;

            const brand =
                await Brand.findById(
                    brandId
                )
                    .populate(
                        "createdBy",
                        "name email role"
                    )
                    .lean();

            if (!brand) {
                throw new ApiError(
                    404,
                    "Brand not found"
                );
            }

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        brand,
                        "Brand fetched successfully"
                    )
                );
        }
    );

// =====================================================
// GET BRAND BY SLUG
// =====================================================

const getBrandBySlug =
    asyncHandler(
        async (req, res) => {
            const {
                slug,
            } = req.params;

            const brand =
                await Brand.findOne({
                    slug:
                        slug.toLowerCase(),
                })
                    .populate(
                        "createdBy",
                        "name email role"
                    )
                    .lean();

            if (!brand) {
                throw new ApiError(
                    404,
                    "Brand not found"
                );
            }

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        brand,
                        "Brand fetched successfully"
                    )
                );
        }
    );

// =====================================================
// UPDATE BRAND
// =====================================================

const updateBrand =
    asyncHandler(
        async (req, res) => {
            const {
                brandId,
            } = req.params;

            const {
                name,
                slug,
                description,
                website,
                isActive,
            } = req.body;

            const brand =
                await Brand.findById(
                    brandId
                );

            if (!brand) {
                throw new ApiError(
                    404,
                    "Brand not found"
                );
            }

            // -----------------------------------------
            // NAME
            // -----------------------------------------

            if (
                name !== undefined
            ) {
                const trimmedName =
                    name.trim();

                const duplicateName =
                    await Brand.findOne({
                        name: {
                            $regex:
                                `^${trimmedName}$`,
                            $options:
                                "i",
                        },

                        _id: {
                            $ne: brandId,
                        },
                    });

                if (
                    duplicateName
                ) {
                    throw new ApiError(
                        409,
                        "Another brand with this name already exists"
                    );
                }

                brand.name =
                    trimmedName;

                // Generate slug only
                // when slug wasn't explicitly sent
                if (
                    slug ===
                    undefined
                ) {
                    brand.slug =
                        await generateUniqueSlug(
                            trimmedName,
                            brandId
                        );
                }
            }

            // -----------------------------------------
            // SLUG
            // -----------------------------------------

            if (
                slug !== undefined
            ) {
                const finalSlug =
                    generateSlug(
                        slug
                    );

                if (!finalSlug) {
                    throw new ApiError(
                        400,
                        "Invalid slug"
                    );
                }

                const duplicateSlug =
                    await Brand.findOne({
                        slug:
                            finalSlug,

                        _id: {
                            $ne: brandId,
                        },
                    });

                if (
                    duplicateSlug
                ) {
                    throw new ApiError(
                        409,
                        "Another brand with this slug already exists"
                    );
                }

                brand.slug =
                    finalSlug;
            }

            // -----------------------------------------
            // DESCRIPTION
            // -----------------------------------------

            if (
                description !==
                undefined
            ) {
                brand.description =
                    description.trim();
            }

            // -----------------------------------------
            // WEBSITE
            // -----------------------------------------

            if (
                website !==
                undefined
            ) {
                brand.website =
                    website.trim();
            }

            // -----------------------------------------
            // ACTIVE STATUS
            // -----------------------------------------

            if (
                isActive !==
                undefined
            ) {
                brand.isActive =
                    isActive ===
                    "true"
                        ? true
                        : isActive ===
                          "false"
                        ? false
                        : isActive;
            }

            // -----------------------------------------
            // NEW LOGO
            // -----------------------------------------

            let oldLogo = null;

            if (req.file) {
                oldLogo =
                    brand.logo;

                brand.logo =
                    `/brands/${req.file.filename}`;
            }

            // -----------------------------------------
            // SAVE
            // -----------------------------------------

            await brand.save();

            // -----------------------------------------
            // DELETE OLD LOGO
            // ONLY AFTER SUCCESSFUL SAVE
            // -----------------------------------------

            if (
                req.file &&
                oldLogo &&
                oldLogo !==
                    brand.logo
            ) {
                deleteLocalLogo(
                    oldLogo
                );
            }

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        brand,
                        "Brand updated successfully"
                    )
                );
        }
    );

// =====================================================
// TOGGLE STATUS
// =====================================================

const toggleBrandStatus =
    asyncHandler(
        async (req, res) => {
            const {
                brandId,
            } = req.params;

            const brand =
                await Brand.findById(
                    brandId
                );

            if (!brand) {
                throw new ApiError(
                    404,
                    "Brand not found"
                );
            }

            brand.isActive =
                !brand.isActive;

            await brand.save();

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        brand,
                        `Brand ${
                            brand.isActive
                                ? "activated"
                                : "deactivated"
                        } successfully`
                    )
                );
        }
    );

// =====================================================
// DELETE BRAND
// =====================================================

const deleteBrand =
    asyncHandler(
        async (req, res) => {
            const {
                brandId,
            } = req.params;

            const brand =
                await Brand.findById(
                    brandId
                );

            if (!brand) {
                throw new ApiError(
                    404,
                    "Brand not found"
                );
            }

            const logo =
                brand.logo;

            await Brand.deleteOne({
                _id: brandId,
            });

            if (logo) {
                deleteLocalLogo(
                    logo
                );
            }

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        null,
                        "Brand deleted successfully"
                    )
                );
        }
    );

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createBrand,
    getAllBrands,
    getActiveBrands,
    getBrandById,
    getBrandBySlug,
    updateBrand,
    toggleBrandStatus,
    deleteBrand,
};