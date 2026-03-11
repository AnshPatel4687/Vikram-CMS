// src/components/admin/AdminNavbar.jsx
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import toast from "react-hot-toast";
import NotificationBell from "../shared/NotificationBell";

const AdminNavbar = ({ pageTitle }) => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed!");
    }
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.left}>
        <h2 style={styles.title}>{pageTitle}</h2>
      </div>

      <div style={styles.right}>
        {/* Real-time Notification Bell */}
        <NotificationBell />

        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            <User size={18} color="#fff" />
          </div>
          <div>
            <p style={styles.userName}>{userData?.name || "Admin"}</p>
            <p style={styles.userRole}>Administrator</p>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  navbar: {
    height: "70px",
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    position: "fixed",
    top: 0,
    left: "260px",
    right: 0,
    zIndex: 99,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  left: {
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  userRole: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "#fee2e2",
    color: "#ef4444",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
};

export default AdminNavbar;