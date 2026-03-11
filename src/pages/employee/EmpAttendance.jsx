// src/pages/employee/EmpAttendance.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportEmpAttendancePDF, exportEmpAttendanceExcel } from "../../utils/exportUtils";
import toast from "react-hot-toast";

const EmpAttendance = () => {
  const { user, userData } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });

  const fetchAttendance = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "attendance"), where("userId", "==", user.uid))
      );
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setAttendance(list);

      // Stats calculate karo
      const present = list.filter((a) => a.status === "present").length;
      const absent = list.filter((a) => a.status === "absent").length;
      const late = list.filter((a) => a.status === "late").length;
      setStats({ present, absent, late, total: list.length });
    } catch (error) {
      toast.error("Error fetching attendance!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAttendance();
  }, [user]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "present": return { background: "#dcfce7", color: "#16a34a" };
      case "absent": return { background: "#fee2e2", color: "#dc2626" };
      case "late": return { background: "#fef9c3", color: "#d97706" };
      default: return { background: "#f1f5f9", color: "#64748b" };
    }
  };

  // Attendance percentage
  const percentage = stats.total > 0
    ? Math.round((stats.present / stats.total) * 100)
    : 0;

  return (
    <EmpLayout pageTitle="My Attendance">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h3 style={styles.headerTitle}>My Attendance</h3>
          <p style={styles.headerSub}>Your attendance record</p>
        </div>
        <ExportButton
          label="Export"
          onExportPDF={() => exportEmpAttendancePDF(attendance, stats, userData?.name || user?.email)}
          onExportExcel={() => exportEmpAttendanceExcel(attendance, userData?.name || user?.email)}
        />
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #16a34a" }}>
          <p style={styles.statNum}>{stats.present}</p>
          <p style={styles.statLabel}>Present</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #dc2626" }}>
          <p style={styles.statNum}>{stats.absent}</p>
          <p style={styles.statLabel}>Absent</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #d97706" }}>
          <p style={styles.statNum}>{stats.late}</p>
          <p style={styles.statLabel}>Late</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #4f46e5" }}>
          <p style={styles.statNum}>{percentage}%</p>
          <p style={styles.statLabel}>Attendance %</p>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableBox}>
        {loading ? (
          <div style={styles.loading}>Loading attendance...</div>
        ) : attendance.length === 0 ? (
          <div style={styles.empty}>📅 No attendance records found!</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Day</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => (
                <tr key={record.id} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{record.date}</td>
                  <td style={styles.td}>
                    {new Date(record.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                    })}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(record.status),
                    }}>
                      {record.status === "present" && "✅ "}
                      {record.status === "absent" && "❌ "}
                      {record.status === "late" && "⏰ "}
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </EmpLayout>
  );
};

const styles = {
  header: {
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
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
};

export default EmpAttendance;