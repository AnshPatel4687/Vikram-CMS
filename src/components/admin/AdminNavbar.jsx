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
    try { await logout(); toast.success("Logged out!"); navigate("/"); }
    catch { toast.error("Logout failed!"); }
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .anb{height:68px;background:#fff;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:fixed;top:0;left:260px;right:0;z-index:99;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 1px 20px rgba(0,0,0,0.04);}
        .anb-left{}
        .anb-title{font-size:19px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .anb-right{display:flex;align-items:center;gap:14px;}
        .anb-user{display:flex;align-items:center;gap:10px;padding:7px 14px 7px 7px;border-radius:50px;background:#f8fafc;border:1px solid #e2e8f0;transition:all .2s;}
        .anb-user:hover{background:#f1f5f9;border-color:#d0d9e8;}
        .anb-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#06b6d4);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(99,102,241,0.3);}
        .anb-uname{font-size:13.5px;font-weight:700;color:#0f172a;line-height:1;}
        .anb-urole{font-size:11px;color:#94a3b8;line-height:1;margin-top:2px;}
        .anb-logout{display:flex;align-items:center;gap:7px;padding:9px 16px;background:linear-gradient(135deg,#fef2f2,#fee2e2);color:#ef4444;border:1px solid #fecaca;border-radius:50px;cursor:pointer;font-weight:700;font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;}
        .anb-logout:hover{background:linear-gradient(135deg,#fee2e2,#fecaca);transform:translateY(-1px);box-shadow:0 4px 12px rgba(239,68,68,0.2);}
      `}</style>
      <div className="anb">
        <div className="anb-left">
          <h2 className="anb-title">{pageTitle}</h2>
        </div>
        <div className="anb-right">
          <NotificationBell />
          <div className="anb-user">
            <div className="anb-avatar"><User size={16} color="#fff" /></div>
            <div>
              <div className="anb-uname">{userData?.name || "Admin"}</div>
              <div className="anb-urole">Administrator</div>
            </div>
          </div>
          <button className="anb-logout" onClick={handleLogout}>
            <LogOut size={15} /><span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
export default AdminNavbar;