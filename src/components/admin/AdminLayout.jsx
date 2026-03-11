// src/components/admin/AdminLayout.jsx
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

const AdminLayout = ({ children, pageTitle }) => {
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Navbar */}
        <AdminNavbar pageTitle={pageTitle} />

        {/* Page Content */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f2f5",
  },
  main: {
    marginLeft: "260px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  content: {
    marginTop: "70px",
    padding: "30px",
    flex: 1,
  },
};

export default AdminLayout;