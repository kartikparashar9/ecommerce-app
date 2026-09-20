// Shared frontend pricing helpers
// Pricing rule:
// variant.price = MRP
// product.discount = product-level discount percentage
// sellingPrice = MRP - product discount

export const roundMoney = (value) => {
  const number = Number(value) || 0;

  return Math.round((number + Number.EPSILON) * 100) / 100;
};

export const getProductDiscount = (mrp, discount = 0) => {
  const price = Number(mrp) || 0;
  const discountPercent = Number(discount) || 0;

  return roundMoney((price * discountPercent) / 100);
};

export const getSellingPrice = (mrp, discount = 0) => {
  const price = Number(mrp) || 0;
  const productDiscount = getProductDiscount(price, discount);

  return roundMoney(price - productDiscount);
};

// Product details page
export const getVariantPricing = (product = {}, selectedVariant = {}) => {
  const mrp = Number(selectedVariant?.price) || 0;
  const discountPercent = Number(product?.discount) || 0;

  const productDiscount = getProductDiscount(mrp, discountPercent);

  const sellingPrice = getSellingPrice(mrp, discountPercent);

  return {
    mrp,
    discountPercent,
    productDiscount,
    sellingPrice,
  };
};

// Cart item pricing
export const getCartItemPricing = (item = {}) => {
  const product = item?.product || item?.productId || {};

  const variant = item?.variant || {};

  const mrp =
    Number(
      item?.mrp ?? variant?.mrp ?? variant?.price ?? product?.basePrice ?? 0,
    ) || 0;

  const discountPercent =
    Number(item?.productDiscountPercent ?? product?.discount ?? 0) || 0;

  const productDiscount = Number.isFinite(Number(item?.productDiscount))
    ? roundMoney(item.productDiscount)
    : getProductDiscount(mrp, discountPercent);

  const sellingPrice = Number.isFinite(Number(item?.price))
    ? roundMoney(item.price)
    : getSellingPrice(mrp, discountPercent);

  const quantity = Math.max(1, Number(item?.quantity) || 1);

  return {
    mrp,
    discountPercent,
    productDiscount,
    sellingPrice,
    quantity,

    mrpTotal: roundMoney(mrp * quantity),

    productDiscountTotal: roundMoney(productDiscount * quantity),

    sellingTotal: roundMoney(sellingPrice * quantity),
  };
};

// Coupon discount helper
// Coupon is applied to the discounted/selling-price amount.
export const calculateCouponDiscount = (
  amount,
  discountType,
  discountValue,
  maxDiscount = null,
) => {
  const baseAmount = Math.max(0, Number(amount) || 0);

  const value = Math.max(0, Number(discountValue) || 0);

  let discount = 0;

  if (discountType === "percentage") {
    discount = (baseAmount * value) / 100;
  } else {
    discount = value;
  }

  if (maxDiscount !== null && maxDiscount !== undefined) {
    discount = Math.min(discount, Math.max(0, Number(maxDiscount) || 0));
  }

  return roundMoney(Math.min(discount, baseAmount));
};
