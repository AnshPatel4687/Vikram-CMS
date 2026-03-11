// src/components/shared/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Admin ke liye
export const AdminRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (userData?.role !== "admin") return <Navigate to="/employee/dashboard" />;

  return children;
};

// Employee ke liye
export const EmployeeRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (userData?.role !== "employee") return <Navigate to="/admin/dashboard" />;

  return children;
};

const styles = {
  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#4f46e5",
    fontWeight: "600",
  },
};