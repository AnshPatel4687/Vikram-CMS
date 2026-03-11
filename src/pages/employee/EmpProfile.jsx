// src/pages/employee/EmpProfile.jsx
import { useState } from "react";
import { db } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import { User, Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";

const EmpProfile = () => {
  const { user, userData, refreshUserData } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    phone: userData?.phone || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required!"); return false;
    }
    if (formData.name.trim().length < 3) {
      toast.error("Name must be at least 3 characters!"); return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      toast.error("Name must contain only letters!"); return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone is required!"); return false;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error("Enter valid 10-digit Indian phone number!"); return false;
    }
    return true;
  };
 
  const handleSave = async () => {
  if (!validateForm()) return;
  setSaving(true);
  try {
    await updateDoc(doc(db, "users", user.uid), {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
    });
    await refreshUserData();
    toast.success("Profile updated! ✅");
    setEditMode(false);
    // Form data bhi update karo
    setFormData({
         name: formData.name.trim(),
      phone: formData.phone.trim(),
    });
  } catch (error) {
    console.log("Profile update error:", error);
    toast.error("Failed to update profile! Check Firestore rules.");
  } finally {
    setSaving(false);
  }
};
  


  return (
    <EmpLayout pageTitle="My Profile">
      <div style={styles.container}>
        {/* Profile Card */}
        <div style={styles.profileCard}>
          <div style={styles.avatarBox}>
            <div style={styles.avatar}>
              <User size={48} color="#fff" />
            </div>
            <h2 style={styles.name}>{userData?.name}</h2>
            <p style={styles.dept}>{userData?.department} Department</p>
            <span style={styles.roleBadge}>👤 Employee</span>
          </div>
        </div>

        {/* Info Card */}
        <div style={styles.infoCard}>
          <div style={styles.infoHeader}>
            <h3 style={styles.infoTitle}>Personal Information</h3>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} style={styles.editBtn}>
                <Pencil size={16} />
                Edit Profile
              </button>
            ) : (
              <div style={styles.editActions}>
                <button
                  onClick={() => setEditMode(false)}
                  style={styles.cancelBtn}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
                >
                  <Check size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div style={styles.fieldsGrid}>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Full Name</label>
              {editMode ? (
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                />
              ) : (
                <p style={styles.fieldValue}>{userData?.name || "---"}</p>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.fieldLabel}>Email Address</label>
              <p style={styles.fieldValue}>{userData?.email || "---"}</p>
              <p style={styles.readOnly}>Email cannot be changed</p>
            </div>

            <div style={styles.field}>
              <label style={styles.fieldLabel}>Phone Number</label>
              {editMode ? (
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  maxLength={10}
                  placeholder="10-digit mobile number"
                />
              ) : (
                <p style={styles.fieldValue}>{userData?.phone || "---"}</p>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.fieldLabel}>Department</label>
              <p style={styles.fieldValue}>{userData?.department || "---"}</p>
              <p style={styles.readOnly}>Contact admin to change</p>
            </div>

            <div style={styles.field}>
              <label style={styles.fieldLabel}>Basic Salary</label>
              <p style={styles.fieldValue}>
                ₹{userData?.salary?.toLocaleString() || "---"}
              </p>
              <p style={styles.readOnly}>Contact admin to change</p>
            </div>

            <div style={styles.field}>
              <label style={styles.fieldLabel}>Join Date</label>
              <p style={styles.fieldValue}>{userData?.joinDate || "---"}</p>
            </div>
          </div>
        </div>
      </div>
    </EmpLayout>
  );
};

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "24px",
    alignItems: "start",
  },
  profileCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "30px 20px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  avatarBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
    textAlign: "center",
  },
  dept: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
    textAlign: "center",
  },
  roleBadge: {
    background: "#e0f2fe",
    color: "#0891b2",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },
  infoCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  infoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  infoTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  editBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  editActions: {
    display: "flex",
    gap: "10px",
  },
  cancelBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  fieldsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  fieldValue: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  readOnly: {
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
};

export default EmpProfile;