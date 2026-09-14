const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const isValidString = (value) => {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
};

const isPlainObject = (value) => {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
};

// =====================================================
// ALLOWED PRODUCT FIELDS
// =====================================================

const allowedProductFields = new Set([
    "name",
    "description",
    "shortDescription",
    "category",
    "subcategory",
    "brand",
    "images",
    "basePrice",
    "discount",
    "lowStockThreshold",
    "variants",
    "attributes",
    "isActive",
]);

// =====================================================
// UNKNOWN FIELD VALIDATION
// =====================================================

const validateAllowedFields = (body) => {
    const fields = Object.keys(body);

    for (const field of fields) {
        if (
            !allowedProductFields.has(field)
        ) {
            throw new ApiError(
                400,
                `Invalid product field: ${field}`
            );
        }
    }
};

// =====================================================
// IMAGE URL VALIDATION
// =====================================================

const validateImages = (images) => {
    if (images === undefined) {
        return;
    }

    if (!Array.isArray(images)) {
        throw new ApiError(
            400,
            "Images must be an array"
        );
    }

    if (images.length > 10) {
        throw new ApiError(
            400,
            "Product cannot have more than 10 images"
        );
    }

    for (const image of images) {
        if (!isValidString(image)) {
            throw new ApiError(
                400,
                "Every product image must be a valid string"
            );
        }

        const imageUrl =
            image.trim();

        if (imageUrl.length > 1000) {
            throw new ApiError(
                400,
                "Product image URL cannot exceed 1000 characters"
            );
        }
    }
};

// =====================================================
// VARIANT VALIDATION
// =====================================================

const validateVariants = (
    variants
) => {
    if (variants === undefined) {
        return;
    }

    if (!Array.isArray(variants)) {
        throw new ApiError(
            400,
            "Variants must be an array"
        );
    }

    if (variants.length > 100) {
        throw new ApiError(
            400,
            "A product cannot have more than 100 variants"
        );
    }

    const skuSet = new Set();

    variants.forEach(
        (variant, index) => {
            const variantNumber =
                index + 1;

            // -----------------------------------------
            // Variant object
            // -----------------------------------------

            if (
                !isPlainObject(variant)
            ) {
                throw new ApiError(
                    400,
                    `Variant ${variantNumber} must be a valid object`
                );
            }

            // -----------------------------------------
            // Allowed variant fields
            // -----------------------------------------

            const allowedVariantFields = [
                "sku",
                "color",
                "size",
                "price",
                "stock",
                "image",
                "isActive",
            ];

            Object.keys(
                variant
            ).forEach((field) => {
                if (
                    !allowedVariantFields.includes(
                        field
                    )
                ) {
                    throw new ApiError(
                        400,
                        `Invalid variant field "${field}" in variant ${variantNumber}`
                    );
                }
            });

            // -----------------------------------------
            // SKU
            // -----------------------------------------

            if (
                !isValidString(
                    variant.sku
                )
            ) {
                throw new ApiError(
                    400,
                    `SKU is required for variant ${variantNumber}`
                );
            }

            const sku =
                variant.sku
                    .trim()
                    .toUpperCase();

            if (
                sku.length < 2 ||
                sku.length > 100
            ) {
                throw new ApiError(
                    400,
                    `SKU of variant ${variantNumber} must be between 2 and 100 characters`
                );
            }

            if (
                skuSet.has(sku)
            ) {
                throw new ApiError(
                    409,
                    `Duplicate SKU found: ${sku}`
                );
            }

            skuSet.add(sku);

            // -----------------------------------------
            // Color
            // -----------------------------------------

            if (
                variant.color !==
                    undefined &&
                typeof variant.color !==
                    "string"
            ) {
                throw new ApiError(
                    400,
                    `Color of variant ${variantNumber} must be a string`
                );
            }

            if (
                typeof variant.color ===
                    "string" &&
                variant.color.trim()
                    .length > 100
            ) {
                throw new ApiError(
                    400,
                    `Color of variant ${variantNumber} cannot exceed 100 characters`
                );
            }

            // -----------------------------------------
            // Size
            // -----------------------------------------

            if (
                variant.size !==
                    undefined &&
                typeof variant.size !==
                    "string"
            ) {
                throw new ApiError(
                    400,
                    `Size of variant ${variantNumber} must be a string`
                );
            }

            if (
                typeof variant.size ===
                    "string" &&
                variant.size.trim()
                    .length > 100
            ) {
                throw new ApiError(
                    400,
                    `Size of variant ${variantNumber} cannot exceed 100 characters`
                );
            }

            // -----------------------------------------
            // Price
            // -----------------------------------------

            if (
                variant.price ===
                    undefined ||
                variant.price === null ||
                variant.price === ""
            ) {
                throw new ApiError(
                    400,
                    `Price is required for variant ${variantNumber}`
                );
            }

            const price =
                Number(
                    variant.price
                );

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {
                throw new ApiError(
                    400,
                    `Price of variant ${variantNumber} must be a valid non-negative number`
                );
            }

            // -----------------------------------------
            // Stock
            // -----------------------------------------

            if (
                variant.stock ===
                    undefined ||
                variant.stock === null ||
                variant.stock === ""
            ) {
                throw new ApiError(
                    400,
                    `Stock is required for variant ${variantNumber}`
                );
            }

            const stock =
                Number(
                    variant.stock
                );

            if (
                !Number.isInteger(
                    stock
                ) ||
                stock < 0
            ) {
                throw new ApiError(
                    400,
                    `Stock of variant ${variantNumber} must be a non-negative integer`
                );
            }

            // -----------------------------------------
            // Image
            // -----------------------------------------

            if (
                variant.image !==
                    undefined &&
                typeof variant.image !==
                    "string"
            ) {
                throw new ApiError(
                    400,
                    `Image of variant ${variantNumber} must be a string`
                );
            }

            if (
                typeof variant.image ===
                    "string" &&
                variant.image.trim()
                    .length > 1000
            ) {
                throw new ApiError(
                    400,
                    `Image of variant ${variantNumber} cannot exceed 1000 characters`
                );
            }

            // -----------------------------------------
            // Active
            // -----------------------------------------

            if (
                variant.isActive !==
                    undefined &&
                typeof variant.isActive !==
                    "boolean"
            ) {
                throw new ApiError(
                    400,
                    `isActive of variant ${variantNumber} must be boolean`
                );
            }
        }
    );
};

