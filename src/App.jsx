// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { AdminRoute, EmployeeRoute } from "./components/shared/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Employees from "./pages/admin/Employees";
import Projects from "./pages/admin/Projects";
import Attendance from "./pages/admin/Attendance";
import Payroll from "./pages/admin/Payroll";
import Reports from "./pages/admin/Reports";
import Leaves from "./pages/admin/Leaves";
import Settings from "./pages/admin/Settings";
import FixEmployeeIds from "./pages/admin/FixEmployeeIds";

// Employee Pages
import EmpDashboard from "./pages/employee/EmpDashboard";
import EmpProjects from "./pages/employee/EmpProjects";
import EmpAttendance from "./pages/employee/EmpAttendance";
import EmpSalary from "./pages/employee/EmpSalary";
import LeaveRequest from "./pages/employee/LeaveRequest";
import EmpProfile from "./pages/employee/EmpProfile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/employees" element={<AdminRoute><Employees /></AdminRoute>} />
          <Route path="/admin/projects" element={<AdminRoute><Projects /></AdminRoute>} />
          <Route path="/admin/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
          <Route path="/admin/payroll" element={<AdminRoute><Payroll /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/admin/leaves" element={<AdminRoute><Leaves /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          <Route path="/admin/fix-ids" element={<AdminRoute><FixEmployeeIds /></AdminRoute>} />

          {/* Employee Routes */}
          <Route path="/employee/dashboard" element={<EmployeeRoute><EmpDashboard /></EmployeeRoute>} />
          <Route path="/employee/projects" element={<EmployeeRoute><EmpProjects /></EmployeeRoute>} />
          <Route path="/employee/attendance" element={<EmployeeRoute><EmpAttendance /></EmployeeRoute>} />
          <Route path="/employee/salary" element={<EmployeeRoute><EmpSalary /></EmployeeRoute>} />
          <Route path="/employee/leave" element={<EmployeeRoute><LeaveRequest /></EmployeeRoute>} />
          <Route path="/employee/profile" element={<EmployeeRoute><EmpProfile /></EmployeeRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;