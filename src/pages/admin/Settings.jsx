// src/pages/admin/Settings.jsx
import { useState } from "react";
import { db, auth } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import { Check, Lock, Building2, Bell } from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const { userData, user, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: userData?.name || "",
    phone: userData?.phone || "",
    department: userData?.department || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [companyForm, setCompanyForm] = useState({
    companyName: "CompanyMS",
    address: "",
    email: "",
    phone: "",
  });

  // Profile Update
  const handleProfileUpdate = async () => {
    if (!profileForm.name.trim()) {
      toast.error("Name is required!"); return;
    }
    if (!/^[a-zA-Z\s]+$/.test(profileForm.name)) {
      toast.error("Name must contain only letters!"); return;
    }
    if (profileForm.phone && !/^[6-9]\d{9}$/.test(profileForm.phone)) {
      toast.error("Enter valid 10-digit phone number!"); return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      await refreshUserData();
      toast.success("Profile updated! ✅");
    } catch (error) {
      toast.error("Failed to update profile!");
    } finally {
      setSaving(false);
    }
  };

  // Password Update
  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword) {
      toast.error("Current password is required!"); return;
    }
    if (!passwordForm.newPassword) {
      toast.error("New password is required!"); return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!"); return;
    }
    if (!/(?=.*[0-9])/.test(passwordForm.newPassword)) {
      toast.error("Password must contain at least one number!"); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match!"); return;
    }
    setSaving(true);
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordForm.newPassword);
      toast.success("Password updated! ✅");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        toast.error("Current password is wrong!");
      } else {
        toast.error("Failed to update password!");
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "👤 Profile", },
    { id: "password", label: "🔒 Password", },
    { id: "company", label: "🏢 Company", },
    { id: "notifications", label: "🔔 Notifications", },
  ];

  return (
    <AdminLayout pageTitle="Settings">
      <div style={styles.container}>
        {/* Sidebar Tabs */}
        <div style={styles.tabsBox}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabBtn,
                background: activeTab === tab.id ? "#4f46e5" : "#fff",
                color: activeTab === tab.id ? "#fff" : "#64748b",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={styles.content}>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>👤 Profile Settings</h3>
              <p style={styles.cardSub}>Update your personal information</p>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter full name"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    value={userData?.email || ""}
                    style={{ ...styles.input, background: "#f1f5f9" }}
                    disabled
                  />
                  <p style={styles.hint}>Email cannot be changed</p>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    style={styles.input}
                    maxLength={10}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Department</label>
                  <input
                    value={profileForm.department}
                    style={{ ...styles.input, background: "#f1f5f9" }}
                    disabled
                  />
                </div>
              </div>

              <button
                onClick={handleProfileUpdate}
                disabled={saving}
                style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
              >
                <Check size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🔒 Change Password</h3>
              <p style={styles.cardSub}>Keep your account secure</p>

              <div style={styles.formColumn}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Current Password *</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min 6 chars + 1 number"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Password Rules */}
              <div style={styles.rulesBox}>
                <p style={styles.rulesTitle}>Password Requirements:</p>
                <p style={styles.rule}>✅ At least 6 characters</p>
                <p style={styles.rule}>✅ At least one number</p>
                <p style={styles.rule}>✅ Both passwords must match</p>
              </div>

              <button
                onClick={handlePasswordUpdate}
                disabled={saving}
                style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
              >
                <Lock size={18} />
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}

          {/* Company Tab */}
          {activeTab === "company" && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🏢 Company Settings</h3>
              <p style={styles.cardSub}>Update company information</p>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Company Name</label>
                  <input
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    placeholder="Company name"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Company Email</label>
                  <input
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    placeholder="company@email.com"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Company Phone</label>
                  <input
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="Company phone number"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Address</label>
                  <input
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    placeholder="Company address"
                    style={styles.input}
                  />
                </div>
              </div>

              <button
                onClick={() => toast.success("Company settings saved! ✅")}
                style={styles.saveBtn}
              >
                <Building2 size={18} />
                Save Company Info
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🔔 Notification Settings</h3>
              <p style={styles.cardSub}>Manage your notifications</p>

              <div style={styles.notifList}>
                {[
                  { label: "New Leave Request", desc: "Get notified when employee applies leave", key: "leave" },
                  { label: "Attendance Alert", desc: "Get notified about attendance issues", key: "attendance" },
                  { label: "New Employee Signup", desc: "Get notified when someone signs up", key: "signup" },
                  { label: "Payroll Reminder", desc: "Get reminded about pending payrolls", key: "payroll" },
                ].map((notif) => (
                  <div key={notif.key} style={styles.notifItem}>
                    <div>
                      <p style={styles.notifLabel}>{notif.label}</p>
                      <p style={styles.notifDesc}>{notif.desc}</p>
                    </div>
                    <label style={styles.toggle}>
                      <input type="checkbox" defaultChecked style={{ display: "none" }} />
                      <div style={styles.toggleTrack}>
                        <div style={styles.toggleThumb}></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={() => toast.success("Notification settings saved! ✅")}
                style={styles.saveBtn}
              >
                <Bell size={18} />
                Save Notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "24px",
    alignItems: "start",
  },
  tabsBox: {
    background: "#fff",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  tabBtn: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    textAlign: "left",
  },
  content: {
    flex: 1,
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 6px 0",
  },
  cardSub: {
    color: "#64748b",
    fontSize: "14px",
    margin: "0 0 24px 0",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "24px",
  },
  formColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
    maxWidth: "400px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  hint: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: 0,
    fontStyle: "italic",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
  },
  rulesBox: {
    background: "#f0fdf4",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "24px",
    border: "1px solid #bbf7d0",
  },
  rulesTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#16a34a",
    margin: "0 0 8px 0",
  },
  rule: {
    fontSize: "13px",
    color: "#16a34a",
    margin: "4px 0",
  },
  notifList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
  },
  notifItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  notifLabel: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  notifDesc: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  toggle: {
    cursor: "pointer",
  },
  toggleTrack: {
    width: "44px",
    height: "24px",
    background: "#4f46e5",
    borderRadius: "12px",
    position: "relative",
    padding: "2px",
  },
  toggleThumb: {
    width: "20px",
    height: "20px",
    background: "#fff",
    borderRadius: "50%",
    position: "absolute",
    right: "2px",
  },
};

export default Settings;