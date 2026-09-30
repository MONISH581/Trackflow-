import React from "react";
import { Link } from "react-router-dom";
import { useStore, HackathonMappingInfo } from "../store.ts";
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
  ShieldCheck,
  Target,
  Award,
  Calendar,
  Layers,
  Flag,
  Search,
  Edit3,
  Save,
  CheckCircle2
} from "lucide-react";

export default function MasterControl() {
  const { 
    currentUser, 
    fetchMasterControlOverview, 
    fetchMasterUsers, 
    fetchHackathonMappings,
    updateHackathonMapping,
    addMasterAdmin, 
    approveCoordinator, 
    deleteUser, 
    addToast 
  } = useStore();

  const [overview, setOverview] = React.useState<any>(null);
  const [usersData, setUsersData] = React.useState<any>(null);
  const [mappings, setMappings] = React.useState<HackathonMappingInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedLab, setSelectedLab] = React.useState<string | "ALL">("ALL");
  const [mappingsSearch, setMappingsSearch] = React.useState("");

  // Master Remark Inline Edit State
  const [editingMappingKey, setEditingMappingKey] = React.useState<string | null>(null);
  const [masterRemarkDraft, setMasterRemarkDraft] = React.useState("");
  const [savingRemark, setSavingRemark] = React.useState(false);

  // New Master Form State
  const [newMasterName, setNewMasterName] = React.useState("");
  const [newMasterEmail, setNewMasterEmail] = React.useState("");
  const [addingMaster, setAddingMaster] = React.useState(false);

  // Directory filter state
  const [directoryRole, setDirectoryRole] = React.useState<"pending" | "coordinators" | "masters" | "students" | "hackathons">("pending");

  const OFFICIAL_LABS = [
    "Artificial Intelligence and Research Lab",
    "Cyber Security / Cloud Computing Lab",
    "AR/VR Lab",
    "IoT (Internet of Things) Lab",
    "PCB Lab",
    "Robotics Lab",
    "VLSI Lab"
  ];

  // Strictly Master Admin Only
  if (currentUser?.role !== 'master_admin') {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-sm max-w-lg mx-auto mt-12 space-y-3">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-500">Master Control is strictly restricted to Master Admin accounts.</p>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    const data = await fetchMasterControlOverview();
    if (data) setOverview(data);
    const uData = await fetchMasterUsers();
    if (uData) setUsersData(uData);
    const mData = await fetchHackathonMappings(undefined, undefined, selectedLab === "ALL" ? undefined : selectedLab);
    if (mData) setMappings(mData);
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  React.useEffect(() => {
    fetchHackathonMappings(undefined, undefined, selectedLab === "ALL" ? undefined : selectedLab).then(setMappings);
  }, [selectedLab]);

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

  const handleSaveMasterRemark = async (studentId: string, hackathonId: string) => {
    setSavingRemark(true);
    const success = await updateHackathonMapping({
      studentId,
      hackathonId,
      masterRemarks: masterRemarkDraft
    });
    if (success) {
      setEditingMappingKey(null);
      const updated = await fetchHackathonMappings(undefined, undefined, selectedLab === "ALL" ? undefined : selectedLab);
      setMappings(updated);
    }
    setSavingRemark(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[280px] sm:min-h-[450px]">
        <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          Loading Master Control Live Directory & 7-Lab Overview...
        </div>
      </div>
    );
  }

  const pendingTeachers = usersData?.pendingCoordinators || [];
  const approvedTeachers = usersData?.coordinators || [];
  const mastersList = usersData?.masters || [];
  const studentsList = usersData?.students || [];

  const filteredMappings = mappings.filter(m => {
    const matchLab = selectedLab === "ALL" || m.studentLab === selectedLab;
    if (!matchLab) return false;
    if (!mappingsSearch.trim()) return true;
    const q = mappingsSearch.toLowerCase();
    return (
      (m.studentName || "").toLowerCase().includes(q) ||
      (m.studentEmail || "").toLowerCase().includes(q) ||
      (m.registerNumber || "").toLowerCase().includes(q) ||
      (m.hackathonName || "").toLowerCase().includes(q) ||
      (m.teamId || "").toLowerCase().includes(q) ||
      (m.projectName || "").toLowerCase().includes(q)
    );
  });

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
            Authorize Teacher/Admin access, assign Master credentials, manage enrollment, and oversee 7-lab hackathon mappings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <Link
            to="/admin/command-center"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer shadow-lg shadow-purple-500/25 flex items-center gap-2"
          >
            <Target className="w-4 h-4 text-purple-200" />
            <span>Open 360° Command Center</span>
          </Link>

          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/20"
          >
            Refresh Live Metrics
          </button>
        </div>
      </div>

      {/* 7-LAB HACKATHON & STUDENT MAPPING COMMAND CENTER */}
      <div className="glass-card bg-white p-6 rounded-3xl border border-purple-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-slate-900">7-Lab Hackathon Mapping & Tracking Command</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict Master-only visibility: monitor student teams, mapped projects, round progressions, deadlines, and issue strategic Master remarks.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, team, event..."
                value={mappingsSearch}
                onChange={(e) => setMappingsSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 w-56"
              />
            </div>
          </div>
        </div>

        {/* Lab Filter Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedLab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              selectedLab === "ALL"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All 7 Labs ({mappings.length})
          </button>
          {OFFICIAL_LABS.map((lab) => {
            const count = mappings.filter(m => m.studentLab === lab).length;
            return (
              <button
                key={lab}
                onClick={() => setSelectedLab(lab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 flex items-center gap-1.5 ${
                  selectedLab === lab
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{lab.replace(" Lab", "")}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedLab === lab ? "bg-purple-700 text-purple-100" : "bg-slate-200 text-slate-700"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hackathon Mappings Cards Grid */}
        {filteredMappings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
            <Target className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">No internal hackathon mappings found for this selection.</p>
            <p className="text-[11px] text-slate-400">Coordinators can map approved student participants via Student Records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMappings.map((m) => {
              const mappingKey = `${m.studentId}-${m.hackathonId}`;
              const isEditingRemark = editingMappingKey === mappingKey;

              return (
                <div 
                  key={mappingKey} 
                  className="p-4 bg-gradient-to-br from-white via-purple-50/20 to-slate-50 border border-purple-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-purple-100/70 pb-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full inline-block mb-1">
                        {m.studentLab || "Lab Unassigned"}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">
                        {m.studentName || m.studentId}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{m.registerNumber ? `Reg: ${m.registerNumber}` : m.studentEmail}</p>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      m.approvalStatus === 'Verified' || m.approvalStatus === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {m.approvalStatus || 'Approved'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <Award className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                      <span className="truncate">{m.hackathonName || "Hackathon Event"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-semibold block">Team:</span>
                        <span className="font-bold text-slate-700">{m.teamId || "Unassigned"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Project:</span>
                        <span className="font-bold text-slate-700 truncate block">{m.projectName || "Not Linked"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Round:</span>
                        <span className="font-bold text-slate-700">{m.currentRoundId || "Round 1"} ({m.roundStatus || "In Progress"})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Deadline:</span>
                        <span className="font-bold text-slate-700">{m.roundDeadline || "Not Set"}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                        <span>Internal Progress</span>
                        <span className="text-purple-700 font-extrabold">{m.internalProgress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 rounded-full" 
                          style={{ width: `${m.internalProgress || 0}%` }} 
                        />
                      </div>
                    </div>

                    {/* Coordinator Follow-up & Remarks */}
                    {m.coordinatorRemarks && (
                      <div className="pt-1.5 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <Flag className="w-3 h-3 text-slate-400" /> Coord Remark:
                        </span>
                        <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1 line-clamp-2">
                          {m.coordinatorRemarks}
                        </p>
                      </div>
                    )}

                    {/* Master Remarks Section with Direct Edit */}
                    <div className="pt-2 border-t border-purple-100/70">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-black text-purple-700 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-purple-600" /> Master Remark:
                        </span>
                        {!isEditingRemark && (
                          <button
                            onClick={() => {
                              setEditingMappingKey(mappingKey);
                              setMasterRemarkDraft(m.masterRemarks || "");
                            }}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-0.5 underline"
                          >
                            <Edit3 className="w-2.5 h-2.5" /> Edit
                          </button>
                        )}
                      </div>

                      {isEditingRemark ? (
                        <div className="space-y-1.5 mt-1">
                          <textarea
                            className="w-full border border-purple-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            rows={2}
                            value={masterRemarkDraft}
                            onChange={(e) => setMasterRemarkDraft(e.target.value)}
                            placeholder="Enter Master Sathish strategic directive..."
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingMappingKey(null)}
                              className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={savingRemark}
                              onClick={() => handleSaveMasterRemark(m.studentId, m.hackathonId)}
                              className="px-2.5 py-1 text-[11px] bg-purple-600 hover:bg-purple-700 text-white font-bold rounded flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-purple-950 font-medium text-[11px] bg-purple-50 p-2 rounded-lg border border-purple-200">
                          {m.masterRemarks || <span className="text-purple-400 italic">No master remark recorded yet. Click Edit to add.</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {teacher.department || "Department Not Assigned"}
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

      {/* Directory Management Panel */}
      <div className="glass-card bg-white p-6 rounded-3xl border border-blue-200/60 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black text-slate-900">TrackFlow User Directory & Permissions</h2>
            <p className="text-xs text-slate-500">Manage Master Admins, Teacher Coordinators, and Student enrollments.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
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
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
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
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Admin Teacher</span>
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
                    <p className="text-xs text-purple-700 truncate">{user.email}</p>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Master Controller</span>
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
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">Reg: {user.registerNumber || "Pending"}</span>
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
          <span className="text-xs text-slate-500 font-medium">Official Labs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Students</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{studentsList.length}</p>
          <span className="text-xs text-slate-500 font-medium">Enrolled Students</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Teachers</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{approvedTeachers.length}</p>
          <span className="text-xs text-purple-600 font-bold">{pendingTeachers.length} Pending</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Projects</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{overview?.totalProjects || 0}</p>
          <span className="text-xs text-emerald-600 font-bold">{overview?.activeProjects || 0} Active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Hackathons</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700">{mappings.length}</p>
          <span className="text-xs text-purple-600 font-bold">Tracked Mappings</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Reports</span>
            <FileText className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{overview?.totalDailyReports || 0}</p>
          <span className="text-xs text-slate-500 font-medium">Total Daily Reports</span>
        </div>
      </div>
    </div>
  );
}
