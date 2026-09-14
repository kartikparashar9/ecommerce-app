import { useEffect, useState } from "react";
import { Users, ShoppingBag, Package, IndianRupee } from "lucide-react";
import { getDashboardOverview, getSalesTrends, getAllAdminOrders, getTopProducts } from "../AdminApi";
import StatsCard from "../component/dashboard/StatsCard";
import SalesChart from "../component/dashboard/SalesChart";
import RecentOrders from "../component/dashboard/RecentOrders";
import TopProducts from "../component/dashboard/TopProducts";
import "./AdminDashboardContent.css";

const AdminDashboardContent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [sales, setSales] = useState([]);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [overview, trends] = await Promise.all([getDashboardOverview(), getSalesTrends({ groupBy: period })]);
      setData(overview?.data?.data?.overview || overview?.data?.data || {});
      const rows = trends?.data?.data?.trends || trends?.data?.data || [];
      setSales(Array.isArray(rows) ? rows.map((x) => ({ ...x, name: formatTrendName(x._id, period), revenue: Number(x.totalRevenue || 0), orders: Number(x.totalOrders || 0) })) : []);
    } catch (e) { setError(e?.response?.data?.message || "Unable to load dashboard"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [period]);

  if (loading) return <div className="dashboard-page-state">Loading dashboard...</div>;
  if (error) return <div className="dashboard-page-state error">{error}</div>;

  return <div className="admin-dashboard-content">
    <div className="dashboard-page-header"><div><h1>Dashboard</h1><p>Monitor your e-commerce business performance.</p></div></div>
    <div className="dashboard-stats-grid">
      <StatsCard title="Total Users" value={data?.totalUsers || 0} icon={Users} />
      <StatsCard title="Total Orders" value={data?.totalOrders || 0} icon={ShoppingBag} />
      <StatsCard title="Total Products" value={data?.totalProducts || 0} icon={Package} />
      <StatsCard title="Total Revenue" value={`₹${Number(data?.totalRevenue || 0).toLocaleString("en-IN")}`} icon={IndianRupee} />
    </div>
    <div className="dashboard-chart-section"><SalesChart data={sales} period={period} onPeriodChange={setPeriod} /></div>
    <div className="dashboard-bottom-grid"><RecentOrders /><TopProducts /></div>
  </div>;
};

const formatTrendName = (id, period) => {
  if (!id) return "-";
  if (period === "monthly") return `${id.year}-${String(id.month).padStart(2,"0")}`;
  return `${id.year}-${String(id.month || 1).padStart(2,"0")}-${String(id.day || 1).padStart(2,"0")}`;
};
export default AdminDashboardContent;
