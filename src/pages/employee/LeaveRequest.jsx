// src/pages/employee/LeaveRequest.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import { Plus, X, Check } from "lucide-react";
import toast from "react-hot-toast";

const LeaveRequest = () => {
  const { user, userData } = useAuth();
  const [leaves, setLeaves]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [visible, setVisible]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]           = useState({ type:"", from:"", to:"", reason:"" });

  const fetchLeaves = async () => {
    try {
      const snap = await getDocs(query(collection(db,"leaves"), where("userId","==",user.uid), orderBy("createdAt","desc")));
      setLeaves(snap.docs.map(d=>({id:d.id,...d.data()})));
    } catch { toast.error("Error fetching leaves!"); }
    finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
  };
  useEffect(()=>{ if(user) fetchLeaves(); },[user]);

  const calcDays = () => {
    if (!form.from||!form.to) return 0;
    const d = Math.ceil((new Date(form.to)-new Date(form.from))/(1000*60*60*24))+1;
    return d>0?d:0;
  };
  const validate = () => {
    if (!form.type)                             { toast.error("Select leave type!"); return false; }
    if (!form.from)                             { toast.error("Select from date!"); return false; }
    if (!form.to)                               { toast.error("Select to date!"); return false; }
    if (new Date(form.from)>new Date(form.to)) { toast.error("From date cannot be after to!"); return false; }
    if (!form.reason.trim())                    { toast.error("Enter reason!"); return false; }
    if (form.reason.trim().length<10)          { toast.error("Reason must be min 10 chars!"); return false; }
    return true;
  };
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db,"leaves"), { userId:user.uid, userName:userData?.name, department:userData?.department, type:form.type, from:form.from, to:form.to, days:calcDays(), reason:form.reason.trim(), status:"pending", createdAt:new Date().toISOString() });
      const adminSnap = await getDocs(query(collection(db,"users"), where("role","==","admin")));
      if (!adminSnap.empty) {
        await addDoc(collection(db,"notifications"), { userId:adminSnap.docs[0].id, title:"New Leave Request 📋", message:`${userData?.name} ne ${form.type} leave apply ki hai (${calcDays()} days)`, type:"leave", read:false, createdAt:new Date().toISOString() });
      }
      toast.success("Leave submitted! ✅"); setShowModal(false); setForm({type:"",from:"",to:"",reason:""}); fetchLeaves();
    } catch { toast.error("Failed to submit!"); }
    finally { setSubmitting(false); }
  };

  const pending  = leaves.filter(l=>l.status==="pending").length;
  const approved = leaves.filter(l=>l.status==="approved").length;
  const rejected = leaves.filter(l=>l.status==="rejected").length;
  const leaveTypes = ["Sick Leave","Casual Leave","Annual Leave","Emergency Leave","Maternity Leave","Paternity Leave"];

  return (
    <EmpLayout pageTitle="Leave Request">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .elp{font-family:'Plus Jakarta Sans',sans-serif;}
        .elp-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .elp-hdr.vis{opacity:1;transform:translateY(0);}
        .elp-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .elp-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;}
        .elp-add-btn{display:flex;align-items:center;gap:8px;padding:11px 20px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;box-shadow:0 4px 14px rgba(6,182,212,0.3);}
        .elp-add-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(6,182,212,0.4);}
        .elp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .08s;}
        .elp-stats.vis{opacity:1;transform:translateY(0);}
        .elp-stat{background:#fff;border-radius:14px;padding:18px 20px;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,0.04);position:relative;overflow:hidden;}
        .elp-stat-bar{position:absolute;left:0;top:0;bottom:0;width:4px;}
        .elp-stat-val{font-size:30px;font-weight:800;color:#0f172a;letter-spacing:-1px;margin:0 0 4px;}
        .elp-stat-lbl{font-size:13px;color:#94a3b8;margin:0;font-weight:500;}
        .elp-box{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .15s;}
        .elp-box.vis{opacity:1;transform:translateY(0);}
        .elp-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;}
        .elp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;}
        .elp-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#06b6d4;border-radius:50%;animation:elpspin .7s linear infinite;}
        @keyframes elpspin{to{transform:rotate(360deg);}}
        table.elp-tbl{width:100%;border-collapse:collapse;}
        .elp-thead tr{background:#f8fafc;}
        .elp-th{padding:13px 16px;text-align:left;font-size:11.5px;font-weight:700;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;}
        .elp-tr{border-bottom:1px solid #f8fafc;transition:background .15s;}
        .elp-tr:hover{background:#fafbff;}
        .elp-td{padding:13px 16px;font-size:14px;color:#1e293b;font-weight:500;}
        .elp-type{background:rgba(6,182,212,0.1);color:#0891b2;padding:4px 10px;border-radius:100px;font-size:12px;font-weight:600;}
        .elp-reason{color:#64748b;font-size:13px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .elp-overlay{position:fixed;inset:0;background:rgba(10,10,20,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:999;animation:elpfade .2s ease;}
        @keyframes elpfade{from{opacity:0;}to{opacity:1;}}
        .elp-modal{background:#fff;border-radius:20px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto;animation:elpslide .3s cubic-bezier(.22,1,.36,1);}
        @keyframes elpslide{from{opacity:0;transform:translateY(20px) scale(.97);}to{opacity:1;transform:none;}}
        .elp-mhdr{display:flex;justify-content:space-between;align-items:center;padding:22px 26px;border-bottom:1px solid #f1f5f9;}
        .elp-mtitle{font-size:17px;font-weight:800;color:#0f172a;margin:0;}
        .elp-mclose{width:34px;height:34px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;}
        .elp-mbody{padding:24px 26px;display:flex;flex-direction:column;gap:16px;}
        .elp-fg2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .elp-fgrp{display:flex;flex-direction:column;gap:7px;}
        .elp-lbl{font-size:12.5px;font-weight:600;color:#374151;}
        .elp-inp{padding:11px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;outline:none;transition:all .22s;width:100%;background:#f8fafc;}
        .elp-inp:focus{border-color:#06b6d4;background:#fff;box-shadow:0 0 0 4px rgba(6,182,212,0.08);}
        .elp-days-preview{background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:10px;padding:12px 16px;font-size:14px;color:#0891b2;font-weight:600;}
        .elp-mftr{display:flex;justify-content:flex-end;gap:10px;padding:18px 26px;border-top:1px solid #f1f5f9;}
        .elp-cancel{padding:10px 20px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;}
        .elp-submit{display:flex;align-items:center;gap:7px;padding:10px 22px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 4px 12px rgba(6,182,212,0.3);transition:all .2s;}
        .elp-submit:hover{transform:translateY(-1px);}
        .elp-submit:disabled{opacity:.6;cursor:not-allowed;transform:none;}
      `}</style>

      <div className="elp">
        <div className={`elp-hdr ${visible?"vis":""}`}>
          <div><p className="elp-title">My Leave Requests</p><p className="elp-sub">Apply and track your leaves</p></div>
          <button className="elp-add-btn" onClick={()=>setShowModal(true)}><Plus size={16}/>Apply Leave</button>
        </div>
        <div className={`elp-stats ${visible?"vis":""}`}>
          {[{val:pending,lbl:"Pending",clr:"#f59e0b"},{val:approved,lbl:"Approved",clr:"#16a34a"},{val:rejected,lbl:"Rejected",clr:"#ef4444"},{val:leaves.length,lbl:"Total",clr:"#06b6d4"}].map((s,i)=>(
            <div className="elp-stat" key={i}><div className="elp-stat-bar" style={{background:s.clr}}/><p className="elp-stat-val">{s.val}</p><p className="elp-stat-lbl">{s.lbl}</p></div>
          ))}
        </div>
        <div className={`elp-box ${visible?"vis":""}`}>
          {loading?<div className="elp-loading"><div className="elp-spin"/>Loading...</div>:leaves.length===0?<div className="elp-empty">🌿 No leave requests yet!</div>:(
            <table className="elp-tbl">
              <thead className="elp-thead"><tr><th className="elp-th">#</th><th className="elp-th">Type</th><th className="elp-th">From</th><th className="elp-th">To</th><th className="elp-th">Days</th><th className="elp-th">Reason</th><th className="elp-th">Status</th></tr></thead>
              <tbody>
                {leaves.map((l,i)=>{
                  const sc=l.status==="approved"?{bg:"rgba(22,163,74,0.1)",clr:"#16a34a",ic:"✅"}:l.status==="rejected"?{bg:"rgba(239,68,68,0.1)",clr:"#ef4444",ic:"❌"}:{bg:"rgba(245,158,11,0.1)",clr:"#d97706",ic:"⏳"};
                  return <tr key={l.id} className="elp-tr"><td className="elp-td">{i+1}</td><td className="elp-td"><span className="elp-type">{l.type}</span></td><td className="elp-td">{l.from}</td><td className="elp-td">{l.to}</td><td className="elp-td">{l.days}d</td><td className="elp-td"><span className="elp-reason">{l.reason}</span></td><td className="elp-td"><span style={{background:sc.bg,color:sc.clr,padding:"4px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:"700",textTransform:"capitalize"}}>{sc.ic} {l.status}</span></td></tr>;
                })}
              </tbody>
            </table>
          )}
        </div>

        {showModal&&(
          <div className="elp-overlay">
            <div className="elp-modal">
              <div className="elp-mhdr"><p className="elp-mtitle">Apply Leave</p><button className="elp-mclose" onClick={()=>setShowModal(false)}><X size={16}/></button></div>
              <div className="elp-mbody">
                <div className="elp-fgrp"><label className="elp-lbl">Leave Type *</label><select className="elp-inp" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="">Select type</option>{leaveTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div className="elp-fg2">
                  <div className="elp-fgrp"><label className="elp-lbl">From Date *</label><input className="elp-inp" type="date" value={form.from} onChange={e=>setForm({...form,from:e.target.value})} min={new Date().toISOString().split("T")[0]}/></div>
                  <div className="elp-fgrp"><label className="elp-lbl">To Date *</label><input className="elp-inp" type="date" value={form.to} onChange={e=>setForm({...form,to:e.target.value})} min={form.from||new Date().toISOString().split("T")[0]}/></div>
                </div>
                {form.from&&form.to&&<div className="elp-days-preview">📅 Total: {calcDays()} day(s)</div>}
                <div className="elp-fgrp"><label className="elp-lbl">Reason *</label><textarea className="elp-inp" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Min 10 characters" style={{height:90,resize:"vertical"}}/></div>
              </div>
              <div className="elp-mftr">
                <button className="elp-cancel" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="elp-submit" onClick={handleSubmit} disabled={submitting}><Check size={15}/>{submitting?"Submitting...":"Submit Leave"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmpLayout>
  );
};
export default LeaveRequest;