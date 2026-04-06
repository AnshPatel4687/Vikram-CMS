// src/components/shared/NotificationBell.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase/config";
import {
  collection, query, where, onSnapshot, orderBy,
  updateDoc, doc, writeBatch,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  // ── Real-time listener ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q,
      (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.log("Notification listener error:", error)
    );
    return () => unsubscribe();
  }, [user]);

  // ── Outside click close ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Mark one read ───────────────────────────────────────────────────────────
  const markAsRead = async (id) => {
    try { await updateDoc(doc(db, "notifications", id), { read: true }); }
    catch (e) { console.log("markAsRead error:", e); }
  };

  // ── Mark all read ───────────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n =>
        batch.update(doc(db, "notifications", n.id), { read: true })
      );
      await batch.commit();
    } catch (e) { console.log("markAllRead error:", e); }
  };

  // ── Clear all (delete) ──────────────────────────────────────────────────────
  const clearAll = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => batch.delete(doc(db, "notifications", n.id)));
      await batch.commit();
    } catch (e) { console.log("clearAll error:", e); }
  };

  // ── Click on notification ───────────────────────────────────────────────────
  const handleNotifClick = async (notif) => {
    await markAsRead(notif.id);
    setShowDropdown(false);
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    const icons = {
      leave:            "📋",
      leave_approved:   "✅",
      leave_rejected:   "❌",
      attendance:       "📅",
      payroll:          "💰",
      payroll_generated:"💵",
      project:          "📁",
      signup:           "👤",
      general:          "🔔",
    };
    return icons[type] || "🔔";
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Bell Button */}
      <button style={styles.bellBtn} onClick={() => setShowDropdown(!showDropdown)}>
        <Bell size={20} color="#64748b" />
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div style={styles.dropdown}>
          {/* Header */}
          <div style={styles.dropHeader}>
            <h4 style={styles.dropTitle}>
              🔔 Notifications
              {unreadCount > 0 && (
                <span style={styles.unreadPill}>{unreadCount} new</span>
              )}
            </h4>
            <div style={{ display:"flex", gap:8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={styles.markAllBtn}>
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} style={styles.clearTopBtn}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>
                <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                <p style={{ margin:0, fontWeight:600 }}>No notifications!</p>
                <p style={{ margin:"4px 0 0", fontSize:12 }}>You're all caught up</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    ...styles.notifItem,
                    background:  notif.read ? "#fff" : "#f0f4ff",
                    borderLeft:  notif.read ? "3px solid transparent" : "3px solid #4f46e5",
                    cursor:      notif.link ? "pointer" : "default",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = notif.read ? "#fff" : "#f0f4ff"}
                >
                  <span style={styles.notifIcon}>{getIcon(notif.type)}</span>
                  <div style={styles.notifContent}>
                    <p style={{
                      ...styles.notifTitle,
                      fontWeight: notif.read ? 600 : 700,
                    }}>
                      {notif.title}
                    </p>
                    <p style={styles.notifMsg}>{notif.message}</p>
                    <p style={styles.notifTime}>{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && <div style={styles.unreadDot} />}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={styles.dropFooter}>
              <span style={{ fontSize:12, color:"#94a3b8" }}>
                {notifications.length} total · {unreadCount} unread
              </span>
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
    background: "#f1f5f9", border: "none", borderRadius: "10px",
    padding: "10px", cursor: "pointer",
    display: "flex", alignItems: "center", position: "relative",
    transition: "background .2s",
  },
  badge: {
    position: "absolute", top: "-4px", right: "-4px",
    background: "#ef4444", color: "#fff",
    fontSize: "10px", fontWeight: "bold",
    width: "18px", height: "18px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid #fff",
  },
  dropdown: {
    position: "absolute", top: "50px", right: 0,
    width: "370px", background: "#fff", borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 9999, overflow: "hidden",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    animation: "nbDrop .2s cubic-bezier(.22,1,.36,1)",
  },
  dropHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
  },
  dropTitle: {
    fontSize: "15px", fontWeight: "800", color: "#1e293b",
    margin: 0, display: "flex", alignItems: "center", gap: 8,
  },
  unreadPill: {
    background: "#6366f1", color: "#fff",
    fontSize: "11px", fontWeight: "700",
    padding: "2px 8px", borderRadius: "100px",
  },
  markAllBtn: {
    background: "rgba(99,102,241,0.08)", border: "none",
    color: "#4f46e5", fontSize: "12px", fontWeight: "700",
    cursor: "pointer", padding: "5px 10px", borderRadius: "8px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  clearTopBtn: {
    background: "rgba(239,68,68,0.07)", border: "none",
    color: "#ef4444", fontSize: "12px", fontWeight: "700",
    cursor: "pointer", padding: "5px 10px", borderRadius: "8px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  list: { maxHeight: "400px", overflowY: "auto" },
  empty: {
    textAlign: "center", padding: "44px 24px",
    color: "#94a3b8", fontSize: "14px",
  },
  notifItem: {
    display: "flex", alignItems: "flex-start", gap: "12px",
    padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s",
  },
  notifIcon:    { fontSize: "20px", flexShrink: 0, marginTop: 1 },
  notifContent: { flex: 1, minWidth: 0 },
  notifTitle:   { fontSize: "13.5px", color: "#1e293b", margin: "0 0 3px" },
  notifMsg:     { fontSize: "12.5px", color: "#64748b", margin: "0 0 4px", lineHeight: 1.5 },
  notifTime:    { fontSize: "11px", color: "#94a3b8", margin: 0 },
  unreadDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "#4f46e5", flexShrink: 0, marginTop: "5px",
  },
  dropFooter: {
    padding: "10px 20px", borderTop: "1px solid #e2e8f0",
    display: "flex", justifyContent: "center",
  },
};

export default NotificationBell;