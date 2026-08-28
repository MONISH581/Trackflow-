import React from "react";
import { useStore, UserInfo } from "../store.ts";
import {
  ClipboardCheck,
  Search,
  Plus,
  Calendar,
  UserPlus,
  LogOut,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  Activity,
  LogIn,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
} from "lucide-react";


export default function Attendance() {
  const {
    fetchApprovedStudents,
    quickAddStudent,
    fetchAttendance,
    saveAttendance,
    fetchActiveLabAccess,
    checkInStudent,
    checkOutStudent,
    addToast,
  } = useStore();

  const [activeTab, setActiveTab] = React.useState<"sheet" | "lab" | "register">("sheet");
  const [students, setStudents] = React.useState<UserInfo[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Daily Attendance States
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [attendanceSheet, setAttendanceSheet] = React.useState<Record<string, "Present" | "Absent">>({});
  const [attendanceSearch, setAttendanceSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
  const [savingAttendance, setSavingAttendance] = React.useState(false);


  // Lab Access States
  const [activeLabLogs, setActiveLabLogs] = React.useState<any[]>([]);
  const [labSearch, setLabSearch] = React.useState("");
  const [checkInStudentId, setCheckInStudentId] = React.useState("");
  const [checkingIn, setCheckingIn] = React.useState(false);

  // Quick Register States
  const [regName, setRegName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regDept, setRegDept] = React.useState("Computer Science");
  const [regYear, setRegYear] = React.useState("1");
  const [registering, setRegistering] = React.useState(false);

  const departments = [
    "Computer Science",
    "Information Technology",
    "Artificial Intelligence",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const studentList = await fetchApprovedStudents();
      setStudents(studentList);

      // Load attendance for selected date
      const attData = await fetchAttendance(selectedDate);
      const sheet: Record<string, "Present" | "Absent"> = {};
      
      // Default all loaded students to Present first
      studentList.forEach((s: any) => {
        const identifier = s.userId || s.id || s._id;
        sheet[identifier] = "Present";
      });
      
      // Override with saved records
      attData.forEach((rec: any) => {
        sheet[rec.studentId] = rec.status;
      });
      setAttendanceSheet(sheet);

      // Load lab logs
      const labLogs = await fetchActiveLabAccess();
      setActiveLabLogs(labLogs);
    } catch (e) {
      addToast("Failed to load attendance data", "error");
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Reload when tab changes to refresh live views
  React.useEffect(() => {
    if (activeTab === "lab") {
      fetchActiveLabAccess().then(setActiveLabLogs);
    } else if (activeTab === "sheet") {
      loadData();
    }
  }, [activeTab]);

  const handleToggleAttendance = async (studentId: string, status: "Present" | "Absent") => {
    // 1. Update local UI state immediately for responsiveness
    setAttendanceSheet(prev => {
      const newSheet = { ...prev, [studentId]: status };
      
      // 2. Automatically save the new sheet in the background so it persists
      const records = Object.entries(newSheet).map(([id, stat]) => ({
        studentId: id,
        status: stat as string
      }));
      saveAttendance(selectedDate, records).then(() => {
        // Optional: silently handle success or trigger a small toast if needed
      });
      
      return newSheet;
    });
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    const records = Object.entries(attendanceSheet).map(([studentId, status]) => ({
      studentId,
      status: status as string
    }));

    const success = await saveAttendance(selectedDate, records);
    if (success) {
      loadData();
    }
    setSavingAttendance(false);
  };

  const handleLabCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInStudentId) {
      addToast("Please select a student to check in.", "info");
      return;
    }
    setCheckingIn(true);
    const success = await checkInStudent(checkInStudentId);
    if (success) {
      setCheckInStudentId("");
      const logs = await fetchActiveLabAccess();
      setActiveLabLogs(logs);
    }
    setCheckingIn(false);
  };

  const handleLabCheckOut = async (studentId: string) => {
    const success = await checkOutStudent(studentId);
    if (success) {
      const logs = await fetchActiveLabAccess();
      setActiveLabLogs(logs);
    }
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.toLowerCase().endsWith("@srishakthi.ac.in")) {
      addToast("Student email must end with @srishakthi.ac.in", "error");
      return;
    }
    setRegistering(true);
    const success = await quickAddStudent({
      name: regName,
      email: regEmail,
      department: regDept,
      year: regYear,
    });
    if (success) {
      // Reset form
      setRegName("");
      setRegEmail("");
      setRegDept("Computer Science");
      setRegYear("1");
      // Reload students
      loadData();
      // Switch back to attendance or lab check-in
      setActiveTab("sheet");
    }
    setRegistering(false);
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      addToast("No student attendance data to export.", "info");
      return;
    }

    const headers = ["Register Number", "Student Name", "Email Address", "Department", "Academic Year", "Assigned Lab", "Attendance Date", "Status"];
    const rows = students.map((s: any) => {
      const identifier = s.userId || s.id || s._id;
      const status = attendanceSheet[identifier] || "Present";
      return [
        `"${s.registerNumber || 'N/A'}"`,
        `"${s.name || ''}"`,
        `"${s.email || ''}"`,
        `"${s.department || ''}"`,
        `"Year ${s.year || '1'}"`,
        `"${s.lab || 'N/A'}"`,
        `"${selectedDate}"`,
        `"${status}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TrackFlow_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported attendance log for ${selectedDate} (Google Sheets CSV format)`, "success");
  };

  const handleExportPDF = () => {
    if (students.length === 0) {
      addToast("No student attendance data to export.", "info");
      return;
    }

    let presentCount = 0;
    let absentCount = 0;

    const tableRows = students.map((s: any, index: number) => {
      const identifier = s.userId || s.id || s._id;
      const status = attendanceSheet[identifier] || "Present";
      if (status === "Present") presentCount++;
      else absentCount++;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center;">${index + 1}</td>
          <td style="padding: 10px; font-weight: bold;">${s.registerNumber || 'N/A'}</td>
          <td style="padding: 10px;">${s.name}</td>
          <td style="padding: 10px; color: #475569;">${s.email}</td>
          <td style="padding: 10px;">${s.department} (Yr ${s.year || 1})</td>
          <td style="padding: 10px;">${s.lab || 'N/A'}</td>
          <td style="padding: 10px; text-align: center; font-weight: bold; color: ${status === 'Present' ? '#059669' : '#dc2626'};">
            ${status.toUpperCase()}
          </td>
        </tr>
      `;
    }).join("");

    const totalStudents = students.length;
    const attendancePercentage = Math.round((presentCount / totalStudents) * 100);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TrackFlow AI - Attendance Record (${selectedDate})</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #1e293b; font-size: 24px; }
            .header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
            th { background: #0f172a; color: white; padding: 10px; text-align: left; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sri Shakthi Institute of Engineering & Technology</h1>
            <p>TrackFlow AI — Official Laboratory Attendance Record Log</p>
          </div>
          <div class="meta-grid">
            <div>
              <strong>Date of Record:</strong> ${selectedDate}<br>
              <strong>Total Enrolled Students:</strong> ${totalStudents}
            </div>
            <div>
              <strong>Present Count:</strong> <span style="color: #059669; font-weight: bold;">${presentCount}</span> | 
              <strong>Absent Count:</strong> <span style="color: #dc2626; font-weight: bold;">${absentCount}</span><br>
              <strong>Attendance Percentage:</strong> <span style="color: #2563eb; font-weight: bold;">${attendancePercentage}%</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
                <th>Register No</th>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Assigned Lab</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Generated automatically by TrackFlow AI System &bull; Sri Shakthi Institute of Engineering & Technology
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      addToast(`Opened PDF Print Record for ${selectedDate}`, "success");
    } else {
      addToast("Please allow pop-ups to generate PDF record.", "error");
    }
  };

  const presentCount = students.filter(s => {

    const identifier = s.userId || s.id || s._id;
    return (attendanceSheet[identifier] || "Present") === "Present";
  }).length;

  const absentCount = students.length - presentCount;
  const attendancePercentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const filteredAttendanceStudents = students.filter(s => {
    const identifier = s.userId || s.id || s._id;
    const status = attendanceSheet[identifier] || "Present";

    const matchesSearch = s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      (s.registerNumber && s.registerNumber.toLowerCase().includes(attendanceSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "PRESENT" && status !== "Present") return false;
    if (statusFilter === "ABSENT" && status !== "Absent") return false;
    return true;
  });

  const filteredLabLogs = activeLabLogs.filter(log =>
    log.studentName.toLowerCase().includes(labSearch.toLowerCase()) ||
    log.studentEmail.toLowerCase().includes(labSearch.toLowerCase())
  );


  // Filter students who are NOT currently checked into the lab
  const checkedInStudentIds = new Set(activeLabLogs.map(log => log.studentId));
  const checkInCandidates = students.filter(s => !checkedInStudentIds.has(s.userId));

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-blue-600" />
            Attendance & Lab Access Management
          </h2>
          <p className="text-sm text-slate-500 font-semibold mt-0.5">
            Take student attendance, manage check-in logs, and view active lab occupancy.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => setActiveTab("sheet")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "sheet"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Attendance Sheet
          </button>
          <button
            onClick={() => setActiveTab("lab")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "lab"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5 animate-pulse text-rose-500" />
            Active Lab Monitor ({activeLabLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "register"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Quick Register
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === "sheet" && (
        <div className="space-y-6">
          
          {/* Today's Attendance Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Present Today ({selectedDate})</span>
                <p className="text-2xl font-black text-emerald-800 mt-1">{presentCount} <span className="text-xs font-bold text-emerald-600">/ {students.length}</span></p>
                <span className="text-[11px] font-bold text-emerald-700">{attendancePercentage}% Attendance Rate</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Absent Today</span>
                <p className="text-2xl font-black text-rose-800 mt-1">{absentCount} <span className="text-xs font-bold text-rose-600">Students</span></p>
                <span className="text-[11px] font-bold text-rose-700">Requires Coordinator Follow-up</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                <XCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Total Enrolled</span>
                <p className="text-2xl font-black text-blue-900 mt-1">{students.length} <span className="text-xs font-bold text-blue-600">Students</span></p>
                <span className="text-[11px] font-bold text-blue-700">Seven Laboratories</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="glass-card p-5 border border-blue-200/40 grid grid-cols-1 md:grid-cols-3 gap-4 items-center shadow-sm">
            {/* Date selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Select Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer focus:outline-none focus:border-blue-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>


            {/* Search filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Search Students
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-4 md:pt-0 col-span-1 md:col-span-3 lg:col-span-1">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={students.length === 0}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow"
                title="Export formatted PDF record for printing/archiving"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>PDF Record</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={students.length === 0}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow"
                title="Export CSV compatible with Google Sheets & Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Google Sheets (.csv)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={savingAttendance || students.length === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
              >
                {savingAttendance ? (
                  <>Saving...</>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Log
                  </>
                )}
              </button>
            </div>
          </div>


          {/* Status Filter Tabs (Present Today / Absent / All) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter View:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    statusFilter === "ALL"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Enrolled ({students.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("PRESENT")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    statusFilter === "PRESENT"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Present Today ({presentCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("ABSENT")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    statusFilter === "ABSENT"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Absent Today ({absentCount})
                </button>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredAttendanceStudents.length} {statusFilter === "PRESENT" ? "Present" : (statusFilter === "ABSENT" ? "Absent" : "Total")} Student Records
            </span>
          </div>

          {/* Student Sheet Grid */}
          {filteredAttendanceStudents.length === 0 ? (
            <div className="glass-card p-12 text-center border border-blue-200/40">
              <Filter className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No students match your filter criteria.</p>
            </div>

          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAttendanceStudents.map((s: any) => {
                const identifier = s.userId || s.id || s._id;
                const status = attendanceSheet[identifier] || "Present";
                return (
                  <div
                    key={identifier}
                    className={`glass-card p-4 border flex flex-col justify-between shadow-sm transition-all ${
                      status === "Present"
                        ? "border-emerald-200 bg-emerald-50/10"
                        : "border-rose-200 bg-rose-50/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={s.avatar}
                        alt={s.name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                      />
                      <div className="min-w-0 text-left">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{s.name}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold truncate">{s.email}</p>
                        <p className="text-[10px] text-blue-600 font-bold mt-0.5">
                          {s.department} &bull; Yr {s.year}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleToggleAttendance(identifier, "Present"); }}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 ${
                          status === "Present"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleToggleAttendance(identifier, "Absent"); }}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 ${
                          status === "Absent"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "lab" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lab entry log (Check-in Control) */}
          <div className="glass-card p-5 border border-blue-200/40 text-left space-y-4 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <LogIn className="w-4 h-4 text-blue-600" />
              Lab Entry / Check-In
            </h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Scan student profile or select from the list below to check them into the workspace.
            </p>

            <form onSubmit={handleLabCheckIn} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Student Profile
                </label>
                <select
                  value={checkInStudentId}
                  onChange={(e) => setCheckInStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose student --</option>
                  {checkInCandidates.map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.department} - Yr {s.year})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={checkingIn || !checkInStudentId}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
              >
                {checkingIn ? (
                  <>Checking In...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Verify & Check In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active occupancy grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-5 border border-blue-200/40 flex items-center justify-between shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
                Who is currently accessing the lab?
              </h3>
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Filter checked-in..."
                  value={labSearch}
                  onChange={(e) => setLabSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {filteredLabLogs.length === 0 ? (
              <div className="glass-card p-12 text-center border border-dashed border-slate-200">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">Lab is Currently Empty</h4>
                <p className="text-xs text-slate-500 mt-1 font-semibold">No students are currently logged in to this workspace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLabLogs.map((log) => (
                  <div
                    key={log.id}
                    className="glass-card p-4 border border-blue-200 bg-white shadow-sm flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-xl" />
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {log.studentName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 text-left">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{log.studentName}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold truncate">{log.studentEmail}</p>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200/50 mt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          Checked-In at {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleLabCheckOut(log.studentId)}
                        className="px-3.5 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Check Out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "register" && (
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-6 border border-blue-200/40 text-left space-y-6 shadow-md relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl" />

            <div className="space-y-1 pb-2 border-b border-slate-200 border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Quick Student Profile Registration
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Register a new student immediately. Registered student profiles are pre-approved and placed directly into the workplace database.
              </p>
            </div>

            <form onSubmit={handleQuickRegister} className="space-y-4 relative z-10">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter student full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. name@srishakthi.ac.in"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-[9px] text-blue-600 font-medium">
                  * Must be an official college email ending with @srishakthi.ac.in
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Academic Year
                  </label>
                  <select
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={registering || !regName || !regEmail}
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all duration-200 shadow-md shadow-blue-500/10 glow-btn flex items-center justify-center gap-1.5"
              >
                {registering ? (
                  <>Registering Student...</>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register and Pre-Approve Student
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
