const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const ApiError = require("../utils/ApiError");
const { getVariantPricing, roundMoney } = require("../utils/pricing");

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// Find Variant
// -----------------------------------------------------

const findVariant = (product, variantId) => {
    if (
        !product ||
        !Array.isArray(product.variants)
    ) {
        return null;
    }

    return product.variants.find(
        (variant) =>
            variant._id &&
            variant._id.toString() ===
                variantId.toString()
    );
};

// -----------------------------------------------------
// Build Cart Response
// -----------------------------------------------------

const buildCartResponse = async (cart) => {
    const populatedCart =
        await Cart.findById(cart._id)
            .populate({
                path: "items.product",
                select:
                    "name slug brand category subcategory variants isActive seller discount basePrice finalPrice",
            })
            .lean();

    if (!populatedCart) {
        return null;
    }

    let subtotal = 0;
    let totalItems = 0;

    const items = [];

    for (const item of populatedCart.items) {
        const product = item.product;

        // -------------------------------------------------
        // Product No Longer Exists
        // -------------------------------------------------

        if (!product) {
            continue;
        }

        // -------------------------------------------------
        // Find Variant
        // -------------------------------------------------

        const variant = findVariant(
            product,
            item.variant
        );

        // -------------------------------------------------
        // Variant No Longer Exists
        // -------------------------------------------------

        if (!variant) {
            continue;
        }

        const pricing = getVariantPricing(product, variant);
        const price = pricing.sellingPrice;

        const quantity =
            Number(item.quantity) || 0;

        const itemTotal =
            roundMoney(price * quantity);

        subtotal = roundMoney(subtotal + itemTotal);
        totalItems += quantity;

        items.push({
            _id: item._id,

            product: {
                _id: product._id,
                name: product.name,
                slug: product.slug,
                brand: product.brand,
                category: product.category,
                subcategory:
                    product.subcategory,
                seller: product.seller,
                basePrice: product.basePrice,
                discount: product.discount,
                finalPrice: product.finalPrice,
            },

            variant: {
                _id: variant._id,
                sku: variant.sku,
                color: variant.color,
                size: variant.size,
                mrp: pricing.mrp,
                productDiscountPercent: pricing.discountPercent,
                productDiscount: pricing.productDiscount,
                price: pricing.sellingPrice,
                stock: variant.stock,
                image: variant.image,
                isActive: variant.isActive,
            },

            quantity,
            itemTotal,
        });
    }

    return {
        _id: populatedCart._id,
        user: populatedCart.user,
        items,

        totalItems,

        subtotal,

        itemCount: items.length,

        updatedAt:
            populatedCart.updatedAt,

        createdAt:
            populatedCart.createdAt,
    };
};

// =====================================================
// ADD TO CART
// =====================================================

