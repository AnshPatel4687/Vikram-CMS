// src/components/shared/ExportButton.jsx
import { useState } from "react";
import { Download, FileText, Sheet, ChevronDown } from "lucide-react";

/**
 * ExportButton — PDF & Excel export with modern dropdown
 *
 * Props:
 *  - onExportPDF  : async () => void
 *  - onExportExcel: async () => void
 *  - label        : string (optional, default "Export")
 */
const ExportButton = ({ onExportPDF, onExportExcel, label = "Export" }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null); // "pdf" | "excel" | null

  const handlePDF = async () => {
    setLoading("pdf");
    setOpen(false);
    try {
      await onExportPDF();
    } finally {
      setLoading(null);
    }
  };

  const handleExcel = async () => {
    setLoading("excel");
    setOpen(false);
    try {
      await onExportExcel();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Main Button */}
      <button
        onClick={() => setOpen(!open)}
        disabled={loading !== null}
        style={{
          ...styles.btn,
          opacity: loading ? 0.8 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? (
          <span style={styles.spinner} />
        ) : (
          <Download size={16} />
        )}
        {loading === "pdf"
          ? "Generating PDF..."
          : loading === "excel"
          ? "Generating Excel..."
          : label}
        <ChevronDown
          size={14}
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div style={styles.backdrop} onClick={() => setOpen(false)} />
          <div style={styles.dropdown}>
            <p style={styles.dropdownTitle}>Download As</p>

            <button onClick={handlePDF} style={styles.dropItem}>
              <div style={{ ...styles.dropIcon, background: "#fee2e2", color: "#dc2626" }}>
                <FileText size={16} />
              </div>
              <div>
                <p style={styles.dropItemTitle}>PDF Report</p>
                <p style={styles.dropItemSub}>Professional formatted report</p>
              </div>
            </button>

            <button onClick={handleExcel} style={styles.dropItem}>
              <div style={{ ...styles.dropIcon, background: "#dcfce7", color: "#16a34a" }}>
                <Sheet size={16} />
              </div>
              <div>
                <p style={styles.dropItemTitle}>Excel Spreadsheet</p>
                <p style={styles.dropItemSub}>Editable .xlsx file</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    position: "relative",
    display: "inline-block",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "11px 18px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(16,185,129,0.35)",
    transition: "all 0.2s",
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 998,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    border: "1px solid #e2e8f0",
    padding: "12px",
    minWidth: "230px",
    zIndex: 999,
    animation: "fadeSlideDown 0.15s ease",
  },
  dropdownTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 10px 8px",
  },
  dropItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s",
  },
  dropIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dropItemTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  dropItemSub: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "2px 0 0 0",
  },
};

export default ExportButton;