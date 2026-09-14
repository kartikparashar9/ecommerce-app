import { useState } from "react";
import { Outlet } from "react-router-dom";
import "./AdminLayout.css"

import AdminSidebar from "../../features/admin/component/layout/AdminSidebar";
import AdminHeader from "../../features/admin/component/layout/AdminHeader";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}

      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* MAIN SECTION */}

      <div className="admin-main">
        {/* HEADER */}

        <AdminHeader setIsOpen={setIsSidebarOpen} />

        {/* PAGE CONTENT */}

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