// =====================================================
// COMMON PRODUCT VALIDATION
// =====================================================

const validateCommonProductFields = (
    body
) => {
    const {
        name,
        description,
        shortDescription,
        category,
        subcategory,
        brand,
        images,
        basePrice,
        discount,
        lowStockThreshold,
        variants,
        attributes,
        isActive,
    } = body;

    // =================================================
    // NAME
    // =================================================

    if (name !== undefined) {
        if (!isValidString(name)) {
            throw new ApiError(
                400,
                "Product name must be a valid string"
            );
        }

        const trimmedName =
            name.trim();

        if (
            trimmedName.length < 2 ||
            trimmedName.length > 200
        ) {
            throw new ApiError(
                400,
                "Product name must be between 2 and 200 characters"
            );
        }
    }

    // =================================================
    // DESCRIPTION
    // =================================================

    if (
        description !== undefined
    ) {
        if (
            !isValidString(
                description
            )
        ) {
            throw new ApiError(
                400,
                "Product description must be a valid string"
            );
        }

        const trimmedDescription =
            description.trim();

        if (
            trimmedDescription.length <
                10 ||
            trimmedDescription.length >
                5000
        ) {
            throw new ApiError(
                400,
                "Product description must be between 10 and 5000 characters"
            );
        }
    }

    // =================================================
    // SHORT DESCRIPTION
    // =================================================

    if (
        shortDescription !==
        undefined
    ) {
        if (
            typeof shortDescription !==
            "string"
        ) {
            throw new ApiError(
                400,
                "Short description must be a string"
            );
        }

        if (
            shortDescription.trim()
                .length > 500
        ) {
            throw new ApiError(
                400,
                "Short description cannot exceed 500 characters"
            );
        }
    }

    // =================================================
    // CATEGORY
    // =================================================

    if (category !== undefined) {
        if (
            !isValidObjectId(category)
        ) {
            throw new ApiError(
                400,
                "Invalid category ID"
            );
        }
    }

    // =================================================
    // SUBCATEGORY
    // =================================================

    if (
        subcategory !== undefined &&
        subcategory !== null &&
        subcategory !== ""
    ) {
        if (
            !isValidObjectId(
                subcategory
            )
        ) {
            throw new ApiError(
                400,
                "Invalid subcategory ID"
            );
        }
    }

    // =================================================
    // BRAND
    // =================================================

    if (brand !== undefined) {
        if (
            !isValidObjectId(brand)
        ) {
            throw new ApiError(
                400,
                "Invalid brand ID"
            );
        }
    }

    // =================================================
    // IMAGES
    // =================================================

    if (images !== undefined) {
        validateImages(images);
    }

    // =================================================
    // BASE PRICE
    // =================================================

    if (
        basePrice !== undefined
    ) {
        if (
            basePrice === null ||
            basePrice === ""
        ) {
            throw new ApiError(
                400,
                "Base price cannot be empty"
            );
        }

        const price =
            Number(basePrice);

        if (
            !Number.isFinite(price) ||
            price < 0
        ) {
            throw new ApiError(
                400,
                "Base price must be a valid non-negative number"
            );
        }
    }

    // =================================================
    // DISCOUNT
    // =================================================

    if (
        discount !== undefined
    ) {
        if (
            discount === null ||
            discount === ""
        ) {
            throw new ApiError(
                400,
                "Discount cannot be empty"
            );
        }

        const numericDiscount =
            Number(discount);

        if (
            !Number.isFinite(
                numericDiscount
            ) ||
            numericDiscount < 0 ||
            numericDiscount > 100
        ) {
            throw new ApiError(
                400,
                "Discount must be between 0 and 100"
            );
        }
    }

    // =================================================
    // LOW STOCK THRESHOLD
    // =================================================

    if (
        lowStockThreshold !==
        undefined
    ) {
        if (
            lowStockThreshold === null ||
            lowStockThreshold === ""
        ) {
            throw new ApiError(
                400,
                "Low stock threshold cannot be empty"
            );
        }

        const threshold =
            Number(
                lowStockThreshold
            );

        if (
            !Number.isInteger(
                threshold
            ) ||
            threshold < 0
        ) {
            throw new ApiError(
                400,
                "Low stock threshold must be a non-negative integer"
            );
        }
    }

    // =================================================
    // VARIANTS
    // =================================================

    if (variants !== undefined) {
        validateVariants(
            variants
        );
    }

    // =================================================
    // ATTRIBUTES
    // =================================================

    if (
        attributes !== undefined
    ) {
        if (
            !isPlainObject(
                attributes
            )
        ) {
            throw new ApiError(
                400,
                "Attributes must be an object"
            );
        }

        const attributeKeys =
            Object.keys(
                attributes
            );

        if (
            attributeKeys.length >
            100
        ) {
            throw new ApiError(
                400,
                "A product cannot have more than 100 attributes"
            );
        }

        for (
            const key of attributeKeys
        ) {
            if (
                key.trim().length === 0
            ) {
                throw new ApiError(
                    400,
                    "Attribute name cannot be empty"
                );
            }

            if (
                key.length > 100
            ) {
                throw new ApiError(
                    400,
                    "Attribute name cannot exceed 100 characters"
                );
            }

            if (
                typeof attributes[key] !==
                "string"
            ) {
                throw new ApiError(
                    400,
                    `Attribute "${key}" must be a string`
                );
            }

            if (
                attributes[key].length >
                500
            ) {
                throw new ApiError(
                    400,
                    `Attribute "${key}" cannot exceed 500 characters`
                );
            }
        }
    }

    // =================================================
    // ACTIVE STATUS
    // =================================================

    if (
        isActive !== undefined
    ) {
        if (
            typeof isActive !==
            "boolean"
        ) {
            throw new ApiError(
                400,
                "isActive must be a boolean"
            );
        }
    }
};