const addToCart = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user?._id;

        const {
            productId,
            variantId,
            quantity = 1,
        } = req.body;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Find Product
        // -------------------------------------------------

        const product =
            await Product.findById(
                productId
            );

        if (!product) {
            return next(
                new ApiError(
                    404,
                    "Product not found"
                )
            );
        }

        // -------------------------------------------------
        // Product Active Check
        // -------------------------------------------------

        if (!product.isActive) {
            return next(
                new ApiError(
                    400,
                    "This product is currently unavailable"
                )
            );
        }

        // -------------------------------------------------
        // Find Variant
        // -------------------------------------------------

        const variant =
            findVariant(
                product,
                variantId
            );

        if (!variant) {
            return next(
                new ApiError(
                    404,
                    "Product variant not found"
                )
            );
        }

        // -------------------------------------------------
        // Variant Active Check
        // -------------------------------------------------

        if (!variant.isActive) {
            return next(
                new ApiError(
                    400,
                    "This product variant is currently unavailable"
                )
            );
        }

        // -------------------------------------------------
        // Stock Check
        // -------------------------------------------------

        const stock =
            Number(variant.stock) || 0;

        if (stock <= 0) {
            return next(
                new ApiError(
                    400,
                    "This product variant is out of stock"
                )
            );
        }

        // -------------------------------------------------
        // Find / Create Cart
        // -------------------------------------------------

        let cart =
            await Cart.findOne({
                user: userId,
            });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [],
            });
        }

        // -------------------------------------------------
        // Existing Cart Item
        // -------------------------------------------------

        const existingItem =
            cart.items.find(
                (item) =>
                    item.product
                        .toString() ===
                        productId.toString() &&
                    item.variant
                        .toString() ===
                        variantId.toString()
            );

        // -------------------------------------------------
        // Existing Item
        // -------------------------------------------------

        if (existingItem) {
            const newQuantity =
                existingItem.quantity +
                quantity;

            // -------------------------------------------------
            // Stock Validation
            // -------------------------------------------------

            if (newQuantity > stock) {
                return next(
                    new ApiError(
                        400,
                        `Only ${stock} items are available in stock`
                    )
                );
            }

            existingItem.quantity =
                newQuantity;
        }

        // -------------------------------------------------
        // New Item
        // -------------------------------------------------

        else {
            if (quantity > stock) {
                return next(
                    new ApiError(
                        400,
                        `Only ${stock} items are available in stock`
                    )
                );
            }

            cart.items.push({
                product: productId,
                variant: variantId,
                quantity,
            });
        }

        // -------------------------------------------------
        // Save Cart
        // -------------------------------------------------

        await cart.save();

        // -------------------------------------------------
        // Build Response
        // -------------------------------------------------

        const cartData =
            await buildCartResponse(
                cart
            );

        return res.status(200).json({
            success: true,

            message: existingItem
                ? "Cart quantity updated successfully"
                : "Product added to cart successfully",

            data: cartData,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// GET MY CART
// =====================================================

const getMyCart = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user?._id;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Find Cart
        // -------------------------------------------------

        let cart =
            await Cart.findOne({
                user: userId,
            });

        // -------------------------------------------------
        // Create Empty Cart
        // -------------------------------------------------

        if (!cart) {
            cart = await Cart.create({
                user: userId,
                items: [],
            });
        }

        // -------------------------------------------------
        // Build Response
        // -------------------------------------------------

        const cartData =
            await buildCartResponse(
                cart
            );

        return res.status(200).json({
            success: true,
            message:
                "Cart fetched successfully",
            data: cartData,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// UPDATE CART ITEM
// =====================================================

const updateCartItem = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user?._id;

        const { itemId } =
            req.params;

        const { quantity } =
            req.body;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Find Cart
        // -------------------------------------------------

        const cart =
            await Cart.findOne({
                user: userId,
            });

        if (!cart) {
            return next(
                new ApiError(
                    404,
                    "Cart not found"
                )
            );
        }

        // -------------------------------------------------
        // Find Cart Item
        // -------------------------------------------------

        const cartItem =
            cart.items.id(itemId);

        if (!cartItem) {
            return next(
                new ApiError(
                    404,
                    "Cart item not found"
                )
            );
        }

        // -------------------------------------------------
        // Find Product
        // -------------------------------------------------

        const product =
            await Product.findById(
                cartItem.product
            );

        if (!product) {
            return next(
                new ApiError(
                    404,
                    "Product no longer exists"
                )
            );
        }

        // -------------------------------------------------
        // Product Active Check
        // -------------------------------------------------

        if (!product.isActive) {
            return next(
                new ApiError(
                    400,
                    "This product is currently unavailable"
                )
            );
        }

        // -------------------------------------------------
        // Find Variant
        // -------------------------------------------------

        const variant =
            findVariant(
                product,
                cartItem.variant
            );

        if (!variant) {
            return next(
                new ApiError(
                    404,
                    "Product variant no longer exists"
                )
            );
        }

        // -------------------------------------------------
        // Variant Active Check
        // -------------------------------------------------

        if (!variant.isActive) {
            return next(
                new ApiError(
                    400,
                    "This product variant is currently unavailable"
                )
            );
        }

        // -------------------------------------------------
        // Stock Check
        // -------------------------------------------------

        const stock =
            Number(variant.stock) || 0;

        if (stock <= 0) {
            return next(
                new ApiError(
                    400,
                    "This product variant is out of stock"
                )
            );
        }

        if (quantity > stock) {
            return next(
                new ApiError(
                    400,
                    `Only ${stock} items are available in stock`
                )
            );
        }

        // -------------------------------------------------
        // Update Quantity
        // -------------------------------------------------

        cartItem.quantity =
            quantity;

        await cart.save();

        // -------------------------------------------------
        // Build Response
        // -------------------------------------------------

        const cartData =
            await buildCartResponse(
                cart
            );

        return res.status(200).json({
            success: true,
            message:
                "Cart item updated successfully",
            data: cartData,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// REMOVE CART ITEM
// =====================================================

const removeCartItem = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user?._id;

        const { itemId } =
            req.params;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Find Cart
        // -------------------------------------------------

        const cart =
            await Cart.findOne({
                user: userId,
            });

        if (!cart) {
            return next(
                new ApiError(
                    404,
                    "Cart not found"
                )
            );
        }

        // -------------------------------------------------
        // Find Cart Item
        // -------------------------------------------------

        const cartItem =
            cart.items.id(itemId);

        if (!cartItem) {
            return next(
                new ApiError(
                    404,
                    "Cart item not found"
                )
            );
        }

        // -------------------------------------------------
        // Remove Item
        // -------------------------------------------------

        cart.items.pull(itemId);

        await cart.save();

        // -------------------------------------------------
        // Build Response
        // -------------------------------------------------

        const cartData =
            await buildCartResponse(
                cart
            );

        return res.status(200).json({
            success: true,
            message:
                "Item removed from cart successfully",
            data: cartData,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// CLEAR CART
// =====================================================

const clearCart = async (
    req,
    res,
    next
) => {
    try {
        const userId = req.user?._id;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Find Cart
        // -------------------------------------------------

        const cart =
            await Cart.findOne({
                user: userId,
            });

        if (!cart) {
            return next(
                new ApiError(
                    404,
                    "Cart not found"
                )
            );
        }

        // -------------------------------------------------
        // Clear Items
        // -------------------------------------------------

        cart.items = [];

        await cart.save();

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Cart cleared successfully",

            data: {
                _id: cart._id,
                user: cart.user,
                items: [],
                totalItems: 0,
                itemCount: 0,
                subtotal: 0,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    addToCart,
    getMyCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};