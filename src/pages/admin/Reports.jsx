// src/pages/admin/Reports.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6"];

const Reports = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [payrollData, setPayrollData]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [visible, setVisible]               = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Attendance last 7 days
      const attSnap = await getDocs(collection(db,"attendance"));
      const dateMap = {};
      attSnap.docs.forEach(d => {
        const a = d.data();
        if (!dateMap[a.date]) dateMap[a.date] = { date:a.date, present:0, absent:0, late:0 };
        dateMap[a.date][a.status]++;
      });
      setAttendanceData(Object.values(dateMap).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(-7));

      // Department pie
      const empSnap = await getDocs(query(collection(db,"users"), where("role","==","employee")));
      const deptMap = {};
      empSnap.docs.forEach(d => { const e=d.data(); deptMap[e.department]=(deptMap[e.department]||0)+1; });
      setDepartmentData(Object.entries(deptMap).map(([name,value])=>({name,value})));

      // Payroll last 6 months
      const paySnap = await getDocs(collection(db,"payroll"));
      const payMap = {};
      paySnap.docs.forEach(d => {
        const p=d.data();
        if (!payMap[p.month]) payMap[p.month]={month:p.month,total:0,count:0};
        payMap[p.month].total+=p.netSalary||0;
        payMap[p.month].count++;
      });
      setPayrollData(Object.values(payMap).sort((a,b)=>new Date(a.month)-new Date(b.month)).slice(-6));
    } catch { toast.error("Error fetching reports!"); }
    finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
  };
  useEffect(()=>{ fetchReports(); },[]);

  return (
    <AdminLayout pageTitle="Reports & Analytics">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .rp{font-family:'Plus Jakarta Sans',sans-serif;}
        .rp-hdr{margin-bottom:22px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .rp-hdr.vis{opacity:1;transform:translateY(0);}
        .rp-hdr-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-.4px;margin:0;}
        .rp-hdr-sub{font-size:13px;color:#94a3b8;margin:3px 0 0;}
        .rp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px;color:#94a3b8;font-size:15px;}
        .rp-spin{width:20px;height:20px;border:2px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:rpspin .7s linear infinite;}
        @keyframes rpspin{to{transform:rotate(360deg);}}
        .rp-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1) .08s;}
        .rp-row.vis{opacity:1;transform:translateY(0);}
        .rp-card{background:#fff;border-radius:16px;padding:24px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);}
        .rp-card-full{background:#fff;border-radius:16px;padding:24px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);margin-bottom:20px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .16s;}
        .rp-card-full.vis{opacity:1;transform:translateY(0);}
        .rp-chart-title{font-size:15px;font-weight:700;color:#0f172a;margin:0 0 20px;letter-spacing:-.2px;}
        .rp-nodata{text-align:center;padding:48px;color:#94a3b8;font-size:14px;}
      `}</style>

      <div className="rp">
        <div className={`rp-hdr ${visible?"vis":""}`}>
          <h3 className="rp-hdr-title">Reports & Analytics</h3>
          <p className="rp-hdr-sub">Company performance overview</p>
        </div>

        {loading ? (
          <div className="rp-loading"><div className="rp-spin"/>Loading reports...</div>
        ) : (
          <>
            <div className={`rp-row ${visible?"vis":""}`}>
              <div className="rp-card">
                <p className="rp-chart-title">📅 Attendance — Last 7 Days</p>
                {attendanceData.length===0 ? <div className="rp-nodata">No attendance data yet!</div> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                      <XAxis dataKey="date" tick={{fontSize:11,fontFamily:"Plus Jakarta Sans"}}/>
                      <YAxis tick={{fontSize:11}}/>
                      <Tooltip contentStyle={{borderRadius:10,border:"1px solid #f1f5f9",fontFamily:"Plus Jakarta Sans"}}/>
                      <Legend wrapperStyle={{fontFamily:"Plus Jakarta Sans",fontSize:13}}/>
                      <Bar dataKey="present" fill="#10b981" name="Present" radius={[6,6,0,0]}/>
                      <Bar dataKey="absent"  fill="#ef4444" name="Absent"  radius={[6,6,0,0]}/>
                      <Bar dataKey="late"    fill="#f59e0b" name="Late"    radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rp-card">
                <p className="rp-chart-title">🏢 Employees by Department</p>
                {departmentData.length===0 ? <div className="rp-nodata">No employee data yet!</div> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={departmentData} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                        {departmentData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius:10,border:"1px solid #f1f5f9",fontFamily:"Plus Jakarta Sans"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={`rp-card-full ${visible?"vis":""}`}>
              <p className="rp-chart-title">💰 Monthly Payroll — Last 6 Months</p>
              {payrollData.length===0 ? <div className="rp-nodata">No payroll data yet!</div> : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={payrollData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"Plus Jakarta Sans"}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip formatter={v=>[`₹${v.toLocaleString()}`,"Total Payroll"]} contentStyle={{borderRadius:10,border:"1px solid #f1f5f9",fontFamily:"Plus Jakarta Sans"}}/>
                    <Legend wrapperStyle={{fontFamily:"Plus Jakarta Sans",fontSize:13}}/>
                    <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{fill:"#6366f1",r:5}} name="Total Payroll"/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};
export default Reports;