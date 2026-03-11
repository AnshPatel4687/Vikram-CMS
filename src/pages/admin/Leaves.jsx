// src/pages/admin/Leaves.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { notifyEmployee } from "../../firebase/notifications";
import AdminLayout from "../../components/admin/AdminLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportLeavesPDF, exportLeavesExcel } from "../../utils/exportUtils";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchLeaves = async () => {
    try {
      const snap = await getDocs(collection(db, "leaves"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLeaves(list);
    } catch (error) {
      toast.error("Error fetching leaves!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Approve Leave
  const handleApprove = async (leave) => {
    try {
      await updateDoc(doc(db, "leaves", leave.id), { status: "approved" });

      // Employee ko notification bhejo
      await notifyEmployee(
        leave.userId,
        "Leave Approved! ✅",
        `Tumhari ${leave.type} (${leave.from} to ${leave.to}) approve ho gayi!`,
        "leave_approved",
        "/employee/leave"
      );

      toast.success("Leave approved! ✅");
      fetchLeaves();
    } catch (error) {
      toast.error("Failed to approve!");
    }
  };

  // Reject Leave
  const handleReject = async (leave) => {
    try {
      await updateDoc(doc(db, "leaves", leave.id), { status: "rejected" });

      // Employee ko notification bhejo
      await notifyEmployee(
        leave.userId,
        "Leave Rejected ❌",
        `Tumhari ${leave.type} (${leave.from} to ${leave.to}) reject ho gayi. Admin se contact karo.`,
        "leave_rejected",
        "/employee/leave"
      );

      toast.success("Leave rejected!");
      fetchLeaves();
    } catch (error) {
      toast.error("Failed to reject!");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved": return { background: "#dcfce7", color: "#16a34a" };
      case "rejected": return { background: "#fee2e2", color: "#dc2626" };
      case "pending": return { background: "#fef9c3", color: "#d97706" };
      default: return { background: "#f1f5f9", color: "#64748b" };
    }
  };

  const filteredLeaves = filter === "all"
    ? leaves
    : leaves.filter((l) => l.status === filter);

  const pending = leaves.filter((l) => l.status === "pending").length;
  const approved = leaves.filter((l) => l.status === "approved").length;
  const rejected = leaves.filter((l) => l.status === "rejected").length;

  return (
    <AdminLayout pageTitle="Leave Management">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>Leave Requests</h3>
          <p style={styles.headerSub}>Manage employee leave requests</p>
        </div>
        <ExportButton
          label="Export"
          onExportPDF={() => exportLeavesPDF(filteredLeaves)}
          onExportExcel={() => exportLeavesExcel(filteredLeaves)}
        />
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

      {/* Filter Buttons */}
      <div style={styles.filterRow}>
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              background: filter === f ? "#4f46e5" : "#fff",
              color: filter === f ? "#fff" : "#64748b",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableBox}>
        {loading ? (
          <div style={styles.loading}>Loading leaves...</div>
        ) : filteredLeaves.length === 0 ? (
          <div style={styles.empty}>No leave requests found!</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Days</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((leave, index) => (
                <tr key={leave.id} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.empName}>
                      <div style={styles.avatar}>
                        {leave.userName?.charAt(0).toUpperCase()}
                      </div>
                      {leave.userName}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.deptBadge}>{leave.department}</span>
                  </td>
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
                  <td style={styles.td}>
                    {leave.status === "pending" ? (
                      <div style={styles.actions}>
                        <button
                          onClick={() => handleApprove(leave)}
                          style={styles.approveBtn}
                        >
                          <Check size={15} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(leave)}
                          style={styles.rejectBtn}
                        >
                          <X size={15} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={styles.doneText}>Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
  filterRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  filterBtn: {
    padding: "8px 20px",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
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
  empName: { display: "flex", alignItems: "center", gap: "10px" },
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
  actions: { display: "flex", gap: "8px" },
  approveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
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
    padding: "8px 12px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  doneText: { color: "#94a3b8", fontSize: "13px", fontStyle: "italic" },
};

export default Leaves;