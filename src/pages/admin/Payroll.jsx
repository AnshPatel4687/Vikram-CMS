// src/pages/admin/Payroll.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, doc, setDoc, updateDoc, query, where } from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportPayrollPDF, exportPayrollExcel } from "../../utils/exportUtils";
import { DollarSign, Check, X } from "lucide-react";
import toast from "react-hot-toast";

const Payroll = () => {
  const [employees, setEmployees]   = useState([]);
  const [payrolls, setPayrolls]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [visible, setVisible]       = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7));
  const [formData, setFormData]     = useState({ bonus:"", deduction:"", note:"" });

  const fetchEmployees = async () => {
    try {
      const snap = await getDocs(query(collection(db,"users"), where("role","==","employee")));
      const list = snap.docs.map(d=>({id:d.id,...d.data()}));
      list.sort((a,b) => {
        const nA = parseInt((a.employeeId||"E9999").replace(/\D/g,""),10);
        const nB = parseInt((b.employeeId||"E9999").replace(/\D/g,""),10);
        return nA - nB;
      });
      setEmployees(list);
    } catch { toast.error("Error fetching employees!"); }
    finally { setTimeout(()=>setVisible(true),60); }
  };
  const fetchPayrolls = async month => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db,"payroll"), where("month","==",month)));
      const data = {};
      snap.docs.forEach(d=>{ data[d.data().userId]={id:d.id,...d.data()}; });
      setPayrolls(data);
    } catch { toast.error("Error fetching payroll!"); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ fetchEmployees(); fetchPayrolls(selectedMonth); },[]);

  const handleMonthChange = e => { setSelectedMonth(e.target.value); fetchPayrolls(e.target.value); };
  const handleOpenModal = emp => {
    setSelectedEmp(emp);
    const ex = payrolls[emp.id];
    setFormData({ bonus:ex?.bonus||"", deduction:ex?.deduction||"", note:ex?.note||"" });
    setShowModal(true);
  };
  const validateForm = () => {
    if (formData.bonus && Number(formData.bonus)<0)             { toast.error("Bonus cannot be negative!"); return false; }
    if (formData.deduction && Number(formData.deduction)<0)     { toast.error("Deduction cannot be negative!"); return false; }
    if (formData.deduction && Number(formData.deduction)>selectedEmp.salary) { toast.error("Deduction > salary!"); return false; }
    return true;
  };
  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const bonus=Number(formData.bonus)||0, deduction=Number(formData.deduction)||0;
      await setDoc(doc(db,"payroll",`${selectedEmp.id}_${selectedMonth}`), { userId:selectedEmp.id, employeeId:selectedEmp.employeeId||"", userName:selectedEmp.name, department:selectedEmp.department, month:selectedMonth, basicSalary:selectedEmp.salary, bonus, deduction, netSalary:selectedEmp.salary+bonus-deduction, note:formData.note||"", status:"pending" });
      toast.success("Payroll saved! ✅"); setShowModal(false); fetchPayrolls(selectedMonth);
    } catch { toast.error("Failed to save!"); }
    finally { setSaving(false); }
  };
  const handleMarkPaid = async empId => {
    const p = payrolls[empId];
    if (!p) { toast.error("Generate payroll first!"); return; }
    try { await updateDoc(doc(db,"payroll",p.id),{status:"paid"}); toast.success("Marked as paid! ✅"); fetchPayrolls(selectedMonth); }
    catch { toast.error("Failed!"); }
  };

  const totalPaid    = Object.values(payrolls).filter(p=>p.status==="paid").length;
  const totalPending = Object.values(payrolls).filter(p=>p.status==="pending").length;
  const totalAmount  = Object.values(payrolls).reduce((s,p)=>s+(p.netSalary||0),0);
  const netPreview   = selectedEmp ? selectedEmp.salary+(Number(formData.bonus)||0)-(Number(formData.deduction)||0) : 0;

  return (
    <AdminLayout pageTitle="Payroll Management">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .prp{font-family:'Plus Jakarta Sans',sans-serif;}
        .prp-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .prp-hdr.vis{opacity:1;transform:translateY(0);}
        .prp-hdr-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .prp-hdr-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;}
        .prp-hdr-right{display:flex;gap:10px;align-items:center;}
        .prp-month{padding:10px 14px;border-radius:12px;border:1.5px solid #e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;outline:none;background:#fff;transition:border-color .2s;}
        .prp-month:focus{border-color:#6366f1;}
        .prp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .08s;}
        .prp-stats.vis{opacity:1;transform:translateY(0);}
        .prp-stat{background:#fff;border-radius:14px;padding:18px 20px;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,0.04);position:relative;overflow:hidden;}
        .prp-stat-bar{position:absolute;left:0;top:0;bottom:0;width:4px;}
        .prp-stat-val{font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-1px;margin:0 0 4px;}
        .prp-stat-lbl{font-size:13px;color:#94a3b8;font-weight:500;margin:0;}
        .prp-box{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .15s;}
        .prp-box.vis{opacity:1;transform:translateY(0);}
        .prp-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;}
        .prp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;}
        .prp-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:prpspin .7s linear infinite;}
        @keyframes prpspin{to{transform:rotate(360deg);}}
        table.prp-tbl{width:100%;border-collapse:collapse;}
        .prp-thead tr{background:#f8fafc;}
        .prp-th{padding:13px 16px;text-align:left;font-size:11.5px;font-weight:700;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;}
        .prp-tr{border-bottom:1px solid #f8fafc;transition:background .15s;}
        .prp-tr:hover{background:#fafbff;}
        .prp-td{padding:13px 16px;font-size:14px;color:#1e293b;font-weight:500;}
        .prp-emp{display:flex;align-items:center;gap:10px;}
        .prp-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#06b6d4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;}
        .prp-dept{background:rgba(99,102,241,0.1);color:#6366f1;padding:4px 10px;border-radius:100px;font-size:12px;font-weight:600;}
        .prp-net{font-weight:800;color:#0f172a;}
        .prp-dash{color:#cbd5e1;}
        .prp-acts{display:flex;gap:6px;}
        .prp-gen-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;background:#eff6ff;color:#3b82f6;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:12.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .prp-gen-btn:hover{background:#dbeafe;}
        .prp-pay-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:8px;cursor:pointer;font-weight:600;font-size:12.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .prp-pay-btn:hover{background:#dcfce7;}
        .prp-overlay{position:fixed;inset:0;background:rgba(10,10,20,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:999;animation:prpfade .2s ease;}
        @keyframes prpfade{from{opacity:0;}to{opacity:1;}}
        .prp-modal{background:#fff;border-radius:20px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto;animation:prpslide .3s cubic-bezier(.22,1,.36,1);}
        @keyframes prpslide{from{opacity:0;transform:translateY(20px) scale(.97);}to{opacity:1;transform:none;}}
        .prp-mhdr{display:flex;justify-content:space-between;align-items:center;padding:22px 26px;border-bottom:1px solid #f1f5f9;}
        .prp-mtitle{font-size:17px;font-weight:800;color:#0f172a;margin:0;}
        .prp-mclose{width:34px;height:34px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .2s;}
        .prp-mclose:hover{background:#f1f5f9;color:#0f172a;}
        .prp-mbody{padding:24px 26px;display:flex;flex-direction:column;gap:16px;}
        .prp-info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;background:#f8fafc;border-radius:12px;padding:16px;}
        .prp-info-lbl{font-size:11.5px;color:#94a3b8;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:.4px;}
        .prp-info-val{font-size:15px;font-weight:700;color:#0f172a;margin:0;}
        .prp-fg2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .prp-fgrp{display:flex;flex-direction:column;gap:7px;}
        .prp-lbl{font-size:12.5px;font-weight:600;color:#374151;}
        .prp-inp{padding:11px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;outline:none;transition:all .22s;width:100%;background:#f8fafc;}
        .prp-inp:focus{border-color:#6366f1;background:#fff;box-shadow:0 0 0 4px rgba(99,102,241,0.08);}
        .prp-net-box{background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:14px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;}
        .prp-net-lbl{color:rgba(255,255,255,.8);font-size:13px;font-weight:600;margin:0;}
        .prp-net-val{color:#fff;font-size:26px;font-weight:800;margin:0;letter-spacing:-1px;}
        .prp-mftr{display:flex;justify-content:flex-end;gap:10px;padding:18px 26px;border-top:1px solid #f1f5f9;}
        .prp-cancel{padding:10px 20px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;}
        .prp-submit{display:flex;align-items:center;gap:7px;padding:10px 22px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 4px 12px rgba(99,102,241,0.3);transition:all .2s;}
        .prp-submit:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(99,102,241,0.4);}
        .prp-submit:disabled{opacity:.6;cursor:not-allowed;transform:none;}
      `}</style>

      <div className="prp">
        {/* Header */}
        <div className={`prp-hdr ${visible?"vis":""}`}>
          <div>
            <h3 className="prp-hdr-title">Payroll Management</h3>
            <p className="prp-hdr-sub">Manage employee salaries</p>
          </div>
          <div className="prp-hdr-right">
            <ExportButton label="Export" onExportPDF={()=>exportPayrollPDF(employees,payrolls,selectedMonth)} onExportExcel={()=>exportPayrollExcel(employees,payrolls,selectedMonth)} />
            <input className="prp-month" type="month" value={selectedMonth} onChange={handleMonthChange} />
          </div>
        </div>

        {/* Stats */}
        <div className={`prp-stats ${visible?"vis":""}`}>
          {[
            { val:totalPaid,    lbl:"Paid",            clr:"#16a34a" },
            { val:totalPending, lbl:"Pending",         clr:"#f59e0b" },
            { val:employees.length, lbl:"Employees",   clr:"#6366f1" },
            { val:`₹${totalAmount.toLocaleString()}`, lbl:"Total Amount", clr:"#06b6d4" },
          ].map((s,i)=>(
            <div className="prp-stat" key={i}>
              <div className="prp-stat-bar" style={{background:s.clr}}/>
              <p className="prp-stat-val">{s.val}</p>
              <p className="prp-stat-lbl">{s.lbl}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className={`prp-box ${visible?"vis":""}`}>
          {loading ? (
            <div className="prp-loading"><div className="prp-spin"/>Loading payroll...</div>
          ) : employees.length===0 ? (
            <div className="prp-empty">No employees found!</div>
          ) : (
            <table className="prp-tbl">
              <thead className="prp-thead">
                <tr><th className="prp-th">Emp ID</th><th className="prp-th">Employee</th><th className="prp-th">Department</th><th className="prp-th">Basic</th><th className="prp-th">Bonus</th><th className="prp-th">Deduction</th><th className="prp-th">Net Salary</th><th className="prp-th">Status</th><th className="prp-th">Actions</th></tr>
              </thead>
              <tbody>
                {employees.map((emp,i)=>{
                  const p = payrolls[emp.id];
                  const isPaid = p?.status==="paid";
                  return (
                    <tr key={emp.id} className="prp-tr">
                      <td className="prp-td"><span style={{background:"rgba(99,102,241,0.1)",color:"#6366f1",padding:"3px 8px",borderRadius:"6px",fontSize:"12px",fontWeight:"800",fontFamily:"monospace"}}>{emp.employeeId||"—"}</span></td>
                      <td className="prp-td"><div className="prp-emp"><div className="prp-avatar">{emp.name?.charAt(0).toUpperCase()}</div><div><span style={{fontWeight:600,color:"#0f172a"}}>{emp.name}</span><p style={{fontSize:"12px",color:"#94a3b8",margin:0}}>{emp.email}</p></div></div></td>
                      <td className="prp-td"><span className="prp-dept">{emp.department}</span></td>
                      <td className="prp-td">₹{emp.salary?.toLocaleString()}</td>
                      <td className="prp-td">{p ? <span style={{color:"#16a34a",fontWeight:600}}>+₹{p.bonus?.toLocaleString()}</span> : <span className="prp-dash">—</span>}</td>
                      <td className="prp-td">{p ? <span style={{color:"#ef4444",fontWeight:600}}>-₹{p.deduction?.toLocaleString()}</span> : <span className="prp-dash">—</span>}</td>
                      <td className="prp-td">{p ? <span className="prp-net">₹{p.netSalary?.toLocaleString()}</span> : <span className="prp-dash">—</span>}</td>
                      <td className="prp-td">
                        {p ? (
                          <span style={{background:isPaid?"rgba(22,163,74,0.1)":"rgba(245,158,11,0.1)",color:isPaid?"#16a34a":"#d97706",padding:"4px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:"700",textTransform:"capitalize"}}>{p.status}</span>
                        ) : <span style={{color:"#cbd5e1",fontSize:"13px",fontStyle:"italic"}}>Not Generated</span>}
                      </td>
                      <td className="prp-td">
                        <div className="prp-acts">
                          <button className="prp-gen-btn" onClick={()=>handleOpenModal(emp)}><DollarSign size={13}/>{p?"Edit":"Generate"}</button>
                          {p && p.status==="pending" && <button className="prp-pay-btn" onClick={()=>handleMarkPaid(emp.id)}><Check size={13}/>Pay</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedEmp && (
          <div className="prp-overlay">
            <div className="prp-modal">
              <div className="prp-mhdr">
                <h3 className="prp-mtitle">Payroll — {selectedEmp.name}</h3>
                <button className="prp-mclose" onClick={()=>setShowModal(false)}><X size={16}/></button>
              </div>
              <div className="prp-mbody">
                <div className="prp-info-grid">
                  <div><p className="prp-info-lbl">Basic Salary</p><p className="prp-info-val">₹{selectedEmp.salary?.toLocaleString()}</p></div>
                  <div><p className="prp-info-lbl">Department</p><p className="prp-info-val">{selectedEmp.department}</p></div>
                  <div><p className="prp-info-lbl">Month</p><p className="prp-info-val">{selectedMonth}</p></div>
                </div>
                <div className="prp-fg2">
                  <div className="prp-fgrp"><label className="prp-lbl">Bonus (₹)</label><input className="prp-inp" type="number" min="0" value={formData.bonus} onChange={e=>setFormData({...formData,bonus:e.target.value})} placeholder="0"/></div>
                  <div className="prp-fgrp"><label className="prp-lbl">Deduction (₹)</label><input className="prp-inp" type="number" min="0" value={formData.deduction} onChange={e=>setFormData({...formData,deduction:e.target.value})} placeholder="0"/></div>
                </div>
                <div className="prp-fgrp"><label className="prp-lbl">Note (Optional)</label><input className="prp-inp" type="text" value={formData.note} onChange={e=>setFormData({...formData,note:e.target.value})} placeholder="Add a note"/></div>
                <div className="prp-net-box">
                  <p className="prp-net-lbl">Net Salary Preview</p>
                  <p className="prp-net-val">₹{netPreview.toLocaleString()}</p>
                </div>
              </div>
              <div className="prp-mftr">
                <button className="prp-cancel" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="prp-submit" onClick={handleSave} disabled={saving}><Check size={15}/>{saving?"Saving...":"Save Payroll"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
export default Payroll;