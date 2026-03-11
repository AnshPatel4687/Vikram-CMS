// src/pages/employee/EmpDashboard.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import { FolderKanban, CalendarCheck, DollarSign, CalendarOff } from "lucide-react";

const EmpDashboard = () => {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    presentDays: 0,
    salary: 0,
    pendingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // My Projects
        const projSnap = await getDocs(
          query(
            collection(db, "projects"),
            where("assignedTo", "array-contains", user.uid)
          )
        );

        // My Attendance This Month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const attSnap = await getDocs(
          query(
            collection(db, "attendance"),
            where("userId", "==", user.uid),
            where("status", "==", "present")
          )
        );

        // My Pending Leaves
        const leaveSnap = await getDocs(
          query(
            collection(db, "leaves"),
            where("userId", "==", user.uid),
            where("status", "==", "pending")
          )
        );

        setStats({
          totalProjects: projSnap.size,
          presentDays: attSnap.size,
          salary: userData?.salary || 0,
          pendingLeaves: leaveSnap.size,
        });
      } catch (error) {
        console.log("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStats();
  }, [user, userData]);

  const cards = [
    {
      title: "My Projects",
      value: stats.totalProjects,
      icon: <FolderKanban size={28} color="#fff" />,
      bg: "linear-gradient(135deg, #4f46e5, #818cf8)",
      shadow: "rgba(79,70,229,0.3)",
    },
    {
      title: "Days Present",
      value: stats.presentDays,
      icon: <CalendarCheck size={28} color="#fff" />,
      bg: "linear-gradient(135deg, #10b981, #6ee7b7)",
      shadow: "rgba(16,185,129,0.3)",
    },
    {
      title: "My Salary",
      value: `₹${stats.salary.toLocaleString()}`,
      icon: <DollarSign size={28} color="#fff" />,
      bg: "linear-gradient(135deg, #06b6d4, #67e8f9)",
      shadow: "rgba(6,182,212,0.3)",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      icon: <CalendarOff size={28} color="#fff" />,
      bg: "linear-gradient(135deg, #f59e0b, #fcd34d)",
      shadow: "rgba(245,158,11,0.3)",
    },
  ];

  return (
    <EmpLayout pageTitle="My Dashboard">
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <h2 style={styles.bannerTitle}>
            Welcome, {userData?.name || "Employee"}! 👋
          </h2>
          <p style={styles.bannerSub}>
            {userData?.department} Department •{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div style={styles.badgeBox}>
          <span style={styles.badge}>🟢 Active Employee</span>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div style={styles.loading}>Loading your data...</div>
      ) : (
        <div style={styles.cardsGrid}>
          {cards.map((card, index) => (
            <div
              key={index}
              style={{
                ...styles.card,
                boxShadow: `0 10px 30px ${card.shadow}`,
              }}
            >
              <div style={styles.cardLeft}>
                <p style={styles.cardTitle}>{card.title}</p>
                <h2 style={styles.cardValue}>{card.value}</h2>
              </div>
              <div
                style={{
                  ...styles.cardIcon,
                  background: card.bg,
                }}
              >
                {card.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Info */}
      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>My Information</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <p style={styles.infoLabel}>Full Name</p>
            <p style={styles.infoValue}>{userData?.name || "---"}</p>
          </div>
          <div style={styles.infoItem}>
            <p style={styles.infoLabel}>Email</p>
            <p style={styles.infoValue}>{userData?.email || "---"}</p>
          </div>
          <div style={styles.infoItem}>
            <p style={styles.infoLabel}>Department</p>
            <p style={styles.infoValue}>{userData?.department || "---"}</p>
          </div>
          <div style={styles.infoItem}>
            <p style={styles.infoLabel}>Phone</p>
            <p style={styles.infoValue}>{userData?.phone || "---"}</p>
          </div>
          <div style={styles.infoItem}>
            <p style={styles.infoLabel}>Join Date</p>
            <p style={styles.infoValue}>{userData?.joinDate || "---"}</p>
          </div>
          <div style={styles.infoItem}>
            <p style={styles.infoLabel}>Salary</p>
            <p style={styles.infoValue}>₹{userData?.salary?.toLocaleString() || "---"}</p>
          </div>
        </div>
      </div>
    </EmpLayout>
  );
};

const styles = {
  banner: {
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
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
  badgeBox: {
    display: "flex",
    alignItems: "center",
  },
  badge: {
    background: "rgba(255,255,255,0.2)",
    padding: "10px 20px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
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
    fontSize: "28px",
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
  infoBox: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
  },
  infoTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 20px 0",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  infoItem: {
    background: "#f8fafc",
    borderRadius: "10px",
    padding: "16px",
  },
  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 6px 0",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: "15px",
    color: "#1e293b",
    margin: 0,
    fontWeight: "600",
  },
};

export default EmpDashboard;