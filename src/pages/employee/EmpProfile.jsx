// src/pages/employee/EmpProfile.jsx
import { useState } from "react";
import { db } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import { Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";

const EmpProfile = () => {
  const { user, userData, refreshUserData } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState({ name:userData?.name||"", phone:userData?.phone||"" });

  const validate = () => {
    if (!formData.name.trim())                        { toast.error("Name is required!"); return false; }
    if (formData.name.trim().length < 3)             { toast.error("Min 3 characters!"); return false; }
    if (!/^[a-zA-Z\s]+$/.test(formData.name))       { toast.error("Letters only!"); return false; }
    if (!formData.phone.trim())                       { toast.error("Phone is required!"); return false; }
    if (!/^[6-9]\d{9}$/.test(formData.phone))       { toast.error("Enter valid 10-digit phone!"); return false; }
    return true;
  };
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db,"users",user.uid), { name:formData.name.trim(), phone:formData.phone.trim() });
      await refreshUserData();
      toast.success("Profile updated! ✅"); setEditMode(false);
    } catch { toast.error("Failed to update!"); }
    finally { setSaving(false); }
  };

  const fields = [
    { lbl:"Full Name",    editable:true,  key:"name",  val:userData?.name },
    { lbl:"Email",        editable:false, val:userData?.email, hint:"Cannot be changed" },
    { lbl:"Phone",        editable:true,  key:"phone", val:userData?.phone },
    { lbl:"Department",   editable:false, val:userData?.department, hint:"Contact admin to change" },
    { lbl:"Basic Salary", editable:false, val:`₹${userData?.salary?.toLocaleString()||"---"}`, hint:"Contact admin to change" },
    { lbl:"Join Date",    editable:false, val:userData?.joinDate },
  ];

  return (
    <EmpLayout pageTitle="My Profile">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .epp{font-family:'Plus Jakarta Sans',sans-serif;}
        .epp-wrap{display:grid;grid-template-columns:260px 1fr;gap:20px;align-items:start;}

        /* Left card */
        .epp-left{background:#fff;border-radius:18px;padding:30px 20px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;}
        .epp-avatar-ring{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#0891b2);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(6,182,212,0.35);font-size:38px;font-weight:800;color:#fff;}
        .epp-name{font-size:19px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-.3px;}
        .epp-dept{font-size:13px;color:#94a3b8;margin:0;font-weight:500;}
        .epp-badge{background:rgba(6,182,212,0.1);color:#0891b2;border:1px solid rgba(6,182,212,0.2);padding:6px 16px;border-radius:100px;font-size:12.5px;font-weight:600;}
        .epp-divider{width:100%;height:1px;background:#f1f5f9;}
        .epp-meta{width:100%;display:flex;flex-direction:column;gap:10px;}
        .epp-meta-item{display:flex;justify-content:space-between;align-items:center;font-size:13px;}
        .epp-meta-lbl{color:#94a3b8;font-weight:500;}
        .epp-meta-val{color:#0f172a;font-weight:600;}

        /* Right card */
        .epp-right{background:#fff;border-radius:18px;padding:26px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);}
        .epp-rhdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
        .epp-rtitle{font-size:17px;font-weight:800;color:#0f172a;letter-spacing:-.3px;margin:0;}
        .epp-edit-btn{display:flex;align-items:center;gap:7px;padding:10px 18px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;box-shadow:0 4px 12px rgba(6,182,212,0.3);}
        .epp-edit-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(6,182,212,0.4);}
        .epp-acts{display:flex;gap:8px;}
        .epp-cancel-btn{display:flex;align-items:center;gap:6px;padding:10px 16px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;font-weight:600;font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .epp-save-btn{display:flex;align-items:center;gap:6px;padding:10px 18px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 4px 12px rgba(6,182,212,0.3);transition:all .2s;}
        .epp-save-btn:disabled{opacity:.6;cursor:not-allowed;}
        .epp-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .epp-field{display:flex;flex-direction:column;gap:7px;}
        .epp-flbl{font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;}
        .epp-fval{font-size:15px;font-weight:600;color:#0f172a;margin:0;}
        .epp-fhint{font-size:11px;color:#cbd5e1;margin:0;font-style:italic;}
        .epp-inp{padding:11px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;outline:none;transition:all .22s;background:#f8fafc;}
        .epp-inp:focus{border-color:#06b6d4;background:#fff;box-shadow:0 0 0 4px rgba(6,182,212,0.08);}
      `}</style>

      <div className="epp">
        <div className="epp-wrap">
          {/* Left */}
          <div className="epp-left">
            <div className="epp-avatar-ring">{userData?.name?.charAt(0).toUpperCase()}</div>
            <p className="epp-name">{userData?.name}</p>
            <p className="epp-dept">{userData?.department} Department</p>
            <span className="epp-badge">👤 Employee</span>
            <div className="epp-divider"/>
            <div className="epp-meta">
              <div className="epp-meta-item"><span className="epp-meta-lbl">Salary</span><span className="epp-meta-val">₹{userData?.salary?.toLocaleString()}</span></div>
              <div className="epp-meta-item"><span className="epp-meta-lbl">Joined</span><span className="epp-meta-val">{userData?.joinDate||"—"}</span></div>
              <div className="epp-meta-item"><span className="epp-meta-lbl">Status</span><span style={{color:"#16a34a",fontWeight:600}}>🟢 Active</span></div>
            </div>
          </div>

          {/* Right */}
          <div className="epp-right">
            <div className="epp-rhdr">
              <p className="epp-rtitle">Personal Information</p>
              {!editMode ? (
                <button className="epp-edit-btn" onClick={()=>setEditMode(true)}><Pencil size={15}/>Edit Profile</button>
              ) : (
                <div className="epp-acts">
                  <button className="epp-cancel-btn" onClick={()=>setEditMode(false)}><X size={15}/>Cancel</button>
                  <button className="epp-save-btn" onClick={handleSave} disabled={saving}><Check size={15}/>{saving?"Saving...":"Save"}</button>
                </div>
              )}
            </div>
            <div className="epp-grid">
              {fields.map((f,i)=>(
                <div key={i} className="epp-field">
                  <label className="epp-flbl">{f.lbl}</label>
                  {editMode && f.editable ? (
                    <input className="epp-inp" value={formData[f.key]} onChange={e=>setFormData({...formData,[f.key]:e.target.value})} maxLength={f.key==="phone"?10:undefined} placeholder={f.key==="phone"?"10-digit number":""}/>
                  ) : (
                    <>
                      <p className="epp-fval">{f.val||"—"}</p>
                      {f.hint && <p className="epp-fhint">{f.hint}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EmpLayout>
  );
};
export default EmpProfile;