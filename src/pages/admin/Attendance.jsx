// src/pages/admin/Attendance.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { notifyEmployee } from "../../firebase/notifications";
import AdminLayout from "../../components/admin/AdminLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportAttendancePDF, exportAttendanceExcel } from "../../utils/exportUtils";
import { Save, CalendarCheck } from "lucide-react";
import toast from "react-hot-toast";

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const fetchAttendance = async (date) => {
    try {
      const snap = await getDocs(
        query(collection(db, "attendance"), where("date", "==", date))
      );
      const data = {};
      snap.docs.forEach((d) => {
        const att = d.data();
        data[att.userId] = att.status;
      });
      setAttendanceData(data);
    } catch (error) {
      console.log("Fetch attendance error:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAttendance(selectedDate);
    }
  }, [selectedDate]);

  const handleStatusChange = (empId, status) => {
    setAttendanceData({ ...attendanceData, [empId]: status });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const employee of employees) {
        const status = attendanceData[employee.id];
        if (status) {
          const docId = `${employee.id}_${selectedDate}`;
          await setDoc(doc(db, "attendance", docId), {
            userId: employee.id,
            userName: employee.name,
            department: employee.department,
            date: selectedDate,
            status: status,
          });

          // Employee ko notification bhejo
          await notifyEmployee(
            employee.id,
            "Attendance Marked 📅",
            `Aaj (${selectedDate}) tumhari attendance "${status}" mark hui!`,
            "attendance",
            "/employee/attendance"
          );
        }
      }
      toast.success("Attendance saved! ✅");
    } catch (error) {
      console.log("Save error:", error);
      toast.error("Failed to save attendance!");
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const present = Object.values(attendanceData).filter((s) => s === "present").length;
  const absent = Object.values(attendanceData).filter((s) => s === "absent").length;
  const late = Object.values(attendanceData).filter((s) => s === "late").length;

  const getStatusColor = (status) => {
    switch (status) {
      case "present": return { bg: "#dcfce7", color: "#16a34a" };
      case "absent": return { bg: "#fee2e2", color: "#dc2626" };
      case "late": return { bg: "#fef9c3", color: "#d97706" };
      default: return { bg: "#f1f5f9", color: "#64748b" };
    }
  };

  return (
    <AdminLayout pageTitle="Attendance Management">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>Attendance Management</h3>
          <p style={styles.headerSub}>Mark daily attendance for employees</p>
        </div>
        <div style={styles.headerRight}>
          <ExportButton
            label="Export"
            onExportPDF={() => exportAttendancePDF(employees, attendanceData, selectedDate)}
            onExportExcel={() => exportAttendanceExcel(employees, attendanceData, selectedDate)}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.datePicker}
            max={new Date().toISOString().split("T")[0]}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #16a34a" }}>
          <p style={styles.statNum}>{present}</p>
          <p style={styles.statLabel}>Present</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #dc2626" }}>
          <p style={styles.statNum}>{absent}</p>
          <p style={styles.statLabel}>Absent</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #d97706" }}>
          <p style={styles.statNum}>{late}</p>
          <p style={styles.statLabel}>Late</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #4f46e5" }}>
          <p style={styles.statNum}>{employees.length}</p>
          <p style={styles.statLabel}>Total</p>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableBox}>
        {loading ? (
          <div style={styles.loading}>Loading employees...</div>
        ) : employees.length === 0 ? (
          <div style={styles.empty}>No employees found!</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Mark Attendance</th>
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
                      <div>
                        <p style={styles.empNameText}>{emp.name}</p>
                        <p style={styles.empEmail}>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.deptBadge}>{emp.department}</span>
                  </td>
                  <td style={styles.td}>
                    {attendanceData[emp.id] ? (
                      <span style={{
                        ...styles.statusBadge,
                        background: getStatusColor(attendanceData[emp.id]).bg,
                        color: getStatusColor(attendanceData[emp.id]).color,
                      }}>
                        {attendanceData[emp.id]}
                      </span>
                    ) : (
                      <span style={styles.notMarked}>Not Marked</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.btnGroup}>
                      <button
                        onClick={() => handleStatusChange(emp.id, "present")}
                        style={{
                          ...styles.attBtn,
                          background: attendanceData[emp.id] === "present" ? "#16a34a" : "#dcfce7",
                          color: attendanceData[emp.id] === "present" ? "#fff" : "#16a34a",
                        }}
                      >
                        ✅ Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(emp.id, "absent")}
                        style={{
                          ...styles.attBtn,
                          background: attendanceData[emp.id] === "absent" ? "#dc2626" : "#fee2e2",
                          color: attendanceData[emp.id] === "absent" ? "#fff" : "#dc2626",
                        }}
                      >
                        ❌ Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(emp.id, "late")}
                        style={{
                          ...styles.attBtn,
                          background: attendanceData[emp.id] === "late" ? "#d97706" : "#fef9c3",
                          color: attendanceData[emp.id] === "late" ? "#fff" : "#d97706",
                        }}
                      >
                        ⏰ Late
                      </button>
                    </div>
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
  headerRight: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  datePicker: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
  },
  saveBtn: {
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
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "16px",
    flexShrink: 0,
  },
  empNameText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  empEmail: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
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
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  notMarked: {
    color: "#94a3b8",
    fontSize: "13px",
    fontStyle: "italic",
  },
  btnGroup: {
    display: "flex",
    gap: "8px",
  },
  attBtn: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
};

export default Attendance;