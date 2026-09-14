import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  IndianRupee,
  ShoppingBag,
  Users,
  Store,
  Package,
  Download,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import {
  getOrderAnalytics,
  getRevenueAnalytics,
  getSalesTrends,
  getTopProducts,
  getTopSellers,
  getUserAnalytics,
} from "../AdminApi";

import "./AdminAnalyticsContent.css";

// ======================================================
// RESPONSE HELPERS
// ======================================================

const getResponseBody = (response) => {
  if (!response) return null;

  // Axios response
  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
};

const getPayload = (response) => {
  const body = getResponseBody(response);

  if (!body) return null;

  // Standard:
  // { success: true, data: {...} }
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    body.data !== undefined
  ) {
    return body.data;
  }

  return body;
};

const getArray = (response, possibleKeys = []) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  // Try requested keys
  for (const key of possibleKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  // Common API pagination/result keys
  const commonKeys = [
    "items",
    "results",
    "docs",
    "rows",
    "records",
    "data",
    "list",
  ];

  for (const key of commonKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return [];
};

const getObject = (response) => {
  const payload = getPayload(response);

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }

  return {};
};

// ======================================================
// NUMBER HELPERS
// ======================================================

const numberValue = (...values) => {
  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return 0;
};

const formatCurrency = (value) => {
  return `₹${numberValue(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value) => {
  return numberValue(value).toLocaleString("en-IN");
};

// ======================================================
// TEXT HELPERS
// ======================================================

const formatStatus = (value) => {
  if (!value) return "Unknown";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getProductName = (item) => {
  return (
    item?.productName ||
    item?.name ||
    item?.product?.name ||
    item?.product?.productName ||
    "Product"
  );
};

const getSellerName = (item) => {
  return (
    item?.businessName ||
    item?.sellerName ||
    item?.seller?.businessName ||
    item?.seller?.name ||
    item?.user?.name ||
    "Seller"
  );
};


const getSellerRevenue = (item) => {
  return numberValue(
    item?.totalRevenue,
    item?.revenue,
    item?.totalSales,
    item?.sales,
    item?.amount,
  );
};

const getProductQuantity = (item) => {
  return numberValue(
    item?.totalQuantitySold,
    item?.quantitySold,
    item?.totalSold,
    item?.soldQuantity,
    item?.quantity,
    item?.sales,
  );
};

// ======================================================
// SALES TREND HELPERS
// ======================================================

const getTrendRevenue = (item) => {
  return numberValue(
    item?.totalRevenue,
    item?.revenue,
    item?.totalSales,
    item?.sales,
    item?.amount,
  );
};

const formatTrendLabel = (item) => {
  if (!item) return "-";

  if (typeof item === "string") {
    return item;
  }

  if (item.label) return item.label;
  if (item.date) return item.date;
  if (item.period) return item.period;

  const id = item._id || item.id;

  if (typeof id === "string") {
    return id;
  }

  if (id && typeof id === "object") {
    const year = id.year;
    const month = id.month;
    const day = id.day;

    if (year) {
      const monthPart = month ? `-${String(month).padStart(2, "0")}` : "";

      const dayPart = day ? `-${String(day).padStart(2, "0")}` : "";

      return `${year}${monthPart}${dayPart}`;
    }
  }

  if (item.year) {
    const monthPart = item.month
      ? `-${String(item.month).padStart(2, "0")}`
      : "";

    const dayPart = item.day ? `-${String(item.day).padStart(2, "0")}` : "";

    return `${item.year}${monthPart}${dayPart}`;
  }

  return "-";
};

// ======================================================
// COMPONENT
// ======================================================

const AdminAnalyticsContent = () => {
  const [analytics, setAnalytics] = useState({
    revenue: {},
    orders: {},
    trends: [],
    products: [],
    sellers: [],
    users: {},
  });

  const [groupBy, setGroupBy] = useState("monthly");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [reportLoading, setReportLoading] = useState(false);

  // ====================================================
  // LOAD ANALYTICS
  // ====================================================

  const loadAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const results = await Promise.allSettled([
        getRevenueAnalytics(),
        getOrderAnalytics(),
        getSalesTrends({ groupBy }),
        getTopProducts({ limit: 5 }),
        getTopSellers({ limit: 5 }),
        getUserAnalytics({ groupBy }),
      ]);

      const [
        revenueResult,
        ordersResult,
        trendsResult,
        productsResult,
        sellersResult,
        usersResult,
      ] = results;

      // ================================================
      // REVENUE
      // ================================================

      const revenue =
        revenueResult.status === "fulfilled"
          ? getObject(revenueResult.value)
          : {};

      // ================================================
      // ORDERS
      // ================================================

      const orders =
        ordersResult.status === "fulfilled"
          ? getObject(ordersResult.value)
          : {};

      // ================================================
      // SALES TRENDS
      // ================================================

      const trends =
        trendsResult.status === "fulfilled"
          ? getArray(trendsResult.value, [
              "trends",
              "salesTrends",
              "sales",
              "trend",
            ])
          : [];

      // ================================================
      // TOP PRODUCTS
      // ================================================

      const products =
        productsResult.status === "fulfilled"
          ? getArray(productsResult.value, [
              "topProducts",
              "products",
              "topProduct",
            ])
          : [];

      // ================================================
      // TOP SELLERS
      // ================================================

      const sellers =
        sellersResult.status === "fulfilled"
          ? getArray(sellersResult.value, [
              "topSellers",
              "sellers",
              "topSeller",
            ])
          : [];

      // ================================================
      // USERS
      // ================================================

      const users =
        usersResult.status === "fulfilled" ? getObject(usersResult.value) : {};

      setAnalytics({
        revenue,
        orders,
        trends,
        products,
        sellers,
        users,
      });

      // Only show complete failure
      if (results.every((result) => result.status === "rejected")) {
        setError("Unable to load analytics data.");
      }
    } catch (err) {
      console.error("Analytics loading error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load analytics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [groupBy]);

  // ====================================================
  // NORMALIZED DATA
  // ====================================================

  const revenue = analytics.revenue || {};
  const orders = analytics.orders || {};
  const users = analytics.users || {};

  const trends = Array.isArray(analytics.trends) ? analytics.trends : [];

  const products = Array.isArray(analytics.products) ? analytics.products : [];

  const sellers = Array.isArray(analytics.sellers) ? analytics.sellers : [];

  // ====================================================
  // SUMMARY VALUES
  // ====================================================

  const totalRevenue = numberValue(
    revenue.totalRevenue,
    revenue.revenue,
    revenue.totalSales,
  );

  const totalOrders = numberValue(
    revenue.totalOrders,
    orders.totalOrders,
    orders.orders,
  );

  const averageOrderValue = numberValue(
    revenue.averageOrderValue,
    revenue.avgOrderValue,
    revenue.averageOrderValue,
  );

  const totalUsers = numberValue(users.totalUsers, users.users, users.count);

  // ====================================================
  // ORDER STATUS
  // ====================================================

  const orderStatuses = useMemo(() => {
    const possible = [
      orders.statusAnalytics,
      orders.orderStatusAnalytics,
      orders.statuses,
      orders.orderStatuses,
    ];

    for (const value of possible) {
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }, [orders]);

  // ====================================================
  // TREND MAX
  // ====================================================

  const maxTrendRevenue = useMemo(() => {
    if (!trends.length) return 1;

    return Math.max(...trends.map((item) => getTrendRevenue(item)), 1);
  }, [trends]);

  // ====================================================
  // PDF REPORT
  // ====================================================

  const downloadPDF = () => {
    try {
      setReportLoading(true);

      const doc = new jsPDF();

      const today = new Date().toLocaleDateString("en-IN");

      // ================================================
      // TITLE
      // ================================================

      doc.setFontSize(20);
      doc.text("Admin Analytics Report", 14, 18);

      doc.setFontSize(10);
      doc.text(`Generated on: ${today}`, 14, 26);
      doc.text(`Grouping: ${groupBy}`, 14, 32);

      // ================================================
      // SUMMARY
      // ================================================

      autoTable(doc, {
        startY: 40,
        head: [["Metric", "Value"]],
        body: [
          ["Total Revenue", formatCurrency(totalRevenue)],
          ["Total Orders", formatNumber(totalOrders)],
          ["Average Order Value", formatCurrency(averageOrderValue)],
          ["Total Users", formatNumber(totalUsers)],
        ],
        theme: "grid",
        styles: {
          fontSize: 10,
        },
      });

      // ================================================
      // SALES TRENDS
      // ================================================

      let currentY = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);
      doc.text("Sales Trends", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Period", "Revenue"]],
        body:
          trends.length > 0
            ? trends.map((item) => [
                formatTrendLabel(item),
                formatCurrency(getTrendRevenue(item)),
              ])
            : [["No data", "-"]],
        theme: "grid",
        styles: {
          fontSize: 9,
        },
      });

      // ================================================
      // TOP PRODUCTS
      // ================================================

      currentY = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);
      doc.text("Top Products", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Product", "Quantity Sold"]],
        body:
          products.length > 0
            ? products.map((item) => [
                getProductName(item),
                formatNumber(getProductQuantity(item)),
              ])
            : [["No data", "-"]],
        theme: "grid",
        styles: {
          fontSize: 9,
        },
      });

      // ================================================
      // TOP SELLERS
      // ================================================

      currentY = doc.lastAutoTable.finalY + 12;

      // New page if necessary
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text("Top Sellers", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Seller", "Revenue"]],
        body:
          sellers.length > 0
            ? sellers.map((item) => [
                getSellerName(item),
                formatCurrency(getSellerRevenue(item)),
              ])
            : [["No data", "-"]],
        theme: "grid",
        styles: {
          fontSize: 9,
        },
      });

      // ================================================
      // ORDER STATUS
      // ================================================

      currentY = doc.lastAutoTable.finalY + 12;

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text("Order Status", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Status", "Count"]],
        body:
          orderStatuses.length > 0
            ? orderStatuses.map((item) => [
                formatStatus(item?._id || item?.status),
                formatNumber(item?.count),
              ])
            : [["No data", "-"]],
        theme: "grid",
        styles: {
          fontSize: 9,
        },
      });

      doc.save(`admin-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF report error:", err);
      alert("Unable to generate PDF report.");
    } finally {
      setReportLoading(false);
    }
  };

  // ====================================================
  // CSV REPORT
  // ====================================================

  const downloadCSV = () => {
    try {
      setReportLoading(true);

      const rows = [];

      rows.push(["ADMIN ANALYTICS REPORT"]);
      rows.push([]);

      rows.push(["SUMMARY"]);
      rows.push(["Metric", "Value"]);
      rows.push(["Total Revenue", totalRevenue]);
      rows.push(["Total Orders", totalOrders]);
      rows.push(["Average Order Value", averageOrderValue]);
      rows.push(["Total Users", totalUsers]);
      rows.push([]);

      // ================================================
      // SALES TRENDS
      // ================================================

      rows.push(["SALES TRENDS"]);
      rows.push(["Period", "Revenue"]);

      if (trends.length) {
        trends.forEach((item) => {
          rows.push([formatTrendLabel(item), getTrendRevenue(item)]);
        });
      } else {
        rows.push(["No data", ""]);
      }

      rows.push([]);

      // ================================================
      // TOP PRODUCTS
      // ================================================

      rows.push(["TOP PRODUCTS"]);
      rows.push(["Product", "Quantity Sold"]);

      if (products.length) {
        products.forEach((item) => {
          rows.push([getProductName(item), getProductQuantity(item)]);
        });
      } else {
        rows.push(["No data", ""]);
      }

      rows.push([]);

      // ================================================
      // TOP SELLERS
      // ================================================

      rows.push(["TOP SELLERS"]);
      rows.push(["Seller", "Revenue"]);

      if (sellers.length) {
        sellers.forEach((item) => {
          rows.push([getSellerName(item), getSellerRevenue(item)]);
        });
      } else {
        rows.push(["No data", ""]);
      }

      rows.push([]);

      // ================================================
      // ORDER STATUS
      // ================================================

      rows.push(["ORDER STATUS"]);
      rows.push(["Status", "Count"]);

      if (orderStatuses.length) {
        orderStatuses.forEach((item) => {
          rows.push([
            formatStatus(item?._id || item?.status),
            numberValue(item?.count),
          ]);
        });
      } else {
        rows.push(["No data", ""]);
      }

      // ================================================
      // CSV ESCAPE
      // ================================================

      const escapeCSV = (value) => {
        const stringValue = String(value ?? "");

        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replaceAll('"', '""')}"`;
        }

        return stringValue;
      };

      const csvContent = rows
        .map((row) => row.map(escapeCSV).join(","))
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `admin-analytics-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV report error:", err);
      alert("Unable to generate CSV report.");
    } finally {
      setReportLoading(false);
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="admin-analytics-state">
        <div className="analytics-loader" />
        <h3>Loading analytics...</h3>
        <p>Fetching revenue, orders, products, sellers and customer data.</p>
      </div>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="admin-analytics-content">
      {/* ============================================== */}
      {/* HEADER                                         */}
      {/* ============================================== */}

      <header className="admin-analytics-header">
        <div className="analytics-header-left">
          <div className="analytics-title-icon">
            <BarChart3 size={24} />
          </div>

          <div>
            <h1>Analytics</h1>

            <p>
              Monitor revenue, orders, customers and marketplace performance.
            </p>
          </div>
        </div>

        <div className="analytics-header-actions">
          <button
            type="button"
            className="analytics-refresh-btn"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw size={17} className={refreshing ? "spin" : ""} />

            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <select
            className="analytics-period-select"
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>

          <button
            type="button"
            className="analytics-csv-btn"
            onClick={downloadCSV}
            disabled={reportLoading}
          >
            <FileSpreadsheet size={17} />
            CSV
          </button>

          <button
            type="button"
            className="analytics-pdf-btn"
            onClick={downloadPDF}
            disabled={reportLoading}
          >
            <Download size={17} />
            PDF
          </button>
        </div>
      </header>

      {/* ============================================== */}
      {/* ERROR                                          */}
      {/* ============================================== */}

      {error && (
        <div className="analytics-error-banner">
          <AlertCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* ============================================== */}
      {/* SUMMARY CARDS                                  */}
      {/* ============================================== */}

      <section className="analytics-cards">
        <AnalyticsCard
          icon={IndianRupee}
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="Overall revenue"
        />

        <AnalyticsCard
          icon={ShoppingBag}
          title="Total Orders"
          value={formatNumber(totalOrders)}
          subtitle="Orders processed"
        />

        <AnalyticsCard
          icon={TrendingUp}
          title="Avg. Order Value"
          value={formatCurrency(averageOrderValue)}
          subtitle="Average per order"
        />

        <AnalyticsCard
          icon={Users}
          title="Total Users"
          value={formatNumber(totalUsers)}
          subtitle="Registered customers"
        />
      </section>

      {/* ============================================== */}
      {/* SALES TREND                                    */}
      {/* ============================================== */}

      <section className="analytics-panel sales-trend-panel">
        <div className="analytics-panel-header">
          <div>
            <h2>
              <TrendingUp size={19} />
              Sales Trends
            </h2>

            <p>Revenue performance grouped by {groupBy}.</p>
          </div>
        </div>

        {trends.length ? (
          <div className="trend-list">
            {trends.map((item, index) => {
              const revenueValue = getTrendRevenue(item);

              const width = Math.min(
                100,
                Math.max(4, (revenueValue / maxTrendRevenue) * 100),
              );

              return (
                <div
                  className="trend-row"
                  key={`${formatTrendLabel(item)}-${index}`}
                >
                  <span className="trend-label">{formatTrendLabel(item)}</span>

                  <div className="trend-bar">
                    <i
                      style={{
                        width: `${width}%`,
                      }}
                    />
                  </div>

                  <strong>{formatCurrency(revenueValue)}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyAnalytics message="No sales trend data available." />
        )}
      </section>

      {/* ============================================== */}
      {/* THREE PANELS                                   */}
      {/* ============================================== */}

      <div className="analytics-two">
        {/* ORDER STATUS */}

        <AnalyticsPanel
          title="Order Status"
          icon={ShoppingBag}
          count={orderStatuses.length}
        >
          {orderStatuses.length ? (
            <div className="analytics-list">
              {orderStatuses.map((item, index) => (
                <div
                  className="analytics-line"
                  key={`${item?._id || item?.status}-${index}`}
                >
                  <span>{formatStatus(item?._id || item?.status)}</span>

                  <strong>{formatNumber(item?.count)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyAnalytics message="No order status data." />
          )}
        </AnalyticsPanel>

        {/* TOP PRODUCTS */}

        <AnalyticsPanel
          title="Top Products"
          icon={Package}
          count={products.length}
        >
          {products.length ? (
            <div className="analytics-list">
              {products.map((item, index) => (
                <div
                  className="analytics-line"
                  key={item?._id || item?.product?._id || `product-${index}`}
                >
                  <div className="analytics-item-info">
                    <span>{getProductName(item)}</span>

                    <small>Product</small>
                  </div>

                  <strong>{formatNumber(getProductQuantity(item))} sold</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyAnalytics message="No top product data." />
          )}
        </AnalyticsPanel>

        {/* TOP SELLERS */}

        <AnalyticsPanel title="Top Sellers" icon={Store} count={sellers.length}>
          {sellers.length ? (
            <div className="analytics-list">
              {sellers.map((item, index) => (
                <div
                  className="analytics-line"
                  key={item?._id || item?.seller?._id || `seller-${index}`}
                >
                  <div className="analytics-item-info">
                    <span>{getSellerName(item)}</span>

                    <small>Seller</small>
                  </div>

                  <strong>{formatCurrency(getSellerRevenue(item))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyAnalytics message="No top seller data." />
          )}
        </AnalyticsPanel>
      </div>
    </div>
  );
};

// ======================================================
// ANALYTICS CARD
// ======================================================

const AnalyticsCard = ({ icon: Icon, title, value, subtitle }) => {
  return (
    <div className="analytics-card">
      <div className="analytics-card-top">
        <div className="analytics-card-icon">
          <Icon size={20} />
        </div>

        <span>{title}</span>
      </div>

      <strong>{value}</strong>

      <small>{subtitle}</small>
    </div>
  );
};

// ======================================================
// ANALYTICS PANEL
// ======================================================

const AnalyticsPanel = ({ title, icon: Icon, count, children }) => {
  return (
    <section className="analytics-panel analytics-small-panel">
      <div className="analytics-panel-header">
        <div>
          <h2>
            <Icon size={19} />
            {title}
          </h2>
        </div>

        {count > 0 && <span className="analytics-count">{count}</span>}
      </div>

      {children}
    </section>
  );
};

// ======================================================
// EMPTY
// ======================================================

const EmptyAnalytics = ({ message }) => {
  return (
    <div className="analytics-empty">
      <BarChart3 size={25} />
      <p>{message}</p>
    </div>
  );
};

export default AdminAnalyticsContent;
