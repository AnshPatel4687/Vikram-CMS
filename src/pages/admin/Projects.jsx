// src/pages/admin/Projects.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { notifyEmployee } from "../../firebase/notifications";
import AdminLayout from "../../components/admin/AdminLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportProjectsPDF, exportProjectsExcel } from "../../utils/exportUtils";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

const Projects = () => {
  const [projects, setProjects]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [visible, setVisible]     = useState(false);
  const [formData, setFormData]   = useState({ name:"", description:"", status:"active", deadline:"", assignedTo:[] });

  const fetchProjects = async () => {
    try {
      const snap = await getDocs(collection(db,"projects"));
      setProjects(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch { toast.error("Error fetching projects!"); }
    finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
  };
  const fetchEmployees = async () => {
    try {
      const snap = await getDocs(query(collection(db,"users"), where("role","==","employee")));
      setEmployees(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch { toast.error("Error fetching employees!"); }
  };
  useEffect(() => { fetchProjects(); fetchEmployees(); }, []);

  const resetForm = () => { setFormData({ name:"", description:"", status:"active", deadline:"", assignedTo:[] }); setEditMode(false); setEditId(null); };
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const toggleEmp = id => setFormData({ ...formData, assignedTo: formData.assignedTo.includes(id) ? formData.assignedTo.filter(x=>x!==id) : [...formData.assignedTo, id] });

  const validateForm = () => {
    if (!formData.name.trim())               { toast.error("Project name is required!"); return false; }
    if (formData.name.trim().length < 3)     { toast.error("Name must be at least 3 chars!"); return false; }
    if (!formData.description.trim())        { toast.error("Description is required!"); return false; }
    if (!formData.deadline)                  { toast.error("Deadline is required!"); return false; }
    if (formData.assignedTo.length === 0)   { toast.error("Assign at least one employee!"); return false; }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      await addDoc(collection(db,"projects"), { name:formData.name.trim(), description:formData.description.trim(), status:formData.status, deadline:formData.deadline, assignedTo:formData.assignedTo, createdAt:new Date().toISOString() });
      for (const empId of formData.assignedTo) await notifyEmployee(empId,"New Project Assigned 📁",`Tumhe "${formData.name.trim()}" project assign kiya gaya hai!`,"project","/employee/projects");
      toast.success("Project added! ✅"); setShowModal(false); resetForm(); fetchProjects();
    } catch { toast.error("Failed to add project!"); }
  };
  const handleEdit = p => { setEditMode(true); setEditId(p.id); setFormData({ name:p.name, description:p.description, status:p.status, deadline:p.deadline, assignedTo:p.assignedTo||[] }); setShowModal(true); };
  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      await updateDoc(doc(db,"projects",editId), { name:formData.name.trim(), description:formData.description.trim(), status:formData.status, deadline:formData.deadline, assignedTo:formData.assignedTo });
      for (const empId of formData.assignedTo) await notifyEmployee(empId,"Project Updated 📁",`"${formData.name.trim()}" project update hua hai!`,"project","/employee/projects");
      toast.success("Project updated! ✅"); setShowModal(false); resetForm(); fetchProjects();
    } catch { toast.error("Failed to update!"); }
  };
  const handleDelete = async id => {
    if (!window.confirm("Delete this project?")) return;
    try { await deleteDoc(doc(db,"projects",id)); toast.success("Deleted!"); fetchProjects(); }
    catch { toast.error("Delete failed!"); }
  };

  const statusStyle = s => ({ active:{ bg:"rgba(16,185,129,0.1)", clr:"#059669" }, completed:{ bg:"rgba(59,130,246,0.1)", clr:"#2563eb" }, "on-hold":{ bg:"rgba(245,158,11,0.1)", clr:"#d97706" } }[s] || { bg:"#f1f5f9", clr:"#64748b" });
  const getEmpNames = ids => !ids?.length ? "None" : ids.map(id => employees.find(e=>e.id===id)?.name||"Unknown").join(", ");

  return (
    <AdminLayout pageTitle="Projects">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .pp { font-family:'Plus Jakarta Sans',sans-serif; }
        .pp-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .pp-hdr.vis{opacity:1;transform:translateY(0);}
        .pp-hdr-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .pp-hdr-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;font-weight:500;}
        .pp-hdr-right{display:flex;gap:10px;align-items:center;}
        .pp-add-btn{display:flex;align-items:center;gap:8px;padding:11px 20px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;box-shadow:0 4px 14px rgba(99,102,241,0.3);}
        .pp-add-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(99,102,241,0.4);}
        .pp-box{background:#fff;border-radius:16px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1) .1s;overflow:hidden;}
        .pp-box.vis{opacity:1;transform:translateY(0);}
        .pp-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;font-weight:500;}
        .pp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;font-size:14px;}
        .pp-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:ppspin .7s linear infinite;}
        @keyframes ppspin{to{transform:rotate(360deg);}}
        table.pp-tbl{width:100%;border-collapse:collapse;}
        .pp-thead tr{background:#f8fafc;}
        .pp-th{padding:13px 16px;text-align:left;font-size:11.5px;font-weight:700;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;}
        .pp-tr{border-bottom:1px solid #f8fafc;transition:background .15s;}
        .pp-tr:hover{background:#fafbff;}
        .pp-td{padding:14px 16px;font-size:14px;color:#1e293b;font-weight:500;}
        .pp-proj-name{font-weight:700;color:#0f172a;font-size:14px;}
        .pp-desc{color:#64748b;font-size:13px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .pp-act{display:flex;gap:6px;}
        .pp-edit-btn{width:32px;height:32px;background:#eff6ff;color:#3b82f6;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
        .pp-edit-btn:hover{background:#dbeafe;transform:scale(1.1);}
        .pp-del-btn{width:32px;height:32px;background:#fff1f2;color:#ef4444;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
        .pp-del-btn:hover{background:#fee2e2;transform:scale(1.1);}
        .pp-overlay{position:fixed;inset:0;background:rgba(10,10,20,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:999;animation:ppfade .2s ease;}
        @keyframes ppfade{from{opacity:0;}to{opacity:1;}}
        .pp-modal{background:#fff;border-radius:20px;width:580px;max-width:95vw;max-height:90vh;overflow-y:auto;animation:ppslide .3s cubic-bezier(.22,1,.36,1);}
        @keyframes ppslide{from{opacity:0;transform:translateY(24px) scale(.97);}to{opacity:1;transform:none;}}
        .pp-modal-hdr{display:flex;justify-content:space-between;align-items:center;padding:22px 26px;border-bottom:1px solid #f1f5f9;}
        .pp-modal-title{font-size:17px;font-weight:800;color:#0f172a;letter-spacing:-.3px;margin:0;}
        .pp-modal-close{width:34px;height:34px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .2s;}
        .pp-modal-close:hover{background:#f1f5f9;color:#0f172a;}
        .pp-modal-body{padding:24px 26px;display:flex;flex-direction:column;gap:16px;}
        .pp-fgrp{display:flex;flex-direction:column;gap:7px;}
        .pp-fg2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .pp-lbl{font-size:12.5px;font-weight:600;color:#374151;}
        .pp-inp{padding:11px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;outline:none;transition:all .22s;width:100%;background:#f8fafc;}
        .pp-inp:focus{border-color:#6366f1;background:#fff;box-shadow:0 0 0 4px rgba(99,102,241,0.08);}
        .pp-emp-grid{display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#f8fafc;border-radius:10px;border:1.5px solid #e2e8f0;min-height:52px;}
        .pp-chip{padding:7px 14px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;}
        .pp-chip.on{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border-color:transparent;box-shadow:0 2px 8px rgba(99,102,241,0.3);}
        .pp-chip:hover{border-color:#6366f1;color:#6366f1;}
        .pp-chip.on:hover{opacity:.9;}
        .pp-modal-ftr{display:flex;justify-content:flex-end;gap:10px;padding:18px 26px;border-top:1px solid #f1f5f9;}
        .pp-cancel-btn{padding:10px 20px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .pp-cancel-btn:hover{background:#f1f5f9;}
        .pp-submit-btn{display:flex;align-items:center;gap:7px;padding:10px 22px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;box-shadow:0 4px 12px rgba(99,102,241,0.3);}
        .pp-submit-btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(99,102,241,0.4);}
      `}</style>

      <div className="pp">
        {/* Header */}
        <div className={`pp-hdr ${visible?"vis":""}`}>
          <div>
            <h3 className="pp-hdr-title">Project Management</h3>
            <p className="pp-hdr-sub">Total: {projects.length} projects</p>
          </div>
          <div className="pp-hdr-right">
            <ExportButton label="Export" onExportPDF={()=>exportProjectsPDF(projects,employees)} onExportExcel={()=>exportProjectsExcel(projects,employees)} />
            <button className="pp-add-btn" onClick={()=>{resetForm();setShowModal(true);}}>
              <Plus size={16}/> Add Project
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={`pp-box ${visible?"vis":""}`}>
          {loading ? (
            <div className="pp-loading"><div className="pp-spin"/>Loading projects...</div>
          ) : projects.length===0 ? (
            <div className="pp-empty">📁 No projects yet. Add your first project!</div>
          ) : (
            <table className="pp-tbl">
              <thead className="pp-thead">
                <tr><th className="pp-th">#</th><th className="pp-th">Project Name</th><th className="pp-th">Description</th><th className="pp-th">Status</th><th className="pp-th">Deadline</th><th className="pp-th">Assigned To</th><th className="pp-th">Actions</th></tr>
              </thead>
              <tbody>
                {projects.map((p,i) => {
                  const ss = statusStyle(p.status);
                  return (
                    <tr key={p.id} className="pp-tr">
                      <td className="pp-td">{i+1}</td>
                      <td className="pp-td"><span className="pp-proj-name">{p.name}</span></td>
                      <td className="pp-td"><span className="pp-desc">{p.description}</span></td>
                      <td className="pp-td">
                        <span style={{background:ss.bg,color:ss.clr,padding:"4px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:"700",textTransform:"capitalize"}}>{p.status}</span>
                      </td>
                      <td className="pp-td">{p.deadline}</td>
                      <td className="pp-td" style={{fontSize:"13px",color:"#64748b"}}>{getEmpNames(p.assignedTo)}</td>
                      <td className="pp-td">
                        <div className="pp-act">
                          <button className="pp-edit-btn" onClick={()=>handleEdit(p)}><Pencil size={14}/></button>
                          <button className="pp-del-btn" onClick={()=>handleDelete(p.id)}><Trash2 size={14}/></button>
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
        {showModal && (
          <div className="pp-overlay">
            <div className="pp-modal">
              <div className="pp-modal-hdr">
                <h3 className="pp-modal-title">{editMode?"Edit Project":"Add New Project"}</h3>
                <button className="pp-modal-close" onClick={()=>{setShowModal(false);resetForm();}}><X size={16}/></button>
              </div>
              <div className="pp-modal-body">
                <div className="pp-fgrp">
                  <label className="pp-lbl">Project Name *</label>
                  <input className="pp-inp" name="name" value={formData.name} onChange={handleChange} placeholder="Enter project name"/>
                </div>
                <div className="pp-fgrp">
                  <label className="pp-lbl">Description *</label>
                  <textarea className="pp-inp" name="description" value={formData.description} onChange={handleChange} placeholder="Enter project description" style={{height:"80px",resize:"vertical"}}/>
                </div>
                <div className="pp-fg2">
                  <div className="pp-fgrp">
                    <label className="pp-lbl">Status *</label>
                    <select className="pp-inp" name="status" value={formData.status} onChange={handleChange}>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>
                  <div className="pp-fgrp">
                    <label className="pp-lbl">Deadline *</label>
                    <input className="pp-inp" name="deadline" type="date" value={formData.deadline} onChange={handleChange}/>
                  </div>
                </div>
                <div className="pp-fgrp">
                  <label className="pp-lbl">Assign Employees * ({formData.assignedTo.length} selected)</label>
                  <div className="pp-emp-grid">
                    {employees.map(emp => (
                      <div key={emp.id} className={`pp-chip ${formData.assignedTo.includes(emp.id)?"on":""}`} onClick={()=>toggleEmp(emp.id)}>
                        {formData.assignedTo.includes(emp.id)?"✓ ":""}{emp.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pp-modal-ftr">
                <button className="pp-cancel-btn" onClick={()=>{setShowModal(false);resetForm();}}>Cancel</button>
                <button className="pp-submit-btn" onClick={editMode?handleUpdate:handleAdd}><Check size={15}/>{editMode?"Update Project":"Add Project"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
export default Projects;