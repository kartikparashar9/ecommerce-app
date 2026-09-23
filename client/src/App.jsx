import { Routes, Route } from "react-router-dom";

// =====================================================
// LAYOUTS
// =====================================================

import MainLayout from "./layout/MainLayout/MainLayout";
import AdminLayout from "./layout/AdminLayout/AdminLayout";
import AuthLayout from "./layout/AuthLayout/AuthLayout";
import UserLayout from "./layout/UserLayout/UserLayout";

// =====================================================
// AUTH / ROUTE GUARDS
// =====================================================

import ProtectedRoute from "./features/auth/component/Protected";
import RoleProtected from "./features/auth/component/RoleProtected";
import MarketplaceGuard from "./features/auth/component/MarketplaceGuard";

// =====================================================
// PUBLIC / AUTH PAGES
// =====================================================

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/Signup";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";

// =====================================================
// USER PAGES
// =====================================================

import UserProfilePage from "./pages/UserProfile";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentGatewayPage from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess";
import OrdersPage from "./features/order/component/Orders";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";

// =====================================================
// CATEGORY PAGES
// =====================================================

import Fashion from "./pages/FashionPage";
import Beauty from "./pages/BeautyPage";
import Accessories from "./pages/AccessoriesPage";
import Electronics from "./pages/ElectronicsPage";

// =====================================================
// PRODUCT PAGES
// =====================================================

import ProductDetails from "./features/products/pages/ProductDetails/ProductDetails";
import SearchResults from "./features/products/pages/SearchResults/SearchResults";

// =====================================================
// SELLER
// =====================================================

import SellerRoutes from "./features/seller/sellerRoutes";
import SellerSetup from "./features/seller/business/SellerSetup";
import SellerPending from "./features/seller/business/SellerPending";

// =====================================================
// ADMIN
// =====================================================

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSellers from "./pages/AdminSellers";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminBrands from "./pages/AdminBrands";
import AdminNotification from "./pages/AdminNotification";
import AdminCategories from "./pages/AdminCategories";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminReviews from "./pages/AdminReview";
import AdminSettings from "./pages/AdminSettings";

function App() {
  return (
    <Routes>
      {/* =====================================================
          AUTH ROUTES
      ===================================================== */}

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* =====================================================
          MARKETPLACE / PUBLIC WEBSITE
      ===================================================== */}

      <Route element={<MarketplaceGuard />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/fashion" element={<Fashion />} />
          <Route path="/beauty" element={<Beauty />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/electronics" element={<Electronics />} />

          <Route path="/search" element={<SearchResults />} />

          <Route path="/product/:slug" element={<ProductDetails />} />
        </Route>
      </Route>

      {/* =====================================================
          AUTHENTICATED USER ROUTES
      ===================================================== */}

      <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
        <Route element={<UserLayout />}>
          {/* Profile */}
          <Route path="/profile" element={<UserProfilePage />} />

          {/* Wishlist */}
          <Route path="/wishlist" element={<WishlistPage />} />

          {/* Cart */}
          <Route path="/cart" element={<CartPage />} />

          {/* Checkout */}
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Online Payment */}
          <Route path="/payment/:orderId" element={<PaymentGatewayPage />} />

          {/* Order Success */}
          <Route path="/order-success" element={<OrderSuccess />} />

          {/* Orders */}
          <Route path="/orders" element={<OrdersPage />} />

          {/* Order Tracking */}
          <Route
            path="/orders/:orderId/track"
            element={<OrderTrackingPage />}
          />

          {/* Order Details */}
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        </Route>
      </Route>

      {/* =====================================================
          SELLER ONBOARDING
          Normal logged-in users can enter this only when
          they explicitly choose "Become a Seller". 
      ===================================================== */}

      <Route element={<ProtectedRoute />}>
        <Route path="/seller/setup" element={<SellerSetup />} />

        <Route path="/seller/pending" element={<SellerPending />} />
      </Route>

      {/* =====================================================
          SELLER SYSTEM
          Only approved sellers can access seller dashboard.
      ===================================================== */}

      <Route element={<RoleProtected allowedRoles={["seller"]} />}>
        <Route path="/seller/dashboard/*" element={<SellerRoutes />} />
      </Route>

      {/* =====================================================
          ADMIN SYSTEM
      ===================================================== */}

      <Route element={<RoleProtected allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/users" element={<AdminUsers />} />

          <Route path="/admin/sellers" element={<AdminSellers />} />

          <Route path="/admin/products" element={<AdminProducts />} />

          <Route path="/admin/orders" element={<AdminOrders />} />

          <Route path="/admin/brands" element={<AdminBrands />} />

          <Route path="/admin/notifications" element={<AdminNotification />} />

          <Route path="/admin/categories" element={<AdminCategories />} />

          <Route path="/admin/analytics" element={<AdminAnalytics />} />

          <Route path="/admin/reviews" element={<AdminReviews />} />

          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* =====================================================
          404
      ===================================================== */}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
