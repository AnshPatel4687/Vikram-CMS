// src/utils/exportUtils.js
// ─────────────────────────────────────────────────────────────────────────────
//  Professional PDF + Excel export utilities for CompanyMS
// ─────────────────────────────────────────────────────────────────────────────

// ─── LIBRARY LOADERS ─────────────────────────────────────────────────────────
const loadScript = (src, checkFn) =>
  new Promise((resolve, reject) => {
    if (checkFn()) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

const loadJsPDF = () =>
  loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    () => !!window.jspdf
  ).then(() => window.jspdf.jsPDF);

const loadAutoTable = () =>
  loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
    () => !!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.prototype.autoTable)
  );

const loadXLSX = () =>
  loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    () => !!window.XLSX
  ).then(() => window.XLSX);

// ─── COLOR HELPERS ───────────────────────────────────────────────────────────
const hex2rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const lighten = (rgb, amt) => rgb.map((v) => Math.min(255, v + amt));
const darken  = (rgb, amt) => rgb.map((v) => Math.max(0,   v - amt));

// ─── CORE PDF ENGINE ─────────────────────────────────────────────────────────
export const exportToPDF = async ({
  filename,
  reportType = "REPORT",
  title,
  subtitle = "",
  accentColor = "#4f46e5",
  stats = [],
  headers,
  rows,
}) => {
  const jsPDF = await loadJsPDF();
  await loadAutoTable();

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const A   = hex2rgb(accentColor);
  const AL  = lighten(A, 185);
  const AD  = darken(A, 20);
  const SLATE = [30, 41, 59];
  const GRAY  = [100, 116, 139];
  const LGRAY = [226, 232, 240];
  const WHITE = [255, 255, 255];
  const BGPAGE = [245, 247, 250];

  doc.setFillColor(...BGPAGE);
  doc.rect(0, 0, W, H, "F");

  doc.setFillColor(...A);
  doc.rect(0, 0, W, 3, "F");

  const HDR_H = 38;
  doc.setFillColor(...WHITE);
  doc.rect(0, 3, W, HDR_H, "F");

  doc.setFillColor(...A);
  doc.rect(0, 3, 5, HDR_H, "F");

  doc.setFillColor(...A);
  doc.roundedRect(12, 9, 22, 22, 3, 3, "F");
  doc.setFillColor(...lighten(A, 80));
  doc.circle(16, 13, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text("CMS", 23, 24, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("COMPANY MANAGEMENT SYSTEM", 40, 14);

  doc.setFillColor(...AL);
  doc.roundedRect(40, 16, 54, 6, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...A);
  doc.text(reportType, 67, 20.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...SLATE);
  doc.text(title, 40, 31);

  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.35);
  doc.line(40, 34, W - 10, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(subtitle || "All records  •  CompanyMS", 40, 38.5);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  doc.setFillColor(...BGPAGE);
  doc.roundedRect(W - 68, 8, 58, 26, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text("GENERATED ON", W - 39, 16, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(dateStr, W - 39, 22, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(timeStr, W - 39, 27, { align: "center" });

  let yPos = 3 + HDR_H + 6;

  if (stats.length > 0) {
    const CARD_GAP = 5;
    const CARD_H   = 24;
    const CARD_W   = (W - 20 - CARD_GAP * (stats.length - 1)) / stats.length;

    stats.forEach((stat, i) => {
      const x = 10 + i * (CARD_W + CARD_GAP);

      doc.setFillColor(210, 215, 225);
      doc.roundedRect(x + 0.8, yPos + 0.8, CARD_W, CARD_H, 3, 3, "F");

      doc.setFillColor(...WHITE);
      doc.roundedRect(x, yPos, CARD_W, CARD_H, 3, 3, "F");

      doc.setFillColor(...A);
      doc.roundedRect(x, yPos, CARD_W, 4, 3, 3, "F");
      doc.rect(x, yPos + 2, CARD_W, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...SLATE);
      doc.text(String(stat.value), x + CARD_W / 2, yPos + 14.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(...GRAY);
      doc.text(stat.label.toUpperCase(), x + CARD_W / 2, yPos + 20.5, { align: "center" });
    });

    yPos += CARD_H + 7;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("DATA TABLE", 10, yPos + 2.5);
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.line(32, yPos + 1.5, W - 10, yPos + 1.5);
  yPos += 6;

  doc.autoTable({
    startY: yPos,
    head: [headers],
    body: rows,
    margin: { left: 10, right: 10 },
    tableLineColor: LGRAY,
    tableLineWidth: 0.3,
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 7, right: 7 },
      textColor: SLATE,
      lineColor: LGRAY,
      lineWidth: 0.25,
      font: "helvetica",
    },
    headStyles: {
      fillColor: A,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
      cellPadding: { top: 6, bottom: 6, left: 7, right: 7 },
    },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    bodyStyles: { fillColor: WHITE },
    columnStyles: {
      0: { halign: "center", cellWidth: 18, fontStyle: "bold" },
    },
    didDrawPage: (data) => {
      const pg = data.pageNumber;
      const total = doc.internal.getNumberOfPages();

      doc.setFillColor(...WHITE);
      doc.rect(0, H - 12, W, 12, "F");
      doc.setFillColor(...A);
      doc.rect(0, H - 12, W, 1.2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text("CompanyMS  •  Confidential", 10, H - 5);

      doc.setFillColor(...AL);
      doc.roundedRect(W / 2 - 14, H - 9.5, 28, 6, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...A);
      doc.text(`Page ${pg} of ${total}`, W / 2, H - 5.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(`${title}  •  ${reportType}`, W - 10, H - 5, { align: "right" });
    },
  });

  doc.save(`${filename}.pdf`);
};

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
export const exportToExcel = async (filename, sheetName, headers, rows) => {
  const XLSX = await loadXLSX();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// ─── PAGE-SPECIFIC EXPORTS ───────────────────────────────────────────────────

// ── Admin: Employees ─────────────────────────────────────────────────────────
export const exportEmployeesPDF = (employees) => {
  const d = (dept) => employees.filter((e) => e.department === dept).length;
  return exportToPDF({
    filename: `employees_${new Date().toISOString().slice(0, 10)}`,
    reportType: "EMPLOYEE REPORT",
    title: "Employee Management",
    subtitle: `${employees.length} active employees  •  All departments`,
    accentColor: "#4f46e5",
    stats: [
      { label: "Total Employees", value: employees.length },
      { label: "IT",              value: d("IT") },
      { label: "Finance",         value: d("Finance") },
      { label: "Marketing",       value: d("Marketing") },
      { label: "Sales",           value: d("Sales") },
      { label: "Operations",      value: d("Operations") },
    ],
    headers: ["Emp ID", "Name", "Email", "Department", "Phone", "Salary (Rs.)", "Join Date"],
    rows: employees.map((e) => [
      e.employeeId || "—",
      e.name,
      e.email,
      e.department,
      e.phone,
      `Rs. ${Number(e.salary).toLocaleString("en-IN")}`,
      e.joinDate,
    ]),
  });
};

export const exportEmployeesExcel = (employees) =>
  exportToExcel(
    `employees_${new Date().toISOString().slice(0, 10)}`,
    "Employees",
    ["Emp ID", "Name", "Email", "Department", "Phone", "Salary (Rs.)", "Join Date"],
    employees.map((e) => [
      e.employeeId || "—",
      e.name,
      e.email,
      e.department,
      e.phone,
      Number(e.salary),
      e.joinDate,
    ])
  );

// ── Admin: Projects ───────────────────────────────────────────────────────────
export const exportProjectsPDF = (projects, employees) => {
  const getNames = (ids) =>
    (ids || [])
      .map((id) => {
        const e = employees.find((e) => e.id === id);
        return e ? (e.employeeId ? `${e.employeeId} - ${e.name}` : e.name) : "Unknown";
      })
      .join(", ") || "None";

  const s = (st) => projects.filter((p) => p.status === st).length;
  return exportToPDF({
    filename: `projects_${new Date().toISOString().slice(0, 10)}`,
    reportType: "PROJECT REPORT",
    title: "Project Management",
    subtitle: `${projects.length} projects  •  All statuses`,
    accentColor: "#0891b2",
    stats: [
      { label: "Total",     value: projects.length },
      { label: "Active",    value: s("active") },
      { label: "Completed", value: s("completed") },
      { label: "On Hold",   value: s("on-hold") },
    ],
    headers: ["#", "Project Name", "Description", "Status", "Deadline", "Assigned To"],
    rows: projects.map((p, i) => [
      i + 1,
      p.name,
      p.description?.length > 55 ? p.description.slice(0, 55) + "…" : p.description,
      p.status,
      p.deadline,
      getNames(p.assignedTo),
    ]),
  });
};

export const exportProjectsExcel = (projects, employees) => {
  const getNames = (ids) =>
    (ids || [])
      .map((id) => {
        const e = employees.find((e) => e.id === id);
        return e ? (e.employeeId ? `${e.employeeId} - ${e.name}` : e.name) : "Unknown";
      })
      .join(", ") || "None";

  return exportToExcel(
    `projects_${new Date().toISOString().slice(0, 10)}`,
    "Projects",
    ["#", "Project Name", "Description", "Status", "Deadline", "Assigned To"],
    projects.map((p, i) => [i + 1, p.name, p.description, p.status, p.deadline, getNames(p.assignedTo)])
  );
};

// ── Admin: Attendance ─────────────────────────────────────────────────────────
export const exportAttendancePDF = (employees, attendanceData, selectedDate) => {
  const c = (s) => Object.values(attendanceData).filter((v) => v === s).length;
  return exportToPDF({
    filename: `attendance_${selectedDate}`,
    reportType: "ATTENDANCE REPORT",
    title: "Attendance Management",
    subtitle: `Date: ${selectedDate}  •  ${employees.length} employees`,
    accentColor: "#16a34a",
    stats: [
      { label: "Present",    value: c("present") },
      { label: "Absent",     value: c("absent") },
      { label: "Late",       value: c("late") },
      { label: "Not Marked", value: employees.length - Object.keys(attendanceData).length },
      { label: "Total",      value: employees.length },
    ],
    headers: ["Emp ID", "Employee Name", "Department", "Status"],
    rows: employees.map((e) => [
      e.employeeId || "—",
      e.name,
      e.department,
      attendanceData[e.id] || "Not Marked",
    ]),
  });
};

export const exportAttendanceExcel = (employees, attendanceData, selectedDate) =>
  exportToExcel(
    `attendance_${selectedDate}`,
    "Attendance",
    ["Emp ID", "Employee Name", "Department", "Status", "Date"],
    employees.map((e) => [
      e.employeeId || "—",
      e.name,
      e.department,
      attendanceData[e.id] || "Not Marked",
      selectedDate,
    ])
  );

// ── Admin: Payroll ────────────────────────────────────────────────────────────
export const exportPayrollPDF = (employees, payrolls, selectedMonth) => {
  const paid    = Object.values(payrolls).filter((p) => p.status === "paid").length;
  const pending = Object.values(payrolls).filter((p) => p.status === "pending").length;
  const total   = Object.values(payrolls).reduce((s, p) => s + (p.netSalary || 0), 0);
  return exportToPDF({
    filename: `payroll_${selectedMonth}`,
    reportType: "PAYROLL REPORT",
    title: "Payroll Management",
    subtitle: `Month: ${selectedMonth}  •  ${employees.length} employees`,
    accentColor: "#d97706",
    stats: [
      { label: "Paid",          value: paid },
      { label: "Pending",       value: pending },
      { label: "Not Generated", value: employees.length - paid - pending },
      { label: "Total Payout",  value: `Rs. ${total.toLocaleString("en-IN")}` },
    ],
    headers: ["Emp ID", "Employee", "Department", "Basic (Rs.)", "Bonus (Rs.)", "Deduction (Rs.)", "Net Salary (Rs.)", "Status"],
    rows: employees.map((e) => {
      const p = payrolls[e.id];
      return [
        e.employeeId || "—",
        e.name,
        e.department,
        `Rs. ${Number(e.salary).toLocaleString("en-IN")}`,
        p ? `Rs. ${Number(p.bonus).toLocaleString("en-IN")}` : "—",
        p ? `Rs. ${Number(p.deduction).toLocaleString("en-IN")}` : "—",
        p ? `Rs. ${Number(p.netSalary).toLocaleString("en-IN")}` : "—",
        p ? p.status : "Not Generated",
      ];
    }),
  });
};

export const exportPayrollExcel = (employees, payrolls, selectedMonth) =>
  exportToExcel(
    `payroll_${selectedMonth}`,
    "Payroll",
    ["Emp ID", "Employee", "Department", "Basic Salary", "Bonus", "Deduction", "Net Salary", "Status", "Month"],
    employees.map((e) => {
      const p = payrolls[e.id];
      return [
        e.employeeId || "—",
        e.name,
        e.department,
        Number(e.salary),
        p ? Number(p.bonus) : 0,
        p ? Number(p.deduction) : 0,
        p ? Number(p.netSalary) : 0,
        p ? p.status : "Not Generated",
        selectedMonth,
      ];
    })
  );

// ── Admin: Leaves ─────────────────────────────────────────────────────────────
export const exportLeavesPDF = (leaves, usersMap = {}) => {
  const s = (st) => leaves.filter((l) => l.status === st).length;
  return exportToPDF({
    filename: `leaves_${new Date().toISOString().slice(0, 10)}`,
    reportType: "LEAVE REPORT",
    title: "Leave Management",
    subtitle: `${leaves.length} leave requests  •  All statuses`,
    accentColor: "#7c3aed",
    stats: [
      { label: "Total",    value: leaves.length },
      { label: "Pending",  value: s("pending") },
      { label: "Approved", value: s("approved") },
      { label: "Rejected", value: s("rejected") },
    ],
    headers: ["Emp ID", "Employee", "Department", "Type", "From", "To", "Days", "Reason", "Status"],
    rows: leaves.map((l) => [
      l.employeeId || usersMap[l.userId]?.employeeId || "—",
      l.userName,
      l.department || "—",
      l.type,
      l.from,
      l.to,
      l.days,
      l.reason?.length > 35 ? l.reason.slice(0, 35) + "…" : l.reason,
      l.status,
    ]),
  });
};

export const exportLeavesExcel = (leaves, usersMap = {}) =>
  exportToExcel(
    `leaves_${new Date().toISOString().slice(0, 10)}`,
    "Leaves",
    ["Emp ID", "Employee", "Department", "Type", "From", "To", "Days", "Reason", "Status"],
    leaves.map((l) => [
      l.employeeId || usersMap[l.userId]?.employeeId || "—",
      l.userName,
      l.department || "—",
      l.type,
      l.from,
      l.to,
      l.days,
      l.reason,
      l.status,
    ])
  );

// ─── EMPLOYEE PANEL EXPORTS ───────────────────────────────────────────────────

// ── My Projects (Employee) ────────────────────────────────────────────────────
export const exportEmpProjectsPDF = (projects, userName, employeeId = "") => {
  const s = (st) => projects.filter((p) => p.status === st).length;
  return exportToPDF({
    filename: `my_projects_${new Date().toISOString().slice(0, 10)}`,
    reportType: "MY PROJECTS REPORT",
    title: "My Projects",
    subtitle: `${employeeId ? employeeId + "  •  " : ""}${userName}  •  ${projects.length} projects assigned`,
    accentColor: "#0891b2",
    stats: [
      { label: "Total Assigned", value: projects.length },
      { label: "Active",         value: s("active") },
      { label: "Completed",      value: s("completed") },
      { label: "On Hold",        value: s("on-hold") },
    ],
    headers: ["#", "Project Name", "Description", "Status", "Deadline"],
    rows: projects.map((p, i) => [
      i + 1,
      p.name,
      p.description?.length > 60 ? p.description.slice(0, 60) + "..." : p.description,
      p.status,
      p.deadline,
    ]),
  });
};

export const exportEmpProjectsExcel = (projects, userName, employeeId = "") =>
  exportToExcel(
    `my_projects_${new Date().toISOString().slice(0, 10)}`,
    "My Projects",
    ["#", "Project Name", "Description", "Status", "Deadline"],
    projects.map((p, i) => [i + 1, p.name, p.description, p.status, p.deadline])
  );

// ── My Attendance (Employee) ──────────────────────────────────────────────────
export const exportEmpAttendancePDF = (attendance, stats, userName, employeeId = "") => {
  const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  return exportToPDF({
    filename: `my_attendance_${new Date().toISOString().slice(0, 10)}`,
    reportType: "MY ATTENDANCE REPORT",
    title: "My Attendance",
    subtitle: `${employeeId ? employeeId + "  •  " : ""}${userName}  •  All records`,
    accentColor: "#16a34a",
    stats: [
      { label: "Present",      value: stats.present },
      { label: "Absent",       value: stats.absent },
      { label: "Late",         value: stats.late },
      { label: "Attendance %", value: `${pct}%` },
    ],
    headers: ["#", "Date", "Day", "Status"],
    rows: attendance.map((r, i) => [
      i + 1,
      r.date,
      new Date(r.date).toLocaleDateString("en-IN", { weekday: "long" }),
      r.status,
    ]),
  });
};

export const exportEmpAttendanceExcel = (attendance, userName, employeeId = "") =>
  exportToExcel(
    `my_attendance_${new Date().toISOString().slice(0, 10)}`,
    "My Attendance",
    ["#", "Date", "Day", "Status"],
    attendance.map((r, i) => [
      i + 1,
      r.date,
      new Date(r.date).toLocaleDateString("en-IN", { weekday: "long" }),
      r.status,
    ])
  );

// ── My Salary (Employee) ──────────────────────────────────────────────────────
export const exportEmpSalaryPDF = (payrolls, userData) => {
  const totalEarned    = payrolls.filter((p) => p.status === "paid").reduce((s, p) => s + (p.netSalary || 0), 0);
  const totalBonus     = payrolls.reduce((s, p) => s + (p.bonus || 0), 0);
  const totalDeduction = payrolls.reduce((s, p) => s + (p.deduction || 0), 0);
  return exportToPDF({
    filename: `my_salary_${new Date().toISOString().slice(0, 10)}`,
    reportType: "MY SALARY REPORT",
    title: "My Salary History",
    subtitle: `${userData?.employeeId ? userData.employeeId + "  •  " : ""}${userData?.name || ""}  •  ${userData?.department || ""}`,
    accentColor: "#7c3aed",
    stats: [
      { label: "Emp ID",           value: userData?.employeeId || "—" },
      { label: "Basic Salary",     value: `Rs. ${Number(userData?.salary || 0).toLocaleString("en-IN")}` },
      { label: "Total Earned",     value: `Rs. ${totalEarned.toLocaleString("en-IN")}` },
      { label: "Total Bonus",      value: `Rs. ${totalBonus.toLocaleString("en-IN")}` },
      { label: "Total Deductions", value: `Rs. ${totalDeduction.toLocaleString("en-IN")}` },
    ],
    headers: ["#", "Month", "Basic (Rs.)", "Bonus (Rs.)", "Deduction (Rs.)", "Net Salary (Rs.)", "Note", "Status"],
    rows: payrolls.map((p, i) => [
      i + 1,
      p.month,
      `Rs. ${Number(p.basicSalary).toLocaleString("en-IN")}`,
      `Rs. ${Number(p.bonus || 0).toLocaleString("en-IN")}`,
      `Rs. ${Number(p.deduction || 0).toLocaleString("en-IN")}`,
      `Rs. ${Number(p.netSalary).toLocaleString("en-IN")}`,
      p.note || "—",
      p.status,
    ]),
  });
};

export const exportEmpSalaryExcel = (payrolls, userData) =>
  exportToExcel(
    `my_salary_${new Date().toISOString().slice(0, 10)}`,
    "My Salary",
    ["Emp ID", "Month", "Basic Salary", "Bonus", "Deduction", "Net Salary", "Note", "Status"],
    payrolls.map((p, i) => [
      userData?.employeeId || "—",
      p.month,
      Number(p.basicSalary),
      Number(p.bonus || 0),
      Number(p.deduction || 0),
      Number(p.netSalary),
      p.note || "—",
      p.status,
    ])
  );