const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");

/**
 * Records one successful coupon use. The order flag makes the operation
 * idempotent across payment verification and webhook retries.
 */
const recordCouponUsage = async (order, session = null) => {
  if (!order?.couponCode || order.couponUsageRecorded) return false;

  const query = { _id: order._id, couponUsageRecorded: { $ne: true } };
  const options = session ? { session } : {};
  const currentOrderQuery = Order.findOne(query);
  if (session) currentOrderQuery.session(session);
  const currentOrder = await currentOrderQuery;

  if (!currentOrder || !currentOrder.couponCode) return false;

  const couponQuery = { code: currentOrder.couponCode };
  if (currentOrder.paymentStatus !== "paid") return false;

  const couponQueryBuilder = Coupon.findOne(couponQuery);
  if (session) couponQueryBuilder.session(session);
  const coupon = await couponQueryBuilder;
  if (!coupon) return false;

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return false;
  }

  coupon.usedCount += 1;
  await coupon.save(options);

  currentOrder.couponUsageRecorded = true;
  await currentOrder.save(options);

  return true;
};

module.exports = { recordCouponUsage };
