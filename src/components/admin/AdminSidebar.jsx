// src/components/admin/AdminSidebar.jsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarCheck,
  DollarSign,
  BarChart3,
  Settings,
  Building2,
  CalendarOff,
} from "lucide-react";

const menuItems = [
  { path: "/admin/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { path: "/admin/employees", icon: <Users size={20} />, label: "Employees" },
  { path: "/admin/projects", icon: <FolderKanban size={20} />, label: "Projects" },
  { path: "/admin/attendance", icon: <CalendarCheck size={20} />, label: "Attendance" },
  { path: "/admin/payroll", icon: <DollarSign size={20} />, label: "Payroll" },
  { path: "/admin/leaves", icon: <CalendarOff size={20} />, label: "Leaves" },
  { path: "/admin/reports", icon: <BarChart3 size={20} />, label: "Reports" },
  { path: "/admin/settings", icon: <Settings size={20} />, label: "Settings" },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <Building2 size={32} color="#fff" />
        <div>
          <h2 style={styles.logoText}>CompanyMS</h2>
          <p style={styles.logoSub}>Admin Panel</p>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.menuItem,
                background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                borderLeft: isActive ? "4px solid #fff" : "4px solid transparent",
              }}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              <span style={styles.menuLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={styles.bottom}>
        <p style={styles.bottomText}>Company MS v1.0</p>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #4f46e5 0%, #3730a3 100%)",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "24px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoText: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
  },
  logoSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "12px",
    margin: 0,
  },
  nav: {
    flex: 1,
    padding: "20px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "10px",
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
    transition: "all 0.2s",
    fontSize: "15px",
  },
  menuIcon: {
    display: "flex",
    alignItems: "center",
  },
  menuLabel: {
    fontWeight: "500",
  },
  bottom: {
    padding: "20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  bottomText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "12px",
    textAlign: "center",
  },
};

export default AdminSidebar;