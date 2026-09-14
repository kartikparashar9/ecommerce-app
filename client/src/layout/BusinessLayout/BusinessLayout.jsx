import { useState } from "react";
import { Outlet } from "react-router-dom";

import SellerSidebar from "../../features/seller/component/SellerSidebar";
import SellerHeader from "../../features/seller/component/SellerHeader";

import "./BusinessLayout.css";

const BusinessLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="business-layout">
      <div
        className={`sidebar-overlay ${
          isSidebarOpen ? "show" : ""
        }`}
        onClick={closeSidebar}
      />

      <SellerSidebar
        isOpen={isSidebarOpen}
        closeSidebar={closeSidebar}
      />

      <div className="business-main">
        <SellerHeader openSidebar={openSidebar} />

        <main className="business-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BusinessLayout;