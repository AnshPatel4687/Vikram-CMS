// src/pages/employee/EmpProjects.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportEmpProjectsPDF, exportEmpProjectsExcel } from "../../utils/exportUtils";
import toast from "react-hot-toast";

const EmpProjects = () => {
  const { user, userData } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,"projects"), where("assignedTo","array-contains",user.uid)));
        setProjects(snap.docs.map(d=>({id:d.id,...d.data()})));
      } catch { toast.error("Error fetching projects!"); }
      finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
    };
    fetch();
  }, [user]);

  const statusCfg = s => ({active:{bg:"rgba(16,185,129,0.1)",clr:"#059669"},completed:{bg:"rgba(59,130,246,0.1)",clr:"#2563eb"},"on-hold":{bg:"rgba(245,158,11,0.1)",clr:"#d97706"}}[s]||{bg:"#f1f5f9",clr:"#64748b"});

  return (
    <EmpLayout pageTitle="My Projects">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .eprp{font-family:'Plus Jakarta Sans',sans-serif;}
        .eprp-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .eprp-hdr.vis{opacity:1;transform:translateY(0);}
        .eprp-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .eprp-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;}
        .eprp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px;color:#94a3b8;}
        .eprp-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#06b6d4;border-radius:50%;animation:eprpspin .7s linear infinite;}
        @keyframes eprpspin{to{transform:rotate(360deg);}}
        .eprp-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;background:#fff;border-radius:16px;border:1px solid #f1f5f9;}
        .eprp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
        .eprp-card{background:#fff;border-radius:16px;padding:22px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1);cursor:default;}
        .eprp-card.vis{opacity:1;transform:translateY(0);}
        .eprp-card:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,0.08);}
        .eprp-card-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:10px;}
        .eprp-name{font-size:15px;font-weight:800;color:#0f172a;margin:0;flex:1;letter-spacing:-.2px;}
        .eprp-desc{font-size:13px;color:#64748b;margin:0 0 14px;line-height:1.6;}
        .eprp-footer{display:flex;align-items:center;gap:6px;font-size:13px;color:#94a3b8;padding-top:12px;border-top:1px solid #f8fafc;}
        .eprp-footer span{color:#0f172a;font-weight:600;}
      `}</style>
      <div className="eprp">
        <div className={`eprp-hdr ${visible?"vis":""}`}>
          <div><p className="eprp-title">My Projects</p><p className="eprp-sub">Total: {projects.length} assigned</p></div>
          <ExportButton label="Export" onExportPDF={()=>exportEmpProjectsPDF(projects,userData?.name||user?.email)} onExportExcel={()=>exportEmpProjectsExcel(projects,userData?.name||user?.email)}/>
        </div>
        {loading?<div className="eprp-loading"><div className="eprp-spin"/>Loading projects...</div>:projects.length===0?<div className="eprp-empty">🗂️ No projects assigned yet!</div>:(
          <div className="eprp-grid">
            {projects.map((p,i)=>{
              const sc=statusCfg(p.status);
              return (
                <div key={p.id} className={`eprp-card ${visible?"vis":""}`} style={{transitionDelay:`${i*.05}s`}}>
                  <div className="eprp-card-hdr">
                    <p className="eprp-name">{p.name}</p>
                    <span style={{background:sc.bg,color:sc.clr,padding:"4px 10px",borderRadius:"100px",fontSize:"11.5px",fontWeight:"700",textTransform:"capitalize",whiteSpace:"nowrap"}}>{p.status}</span>
                  </div>
                  <p className="eprp-desc">{p.description}</p>
                  <div className="eprp-footer">📅 Deadline: <span>{p.deadline}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EmpLayout>
  );
};
export default EmpProjects;