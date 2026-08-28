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
  UserPlus,
  Trash2,
  UserCheck,
  X,
  Mail,
  ShieldCheck
} from "lucide-react";

export default function MasterControl() {
  const { fetchMasterControlOverview, fetchMasterUsers, addMasterAdmin, approveCoordinator, deleteUser, lockStudentUser, unlockStudentUser, addToast } = useStore();

  const [overview, setOverview] = React.useState<any>(null);
  const [usersData, setUsersData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedLab, setSelectedLab] = React.useState<string | "ALL">("ALL");

  // New Master Form State
  const [newMasterName, setNewMasterName] = React.useState("");
  const [newMasterEmail, setNewMasterEmail] = React.useState("");
  const [addingMaster, setAddingMaster] = React.useState(false);

  // Directory filter state
  const [directoryRole, setDirectoryRole] = React.useState<"masters" | "coordinators" | "pending" | "students">("pending");

  const OFFICIAL_LABS = [
    "Artificial Intelligence and Research Lab",
    "Cyber Security / Cloud Computing Lab",
    "AR/VR Lab",
    "IoT (Internet of Things) Lab",
    "PCB Lab",
    "Robotics Lab",
    "VLSI Lab"
  ];

  const loadData = async () => {
    setLoading(true);
    const data = await fetchMasterControlOverview();
    if (data) setOverview(data);
    const uData = await fetchMasterUsers();
    if (uData) setUsersData(uData);
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleAddMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterEmail || !newMasterName) {
      addToast("Please fill in both Name and Email for the new Master Admin.", "error");
      return;
    }
    setAddingMaster(true);
    const success = await addMasterAdmin(newMasterName, newMasterEmail);
    if (success) {
      setNewMasterName("");
      setNewMasterEmail("");
      loadData();
    }
    setAddingMaster(false);
  };

  const handleApproveTeacher = async (userId: string, approve: boolean) => {
    const success = await approveCoordinator(userId, approve);
    if (success) {
      loadData();
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from TrackFlow?`)) {
      const success = await deleteUser(userId);
      if (success) {
        loadData();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          Loading Master Control Live Directory...
        </div>
      </div>
    );
  }

  const pendingTeachers = usersData?.pendingCoordinators || [];
  const approvedTeachers = usersData?.coordinators || [];
  const mastersList = usersData?.masters || [];
  const studentsList = usersData?.students || [];

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Master Control Center &bull; Sathish
          </div>
          <h1 className="text-3xl font-black tracking-tight">TrackFlow AI – 7 Lab Command Center</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Authorize Teacher/Admin access, assign Master credentials, manage enrollment, and oversee live lab projects.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/20"
        >
          Refresh Live Metrics
        </button>
      </div>

      {/* Pending Teacher / Admin Registrations Alert Box */}
      {pendingTeachers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/40 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 animate-pulse text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {pendingTeachers.length} Pending Teacher / Admin Registration{pendingTeachers.length > 1 ? "s" : ""}
                </h3>
                <p className="text-xs text-slate-600">
                  Teachers registered on TrackFlow waiting for Master Sathish approval.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {pendingTeachers.map((teacher: any) => (
              <div key={teacher.userId || teacher.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <img src={teacher.avatar || `https://avatar.vercel.sh/${teacher.email}`} alt={teacher.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">{teacher.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{teacher.email}</p>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {teacher.department || "Teacher"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleApproveTeacher(teacher.userId || teacher.id, false)}
                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleApproveTeacher(teacher.userId || teacher.id, true)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Approve Teacher
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Another Master Admin Card */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-purple-200/60 p-6 md:p-8 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Add Another Master Admin</h3>
            <p className="text-xs text-slate-500">
              Only existing Master Admins can assign Master Control privileges to new admin team members.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddMaster} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <input
            type="text"
            required
            placeholder="Master Admin Full Name"
            value={newMasterName}
            onChange={(e) => setNewMasterName(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600"
          />
          <input
            type="email"
            required
            placeholder="Official Email (e.g. master2@srishakthi.ac.in)"
            value={newMasterEmail}
            onChange={(e) => setNewMasterEmail(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600"
          />
          <button
            type="submit"
            disabled={addingMaster}
            className="py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/20 transition cursor-pointer disabled:opacity-50"
          >
            {addingMaster ? "Creating Master..." : "Assign Master Admin"}
          </button>
        </form>
      </div>

      {/* Directory Tab Selector */}
      <div className="glass-card bg-white p-6 rounded-3xl border border-blue-200/60 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Master Platform Directory</h2>
            <p className="text-xs text-slate-500">View and manage all registered Master Admins, Teachers, and Students.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDirectoryRole("pending")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                directoryRole === "pending"
                  ? "bg-amber-500 text-white border-amber-500 font-extrabold"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Pending Teachers ({pendingTeachers.length})
            </button>
            <button
              onClick={() => setDirectoryRole("coordinators")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                directoryRole === "coordinators"
                  ? "bg-blue-600 text-white border-blue-600 font-extrabold"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Teachers / Admins ({approvedTeachers.length})
            </button>
            <button
              onClick={() => setDirectoryRole("masters")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                directoryRole === "masters"
                  ? "bg-purple-600 text-white border-purple-600 font-extrabold"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Master Admins ({mastersList.length})
            </button>
            <button
              onClick={() => setDirectoryRole("students")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                directoryRole === "students"
                  ? "bg-slate-900 text-white border-slate-900 font-extrabold"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Students ({studentsList.length})
            </button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {directoryRole === "pending" && (
            pendingTeachers.length === 0 ? (
              <p className="text-xs text-slate-400 col-span-3 text-center py-6">No pending teacher registration requests.</p>
            ) : (
              pendingTeachers.map((user: any) => (
                <div key={user.userId || user.id} className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{user.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleApproveTeacher(user.userId || user.id, true)}
                      className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {directoryRole === "coordinators" && (
            approvedTeachers.length === 0 ? (
              <p className="text-xs text-slate-400 col-span-3 text-center py-6">No approved teachers yet.</p>
            ) : (
              approvedTeachers.map((user: any) => (
                <div key={user.userId || user.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{user.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Admin Teacher</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.userId || user.id, user.name)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )
          )}

          {directoryRole === "masters" && (
            mastersList.map((user: any) => (
              <div key={user.userId || user.id} className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">{user.name}</h4>
                    <p className="text-[11px] text-purple-700 truncate">{user.email}</p>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Master Controller</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {directoryRole === "students" && (
            studentsList.length === 0 ? (
              <p className="text-xs text-slate-400 col-span-3 text-center py-6">No enrolled students.</p>
            ) : (
              studentsList.map((user: any) => (
                <div key={user.userId || user.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{user.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">Reg: {user.registerNumber || "Pending"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.userId || user.id, user.name)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* System Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Labs</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{overview?.totalLabs || 7}</p>
          <span className="text-[10px] text-slate-500 font-medium">Official Labs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Students</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{studentsList.length}</p>
          <span className="text-[10px] text-slate-500 font-medium">Enrolled Students</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Teachers</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{approvedTeachers.length}</p>
          <span className="text-[10px] text-purple-600 font-bold">{pendingTeachers.length} Pending</span>
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
    </div>
  );
}
