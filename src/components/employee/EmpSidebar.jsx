// src/components/employee/EmpSidebar.jsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CalendarCheck,
  DollarSign,
  CalendarOff,
  User,
} from "lucide-react";
import { Building2 } from "lucide-react";

const menuItems = [
  { path: "/employee/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { path: "/employee/projects", icon: <FolderKanban size={20} />, label: "My Projects" },
  { path: "/employee/attendance", icon: <CalendarCheck size={20} />, label: "My Attendance" },
  { path: "/employee/salary", icon: <DollarSign size={20} />, label: "My Salary" },
  { path: "/employee/leave", icon: <CalendarOff size={20} />, label: "Leave Request" },
  { path: "/employee/profile", icon: <User size={20} />, label: "My Profile" },
];

const EmpSidebar = () => {
  const location = useLocation();

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <Building2 size={32} color="#fff" />
        <div>
          <h2 style={styles.logoText}>CompanyMS</h2>
          <p style={styles.logoSub}>Employee Panel</p>
        </div>
      </div>

      {/* Menu */}
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

      {/* Bottom */}
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
    background: "linear-gradient(180deg, #06b6d4 0%, #0891b2 100%)",
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

export default EmpSidebar;