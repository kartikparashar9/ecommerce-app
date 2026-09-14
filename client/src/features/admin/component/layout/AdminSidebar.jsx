import {
  FiGrid,
  FiUsers,
  FiShoppingBag,
  FiBox,
  FiPackage,
  FiTag,
  FiBarChart2,
  FiStar,
  FiBell,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiMenu,
} from "react-icons/fi";

import { NavLink } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: FiGrid,
    },

    {
      name: "Users",
      path: "/admin/users",
      icon: FiUsers,
    },

    {
      name: "Sellers",
      path: "/admin/sellers",
      icon: FiShoppingBag,
    },

    {
      name: "Products",
      path: "/admin/products",
      icon: FiBox,
    },

    {
      name: "Orders",
      path: "/admin/orders",
      icon: FiPackage,
    },

    {
      name: "Categories",
      path: "/admin/categories",
      icon: FiTag,
    },

    {
      name: "Brands",
      path: "/admin/brands",
      icon: FiTag,
    },

    {
      name: "Reviews",
      path: "/admin/reviews",
      icon: FiStar,
    },

    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: FiBarChart2,
    },
  ];

  return (
    <aside
      className={`
                admin-sidebar
                ${isOpen ? "open" : ""}
            `}
    >
      {/* LOGO */}

      <div className="admin-sidebar-logo">
        <div className="admin-logo-box">JB</div>

        <div className="admin-logo-text">
          <br />
          <h2>JustBuy</h2>

          <span>ADMIN PANEL</span>
        </div>

        <button
          className="admin-collapse-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FiChevronLeft />
        </button>
      </div>

      {/* NAVIGATION */}

      <nav className="admin-navigation">
        <p className="admin-menu-title">MAIN MENU</p>

        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `admin-nav-item
                                        ${isActive ? "active" : ""}`
            }
          >
            <Icon className="admin-nav-icon" />

            <span>{name}</span>
          </NavLink>
        ))}

        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `admin-nav-item ${isActive ? "active" : ""}`
          }
        >
          <FiSettings className="admin-nav-icon" />

          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
