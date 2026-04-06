// src/App.jsx
import { useState, useEffect } from "react";
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

// ── Splash Screen ─────────────────────────────────────────────────────────────
const SplashScreen = ({ onDone }) => {
  const [phase, setPhase] = useState("enter"); // enter → hold → exit

  useEffect(() => {
    // Phase 1: logo animate in (0.6s)
    // Phase 2: hold for 1.4s
    // Phase 3: fade out (0.5s) then call onDone
    const t1 = setTimeout(() => setPhase("hold"),  600);
    const t2 = setTimeout(() => setPhase("exit"),  2000);
    const t3 = setTimeout(() => onDone(),          2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#0f0f1a",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 24,
      opacity:    phase === "exit" ? 0 : 1,
      transition: phase === "exit" ? "opacity 0.5s ease" : "none",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

        .sp-bg-blob {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
        }

        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.6) translateY(20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes splashTextIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashPulse {
          0%, 100% { box-shadow: 0 0 0 0   rgba(99,102,241,0.5),  0 8px 32px rgba(99,102,241,0.4); }
          50%       { box-shadow: 0 0 0 18px rgba(99,102,241,0),   0 8px 32px rgba(99,102,241,0.6); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40%            { transform: scale(1); opacity: 1; }
        }
        @keyframes blobFloat {
          0%,100% { transform: translate(0,0)   scale(1); }
          50%      { transform: translate(20px,-20px) scale(1.06); }
        }
      `}</style>

      {/* Background blobs */}
      <div className="sp-bg-blob" style={{
        width:400, height:400,
        background:"rgba(99,102,241,0.2)",
        top:-100, left:-80,
        animation:"blobFloat 10s ease-in-out infinite",
      }}/>
      <div className="sp-bg-blob" style={{
        width:320, height:320,
        background:"rgba(6,182,212,0.15)",
        bottom:-80, right:-60,
        animation:"blobFloat 8s ease-in-out infinite reverse",
      }}/>

      {/* Logo ring */}
      <div style={{
        width: 90, height: 90, borderRadius: 24,
        background: "linear-gradient(135deg, #6366f1, #06b6d4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40,
        animation: "splashLogoIn 0.6s cubic-bezier(.34,1.56,.64,1) forwards, splashPulse 2s ease-in-out 0.6s infinite",
        position: "relative",
      }}>
        🏢
        {/* Glow ring */}
        <div style={{
          position:"absolute", inset:-3, borderRadius:27,
          background:"linear-gradient(135deg,rgba(99,102,241,0.5),rgba(6,182,212,0.5))",
          zIndex:-1, filter:"blur(10px)",
        }}/>
      </div>

      {/* Company name */}
      <div style={{
        textAlign:"center",
        animation:"splashTextIn 0.5s cubic-bezier(.22,1,.36,1) 0.4s both",
      }}>
        <p style={{
          fontFamily:"'Plus Jakarta Sans',sans-serif",
          fontSize:28, fontWeight:800, color:"#fff",
          letterSpacing:"-0.5px", margin:"0 0 6px",
        }}>
          Company<span style={{color:"#6366f1"}}>MS</span>
        </p>
        <p style={{
          fontFamily:"'Plus Jakarta Sans',sans-serif",
          fontSize:13, fontWeight:500,
          color:"rgba(255,255,255,0.35)",
          margin:0, letterSpacing:"1.5px", textTransform:"uppercase",
        }}>
          Management System
        </p>
      </div>

      {/* Loading dots */}
      <div style={{
        display:"flex", gap:8, marginTop:8,
        animation:"splashTextIn 0.5s ease 0.7s both",
      }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:8, height:8, borderRadius:"50%",
            background:"#6366f1",
            animation:`splashDot 1.2s ease-in-out ${i*0.2}s infinite`,
          }}/>
        ))}
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />

        {/* Splash — only on first load */}
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

        {/* App routes — render behind splash, show after */}
        <div style={{ visibility: showSplash ? "hidden" : "visible" }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard"  element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/employees"  element={<AdminRoute><Employees /></AdminRoute>} />
            <Route path="/admin/projects"   element={<AdminRoute><Projects /></AdminRoute>} />
            <Route path="/admin/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
            <Route path="/admin/payroll"    element={<AdminRoute><Payroll /></AdminRoute>} />
            <Route path="/admin/reports"    element={<AdminRoute><Reports /></AdminRoute>} />
            <Route path="/admin/leaves"     element={<AdminRoute><Leaves /></AdminRoute>} />
            <Route path="/admin/settings"   element={<AdminRoute><Settings /></AdminRoute>} />
            <Route path="/admin/fix-ids"    element={<AdminRoute><FixEmployeeIds /></AdminRoute>} />

            {/* Employee Routes */}
            <Route path="/employee/dashboard"  element={<EmployeeRoute><EmpDashboard /></EmployeeRoute>} />
            <Route path="/employee/projects"   element={<EmployeeRoute><EmpProjects /></EmployeeRoute>} />
            <Route path="/employee/attendance" element={<EmployeeRoute><EmpAttendance /></EmployeeRoute>} />
            <Route path="/employee/salary"     element={<EmployeeRoute><EmpSalary /></EmployeeRoute>} />
            <Route path="/employee/leave"      element={<EmployeeRoute><LeaveRequest /></EmployeeRoute>} />
            <Route path="/employee/profile"    element={<EmployeeRoute><EmpProfile /></EmployeeRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;