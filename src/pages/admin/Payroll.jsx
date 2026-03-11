// src/pages/admin/Payroll.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import { DollarSign, Check, X } from "lucide-react";
import toast from "react-hot-toast";

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [formData, setFormData] = useState({
    bonus: "",
    deduction: "",
    note: "",
  });
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Employees fetch
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

  // Payroll fetch
  const fetchPayrolls = async (month) => {
    try {
      setLoading(true);
      const snap = await getDocs(
        query(collection(db, "payroll"), where("month", "==", month))
      );
      const data = {};
      snap.docs.forEach((d) => {
        data[d.data().userId] = { id: d.id, ...d.data() };
      });
      setPayrolls(data);
    } catch (error) {
      toast.error("Error fetching payroll!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls(selectedMonth);
  }, []);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    fetchPayrolls(e.target.value);
  };

  // Open modal
  const handleOpenModal = (emp) => {
    setSelectedEmp(emp);
    const existing = payrolls[emp.id];
    setFormData({
      bonus: existing?.bonus || "",
      deduction: existing?.deduction || "",
      note: existing?.note || "",
    });
    setShowModal(true);
  };

  // Validation
  const validateForm = () => {
    if (formData.bonus && Number(formData.bonus) < 0) {
      toast.error("Bonus cannot be negative!"); return false;
    }
    if (formData.deduction && Number(formData.deduction) < 0) {
      toast.error("Deduction cannot be negative!"); return false;
    }
    if (formData.deduction && Number(formData.deduction) > selectedEmp.salary) {
      toast.error("Deduction cannot be more than salary!"); return false;
    }
    return true;
  };

  // Save Payroll
  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const docId = `${selectedEmp.id}_${selectedMonth}`;
      const bonus = Number(formData.bonus) || 0;
      const deduction = Number(formData.deduction) || 0;
      const netSalary = selectedEmp.salary + bonus - deduction;

      await setDoc(doc(db, "payroll", docId), {
        userId: selectedEmp.id,
        userName: selectedEmp.name,
        department: selectedEmp.department,
        month: selectedMonth,
        basicSalary: selectedEmp.salary,
        bonus,
        deduction,
        netSalary,
        note: formData.note || "",
        status: "pending",
      });

      toast.success("Payroll saved! ✅");
      setShowModal(false);
      fetchPayrolls(selectedMonth);
    } catch (error) {
      toast.error("Failed to save payroll!");
    } finally {
      setSaving(false);
    }
  };

  // Mark as Paid
  const handleMarkPaid = async (empId) => {
    const payroll = payrolls[empId];
    if (!payroll) {
      toast.error("Please generate payroll first!");
      return;
    }
    try {
      await updateDoc(doc(db, "payroll", payroll.id), {
        status: "paid",
      });
      toast.success("Marked as paid! ✅");
      fetchPayrolls(selectedMonth);
    } catch (error) {
      toast.error("Failed to update status!");
    }
  };

  // Stats
  const totalPaid = Object.values(payrolls).filter((p) => p.status === "paid").length;
  const totalPending = Object.values(payrolls).filter((p) => p.status === "pending").length;
  const totalAmount = Object.values(payrolls).reduce((sum, p) => sum + (p.netSalary || 0), 0);

  return (
    <AdminLayout pageTitle="Payroll Management">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>Payroll Management</h3>
          <p style={styles.headerSub}>Manage employee salaries</p>
        </div>
        <div style={styles.monthBox}>
          <label style={styles.monthLabel}>Select Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            style={styles.monthInput}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #16a34a" }}>
          <p style={styles.statNum}>{totalPaid}</p>
          <p style={styles.statLabel}>Paid</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <p style={styles.statNum}>{totalPending}</p>
          <p style={styles.statLabel}>Pending</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #4f46e5" }}>
          <p style={styles.statNum}>{employees.length}</p>
          <p style={styles.statLabel}>Total Employees</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #06b6d4" }}>
          <p style={styles.statNum}>₹{totalAmount.toLocaleString()}</p>
          <p style={styles.statLabel}>Total Amount</p>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableBox}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : employees.length === 0 ? (
          <div style={styles.empty}>No employees found!</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Basic Salary</th>
                <th style={styles.th}>Bonus</th>
                <th style={styles.th}>Deduction</th>
                <th style={styles.th}>Net Salary</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => {
                const payroll = payrolls[emp.id];
                return (
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
                    <td style={styles.td}>
                      <span style={styles.deptBadge}>{emp.department}</span>
                    </td>
                    <td style={styles.td}>₹{emp.salary?.toLocaleString()}</td>
                    <td style={styles.td}>
                      {payroll ? `₹${payroll.bonus?.toLocaleString()}` : "—"}
                    </td>
                    <td style={styles.td}>
                      {payroll ? `₹${payroll.deduction?.toLocaleString()}` : "—"}
                    </td>
                    <td style={styles.td}>
                      <strong>
                        {payroll ? `₹${payroll.netSalary?.toLocaleString()}` : "—"}
                      </strong>
                    </td>
                    <td style={styles.td}>
                      {payroll ? (
                        <span style={{
                          ...styles.statusBadge,
                          background: payroll.status === "paid" ? "#dcfce7" : "#fef9c3",
                          color: payroll.status === "paid" ? "#16a34a" : "#d97706",
                        }}>
                          {payroll.status}
                        </span>
                      ) : (
                        <span style={styles.notGenerated}>Not Generated</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          onClick={() => handleOpenModal(emp)}
                          style={styles.editBtn}
                        >
                          <DollarSign size={15} />
                          {payroll ? "Edit" : "Generate"}
                        </button>
                        {payroll && payroll.status === "pending" && (
                          <button
                            onClick={() => handleMarkPaid(emp.id)}
                            style={styles.paidBtn}
                          >
                            <Check size={15} />
                            Pay
                          </button>
                        )}
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
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                Payroll — {selectedEmp.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Basic Info */}
              <div style={styles.infoBox}>
                <div style={styles.infoItem}>
                  <p style={styles.infoLabel}>Basic Salary</p>
                  <p style={styles.infoValue}>₹{selectedEmp.salary?.toLocaleString()}</p>
                </div>
                <div style={styles.infoItem}>
                  <p style={styles.infoLabel}>Department</p>
                  <p style={styles.infoValue}>{selectedEmp.department}</p>
                </div>
                <div style={styles.infoItem}>
                  <p style={styles.infoLabel}>Month</p>
                  <p style={styles.infoValue}>{selectedMonth}</p>
                </div>
              </div>

              {/* Form */}
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bonus (₹)</label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    placeholder="Enter bonus amount"
                    style={styles.input}
                    min="0"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Deduction (₹)</label>
                  <input
                    type="number"
                    value={formData.deduction}
                    onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
                    placeholder="Enter deduction amount"
                    style={styles.input}
                    min="0"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Note (Optional)</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add a note"
                  style={styles.input}
                />
              </div>

              {/* Net Salary Preview */}
              <div style={styles.netBox}>
                <p style={styles.netLabel}>Net Salary Preview:</p>
                <p style={styles.netValue}>
                  ₹{(
                    selectedEmp.salary +
                    (Number(formData.bonus) || 0) -
                    (Number(formData.deduction) || 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...styles.submitBtn, opacity: saving ? 0.7 : 1 }}
              >
                <Check size={18} />
                {saving ? "Saving..." : "Save Payroll"}
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
  monthBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  monthLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  monthInput: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px 20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  statNum: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0 0 0",
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
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  notGenerated: {
    color: "#94a3b8",
    fontSize: "13px",
    fontStyle: "italic",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  editBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "#dbeafe",
    color: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  paidBtn: {
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
    width: "500px",
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
  infoBox: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    background: "#f8fafc",
    borderRadius: "10px",
    padding: "16px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
  infoValue: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
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
  netBox: {
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: "14px",
    margin: 0,
    fontWeight: "600",
  },
  netValue: {
    color: "#fff",
    fontSize: "24px",
    fontWeight: "bold",
    margin: 0,
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

export default Payroll;