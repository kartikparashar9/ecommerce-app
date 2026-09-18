import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// PROTECTION GUARD & LAYOUT
import SellerProtectedGuard from "./component/SellerProtectedGurad";

// SELLER MODULE PAGES
import SellerSetup from "./business/SellerSetup";
import SellerPending from "./business/SellerPending";
import SellerProfile from "./business/SellerProfile";
import SellerDashboard from "./dashboard/SellerDashboard";
import MyProducts from "./products/MyProducts";
import SellerOrders from "./orders/SellerOrders";
import SellerSettings from "./settings/SellerSettings";
import SellerAnalytics from "./analytics/analytics";

const SellerRoutes = () => {
    return (
        <Routes>
            <Route element={<SellerProtectedGuard />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="setup" element={<SellerSetup />} />
                <Route path="pending" element={<SellerPending />} />
                <Route path="profile" element={<SellerProfile />} />
                <Route path="dashboard" element={<SellerDashboard />} />
                <Route path="products" element={<MyProducts />} />
                <Route path="orders" element={<SellerOrders />} />
                <Route path="analytics" element={<SellerAnalytics />} />
                <Route path="settings" element={<SellerSettings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default SellerRoutes;