// src/pages/admin/Employees.jsx
import { useEffect, useState } from "react";
import { db, secondaryAuth } from "../../firebase/config";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import AdminLayout from "../../components/admin/AdminLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportEmployeesPDF, exportEmployeesExcel } from "../../utils/exportUtils";
import { UserPlus, Pencil, Trash2, X, Check, Clock } from "lucide-react";
import toast from "react-hot-toast";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedPending, setSelectedPending] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("employees");
  const [roleForm, setRoleForm] = useState({
    department: "",
    salary: "",
    role: "employee",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    salary: "",
    phone: "",
    joinDate: "",
  });

  const fetchEmployees = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("role", "==", "employee"))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEmployees(list);
    } catch (error) {
      toast.error("Error fetching employees!");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("role", "==", "pending"))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPendingUsers(list);
    } catch (error) {
      toast.error("Error fetching pending users!");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPendingUsers();
  }, []);

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
    if (!formData.email.trim()) {
      toast.error("Email is required!"); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Enter a valid email address!"); return false;
    }
    if (!editMode) {
      if (!formData.password) {
        toast.error("Password is required!"); return false;
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters!"); return false;
      }
      if (!/(?=.*[0-9])/.test(formData.password)) {
        toast.error("Password must contain at least one number!"); return false;
      }
    }
    if (!formData.department) {
      toast.error("Please select a department!"); return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required!"); return false;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error("Enter valid 10-digit Indian phone number!"); return false;
    }
    if (!formData.salary) {
      toast.error("Salary is required!"); return false;
    }
    if (Number(formData.salary) < 1000) {
      toast.error("Salary must be at least ₹1,000!"); return false;
    }
    if (!formData.joinDate) {
      toast.error("Join date is required!"); return false;
    }
    const joinDate = new Date(formData.joinDate);
    const today = new Date();
    if (joinDate > today) {
      toast.error("Join date cannot be in the future!"); return false;
    }
    return true;
  };

  const handleAdd = async () => {
  if (!validateForm()) return;
  try {
    // Firebase Auth me account banao
    const result = await createUserWithEmailAndPassword(
      secondaryAuth,
      formData.email,
      formData.password
    );
    const uid = result.user.uid;

    // Firestore me save karo — addedByAdmin: true
    await setDoc(doc(db, "users", uid), {
      name: formData.name.trim(),
      email: formData.email.trim(),
      department: formData.department,
      salary: Number(formData.salary),
      phone: formData.phone.trim(),
      joinDate: formData.joinDate,
      role: "employee",
      addedByAdmin: true,
    });

    // Employee ko notification bhejo
    await notifyEmployee(
      uid,
      "Account Created! 🎉",
      `Tumhara account admin ne create kiya hai. Ab tum login kar sakte ho!`,
      "signup",
      "/employee/dashboard"
    );

    toast.success("Employee added successfully! ✅");
    setShowModal(false);
    resetForm();
    fetchEmployees();
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      toast.error("Email already exists!");
    } else {
      toast.error(error.message);
    }
  }
};

  const handleEdit = (emp) => {
    setEditMode(true);
    setEditId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: "",
      department: emp.department,
      salary: emp.salary,
      phone: emp.phone,
      joinDate: emp.joinDate,
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      await updateDoc(doc(db, "users", editId), {
        name: formData.name.trim(),
        department: formData.department,
        salary: Number(formData.salary),
        phone: formData.phone.trim(),
        joinDate: formData.joinDate,
      });
      toast.success("Employee updated! ✅");
      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error("Update failed!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Employee deleted!");
      fetchEmployees();
    } catch (error) {
      toast.error("Delete failed!");
    }
  };

  // Pending user ko approve karo
  const handleApprovePending = async () => {
    if (!roleForm.department) {
      toast.error("Please select department!"); return;
    }
    if (!roleForm.salary || Number(roleForm.salary) < 1000) {
      toast.error("Please enter valid salary!"); return;
    }
    try {
      await updateDoc(doc(db, "users", selectedPending.id), {
        role: roleForm.role,
        department: roleForm.department,
        salary: Number(roleForm.salary),
        joinDate: new Date().toISOString().split("T")[0],
      });
      toast.success(`User approved as ${roleForm.role}! ✅`);
      setShowRoleModal(false);
      setSelectedPending(null);
      setRoleForm({ department: "", salary: "", role: "employee" });
      fetchEmployees();
      fetchPendingUsers();
    } catch (error) {
      toast.error("Failed to approve user!");
    }
  };

  // Pending user ko reject karo
  const handleRejectPending = async (id) => {
    if (!window.confirm("Reject this user?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("User rejected and removed!");
      fetchPendingUsers();
    } catch (error) {
      toast.error("Failed to reject!");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      department: "",
      salary: "",
      phone: "",
      joinDate: "",
    });
    setEditMode(false);
    setEditId(null);
  };

  const departments = ["IT", "HR", "Finance", "Marketing", "Operations", "Sales"];

  return (
    <AdminLayout pageTitle="Employee Management">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>Employee Management</h3>
          <p style={styles.headerSub}>Total: {employees.length} employees</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <ExportButton
            label="Export"
            onExportPDF={() => exportEmployeesPDF(employees)}
            onExportExcel={() => exportEmployeesExcel(employees)}
          />
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            style={styles.addBtn}
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("employees")}
          style={{
            ...styles.tab,
            background: activeTab === "employees" ? "#4f46e5" : "#fff",
            color: activeTab === "employees" ? "#fff" : "#64748b",
          }}
        >
          👥 Employees ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            ...styles.tab,
            background: activeTab === "pending" ? "#f59e0b" : "#fff",
            color: activeTab === "pending" ? "#fff" : "#64748b",
          }}
        >
          ⏳ Pending Approvals ({pendingUsers.length})
        </button>
      </div>

      {/* Employees Table */}
      {activeTab === "employees" && (
        <div style={styles.tableBox}>
          {loading ? (
            <div style={styles.loading}>Loading employees...</div>
          ) : employees.length === 0 ? (
            <div style={styles.empty}>No employees found. Add your first employee!</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Salary</th>
                  <th style={styles.th}>Join Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, index) => (
                  <tr key={emp.id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <div style={styles.empName}>
                        <div style={styles.avatar}>
                          {emp.name?.charAt(0).toUpperCase()}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td style={styles.td}>{emp.email}</td>
                    <td style={styles.td}>
                      <span style={styles.deptBadge}>{emp.department}</span>
                    </td>
                    <td style={styles.td}>{emp.phone}</td>
                    <td style={styles.td}>₹{Number(emp.salary).toLocaleString()}</td>
                    <td style={styles.td}>{emp.joinDate}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button onClick={() => handleEdit(emp)} style={styles.editBtn}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} style={styles.deleteBtn}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pending Users Table */}
      {activeTab === "pending" && (
        <div style={styles.tableBox}>
          {pendingUsers.length === 0 ? (
            <div style={styles.empty}>✅ No pending approvals!</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Registered On</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user, index) => (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <div style={styles.empName}>
                        <div style={{ ...styles.avatar, background: "linear-gradient(135deg, #f59e0b, #fcd34d)" }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.phone}</td>
                    <td style={styles.td}>{user.createdAt?.slice(0, 10)}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          onClick={() => {
                            setSelectedPending(user);
                            setShowRoleModal(true);
                          }}
                          style={styles.approveBtn}
                        >
                          <Check size={15} /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectPending(user.id)}
                          style={styles.rejectBtn}
                        >
                          <X size={15} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editMode ? "Edit Employee" : "Add New Employee"}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    style={{
                      ...styles.input,
                      background: editMode ? "#f1f5f9" : "#fff",
                    }}
                    disabled={editMode}
                  />
                </div>
                {!editMode && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Password *</label>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 chars + 1 number"
                      style={styles.input}
                    />
                  </div>
                )}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Salary (₹) *</label>
                  <input
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="Enter salary"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone *</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    style={styles.input}
                    maxLength={10}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Join Date *</label>
                  <input
                    name="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={handleChange}
                    style={styles.input}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={editMode ? handleUpdate : handleAdd}
                style={styles.submitBtn}
              >
                <Check size={18} />
                {editMode ? "Update Employee" : "Add Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && selectedPending && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                Approve — {selectedPending.name}
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              {/* User Info */}
              <div style={styles.userInfoBox}>
                <p><strong>Name:</strong> {selectedPending.name}</p>
                <p><strong>Email:</strong> {selectedPending.email}</p>
                <p><strong>Phone:</strong> {selectedPending.phone}</p>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Assign Role *</label>
                  <select
                    value={roleForm.role}
                    onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
                    style={styles.input}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Department *</label>
                  <select
                    value={roleForm.department}
                    onChange={(e) => setRoleForm({ ...roleForm, department: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Salary (₹) *</label>
                  <input
                    type="number"
                    value={roleForm.salary}
                    onChange={(e) => setRoleForm({ ...roleForm, salary: e.target.value })}
                    placeholder="Enter salary"
                    style={styles.input}
                    min="1000"
                  />
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowRoleModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleApprovePending}
                style={styles.submitBtn}
              >
                <Check size={18} />
                Approve User
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  headerSub: {
    color: "#64748b",
    fontSize: "14px",
    margin: "4px 0 0 0",
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
  },
  tabs: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  },
  tab: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  tableBox: {
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#64748b",
  },
  empty: {
    textAlign: "center",
    padding: "60px",
    color: "#64748b",
    fontSize: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  thead: {
    background: "#f8fafc",
  },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "14px 16px",
    fontSize: "14px",
    color: "#1e293b",
  },
  empName: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px",
  },
  deptBadge: {
    background: "#ede9fe",
    color: "#4f46e5",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  editBtn: {
    padding: "8px",
    background: "#dbeafe",
    color: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  deleteBtn: {
    padding: "8px",
    background: "#fee2e2",
    color: "#ef4444",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  approveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "#dcfce7",
    color: "#16a34a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  rejectBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "#fee2e2",
    color: "#ef4444",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    background: "#fff",
    borderRadius: "16px",
    width: "600px",
    maxWidth: "95%",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  closeBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  modalBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  userInfoBox: {
    background: "#f8fafc",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "14px",
    color: "#1e293b",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
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
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
  },
  cancelBtn: {
    padding: "10px 20px",
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default Employees;