import React from "react";
import { useStore } from "../store.ts";
import {
  Shield,
  Users,
  Briefcase,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
  Building,
  FileText,
  AlertTriangle,
  Cpu,
} from "lucide-react";

export default function MasterControl() {
  const { fetchMasterControlOverview, lockStudentUser, unlockStudentUser, addToast } = useStore();

  const [overview, setOverview] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedLab, setSelectedLab] = React.useState<string | "ALL">("ALL");
  const [lockModalUser, setLockModalUser] = React.useState<any>(null);
  const [lockReason, setLockReason] = React.useState("");

  const OFFICIAL_LABS = [
    "Artificial Intelligence and Research Lab",
    "Cyber Security / Cloud Computing Lab",
    "AR/VR Lab",
    "IoT (Internet of Things) Lab",
    "PCB Lab",
    "Robotics Lab"
  ];

  const loadData = async () => {
    setLoading(true);
    const data = await fetchMasterControlOverview();
    if (data) setOverview(data);
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleLock = async (userId: string) => {
    const success = await lockStudentUser(userId, lockReason || "Expired project / Administrative Lock");
    if (success) {
      setLockModalUser(null);
      setLockReason("");
      loadData();
    }
  };

  const handleUnlock = async (userId: string) => {
    const success = await unlockStudentUser(userId);
    if (success) {
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          Loading Master Control 6-Lab Metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            Master Control Center • Sathish Sir
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">TrackFlow AI – 6 Lab Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-lab monitoring, project locking, milestone auditing, and student administration.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow"
        >
          Refresh Live Metrics
        </button>
      </div>

      {/* System Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Labs</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{overview?.totalLabs || 6}</p>
          <span className="text-[10px] text-slate-500 font-medium">Official Labs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Students</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{overview?.totalStudents || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Enrolled Students</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Projects</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{overview?.totalProjects || 0}</p>
          <span className="text-[10px] text-emerald-600 font-bold">{overview?.activeProjects || 0} Active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Locked Projs</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{overview?.lockedProjects || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Milestone / Expired</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Locked Users</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600">{overview?.lockedStudents || 0}</p>
          <span className="text-[10px] text-rose-600 font-bold">Access Restricted</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Reports</span>
            <FileText className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{overview?.totalDailyReports || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Total Daily Reports</span>
        </div>
      </div>

      {/* Lab Filter Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Six Labs Command Filter</h2>
          <p className="text-xs text-slate-500">Select a specific lab to inspect records, projects, and attendance</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              selectedLab === "ALL"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            All 6 Labs Overview
          </button>
          {OFFICIAL_LABS.map((lab) => (
            <button
              key={lab}
              onClick={() => setSelectedLab(lab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                selectedLab === lab
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {lab.replace(" (Internet of Things)", "")}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Labs Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {OFFICIAL_LABS.filter((lab) => selectedLab === "ALL" || selectedLab === lab).map((labName) => {
          const labData = overview?.labSummaries?.[labName] || {};
          return (
            <div key={labName} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Official Lab
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{labName}</h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500">Enrolled Students:</span>
                  <p className="font-bold text-slate-800 text-sm">{labData.totalStudents || 0}</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Projects:</span>
                  <p className="font-bold text-slate-800 text-sm">{labData.totalProjects || 0}</p>
                </div>
                <div>
                  <span className="text-slate-500">Active Projects:</span>
                  <p className="font-bold text-emerald-600 text-sm">{labData.activeProjects || 0}</p>
                </div>
                <div>
                  <span className="text-slate-500">Locked / Expired:</span>
                  <p className="font-bold text-amber-600 text-sm">{labData.lockedProjects || 0}</p>
                </div>
                <div>
                  <span className="text-slate-500">Attendance Today:</span>
                  <p className="font-bold text-blue-600 text-sm">{labData.attendanceToday || 0} Present</p>
                </div>
                <div>
                  <span className="text-slate-500">Submitted Reports:</span>
                  <p className="font-bold text-slate-800 text-sm">{labData.totalReports || 0}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
