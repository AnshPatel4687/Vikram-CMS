// src/pages/employee/EmpAttendance.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportEmpAttendancePDF, exportEmpAttendanceExcel } from "../../utils/exportUtils";
import toast from "react-hot-toast";

const EmpAttendance = () => {
  const { user, userData } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [visible, setVisible]       = useState(false);
  const [stats, setStats]           = useState({ present:0, absent:0, late:0, total:0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,"attendance"), where("userId","==",user.uid)));
        const list = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.date)-new Date(a.date));
        setAttendance(list);
        setStats({ present:list.filter(a=>a.status==="present").length, absent:list.filter(a=>a.status==="absent").length, late:list.filter(a=>a.status==="late").length, total:list.length });
      } catch { toast.error("Error fetching attendance!"); }
      finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
    };
    fetch();
  }, [user]);

  const pct = stats.total>0 ? Math.round((stats.present/stats.total)*100) : 0;

  return (
    <EmpLayout pageTitle="My Attendance">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .eap{font-family:'Plus Jakarta Sans',sans-serif;}
        .eap-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .eap-hdr.vis{opacity:1;transform:translateY(0);}
        .eap-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .eap-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;}
        .eap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .08s;}
        .eap-stats.vis{opacity:1;transform:translateY(0);}
        .eap-stat{background:#fff;border-radius:14px;padding:18px 20px;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,0.04);position:relative;overflow:hidden;}
        .eap-stat-bar{position:absolute;left:0;top:0;bottom:0;width:4px;}
        .eap-stat-val{font-size:30px;font-weight:800;color:#0f172a;letter-spacing:-1px;margin:0 0 4px;}
        .eap-stat-lbl{font-size:13px;color:#94a3b8;margin:0;font-weight:500;}
        .eap-box{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .15s;}
        .eap-box.vis{opacity:1;transform:translateY(0);}
        .eap-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;}
        .eap-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;}
        .eap-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#06b6d4;border-radius:50%;animation:eapspin .7s linear infinite;}
        @keyframes eapspin{to{transform:rotate(360deg);}}
        table.eap-tbl{width:100%;border-collapse:collapse;}
        .eap-thead tr{background:#f8fafc;}
        .eap-th{padding:13px 16px;text-align:left;font-size:11.5px;font-weight:700;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;}
        .eap-tr{border-bottom:1px solid #f8fafc;transition:background .15s;}
        .eap-tr:hover{background:#fafbff;}
        .eap-td{padding:13px 16px;font-size:14px;color:#1e293b;font-weight:500;}
        .eap-day{color:#64748b;font-size:13px;}
      `}</style>
      <div className="eap">
        <div className={`eap-hdr ${visible?"vis":""}`}>
          <div><p className="eap-title">My Attendance</p><p className="eap-sub">Your attendance record</p></div>
          <ExportButton label="Export" onExportPDF={()=>exportEmpAttendancePDF(attendance,stats,userData?.name||user?.email)} onExportExcel={()=>exportEmpAttendanceExcel(attendance,userData?.name||user?.email)}/>
        </div>
        <div className={`eap-stats ${visible?"vis":""}`}>
          {[{val:stats.present,lbl:"Present",clr:"#16a34a"},{val:stats.absent,lbl:"Absent",clr:"#ef4444"},{val:stats.late,lbl:"Late",clr:"#d97706"},{val:`${pct}%`,lbl:"Attendance %",clr:"#6366f1"}].map((s,i)=>(
            <div className="eap-stat" key={i}><div className="eap-stat-bar" style={{background:s.clr}}/><p className="eap-stat-val">{s.val}</p><p className="eap-stat-lbl">{s.lbl}</p></div>
          ))}
        </div>
        <div className={`eap-box ${visible?"vis":""}`}>
          {loading?<div className="eap-loading"><div className="eap-spin"/>Loading...</div>:attendance.length===0?<div className="eap-empty">📅 No attendance records yet!</div>:(
            <table className="eap-tbl">
              <thead className="eap-thead"><tr><th className="eap-th">#</th><th className="eap-th">Date</th><th className="eap-th">Day</th><th className="eap-th">Status</th></tr></thead>
              <tbody>
                {attendance.map((r,i)=>{
                  const sc=r.status==="present"?{bg:"rgba(22,163,74,0.1)",clr:"#16a34a",ic:"✅"}:r.status==="absent"?{bg:"rgba(239,68,68,0.1)",clr:"#ef4444",ic:"❌"}:{bg:"rgba(217,119,6,0.1)",clr:"#d97706",ic:"⏰"};
                  return <tr key={r.id} className="eap-tr"><td className="eap-td">{i+1}</td><td className="eap-td">{r.date}</td><td className="eap-td"><span className="eap-day">{new Date(r.date).toLocaleDateString("en-IN",{weekday:"long"})}</span></td><td className="eap-td"><span style={{background:sc.bg,color:sc.clr,padding:"4px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:"700",textTransform:"capitalize"}}>{sc.ic} {r.status}</span></td></tr>;
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </EmpLayout>
  );
};
export default EmpAttendance;