// src/pages/admin/Employees.jsx
import { useEffect, useState } from "react";
import { db, secondaryAuth } from "../../firebase/config";
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import AdminLayout from "../../components/admin/AdminLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportEmployeesPDF, exportEmployeesExcel } from "../../utils/exportUtils";
import { UserPlus, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { generateEmployeeId } from "../../utils/generateEmployeeId";

const departments = ["IT","HR","Finance","Marketing","Operations","Sales"];

const Employees = () => {
  const [employees, setEmployees]       = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedPending, setSelectedPending] = useState(null);
  const [editMode, setEditMode]         = useState(false);
  const [editId, setEditId]             = useState(null);
  const [activeTab, setActiveTab]       = useState("employees");
  const [visible, setVisible]           = useState(false);
  const [roleForm, setRoleForm]         = useState({ department:"", salary:"", role:"employee" });
  const [formData, setFormData]         = useState({ name:"", email:"", password:"", department:"", salary:"", phone:"", joinDate:"" });

  const fetchEmployees = async () => {
    try {
      const snap = await getDocs(query(collection(db,"users"), where("role","==","employee")));
      const list = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      // Sort by employeeId numerically: E0001 < E0002 < E0003 ...
      list.sort((a, b) => {
        const numA = parseInt((a.employeeId||"E9999").replace(/\D/g,""), 10);
        const numB = parseInt((b.employeeId||"E9999").replace(/\D/g,""), 10);
        return numA - numB;
      });
      setEmployees(list);
    } catch { toast.error("Error fetching employees!"); }
    finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
  };
  const fetchPendingUsers = async () => {
    try {
      const snap = await getDocs(query(collection(db,"users"), where("role","==","pending")));
      setPendingUsers(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch { toast.error("Error fetching pending users!"); }
  };
  useEffect(() => { fetchEmployees(); fetchPendingUsers(); }, []);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    if (!formData.name.trim())                          { toast.error("Name is required!"); return false; }
    if (formData.name.trim().length < 3)               { toast.error("Name must be at least 3 chars!"); return false; }
    if (!/^[a-zA-Z\s]+$/.test(formData.name))         { toast.error("Name must contain only letters!"); return false; }
    if (!formData.email.trim())                         { toast.error("Email is required!"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Enter valid email!"); return false; }
    if (!editMode) {
      if (!formData.password)                           { toast.error("Password is required!"); return false; }
      if (formData.password.length < 6)                { toast.error("Min 6 characters!"); return false; }
      if (!/(?=.*[0-9])/.test(formData.password))      { toast.error("Password must contain a number!"); return false; }
    }
    if (!formData.department)                           { toast.error("Please select a department!"); return false; }
    if (!formData.phone.trim())                         { toast.error("Phone is required!"); return false; }
    if (!/^[6-9]\d{9}$/.test(formData.phone))         { toast.error("Enter valid 10-digit phone!"); return false; }
    if (!formData.salary)                               { toast.error("Salary is required!"); return false; }
    if (Number(formData.salary) < 1000)                { toast.error("Salary must be at least ₹1,000!"); return false; }
    if (!formData.joinDate)                             { toast.error("Join date is required!"); return false; }
    if (new Date(formData.joinDate) > new Date())      { toast.error("Join date cannot be future!"); return false; }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      const employeeId = await generateEmployeeId();
      const result = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      await setDoc(doc(db,"users",result.user.uid), {
        name:formData.name.trim(), email:formData.email.trim(),
        department:formData.department, salary:Number(formData.salary),
        phone:formData.phone.trim(), joinDate:formData.joinDate,
        role:"employee", addedByAdmin:true, employeeId,
      });
      toast.success(`Employee added! ID: ${employeeId} ✅`);
      setShowModal(false); resetForm(); fetchEmployees();
    } catch(e) {
      toast.error(e.code==="auth/email-already-in-use" ? "Email already exists!" : e.message);
    }
  };
  const handleEdit = emp => {
    setEditMode(true); setEditId(emp.id);
    setFormData({ name:emp.name, email:emp.email, password:"", department:emp.department, salary:emp.salary, phone:emp.phone, joinDate:emp.joinDate });
    setShowModal(true);
  };
  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      await updateDoc(doc(db,"users",editId), { name:formData.name.trim(), department:formData.department, salary:Number(formData.salary), phone:formData.phone.trim(), joinDate:formData.joinDate });
      toast.success("Employee updated! ✅"); setShowModal(false); resetForm(); fetchEmployees();
    } catch { toast.error("Update failed!"); }
  };
  const handleDelete = async id => {
    if (!window.confirm("Delete this employee?")) return;
    try { await deleteDoc(doc(db,"users",id)); toast.success("Deleted!"); fetchEmployees(); }
    catch { toast.error("Delete failed!"); }
  };
  const handleApprovePending = async () => {
    if (!roleForm.department)                    { toast.error("Select department!"); return; }
    if (!roleForm.salary||Number(roleForm.salary)<1000) { toast.error("Enter valid salary!"); return; }
    try {
      const employeeId = await generateEmployeeId();
      await updateDoc(doc(db,"users",selectedPending.id), { role:roleForm.role, department:roleForm.department, salary:Number(roleForm.salary), joinDate:new Date().toISOString().split("T")[0], employeeId });
      toast.success(`Approved as ${roleForm.role}! ID: ${employeeId} ✅`);
      setShowRoleModal(false); setSelectedPending(null); setRoleForm({department:"",salary:"",role:"employee"});
      fetchEmployees(); fetchPendingUsers();
    } catch { toast.error("Failed to approve!"); }
  };
  const handleRejectPending = async id => {
    if (!window.confirm("Reject this user?")) return;
    try { await deleteDoc(doc(db,"users",id)); toast.success("User rejected!"); fetchPendingUsers(); }
    catch { toast.error("Failed to reject!"); }
  };
  const resetForm = () => {
    setFormData({ name:"",email:"",password:"",department:"",salary:"",phone:"",joinDate:"" });
    setEditMode(false); setEditId(null);
  };

  return (
    <AdminLayout pageTitle="Employee Management">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .ep{font-family:'Plus Jakarta Sans',sans-serif;}

        /* Header */
        .ep-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .ep-hdr.vis{opacity:1;transform:translateY(0);}
        .ep-hdr-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .ep-hdr-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;font-weight:500;}
        .ep-hdr-right{display:flex;gap:10px;align-items:center;}
        .ep-add-btn{display:flex;align-items:center;gap:8px;padding:11px 20px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;box-shadow:0 4px 14px rgba(99,102,241,0.3);}
        .ep-add-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(99,102,241,0.4);}

        /* Tabs */
        .ep-tabs{display:flex;gap:8px;margin-bottom:18px;background:#fff;border-radius:14px;padding:6px;border:1px solid #f1f5f9;width:fit-content;opacity:0;transform:translateY(12px);transition:all .5s cubic-bezier(.22,1,.36,1) .08s;}
        .ep-tabs.vis{opacity:1;transform:translateY(0);}
        .ep-tab{padding:9px 20px;border-radius:10px;border:none;cursor:pointer;font-weight:600;font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;}
        .ep-tab-emp{background:transparent;color:#64748b;}
        .ep-tab-emp.on{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 12px rgba(99,102,241,0.3);}
        .ep-tab-pend{background:transparent;color:#64748b;}
        .ep-tab-pend.on{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;box-shadow:0 4px 12px rgba(245,158,11,0.3);}

        /* Table Box */
        .ep-box{background:#fff;border-radius:16px;overflow:visible;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1) .15s;}
        .ep-tbl-wrap{overflow:hidden;border-radius:16px;}
        .ep-box.vis{opacity:1;transform:translateY(0);}
        .ep-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;font-weight:500;}
        .ep-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;font-size:14px;}
        .ep-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:epspin .7s linear infinite;}
        @keyframes epspin{to{transform:rotate(360deg);}}
        table.ep-tbl{width:100%;border-collapse:collapse;}
        thead.ep-thead tr{background:#f8fafc;}
        .ep-th{padding:13px 16px;text-align:left;font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:.5px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;}
        .ep-tr{border-bottom:1px solid #f8fafc;transition:background .15s;}
        .ep-tr:hover{background:#fafbff;}
        .ep-td{padding:14px 16px;font-size:14px;color:#1e293b;font-weight:500;}
        .ep-emp-name{display:flex;align-items:center;gap:10px;}
        .ep-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#06b6d4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;}
        .ep-avatar-amber{background:linear-gradient(135deg,#f59e0b,#fbbf24);}
        .ep-name-text{font-weight:600;color:#0f172a;}
        .ep-dept{background:rgba(99,102,241,0.1);color:#6366f1;padding:4px 10px;border-radius:100px;font-size:12px;font-weight:600;}
        .ep-act{display:flex;gap:6px;}
        .ep-edit-btn{width:32px;height:32px;background:#eff6ff;color:#3b82f6;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
        .ep-edit-btn:hover{background:#dbeafe;transform:scale(1.1);}
        .ep-del-btn{width:32px;height:32px;background:#fff1f2;color:#ef4444;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
        .ep-del-btn:hover{background:#fee2e2;transform:scale(1.1);}
        .ep-approve-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:8px;cursor:pointer;font-weight:600;font-size:12.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .ep-approve-btn:hover{background:#dcfce7;}
        .ep-reject-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;background:#fff1f2;color:#ef4444;border:1px solid #fecaca;border-radius:8px;cursor:pointer;font-weight:600;font-size:12.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .ep-reject-btn:hover{background:#fee2e2;}

        /* Modal */
        .ep-overlay{position:fixed;inset:0;background:rgba(10,10,20,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:999;animation:epfade .2s ease;}
        @keyframes epfade{from{opacity:0;}to{opacity:1;}}
        .ep-modal{background:#fff;border-radius:20px;width:580px;max-width:95vw;max-height:90vh;overflow-y:auto;animation:epslide .3s cubic-bezier(.22,1,.36,1);}
        @keyframes epslide{from{opacity:0;transform:translateY(24px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        .ep-modal-hdr{display:flex;justify-content:space-between;align-items:center;padding:22px 26px;border-bottom:1px solid #f1f5f9;}
        .ep-modal-title{font-size:17px;font-weight:800;color:#0f172a;letter-spacing:-.3px;margin:0;}
        .ep-modal-close{width:34px;height:34px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;color:#64748b;}
        .ep-modal-close:hover{background:#f1f5f9;color:#0f172a;}
        .ep-modal-body{padding:24px 26px;}
        .ep-fg{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .ep-fgrp{display:flex;flex-direction:column;gap:7px;}
        .ep-lbl{font-size:12.5px;font-weight:600;color:#374151;letter-spacing:.2px;}
        .ep-inp{padding:11px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;outline:none;transition:all .22s;width:100%;background:#f8fafc;}
        .ep-inp:focus{border-color:#6366f1;background:#fff;box-shadow:0 0 0 4px rgba(99,102,241,0.08);}
        .ep-inp:disabled{opacity:.6;cursor:not-allowed;}
        .ep-info-box{background:#f8fafc;border:1px solid #f1f5f9;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:6px;font-size:13.5px;color:#475569;margin-bottom:16px;}
        .ep-modal-ftr{display:flex;justify-content:flex-end;gap:10px;padding:18px 26px;border-top:1px solid #f1f5f9;}
        .ep-cancel-btn{padding:10px 20px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .ep-cancel-btn:hover{background:#f1f5f9;}
        .ep-submit-btn{display:flex;align-items:center;gap:7px;padding:10px 22px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;box-shadow:0 4px 12px rgba(99,102,241,0.3);}
        .ep-submit-btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(99,102,241,0.4);}
      `}</style>

      <div className="ep">
        {/* Header */}
        <div className={`ep-hdr ${visible?"vis":""}`}>
          <div>
            <h3 className="ep-hdr-title">Employee Management</h3>
            <p className="ep-hdr-sub">Total: {employees.length} employees</p>
          </div>
          <div className="ep-hdr-right">
            <ExportButton label="Export" onExportPDF={()=>exportEmployeesPDF(employees)} onExportExcel={()=>exportEmployeesExcel(employees)} />
            <button className="ep-add-btn" onClick={()=>{resetForm();setShowModal(true);}}>
              <UserPlus size={16}/> Add Employee
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`ep-tabs ${visible?"vis":""}`}>
          <button className={`ep-tab ep-tab-emp ${activeTab==="employees"?"on":""}`} onClick={()=>setActiveTab("employees")}>
            👥 Employees ({employees.length})
          </button>
          <button className={`ep-tab ep-tab-pend ${activeTab==="pending"?"on":""}`} onClick={()=>setActiveTab("pending")}>
            ⏳ Pending ({pendingUsers.length})
          </button>
        </div>

        {/* Table */}
        <div className={`ep-box ${visible?"vis":""}`}>
          <div className="ep-tbl-wrap">
          {activeTab==="employees" && (
            loading ? (
              <div className="ep-loading"><div className="ep-spin"/>Loading employees...</div>
            ) : employees.length===0 ? (
              <div className="ep-empty">👤 No employees yet. Add your first employee!</div>
            ) : (
              <table className="ep-tbl">
                <thead className="ep-thead">
                  <tr><th className="ep-th">Emp ID</th><th className="ep-th">Name</th><th className="ep-th">Email</th><th className="ep-th">Department</th><th className="ep-th">Phone</th><th className="ep-th">Salary</th><th className="ep-th">Join Date</th><th className="ep-th">Actions</th></tr>
                </thead>
                <tbody>
                  {employees.map((emp,i)=>(
                    <tr key={emp.id} className="ep-tr">
                      <td className="ep-td"><span style={{background:"rgba(99,102,241,0.1)",color:"#6366f1",padding:"3px 8px",borderRadius:"6px",fontSize:"12px",fontWeight:"700",fontFamily:"monospace",letterSpacing:".3px"}}>{emp.employeeId||"—"}</span></td>
                      <td className="ep-td"><div className="ep-emp-name"><div className="ep-avatar">{emp.name?.charAt(0).toUpperCase()}</div><span className="ep-name-text">{emp.name}</span></div></td>
                      <td className="ep-td">{emp.email}</td>
                      <td className="ep-td"><span className="ep-dept">{emp.department}</span></td>
                      <td className="ep-td">{emp.phone}</td>
                      <td className="ep-td">₹{Number(emp.salary).toLocaleString()}</td>
                      <td className="ep-td">{emp.joinDate}</td>
                      <td className="ep-td">
                        <div className="ep-act">
                          <button className="ep-edit-btn" onClick={()=>handleEdit(emp)}><Pencil size={14}/></button>
                          <button className="ep-del-btn" onClick={()=>handleDelete(emp.id)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          {activeTab==="pending" && (
            pendingUsers.length===0 ? (
              <div className="ep-empty">✅ No pending approvals!</div>
            ) : (
              <table className="ep-tbl">
                <thead className="ep-thead">
                  <tr><th className="ep-th">#</th><th className="ep-th">Name</th><th className="ep-th">Email</th><th className="ep-th">Phone</th><th className="ep-th">Registered</th><th className="ep-th">Actions</th></tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u,i)=>(
                    <tr key={u.id} className="ep-tr">
                      <td className="ep-td">{i+1}</td>
                      <td className="ep-td"><div className="ep-emp-name"><div className={`ep-avatar ep-avatar-amber`}>{u.name?.charAt(0).toUpperCase()}</div><span className="ep-name-text">{u.name}</span></div></td>
                      <td className="ep-td">{u.email}</td>
                      <td className="ep-td">{u.phone}</td>
                      <td className="ep-td">{u.createdAt?.slice(0,10)}</td>
                      <td className="ep-td">
                        <div className="ep-act">
                          <button className="ep-approve-btn" onClick={()=>{setSelectedPending(u);setShowRoleModal(true);}}><Check size={13}/>Approve</button>
                          <button className="ep-reject-btn" onClick={()=>handleRejectPending(u.id)}><X size={13}/>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="ep-overlay">
            <div className="ep-modal">
              <div className="ep-modal-hdr">
                <h3 className="ep-modal-title">{editMode?"Edit Employee":"Add New Employee"}</h3>
                <button className="ep-modal-close" onClick={()=>{setShowModal(false);resetForm();}}><X size={16}/></button>
              </div>
              <div className="ep-modal-body">
                <div className="ep-fg">
                  <div className="ep-fgrp"><label className="ep-lbl">Full Name *</label><input className="ep-inp" name="name" value={formData.name} onChange={handleChange} placeholder="Enter full name"/></div>
                  <div className="ep-fgrp"><label className="ep-lbl">Email *</label><input className="ep-inp" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" disabled={editMode} style={{opacity:editMode?.6:1}}/></div>
                  {!editMode && <div className="ep-fgrp"><label className="ep-lbl">Password *</label><input className="ep-inp" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Min 6 chars + 1 number"/></div>}
                  <div className="ep-fgrp"><label className="ep-lbl">Department *</label><select className="ep-inp" name="department" value={formData.department} onChange={handleChange}><option value="">Select Department</option>{departments.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                  <div className="ep-fgrp"><label className="ep-lbl">Salary (₹) *</label><input className="ep-inp" name="salary" type="number" value={formData.salary} onChange={handleChange} placeholder="Enter salary"/></div>
                  <div className="ep-fgrp"><label className="ep-lbl">Phone *</label><input className="ep-inp" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit number" maxLength={10}/></div>
                  <div className="ep-fgrp"><label className="ep-lbl">Join Date *</label><input className="ep-inp" name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} max={new Date().toISOString().split("T")[0]}/></div>
                </div>
              </div>
              <div className="ep-modal-ftr">
                <button className="ep-cancel-btn" onClick={()=>{setShowModal(false);resetForm();}}>Cancel</button>
                <button className="ep-submit-btn" onClick={editMode?handleUpdate:handleAdd}><Check size={15}/>{editMode?"Update Employee":"Add Employee"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {showRoleModal && selectedPending && (
          <div className="ep-overlay">
            <div className="ep-modal">
              <div className="ep-modal-hdr">
                <h3 className="ep-modal-title">Approve — {selectedPending.name}</h3>
                <button className="ep-modal-close" onClick={()=>setShowRoleModal(false)}><X size={16}/></button>
              </div>
              <div className="ep-modal-body">
                <div className="ep-info-box">
                  <span><strong>Name:</strong> {selectedPending.name}</span>
                  <span><strong>Email:</strong> {selectedPending.email}</span>
                  <span><strong>Phone:</strong> {selectedPending.phone}</span>
                </div>
                <div className="ep-fg">
                  <div className="ep-fgrp"><label className="ep-lbl">Assign Role *</label><select className="ep-inp" value={roleForm.role} onChange={e=>setRoleForm({...roleForm,role:e.target.value})}><option value="employee">Employee</option><option value="admin">Admin</option></select></div>
                  <div className="ep-fgrp"><label className="ep-lbl">Department *</label><select className="ep-inp" value={roleForm.department} onChange={e=>setRoleForm({...roleForm,department:e.target.value})}><option value="">Select Department</option>{departments.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                  <div className="ep-fgrp" style={{gridColumn:"1/-1"}}><label className="ep-lbl">Salary (₹) *</label><input className="ep-inp" type="number" value={roleForm.salary} onChange={e=>setRoleForm({...roleForm,salary:e.target.value})} placeholder="Enter salary" min="1000"/></div>
                </div>
              </div>
              <div className="ep-modal-ftr">
                <button className="ep-cancel-btn" onClick={()=>setShowRoleModal(false)}>Cancel</button>
                <button className="ep-submit-btn" onClick={handleApprovePending}><Check size={15}/>Approve User</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
export default Employees;