// src/components/employee/EmpLayout.jsx
import EmpSidebar from "./EmpSidebar";
import EmpNavbar from "./EmpNavbar";

const EmpLayout = ({ children, pageTitle }) => {
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <EmpSidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Navbar */}
        <EmpNavbar pageTitle={pageTitle} />

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

export default EmpLayout;