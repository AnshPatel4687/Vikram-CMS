// src/pages/employee/LeaveRequest.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { sendNotification } from "../../firebase/notifications";
import EmpLayout from "../../components/employee/EmpLayout";
import { Plus, X, Check } from "lucide-react";
import toast from "react-hot-toast";

const LeaveRequest = () => {
  const { user, userData } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "",
    from: "",
    to: "",
    reason: "",
  });

  const fetchLeaves = async () => {
    try {
      const q = query(
        collection(db, "leaves"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLeaves(list);
    } catch (error) {
      console.log("Fetch error:", error);
      toast.error("Error fetching leaves!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const calculateDays = () => {
    if (!leaveForm.from || !leaveForm.to) return 0;
    const from = new Date(leaveForm.from);
    const to = new Date(leaveForm.to);
    const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const validateForm = () => {
    if (!leaveForm.type) {
      toast.error("Please select leave type!"); return false;
    }
    if (!leaveForm.from) {
      toast.error("Please select from date!"); return false;
    }
    if (!leaveForm.to) {
      toast.error("Please select to date!"); return false;
    }
    if (new Date(leaveForm.from) > new Date(leaveForm.to)) {
      toast.error("From date cannot be after to date!"); return false;
    }
    if (!leaveForm.reason.trim()) {
      toast.error("Please enter reason!"); return false;
    }
    if (leaveForm.reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters!"); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const days = calculateDays();

      // Leave Firestore me save karo
      await addDoc(collection(db, "leaves"), {
        userId: user.uid,
        userName: userData?.name,
        department: userData?.department,
        type: leaveForm.type,
        from: leaveForm.from,
        to: leaveForm.to,
        days,
        reason: leaveForm.reason.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      console.log("Leave saved! Ab admin dhundh raha hoon...");

      // Admin ka UID dhundo
      const adminSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );

      console.log("Admin found:", adminSnap.size);

      if (!adminSnap.empty) {
        const adminId = adminSnap.docs[0].id;
        console.log("Admin ID:", adminId);

        // Notification directly Firestore me add karo
        await addDoc(collection(db, "notifications"), {
          userId: adminId,
          title: "New Leave Request 📋",
          message: `${userData?.name} ne ${leaveForm.type} leave apply ki hai (${days} days)`,
          type: "leave",
          read: false,
          createdAt: new Date().toISOString(),
        });

        console.log("Notification sent! ✅");
      } else {
        console.log("Admin nahi mila!");
      }

      toast.success("Leave request submitted! ✅");
      setShowModal(false);
      setLeaveForm({ type: "", from: "", to: "", reason: "" });
      fetchLeaves();
    } catch (error) {
      console.log("Submit error:", error);
      toast.error("Failed to submit leave!");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved": return { background: "#dcfce7", color: "#16a34a" };
      case "rejected": return { background: "#fee2e2", color: "#dc2626" };
      default: return { background: "#fef9c3", color: "#d97706" };
    }
  };

  const pending = leaves.filter((l) => l.status === "pending").length;
  const approved = leaves.filter((l) => l.status === "approved").length;
  const rejected = leaves.filter((l) => l.status === "rejected").length;

  return (
    <EmpLayout pageTitle="Leave Request">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>My Leave Requests</h3>
          <p style={styles.headerSub}>Apply and track your leave requests</p>
        </div>
        <button onClick={() => setShowModal(true)} style={styles.addBtn}>
          <Plus size={18} />
          Apply Leave
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <p style={styles.statNum}>{pending}</p>
          <p style={styles.statLabel}>Pending</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #16a34a" }}>
          <p style={styles.statNum}>{approved}</p>
          <p style={styles.statLabel}>Approved</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #dc2626" }}>
          <p style={styles.statNum}>{rejected}</p>
          <p style={styles.statLabel}>Rejected</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #4f46e5" }}>
          <p style={styles.statNum}>{leaves.length}</p>
          <p style={styles.statLabel}>Total</p>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableBox}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : leaves.length === 0 ? (
          <div style={styles.empty}>No leave requests yet. Apply your first leave!</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Days</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave, index) => (
                <tr key={leave.id} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{leave.type}</span>
                  </td>
                  <td style={styles.td}>{leave.from}</td>
                  <td style={styles.td}>{leave.to}</td>
                  <td style={styles.td}>{leave.days} day(s)</td>
                  <td style={styles.td}>{leave.reason}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(leave.status),
                    }}>
                      {leave.status === "approved" && "✅ "}
                      {leave.status === "rejected" && "❌ "}
                      {leave.status === "pending" && "⏳ "}
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Apply Leave</h3>
              <button
                onClick={() => setShowModal(false)}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Leave Type *</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select Leave Type</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Maternity Leave">Maternity Leave</option>
                  <option value="Paternity Leave">Paternity Leave</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>From Date *</label>
                  <input
                    type="date"
                    value={leaveForm.from}
                    onChange={(e) => setLeaveForm({ ...leaveForm, from: e.target.value })}
                    style={styles.input}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>To Date *</label>
                  <input
                    type="date"
                    value={leaveForm.to}
                    onChange={(e) => setLeaveForm({ ...leaveForm, to: e.target.value })}
                    style={styles.input}
                    min={leaveForm.from || new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Days Preview */}
              {leaveForm.from && leaveForm.to && (
                <div style={styles.daysPreview}>
                  📅 Total Days: <strong>{calculateDays()} day(s)</strong>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Reason *</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Enter reason (min 10 characters)"
                  style={{ ...styles.input, height: "100px", resize: "vertical" }}
                />
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
                onClick={handleSubmit}
                disabled={submitting}
                style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
              >
                <Check size={18} />
                {submitting ? "Submitting..." : "Submit Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </EmpLayout>
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
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
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
    fontSize: "28px",
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
  typeBadge: {
    background: "#e0f2fe",
    color: "#0891b2",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "capitalize",
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
  daysPreview: {
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#0891b2",
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
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default LeaveRequest;