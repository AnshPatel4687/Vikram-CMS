// src/pages/admin/Reports.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const Reports = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const fetchReports = async (month) => {
    try {
      setLoading(true);

      // 1. Attendance Data (last 7 days)
      const attSnap = await getDocs(collection(db, "attendance"));
      const attList = attSnap.docs.map((d) => d.data());

      // Group by date
      const dateMap = {};
      attList.forEach((a) => {
        if (!dateMap[a.date]) {
          dateMap[a.date] = { date: a.date, present: 0, absent: 0, late: 0 };
        }
        dateMap[a.date][a.status]++;
      });

      const sortedDates = Object.values(dateMap)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7);
      setAttendanceData(sortedDates);

      // 2. Department wise employees
      const empSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "employee"))
      );
      const empList = empSnap.docs.map((d) => d.data());
      const deptMap = {};
      empList.forEach((e) => {
        deptMap[e.department] = (deptMap[e.department] || 0) + 1;
      });
      const deptData = Object.entries(deptMap).map(([name, value]) => ({
        name,
        value,
      }));
      setDepartmentData(deptData);

      // 3. Payroll Data (last 6 months)
      const paySnap = await getDocs(collection(db, "payroll"));
      const payList = paySnap.docs.map((d) => d.data());
      const payMap = {};
      payList.forEach((p) => {
        if (!payMap[p.month]) {
          payMap[p.month] = { month: p.month, total: 0, count: 0 };
        }
        payMap[p.month].total += p.netSalary || 0;
        payMap[p.month].count++;
      });
      const sortedPay = Object.values(payMap)
        .sort((a, b) => new Date(a.month) - new Date(b.month))
        .slice(-6);
      setPayrollData(sortedPay);

    } catch (error) {
      toast.error("Error fetching reports!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedMonth);
  }, []);

  return (
    <AdminLayout pageTitle="Reports & Analytics">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>Reports & Analytics</h3>
          <p style={styles.headerSub}>Company performance overview</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading reports...</div>
      ) : (
        <>
          {/* Row 1 — Attendance Chart + Department Pie */}
          <div style={styles.row}>
            {/* Attendance Bar Chart */}
            <div style={styles.chartBox}>
              <h4 style={styles.chartTitle}>📅 Attendance (Last 7 Days)</h4>
              {attendanceData.length === 0 ? (
                <div style={styles.noData}>No attendance data yet!</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#10b981" name="Present" radius={[4,4,0,0]} />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4,4,0,0]} />
                    <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Department Pie Chart */}
            <div style={styles.chartBox}>
              <h4 style={styles.chartTitle}>🏢 Employees by Department</h4>
              {departmentData.length === 0 ? (
                <div style={styles.noData}>No employee data yet!</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </div>

          {/* Row 2 — Payroll Line Chart */}
          <div style={styles.chartBoxFull}>
            <h4 style={styles.chartTitle}>💰 Monthly Payroll (Last 6 Months)</h4>
            {payrollData.length === 0 ? (
              <div style={styles.noData}>No payroll data yet!</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={payrollData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Total Payroll"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ fill: "#4f46e5", r: 6 }}
                    name="Total Payroll"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
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
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#64748b",
    fontSize: "16px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },
  chartBox: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  chartBoxFull: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 20px 0",
  },
  noData: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8",
    fontSize: "15px",
  },
};

export default Reports;