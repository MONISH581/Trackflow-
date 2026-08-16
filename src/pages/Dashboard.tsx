import React from "react";
import { Link } from "react-router-dom";
import { useStore, ProjectInfo, TaskInfo } from "../store.ts";
import {
  Users,
  Briefcase,
  Calendar,
  CheckSquare,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Github,
  Link2,
  Cpu,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface CoordinatorMetrics {
  totalStudents: number;
  pendingRequests: number;
  activeProjects: number;
  reportsSubmittedToday: number;
  pendingTasks: number;
  activeProjectsList?: any[];
}

interface StudentMetrics {
  project: ProjectInfo | null;
  dailyReportStatus: "Submitted" | "Pending";
  upcomingDeadlines: TaskInfo[];
}

export default function Dashboard() {
  const { currentUser, analyzeProject, addToast } = useStore();

  const [coordMetrics, setCoordMetrics] = React.useState<CoordinatorMetrics | null>(null);
  const [studentMetrics, setStudentMetrics] = React.useState<StudentMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  // States for Coordinator Dashboard Risk Monitor & AI Audit
  const [projectCommits, setProjectCommits] = React.useState<
    Record<string, { count: number; loading: boolean; error: boolean; latestMessage?: string }>
  >({});
  const [auditModalProject, setAuditModalProject] = React.useState<any | null>(null);
  const [aiAnalysis, setAiAnalysis] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);

  React.useEffect(() => {
    if (!currentUser) return;

    const loadMetrics = async () => {
      setLoading(true);
      try {
        if (currentUser.role === "coordinator") {
          const res = await fetch("/api/dashboard-metrics");
          const data = await res.json();
          setCoordMetrics(data);
        } else {
          const res = await fetch(`/api/student-dashboard-metrics/${currentUser.userId}`);
          const data = await res.json();
          setStudentMetrics(data);
        }
      } catch (err) {}
      setLoading(false);
    };

    loadMetrics();
  }, [currentUser]);

  // Fetch commits for each active project
  React.useEffect(() => {
    if (!currentUser || currentUser.role !== "coordinator" || !coordMetrics?.activeProjectsList) return;

    coordMetrics.activeProjectsList.forEach((p: any) => {
      if (!p.githubRepo) {
        setProjectCommits(prev => ({
          ...prev,
          [p.id]: { count: 0, loading: false, error: false }
        }));
        return;
      }

      setProjectCommits(prev => ({
        ...prev,
        [p.id]: { count: 0, loading: true, error: false }
      }));

      fetch(`https://api.github.com/repos/${p.githubRepo}/commits?per_page=1`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          const count = Array.isArray(data) ? data.length : 0;
          const latestMessage = Array.isArray(data) && data[0] ? data[0].commit.message : undefined;
          setProjectCommits(prev => ({
            ...prev,
            [p.id]: { count, loading: false, error: false, latestMessage }
          }));
        })
        .catch(() => {
          setProjectCommits(prev => ({
            ...prev,
            [p.id]: { count: 0, loading: false, error: true }
          }));
        });
    });
  }, [coordMetrics?.activeProjectsList, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    );
  }

  // --- COORDINATOR DASHBOARD LAYOUT ---
  if (currentUser?.role === "coordinator" && coordMetrics) {
    const cards = [
      {
        title: "Approved Students",
        value: coordMetrics.totalStudents,
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-200/50 shadow-sm",
        link: "/records",
      },
      {
        title: "Pending Approvals",
        value: coordMetrics.pendingRequests,
        icon: ShieldAlert,
        color: "text-rose-600",
        bg: "bg-rose-50 border-rose-200/50 shadow-sm",
        link: "/approvals",
      },
      {
        title: "Active Projects",
        value: coordMetrics.activeProjects,
        icon: Briefcase,
        color: "text-indigo-600",
        bg: "bg-indigo-50 border-indigo-200/50 shadow-sm",
        link: "/projects",
      },
      {
        title: "Missing Mentors",
        value: (coordMetrics as any).projectsWithoutMentors || 0,
        icon: AlertCircle,
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200/50 shadow-sm",
        link: "/mentors",
      },
      {
        title: "Reports Today",
        value: coordMetrics.reportsSubmittedToday,
        icon: Calendar,
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-200 shadow-sm",
        link: "/daily-reports",
      },
      {
        title: "GitHub Connected",
        value: (coordMetrics as any).githubConnectedProjects || 0,
        icon: Github,
        color: "text-slate-700",
        bg: "bg-slate-100 border-slate-300 shadow-sm",
        link: "/projects",
      },
      {
        title: "Active Hackathons",
        value: (coordMetrics as any).activeHackathons || 0,
        icon: Sparkles,
        color: "text-purple-600",
        bg: "bg-purple-50 border-purple-200 shadow-sm",
        link: "/hackathons",
      },
      {
        title: "Proof Verifications",
        value: (coordMetrics as any).pendingScreenshotVerifications || 0,
        icon: CheckCircle2,
        color: "text-teal-600",
        bg: "bg-teal-50 border-teal-200 shadow-sm",
        link: "/hackathons",
      },
    ];

    const chartData = [
      { name: "Total Students", value: coordMetrics.totalStudents },
      { name: "Active Projects", value: coordMetrics.activeProjects },
      { name: "Pending Tasks", value: coordMetrics.pendingTasks },
      { name: "Reports Today", value: coordMetrics.reportsSubmittedToday },
    ];

    return (
      <div className="space-y-6 text-left">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Coordinator Admin Panel</h2>
          <p className="text-sm text-slate-500">
            Overview of department activities, pending actions, and student sprint analytics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 perspective-1000">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className={`glass-card card-hyper-3d shine-effect p-5 border flex items-center justify-between transition-all ${card.bg}`}
              >
                <div className="space-y-1 text-left pop-out-3d">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                    {card.title}
                  </span>
                  <span className="text-2xl font-extrabold text-slate-800 block">{card.value}</span>
                </div>
                <div className={`p-3 rounded-2xl bg-white/90 border border-slate-200/80 ${card.color} shadow-lg pop-out-3d-deep transform hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Visualization & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Card */}
          <div className="lg:col-span-2 glass-card p-6 border border-blue-200/40 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
              Activity Status Index
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid rgba(59, 130, 246, 0.12)",
                      borderRadius: "0.75rem",
                      color: "#1e293b",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? "rgba(37, 99, 235, 0.75)" : "rgba(99, 102, 241, 0.75)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card p-6 border border-blue-200/40 flex flex-col justify-between space-y-5">
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-blue-600" />
                Quick Operations
              </h3>
              <p className="text-xs text-slate-500 leading-normal font-semibold">
                Use the following buttons to perform standard system updates quickly.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/projects"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 hover:border-blue-500/30 transition-all group"
              >
                <span>Setup Project Workspace</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
              </Link>

              <Link
                to="/tasks"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 hover:border-blue-500/30 transition-all group"
              >
                <span>Generate Sprint Deliverables</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Project Status & Risk Monitor */}
        <div className="space-y-4 pt-4 text-left">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Project Workspaces & Risk Monitor
            </h3>
            <p className="text-xs text-slate-500">
              Live tracking of all active projects, daily submission status, GitHub activities, and Gemini AI health analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coordMetrics.activeProjectsList && coordMetrics.activeProjectsList.length === 0 ? (
              <div className="col-span-full glass-card p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No active projects found. Set up a project workspace to begin tracking.
              </div>
            ) : (
              coordMetrics.activeProjectsList?.map((p: any) => {
                const commitsInfo = projectCommits[p.id];
                const hasCommits = commitsInfo ? (commitsInfo.count > 0 && !commitsInfo.error) : false;
                const commitsLoading = commitsInfo?.loading;
                
                // Risk definition: "they have not subbmitted todays report and not commited git once"
                const isAtRisk = !p.hasReportToday && (!p.githubRepo || (!commitsLoading && !hasCommits));

                return (
                  <div
                    key={p.id}
                    className={`glass-card p-5 border flex flex-col justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
                      isAtRisk
                        ? "border-rose-300 bg-rose-50/20 shadow-sm"
                        : "border-blue-200/40 bg-white shadow-sm"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded uppercase">
                            {p.department}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm truncate mt-1.5" title={p.name}>
                            {p.name}
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isAtRisk
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {isAtRisk ? "At Risk" : "In Progress"}
                        </span>
                      </div>

                      {/* Card Specs */}
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-semibold">Today&apos;s Daily Log:</span>
                          <span
                            className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold ${
                              p.hasReportToday
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                            }`}
                          >
                            {p.hasReportToday ? "Submitted" : "Pending"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-semibold flex items-center gap-1">
                              <Github className="w-3.5 h-3.5" /> Git Repository:
                            </span>
                            <span className="font-bold text-slate-700">
                              {p.githubRepo ? (
                                <a
                                  href={`https://github.com/${p.githubRepo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                                >
                                  {p.githubRepo.split("/")[1] || p.githubRepo}
                                  <Link2 className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-rose-600">Unlinked</span>
                              )}
                            </span>
                          </div>
                          
                          {p.githubRepo && (
                            <div className="text-[10px] mt-1 border-t border-slate-200/60 pt-1 text-slate-500">
                              {commitsLoading ? (
                                <span className="italic text-slate-400">Verifying commits...</span>
                              ) : commitsInfo?.error ? (
                                <span className="text-slate-500">Access Restricted / API rate limit</span>
                              ) : hasCommits ? (
                                <span className="text-slate-600 truncate block font-sans">
                                  Latest: &quot;{commitsInfo.latestMessage}&quot;
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold">No commits pushed yet</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>Sprint Progress</span>
                          <span className="text-slate-800">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gemini AI Action */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => {
                          setAuditModalProject(p);
                          setAiAnalysis("");
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100/70 text-blue-600 border border-blue-200/50 font-bold rounded-xl text-xs transition-all shadow-sm"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Gemini AI Audit</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Gemini AI Project Audit Modal */}
        {auditModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="max-w-xl w-full glass-card p-6 border border-blue-200/65 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-spin" />
                  Gemini AI Project Audit
                </h3>
                <button
                  onClick={() => {
                    setAuditModalProject(null);
                    setAiAnalysis("");
                  }}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  X
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded">
                    {auditModalProject.department}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 mt-2">{auditModalProject.name}</h4>
                </div>

                {analyzing ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600" />
                    <p className="text-xs text-slate-500 font-semibold">Gemini AI is analyzing project metrics and commits...</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 max-h-72 overflow-y-auto">
                    <h5 className="text-xs font-bold text-slate-700">Audit Analysis Report</h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium whitespace-pre-line">
                      {aiAnalysis}
                    </p>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <button
                      onClick={async () => {
                        setAnalyzing(true);
                        try {
                          const commitsInfo = projectCommits[auditModalProject.id];
                          const githubStats = {
                            commitsCount: commitsInfo ? (commitsInfo.error ? 0 : commitsInfo.count) : 0,
                            repo: auditModalProject.githubRepo,
                            recentCommits: commitsInfo?.latestMessage ? [{ message: commitsInfo.latestMessage, author: "Developer", date: new Date().toISOString() }] : []
                          };
                          const summary = await analyzeProject(auditModalProject, githubStats);
                          setAiAnalysis(summary);
                        } catch (err) {
                          addToast("Audit failed", "error");
                        }
                        setAnalyzing(false);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/10"
                    >
                      Run Gemini AI Health Audit
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    setAuditModalProject(null);
                    setAiAnalysis("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- STUDENT DASHBOARD LAYOUT ---
  if (currentUser?.role === "student" && studentMetrics) {
    const { project, dailyReportStatus, upcomingDeadlines } = studentMetrics;

    if (!project) {
      return (
        <div className="glass-card p-12 text-center border border-blue-200/40 max-w-xl mx-auto space-y-4">
          <Briefcase className="w-10 h-10 text-blue-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Workspace Pending Connection</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-semibold">
            Your profile has been approved by the coordinator, but you have not yet been assigned to a project team workspace. Please contact Dr. Sarah Chen to coordinate your project setup.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 text-left">
        {/* Student Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Welcome back, {currentUser.name}
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-0.5">
              Sprint dashboard for project: <span className="text-blue-600 font-bold">{project.name}</span>
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold ${
              dailyReportStatus === "Submitted"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 text-rose-700 border-rose-200 animate-pulse"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Today&apos;s Daily Log: {dailyReportStatus}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress overview */}
          <div className="lg:col-span-2 glass-card p-6 border border-blue-200/40 space-y-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                Project Milestone Analytics
              </h3>
              <p className="text-xs text-slate-500 bg-white border border-slate-200/50 p-3 rounded-xl font-medium leading-relaxed">
                Current documentation synopsis: &quot;{project.abstract || "Pending details..."}&quot;
              </p>
            </div>

            <div className="py-4 border-t border-slate-100 mt-2 text-xs text-slate-400 font-semibold italic text-center">
              Detailed progress metrics and health tracking are restricted to the Coordinator dashboard.
            </div>

            <div className="flex justify-end pt-3">
              <Link
                to="/project-hub"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/10"
              >
                <span>Open Project Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Upcoming deadlines list */}
          <div className="glass-card p-5 border border-blue-200/40 space-y-4 text-left shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-200">
              <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
              Sprint Deliverables (Top 5)
            </h3>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No pending deliverables. Good job!
                </div>
              ) : (
                upcomingDeadlines.map((t) => (
                  <div
                    key={t.id || t._id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-slate-800 truncate max-w-[130px]">{t.title}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Due: {t.date}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        t.priority === "high"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : t.priority === "medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <Link
                to="/tasks"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition"
              >
                <span>View Full Tasks Board</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
