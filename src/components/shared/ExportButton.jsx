// src/components/shared/ExportButton.jsx
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Sheet, ChevronDown } from "lucide-react";

const ExportButton = ({ onExportPDF, onExportExcel, label = "Export" }) => {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(null);
  const [pos, setPos]         = useState({ top: 0, right: 0 });
  const btnRef                = useRef(null);

  // Calculate dropdown position relative to button on open
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top:   rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const handlePDF = async () => {
    setLoading("pdf"); setOpen(false);
    try { await onExportPDF(); } finally { setLoading(null); }
  };
  const handleExcel = async () => {
    setLoading("excel"); setOpen(false);
    try { await onExportExcel(); } finally { setLoading(null); }
  };

  const dropdown = open ? createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{ position:"fixed", inset:0, zIndex:9998 }}
      />
      {/* Dropdown — rendered directly in body, no clipping */}
      <div style={{
        position:     "absolute",
        top:          pos.top,
        right:        pos.right,
        background:   "#fff",
        borderRadius: "14px",
        boxShadow:    "0 10px 40px rgba(0,0,0,0.18)",
        border:       "1px solid #e2e8f0",
        padding:      "12px",
        minWidth:     "230px",
        zIndex:       9999,
        animation:    "ebFadeDown .15s ease",
      }}>
        <style>{`
          @keyframes ebFadeDown {
            from { opacity:0; transform:translateY(-6px); }
            to   { opacity:1; transform:translateY(0); }
          }
          .eb-item { display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;background:transparent;border:none;border-radius:10px;cursor:pointer;text-align:left;transition:background .15s;font-family:inherit; }
          .eb-item:hover { background:#f8fafc; }
        `}</style>

        <p style={{ fontSize:"11px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", margin:"0 0 10px 8px" }}>
          Download As
        </p>

        <button className="eb-item" onClick={handlePDF}>
          <div style={{ width:36, height:36, borderRadius:8, background:"#fee2e2", color:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <FileText size={16} />
          </div>
          <div>
            <p style={{ fontSize:"14px", fontWeight:"600", color:"#1e293b", margin:0 }}>PDF Report</p>
            <p style={{ fontSize:"12px", color:"#94a3b8", margin:"2px 0 0" }}>Professional formatted report</p>
          </div>
        </button>

        <button className="eb-item" onClick={handleExcel}>
          <div style={{ width:36, height:36, borderRadius:8, background:"#dcfce7", color:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Sheet size={16} />
          </div>
          <div>
            <p style={{ fontSize:"14px", fontWeight:"600", color:"#1e293b", margin:0 }}>Excel Spreadsheet</p>
            <p style={{ fontSize:"12px", color:"#94a3b8", margin:"2px 0 0" }}>Editable .xlsx file</p>
          </div>
        </button>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .eb-spinner { width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block; }
      `}</style>

      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        disabled={loading !== null}
        style={{
          display:"flex", alignItems:"center", gap:"8px",
          padding:"11px 18px",
          background:"linear-gradient(135deg, #10b981, #059669)",
          color:"#fff", border:"none", borderRadius:"10px",
          fontWeight:"600", fontSize:"14px", cursor: loading ? "not-allowed" : "pointer",
          boxShadow:"0 2px 8px rgba(16,185,129,0.35)",
          opacity: loading ? 0.8 : 1,
          transition:"all .2s", fontFamily:"inherit",
        }}
      >
        {loading ? <span className="eb-spinner" /> : <Download size={16} />}
        {loading === "pdf" ? "Generating PDF..." : loading === "excel" ? "Generating Excel..." : label}
        <ChevronDown size={14} style={{ transition:"transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {dropdown}
    </div>
  );
};

export default ExportButton;