// src/components/admin/AdminSidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FolderKanban, CalendarCheck, DollarSign, BarChart3, Settings, Building2, CalendarOff } from "lucide-react";

const menuItems = [
  { path: "/admin/dashboard",  icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { path: "/admin/employees",  icon: <Users size={18} />,           label: "Employees" },
  { path: "/admin/projects",   icon: <FolderKanban size={18} />,    label: "Projects" },
  { path: "/admin/attendance", icon: <CalendarCheck size={18} />,   label: "Attendance" },
  { path: "/admin/payroll",    icon: <DollarSign size={18} />,      label: "Payroll" },
  { path: "/admin/leaves",     icon: <CalendarOff size={18} />,     label: "Leaves" },
  { path: "/admin/reports",    icon: <BarChart3 size={18} />,       label: "Reports" },
  { path: "/admin/settings",   icon: <Settings size={18} />,        label: "Settings" },
];

const AdminSidebar = () => {
  const location = useLocation();
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .asb{width:260px;min-height:100vh;position:fixed;left:0;top:0;z-index:100;display:flex;flex-direction:column;font-family:'Plus Jakarta Sans',sans-serif;background:#0f0f1a;border-right:1px solid rgba(255,255,255,0.06);}
        .asb-glow{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%);top:-80px;left:-80px;pointer-events:none;filter:blur(40px);animation:asbg 8s ease-in-out infinite alternate;}
        .asb-glow2{position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.12) 0%,transparent 70%);bottom:60px;right:-40px;pointer-events:none;filter:blur(40px);animation:asbg 10s ease-in-out infinite alternate reverse;}
        @keyframes asbg{0%{opacity:.6;transform:scale(1);}100%{opacity:1;transform:scale(1.1);}}
        .asb-logo{position:relative;z-index:2;display:flex;align-items:center;gap:12px;padding:26px 22px 22px;border-bottom:1px solid rgba(255,255,255,0.06);}
        .asb-logo-ico{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 16px rgba(99,102,241,0.35);flex-shrink:0;}
        .asb-logo-name{font-size:17px;font-weight:800;color:#fff;letter-spacing:-.3px;line-height:1;}
        .asb-logo-sub{font-size:11px;color:rgba(255,255,255,0.35);margin-top:3px;font-weight:400;}
        .asb-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:3px;position:relative;z-index:2;}
        .asb-section{font-size:10px;font-weight:700;color:rgba(255,255,255,0.2);letter-spacing:1.5px;text-transform:uppercase;padding:10px 12px 6px;margin-top:4px;}
        .asb-item{display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:11px;color:rgba(255,255,255,0.45);text-decoration:none;transition:all .22s cubic-bezier(.4,0,.2,1);font-size:14px;font-weight:500;position:relative;overflow:hidden;}
        .asb-item:hover{color:rgba(255,255,255,0.85);background:rgba(255,255,255,0.05);}
        .asb-item.active{color:#fff;background:rgba(99,102,241,0.18);font-weight:600;}
        .asb-item.active::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#6366f1,#06b6d4);}
        .asb-item-ico{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.04);flex-shrink:0;transition:background .22s;}
        .asb-item.active .asb-item-ico{background:rgba(99,102,241,0.25);}
        .asb-item:hover .asb-item-ico{background:rgba(255,255,255,0.08);}
        .asb-active-pill{position:absolute;right:12px;width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#06b6d4);box-shadow:0 0 8px rgba(99,102,241,0.6);}
        .asb-bottom{position:relative;z-index:2;padding:16px 22px;border-top:1px solid rgba(255,255,255,0.06);}
        .asb-ver{font-size:11px;color:rgba(255,255,255,0.18);text-align:center;font-weight:500;}
      `}</style>
      <div className="asb">
        <div className="asb-glow" /><div className="asb-glow2" />
        <div className="asb-logo">
          <div className="asb-logo-ico">🏢</div>
          <div>
            <div className="asb-logo-name">CompanyMS</div>
            <div className="asb-logo-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="asb-nav">
          <div className="asb-section">Main Menu</div>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`asb-item ${isActive ? "active" : ""}`}>
                <span className="asb-item-ico">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="asb-active-pill" />}
              </Link>
            );
          })}
        </nav>
        <div className="asb-bottom">
          <div className="asb-ver">Company MS v1.0</div>
        </div>
      </div>
    </>
  );
};
export default AdminSidebar;