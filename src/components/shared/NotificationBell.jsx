// src/components/shared/NotificationBell.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Index enable hone ke baad orderBy wapas add karo
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setNotifications(list);
      },
      (error) => {
        console.log("Notification error:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  const handleNotifClick = async (notif) => {
    await markAsRead(notif.id);
    setShowDropdown(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case "leave": return "📋";
      case "attendance": return "✅";
      case "payroll": return "💰";
      case "signup": return "👤";
      case "project": return "📁";
      case "login": return "🔐";
      case "leave_approved": return "✅";
      case "leave_rejected": return "❌";
      case "payroll_generated": return "💵";
      default: return "🔔";
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        style={styles.bellBtn}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell size={20} color="#64748b" />
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <h4 style={styles.dropTitle}>🔔 Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={styles.markAllBtn}>
                Mark all read
              </button>
            )}
          </div>

          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>
                <p>🎉 No notifications!</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    ...styles.notifItem,
                    background: notif.read ? "#fff" : "#f0f4ff",
                    borderLeft: notif.read
                      ? "3px solid transparent"
                      : "3px solid #4f46e5",
                    cursor: notif.link ? "pointer" : "default",
                  }}
                >
                  <span style={styles.notifIcon}>{getIcon(notif.type)}</span>
                  <div style={styles.notifContent}>
                    <p style={styles.notifTitle}>{notif.title}</p>
                    <p style={styles.notifMsg}>{notif.message}</p>
                    <p style={styles.notifTime}>{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && <div style={styles.unreadDot} />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={styles.dropFooter}>
              <button onClick={markAllRead} style={styles.clearBtn}>
                Mark All Read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { position: "relative" },
  bellBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "10px",
    padding: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    top: "50px",
    right: 0,
    width: "360px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 1000,
    overflow: "hidden",
  },
  dropHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
  },
  dropTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  markAllBtn: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  list: { maxHeight: "400px", overflowY: "auto" },
  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8",
    fontSize: "14px",
  },
  notifItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 20px",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s",
  },
  notifIcon: { fontSize: "20px", flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 2px 0",
  },
  notifMsg: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 4px 0",
  },
  notifTime: { fontSize: "11px", color: "#94a3b8", margin: 0 },
  unreadDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#4f46e5",
    flexShrink: 0,
    marginTop: "4px",
  },
  dropFooter: {
    padding: "12px 20px",
    borderTop: "1px solid #e2e8f0",
    textAlign: "center",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default NotificationBell;