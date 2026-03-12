// src/components/admin/AdminLayout.jsx
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

const AdminLayout = ({ children, pageTitle }) => (
  <div style={{ display:"flex", minHeight:"100vh", background:"#f6f8fc" }}>
    <AdminSidebar />
    <div style={{ marginLeft:"260px", flex:1, display:"flex", flexDirection:"column" }}>
      <AdminNavbar pageTitle={pageTitle} />
      <div style={{ marginTop:"68px", padding:"28px", flex:1 }}>
        {children}
      </div>
    </div>
  </div>
);
export default AdminLayout;