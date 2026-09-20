import { Route, Routes, Navigate } from "react-router-dom";

import MainLayout from "../layout/MainLayout/MainLayout";
import UserLayout from "../layout/UserLayout/UserLayout";

import MarketplaceGuard from "../features/auth/component/MarketplaceGuard";
import ProtectedRoute from "../features/auth/component/Protected";

import HomePage from "../pages/HomePage";
import SearchResultsPage from "../pages/SearchResultsPage";
import ElectronicsPage from "../pages/ElectronicsPage";
import FashionPage from "../pages/FashionPage";
import BeautyPage from "../pages/BeautyPage";
import AccessoriesPage from "../pages/AccessoriesPage";
import ProductDetailsPage from "../pages/ProductDetailsPage";

import UserProfile from "../pages/UserProfile";
import WishlistPage from "../pages/WishlistPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import PaymentGatewayPage from "../pages/Payment";
import OrderSuccess from "../pages/OrderSuccess";
import UserOrder from "../pages/UserOrder";
import OrderDetailsPage from "../pages/OrderDetailsPage";
import OrderTrackingPage from "../pages/OrderTrackingPage";
import AddressPage from "../pages/AddressPage";
import NotificationsPage from "../pages/NotificationsPage";

export default function UserRoutes() {
  return (
    <Routes>
      {/* =================================================
          PUBLIC MARKETPLACE
          ================================================= */}

      <Route element={<MarketplaceGuard />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/electronics" element={<ElectronicsPage />} />
          <Route path="/clothes" element={<FashionPage />} />
          <Route path="/beauty" element={<BeautyPage />} />
          <Route path="/accesories" element={<AccessoriesPage />} />

          {/* Backward-compatible aliases */}

          <Route path="/fashion" element={<Navigate to="/clothes" replace />} />

          <Route
            path="/accessories"
            element={<Navigate to="/accesories" replace />}
          />

          <Route path="/product/:slug" element={<ProductDetailsPage />} />
        </Route>
      </Route>

      {/* =================================================
          PROTECTED USER AREA
          ================================================= */}

      <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
        <Route element={<UserLayout />}>
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* ---------------------------------------------
              PAYMENT
              --------------------------------------------- */}

          <Route path="/payment/:orderId" element={<PaymentGatewayPage />} />

          {/* ---------------------------------------------
              ORDER SUCCESS
              --------------------------------------------- */}

          <Route path="/order-success" element={<OrderSuccess />} />

          {/* ---------------------------------------------
              ORDERS
              --------------------------------------------- */}

          <Route path="/orders" element={<UserOrder />} />
          {/* ---------------------------------------------
              ORDER TRACKING
              --------------------------------------------- */}

          <Route
            path="/orders/:orderId/track"
            element={<OrderTrackingPage />}
          />

          <Route
            path="/orders/:orderId"
            element={<OrderDetailsPage />}
          />

          {/* ---------------------------------------------
              ADDRESS
              --------------------------------------------- */}

          <Route path="/addresses" element={<AddressPage />} />

          {/* ---------------------------------------------
              NOTIFICATIONS
              --------------------------------------------- */}

          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