// =====================================================
// CREATE PRODUCT VALIDATOR
// =====================================================

const validateCreateProduct = (
    req,
    res,
    next
) => {
    const body = req.body;

    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        throw new ApiError(
            400,
            "Invalid request body"
        );
    }

    validateAllowedFields(
        body
    );

    const {
        name,
        description,
        category,
        brand,
        basePrice,
    } = body;

    if (
        !isValidString(name)
    ) {
        throw new ApiError(
            400,
            "Product name is required"
        );
    }

    if (
        !isValidString(
            description
        )
    ) {
        throw new ApiError(
            400,
            "Product description is required"
        );
    }

    if (!category) {
        throw new ApiError(
            400,
            "Category is required"
        );
    }

    if (
        !isValidObjectId(category)
    ) {
        throw new ApiError(
            400,
            "Invalid category ID"
        );
    }

    if (!brand) {
        throw new ApiError(
            400,
            "Brand is required"
        );
    }

    if (
        !isValidObjectId(brand)
    ) {
        throw new ApiError(
            400,
            "Invalid brand ID"
        );
    }

    if (
        basePrice === undefined ||
        basePrice === null ||
        basePrice === ""
    ) {
        throw new ApiError(
            400,
            "Base price is required"
        );
    }

    validateCommonProductFields(
        body
    );

    next();
};

// =====================================================
// UPDATE PRODUCT VALIDATOR
// =====================================================

const validateUpdateProduct = (
    req,
    res,
    next
) => {
    const body = req.body;

    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        throw new ApiError(
            400,
            "Invalid request body"
        );
    }

    if (
        Object.keys(body).length === 0
    ) {
        throw new ApiError(
            400,
            "At least one field is required for update"
        );
    }

    validateAllowedFields(
        body
    );

    validateCommonProductFields(
        body
    );

    next();
};

// =====================================================
// PRODUCT ID VALIDATOR
// =====================================================

const validateProductId = (
    req,
    res,
    next
) => {
    const {
        productId,
    } = req.params;

    if (
        !productId ||
        !isValidObjectId(productId)
    ) {
        throw new ApiError(
            400,
            "Invalid product ID"
        );
    }

    next();
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    validateCreateProduct,
    validateUpdateProduct,
    validateProductId,
};