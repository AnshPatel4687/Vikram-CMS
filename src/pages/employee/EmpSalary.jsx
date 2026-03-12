// src/pages/employee/EmpSalary.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportEmpSalaryPDF, exportEmpSalaryExcel } from "../../utils/exportUtils";
import toast from "react-hot-toast";

const EmpSalary = () => {
  const { user, userData } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,"payroll"), where("userId","==",user.uid)));
        setPayrolls(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.month)-new Date(a.month)));
      } catch { toast.error("Error fetching salary!"); }
      finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
    };
    fetch();
  }, [user]);

  const totalEarned    = payrolls.filter(p=>p.status==="paid").reduce((s,p)=>s+(p.netSalary||0),0);
  const totalBonus     = payrolls.reduce((s,p)=>s+(p.bonus||0),0);
  const totalDeduction = payrolls.reduce((s,p)=>s+(p.deduction||0),0);

  return (
    <EmpLayout pageTitle="My Salary">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .esp{font-family:'Plus Jakarta Sans',sans-serif;}
        .esp-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .esp-hdr.vis{opacity:1;transform:translateY(0);}
        .esp-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .esp-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;}
        .esp-banner{position:relative;overflow:hidden;background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:18px;padding:28px 32px;color:#fff;display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .06s;}
        .esp-banner.vis{opacity:1;transform:translateY(0);}
        .esp-banner-blob{position:absolute;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%);top:-60px;right:40px;pointer-events:none;}
        .esp-banner-lbl{font-size:13px;color:rgba(255,255,255,.6);margin:0 0 8px;font-weight:500;}
        .esp-banner-val{font-size:36px;font-weight:800;margin:0;letter-spacing:-1.5px;}
        .esp-banner-dept{font-size:16px;font-weight:700;margin:0;color:rgba(255,255,255,.9);}
        .esp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .1s;}
        .esp-stats.vis{opacity:1;transform:translateY(0);}
        .esp-stat{background:#fff;border-radius:14px;padding:18px 20px;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,0.04);position:relative;overflow:hidden;}
        .esp-stat-bar{position:absolute;left:0;top:0;bottom:0;width:4px;}
        .esp-stat-val{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;margin:0 0 4px;}
        .esp-stat-lbl{font-size:13px;color:#94a3b8;margin:0;font-weight:500;}
        .esp-box{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .15s;}
        .esp-box.vis{opacity:1;transform:translateY(0);}
        .esp-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;}
        .esp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;}
        .esp-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:espspin .7s linear infinite;}
        @keyframes espspin{to{transform:rotate(360deg);}}
        table.esp-tbl{width:100%;border-collapse:collapse;}
        .esp-thead tr{background:#f8fafc;}
        .esp-th{padding:13px 16px;text-align:left;font-size:11.5px;font-weight:700;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;}
        .esp-tr{border-bottom:1px solid #f8fafc;transition:background .15s;}
        .esp-tr:hover{background:#fafbff;}
        .esp-td{padding:13px 16px;font-size:14px;color:#1e293b;font-weight:500;}
        .esp-bonus{color:#16a34a;font-weight:700;}
        .esp-deduct{color:#ef4444;font-weight:700;}
        .esp-net{font-weight:800;color:#0f172a;}
      `}</style>
      <div className="esp">
        <div className={`esp-hdr ${visible?"vis":""}`}>
          <div><p className="esp-title">My Salary</p><p className="esp-sub">Your salary history</p></div>
          <ExportButton label="Export" onExportPDF={()=>exportEmpSalaryPDF(payrolls,userData)} onExportExcel={()=>exportEmpSalaryExcel(payrolls,userData)}/>
        </div>
        <div className={`esp-banner ${visible?"vis":""}`}>
          <div className="esp-banner-blob"/>
          <div style={{position:"relative"}}><p className="esp-banner-lbl">Basic Monthly Salary</p><p className="esp-banner-val">₹{userData?.salary?.toLocaleString()||"0"}</p></div>
          <div style={{textAlign:"right",position:"relative"}}><p className="esp-banner-lbl">Employee ID</p><p className="esp-banner-dept" style={{fontFamily:"monospace",letterSpacing:".5px"}}>{userData?.employeeId||"—"}</p><p className="esp-banner-lbl" style={{marginTop:6}}>{userData?.department||"—"}</p></div>
        </div>
        <div className={`esp-stats ${visible?"vis":""}`}>
          {[{val:`₹${totalEarned.toLocaleString()}`,lbl:"Total Earned",clr:"#6366f1"},{val:`₹${totalBonus.toLocaleString()}`,lbl:"Total Bonus",clr:"#10b981"},{val:`₹${totalDeduction.toLocaleString()}`,lbl:"Total Deduction",clr:"#ef4444"},{val:payrolls.length,lbl:"Total Months",clr:"#f59e0b"}].map((s,i)=>(
            <div className="esp-stat" key={i}><div className="esp-stat-bar" style={{background:s.clr}}/><p className="esp-stat-val">{s.val}</p><p className="esp-stat-lbl">{s.lbl}</p></div>
          ))}
        </div>
        <div className={`esp-box ${visible?"vis":""}`}>
          {loading?<div className="esp-loading"><div className="esp-spin"/>Loading salary...</div>:payrolls.length===0?<div className="esp-empty">💰 No salary records yet!</div>:(
            <table className="esp-tbl">
              <thead className="esp-thead"><tr><th className="esp-th">#</th><th className="esp-th">Month</th><th className="esp-th">Basic</th><th className="esp-th">Bonus</th><th className="esp-th">Deduction</th><th className="esp-th">Net Salary</th><th className="esp-th">Note</th><th className="esp-th">Status</th></tr></thead>
              <tbody>
                {payrolls.map((p,i)=>{
                  const isPaid=p.status==="paid";
                  return <tr key={p.id} className="esp-tr"><td className="esp-td">{i+1}</td><td className="esp-td">{p.month}</td><td className="esp-td">₹{p.basicSalary?.toLocaleString()}</td><td className="esp-td"><span className="esp-bonus">+₹{(p.bonus||0).toLocaleString()}</span></td><td className="esp-td"><span className="esp-deduct">-₹{(p.deduction||0).toLocaleString()}</span></td><td className="esp-td"><span className="esp-net">₹{p.netSalary?.toLocaleString()}</span></td><td className="esp-td" style={{color:"#64748b",fontSize:13}}>{p.note||"—"}</td><td className="esp-td"><span style={{background:isPaid?"rgba(22,163,74,0.1)":"rgba(245,158,11,0.1)",color:isPaid?"#16a34a":"#d97706",padding:"4px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:"700"}}>{isPaid?"✅ Paid":"⏳ Pending"}</span></td></tr>;
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </EmpLayout>
  );
};
export default EmpSalary;