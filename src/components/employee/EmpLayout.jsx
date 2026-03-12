// src/components/employee/EmpLayout.jsx
import EmpSidebar from "./EmpSidebar";
import EmpNavbar from "./EmpNavbar";

const EmpLayout = ({ children, pageTitle }) => (
  <div style={{ display:"flex", minHeight:"100vh", background:"#f6f8fc" }}>
    <EmpSidebar />
    <div style={{ marginLeft:"260px", flex:1, display:"flex", flexDirection:"column" }}>
      <EmpNavbar pageTitle={pageTitle} />
      <div style={{ marginTop:"68px", padding:"28px", flex:1 }}>
        {children}
      </div>
    </div>
  </div>
);
export default EmpLayout;