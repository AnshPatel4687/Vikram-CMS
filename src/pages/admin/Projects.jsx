// src/pages/admin/Projects.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { notifyEmployee } from "../../firebase/notifications";
import AdminLayout from "../../components/admin/AdminLayout";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    deadline: "",
    assignedTo: [],
  });

  const fetchProjects = async () => {
    try {
      const snap = await getDocs(collection(db, "projects"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProjects(list);
    } catch (error) {
      toast.error("Error fetching projects!");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("role", "==", "employee"))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEmployees(list);
    } catch (error) {
      toast.error("Error fetching employees!");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      deadline: "",
      assignedTo: [],
    });
    setEditMode(false);
    setEditId(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleEmployee = (empId) => {
    if (formData.assignedTo.includes(empId)) {
      setFormData({
        ...formData,
        assignedTo: formData.assignedTo.filter((id) => id !== empId),
      });
    } else {
      setFormData({
        ...formData,
        assignedTo: [...formData.assignedTo, empId],
      });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Project name is required!"); return false;
    }
    if (formData.name.trim().length < 3) {
      toast.error("Project name must be at least 3 characters!"); return false;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required!"); return false;
    }
    if (!formData.deadline) {
      toast.error("Deadline is required!"); return false;
    }
    if (formData.assignedTo.length === 0) {
      toast.error("Please assign at least one employee!"); return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        deadline: formData.deadline,
        assignedTo: formData.assignedTo,
        createdAt: new Date().toISOString(),
      });

      // Assigned employees ko notification bhejo
      for (const empId of formData.assignedTo) {
        await notifyEmployee(
          empId,
          "New Project Assigned 📁",
          `Tumhe "${formData.name.trim()}" project assign kiya gaya hai!`,
          "project",
          "/employee/projects"
        );
      }

      toast.success("Project added! ✅");
      setShowModal(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      toast.error("Failed to add project!");
    }
  };

  const handleEdit = (project) => {
    setEditMode(true);
    setEditId(project.id);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      deadline: project.deadline,
      assignedTo: project.assignedTo || [],
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      await updateDoc(doc(db, "projects", editId), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        deadline: formData.deadline,
        assignedTo: formData.assignedTo,
      });

      // Assigned employees ko notification bhejo
      for (const empId of formData.assignedTo) {
        await notifyEmployee(
          empId,
          "Project Updated 📁",
          `"${formData.name.trim()}" project update hua hai. Check karo!`,
          "project",
          "/employee/projects"
        );
      }

      toast.success("Project updated! ✅");
      setShowModal(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      toast.error("Failed to update project!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast.success("Project deleted!");
      fetchProjects();
    } catch (error) {
      toast.error("Failed to delete project!");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "active": return { background: "#dcfce7", color: "#16a34a" };
      case "completed": return { background: "#dbeafe", color: "#2563eb" };
      case "on-hold": return { background: "#fef9c3", color: "#d97706" };
      default: return { background: "#f1f5f9", color: "#64748b" };
    }
  };

  const getEmpNames = (assignedTo) => {
    if (!assignedTo || assignedTo.length === 0) return "None";
    return assignedTo
      .map((id) => employees.find((e) => e.id === id)?.name || "Unknown")
      .join(", ");
  };

  return (
    <AdminLayout pageTitle="Projects">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>Project Management</h3>
          <p style={styles.headerSub}>Total: {projects.length} projects</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          style={styles.addBtn}
        >
          <Plus size={18} />
          Add Project
        </button>
      </div>

      {/* Projects Table */}
      <div style={styles.tableBox}>
        {loading ? (
          <div style={styles.loading}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div style={styles.empty}>No projects found. Add your first project!</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Project Name</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Deadline</th>
                <th style={styles.th}>Assigned To</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr key={project.id} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <p style={{ fontWeight: "600", margin: 0 }}>{project.name}</p>
                  </td>
                  <td style={styles.td}>{project.description}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(project.status),
                    }}>
                      {project.status}
                    </span>
                  </td>
                  <td style={styles.td}>{project.deadline}</td>
                  <td style={styles.td}>
                    <p style={{ margin: 0, fontSize: "13px" }}>
                      {getEmpNames(project.assignedTo)}
                    </p>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        onClick={() => handleEdit(project)}
                        style={styles.editBtn}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        style={styles.deleteBtn}
                      >
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editMode ? "Edit Project" : "Add New Project"}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Project Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter project description"
                  style={{ ...styles.input, height: "80px", resize: "vertical" }}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Deadline *</label>
                  <input
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Assign Employees */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Assign Employees * ({formData.assignedTo.length} selected)
                </label>
                <div style={styles.empGrid}>
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      style={{
                        ...styles.empChip,
                        background: formData.assignedTo.includes(emp.id)
                          ? "#4f46e5"
                          : "#f1f5f9",
                        color: formData.assignedTo.includes(emp.id)
                          ? "#fff"
                          : "#64748b",
                      }}
                    >
                      {formData.assignedTo.includes(emp.id) && "✓ "}
                      {emp.name}
                    </div>
                  ))}
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
                {editMode ? "Update Project" : "Add Project"}
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
  tableBox: {
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  loading: { textAlign: "center", padding: "40px", color: "#64748b" },
  empty: { textAlign: "center", padding: "60px", color: "#64748b", fontSize: "16px" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f8fafc" },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "14px 16px", fontSize: "14px", color: "#1e293b" },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  actions: { display: "flex", gap: "8px" },
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
  formRow: {
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
  empGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
  },
  empChip: {
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
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

export default Projects;