import React from "react";
import { Link } from "react-router-dom";
import { useStore, ProjectInfo } from "../store.ts";
import { Plus, Search, Folder, Users, ChevronRight, TrendingUp } from "lucide-react";

export default function Projects() {
  const { projects, fetchProjects, createProject, currentUser } = useStore();

  const [search, setSearch] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("All");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newDept, setNewDept] = React.useState("Computer Science");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    const proj = await createProject(newTitle, newDept);
    setSubmitting(false);
    if (proj) {
      setShowCreateModal(false);
      setNewTitle("");
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold whitespace-nowrap hidden sm:inline">Filter Dept:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer"
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
        <div className="glass-card p-12 text-center border border-blue-200/40 max-w-xl mx-auto space-y-3 shadow-sm">
          <Folder className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Workspaces Found</h3>
          <p className="text-sm text-slate-500">
            No projects matched the search criteria. Click &quot;Create Workspace&quot; to start a new project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <Link
              key={project.id || project._id}
              to={`/projects/${project.id || project._id}`}
              className="glass-card p-5 border border-blue-200/35 flex flex-col justify-between hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/5 group text-left"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/40 px-2 py-0.5 rounded">
                    {project.department}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      (project.status as string) === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : (project.status as string) === "At Risk" || (project.status as string) === "On Hold"
                        ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                        : "bg-blue-50 text-blue-700 border border-blue-200/60"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed font-semibold">
                  {project.abstract || "Workspace setup completed. Detailed documentation is pending."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 space-y-4">
                {/* Progress bar (coordinator only) */}
                {currentUser?.role === "coordinator" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                      <span>Work Completed</span>
                      <span className="font-bold text-slate-800">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{project.teamMembers.length} Members</span>
                  </div>
                  <span className="flex items-center gap-1 group-hover:text-blue-600 font-bold transition-colors">
                    Workspace Hub
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Workspace Creation Dialog Modal (Coordinator only) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full glass-card p-6 border border-blue-200/40 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-slate-800">Create New Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Soil Classification using CNNs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Department
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d} value={d} className="bg-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
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
