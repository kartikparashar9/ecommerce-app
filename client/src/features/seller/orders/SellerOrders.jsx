import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiEye, FiSearch } from "react-icons/fi";
import { fetchSellerOrders, orderUpdatedLocally } from "../sellerSlice";
import SellerOrderDetailModal from "./SellerOrderDetailModal";
import "./SellerOrders.css";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const pretty = (v = "") =>
  v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const SellerOrders = () => {
  const dispatch = useDispatch();
  const { orders, ordersLoading, ordersPagination } = useSelector(
    (state) => state.seller || {},
  );
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    dispatch(
      fetchSellerOrders({
        status: status === "all" ? undefined : status,
        limit: 50,
      }),
    );
  }, [dispatch, status]);

  const visible = orders.filter((order) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      String(order.orderNumber || order._id)
        .toLowerCase()
        .includes(q) ||
      String(order.user?.name || order.customer?.name || "")
        .toLowerCase()
        .includes(q)
    );
  });

  const tabs = [
    ["all", "All Orders"],
    ["pending", "Pending"],
    ["confirmed", "Confirmed"],
    ["processing", "Processing"],
    ["shipped", "Shipped"],
    ["out_for_delivery", "Out for Delivery"],
    ["delivered", "Delivered"],
  ];

  const handleOrderUpdated = (updatedOrder) => {
    if (!updatedOrder?._id) return;
    dispatch(orderUpdatedLocally(updatedOrder));
  };

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-heading">
        <div>
          <span>ORDER OPERATIONS</span>
          <h2>Orders</h2>
          <p>Track and process orders containing your store products.</p>
        </div>
      </div>
      <div className="seller-orders-toolbar">
        <div className="seller-orders-search">
          <FiSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order or customer..."
          />
        </div>
        <div className="seller-orders-tabs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={status === key ? "active" : ""}
              onClick={() => setStatus(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="seller-orders-card">
        <div className="seller-orders-card-head">
          <strong>
            {ordersPagination?.totalOrders ?? visible.length} orders
          </strong>
          <span>
            Select an order to inspect details and process its status.
          </span>
        </div>
        <div className="seller-orders-table-wrap">
          {ordersLoading ? (
            <div className="seller-orders-state">Loading orders...</div>
          ) : !visible.length ? (
            <div className="seller-orders-state">
              <strong>No orders found</strong>
              <span>There are no orders matching your current filters.</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Your Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr key={order._id}>
                    <td className="order-number">
                      #{order.orderNumber || String(order._id).slice(-8)}
                    </td>
                    <td>
                      <strong>
                        {order.user?.name || order.customer?.name || "Customer"}
                      </strong>
                      <small>
                        {order.user?.email || order.customer?.email || ""}
                      </small>
                    </td>
                    <td>{order.items?.length || 0}</td>
                    <td className="order-amount">
                      {money(order.sellerSubtotal || order.subtotal)}
                    </td>
                    <td>
                      <span
                        className={`payment-status ${order.paymentStatus === "paid" ? "paid" : "pending"}`}
                      >
                        {pretty(order.paymentStatus || "pending")}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`order-status ${String(order.orderStatus || "").toLowerCase()}`}
                      >
                        {pretty(order.orderStatus || "Unknown")}
                      </span>
                    </td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="seller-order-view"
                        onClick={() => setSelected(order._id)}
                      >
                        <FiEye /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {selected && (
        <SellerOrderDetailModal
          orderId={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
};
export default SellerOrders;
