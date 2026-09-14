import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { fetchMySellerProfile } from "../sellerSlice";
import SellerHeader from "./SellerHeader";
import SellerSidebar from "./SellerSidebar";
import "./SellerProtectedGuard.css";

const SellerProtectedGuard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, isAuthenticated } = useSelector((state) => state.auth || {});
  const sellerState = useSelector((state) => state.seller || {});
  const {
    profile,
    hasProfile,
    profileLoading,
    profileFetched,
    error,
  } = sellerState;

  useEffect(() => {
    if (
      isAuthenticated &&
      user?.role === "seller" &&
      !profileFetched &&
      !profileLoading
    ) {
      dispatch(fetchMySellerProfile());
    }
  }, [dispatch, isAuthenticated, user?.role, profileFetched, profileLoading]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== "seller") {
    return <Navigate to="/" replace />;
  }

  if (profileLoading || !profileFetched) {
    return (
      <div className="seller-fullscreen-state">
        <div className="seller-loader-ring" />
        <h2>Verifying your seller account</h2>
        <p>Please wait while we load your store permissions.</p>
      </div>
    );
  }

  if (error && !hasProfile) {
    return (
      <div className="seller-fullscreen-state">
        <div className="seller-state-icon warning"><FiAlertTriangle /></div>
        <h2>Unable to verify seller profile</h2>
        <p>{error}</p>
        <button className="seller-primary-btn" onClick={() => dispatch(fetchMySellerProfile())}>
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  if (!hasProfile) {
    return location.pathname === "/seller/setup" ? <Outlet /> : <Navigate to="/seller/setup" replace />;
  }

  if (!profile) {
    return (
      <div className="seller-fullscreen-state">
        <div className="seller-state-icon warning"><FiAlertTriangle /></div>
        <h2>Seller profile unavailable</h2>
        <p>Your seller record could not be loaded correctly.</p>
        <button className="seller-primary-btn" onClick={() => dispatch(fetchMySellerProfile())}>
          <FiRefreshCw /> Refresh
        </button>
      </div>
    );
  }

  const status = profile.verificationStatus;
  const blocked = profile.isBlocked === true;
  const inactive = profile.isActive === false;

  if (status === "pending") {
    const allowed = ["/seller/pending", "/seller/settings", "/seller/profile"];
    if (!allowed.includes(location.pathname)) {
      return <Navigate to="/seller/pending" replace />;
    }
  }

  if (status === "rejected") {
    return location.pathname === "/seller/setup" ? <Outlet /> : <Navigate to="/seller/setup" replace />;
  }

  if (blocked || inactive) {
    return (
      <div className="seller-restricted-screen">
        <div className="seller-restricted-card">
          <div className="seller-state-icon warning"><FiAlertTriangle /></div>
          <h2>{blocked ? "Seller Account Blocked" : "Seller Account Inactive"}</h2>
          <p>
            {blocked
              ? profile.blockReason || "Your seller account has been blocked by marketplace administration."
              : "Your seller account is currently inactive. Contact marketplace support if you need assistance."}
          </p>
          <button className="seller-secondary-btn" onClick={() => dispatch(fetchMySellerProfile())}>
            <FiRefreshCw /> Refresh Status
          </button>
        </div>
      </div>
    );
  }

  if (status !== "approved") {
    return (
      <div className="seller-fullscreen-state">
        <div className="seller-state-icon warning"><FiAlertTriangle /></div>
        <h2>Seller status unavailable</h2>
        <p>Please refresh your seller account status.</p>
        <button className="seller-primary-btn" onClick={() => dispatch(fetchMySellerProfile())}>Refresh</button>
      </div>
    );
  }

  return (
    <div className="seller-app-shell">
      <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="seller-main-shell">
        <SellerHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="seller-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerProtectedGuard;
