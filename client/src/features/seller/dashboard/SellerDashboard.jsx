import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiArrowRight,
  FiBox,
  FiDollarSign,
  FiList,
  FiPlus,
  FiShoppingBag,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import { fetchSellerOrders, fetchSellerProducts } from "../sellerSlice";
import "./SellerDashboard.css";

const money = (value = 0) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const date = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const { profile, products, productsPagination, orders, ordersPagination, ordersLoading } = useSelector((state) => state.seller || {});

  useEffect(() => {
    dispatch(fetchSellerProducts({ limit: 5 }));
    dispatch(fetchSellerOrders({ limit: 5 }));
  }, [dispatch]);

  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order?.sellerSubtotal || order?.subtotal || 0), 0),
    [orders],
  );

  const pendingOrders = orders.filter((order) => ["pending", "processing"].includes(order?.orderStatus)).length;
  const activeProducts = products.filter((product) => product?.isActive !== false).length;

  const stats = [
    { label: "Total Revenue", value: money(revenue), hint: "From loaded orders", icon: FiDollarSign, tone: "green" },
    { label: "Total Products", value: productsPagination?.totalProducts ?? products.length, hint: `${activeProducts} active in view`, icon: FiBox, tone: "blue" },
    { label: "Total Orders", value: ordersPagination?.totalOrders ?? orders.length, hint: `${pendingOrders} pending in view`, icon: FiShoppingBag, tone: "violet" },
    { label: "Store Status", value: "Active", hint: "Verified seller", icon: FiTrendingUp, tone: "orange" },
  ];

  return (
    <div className="seller-dashboard">
      <section className="seller-dashboard-heading">
        <div>
          <span className="seller-section-kicker">STORE OVERVIEW</span>
          <h2>Welcome back, {profile?.businessName || "Seller"}</h2>
          <p>Monitor your store performance and manage daily operations.</p>
        </div>
        <Link className="seller-primary-btn" to="/seller/products"><FiPlus /> Add Product</Link>
      </section>

      <section className="seller-stat-grid">
        {stats.map(({ label, value, hint, icon: Icon, tone }) => (
          <article className="seller-stat-card" key={label}>
            <div className={`seller-stat-icon ${tone}`}><Icon /></div>
            <div className="seller-stat-copy"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
          </article>
        ))}
      </section>

      <section className="seller-dashboard-grid">
        <article className="seller-panel seller-orders-panel">
          <div className="seller-panel-head">
            <div><h3>Recent Orders</h3><p>Your latest store orders.</p></div>
            <Link to="/seller/orders">View all <FiArrowRight /></Link>
          </div>
          <div className="seller-responsive-table">
            {ordersLoading ? <div className="seller-table-state">Loading orders...</div> : orders.length === 0 ? <div className="seller-table-state">No orders received yet.</div> : (
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>{orders.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td className="seller-order-id">#{order.orderNumber || String(order._id).slice(-8)}</td>
                    <td>{order.user?.name || order.customer?.name || "Customer"}</td>
                    <td className="seller-amount">{money(order.sellerSubtotal || order.subtotal)}</td>
                    <td><span className={`seller-order-badge ${String(order.orderStatus || "pending").toLowerCase()}`}>{String(order.orderStatus || "pending").replaceAll("_", " ")}</span></td>
                    <td>{date(order.createdAt)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </article>

        <aside className="seller-panel seller-actions-panel">
          <div className="seller-panel-head"><div><h3>Quick Actions</h3><p>Common store tasks.</p></div></div>
          <div className="seller-quick-list">
            <Link to="/seller/products"><span><FiBox /></span><div><strong>Manage Products</strong><small>Catalog, stock & status</small></div><FiArrowRight /></Link>
            <Link to="/seller/orders"><span><FiList /></span><div><strong>View Orders</strong><small>Process customer orders</small></div><FiArrowRight /></Link>
            <Link to="/seller/profile"><span><FiUser /></span><div><strong>Update Profile</strong><small>Business information</small></div><FiArrowRight /></Link>
          </div>
        </aside>
      </section>

      <section className="seller-panel seller-performance-panel">
        <div className="seller-panel-head"><div><h3>Sales Overview</h3><p>Order revenue from the currently loaded order set.</p></div><Link to="/seller/analytics">Analytics <FiArrowRight /></Link></div>
        <div className="seller-mini-chart">
          {orders.length ? orders.slice().reverse().map((order, index) => {
            const max = Math.max(...orders.map((item) => Number(item?.sellerSubtotal || item?.subtotal || 0)), 1);
            const value = Number(order?.sellerSubtotal || order?.subtotal || 0);
            return <div className="seller-chart-column" key={order._id || index}><div className="seller-chart-bar" style={{ height: `${Math.max(10, (value / max) * 100)}%` }} /><span>{index + 1}</span></div>;
          }) : <div className="seller-chart-empty">Orders will appear here as your store starts selling.</div>}
        </div>
      </section>
    </div>
  );
};

export default SellerDashboard;
