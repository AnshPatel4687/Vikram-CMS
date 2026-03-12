// src/components/employee/EmpSidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, CalendarCheck, DollarSign, CalendarOff, User } from "lucide-react";

const menuItems = [
  { path: "/employee/dashboard",  icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { path: "/employee/projects",   icon: <FolderKanban size={18} />,    label: "My Projects" },
  { path: "/employee/attendance", icon: <CalendarCheck size={18} />,   label: "My Attendance" },
  { path: "/employee/salary",     icon: <DollarSign size={18} />,      label: "My Salary" },
  { path: "/employee/leave",      icon: <CalendarOff size={18} />,     label: "Leave Request" },
  { path: "/employee/profile",    icon: <User size={18} />,            label: "My Profile" },
];

const EmpSidebar = () => {
  const location = useLocation();
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .esb{width:260px;min-height:100vh;position:fixed;left:0;top:0;z-index:100;display:flex;flex-direction:column;font-family:'Plus Jakarta Sans',sans-serif;background:#0f0f1a;border-right:1px solid rgba(255,255,255,0.06);}
        .esb-glow{position:absolute;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.18) 0%,transparent 70%);top:-70px;left:-70px;pointer-events:none;filter:blur(40px);animation:esbg 9s ease-in-out infinite alternate;}
        .esb-glow2{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);bottom:60px;right:-30px;pointer-events:none;filter:blur(38px);animation:esbg 11s ease-in-out infinite alternate reverse;}
        @keyframes esbg{0%{opacity:.6;transform:scale(1);}100%{opacity:1;transform:scale(1.1);}}
        .esb-logo{position:relative;z-index:2;display:flex;align-items:center;gap:12px;padding:26px 22px 22px;border-bottom:1px solid rgba(255,255,255,0.06);}
        .esb-logo-ico{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#6366f1);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 16px rgba(6,182,212,0.35);flex-shrink:0;}
        .esb-logo-name{font-size:17px;font-weight:800;color:#fff;letter-spacing:-.3px;line-height:1;}
        .esb-logo-sub{font-size:11px;color:rgba(255,255,255,0.35);margin-top:3px;font-weight:400;}
        .esb-nav{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:3px;position:relative;z-index:2;}
        .esb-section{font-size:10px;font-weight:700;color:rgba(255,255,255,0.2);letter-spacing:1.5px;text-transform:uppercase;padding:10px 12px 6px;margin-top:4px;}
        .esb-item{display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:11px;color:rgba(255,255,255,0.45);text-decoration:none;transition:all .22s cubic-bezier(.4,0,.2,1);font-size:14px;font-weight:500;position:relative;overflow:hidden;}
        .esb-item:hover{color:rgba(255,255,255,0.85);background:rgba(255,255,255,0.05);}
        .esb-item.active{color:#fff;background:rgba(6,182,212,0.16);font-weight:600;}
        .esb-item.active::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#06b6d4,#6366f1);}
        .esb-item-ico{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.04);flex-shrink:0;transition:background .22s;}
        .esb-item.active .esb-item-ico{background:rgba(6,182,212,0.22);}
        .esb-item:hover .esb-item-ico{background:rgba(255,255,255,0.08);}
        .esb-active-pill{position:absolute;right:12px;width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#6366f1);box-shadow:0 0 8px rgba(6,182,212,0.6);}
        .esb-bottom{position:relative;z-index:2;padding:16px 22px;border-top:1px solid rgba(255,255,255,0.06);}
        .esb-ver{font-size:11px;color:rgba(255,255,255,0.18);text-align:center;font-weight:500;}
      `}</style>
      <div className="esb">
        <div className="esb-glow" /><div className="esb-glow2" />
        <div className="esb-logo">
          <div className="esb-logo-ico">🏢</div>
          <div>
            <div className="esb-logo-name">CompanyMS</div>
            <div className="esb-logo-sub">Employee Panel</div>
          </div>
        </div>
        <nav className="esb-nav">
          <div className="esb-section">My Menu</div>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`esb-item ${isActive ? "active" : ""}`}>
                <span className="esb-item-ico">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="esb-active-pill" />}
              </Link>
            );
          })}
        </nav>
        <div className="esb-bottom">
          <div className="esb-ver">Company MS v1.0</div>
        </div>
      </div>
    </>
  );
};
export default EmpSidebar;