import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerOrders, fetchSellerProducts } from "../sellerSlice";
import {
  FiBarChart2,
  FiBox,
  FiDollarSign,
  FiShoppingBag,
} from "react-icons/fi";
import "./analytics.css";

const Analytics = () => {
  const dispatch = useDispatch();
  const { orders, products } = useSelector((state) => state.seller || {});
  useEffect(() => {
    dispatch(fetchSellerOrders({ limit: 50 }));
    dispatch(fetchSellerProducts({ limit: 50 }));
  }, [dispatch]);
  const revenue = useMemo(
    () =>
      orders.reduce(
        (s, o) => s + Number(o.sellerSubtotal || o.subtotal || 0),
        0,
      ),
    [orders],
  );
  const delivered = orders.filter((o) => o.orderStatus === "delivered").length;
  const avg = orders.length ? revenue / orders.length : 0;
  const max = Math.max(
    ...orders.map((o) => Number(o.sellerSubtotal || o.subtotal || 0)),
    1,
  );
  return (
    <div className="seller-analytics-page">
      <div className="seller-analytics-heading">
        <div>
          <span>STORE INSIGHTS</span>
          <h2>Analytics</h2>
          <p>Understand your current seller order and catalog performance.</p>
        </div>
      </div>
      <div className="seller-analytics-cards">
        <Metric
          icon={FiDollarSign}
          label="Loaded Revenue"
          value={`₹${revenue.toLocaleString("en-IN")}`}
        />
        <Metric
          icon={FiShoppingBag}
          label="Loaded Orders"
          value={orders.length}
        />
        <Metric icon={FiBox} label="Products" value={products.length} />
        <Metric
          icon={FiBarChart2}
          label="Avg. Order Value"
          value={`₹${Math.round(avg).toLocaleString("en-IN")}`}
        />
      </div>
      <div className="seller-analytics-grid">
        <section className="seller-analytics-panel">
          <header>
            <div>
              <h3>Revenue by Recent Order</h3>
              <p>
                Values are calculated from the orders returned by your seller
                API.
              </p>
            </div>
          </header>
          <div className="seller-analytics-chart">
            {orders.length ? (
              orders
                .slice()
                .reverse()
                .slice(-12)
                .map((o, i) => {
                  const value = Number(o.sellerSubtotal || o.subtotal || 0);
                  return (
                    <div className="seller-analytics-column" key={o._id || i}>
                      <div
                        className="seller-analytics-bar"
                        style={{
                          height: `${Math.max(8, (value / max) * 100)}%`,
                        }}
                      />
                      <small>{i + 1}</small>
                    </div>
                  );
                })
            ) : (
              <p className="seller-analytics-empty">No order data yet.</p>
            )}
          </div>
        </section>
        <section className="seller-analytics-panel">
          <header>
            <div>
              <h3>Store Snapshot</h3>
              <p>Quick performance indicators.</p>
            </div>
          </header>
          <div className="seller-insight-list">
            <div>
              <span>Delivered orders</span>
              <strong>{delivered}</strong>
            </div>
            <div>
              <span>Pending / processing</span>
              <strong>
                {
                  orders.filter((o) =>
                    ["pending", "confirmed", "processing"].includes(
                      o.orderStatus,
                    ),
                  ).length
                }
              </strong>
            </div>
            <div>
              <span>Active products</span>
              <strong>
                {products.filter((p) => p.isActive !== false).length}
              </strong>
            </div>
            <div>
              <span>Inactive products</span>
              <strong>
                {products.filter((p) => p.isActive === false).length}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
const Metric = ({ icon: Icon, label, value }) => (
  <div className="seller-analytics-metric">
    <span>
      <Icon />
    </span>
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  </div>
);
export default Analytics;
