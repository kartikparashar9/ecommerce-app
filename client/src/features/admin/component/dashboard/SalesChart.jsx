import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./SalesChart.css";

const SalesChart = ({ data = [], period = "monthly", onPeriodChange }) => <div className="sales-chart-card">
  <div className="sales-chart-header"><div><h2>Revenue Overview</h2><p>Track your store performance</p></div>
    <select className="sales-chart-select" value={period} onChange={(e) => onPeriodChange?.(e.target.value)}><option value="daily">Daily</option><option value="monthly">Monthly</option></select>
  </div>
  {data.length === 0 ? <div className="sales-chart-state">No sales data available</div> : <div className="sales-chart-container"><ResponsiveContainer width="100%" height={320}><AreaChart data={data}>
    <defs><linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} tickFormatter={(v)=>`₹${Number(v)/1000}k`}/>
    <Tooltip formatter={(v)=>[`₹${Number(v).toLocaleString("en-IN")}`,"Revenue"]}/><Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#salesGradient)"/>
  </AreaChart></ResponsiveContainer></div>}
</div>;
export default SalesChart;
