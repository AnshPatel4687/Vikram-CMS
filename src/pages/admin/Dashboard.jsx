// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import { Users, FolderKanban, CalendarCheck, CalendarOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [stats, setStats] = useState({ totalEmployees:0, totalProjects:0, presentToday:0, pendingLeaves:0 });
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [empSnap, projSnap, attSnap, leaveSnap] = await Promise.all([
          getDocs(query(collection(db,"users"), where("role","==","employee"))),
          getDocs(collection(db,"projects")),
          getDocs(query(collection(db,"attendance"), where("date","==",today), where("status","==","present"))),
          getDocs(query(collection(db,"leaves"), where("status","==","pending"))),
        ]);
        setStats({ totalEmployees:empSnap.size, totalProjects:projSnap.size, presentToday:attSnap.size, pendingLeaves:leaveSnap.size });
      } catch(e) { console.log(e); }
      finally { setLoading(false); setTimeout(() => setVisible(true), 60); }
    };
    fetchStats();
  }, []);

  const cards = [
    { title:"Total Employees", value:stats.totalEmployees, icon:<Users size={22} color="#fff"/>,       gradient:"linear-gradient(135deg,#6366f1,#4f46e5)", glow:"rgba(99,102,241,0.25)",  path:"/admin/employees",  bg:"rgba(99,102,241,0.08)",  clr:"#6366f1" },
    { title:"Total Projects",  value:stats.totalProjects,  icon:<FolderKanban size={22} color="#fff"/>, gradient:"linear-gradient(135deg,#06b6d4,#0891b2)", glow:"rgba(6,182,212,0.25)",   path:"/admin/projects",   bg:"rgba(6,182,212,0.08)",   clr:"#06b6d4" },
    { title:"Present Today",   value:stats.presentToday,   icon:<CalendarCheck size={22} color="#fff"/>, gradient:"linear-gradient(135deg,#10b981,#059669)", glow:"rgba(16,185,129,0.25)",  path:"/admin/attendance", bg:"rgba(16,185,129,0.08)",  clr:"#10b981" },
    { title:"Pending Leaves",  value:stats.pendingLeaves,  icon:<CalendarOff size={22} color="#fff"/>,  gradient:"linear-gradient(135deg,#f59e0b,#d97706)", glow:"rgba(245,158,11,0.25)",  path:"/admin/leaves",     bg:"rgba(245,158,11,0.08)",  clr:"#f59e0b" },
  ];

  const actions = [
    { label:"Add Employee",    emoji:"👤", path:"/admin/employees" },
    { label:"New Project",     emoji:"📁", path:"/admin/projects" },
    { label:"Mark Attendance", emoji:"✅", path:"/admin/attendance" },
    { label:"Run Payroll",     emoji:"💰", path:"/admin/payroll" },
    { label:"Leave Requests",  emoji:"📋", path:"/admin/leaves" },
    { label:"View Reports",    emoji:"📊", path:"/admin/reports" },
  ];

  const dateStr = new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  return (
    <AdminLayout pageTitle="Dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .db-root { font-family:'Plus Jakarta Sans',sans-serif; }

        /* Banner */
        .db-banner {
          position:relative;overflow:hidden;border-radius:20px;
          background:linear-gradient(135deg,#0f0f1a 0%,#1a1040 50%,#0d1f4f 100%);
          border:1px solid rgba(255,255,255,0.08);
          padding:32px 36px;margin-bottom:24px;
          display:flex;justify-content:space-between;align-items:center;
          opacity:0;transform:translateY(20px);
          transition:all .6s cubic-bezier(.22,1,.36,1);
        }
        .db-banner.vis{opacity:1;transform:translateY(0);}
        .db-banner-orb1{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.25) 0%,transparent 70%);top:-100px;right:100px;filter:blur(50px);pointer-events:none;animation:dbo 8s ease-in-out infinite alternate;}
        .db-banner-orb2{position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.2) 0%,transparent 70%);bottom:-60px;right:20px;filter:blur(40px);pointer-events:none;animation:dbo 10s ease-in-out infinite alternate reverse;}
        @keyframes dbo{0%{transform:scale(1);}100%{transform:scale(1.15);}}
        .db-banner-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:44px 44px;pointer-events:none;}
        .db-banner-left{position:relative;z-index:2;}
        .db-banner-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.35);border-radius:100px;padding:5px 14px;font-size:11.5px;font-weight:600;color:#a5b4fc;letter-spacing:.5px;margin-bottom:14px;}
        .db-banner-dot{width:5px;height:5px;background:#6366f1;border-radius:50%;animation:dbpulse 2s ease-in-out infinite;}
        @keyframes dbpulse{0%,100%{opacity:1;}50%{opacity:.3;}}
        .db-banner-h{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.5px;margin:0 0 6px;}
        .db-banner-sub{font-size:14px;color:rgba(255,255,255,0.45);margin:0;font-weight:400;}
        .db-banner-right{position:relative;z-index:2;text-align:right;}
        .db-banner-date{font-size:13px;color:rgba(255,255,255,0.4);font-weight:500;}
        .db-banner-date strong{display:block;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;margin-bottom:3px;}

        /* Stats Cards */
        .db-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
        .db-card{
          background:#fff;border-radius:16px;padding:22px;
          border:1px solid #f1f5f9;
          cursor:pointer;position:relative;overflow:hidden;
          opacity:0;transform:translateY(20px);
          transition:opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1), box-shadow .25s, border-color .25s;
        }
        .db-card.vis{opacity:1;transform:translateY(0);}
        .db-card:hover{border-color:#e2e8f0;transform:translateY(-3px) !important;box-shadow:0 16px 40px rgba(0,0,0,0.08);}
        .db-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
        .db-card-ico{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;}
        .db-card-arrow{font-size:16px;color:#cbd5e1;transition:color .2s,transform .2s;}
        .db-card:hover .db-card-arrow{color:#94a3b8;transform:translate(2px,-2px);}
        .db-card-val{font-size:34px;font-weight:800;color:#0f172a;letter-spacing:-1px;margin:0 0 4px;line-height:1;}
        .db-card-lbl{font-size:13px;color:#94a3b8;font-weight:500;margin:0;}
        .db-card-bar{position:absolute;bottom:0;left:0;right:0;height:3px;border-radius:0 0 16px 16px;opacity:0;transition:opacity .3s;}
        .db-card:hover .db-card-bar{opacity:1;}

        /* Quick Actions */
        .db-section{background:#fff;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #f1f5f9;opacity:0;transform:translateY(16px);transition:all .6s cubic-bezier(.22,1,.36,1) .3s;}
        .db-section.vis{opacity:1;transform:translateY(0);}
        .db-section-head{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
        .db-section-title{font-size:16px;font-weight:800;color:#0f172a;letter-spacing:-.3px;margin:0;}
        .db-section-badge{font-size:11px;font-weight:600;color:#6366f1;background:rgba(99,102,241,0.1);border-radius:100px;padding:3px 10px;}
        .db-actions{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;}
        .db-action{display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px 12px;background:#f8fafc;border-radius:14px;cursor:pointer;border:1.5px solid #f1f5f9;transition:all .22s cubic-bezier(.4,0,.2,1);}
        .db-action:hover{background:#fff;border-color:#e2e8f0;transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.07);}
        .db-action-ico{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.1));display:flex;align-items:center;justify-content:center;font-size:22px;transition:transform .22s;}
        .db-action:hover .db-action-ico{transform:scale(1.1);}
        .db-action-lbl{font-size:12.5px;font-weight:600;color:#374151;text-align:center;line-height:1.3;}

        /* Loading */
        .db-loading{display:flex;align-items:center;justify-content:center;gap:12px;padding:48px;color:#94a3b8;font-size:15px;font-weight:500;}
        .db-spin{width:20px;height:20px;border:2px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:dbspin .7s linear infinite;}
        @keyframes dbspin{to{transform:rotate(360deg);}}
      `}</style>

      <div className="db-root">

        {/* Banner */}
        <div className={`db-banner ${visible ? "vis" : ""}`}>
          <div className="db-banner-grid" />
          <div className="db-banner-orb1" /><div className="db-banner-orb2" />
          <div className="db-banner-left">
            <div className="db-banner-tag"><div className="db-banner-dot" />Admin Dashboard</div>
            <h2 className="db-banner-h">Welcome back, {userData?.name?.split(" ")[0] || "Admin"}! 👋</h2>
            <p className="db-banner-sub">Here's what's happening in your company today.</p>
          </div>
          <div className="db-banner-right">
            <div className="db-banner-date">
              <strong>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</strong>
              {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long"})}
            </div>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="db-loading"><div className="db-spin" /> Loading stats...</div>
        ) : (
          <div className="db-cards">
            {cards.map((card, i) => (
              <div
                key={i}
                className={`db-card ${visible ? "vis" : ""}`}
                style={{ transitionDelay: `${0.1 + i * 0.07}s`, boxShadow:`0 4px 16px ${card.glow}` }}
                onClick={() => navigate(card.path)}
              >
                <div className="db-card-top">
                  <div className="db-card-ico" style={{ background:card.bg }}>
                    <div style={{ background:card.gradient, width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {card.icon}
                    </div>
                  </div>
                  <span className="db-card-arrow">↗</span>
                </div>
                <p className="db-card-val">{card.value}</p>
                <p className="db-card-lbl">{card.title}</p>
                <div className="db-card-bar" style={{ background:card.gradient }} />
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className={`db-section ${visible ? "vis" : ""}`}>
          <div className="db-section-head">
            <h3 className="db-section-title">Quick Actions</h3>
            <span className="db-section-badge">6 shortcuts</span>
          </div>
          <div className="db-actions">
            {actions.map((a, i) => (
              <div key={i} className="db-action" onClick={() => navigate(a.path)}>
                <div className="db-action-ico">{a.emoji}</div>
                <span className="db-action-lbl">{a.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
export default AdminDashboard;