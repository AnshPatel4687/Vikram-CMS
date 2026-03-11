// src/pages/employee/EmpProjects.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import EmpLayout from "../../components/employee/EmpLayout";
import toast from "react-hot-toast";

const EmpProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "projects"),
          where("assignedTo", "array-contains", user.uid)
        )
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProjects(list);
    } catch (error) {
      toast.error("Error fetching projects!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "active": return { background: "#dcfce7", color: "#16a34a" };
      case "completed": return { background: "#dbeafe", color: "#2563eb" };
      case "on-hold": return { background: "#fef9c3", color: "#ca8a04" };
      default: return { background: "#f1f5f9", color: "#64748b" };
    }
  };

  return (
    <EmpLayout pageTitle="My Projects">
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>My Projects</h3>
        <p style={styles.headerSub}>Total: {projects.length} projects assigned</p>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div style={styles.empty}>
          <p>🗂️ No projects assigned yet!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map((proj) => (
            <div key={proj.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h4 style={styles.projName}>{proj.name}</h4>
                <span style={{ ...styles.statusBadge, ...getStatusStyle(proj.status) }}>
                  {proj.status}
                </span>
              </div>
              <p style={styles.desc}>{proj.description}</p>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>📅 Deadline:</span>
                <span style={styles.infoValue}>{proj.deadline}</span>
              </div>
            </div>
          ))}
        </div>
      )}
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
    background: "#fff",
    borderRadius: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  projName: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
    flex: 1,
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
    marginLeft: "8px",
  },
  desc: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 12px 0",
    lineHeight: "1.5",
  },
  infoRow: {
    display: "flex",
    gap: "8px",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  infoValue: {
    fontSize: "13px",
    color: "#1e293b",
    fontWeight: "600",
  },
};

export default EmpProjects;