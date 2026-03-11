// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import { Users, FolderKanban, CalendarCheck, Clock, CalendarOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalProjects: 0,
    presentToday: 0,
    pendingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const empSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "employee"))
        );
        const projSnap = await getDocs(collection(db, "projects"));
        const today = new Date().toISOString().split("T")[0];
        const attSnap = await getDocs(
          query(
            collection(db, "attendance"),
            where("date", "==", today),
            where("status", "==", "present")
          )
        );
        const leaveSnap = await getDocs(
          query(collection(db, "leaves"), where("status", "==", "pending"))
        );

        setStats({
          totalEmployees: empSnap.size,
          totalProjects: projSnap.size,
          presentToday: attSnap.size,
          pendingLeaves: leaveSnap.size,
        });
      } catch (error) {
        console.log("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: <Users size={28} color="#fff" />,
      bg: "linear-gradient(135deg, #4f46e5, #818cf8)",
      shadow: "rgba(79,70,229,0.3)",
      path: "/admin/employees",
    },
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: <FolderKanban size={28} color="#fff" />,
      bg: "linear-gradient(135deg, #06b6d4, #67e8f9)",
      shadow: "rgba(6,182,212,0.3)",
      path: "/admin/projects",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: <CalendarCheck size={28} color="#fff" />,
      bg: "linear-gradient(135deg, #10b981, #6ee7b7)",
      shadow: "rgba(16,185,129,0.3)",
      path: "/admin/attendance",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      icon: <CalendarOff size={28} color="#fff" />,
      bg: "linear-gradient(135deg, #f59e0b, #fcd34d)",
      shadow: "rgba(245,158,11,0.3)",
      path: "/admin/leaves",
    },
  ];

  return (
    <AdminLayout pageTitle="Dashboard">
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <h2 style={styles.bannerTitle}>Welcome Back, Admin! 👋</h2>
          <p style={styles.bannerSub}>
            Here's what's happening in your company today.
          </p>
        </div>
        <div style={styles.bannerDate}>
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div style={styles.loading}>Loading stats...</div>
      ) : (
        <div style={styles.cardsGrid}>
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              style={{
                ...styles.card,
                boxShadow: `0 10px 30px ${card.shadow}`,
                cursor: "pointer",
              }}
            >
              <div style={styles.cardLeft}>
                <p style={styles.cardTitle}>{card.title}</p>
                <h2 style={styles.cardValue}>{card.value}</h2>
              </div>
              <div style={{ ...styles.cardIcon, background: card.bg }}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          {[
            { label: "Add Employee", emoji: "👤", path: "/admin/employees" },
            { label: "New Project", emoji: "📁", path: "/admin/projects" },
            { label: "Mark Attendance", emoji: "✅", path: "/admin/attendance" },
            { label: "Run Payroll", emoji: "💰", path: "/admin/payroll" },
            { label: "Leave Requests", emoji: "📋", path: "/admin/leaves" },
            { label: "View Reports", emoji: "📊", path: "/admin/reports" },
          ].map((action, i) => (
            <div
              key={i}
              onClick={() => navigate(action.path)}
              style={styles.actionBtn}
            >
              <span style={styles.actionEmoji}>{action.emoji}</span>
              <span style={styles.actionLabel}>{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

const styles = {
  banner: {
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    borderRadius: "16px",
    padding: "30px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  bannerTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
  },
  bannerSub: {
    opacity: 0.85,
    margin: 0,
    fontSize: "15px",
  },
  bannerDate: {
    opacity: 0.85,
    fontSize: "14px",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#64748b",
    fontSize: "16px",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "30px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "transform 0.2s",
  },
  cardLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  cardTitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  cardIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "30px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 20px 0",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "16px",
  },
  actionBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px",
    cursor: "pointer",
    border: "2px solid #e2e8f0",
    transition: "all 0.2s",
  },
  actionEmoji: {
    fontSize: "28px",
  },
  actionLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
};

export default AdminDashboard;