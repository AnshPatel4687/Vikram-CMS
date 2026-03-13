// src/pages/admin/Leaves.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { notifyEmployee } from "../../firebase/notifications";
import AdminLayout from "../../components/admin/AdminLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportLeavesPDF, exportLeavesExcel } from "../../utils/exportUtils";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

const Leaves = () => {
  const [leaves, setLeaves]     = useState([]);
  const [usersMap, setUsersMap] = useState({}); // uid -> {employeeId, name}
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [visible, setVisible]   = useState(false);

  const fetchLeaves = async () => {
    try {
      const [leavesSnap, usersSnap] = await Promise.all([
        getDocs(collection(db,"leaves")),
        getDocs(collection(db,"users")),
      ]);
      // Build uid -> employeeId map
      const map = {};
      usersSnap.docs.forEach(d => { map[d.id] = { employeeId: d.data().employeeId||"—", name: d.data().name }; });
      setUsersMap(map);
      setLeaves(leavesSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
    } catch { toast.error("Error fetching leaves!"); }
    finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
  };
  useEffect(()=>{ fetchLeaves(); },[]);

  const handleApprove = async leave => {
    try {
      await updateDoc(doc(db,"leaves",leave.id),{status:"approved"});
      await notifyEmployee(leave.userId,"Leave Approved! ✅",`Tumhari ${leave.type} (${leave.from} to ${leave.to}) approve ho gayi!`,"leave_approved","/employee/leave");
      toast.success("Leave approved! ✅"); fetchLeaves();
    } catch { toast.error("Failed!"); }
  };
  const handleReject = async leave => {
    try {
      await updateDoc(doc(db,"leaves",leave.id),{status:"rejected"});
      await notifyEmployee(leave.userId,"Leave Rejected ❌",`Tumhari ${leave.type} reject ho gayi.`,"leave_rejected","/employee/leave");
      toast.success("Rejected!"); fetchLeaves();
    } catch { toast.error("Failed!"); }
  };

  const filteredLeaves = filter==="all" ? leaves : leaves.filter(l=>l.status===filter);
  const pending  = leaves.filter(l=>l.status==="pending").length;
  const approved = leaves.filter(l=>l.status==="approved").length;
  const rejected = leaves.filter(l=>l.status==="rejected").length;

  const filters = ["all","pending","approved","rejected"];

  return (
    <AdminLayout pageTitle="Leave Management">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .lp{font-family:'Plus Jakarta Sans',sans-serif;}
        .lp-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .lp-hdr.vis{opacity:1;transform:translateY(0);}
        .lp-hdr-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .lp-hdr-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;}
        .lp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .07s;}
        .lp-stats.vis{opacity:1;transform:translateY(0);}
        .lp-stat{background:#fff;border-radius:14px;padding:18px 20px;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,0.04);position:relative;overflow:hidden;}
        .lp-stat-bar{position:absolute;left:0;top:0;bottom:0;width:4px;}
        .lp-stat-val{font-size:30px;font-weight:800;color:#0f172a;letter-spacing:-1px;margin:0 0 4px;}
        .lp-stat-lbl{font-size:13px;color:#94a3b8;font-weight:500;margin:0;}
        .lp-filters{display:flex;gap:8px;margin-bottom:18px;background:#fff;border-radius:14px;padding:6px;border:1px solid #f1f5f9;width:fit-content;opacity:0;transform:translateY(12px);transition:all .5s cubic-bezier(.22,1,.36,1) .12s;}
        .lp-filters.vis{opacity:1;transform:translateY(0);}
        .lp-filter{padding:8px 18px;border-radius:10px;border:none;cursor:pointer;font-weight:600;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;background:transparent;color:#64748b;}
        .lp-filter.on{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 12px rgba(99,102,241,0.3);}
        .lp-box{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .18s;}
        .lp-box.vis{opacity:1;transform:translateY(0);}
        .lp-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;}
        .lp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;}
        .lp-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:lpspin .7s linear infinite;}
        @keyframes lpspin{to{transform:rotate(360deg);}}
        table.lp-tbl{width:100%;border-collapse:collapse;}
        .lp-thead tr{background:#f8fafc;}
        .lp-th{padding:13px 16px;text-align:left;font-size:11.5px;font-weight:700;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;}
        .lp-tr{border-bottom:1px solid #f8fafc;transition:background .15s;}
        .lp-tr:hover{background:#fafbff;}
        .lp-td{padding:13px 16px;font-size:14px;color:#1e293b;font-weight:500;}
        .lp-emp{display:flex;align-items:center;gap:10px;}
        .lp-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#06b6d4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;}
        .lp-dept{background:rgba(99,102,241,0.1);color:#6366f1;padding:4px 10px;border-radius:100px;font-size:12px;font-weight:600;}
        .lp-type{background:rgba(6,182,212,0.1);color:#0891b2;padding:4px 10px;border-radius:100px;font-size:12px;font-weight:600;}
        .lp-reason{color:#64748b;font-size:13px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .lp-acts{display:flex;gap:6px;}
        .lp-approve{display:flex;align-items:center;gap:5px;padding:7px 12px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:8px;cursor:pointer;font-weight:600;font-size:12.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .lp-approve:hover{background:#dcfce7;}
        .lp-reject{display:flex;align-items:center;gap:5px;padding:7px 12px;background:#fff1f2;color:#ef4444;border:1px solid #fecaca;border-radius:8px;cursor:pointer;font-weight:600;font-size:12.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .lp-reject:hover{background:#fee2e2;}
        .lp-done{color:#cbd5e1;font-size:13px;font-style:italic;}
      `}</style>

      <div className="lp">
        {/* Header */}
        <div className={`lp-hdr ${visible?"vis":""}`}>
          <div>
            <h3 className="lp-hdr-title">Leave Requests</h3>
            <p className="lp-hdr-sub">Manage employee leave requests</p>
          </div>
          <ExportButton label="Export" onExportPDF={()=>exportLeavesPDF(filteredLeaves,usersMap)} onExportExcel={()=>exportLeavesExcel(filteredLeaves,usersMap)} />
        </div>

        {/* Stats */}
        <div className={`lp-stats ${visible?"vis":""}`}>
          {[
            { val:pending,  lbl:"Pending",  clr:"#f59e0b" },
            { val:approved, lbl:"Approved", clr:"#16a34a" },
            { val:rejected, lbl:"Rejected", clr:"#ef4444" },
            { val:leaves.length, lbl:"Total", clr:"#6366f1" },
          ].map((s,i)=>(
            <div className="lp-stat" key={i}>
              <div className="lp-stat-bar" style={{background:s.clr}}/>
              <p className="lp-stat-val">{s.val}</p>
              <p className="lp-stat-lbl">{s.lbl}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={`lp-filters ${visible?"vis":""}`}>
          {filters.map(f=>(
            <button key={f} className={`lp-filter ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className={`lp-box ${visible?"vis":""}`}>
          {loading ? (
            <div className="lp-loading"><div className="lp-spin"/>Loading leaves...</div>
          ) : filteredLeaves.length===0 ? (
            <div className="lp-empty">🌿 No leave requests found!</div>
          ) : (
            <table className="lp-tbl">
              <thead className="lp-thead">
                <tr><th className="lp-th">Emp ID</th><th className="lp-th">Employee</th><th className="lp-th">Dept</th><th className="lp-th">Type</th><th className="lp-th">From</th><th className="lp-th">To</th><th className="lp-th">Days</th><th className="lp-th">Reason</th><th className="lp-th">Status</th><th className="lp-th">Actions</th></tr>
              </thead>
              <tbody>
                {filteredLeaves.map((l,i)=>{
                  const sc = l.status==="approved"?{bg:"rgba(22,163,74,0.1)",clr:"#16a34a",ic:"✅"}:l.status==="rejected"?{bg:"rgba(239,68,68,0.1)",clr:"#ef4444",ic:"❌"}:{bg:"rgba(245,158,11,0.1)",clr:"#d97706",ic:"⏳"};
                  const empId = l.employeeId || usersMap[l.userId]?.employeeId || "—";
                  return (
                    <tr key={l.id} className="lp-tr">
                      <td className="lp-td"><span style={{background:"rgba(99,102,241,0.1)",color:"#6366f1",padding:"3px 8px",borderRadius:"6px",fontSize:"12px",fontWeight:"800",fontFamily:"monospace"}}>{empId}</span></td>
                      <td className="lp-td"><div className="lp-emp"><div className="lp-avatar">{l.userName?.charAt(0).toUpperCase()}</div><span style={{fontWeight:600,color:"#0f172a"}}>{l.userName}</span></div></td>
                      <td className="lp-td"><span className="lp-dept">{l.department}</span></td>
                      <td className="lp-td"><span className="lp-type">{l.type}</span></td>
                      <td className="lp-td">{l.from}</td>
                      <td className="lp-td">{l.to}</td>
                      <td className="lp-td">{l.days}d</td>
                      <td className="lp-td"><span className="lp-reason">{l.reason}</span></td>
                      <td className="lp-td"><span style={{background:sc.bg,color:sc.clr,padding:"4px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:"700",textTransform:"capitalize"}}>{sc.ic} {l.status}</span></td>
                      <td className="lp-td">
                        {l.status==="pending" ? (
                          <div className="lp-acts">
                            <button className="lp-approve" onClick={()=>handleApprove(l)}><Check size={13}/>Approve</button>
                            <button className="lp-reject"  onClick={()=>handleReject(l)}><X size={13}/>Reject</button>
                          </div>
                        ) : <span className="lp-done">Done</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
export default Leaves;