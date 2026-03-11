// src/pages/employee/EmpSalary.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import toast from "react-hot-toast";

const EmpSalary = () => {
  const { user, userData } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayrolls = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "payroll"), where("userId", "==", user.uid))
      );
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.month) - new Date(a.month));
      setPayrolls(list);
    } catch (error) {
      toast.error("Error fetching salary!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPayrolls();
  }, [user]);

  // Stats
  const totalEarned = payrolls
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalBonus = payrolls.reduce((sum, p) => sum + (p.bonus || 0), 0);
  const totalDeduction = payrolls.reduce((sum, p) => sum + (p.deduction || 0), 0);

  return (
    <EmpLayout pageTitle="My Salary">
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>My Salary</h3>
        <p style={styles.headerSub}>Your salary history</p>
      </div>

      {/* Basic Salary Card */}
      <div style={styles.salaryBanner}>
        <div>
          <p style={styles.bannerLabel}>Basic Monthly Salary</p>
          <h2 style={styles.bannerValue}>
            ₹{userData?.salary?.toLocaleString() || "0"}
          </h2>
        </div>
        <div style={styles.bannerRight}>
          <p style={styles.bannerLabel}>Department</p>
          <p style={styles.bannerDept}>{userData?.department || "---"}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #4f46e5" }}>
          <p style={styles.statNum}>₹{totalEarned.toLocaleString()}</p>
          <p style={styles.statLabel}>Total Earned</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <p style={styles.statNum}>₹{totalBonus.toLocaleString()}</p>
          <p style={styles.statLabel}>Total Bonus</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
          <p style={styles.statNum}>₹{totalDeduction.toLocaleString()}</p>
          <p style={styles.statLabel}>Total Deduction</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <p style={styles.statNum}>{payrolls.length}</p>
          <p style={styles.statLabel}>Total Months</p>
        </div>
      </div>

      {/* Salary Table */}
      <div style={styles.tableBox}>
        {loading ? (
          <div style={styles.loading}>Loading salary history...</div>
        ) : payrolls.length === 0 ? (
          <div style={styles.empty}>💰 No salary records found yet!</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Basic Salary</th>
                <th style={styles.th}>Bonus</th>
                <th style={styles.th}>Deduction</th>
                <th style={styles.th}>Net Salary</th>
                <th style={styles.th}>Note</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((pay, index) => (
                <tr key={pay.id} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{pay.month}</td>
                  <td style={styles.td}>₹{pay.basicSalary?.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={styles.bonusText}>
                      +₹{pay.bonus?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.deductText}>
                      -₹{pay.deduction?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <strong>₹{pay.netSalary?.toLocaleString()}</strong>
                  </td>
                  <td style={styles.td}>
                    {pay.note || "—"}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: pay.status === "paid" ? "#dcfce7" : "#fef9c3",
                      color: pay.status === "paid" ? "#16a34a" : "#d97706",
                    }}>
                      {pay.status === "paid" ? "✅ Paid" : "⏳ Pending"}
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
  salaryBanner: {
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    borderRadius: "16px",
    padding: "28px 30px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  bannerLabel: {
    opacity: 0.85,
    fontSize: "14px",
    margin: "0 0 8px 0",
  },
  bannerValue: {
    fontSize: "36px",
    fontWeight: "bold",
    margin: 0,
  },
  bannerRight: {
    textAlign: "right",
  },
  bannerDept: {
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
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
    fontSize: "22px",
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
  bonusText: {
    color: "#16a34a",
    fontWeight: "600",
  },
  deductText: {
    color: "#dc2626",
    fontWeight: "600",
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },
};

export default EmpSalary;