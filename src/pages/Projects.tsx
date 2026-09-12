import React from "react";
import { Link } from "react-router-dom";
import { useStore, ProjectInfo, UserInfo, API_BASE } from "../store.ts";
import { StudentSelector } from "../components/StudentSelector.tsx";
import {
  Plus,
  Search,
  Folder,
  Users,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  User,
} from "lucide-react";

export default function Projects() {
  const {
    projects,
    fetchProjects,
    createProject,
    fetchApprovedStudents,
    currentUser,
    approveProjectMilestone,
    respondProjectExtension,
  } = useStore();

  const [search, setSearch] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("All");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newDept, setNewDept] = React.useState("Computer Science");
  const [students, setStudents] = React.useState<UserInfo[]>([]);
  const [newLeaderId, setNewLeaderId] = React.useState("");
  const [newMemberIds, setNewMemberIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchProjects();
    fetchApprovedStudents().then((data) => {
      if (Array.isArray(data)) setStudents(data);
    });
  }, [fetchProjects, fetchApprovedStudents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    const proj = await createProject(newTitle, newDept, undefined, undefined, newLeaderId, newMemberIds);
    setSubmitting(false);
    if (proj) {
      setShowCreateModal(false);
      setNewTitle("");
      setNewLeaderId("");
      setNewMemberIds([]);
    }
  };

  const departments = [
    "Computer Science",
    "Information Technology",
    "Artificial Intelligence",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  const findStudentDetails = (idOrName: string) => {
    if (!idOrName) return "";
    const found = students.find(
      (s) => s.userId === idOrName || (s as any).id === idOrName || (s as any)._id === idOrName || s.name === idOrName
    );
    if (found) {
      const reg = found.registerNumber || (found as any).rollNo || found.userId;
      return `${found.name}${reg ? ` (${reg})` : ""}`;
    }
    return idOrName;
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "All" || p.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Project Workspaces</h2>
          <p className="text-sm text-slate-500 font-medium">
            Access, structure, and supervise engineering projects.
          </p>
        </div>
        {currentUser?.role === "coordinator" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/15 glow-btn self-start sm:self-auto"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Create Workspace</span>
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-bold whitespace-nowrap hidden sm:inline">Filter Dept:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer"
          >
            <option value="All" className="bg-white">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d} className="bg-white">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card p-5 sm:p-8 text-center border border-blue-200/40 max-w-xl mx-auto space-y-3 shadow-sm">
          <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-slate-800">No Workspaces Found</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            No projects matched the search criteria. Click &quot;Create Workspace&quot; to start a new project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-5 w-full">
          {filteredProjects.map((project) => (
            <div
              key={project.id || project._id}
              className="glass-card p-5 border border-blue-200/35 flex flex-col justify-between hover:shadow-xl hover:shadow-blue-500/5 group text-left transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/40 px-2 py-0.5 rounded">
                    {project.department}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      (project.status as string) === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : (project.status as string) === "At Risk" || (project.status as string) === "On Hold" || (project.status as string) === "MILESTONE_REVIEW_REQUIRED"
                        ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                        : "bg-blue-50 text-blue-700 border border-blue-200/60"
                    }`}
                  >
                    {project.status === "MILESTONE_REVIEW_REQUIRED" ? "Review Pending" : project.status}
                  </span>
                </div>

                <Link to={`/projects/${project.id || project._id}`}>
                  <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {project.name}
                  </h3>
                </Link>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                  {project.abstract || "Workspace setup completed. Detailed documentation is pending."}
                </p>

                {/* Team Members & Leader Info (With Register Numbers) */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  {/* Leader */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-slate-400 text-xs">Leader:</span>
                    <span className="font-bold text-slate-800 text-xs truncate">
                      {project.teamLeader ? findStudentDetails(project.teamLeader) : "Unassigned"}
                    </span>
                  </div>

                  {/* Members */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Members ({project.teamMembers ? project.teamMembers.length : 0}/5):</span>
                    </div>
                    {project.teamMembers && project.teamMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.teamMembers.map((mId, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded border border-slate-200/60"
                          >
                            {findStudentDetails(mId)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No members assigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/60 space-y-3">
                {/* Progress bar (coordinator / admin) */}
                {(currentUser?.role === "coordinator" || currentUser?.role === "master_admin") && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-bold">
                      <span>Progress</span>
                      <span className="font-bold text-slate-800">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Inline Approvals Section (Coordinator / Master Admin) */}
                {(currentUser?.role === "coordinator" || currentUser?.role === "master_admin") && (
                  <div className="space-y-2 pt-1">
                    {/* Time Extension Approval Banner */}
                    {(project as any).extensionStatus === "PENDING" && (
                      <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Extension Request: +{(project as any).requestedExtensionDays || 14} Days
                          </span>
                        </div>
                        {(project as any).extensionReason && (
                          <p className="text-xs text-amber-700 italic">
                            &quot;{(project as any).extensionReason}&quot;
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await respondProjectExtension(project.id || project._id!, true);
                            }}
                            className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition shadow-sm"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await respondProjectExtension(project.id || project._id!, false);
                            }}
                            className="py-1 px-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Milestone Progression Approval Button */}
                    {(project.status === "MILESTONE_REVIEW_REQUIRED" ||
                      (project.progress >= (project.maxAllowedProgress || 25) && (project.maxAllowedProgress || 25) < 100)) && (
                      <div className="bg-blue-50/90 border border-blue-200 p-2.5 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-blue-900 text-xs">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            Milestone Approval ({project.maxAllowedProgress || 25}% Review)
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 leading-tight">
                          Progress locked at {project.maxAllowedProgress || 25}%. Review student presentation and approve.
                        </p>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const nextMilestone =
                              (project.maxAllowedProgress || 25) === 25
                                ? 50
                                : (project.maxAllowedProgress || 25) === 50
                                ? 75
                                : 100;
                            await approveProjectMilestone(project.id || project._id!, nextMilestone);
                          }}
                          className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve {project.maxAllowedProgress || 25}% Review &amp; Unlock {
                            (project.maxAllowedProgress || 25) === 25 ? 50 : (project.maxAllowedProgress || 25) === 50 ? 75 : 100
                          }%
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="text-xs text-slate-400 font-semibold">
                    Workspace #{project.id ? project.id.slice(-6) : "NEW"}
                  </span>
                  <Link
                    to={`/projects/${project.id || project._id}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition-colors text-xs"
                  >
                    Open Workspace Hub
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workspace Creation Dialog Modal (Coordinator only) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-[94vw] sm:max-w-xl glass-card p-4 sm:p-6 border border-blue-200/40 shadow-2xl space-y-4 my-auto max-h-[85vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Create New Project Workspace</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set up workspace title, department, and assign initial student team from student records.
              </p>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Soil Classification using CNNs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Department
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer text-slate-800 bg-white"
                >
                  {departments.map((d) => (
                    <option key={d} value={d} className="bg-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Record Selector for Leader and Members */}
              <div className="pt-2 border-t border-slate-100">
                <StudentSelector
                  students={students}
                  selectedLeaderId={newLeaderId}
                  onLeaderChange={setNewLeaderId}
                  selectedMemberIds={newMemberIds}
                  onMembersChange={setNewMemberIds}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/10"
                >
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
