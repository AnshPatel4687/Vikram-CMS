// src/pages/admin/FixEmployeeIds.jsx
import { useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import { Wrench, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const FixEmployeeIds = () => {
  const [status, setStatus]   = useState("idle"); // idle | running | done
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [visible, setVisible] = useState(true);

  const runFix = async () => {
    setStatus("running");
    setResults([]);
    setSummary(null);
    const log = [];

    try {
      // Fetch ALL employees (role=employee)
      const snap = await getDocs(query(collection(db, "users"), where("role", "==", "employee")));
      const allEmps = snap.docs.map(d => ({ docId: d.id, ...d.data() }));

      // Separate: with ID vs without ID
      const withId    = allEmps.filter(e => e.employeeId && /^E\d{4}$/.test(e.employeeId));
      const withoutId = allEmps.filter(e => !e.employeeId || !/^E\d{4}$/.test(e.employeeId));

      // Find max existing number
      const existingNums = withId.map(e => parseInt(e.employeeId.replace("E", ""), 10)).filter(n => n > 0);
      let counter = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

      if (withoutId.length === 0) {
        toast.success("All employees already have IDs! ✅");
        setSummary({ total: allEmps.length, fixed: 0, skipped: withId.length });
        setStatus("done");
        return;
      }

      // Assign E0001, E0002 ... sequentially
      for (const emp of withoutId) {
        const newId = `E${String(counter).padStart(4, "0")}`;
        try {
          await updateDoc(doc(db, "users", emp.docId), { employeeId: newId });
          log.push({ name: emp.name, email: emp.email, newId, ok: true });
          counter++;
        } catch {
          log.push({ name: emp.name, email: emp.email, newId: "FAILED", ok: false });
        }
        setResults([...log]);
      }

      const fixed = log.filter(l => l.ok).length;
      setSummary({ total: allEmps.length, fixed, skipped: withId.length });
      toast.success(`✅ Done! ${fixed} employee(s) assigned new IDs!`);
    } catch (err) {
      toast.error("Fix failed: " + err.message);
    } finally {
      setStatus("done");
    }
  };

  return (
    <AdminLayout pageTitle="Fix Employee IDs">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .fix{font-family:'Plus Jakarta Sans',sans-serif;max-width:700px;}
        .fix-card{background:#fff;border-radius:18px;padding:32px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);}
        .fix-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0 0 6px;display:flex;align-items:center;gap:10px;}
        .fix-sub{font-size:14px;color:#94a3b8;margin:0 0 24px;line-height:1.7;}
        .fix-info{background:rgba(99,102,241,0.06);border:1.5px solid rgba(99,102,241,0.15);border-radius:14px;padding:18px 22px;margin-bottom:24px;font-size:14px;color:#4338ca;line-height:1.85;}
        .fix-info b{font-weight:700;}
        .fix-info code{background:rgba(99,102,241,0.12);padding:2px 8px;border-radius:6px;font-family:monospace;font-weight:700;font-size:13px;}
        .fix-btn{display:flex;align-items:center;gap:10px;padding:13px 28px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:15px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;box-shadow:0 4px 16px rgba(99,102,241,0.3);}
        .fix-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,0.4);}
        .fix-btn:disabled{opacity:.6;cursor:not-allowed;}
        .fix-spin{width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:fixspin .7s linear infinite;}
        @keyframes fixspin{to{transform:rotate(360deg);}}
        .fix-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:24px 0 0;}
        .fix-s-card{background:#f8fafc;border-radius:12px;padding:18px;text-align:center;border:1px solid #f1f5f9;}
        .fix-s-val{font-size:30px;font-weight:800;color:#0f172a;letter-spacing:-1px;margin:0 0 4px;}
        .fix-s-lbl{font-size:13px;color:#94a3b8;margin:0;font-weight:500;}
        .fix-divider{height:1px;background:#f1f5f9;margin:24px 0;}
        .fix-r-title{font-size:14px;font-weight:800;color:#0f172a;margin:0 0 14px;letter-spacing:-.2px;}
        .fix-r-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:10px;margin-bottom:8px;}
        .fix-r-ok{background:rgba(22,163,74,0.05);border:1px solid rgba(22,163,74,0.15);}
        .fix-r-fail{background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);}
        .fix-r-left{display:flex;align-items:center;gap:10px;}
        .fix-r-name{font-weight:700;color:#0f172a;font-size:14px;}
        .fix-r-email{font-size:12px;color:#94a3b8;margin-top:2px;}
        .fix-r-id{font-weight:800;padding:4px 12px;border-radius:100px;font-size:12.5px;font-family:monospace;letter-spacing:.5px;}
        .fix-r-id-ok{background:rgba(99,102,241,0.1);color:#6366f1;}
        .fix-r-id-fail{background:rgba(239,68,68,0.1);color:#ef4444;}
        .fix-done-banner{display:flex;align-items:center;gap:12px;background:rgba(22,163,74,0.06);border:1.5px solid rgba(22,163,74,0.2);border-radius:12px;padding:14px 18px;margin-bottom:20px;color:#15803d;font-weight:700;font-size:14px;}
      `}</style>

      <div className="fix">
        <div className="fix-card">
          <p className="fix-title">🛠️ Fix Employee IDs</p>
          <p className="fix-sub">
            Assigns sequential Employee IDs (E0001, E0002, E0003...) to all existing employees who don't have one yet. Employees who already have a correct ID will be skipped safely.
          </p>

          <div className="fix-info">
            <b>What this does:</b><br/>
            • Reads all employees with role = <code>employee</code> from Firestore<br/>
            • Finds the highest existing <code>E0001</code> number<br/>
            • Assigns next IDs in sequence to employees missing one<br/>
            • Updates Firestore directly — no data loss<br/>
            • New employees added after this will also get auto IDs ✅
          </div>

          {status === "done" && summary && (
            <div className="fix-done-banner">
              <CheckCircle size={20}/>
              Fix complete! {summary.fixed} new ID(s) assigned, {summary.skipped} already had correct IDs.
            </div>
          )}

          <button className="fix-btn" onClick={runFix} disabled={status === "running"}>
            {status === "running"
              ? <><div className="fix-spin"/>Running fix...</>
              : status === "done"
              ? <><RefreshCw size={18}/>Run Again</>
              : <><Wrench size={18}/>Run Fix Now</>
            }
          </button>

          {summary && (
            <div className="fix-summary">
              <div className="fix-s-card"><p className="fix-s-val">{summary.total}</p><p className="fix-s-lbl">Total Employees</p></div>
              <div className="fix-s-card"><p className="fix-s-val" style={{color:"#6366f1"}}>{summary.fixed}</p><p className="fix-s-lbl">IDs Assigned Now</p></div>
              <div className="fix-s-card"><p className="fix-s-val" style={{color:"#94a3b8"}}>{summary.skipped}</p><p className="fix-s-lbl">Already Had ID</p></div>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="fix-divider"/>
              <p className="fix-r-title">Results — {results.length} employee(s) processed</p>
              {results.map((r, i) => (
                <div key={i} className={`fix-r-item ${r.ok ? "fix-r-ok" : "fix-r-fail"}`}>
                  <div className="fix-r-left">
                    {r.ok
                      ? <CheckCircle size={16} color="#16a34a"/>
                      : <AlertCircle size={16} color="#ef4444"/>}
                    <div>
                      <p className="fix-r-name">{r.name}</p>
                      <p className="fix-r-email">{r.email}</p>
                    </div>
                  </div>
                  <span className={`fix-r-id ${r.ok ? "fix-r-id-ok" : "fix-r-id-fail"}`}>{r.newId}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
export default FixEmployeeIds;