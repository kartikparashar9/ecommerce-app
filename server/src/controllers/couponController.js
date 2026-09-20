const Coupon =
    require("../models/couponModel");

const Cart =
    require("../models/cartModel");

const Product =
    require("../models/productModel");

const ApiError =
    require("../utils/ApiError");

const Order =
    require("../models/orderModel");

const { getVariantPricing, calculateCouponDiscount } =
    require("../utils/pricing");

// =====================================================
// HELPERS
// =====================================================

const roundMoney = (
    value
) => {
    return (
        Math.round(
            (
                Number(value) +
                Number.EPSILON
            ) *
                100
        ) / 100
    );
};

// =====================================================
// CREATE COUPON
// ADMIN
// =====================================================

const createCoupon = async (
    req,
    res,
    next
) => {
    try {
        const {
            code,
            description = "",
            discountType,
            discountValue,
            maximumDiscount = null,
            minimumOrderAmount = 0,
            usageLimit = null,
            usageLimitPerUser = 1,
            startDate,
            endDate,
            applicableCategories = [],
            applicableProducts = [],
        } = req.body;

        const normalizedCode =
            code.trim().toUpperCase();

        const existingCoupon =
            await Coupon.findOne({
                code: normalizedCode,
            });

        if (existingCoupon) {
            return next(
                new ApiError(
                    409,
                    "Coupon code already exists"
                )
            );
        }

        const coupon =
            await Coupon.create({
                code:
                    normalizedCode,

                description,

                discountType,

                discountValue,

                maximumDiscount,

                minimumOrderAmount,

                usageLimit,

                usageLimitPerUser,

                startDate,

                endDate,

                applicableCategories,

                applicableProducts,

                createdBy:
                    req.user._id,
            });

        return res.status(201).json({
            success: true,

            message:
                "Coupon created successfully",

            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// GET ALL COUPONS
// ADMIN
// =====================================================

const getAllCoupons = async (
    req,
    res,
    next
) => {
    try {
        const {
            page = 1,
            limit = 10,
            isActive,
            search,
        } = req.query;

        const pageNumber =
            Math.max(
                Number(page) || 1,
                1
            );

        const limitNumber =
            Math.min(
                Math.max(
                    Number(limit) || 10,
                    1
                ),
                100
            );

        const filter = {};

        if (
            isActive !== undefined
        ) {
            filter.isActive =
                String(isActive) ===
                "true";
        }

        if (
            search
        ) {
            filter.code = {
                $regex: search,
                $options: "i",
            };
        }

        const [
            coupons,
            total,
        ] =
            await Promise.all([
                Coupon.find(filter)
                    .sort({
                        createdAt: -1,
                    })
                    .skip(
                        (
                            pageNumber -
                            1
                        ) *
                            limitNumber
                    )
                    .limit(
                        limitNumber
                    )
                    .populate(
                        "createdBy",
                        "name email"
                    )
                    .lean(),

                Coupon.countDocuments(
                    filter
                ),
            ]);

        return res.status(200).json({
            success: true,

            message:
                "Coupons fetched successfully",

            data: {
                coupons,

                pagination: {
                    page:
                        pageNumber,

                    limit:
                        limitNumber,

                    total,

                    totalPages:
                        Math.ceil(
                            total /
                                limitNumber
                        ),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// GET SINGLE COUPON
// ADMIN
// =====================================================

const getCouponById = async (
    req,
    res,
    next
) => {
    try {
        const coupon =
            await Coupon.findById(
                req.params.couponId
            )
                .populate(
                    "createdBy",
                    "name email"
                )
                .lean();

        if (!coupon) {
            return next(
                new ApiError(
                    404,
                    "Coupon not found"
                )
            );
        }

        return res.status(200).json({
            success: true,

            message:
                "Coupon fetched successfully",

            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// UPDATE COUPON
// ADMIN
// =====================================================

const updateCoupon = async (
    req,
    res,
    next
) => {
    try {
        const coupon =
            await Coupon.findById(
                req.params.couponId
            );

        if (!coupon) {
            return next(
                new ApiError(
                    404,
                    "Coupon not found"
                )
            );
        }

        const updateData = {
            ...req.body,
        };

        if (
            updateData.code
        ) {
            updateData.code =
                updateData.code
                    .trim()
                    .toUpperCase();

            const existingCoupon =
                await Coupon.findOne({
                    code:
                        updateData.code,

                    _id: {
                        $ne:
                            coupon._id,
                    },
                });

            if (
                existingCoupon
            ) {
                return next(
                    new ApiError(
                        409,
                        "Coupon code already exists"
                    )
                );
            }
        }

        const updatedStartDate =
            updateData.startDate
                ? new Date(
                      updateData.startDate
                  )
                : coupon.startDate;

        const updatedEndDate =
            updateData.endDate
                ? new Date(
                      updateData.endDate
                  )
                : coupon.endDate;

        if (
            updatedEndDate <=
            updatedStartDate
        ) {
            return next(
                new ApiError(
                    400,
                    "End date must be after start date"
                )
            );
        }

        const updatedDiscountType =
            updateData.discountType ||
            coupon.discountType;

        const updatedDiscountValue =
            updateData.discountValue !==
            undefined
                ? updateData.discountValue
                : coupon.discountValue;

        if (
            updatedDiscountType ===
                "percentage" &&
            updatedDiscountValue > 100
        ) {
            return next(
                new ApiError(
                    400,
                    "Percentage discount cannot exceed 100"
                )
            );
        }

        Object.assign(
            coupon,
            updateData
        );

        await coupon.save();

        return res.status(200).json({
            success: true,

            message:
                "Coupon updated successfully",

            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// DELETE COUPON
// ADMIN
// =====================================================

const deleteCoupon = async (
    req,
    res,
    next
) => {
    try {
        const coupon =
            await Coupon.findById(
                req.params.couponId
            );

        if (!coupon) {
            return next(
                new ApiError(
                    404,
                    "Coupon not found"
                )
            );
        }

        await coupon.deleteOne();

        return res.status(200).json({
            success: true,

            message:
                "Coupon deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// ACTIVATE COUPON
// ADMIN
// =====================================================

const activateCoupon = async (
    req,
    res,
    next
) => {
    try {
        const coupon =
            await Coupon.findByIdAndUpdate(
                req.params.couponId,
                {
                    isActive: true,
                },
                {
                    new: true,
                }
            );

        if (!coupon) {
            return next(
                new ApiError(
                    404,
                    "Coupon not found"
                )
            );
        }

        return res.status(200).json({
            success: true,

            message:
                "Coupon activated successfully",

            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// DEACTIVATE COUPON
// ADMIN
// =====================================================

const deactivateCoupon = async (
    req,
    res,
    next
) => {
    try {
        const coupon =
            await Coupon.findByIdAndUpdate(
                req.params.couponId,
                {
                    isActive: false,
                },
                {
                    new: true,
                }
            );

        if (!coupon) {
            return next(
                new ApiError(
                    404,
                    "Coupon not found"
                )
            );
        }

        return res.status(200).json({
            success: true,

            message:
                "Coupon deactivated successfully",

            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// APPLY COUPON
// USER
// Calculates discount from server-side cart
// =====================================================

const applyCoupon = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            req.user._id;

        const rawCode = req.body?.code;

        if (typeof rawCode !== "string" || !rawCode.trim()) {
            return next(new ApiError(400, "Coupon code is required"));
        }

        const normalizedCode = rawCode.trim().toUpperCase();

        // ---------------------------------------------
        // FIND COUPON
        // ---------------------------------------------

        const coupon =
            await Coupon.findOne({
                code:
                    normalizedCode,

                isActive: true,
            });

        if (!coupon) {
            return next(
                new ApiError(
                    404,
                    "Invalid or inactive coupon"
                )
            );
        }

        const now =
            new Date();

        // ---------------------------------------------
        // DATE VALIDATION
        // ---------------------------------------------

        if (
            now <
                coupon.startDate ||
            now >
                coupon.endDate
        ) {
            return next(
                new ApiError(
                    400,
                    "Coupon is not currently valid"
                )
            );
        }

        // ---------------------------------------------
        // USAGE LIMIT
        // ---------------------------------------------

        if (
            coupon.usageLimit !==
                null &&
            coupon.usedCount >=
                coupon.usageLimit
        ) {
            return next(
                new ApiError(
                    400,
                    "Coupon usage limit has been reached"
                )
            );
        }

        // ---------------------------------------------
        // PER-USER USAGE LIMIT
        // Only successfully paid/confirmed purchases consume a coupon.
        // ---------------------------------------------

        if (coupon.usageLimitPerUser !== null) {
            const previousUses = await Order.countDocuments({
                user: userId,
                couponCode: normalizedCode,
                paymentStatus: "paid",
            });

            if (previousUses >= coupon.usageLimitPerUser) {
                return next(
                    new ApiError(
                        400,
                        "You have already used this coupon the maximum allowed times"
                    )
                );
            }
        }

        // ---------------------------------------------
        // GET CART
        // ---------------------------------------------

        const cart =
            await Cart.findOne({
                user: userId,
            });

        if (
            !cart ||
            !Array.isArray(
                cart.items
            ) ||
            cart.items.length ===
                0
        ) {
            return next(
                new ApiError(
                    400,
                    "Your cart is empty"
                )
            );
        }

        // ---------------------------------------------
        // GET PRODUCTS
        // ---------------------------------------------

        const productIds =
            cart.items.map(
                (item) =>
                    item.product
            );

        const products =
            await Product.find({
                _id: {
                    $in:
                        productIds,
                },
            });

        const productMap =
            new Map(
                products.map(
                    (product) => [
                        product._id.toString(),
                        product,
                    ]
                )
            );

        let subtotal = 0;
        let productDiscount = 0;
        let sellingSubtotal = 0;

        let applicableAmount = 0;

        // ---------------------------------------------
        // CALCULATE CART TOTAL
        // ---------------------------------------------

        for (
            const item of cart.items
        ) {
            const product =
                productMap.get(
                    item.product.toString()
                );

            if (!product) {
                continue;
            }

            const variant =
                product.variants.find(
                    (variant) =>
                        variant._id
                            .toString() ===
                        item.variant
                            .toString()
                );

            if (!variant) {
                continue;
            }

            let pricing;
            try {
                pricing = getVariantPricing(product, variant);
            } catch {
                continue;
            }

            const itemPrice = pricing.sellingPrice;

            const quantity =
                Number(
                    item.quantity
                );

            const itemTotal =
                roundMoney(
                    itemPrice *
                        quantity
                );

            const mrpTotal =
                roundMoney(
                    pricing.mrp *
                        quantity
                );

            const productDiscountTotal =
                roundMoney(
                    pricing.productDiscount *
                        quantity
                );

            subtotal =
                roundMoney(
                    subtotal +
                        mrpTotal
                );

            productDiscount =
                roundMoney(
                    productDiscount +
                        productDiscountTotal
                );

            sellingSubtotal =
                roundMoney(
                    sellingSubtotal +
                        itemTotal
                );

            // -----------------------------------------
            // CHECK PRODUCT APPLICABILITY
            // -----------------------------------------

            const hasProductRestriction =
                coupon
                    .applicableProducts
                    .length > 0;

            const hasCategoryRestriction =
                coupon
                    .applicableCategories
                    .length > 0;

            let applicable = true;

            if (
                hasProductRestriction
            ) {
                applicable =
                    coupon
                        .applicableProducts
                        .some(
                            (
                                productId
                            ) =>
                                productId
                                    .toString() ===
                                product._id
                                    .toString()
                        );
            }

            if (
                applicable &&
                hasCategoryRestriction
            ) {
                applicable =
                    coupon
                        .applicableCategories
                        .some(
                            (
                                categoryId
                            ) =>
                                categoryId
                                    .toString() ===
                                product.category
                                    .toString()
                        );
            }

            if (
                applicable
            ) {
                applicableAmount =
                    roundMoney(
                        applicableAmount +
                            itemTotal
                    );
            }
        }

        // ---------------------------------------------
        // MINIMUM ORDER AMOUNT
        // ---------------------------------------------

        if (
            sellingSubtotal <
            coupon.minimumOrderAmount
        ) {
            return next(
                new ApiError(
                    400,
                    `Minimum order amount of ${coupon.minimumOrderAmount} is required`
                )
            );
        }

        // ---------------------------------------------
        // APPLICABLE PRODUCTS CHECK
        // ---------------------------------------------

        if (
            applicableAmount <=
            0
        ) {
            return next(
                new ApiError(
                    400,
                    "Coupon is not applicable to products in your cart"
                )
            );
        }

        // ---------------------------------------------
        // CALCULATE DISCOUNT
        // ---------------------------------------------

        const discount = calculateCouponDiscount({
            coupon,
            applicableAmount,
        });

        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Coupon applied successfully",

            data: {
                couponCode:
                    coupon.code,

                discountType:
                    coupon.discountType,

                discountValue:
                    coupon.discountValue,

                subtotal,

                productDiscount,

                sellingSubtotal,

                applicableAmount,

                discount: roundMoney(discount),
            },
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    activateCoupon,
    deactivateCoupon,
    applyCoupon,
};