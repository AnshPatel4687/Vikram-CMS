// src/pages/employee/EmpDashboard.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import { FolderKanban, CalendarCheck, DollarSign, CalendarOff } from "lucide-react";

const EmpDashboard = () => {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({ totalProjects:0, presentDays:0, salary:0, pendingLeaves:0 });
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projSnap, attSnap, leaveSnap] = await Promise.all([
          getDocs(query(collection(db,"projects"), where("assignedTo","array-contains",user.uid))),
          getDocs(query(collection(db,"attendance"), where("userId","==",user.uid), where("status","==","present"))),
          getDocs(query(collection(db,"leaves"), where("userId","==",user.uid), where("status","==","pending"))),
        ]);
        setStats({ totalProjects:projSnap.size, presentDays:attSnap.size, salary:userData?.salary||0, pendingLeaves:leaveSnap.size });
      } catch(e) { console.log(e); }
      finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
    };
    if (user) fetchStats();
  }, [user, userData]);

  const firstName = userData?.name?.split(" ")[0] || "Employee";
  const dateStr = new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  const cards = [
    { title:"My Projects",   value:stats.totalProjects,               icon:<FolderKanban size={26} color="#fff"/>, bg:"linear-gradient(135deg,#6366f1,#818cf8)", shadow:"rgba(99,102,241,0.25)" },
    { title:"Days Present",  value:stats.presentDays,                 icon:<CalendarCheck size={26} color="#fff"/>,bg:"linear-gradient(135deg,#10b981,#34d399)", shadow:"rgba(16,185,129,0.25)" },
    { title:"My Salary",     value:`₹${stats.salary.toLocaleString()}`,icon:<DollarSign size={26} color="#fff"/>,  bg:"linear-gradient(135deg,#06b6d4,#22d3ee)", shadow:"rgba(6,182,212,0.25)"  },
    { title:"Pending Leaves",value:stats.pendingLeaves,               icon:<CalendarOff size={26} color="#fff"/>,  bg:"linear-gradient(135deg,#f59e0b,#fbbf24)", shadow:"rgba(245,158,11,0.25)" },
  ];

  const infoFields = [
    { lbl:"Full Name",  val:userData?.name },
    { lbl:"Email",      val:userData?.email },
    { lbl:"Department", val:userData?.department },
    { lbl:"Phone",      val:userData?.phone },
    { lbl:"Join Date",  val:userData?.joinDate },
    { lbl:"Salary",     val:`₹${userData?.salary?.toLocaleString()||"---"}` },
  ];

  return (
    <EmpLayout pageTitle="My Dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .edp{font-family:'Plus Jakarta Sans',sans-serif;}

        /* Banner */
        .edp-banner{position:relative;overflow:hidden;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0c1a2e 100%);border-radius:20px;padding:32px 36px;color:#fff;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;opacity:0;transform:translateY(18px);transition:all .55s cubic-bezier(.22,1,.36,1);}
        .edp-banner.vis{opacity:1;transform:translateY(0);}
        .edp-blob1{position:absolute;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.18),transparent 70%);top:-80px;right:80px;pointer-events:none;}
        .edp-blob2{position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%);bottom:-60px;right:260px;pointer-events:none;}
        .edp-dots{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:24px 24px;pointer-events:none;}
        .edp-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.3);color:#67e8f9;padding:6px 14px;border-radius:100px;font-size:12px;font-weight:600;margin-bottom:14px;letter-spacing:.3px;}
        .edp-banner-title{font-size:26px;font-weight:800;letter-spacing:-.5px;margin:0 0 6px;}
        .edp-banner-sub{font-size:14px;color:rgba(255,255,255,.6);margin:0;font-weight:500;}
        .edp-banner-badge{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(8px);padding:10px 20px;border-radius:100px;font-size:13px;font-weight:600;color:#fff;white-space:nowrap;}

        /* Cards */
        .edp-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:24px;}
        .edp-card{background:#fff;border-radius:16px;padding:22px;display:flex;justify-content:space-between;align-items:center;border:1px solid #f1f5f9;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1);cursor:default;}
        .edp-card.vis{opacity:1;transform:translateY(0);}
        .edp-card:hover{transform:translateY(-3px);}
        .edp-card-lbl{font-size:13px;color:#94a3b8;font-weight:500;margin:0 0 6px;}
        .edp-card-val{font-size:28px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-1px;}
        .edp-card-icon{width:54px;height:54px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .edp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;}
        .edp-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#06b6d4;border-radius:50%;animation:edpspin .7s linear infinite;}
        @keyframes edpspin{to{transform:rotate(360deg);}}

        /* Info box */
        .edp-info{background:#fff;border-radius:16px;padding:26px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .2s;}
        .edp-info.vis{opacity:1;transform:translateY(0);}
        .edp-info-title{font-size:16px;font-weight:800;color:#0f172a;margin:0 0 18px;letter-spacing:-.3px;}
        .edp-info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
        .edp-info-item{background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #f1f5f9;}
        .edp-info-lbl{font-size:11.5px;color:#94a3b8;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:.4px;}
        .edp-info-val{font-size:15px;color:#0f172a;font-weight:700;margin:0;}
      `}</style>

      <div className="edp">
        {/* Banner */}
        <div className={`edp-banner ${visible?"vis":""}`}>
          <div className="edp-blob1"/><div className="edp-blob2"/><div className="edp-dots"/>
          <div style={{position:"relative"}}>
            <div className="edp-tag">🟢 Active Employee</div>
            <h2 className="edp-banner-title">Welcome back, {firstName}! 👋</h2>
            <p className="edp-banner-sub">{userData?.department} Department &nbsp;•&nbsp; {dateStr}</p>
          </div>
          <div className="edp-banner-badge" style={{position:"relative"}}>🏢 {userData?.department||"Employee"}</div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="edp-loading"><div className="edp-spin"/>Loading your data...</div>
        ) : (
          <div className="edp-cards">
            {cards.map((c,i)=>(
              <div key={i} className={`edp-card ${visible?"vis":""}`} style={{transitionDelay:`${.06+i*.06}s`,boxShadow:`0 8px 24px ${c.shadow}`}}>
                <div>
                  <p className="edp-card-lbl">{c.title}</p>
                  <h2 className="edp-card-val">{c.value}</h2>
                </div>
                <div className="edp-card-icon" style={{background:c.bg}}>{c.icon}</div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className={`edp-info ${visible?"vis":""}`}>
          <p className="edp-info-title">My Information</p>
          <div className="edp-info-grid">
            {infoFields.map((f,i)=>(
              <div key={i} className="edp-info-item">
                <p className="edp-info-lbl">{f.lbl}</p>
                <p className="edp-info-val">{f.val||"—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </EmpLayout>
  );
};
export default EmpDashboard;