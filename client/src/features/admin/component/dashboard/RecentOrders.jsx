import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, PackageSearch } from "lucide-react";
import { getAllAdminOrders } from "../../AdminApi";
import "./RecentOrders.css";

const RecentOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const response = await getAllAdminOrders({ page: 1, limit: 5 });
        const data = response?.data?.data;
        setOrders(Array.isArray(data) ? data : data?.orders || []);
      } catch (e) { setError(e?.response?.data?.message || "Unable to load recent orders"); }
      finally { setLoading(false); }
    })();
  }, []);
  return <div className="recent-orders-card">
    <div className="recent-orders-header"><div><h2>Recent Orders</h2><p>Latest customer orders</p></div><button className="view-all-orders-btn" type="button" onClick={() => navigate("/admin/orders")}>View All <ArrowRight size={17}/></button></div>
    {loading && <div className="recent-orders-state">Loading orders...</div>}
    {!loading && error && <div className="recent-orders-state error">{error}</div>}
    {!loading && !error && !orders.length && <div className="recent-orders-empty"><PackageSearch size={36}/><p>No recent orders found</p></div>}
    {!loading && !error && orders.length > 0 && <div className="recent-orders-table-wrapper"><table className="recent-orders-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{orders.map(o => <tr key={o._id}><td><span className="order-number">#{o.orderNumber || o._id?.slice(-6)}</span></td><td><div className="order-customer"><div className="customer-avatar">{(o.user?.name||"U")[0].toUpperCase()}</div><div><strong>{o.user?.name||"Unknown User"}</strong><span>{o.user?.email||"-"}</span></div></div></td><td>{o.createdAt?new Date(o.createdAt).toLocaleDateString("en-IN"):"-"}</td><td className="order-amount">₹{Number(o.totalAmount||0).toLocaleString("en-IN")}</td><td><span className={`order-status ${o.orderStatus||"pending"}`}>{(o.orderStatus||"pending").replaceAll("_"," ")}</span></td></tr>)}</tbody></table></div>}
  </div>;
};
export default RecentOrders;
