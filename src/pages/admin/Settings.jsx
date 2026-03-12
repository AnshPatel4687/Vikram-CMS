// src/pages/admin/Settings.jsx
import { useState } from "react";
import { db, auth } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import { Check, Lock, Building2, Bell, User, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const { userData, user, refreshUserData } = useAuth();
  const [activeTab, setActiveTab]   = useState("profile");
  const [saving, setSaving]         = useState(false);
  const [showCur, setShowCur]       = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showCon, setShowCon]       = useState(false);
  const [notifs, setNotifs]         = useState({ leave:true, attendance:true, signup:true, payroll:true });

  const [profileForm, setProfileForm] = useState({ name:userData?.name||"", phone:userData?.phone||"", department:userData?.department||"" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [companyForm, setCompanyForm]   = useState({ companyName:"CompanyMS", address:"", email:"", phone:"" });

  const handleProfileUpdate = async () => {
    if (!profileForm.name.trim())                         { toast.error("Name is required!"); return; }
    if (!/^[a-zA-Z\s]+$/.test(profileForm.name))        { toast.error("Name must be letters only!"); return; }
    if (profileForm.phone && !/^[6-9]\d{9}$/.test(profileForm.phone)) { toast.error("Enter valid phone!"); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db,"users",user.uid), { name:profileForm.name.trim(), phone:profileForm.phone.trim() });
      await refreshUserData();
      toast.success("Profile updated! ✅");
    } catch { toast.error("Failed!"); }
    finally { setSaving(false); }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword)                  { toast.error("Current password required!"); return; }
    if (!passwordForm.newPassword)                      { toast.error("New password required!"); return; }
    if (passwordForm.newPassword.length < 6)            { toast.error("Min 6 characters!"); return; }
    if (!/(?=.*[0-9])/.test(passwordForm.newPassword)) { toast.error("Must contain a number!"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error("Passwords don't match!"); return; }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, passwordForm.newPassword);
      toast.success("Password updated! ✅");
      setPasswordForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch(e) {
      toast.error(e.code==="auth/wrong-password"||e.code==="auth/invalid-credential" ? "Current password is wrong!" : "Failed!");
    } finally { setSaving(false); }
  };

  const tabs = [
    { id:"profile",       icon:<User size={16}/>,     label:"Profile"       },
    { id:"password",      icon:<Lock size={16}/>,     label:"Password"      },
    { id:"company",       icon:<Building2 size={16}/>,label:"Company"       },
    { id:"notifications", icon:<Bell size={16}/>,     label:"Notifications" },
  ];

  const notifItems = [
    { key:"leave",      label:"New Leave Request",    desc:"When employee applies for leave" },
    { key:"attendance", label:"Attendance Alert",     desc:"About attendance issues" },
    { key:"signup",     label:"New Employee Signup",  desc:"When someone signs up" },
    { key:"payroll",    label:"Payroll Reminder",     desc:"About pending payrolls" },
  ];

  return (
    <AdminLayout pageTitle="Settings">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .sp{font-family:'Plus Jakarta Sans',sans-serif;}
        .sp-wrap{display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start;}
        .sp-tabs{background:#fff;border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:6px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);}
        .sp-tab{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;border:none;cursor:pointer;font-weight:600;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;text-align:left;transition:all .2s;color:#64748b;background:transparent;}
        .sp-tab.on{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 12px rgba(99,102,241,0.25);}
        .sp-tab:hover:not(.on){background:#f8fafc;color:#0f172a;}
        .sp-card{background:#fff;border-radius:16px;padding:28px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);}
        .sp-card-title{font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-.3px;margin:0 0 4px;}
        .sp-card-sub{font-size:13px;color:#94a3b8;margin:0 0 24px;}
        .sp-fg2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
        .sp-fgcol{display:flex;flex-direction:column;gap:16px;margin-bottom:24px;max-width:420px;}
        .sp-fgrp{display:flex;flex-direction:column;gap:7px;}
        .sp-lbl{font-size:12.5px;font-weight:600;color:#374151;letter-spacing:.2px;}
        .sp-hint{font-size:11px;color:#cbd5e1;margin:2px 0 0;font-style:italic;}
        .sp-inp-wrap{position:relative;}
        .sp-inp{padding:11px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;outline:none;transition:all .22s;width:100%;background:#f8fafc;}
        .sp-inp:focus{border-color:#6366f1;background:#fff;box-shadow:0 0 0 4px rgba(99,102,241,0.08);}
        .sp-inp:disabled{opacity:.5;cursor:not-allowed;background:#f1f5f9;}
        .sp-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;padding:0;}
        .sp-rules{background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid #bbf7d0;}
        .sp-rules-title{font-size:12.5px;font-weight:700;color:#16a34a;margin:0 0 8px;text-transform:uppercase;letter-spacing:.4px;}
        .sp-rule{font-size:13px;color:#16a34a;margin:4px 0;}
        .sp-save-btn{display:flex;align-items:center;gap:8px;padding:11px 24px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;box-shadow:0 4px 12px rgba(99,102,241,0.3);}
        .sp-save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(99,102,241,0.4);}
        .sp-save-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}
        .sp-notif-list{display:flex;flex-direction:column;gap:12px;margin-bottom:24px;}
        .sp-notif-item{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9;transition:background .2s;}
        .sp-notif-item:hover{background:#f1f5f9;}
        .sp-notif-lbl{font-size:14px;font-weight:600;color:#0f172a;margin:0 0 3px;}
        .sp-notif-desc{font-size:12.5px;color:#94a3b8;margin:0;}
        .sp-toggle{position:relative;width:44px;height:24px;flex-shrink:0;cursor:pointer;}
        .sp-toggle input{opacity:0;width:0;height:0;position:absolute;}
        .sp-track{position:absolute;inset:0;border-radius:100px;background:#e2e8f0;transition:background .25s;}
        .sp-track.on{background:linear-gradient(135deg,#6366f1,#4f46e5);}
        .sp-thumb{position:absolute;top:2px;left:2px;width:20px;height:20px;background:#fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.15);transition:transform .25s;}
        .sp-thumb.on{transform:translateX(20px);}
      `}</style>

      <div className="sp">
        <div className="sp-wrap">
          {/* Sidebar tabs */}
          <div className="sp-tabs">
            {tabs.map(t=>(
              <button key={t.id} className={`sp-tab ${activeTab===t.id?"on":""}`} onClick={()=>setActiveTab(t.id)}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="sp-card">

            {/* Profile */}
            {activeTab==="profile" && <>
              <p className="sp-card-title">👤 Profile Settings</p>
              <p className="sp-card-sub">Update your personal information</p>
              <div className="sp-fg2">
                <div className="sp-fgrp"><label className="sp-lbl">Full Name *</label><input className="sp-inp" value={profileForm.name} onChange={e=>setProfileForm({...profileForm,name:e.target.value})} placeholder="Enter full name"/></div>
                <div className="sp-fgrp"><label className="sp-lbl">Email Address</label><input className="sp-inp" value={userData?.email||""} disabled/><p className="sp-hint">Email cannot be changed</p></div>
                <div className="sp-fgrp"><label className="sp-lbl">Phone Number</label><input className="sp-inp" value={profileForm.phone} onChange={e=>setProfileForm({...profileForm,phone:e.target.value})} placeholder="10-digit mobile" maxLength={10}/></div>
                <div className="sp-fgrp"><label className="sp-lbl">Department</label><input className="sp-inp" value={profileForm.department} disabled/></div>
              </div>
              <button className="sp-save-btn" onClick={handleProfileUpdate} disabled={saving}><Check size={16}/>{saving?"Saving...":"Save Changes"}</button>
            </>}

            {/* Password */}
            {activeTab==="password" && <>
              <p className="sp-card-title">🔒 Change Password</p>
              <p className="sp-card-sub">Keep your account secure</p>
              <div className="sp-fgcol">
                <div className="sp-fgrp"><label className="sp-lbl">Current Password *</label><div className="sp-inp-wrap"><input className="sp-inp" type={showCur?"text":"password"} value={passwordForm.currentPassword} onChange={e=>setPasswordForm({...passwordForm,currentPassword:e.target.value})} placeholder="Enter current password" style={{paddingRight:40}}/><button className="sp-eye" onClick={()=>setShowCur(!showCur)}>{showCur?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
                <div className="sp-fgrp"><label className="sp-lbl">New Password *</label><div className="sp-inp-wrap"><input className="sp-inp" type={showNew?"text":"password"} value={passwordForm.newPassword} onChange={e=>setPasswordForm({...passwordForm,newPassword:e.target.value})} placeholder="Min 6 chars + 1 number" style={{paddingRight:40}}/><button className="sp-eye" onClick={()=>setShowNew(!showNew)}>{showNew?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
                <div className="sp-fgrp"><label className="sp-lbl">Confirm New Password *</label><div className="sp-inp-wrap"><input className="sp-inp" type={showCon?"text":"password"} value={passwordForm.confirmPassword} onChange={e=>setPasswordForm({...passwordForm,confirmPassword:e.target.value})} placeholder="Re-enter new password" style={{paddingRight:40}}/><button className="sp-eye" onClick={()=>setShowCon(!showCon)}>{showCon?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
              </div>
              <div className="sp-rules"><p className="sp-rules-title">Requirements</p><p className="sp-rule">✅ At least 6 characters</p><p className="sp-rule">✅ At least one number</p><p className="sp-rule">✅ Both passwords must match</p></div>
              <button className="sp-save-btn" onClick={handlePasswordUpdate} disabled={saving}><Lock size={16}/>{saving?"Updating...":"Update Password"}</button>
            </>}

            {/* Company */}
            {activeTab==="company" && <>
              <p className="sp-card-title">🏢 Company Settings</p>
              <p className="sp-card-sub">Update company information</p>
              <div className="sp-fg2">
                <div className="sp-fgrp"><label className="sp-lbl">Company Name</label><input className="sp-inp" value={companyForm.companyName} onChange={e=>setCompanyForm({...companyForm,companyName:e.target.value})} placeholder="Company name"/></div>
                <div className="sp-fgrp"><label className="sp-lbl">Company Email</label><input className="sp-inp" value={companyForm.email} onChange={e=>setCompanyForm({...companyForm,email:e.target.value})} placeholder="company@email.com"/></div>
                <div className="sp-fgrp"><label className="sp-lbl">Company Phone</label><input className="sp-inp" value={companyForm.phone} onChange={e=>setCompanyForm({...companyForm,phone:e.target.value})} placeholder="Phone number"/></div>
                <div className="sp-fgrp"><label className="sp-lbl">Address</label><input className="sp-inp" value={companyForm.address} onChange={e=>setCompanyForm({...companyForm,address:e.target.value})} placeholder="Company address"/></div>
              </div>
              <button className="sp-save-btn" onClick={()=>toast.success("Company settings saved! ✅")}><Building2 size={16}/>Save Company Info</button>
            </>}

            {/* Notifications */}
            {activeTab==="notifications" && <>
              <p className="sp-card-title">🔔 Notification Settings</p>
              <p className="sp-card-sub">Manage your notifications</p>
              <div className="sp-notif-list">
                {notifItems.map(n=>(
                  <div key={n.key} className="sp-notif-item">
                    <div><p className="sp-notif-lbl">{n.label}</p><p className="sp-notif-desc">{n.desc}</p></div>
                    <label className="sp-toggle">
                      <input type="checkbox" checked={notifs[n.key]} onChange={e=>setNotifs({...notifs,[n.key]:e.target.checked})}/>
                      <div className={`sp-track ${notifs[n.key]?"on":""}`}/>
                      <div className={`sp-thumb ${notifs[n.key]?"on":""}`}/>
                    </label>
                  </div>
                ))}
              </div>
              <button className="sp-save-btn" onClick={()=>toast.success("Notification settings saved! ✅")}><Bell size={16}/>Save Notifications</button>
            </>}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
export default Settings;