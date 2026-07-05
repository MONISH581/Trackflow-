import React from "react";
import { useStore, TaskInfo, ProjectInfo, UserInfo } from "../store.ts";
import { Plus, CheckCircle, Clock, AlertCircle, Calendar, PlusCircle, ArrowRight, UserPlus } from "lucide-react";

export default function Tasks() {
  const {
    tasks,
    projects,
    fetchTasks,
    fetchProjects,
    createTask,
    updateTask,
    currentUser,
  } = useStore();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [students, setStudents] = React.useState<UserInfo[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form states for creating task
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high">("medium");
  const [estimatedHours, setEstimatedHours] = React.useState(0);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    fetchProjects();
    fetchTasks().then(() => setLoading(false));

    if (currentUser?.role === "coordinator") {
      fetch("/api/users/students")
        .then((r) => r.json())
        .then((data) => {
          if (data.students) setStudents(data.students);
        })
        .catch(() => {});
    }
  }, [fetchTasks, fetchProjects, currentUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assigneeId || !projectId) return;

    setCreating(true);
    const selectedAssignee = students.find((s) => s.userId === assigneeId);
    const selectedProj = projects.find((p) => p.id === projectId || p._id === projectId);

    const success = await createTask({
      title,
      date,
      assigneeId,
      assigneeName: selectedAssignee ? selectedAssignee.name : "Student",
      projectId,
      projectName: selectedProj ? selectedProj.name : "Project",
      createdBy: currentUser?.userId,
      priority,
      estimatedHours,
    });
    setCreating(false);
    if (success) {
      setShowCreateModal(false);
      setTitle("");
      setDate("");
      setAssigneeId("");
      setProjectId("");
      setPriority("medium");
      setEstimatedHours(0);
    }
  };

  const moveTask = async (taskId: string, nextStatus: TaskInfo["status"]) => {
    await updateTask(taskId, { status: nextStatus });
  };

  // Group tasks by status
  const notStartedTasks = tasks.filter((t) => t.status === "Not Started");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600" />
      </div>
    );
  }

  const renderTaskCard = (task: TaskInfo) => {
    return (
      <div
        key={task.id || task._id}
        className="glass-card p-4 border border-blue-200/35 space-y-4 hover:border-blue-400/50 shadow-sm text-left"
      >
        <div className="flex justify-between items-start">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
              task.priority === "high"
                ? "bg-rose-50 text-rose-700 border border-rose-200/65"
                : task.priority === "medium"
                ? "bg-amber-50 text-amber-700 border border-amber-200/65"
                : "bg-blue-50 text-blue-700 border border-blue-200/65"
            }`}
          >
            {task.priority} Priority
          </span>
          <span className="text-[10px] text-slate-500 font-bold truncate max-w-[100px]">
            {task.projectName}
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h4>
          <p className="text-[11px] text-slate-500 font-semibold">Assignee: {task.assigneeName}</p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{task.date}</span>
          </div>
          <span>Est: {task.estimatedHours} hrs</span>
        </div>

        {/* Task movements action bar */}
        <div className="flex gap-2 pt-2">
          {task.status === "Not Started" && (
            <button
              onClick={() => moveTask(task.id || task._id || "", "In Progress")}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-50 hover:bg-blue-100/80 text-blue-600 border border-blue-200/50 rounded-lg text-xs font-bold transition"
            >
              <span>Start Task</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {task.status === "In Progress" && (
            <button
              onClick={() => moveTask(task.id || task._id || "", "Completed")}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Complete Task</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sprint Tasks Board</h2>
          <p className="text-sm text-slate-500 font-medium">
            Define milestones, assign deliverables, and audit task statuses.
          </p>
        </div>

        {currentUser?.role === "coordinator" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-500/15 glow-btn self-start sm:self-auto"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Generate Task</span>
          </button>
        )}
      </div>

      {/* Board columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Not Started */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              Not Started
            </h3>
            <span className="text-xs bg-slate-200/60 px-2 py-0.5 rounded text-slate-600 font-bold">
              {notStartedTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {notStartedTasks.length === 0 ? (
              <div className="text-xs text-slate-500 border border-dashed border-slate-200 border-slate-200 p-6 text-center rounded-xl">
                No tasks pending start.
              </div>
            ) : (
              notStartedTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              In Progress
            </h3>
            <span className="text-xs bg-blue-50 px-2 py-0.5 rounded text-blue-600 font-bold border border-blue-100">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {inProgressTasks.length === 0 ? (
              <div className="text-xs text-slate-500 border border-dashed border-slate-200 p-6 text-center rounded-xl">
                No tasks in active sprint.
              </div>
            ) : (
              inProgressTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Completed
            </h3>
            <span className="text-xs bg-emerald-50 px-2 py-0.5 rounded text-emerald-700 font-bold border border-emerald-100">
              {completedTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {completedTasks.length === 0 ? (
              <div className="text-xs text-slate-500 border border-dashed border-slate-200 p-6 text-center rounded-xl">
                No tasks finalized yet.
              </div>
            ) : (
              completedTasks.map(renderTaskCard)
            )}
          </div>
        </div>
      </div>

      {/* Task Creation Modal (Coordinator only) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full glass-card p-6 border border-blue-200/40 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Generate Sprint Task
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement user login integration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Assignee *
                  </label>
                  <select
                    required
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                  >
                    <option value="">Choose Student</option>
                    {students.map((s) => (
                      <option key={s.userId} value={s.userId} className="bg-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Project *
                  </label>
                  <select
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                  >
                    <option value="">Choose Workspace</option>
                    {projects.map((p) => (
                      <option key={p.id || p._id} value={p.id || p._id} className="bg-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Task Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition ${
                        priority === p
                          ? "bg-blue-600 border border-blue-500 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/10"
                >
                  {creating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
