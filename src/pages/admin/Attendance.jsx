// src/pages/admin/Attendance.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, doc, setDoc, query, where } from "firebase/firestore";
import { notifyEmployee } from "../../firebase/notifications";
import AdminLayout from "../../components/admin/AdminLayout";
import ExportButton from "../../components/shared/ExportButton";
import { exportAttendancePDF, exportAttendanceExcel } from "../../utils/exportUtils";
import { Save } from "lucide-react";
import toast from "react-hot-toast";

const Attendance = () => {
  const [employees, setEmployees]       = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [visible, setVisible]           = useState(false);

  const fetchEmployees = async () => {
    try {
      const snap = await getDocs(query(collection(db,"users"), where("role","==","employee")));
      setEmployees(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch { toast.error("Error fetching employees!"); }
    finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
  };
  const fetchAttendance = async date => {
    try {
      const snap = await getDocs(query(collection(db,"attendance"), where("date","==",date)));
      const data = {};
      snap.docs.forEach(d => { const a=d.data(); data[a.userId]=a.status; });
      setAttendanceData(data);
    } catch(e) { console.log(e); }
  };
  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { if (selectedDate) fetchAttendance(selectedDate); }, [selectedDate]);

  const handleStatusChange = (id, status) => setAttendanceData({ ...attendanceData, [id]: status });

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const emp of employees) {
        const status = attendanceData[emp.id];
        if (status) {
          await setDoc(doc(db,"attendance",`${emp.id}_${selectedDate}`), { userId:emp.id, userName:emp.name, department:emp.department, date:selectedDate, status });
          await notifyEmployee(emp.id,"Attendance Marked 📅",`Aaj (${selectedDate}) tumhari attendance "${status}" mark hui!`,"attendance","/employee/attendance");
        }
      }
      toast.success("Attendance saved! ✅");
    } catch { toast.error("Failed to save!"); }
    finally { setSaving(false); }
  };

  const present = Object.values(attendanceData).filter(s=>s==="present").length;
  const absent  = Object.values(attendanceData).filter(s=>s==="absent").length;
  const late    = Object.values(attendanceData).filter(s=>s==="late").length;

  return (
    <AdminLayout pageTitle="Attendance Management">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .ap{font-family:'Plus Jakarta Sans',sans-serif;}
        .ap-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .ap-hdr.vis{opacity:1;transform:translateY(0);}
        .ap-hdr-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .ap-hdr-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;}
        .ap-hdr-right{display:flex;gap:10px;align-items:center;}
        .ap-date{padding:10px 14px;border-radius:12px;border:1.5px solid #e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;outline:none;background:#fff;transition:border-color .2s;}
        .ap-date:focus{border-color:#6366f1;}
        .ap-save-btn{display:flex;align-items:center;gap:8px;padding:11px 20px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;box-shadow:0 4px 14px rgba(99,102,241,0.3);}
        .ap-save-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(99,102,241,0.4);}
        .ap-save-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}
        .ap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .08s;}
        .ap-stats.vis{opacity:1;transform:translateY(0);}
        .ap-stat{background:#fff;border-radius:14px;padding:18px 20px;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,0.04);position:relative;overflow:hidden;}
        .ap-stat-bar{position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:14px 0 0 14px;}
        .ap-stat-val{font-size:30px;font-weight:800;color:#0f172a;letter-spacing:-1px;margin:0 0 4px;}
        .ap-stat-lbl{font-size:13px;color:#94a3b8;font-weight:500;margin:0;}
        .ap-box{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .15s;}
        .ap-box.vis{opacity:1;transform:translateY(0);}
        .ap-empty{text-align:center;padding:64px;color:#94a3b8;font-size:15px;}
        .ap-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#94a3b8;}
        .ap-spin{width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:apspin .7s linear infinite;}
        @keyframes apspin{to{transform:rotate(360deg);}}
        table.ap-tbl{width:100%;border-collapse:collapse;}
        .ap-thead tr{background:#f8fafc;}
        .ap-th{padding:13px 16px;text-align:left;font-size:11.5px;font-weight:700;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;}
        .ap-tr{border-bottom:1px solid #f8fafc;transition:background .15s;}
        .ap-tr:hover{background:#fafbff;}
        .ap-td{padding:13px 16px;font-size:14px;color:#1e293b;}
        .ap-emp{display:flex;align-items:center;gap:10px;}
        .ap-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#06b6d4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;}
        .ap-emp-name{font-weight:600;color:#0f172a;font-size:14px;margin:0;}
        .ap-emp-email{font-size:12px;color:#94a3b8;margin:0;}
        .ap-dept{background:rgba(99,102,241,0.1);color:#6366f1;padding:4px 10px;border-radius:100px;font-size:12px;font-weight:600;}
        .ap-not-marked{color:#cbd5e1;font-size:13px;font-style:italic;}
        .ap-btns{display:flex;gap:6px;}
        .ap-btn{padding:8px 14px;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:12.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .18s;}
        .ap-btn-p{background:#f0fdf4;color:#16a34a;}
        .ap-btn-p.on{background:#16a34a;color:#fff;box-shadow:0 2px 8px rgba(22,163,74,0.3);}
        .ap-btn-a{background:#fff1f2;color:#ef4444;}
        .ap-btn-a.on{background:#ef4444;color:#fff;box-shadow:0 2px 8px rgba(239,68,68,0.3);}
        .ap-btn-l{background:#fefce8;color:#d97706;}
        .ap-btn-l.on{background:#d97706;color:#fff;box-shadow:0 2px 8px rgba(217,119,6,0.3);}
        .ap-btn:hover{transform:translateY(-1px);}
      `}</style>

      <div className="ap">
        {/* Header */}
        <div className={`ap-hdr ${visible?"vis":""}`}>
          <div>
            <h3 className="ap-hdr-title">Attendance Management</h3>
            <p className="ap-hdr-sub">Mark daily attendance for employees</p>
          </div>
          <div className="ap-hdr-right">
            <ExportButton label="Export" onExportPDF={()=>exportAttendancePDF(employees,attendanceData,selectedDate)} onExportExcel={()=>exportAttendanceExcel(employees,attendanceData,selectedDate)} />
            <input className="ap-date" type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
            <button className="ap-save-btn" onClick={handleSave} disabled={saving}>
              <Save size={16}/>{saving?"Saving...":"Save Attendance"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={`ap-stats ${visible?"vis":""}`}>
          {[
            { val:present, lbl:"Present",  clr:"#16a34a" },
            { val:absent,  lbl:"Absent",   clr:"#ef4444" },
            { val:late,    lbl:"Late",     clr:"#d97706" },
            { val:employees.length, lbl:"Total", clr:"#6366f1" },
          ].map((s,i)=>(
            <div className="ap-stat" key={i}>
              <div className="ap-stat-bar" style={{background:s.clr}}/>
              <p className="ap-stat-val">{s.val}</p>
              <p className="ap-stat-lbl">{s.lbl}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className={`ap-box ${visible?"vis":""}`}>
          {loading ? (
            <div className="ap-loading"><div className="ap-spin"/>Loading...</div>
          ) : employees.length===0 ? (
            <div className="ap-empty">No employees found!</div>
          ) : (
            <table className="ap-tbl">
              <thead className="ap-thead">
                <tr><th className="ap-th">#</th><th className="ap-th">Employee</th><th className="ap-th">Department</th><th className="ap-th">Current Status</th><th className="ap-th">Mark Attendance</th></tr>
              </thead>
              <tbody>
                {employees.map((emp,i)=>{
                  const s = attendanceData[emp.id];
                  const statusColor = s==="present"?{bg:"rgba(22,163,74,0.1)",clr:"#16a34a"}:s==="absent"?{bg:"rgba(239,68,68,0.1)",clr:"#ef4444"}:s==="late"?{bg:"rgba(217,119,6,0.1)",clr:"#d97706"}:null;
                  return (
                    <tr key={emp.id} className="ap-tr">
                      <td className="ap-td">{i+1}</td>
                      <td className="ap-td">
                        <div className="ap-emp">
                          <div className="ap-avatar">{emp.name?.charAt(0).toUpperCase()}</div>
                          <div><p className="ap-emp-name">{emp.name}</p><p className="ap-emp-email">{emp.email}</p></div>
                        </div>
                      </td>
                      <td className="ap-td"><span className="ap-dept">{emp.department}</span></td>
                      <td className="ap-td">
                        {statusColor ? (
                          <span style={{background:statusColor.bg,color:statusColor.clr,padding:"5px 12px",borderRadius:"100px",fontSize:"12px",fontWeight:"700",textTransform:"capitalize"}}>{s}</span>
                        ) : <span className="ap-not-marked">Not Marked</span>}
                      </td>
                      <td className="ap-td">
                        <div className="ap-btns">
                          <button className={`ap-btn ap-btn-p ${s==="present"?"on":""}`} onClick={()=>handleStatusChange(emp.id,"present")}>✅ Present</button>
                          <button className={`ap-btn ap-btn-a ${s==="absent"?"on":""}`}  onClick={()=>handleStatusChange(emp.id,"absent")}>❌ Absent</button>
                          <button className={`ap-btn ap-btn-l ${s==="late"?"on":""}`}   onClick={()=>handleStatusChange(emp.id,"late")}>⏰ Late</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
export default Attendance;