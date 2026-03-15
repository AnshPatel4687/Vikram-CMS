// src/pages/admin/Reports.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import { TrendingUp, Users, DollarSign, Calendar, RefreshCw, Award, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const Reports = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [payrollData,    setPayrollData]    = useState([]);
  const [leaveData,      setLeaveData]      = useState([]);
  const [stats,          setStats]          = useState({ employees:0, totalPayroll:0, avgAttendance:0, pendingLeaves:0 });
  const [loading,        setLoading]        = useState(true);
  const [visible,        setVisible]        = useState(false);

  const attChartRef  = useRef(null);
  const deptChartRef = useRef(null);
  const payChartRef  = useRef(null);
  const lvChartRef   = useRef(null);
  const attInst      = useRef(null);
  const deptInst     = useRef(null);
  const payInst      = useRef(null);
  const lvInst       = useRef(null);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const [attSnap, empSnap, paySnap, leaveSnap] = await Promise.all([
        getDocs(collection(db,"attendance")),
        getDocs(query(collection(db,"users"), where("role","==","employee"))),
        getDocs(collection(db,"payroll")),
        getDocs(collection(db,"leaves")),
      ]);

      // ── Attendance last 7 days ──────────────────────────────────────────
      const dateMap = {};
      attSnap.docs.forEach(d => {
        const a = d.data();
        if (!dateMap[a.date]) dateMap[a.date] = { date:a.date, present:0, absent:0, late:0 };
        if (a.status) dateMap[a.date][a.status] = (dateMap[a.date][a.status]||0) + 1;
      });
      const sortedAtt = Object.values(dateMap).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(-7);
      setAttendanceData(sortedAtt);

      // ── Department distribution ─────────────────────────────────────────
      const deptMap = {};
      empSnap.docs.forEach(d => { const e=d.data(); deptMap[e.department]=(deptMap[e.department]||0)+1; });
      const deptArr = Object.entries(deptMap).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
      setDepartmentData(deptArr);

      // ── Payroll last 6 months ───────────────────────────────────────────
      const payMap = {};
      paySnap.docs.forEach(d => {
        const p=d.data();
        if (!payMap[p.month]) payMap[p.month]={month:p.month,total:0,paid:0,pending:0};
        payMap[p.month].total += p.netSalary||0;
        if (p.status==="paid")    payMap[p.month].paid    += p.netSalary||0;
        if (p.status==="pending") payMap[p.month].pending += p.netSalary||0;
      });
      const sortedPay = Object.values(payMap).sort((a,b)=>new Date(a.month)-new Date(b.month)).slice(-6);
      setPayrollData(sortedPay);

      // ── Leave status breakdown ──────────────────────────────────────────
      const lvMap = { pending:0, approved:0, rejected:0 };
      leaveSnap.docs.forEach(d => { const s=d.data().status; if(lvMap[s]!==undefined) lvMap[s]++; });
      setLeaveData([
        { label:"Approved", value:lvMap.approved },
        { label:"Pending",  value:lvMap.pending },
        { label:"Rejected", value:lvMap.rejected },
      ]);

      // ── Summary stats ───────────────────────────────────────────────────
      const totalPay = Object.values(payMap).reduce((s,p)=>s+p.total,0);
      const presentCount = attSnap.docs.filter(d=>d.data().status==="present").length;
      const totalMarked  = attSnap.docs.filter(d=>d.data().status).length;
      const avgAtt = totalMarked > 0 ? Math.round((presentCount/totalMarked)*100) : 0;
      setStats({
        employees: empSnap.docs.length,
        totalPayroll: totalPay,
        avgAttendance: avgAtt,
        pendingLeaves: lvMap.pending,
      });

    } catch(e) { toast.error("Error fetching reports!"); }
    finally { setLoading(false); setTimeout(()=>setVisible(true),60); }
  };

  useEffect(() => { fetchReports(); }, []);

  // ── Load Chart.js + draw all charts ──────────────────────────────────────
  useEffect(() => {
    if (loading || !visible) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => drawCharts();
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [loading, visible, attendanceData, departmentData, payrollData, leaveData]);

  const drawCharts = () => {
    if (window.Chart) {
      drawAttendance();
      drawDepartment();
      drawPayroll();
      drawLeave();
    }
  };

  const drawAttendance = () => {
    if (!attChartRef.current || !attendanceData.length) return;
    if (attInst.current) attInst.current.destroy();
    attInst.current = new window.Chart(attChartRef.current, {
      type: "bar",
      data: {
        labels: attendanceData.map(d => d.date.slice(5)),
        datasets: [
          { label:"Present",  data: attendanceData.map(d=>d.present||0), backgroundColor:"#10b981", borderRadius:8, borderSkipped:false },
          { label:"Absent",   data: attendanceData.map(d=>d.absent||0),  backgroundColor:"#ef4444", borderRadius:8, borderSkipped:false },
          { label:"Late",     data: attendanceData.map(d=>d.late||0),    backgroundColor:"#f59e0b", borderRadius:8, borderSkipped:false },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins: {
          legend:{ display:false },
          tooltip:{
            backgroundColor:"#0f172a", titleColor:"#f8fafc", bodyColor:"#cbd5e1",
            padding:12, cornerRadius:10, displayColors:true,
            callbacks:{ title: items => `Date: ${attendanceData[items[0].dataIndex]?.date}` }
          },
        },
        scales:{
          x:{ grid:{display:false}, ticks:{color:"#94a3b8",font:{size:12}}, border:{display:false} },
          y:{ grid:{color:"rgba(148,163,184,0.1)"}, ticks:{color:"#94a3b8",font:{size:12},stepSize:1}, border:{display:false}, beginAtZero:true },
        },
        animation:{ duration:800, easing:"easeOutQuart" },
        barPercentage:0.65,
      },
    });
  };

  const drawDepartment = () => {
    if (!deptChartRef.current || !departmentData.length) return;
    if (deptInst.current) deptInst.current.destroy();
    const COLORS = ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];
    deptInst.current = new window.Chart(deptChartRef.current, {
      type: "doughnut",
      data: {
        labels: departmentData.map(d=>d.name),
        datasets:[{
          data: departmentData.map(d=>d.value),
          backgroundColor: COLORS.slice(0, departmentData.length),
          borderWidth:0,
          hoverOffset:8,
        }],
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        cutout:"68%",
        plugins:{
          legend:{ display:false },
          tooltip:{
            backgroundColor:"#0f172a", titleColor:"#f8fafc", bodyColor:"#cbd5e1",
            padding:12, cornerRadius:10,
            callbacks:{ label: ctx => ` ${ctx.label}: ${ctx.parsed} employees` }
          },
        },
        animation:{ animateRotate:true, duration:900, easing:"easeOutQuart" },
      },
    });
  };

  const drawPayroll = () => {
    if (!payChartRef.current || !payrollData.length) return;
    if (payInst.current) payInst.current.destroy();
    payInst.current = new window.Chart(payChartRef.current, {
      type:"line",
      data:{
        labels: payrollData.map(d=>d.month),
        datasets:[
          {
            label:"Total",
            data: payrollData.map(d=>d.total),
            borderColor:"#6366f1", backgroundColor:"rgba(99,102,241,0.08)",
            borderWidth:3, tension:0.4, fill:true,
            pointBackgroundColor:"#6366f1", pointRadius:6, pointHoverRadius:9,
            pointBorderColor:"#fff", pointBorderWidth:2,
          },
          {
            label:"Paid",
            data: payrollData.map(d=>d.paid),
            borderColor:"#10b981", backgroundColor:"rgba(16,185,129,0.05)",
            borderWidth:2.5, tension:0.4, fill:false,
            pointBackgroundColor:"#10b981", pointRadius:5, pointHoverRadius:8,
            pointBorderColor:"#fff", pointBorderWidth:2,
            borderDash:[],
          },
        ],
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{ display:false },
          tooltip:{
            backgroundColor:"#0f172a", titleColor:"#f8fafc", bodyColor:"#cbd5e1",
            padding:12, cornerRadius:10,
            callbacks:{
              label: ctx => ` ${ctx.dataset.label}: Rs.${Number(ctx.parsed.y).toLocaleString("en-IN")}`
            }
          },
        },
        scales:{
          x:{ grid:{display:false}, ticks:{color:"#94a3b8",font:{size:12}}, border:{display:false} },
          y:{
            grid:{color:"rgba(148,163,184,0.1)"},
            ticks:{
              color:"#94a3b8",font:{size:11},
              callback: v => v >= 100000 ? `Rs.${(v/100000).toFixed(1)}L` : v >= 1000 ? `Rs.${(v/1000).toFixed(0)}K` : `Rs.${v}`,
            },
            border:{display:false}, beginAtZero:true,
          },
        },
        animation:{ duration:900, easing:"easeOutQuart" },
        interaction:{ mode:"index", intersect:false },
      },
    });
  };

  const drawLeave = () => {
    if (!lvChartRef.current || !leaveData.length) return;
    if (lvInst.current) lvInst.current.destroy();
    lvInst.current = new window.Chart(lvChartRef.current, {
      type:"bar",
      data:{
        labels: leaveData.map(d=>d.label),
        datasets:[{
          data: leaveData.map(d=>d.value),
          backgroundColor:["#10b981","#f59e0b","#ef4444"],
          borderRadius:10,
          borderSkipped:false,
          barThickness:52,
        }],
      },
      options:{
        responsive:true, maintainAspectRatio:false, indexAxis:"y",
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"#0f172a", titleColor:"#f8fafc", bodyColor:"#cbd5e1",
            padding:12, cornerRadius:10,
            callbacks:{ label: ctx => ` ${ctx.parsed.x} requests` }
          },
        },
        scales:{
          x:{ grid:{color:"rgba(148,163,184,0.1)"}, ticks:{color:"#94a3b8",font:{size:12},stepSize:1}, border:{display:false}, beginAtZero:true },
          y:{ grid:{display:false}, ticks:{color:"#64748b",font:{size:13,weight:"600"}}, border:{display:false} },
        },
        animation:{ duration:800, easing:"easeOutQuart" },
      },
    });
  };

  const DEPT_COLORS = ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

  return (
    <AdminLayout pageTitle="Reports & Analytics">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .rp{font-family:'Plus Jakarta Sans',sans-serif;}

        .rp-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1);}
        .rp-hdr.vis{opacity:1;transform:translateY(0);}
        .rp-hdr-left{}
        .rp-hdr-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,0.08);color:#6366f1;border:1px solid rgba(99,102,241,0.18);border-radius:100px;padding:5px 14px;font-size:12px;font-weight:700;letter-spacing:.3px;margin-bottom:10px;}
        .rp-hdr-title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;margin:0;}
        .rp-hdr-sub{font-size:13.5px;color:#94a3b8;margin:5px 0 0;font-weight:500;}
        .rp-refresh{display:flex;align-items:center;gap:8px;padding:10px 20px;background:#fff;color:#6366f1;border:1.5px solid rgba(99,102,241,0.25);border-radius:12px;cursor:pointer;font-weight:700;font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .22s;}
        .rp-refresh:hover{background:rgba(99,102,241,0.06);border-color:rgba(99,102,241,0.5);transform:translateY(-1px);}

        /* Stat cards */
        .rp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.22,1,.36,1) .06s;}
        .rp-stats.vis{opacity:1;transform:translateY(0);}
        .rp-stat{background:#fff;border-radius:16px;padding:20px 22px;border:1px solid #f1f5f9;box-shadow:0 2px 16px rgba(0,0,0,0.04);display:flex;flex-direction:column;gap:14px;position:relative;overflow:hidden;transition:transform .22s,box-shadow .22s;}
        .rp-stat:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,0.08);}
        .rp-stat-bar{position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:0 4px 4px 0;}
        .rp-stat-top{display:flex;justify-content:space-between;align-items:flex-start;}
        .rp-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .rp-stat-val{font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-1px;margin:0;line-height:1;}
        .rp-stat-lbl{font-size:13px;color:#94a3b8;font-weight:600;margin:0;}
        .rp-stat-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:100px;font-size:11.5px;font-weight:700;}

        /* Chart grid */
        .rp-row2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1) .12s;}
        .rp-row2.vis{opacity:1;transform:translateY(0);}
        .rp-row3{display:grid;grid-template-columns:1.6fr 1fr;gap:20px;margin-bottom:20px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.22,1,.36,1) .18s;}
        .rp-row3.vis{opacity:1;transform:translateY(0);}
        .rp-card{background:#fff;border-radius:18px;padding:24px 26px;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,0.04);}
        .rp-card-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;}
        .rp-card-title{font-size:15px;font-weight:800;color:#0f172a;letter-spacing:-.3px;margin:0;}
        .rp-card-sub{font-size:12px;color:#94a3b8;margin:4px 0 0;font-weight:500;}
        .rp-card-badge{padding:4px 12px;border-radius:100px;font-size:11.5px;font-weight:700;}

        /* Legend */
        .rp-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
        .rp-legend-item{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#64748b;font-weight:600;}
        .rp-legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0;}

        /* Donut center */
        .rp-donut-wrap{position:relative;}
        .rp-donut-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;}
        .rp-donut-num{font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-1px;line-height:1;}
        .rp-donut-lbl{font-size:11px;color:#94a3b8;font-weight:600;margin-top:3px;}

        /* Dept list */
        .rp-dept-list{margin-top:18px;display:flex;flex-direction:column;gap:10px;}
        .rp-dept-row{display:flex;align-items:center;gap:10px;}
        .rp-dept-name{font-size:13px;font-weight:600;color:#475569;min-width:90px;}
        .rp-dept-bar-bg{flex:1;height:6px;background:#f1f5f9;border-radius:100px;overflow:hidden;}
        .rp-dept-bar-fill{height:100%;border-radius:100px;transition:width .6s cubic-bezier(.22,1,.36,1);}
        .rp-dept-count{font-size:13px;font-weight:800;color:#0f172a;min-width:24px;text-align:right;}

        /* Loading */
        .rp-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:100px;color:#94a3b8;font-size:15px;font-weight:600;}
        .rp-spin{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:rpspin .7s linear infinite;}
        @keyframes rpspin{to{transform:rotate(360deg);}}
        .rp-nodata{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px;color:#94a3b8;font-size:14px;font-weight:500;gap:10px;}
        .rp-nodata-icon{font-size:32px;}
      `}</style>

      <div className="rp">

        {/* Header */}
        <div className={`rp-hdr ${visible?"vis":""}`}>
          <div className="rp-hdr-left">
            <div className="rp-hdr-tag">
              <TrendingUp size={12}/> ANALYTICS DASHBOARD
            </div>
            <h3 className="rp-hdr-title">Reports & Analytics</h3>
            <p className="rp-hdr-sub">Real-time company performance overview</p>
          </div>
          <button className="rp-refresh" onClick={fetchReports}>
            <RefreshCw size={15}/> Refresh
          </button>
        </div>

        {loading ? (
          <div className="rp-loading">
            <div className="rp-spin"/>
            Building your dashboard...
          </div>
        ) : (<>

          {/* Stat Cards */}
          <div className={`rp-stats ${visible?"vis":""}`}>
            <div className="rp-stat">
              <div className="rp-stat-bar" style={{background:"#6366f1"}}/>
              <div className="rp-stat-top">
                <div>
                  <p className="rp-stat-val">{stats.employees}</p>
                  <p className="rp-stat-lbl">Total Employees</p>
                </div>
                <div className="rp-stat-icon" style={{background:"rgba(99,102,241,0.1)"}}>
                  <Users size={20} color="#6366f1"/>
                </div>
              </div>
              <span className="rp-stat-badge" style={{background:"rgba(99,102,241,0.08)",color:"#6366f1"}}>
                Active workforce
              </span>
            </div>

            <div className="rp-stat">
              <div className="rp-stat-bar" style={{background:"#10b981"}}/>
              <div className="rp-stat-top">
                <div>
                  <p className="rp-stat-val">Rs.{stats.totalPayroll>=100000?(stats.totalPayroll/100000).toFixed(1)+"L":stats.totalPayroll>=1000?(stats.totalPayroll/1000).toFixed(0)+"K":stats.totalPayroll}</p>
                  <p className="rp-stat-lbl">Total Payroll</p>
                </div>
                <div className="rp-stat-icon" style={{background:"rgba(16,185,129,0.1)"}}>
                  <DollarSign size={20} color="#10b981"/>
                </div>
              </div>
              <span className="rp-stat-badge" style={{background:"rgba(16,185,129,0.08)",color:"#10b981"}}>
                All time payout
              </span>
            </div>

            <div className="rp-stat">
              <div className="rp-stat-bar" style={{background:"#f59e0b"}}/>
              <div className="rp-stat-top">
                <div>
                  <p className="rp-stat-val">{stats.avgAttendance}%</p>
                  <p className="rp-stat-lbl">Avg Attendance</p>
                </div>
                <div className="rp-stat-icon" style={{background:"rgba(245,158,11,0.1)"}}>
                  <Calendar size={20} color="#f59e0b"/>
                </div>
              </div>
              <span className="rp-stat-badge" style={{background:"rgba(245,158,11,0.08)",color:"#d97706"}}>
                Present rate
              </span>
            </div>

            <div className="rp-stat">
              <div className="rp-stat-bar" style={{background:"#ef4444"}}/>
              <div className="rp-stat-top">
                <div>
                  <p className="rp-stat-val">{stats.pendingLeaves}</p>
                  <p className="rp-stat-lbl">Pending Leaves</p>
                </div>
                <div className="rp-stat-icon" style={{background:"rgba(239,68,68,0.1)"}}>
                  <Clock size={20} color="#ef4444"/>
                </div>
              </div>
              <span className="rp-stat-badge" style={{background:"rgba(239,68,68,0.08)",color:"#ef4444"}}>
                Needs approval
              </span>
            </div>
          </div>

          {/* Row 1 — Attendance + Department */}
          <div className={`rp-row2 ${visible?"vis":""}`}>

            {/* Attendance Chart */}
            <div className="rp-card">
              <div className="rp-card-hdr">
                <div>
                  <p className="rp-card-title">Attendance — Last 7 Days</p>
                  <p className="rp-card-sub">Daily present / absent / late breakdown</p>
                </div>
                <span className="rp-card-badge" style={{background:"rgba(16,185,129,0.08)",color:"#059669"}}>Live</span>
              </div>
              {attendanceData.length===0 ? (
                <div className="rp-nodata"><span className="rp-nodata-icon">📅</span>No attendance data yet</div>
              ) : (
                <>
                  <div style={{position:"relative",height:"230px"}}>
                    <canvas ref={attChartRef}/>
                  </div>
                  <div className="rp-legend">
                    {[{label:"Present",color:"#10b981"},{label:"Absent",color:"#ef4444"},{label:"Late",color:"#f59e0b"}].map(l=>(
                      <div key={l.label} className="rp-legend-item">
                        <div className="rp-legend-dot" style={{background:l.color}}/>
                        {l.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Department Donut */}
            <div className="rp-card">
              <div className="rp-card-hdr">
                <div>
                  <p className="rp-card-title">Employees by Department</p>
                  <p className="rp-card-sub">Team size distribution</p>
                </div>
                <span className="rp-card-badge" style={{background:"rgba(99,102,241,0.08)",color:"#6366f1"}}>{stats.employees} total</span>
              </div>
              {departmentData.length===0 ? (
                <div className="rp-nodata"><span className="rp-nodata-icon">🏢</span>No employee data yet</div>
              ) : (
                <>
                  <div className="rp-donut-wrap" style={{position:"relative",height:"180px"}}>
                    <canvas ref={deptChartRef}/>
                    <div className="rp-donut-center">
                      <p className="rp-donut-num">{stats.employees}</p>
                      <p className="rp-donut-lbl">EMPLOYEES</p>
                    </div>
                  </div>
                  <div className="rp-dept-list">
                    {departmentData.map((d,i)=>(
                      <div key={d.name} className="rp-dept-row">
                        <span className="rp-dept-name">{d.name}</span>
                        <div className="rp-dept-bar-bg">
                          <div className="rp-dept-bar-fill" style={{width:`${Math.round((d.value/stats.employees)*100)}%`,background:DEPT_COLORS[i%DEPT_COLORS.length]}}/>
                        </div>
                        <span className="rp-dept-count">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 2 — Payroll + Leave */}
          <div className={`rp-row3 ${visible?"vis":""}`}>

            {/* Payroll Line Chart */}
            <div className="rp-card">
              <div className="rp-card-hdr">
                <div>
                  <p className="rp-card-title">Monthly Payroll — Last 6 Months</p>
                  <p className="rp-card-sub">Total vs paid salary trend</p>
                </div>
                <span className="rp-card-badge" style={{background:"rgba(16,185,129,0.08)",color:"#059669"}}>
                  Rs.{stats.totalPayroll>=100000?(stats.totalPayroll/100000).toFixed(1)+"L":stats.totalPayroll>=1000?(stats.totalPayroll/1000).toFixed(0)+"K":stats.totalPayroll} total
                </span>
              </div>
              {payrollData.length===0 ? (
                <div className="rp-nodata"><span className="rp-nodata-icon">💰</span>No payroll data yet</div>
              ) : (
                <>
                  <div style={{position:"relative",height:"240px"}}>
                    <canvas ref={payChartRef}/>
                  </div>
                  <div className="rp-legend">
                    {[{label:"Total Payroll",color:"#6366f1"},{label:"Paid",color:"#10b981"}].map(l=>(
                      <div key={l.label} className="rp-legend-item">
                        <div className="rp-legend-dot" style={{background:l.color}}/>
                        {l.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Leave Bar Chart */}
            <div className="rp-card">
              <div className="rp-card-hdr">
                <div>
                  <p className="rp-card-title">Leave Requests</p>
                  <p className="rp-card-sub">Status breakdown overview</p>
                </div>
                <span className="rp-card-badge" style={{background:"rgba(245,158,11,0.08)",color:"#d97706"}}>
                  {leaveData.reduce((s,l)=>s+l.value,0)} total
                </span>
              </div>
              {leaveData.every(l=>l.value===0) ? (
                <div className="rp-nodata"><span className="rp-nodata-icon">🌿</span>No leave requests yet</div>
              ) : (
                <>
                  <div style={{position:"relative",height:"160px"}}>
                    <canvas ref={lvChartRef}/>
                  </div>
                  <div className="rp-legend" style={{marginTop:20}}>
                    {[{label:"Approved",color:"#10b981"},{label:"Pending",color:"#f59e0b"},{label:"Rejected",color:"#ef4444"}].map(l=>(
                      <div key={l.label} className="rp-legend-item">
                        <div className="rp-legend-dot" style={{background:l.color}}/>
                        {l.label}: <strong style={{color:"#0f172a"}}>{leaveData.find(d=>d.label===l.label)?.value||0}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:20,padding:"14px 18px",background:"rgba(99,102,241,0.04)",borderRadius:12,border:"1px solid rgba(99,102,241,0.1)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,color:"#64748b",fontWeight:600}}>Approval Rate</span>
                      <span style={{fontSize:16,fontWeight:800,color:"#6366f1"}}>
                        {leaveData.reduce((s,l)=>s+l.value,0)>0
                          ? Math.round((leaveData.find(d=>d.label==="Approved")?.value||0)/leaveData.reduce((s,l)=>s+l.value,0)*100)
                          : 0}%
                      </span>
                    </div>
                    <div style={{marginTop:8,height:6,background:"#f1f5f9",borderRadius:100,overflow:"hidden"}}>
                      <div style={{
                        height:"100%",background:"linear-gradient(90deg,#6366f1,#06b6d4)",borderRadius:100,
                        width:`${leaveData.reduce((s,l)=>s+l.value,0)>0?Math.round((leaveData.find(d=>d.label==="Approved")?.value||0)/leaveData.reduce((s,l)=>s+l.value,0)*100):0}%`,
                        transition:"width .8s cubic-bezier(.22,1,.36,1)"
                      }}/>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </>)}
      </div>
    </AdminLayout>
  );
};
export default Reports;
