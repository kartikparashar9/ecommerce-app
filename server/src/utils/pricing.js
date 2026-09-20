const roundMoney = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return NaN;
  return Math.round((number + Number.EPSILON) * 100) / 100;
};

const getProductDiscountPercent = (product) => {
  const discount = Number(product?.discount ?? 0);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) return 0;
  return discount;
};

/**
 * Variant price is the variant MRP/base price.
 * Product.discount is applied to that variant price to obtain the
 * actual selling price used by cart, checkout, order and payment.
 */
const getVariantPricing = (product, variant) => {
  const mrp = Number(variant?.price);
  const discountPercent = getProductDiscountPercent(product);

  if (!Number.isFinite(mrp) || mrp < 0) {
    throw new Error("Invalid variant price");
  }

  const productDiscount = roundMoney((mrp * discountPercent) / 100);
  const sellingPrice = roundMoney(mrp - productDiscount);

  return {
    mrp,
    discountPercent,
    productDiscount,
    sellingPrice,
  };
};

const calculateCouponDiscount = ({
  coupon,
  applicableAmount,
}) => {
  const amount = roundMoney(applicableAmount);
  if (!coupon || !Number.isFinite(amount) || amount <= 0) return 0;

  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = roundMoney((amount * Number(coupon.discountValue)) / 100);

    if (
      coupon.maximumDiscount !== null &&
      coupon.maximumDiscount !== undefined
    ) {
      discount = Math.min(discount, Number(coupon.maximumDiscount));
    }
  } else {
    discount = Math.min(Number(coupon.discountValue), amount);
  }

  return roundMoney(Math.max(0, discount));
};

module.exports = {
  roundMoney,
  getVariantPricing,
  calculateCouponDiscount,
};
