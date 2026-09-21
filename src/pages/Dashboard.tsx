import React from "react";
import { Link } from "react-router-dom";
import { useStore, ProjectInfo, TaskInfo, API_BASE } from "../store.ts";
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
  Compass,
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

import MasterControl from "./MasterControl";

export default function Dashboard() {
  const { currentUser, analyzeProject, addToast } = useStore();

  if (currentUser?.role === "master_admin") {
    return <MasterControl />;
  }

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
          const res = await fetch(`${API_BASE}/api/dashboard-metrics`);
          const data = await res.json();
          setCoordMetrics(data);
        } else {
          const res = await fetch(`${API_BASE}/api/student-dashboard-metrics/${currentUser.userId}`);
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
        color: "text-indigo-600",
        iconBg: "bg-indigo-50 border-indigo-100",
        badge: "Learners",
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
        link: "/records",
      },
      {
        title: "Pending Approvals",
        value: coordMetrics.pendingRequests,
        icon: ShieldAlert,
        color: "text-rose-600",
        iconBg: "bg-rose-50 border-rose-100",
        badge: coordMetrics.pendingRequests > 0 ? "Needs Review" : "Up to date",
        badgeColor: coordMetrics.pendingRequests > 0 ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse" : "bg-emerald-50 text-emerald-700 border-emerald-100",
        link: "/approvals",
      },
      {
        title: "Active Projects",
        value: coordMetrics.activeProjects,
        icon: Briefcase,
        color: "text-purple-600",
        iconBg: "bg-purple-50 border-purple-100",
        badge: "Active",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
        link: "/projects",
      },
      {
        title: "Missing Mentors",
        value: (coordMetrics as any).projectsWithoutMentors || 0,
        icon: AlertCircle,
        color: "text-amber-600",
        iconBg: "bg-amber-50 border-amber-100",
        badge: (coordMetrics as any).projectsWithoutMentors > 0 ? "Unassigned" : "All Set",
        badgeColor: (coordMetrics as any).projectsWithoutMentors > 0 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100",
        link: "/mentors",
      },
      {
        title: "Reports Today",
        value: coordMetrics.reportsSubmittedToday,
        icon: Calendar,
        color: "text-emerald-600",
        iconBg: "bg-emerald-50 border-emerald-100",
        badge: "Daily Log",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
        link: "/daily-reports",
      },
      {
        title: "GitHub Connected",
        value: (coordMetrics as any).githubConnectedProjects || 0,
        icon: Github,
        color: "text-slate-800",
        iconBg: "bg-slate-100 border-slate-200",
        badge: "Repositories",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        link: "/projects",
      },
      {
        title: "Active Hackathons",
        value: (coordMetrics as any).activeHackathons || 0,
        icon: Sparkles,
        color: "text-pink-600",
        iconBg: "bg-pink-50 border-pink-100",
        badge: "Events",
        badgeColor: "bg-pink-50 text-pink-700 border-pink-100",
        link: "/hackathons",
      },
      {
        title: "Proof Verifications",
        value: (coordMetrics as any).pendingScreenshotVerifications || 0,
        icon: CheckCircle2,
        color: "text-teal-600",
        iconBg: "bg-teal-50 border-teal-100",
        badge: "Proofs",
        badgeColor: "bg-teal-50 text-teal-700 border-teal-100",
        link: "/hackathons",
      },
    ];

    const chartData = [
      { name: "Students", value: coordMetrics.totalStudents },
      { name: "Projects", value: coordMetrics.activeProjects },
      { name: "Tasks", value: coordMetrics.pendingTasks },
      { name: "Reports Today", value: coordMetrics.reportsSubmittedToday },
    ];

    return (
      <div className="space-y-6 text-left">
        {/* Nixtio Hero Banner for Coordinator */}
        <div className="nixtio-hero-banner p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl z-10">
            <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-indigo-200 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
              Coordinator Dashboard &bull; Academic Management
            </span>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Welcome back, {currentUser.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed">
              Track student project milestones, review daily report submissions, manage lab mentors, and execute AI health audits in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
            <Link
              to="/approvals"
              className="px-4 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black transition shadow-lg shadow-indigo-900/20 flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>Review Requests ({coordMetrics.pendingRequests})</span>
            </Link>
            <Link
              to="/projects"
              className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white border border-indigo-400/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Manage Projects</span>
            </Link>
          </div>

          {/* Decorative Background Circles */}
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-32 -bottom-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* Nixtio Fluid Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3.5 sm:gap-5 w-full">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="nixtio-card nixtio-card-hover p-4 sm:p-5 flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={`p-3 rounded-2xl ${card.iconBg} border ${card.color} shadow-xs group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                    {card.value}
                  </span>
                  <span className="text-xs font-bold text-slate-600 mt-0.5 block leading-snug">
                    {card.title}
                  </span>
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
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded uppercase">
                            {p.department}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm truncate mt-1.5" title={p.name}>
                            {p.name}
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
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
                            className={`px-2 py-0.5 rounded-[6px] text-xs font-bold ${
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
                            <div className="text-xs mt-1 border-t border-slate-200/60 pt-1 text-slate-500">
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
                        <div className="flex justify-between text-xs text-slate-500 font-bold">
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
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded">
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
        <div className="space-y-6 text-left max-w-2xl mx-auto py-8">
          <div className="glass-card p-6 sm:p-10 text-center border border-blue-200/60 bg-white/90 shadow-xl rounded-3xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center mx-auto shadow-sm">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <div className="space-y-2">
              <span className="inline-block text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                Account Approved &bull; Pending Project Assignment
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Welcome to TrackFlow AI, {currentUser.name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Your student account has been approved by your department coordinator. Your project workspace is currently being setup by your lab supervisor. In the meantime, you can explore live coding challenges, register for upcoming hackathons, or customize your profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                to="/opportunities"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Browse Opportunities</span>
              </Link>
              <Link
                to="/hackathons"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Explore Hackathons</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 text-left overflow-x-hidden">
        {/* Student Nixtio Hero Banner */}
        <div className="nixtio-hero-banner p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-200 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                Learner Workspace &bull; {currentUser.department || "Lab Core"}
              </span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                dailyReportStatus === "Submitted"
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                  : "bg-rose-500/20 text-rose-200 border-rose-400/30 animate-pulse"
              }`}>
                Daily Log: {dailyReportStatus}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed">
              Assigned Project: <span className="font-bold text-white underline decoration-indigo-300">{project.name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
            <Link
              to="/daily-reports"
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition shadow-lg flex items-center gap-2 ${
                dailyReportStatus === "Submitted"
                  ? "bg-white text-indigo-600 hover:bg-indigo-50"
                  : "bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-amber-500/30"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{dailyReportStatus === "Submitted" ? "View Today's Log" : "Submit Daily Log Now"}</span>
            </Link>
            <Link
              to="/project-hub"
              className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white border border-indigo-400/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Project Hub</span>
            </Link>
          </div>

          {/* Decorative Circles */}
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-32 -bottom-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* Student Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Overview Card */}
          <div className="lg:col-span-2 nixtio-card p-6 border border-slate-200/80 space-y-6 flex flex-col justify-between overflow-hidden">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>Project Overview & Milestone Synopsis</span>
                </h3>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
                  Domain: {project.domain || "Tech Lab"}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Project Abstract</span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {project.abstract || "Project documentation is actively being configured by your lab coordinator."}
                </p>
              </div>

              {/* Progress bar visual mockup */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Sprint Completion Status</span>
                  <span className="text-indigo-600">75% Complete</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: "75%" }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 overflow-hidden">
              <span className="text-xs text-slate-500 font-semibold truncate max-w-full sm:max-w-xs">
                GitHub Repo: <span className="text-slate-800 font-mono font-bold truncate inline-block max-w-[180px] sm:max-w-[220px] align-bottom" title={project.githubRepo || "Not linked"}>{project.githubRepo || "Not linked"}</span>
              </span>
              <Link
                to="/project-hub"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 shrink-0 w-full sm:w-auto"
              >
                <span>Explore Full Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Deliverables Checklist Side Widget */}
          <div className="nixtio-card p-6 border border-slate-200/80 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                  Sprint Deliverables
                </h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Top 5 Tasks
                </span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                {upcomingDeadlines.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-medium">
                    ✨ All sprint deliverables completed!
                  </div>
                ) : (
                  upcomingDeadlines.map((t) => (
                    <div
                      key={t.id || t._id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-indigo-200 flex items-center justify-between gap-3 text-xs transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Due: {t.date}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-extrabold uppercase shrink-0 ${
                          t.priority === "high"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : t.priority === "medium"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                to="/tasks"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <span>Go to Tasks Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
