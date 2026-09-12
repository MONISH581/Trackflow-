import React from "react";
import { useParams, Link } from "react-router-dom";
import { useStore, ProjectInfo, UserInfo, API_BASE } from "../store.ts";
import { StudentSelector } from "../components/StudentSelector.tsx";
import {
  FileText,
  Upload,
  Calendar,
  Sparkles,
  Users,
  Save,
  FileCheck,
  History,
  TrendingUp,
  Cpu,
  Github,
  Link2,
} from "lucide-react";

interface CommitInfo {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    avatar_url: string;
  } | null;
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const {
    activeProject,
    projects,
    currentUser,
    updateProject,
    uploadFile,
    fetchAbstractHistory,
    submitDailyReport,
    checkDailyReportSubmittedToday,
    analyzeProject,
    approveProjectMilestone,
    requestProjectExtension,
    respondProjectExtension,
    addToast,
  } = useStore();

  const [project, setProject] = React.useState<ProjectInfo | null>(null);
  const [students, setStudents] = React.useState<UserInfo[]>([]);
  const [abstractHistory, setAbstractHistory] = React.useState<any[]>([]);
  const [showDailyReportModal, setShowDailyReportModal] = React.useState(false);
  const [dailyReportSubmitted, setDailyReportSubmitted] = React.useState(false);

  // Time Extension Request State
  const [showExtensionModal, setShowExtensionModal] = React.useState(false);
  const [extensionDaysInput, setExtensionDaysInput] = React.useState(7);
  const [extensionReasonInput, setExtensionReasonInput] = React.useState("");
  const [submittingExtension, setSubmittingExtension] = React.useState(false);

  // GitHub Commits State
  const [commits, setCommits] = React.useState<CommitInfo[]>([]);
  const [loadingCommits, setLoadingCommits] = React.useState(false);

  // Form states for Daily Report
  const [workDone, setWorkDone] = React.useState("");
  const [challenges, setChallenges] = React.useState("");
  const [nextDayPlan, setNextDayPlan] = React.useState("");
  const [reportProgress, setReportProgress] = React.useState(0);
  const [reportAbstract, setReportAbstract] = React.useState("");

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);

  // Editable documentation fields (Students)
  const [abstract, setAbstract] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [objectives, setObjectives] = React.useState("");
  const [methodology, setMethodology] = React.useState("");
  const [techStack, setTechStack] = React.useState("");
  const [modules, setModules] = React.useState("");
  const [references, setReferences] = React.useState("");
  const [futureEnhancements, setFutureEnhancements] = React.useState("");
  const [githubRepo, setGithubRepo] = React.useState("");

  // Coordinator editable fields
  const [teamLeader, setTeamLeader] = React.useState("");
  const [teamMemberIds, setTeamMemberIds] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<ProjectInfo["status"]>("Active");
  const [progress, setProgress] = React.useState(0);
  const [savingDoc, setSavingDoc] = React.useState(false);

  const currentProjectId = id || (activeProject ? (activeProject._id || activeProject.id) : "");

  // Load project detail
  React.useEffect(() => {
    if (!currentProjectId) return;
    
    const p = projects.find((x) => x.id === currentProjectId || x._id === currentProjectId) || activeProject;
    if (p && (p.id === currentProjectId || p._id === currentProjectId)) {
      setProject(p);
      
      // Load documentation states
      setAbstract(p.abstract || "");
      setDescription(p.description || "");
      setObjectives(p.objectives || "");
      setMethodology(p.methodology || "");
      setTechStack(p.techStack ? p.techStack.join(", ") : "");
      setModules(p.modules || "");
      setReferences(p.references || "");
      setFutureEnhancements(p.futureEnhancements || "");
      setGithubRepo(p.githubRepo || "");

      // Coordinator fields
      setTeamLeader(p.teamLeader || "");
      setTeamMemberIds(p.teamMembers || []);
      setStatus(p.status || "Active");
      setProgress(p.progress || 0);

      // Check daily report state
      if (currentUser?.role === "student") {
        checkDailyReportSubmittedToday(currentUser.userId).then(setDailyReportSubmitted);
        setReportAbstract(p.abstract || "");
        setReportProgress(p.progress || 0);
      }
    }
  }, [currentProjectId, projects, activeProject, currentUser]);

  // Fetch approved students and abstract history
  React.useEffect(() => {
    if (currentUser?.role === "coordinator" || currentUser?.role === "master_admin") {
      fetch(`${API_BASE}/api/users/students`)
        .then((r) => r.json())
        .then((data) => {
          if (data.students) setStudents(data.students);
        })
        .catch(() => {});
    }

    if (currentProjectId) {
      fetchAbstractHistory(currentProjectId).then(setAbstractHistory);
    }
  }, [currentProjectId, currentUser]);

  // Load GitHub Commits dynamically
  React.useEffect(() => {
    const rawRepo = project?.githubRepo || currentUser?.githubUsername;
    if (rawRepo && !rawRepo.includes("@")) {
      setLoadingCommits(true);
      const headers: any = {};
      if (currentUser?.githubToken) {
        headers["Authorization"] = `Bearer ${currentUser.githubToken}`;
      }

      let repoPath = rawRepo.trim();
      repoPath = repoPath.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/$/, "");

      const isFullRepo = repoPath.includes("/");
      const apiUrl = isFullRepo
        ? `https://api.github.com/repos/${repoPath}/commits?per_page=8`
        : `https://api.github.com/users/${repoPath}/events/public`;

      fetch(apiUrl, { headers })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load GitHub activity");
          return r.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            if (isFullRepo) {
              setCommits(data);
            } else {
              const pushCommits: any[] = [];
              for (const event of data) {
                if (event.type === "PushEvent" && event.payload?.commits) {
                  for (const c of event.payload.commits) {
                    pushCommits.push({
                      sha: c.sha,
                      html_url: `https://github.com/${event.repo.name}/commit/${c.sha}`,
                      commit: {
                        message: c.message,
                        author: {
                          name: event.actor.display_login || event.actor.login,
                          date: event.created_at,
                        },
                      },
                      author: {
                        avatar_url: event.actor.avatar_url,
                      },
                    });
                  }
                }
              }
              setCommits(pushCommits.slice(0, 8));
            }
          }
        })
        .catch((err) => {
          console.error("GitHub API Error:", err);
          setCommits([]);
        })
        .finally(() => setLoadingCommits(false));
    } else {
      setCommits([]);
    }
  }, [project?.githubRepo, currentUser?.githubUsername, currentUser?.githubToken]);

  if (!currentProjectId || !project) {
    return (
      <div className="glass-card p-5 sm:p-8 text-center border border-slate-200/60 max-w-xl mx-auto space-y-4">
        <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 mx-auto" />
        <h3 className="text-sm sm:text-base font-bold text-slate-800">No Project Workspace Linked</h3>
        <p className="text-xs sm:text-sm text-slate-500">
          Coordinators must assign you to a project workspace before you can edit project metrics.
        </p>
      </div>
    );
  }

  const handleDocSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDoc(true);
    let success = false;
    if (currentUser?.role === "student") {
      success = await updateProject(currentProjectId, {
        abstract,
        description,
        objectives,
        methodology,
        techStack: techStack.split(",").map((s) => s.trim()).filter(Boolean),
        modules,
        references,
        futureEnhancements,
        githubRepo,
        progress,
      });
    } else {
      success = await updateProject(currentProjectId, {
        teamLeader,
        teamMembers: teamMemberIds,
        status,
        progress,
        githubRepo,
      });
    }
    setSavingDoc(false);
    if (success) {
      fetchAbstractHistory(currentProjectId).then(setAbstractHistory);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(currentProjectId, file);
    }
  };

  const handleDailyReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDone || !challenges || !nextDayPlan || !reportAbstract) {
      addToast("Please fill all mandatory fields including the project abstract", "error");
      return;
    }

    const success = await submitDailyReport({
      projectId: currentProjectId,
      studentId: currentUser?.userId,
      studentName: currentUser?.name,
      date: new Date().toISOString().split("T")[0],
      workDone,
      challenges,
      nextDayPlan,
      progress: reportProgress,
      abstract: reportAbstract,
    });

    if (success) {
      setShowDailyReportModal(false);
      setDailyReportSubmitted(true);
      fetchAbstractHistory(currentProjectId).then(setAbstractHistory);
    }
  };

  const triggerAIAnalysis = async () => {
    setAnalyzing(true);
    setAiAnalysis("");
    
    // Pass ACTUAL commits to Gemini for a real audit!
    const githubStats = {
      commitsCount: commits.length,
      repo: project.githubRepo,
      recentCommits: commits.map((c) => ({
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
      })),
    };

    const summary = await analyzeProject(project, githubStats);
    setAiAnalysis(summary);
    setAnalyzing(false);
  };

  const getDaysRemaining = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining(project.deadline);

  return (
    <div className="space-y-6 text-left">
      
      {/* Milestone Review Lock Warning Banner */}
      {project.status === "MILESTONE_REVIEW_REQUIRED" && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-xl flex items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-200 flex items-center justify-center font-bold text-amber-800">
              {project.currentMilestone || 25}%
            </div>
            <div>
              <h4 className="font-bold text-sm">Milestone Presentation Approval Required</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Project progress has reached {project.currentMilestone || 25}%. Milestone presentation review with mentor & coordinator is required before further progress accumulation can resume.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired Project Warning Banner */}
      {project.status === "EXPIRED" && (
        <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-xl flex items-center justify-between gap-4 text-rose-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-200 flex items-center justify-center font-bold text-rose-800">
              !
            </div>
            <div>
              <h4 className="font-bold text-sm">Project Deadline Expired</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                The 2-month project deadline has expired. Further project activity is restricted until an extension is requested and approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Summary Row */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/50 px-2.5 py-0.5 rounded">
              {project.department}
            </span>

            {/* Deadline Countdown Badge */}
            {daysRemaining !== null && (
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  daysRemaining < 0
                    ? "bg-rose-600 text-white"
                    : daysRemaining <= 3
                    ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
                    : daysRemaining <= 7
                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {daysRemaining < 0
                  ? `Expired (${Math.abs(daysRemaining)} days ago)`
                  : `${daysRemaining} Days Remaining`}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1 leading-tight">
            {project.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-semibold">
            {(() => {
              const findStudentDetails = (idStr: string) => {
                const found = students.find((s) => (s.userId === idStr || (s as any).id === idStr || (s as any)._id === idStr));
                if (!found) return idStr;
                const regNo = found.registerNumber || (found as any).rollNo || found.userId;
                return `${found.name} (${regNo})`;
              };
              const leaderDisplay = project.teamLeader ? findStudentDetails(project.teamLeader) : "None";
              const membersDisplay = project.teamMembers && project.teamMembers.length > 0
                ? project.teamMembers.map(findStudentDetails).join(", ")
                : "None";

              return (
                <>
                  <span>Leader: <strong className="text-slate-700 font-bold">{leaderDisplay}</strong></span>
                  <span>&bull;</span>
                  <span>Members: <strong className="text-slate-700 font-bold">{membersDisplay}</strong></span>
                </>
              );
            })()}
            {project.githubRepo && (
              <>
                <span>&bull;</span>
                <div className="inline-flex items-center gap-1.5">
                  <a 
                    href={project.githubRepo.startsWith("http") ? project.githubRepo : `https://github.com/${project.githubRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-bold"
                  >
                    <Github className="w-3.5 h-3.5" />
                    {project.githubRepo}
                  </a>
                  <button
                    onClick={() => {
                      const cleanUrl = project.githubRepo?.startsWith("http") ? project.githubRepo : `https://github.com/${project.githubRepo}`;
                      navigator.clipboard.writeText(cleanUrl || "");
                      addToast("Student GitHub Repository URL copied to clipboard!", "success");
                    }}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200"
                  >
                    Copy URL
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {currentUser?.role === "student" && (
            <button
              onClick={() => setShowDailyReportModal(true)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
                dailyReportSubmitted || project.status === "EXPIRED"
                  ? "bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10"
              }`}
              disabled={dailyReportSubmitted || project.status === "EXPIRED"}
            >
              <FileCheck className="w-4.5 h-4.5" />
              <span>{dailyReportSubmitted ? "Daily Log Submitted" : "Log Daily Report"}</span>
            </button>
          )}

          {currentUser?.role === "coordinator" && (
            <button
              onClick={triggerAIAnalysis}
              disabled={analyzing}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-50 hover:bg-blue-100/70 text-blue-600 border border-blue-200/50 font-bold rounded-xl text-sm transition-all shadow-sm"
            >
              <Cpu className="w-4.5 h-4.5" />
              <span>{analyzing ? "AI Auditing..." : "Gemini AI Health Audit"}</span>
            </button>
          )}
        </div>
      </div>


      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Documentation Editors (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {currentUser?.role === "coordinator" && aiAnalysis && (
            <div className="glass-card p-5 border-blue-500/20 bg-blue-50/40 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full filter blur-xl" />
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-blue-600 animate-spin" />
                Gemini AI Workspace Audit Result
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium whitespace-pre-line">{aiAnalysis}</p>
            </div>
          )}

          <div className="glass-card p-6 border border-blue-200/40 space-y-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-blue-600" />
              Project Blueprint & Specifications
            </h3>

            <form onSubmit={handleDocSave} className="space-y-6">
              {currentUser?.role === "student" ? (
                // Student view: inputs for all project specifications
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Abstract / Synopsis
                    </label>
                    <textarea
                      rows={3}
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs leading-relaxed"
                      placeholder="High level summary of project goals..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Objectives
                      </label>
                      <textarea
                        rows={3}
                        value={objectives}
                        onChange={(e) => setObjectives(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                        placeholder="Key objectives..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Tech Stack (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={techStack}
                        onChange={(e) => setTechStack(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                        placeholder="React, Express, PyTorch, MongoDB"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* GitHub Repo Configuration (Student) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-slate-400" />
                        GitHub Repository Path
                      </label>
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                        placeholder="e.g. facebook/react or Monish/Trackflow"
                      />
                    </div>

                    {/* Completion Percentage (Student / Coordinator) */}
                    <div className="space-y-1 text-left">
                      {(() => {
                        const maxLimit = project?.maxAllowedProgress || 25;
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                Project Completion Percentage ({progress}%)
                              </label>
                              {currentUser?.role === "student" && (
                                <span className="text-xs font-extrabold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                  Unlocked Up To: {maxLimit}%
                                </span>
                              )}
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={progress}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (currentUser?.role === "student" && val > maxLimit) {
                                  addToast(`Progress locked at ${maxLimit}%. Coordinator review for ${maxLimit}% milestone is required to unlock further access.`, "info");
                                  setProgress(maxLimit);
                                } else {
                                  setProgress(val);
                                }
                              }}
                              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600 mt-3"
                            />
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 25% Milestone Review & Access Control Card */}
                  <div className="bg-white border border-blue-200/60 p-4 rounded-2xl space-y-3.5 shadow-xs text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          Quarterly Milestone Review & Access Control (Every 25%)
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          Reviews occur at 25%, 50%, 75%, and 100%. Access to each next phase requires coordinator approval.
                        </p>
                      </div>
                      <span className="text-xs font-extrabold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg self-start sm:self-auto">
                        Current Access Limit: {project?.maxAllowedProgress || 25}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[25, 50, 75, 100].map((m) => {
                        const maxLimit = project?.maxAllowedProgress || 25;
                        const isUnlocked = (project?.unlockedPhases || [25]).includes(m) || maxLimit >= m;

                        return (
                          <div
                            key={m}
                            className={`p-3 rounded-xl border text-center space-y-2 transition ${
                              isUnlocked
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                : "bg-slate-50 border-slate-200 text-slate-400"
                            }`}
                          >
                            <span className="text-xs font-black block">Phase {m / 25} ({m}%)</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                              isUnlocked ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                            }`}>
                              {isUnlocked ? "✓ Unlocked" : "🔒 Review Locked"}
                            </span>

                            {(currentUser?.role as string) === "coordinator" && !isUnlocked && (
                              <button
                                type="button"
                                onClick={() => approveProjectMilestone(currentProjectId, m - 25)}
                                className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs mt-1"
                              >
                                Approve {m - 25}% & Unlock {m}%
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {progress >= (project?.maxAllowedProgress || 25) && (project?.maxAllowedProgress || 25) < 100 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span className="leading-relaxed">
                          ⚠️ Progress reached current milestone limit ({project?.maxAllowedProgress || 25}%). Coordinator review for {project?.maxAllowedProgress || 25}% milestone is required to unlock access to {(project?.maxAllowedProgress || 25) + 25}%.
                        </span>
                        {(currentUser?.role as string) === "coordinator" && (
                          <button
                            type="button"
                            onClick={() => approveProjectMilestone(currentProjectId, project?.maxAllowedProgress || 25)}
                            className="whitespace-nowrap px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition shadow-xs"
                          >
                            Approve Review & Unlock {(project?.maxAllowedProgress || 25) + 25}%
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Time Extension Request Panel */}
                  {(progress >= 100 || (project?.deadline && new Date(project.deadline) < new Date()) || project?.extensionStatus === "PENDING" || project?.extensionStatus === "APPROVED") && (
                    <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/90 border border-amber-200 p-4 rounded-2xl space-y-3 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-amber-600" />
                            Project Time Extension Management
                          </h4>
                          <p className="text-xs text-amber-700 font-medium mt-0.5">
                            {progress >= 100
                              ? "Project completed 100%. Submit an extension request if further development time or deliverables are required."
                              : "Deadline extension request workflow for post-completion or further development."}
                          </p>
                        </div>

                        {(currentUser?.role as string) === "student" && project?.extensionStatus !== "PENDING" && (
                          <button
                            type="button"
                            onClick={() => setShowExtensionModal(true)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-xs whitespace-nowrap"
                          >
                            + Request Time Extension
                          </button>
                        )}
                      </div>

                      {project?.extensionStatus === "PENDING" && (
                        <div className="p-3.5 bg-white border border-amber-300 rounded-xl space-y-2 text-xs text-amber-900 shadow-2xs">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-amber-800">
                              ⏳ Requested Extension: +{project.requestedExtensionDays || 7} Days
                            </span>
                            <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-extrabold border border-amber-200">
                              Pending Coordinator Review
                            </span>
                          </div>
                          <p className="text-slate-600 italic font-medium">&quot;{project.extensionReason}&quot;</p>

                          {((currentUser?.role as string) === "coordinator" || (currentUser?.role as string) === "master_admin") && (
                            <div className="flex gap-2 pt-2 border-t border-amber-200/60">
                              <button
                                type="button"
                                onClick={() => respondProjectExtension(currentProjectId, true)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                              >
                                ✓ Approve Extension (+{project.requestedExtensionDays || 7} Days)
                              </button>
                              <button
                                type="button"
                                onClick={() => respondProjectExtension(currentProjectId, false)}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                              >
                                ✕ Reject Request
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {project?.extensionStatus === "APPROVED" && (
                        <div className="text-xs text-emerald-800 font-bold bg-emerald-100/80 border border-emerald-300 p-3 rounded-xl flex items-center gap-2">
                          <span>✓ Extension of +{project.requestedExtensionDays || 7} days approved by coordinator! Deadline updated: {new Date(project.deadline!).toLocaleDateString()}.</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Description / Overview
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                      placeholder="Detailed project summary..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Methodology & Architecture
                    </label>
                    <textarea
                      rows={3}
                      value={methodology}
                      onChange={(e) => setMethodology(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                      placeholder="Describe system design, workflow architecture..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Modules / Deliverables
                      </label>
                      <textarea
                        rows={2}
                        value={modules}
                        onChange={(e) => setModules(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                        placeholder="Module breakdowns..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        References / Links
                      </label>
                      <textarea
                        rows={2}
                        value={references}
                        onChange={(e) => setReferences(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                        placeholder="IEEE papers, docs links..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Future Enhancements
                    </label>
                    <textarea
                      rows={2}
                      value={futureEnhancements}
                      onChange={(e) => setFutureEnhancements(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                      placeholder="Scope for future enhancements..."
                    />
                  </div>
                </div>
              ) : (
                // Coordinator view: inputs to assign team members, update progress & status
                <div className="space-y-5 text-left">
                  <StudentSelector
                    students={students}
                    selectedLeaderId={teamLeader}
                    onLeaderChange={setTeamLeader}
                    selectedMemberIds={teamMemberIds}
                    onMembersChange={setTeamMemberIds}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Project Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                      >
                        <option value="Active" className="bg-white">Active</option>
                        <option value="At Risk" className="bg-white">At Risk</option>
                        <option value="Completed" className="bg-white">Completed</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Progress Percentage ({progress}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  {/* GitHub Repo (Coordinator Edit) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-slate-500" />
                      GitHub Repository Path
                    </label>
                    <input
                      type="text"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                      placeholder="e.g. facebook/react or Monish/Trackflow"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Student-editable Documentation Preview
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                      <div>
                        <span className="font-bold text-slate-800 block">Abstract:</span>
                        <p className="line-clamp-2 mt-0.5">{project.abstract || "None"}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Tech Stack:</span>
                        <p className="mt-0.5">{project.techStack?.join(", ") || "None"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/10"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingDoc ? "Saving Specifications..." : "Save Specifications"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: GitHub Log, File Vault & Timeline logs (1/3 width) */}
        <div className="space-y-6">
          {/* GitHub Commit history panel */}
          <div className="glass-card p-5 border border-blue-200/40 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-200/60 text-left">
              <span className="flex items-center gap-1.5">
                <Github className="w-4 h-4 text-blue-600" />
                GitHub Work Commits
              </span>
              <span className="text-xs text-slate-500 font-bold uppercase">
                {commits.length} Logs
              </span>
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {!project.githubRepo ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No GitHub repository connected yet.
                </div>
              ) : loadingCommits ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading commits from GitHub...
                </div>
              ) : commits.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No commits found or private access restricted. Check GitHub PAT configuration.
                </div>
              ) : (
                commits.map((c) => (
                  <div
                    key={c.sha}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex gap-2.5 text-left text-xs"
                  >
                    {c.author?.avatar_url ? (
                      <img
                        src={c.author.avatar_url}
                        alt="author"
                        className="w-7 h-7 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                        GH
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-slate-800 truncate leading-snug">
                        {c.commit.message}
                      </p>
                      <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                        <span>{c.commit.author.name}</span>
                        <span>{new Date(c.commit.author.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-blue-600 self-center"
                      title="View on GitHub"
                    >
                      <Link2 className="w-4 h-4" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* File Vault Card */}
          <div className="glass-card p-5 border border-blue-200/40 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span>Workspace File Vault</span>
              <label className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/85 text-slate-500 hover:text-slate-800 cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </h3>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {project.files && project.files.length > 0 ? (
                project.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-left text-xs gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB &bull;{" "}
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={file.url.startsWith('/') ? `${API_BASE}${file.url}` : file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg font-bold border border-slate-200"
                    >
                      Download
                    </a>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No files uploaded yet.
                </div>
              )}
            </div>
          </div>

          {/* Abstract version history */}
          <div className="glass-card p-5 border border-blue-200/40 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <History className="w-4 h-4 text-blue-600" />
              Synopsis Timeline History
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {abstractHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Timeline history starts when daily reports update the abstract.
                </div>
              ) : (
                abstractHistory.map((hist, idx) => (
                  <div
                    key={idx}
                    className="relative pl-4 sm:pl-5 border-l-2 border-slate-200 space-y-1 text-left text-xs pb-3 last:pb-0 min-w-0"
                  >
                    <div className="absolute -left-[5.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <div className="flex flex-wrap items-center justify-between gap-1 text-slate-500">
                      <span className="font-bold text-slate-800 text-xs">Version {hist.version}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {new Date(hist.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-500 leading-normal line-clamp-3">
                      {hist.abstract}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Report Input Modal (Student only) */}
      {showDailyReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-xl w-full glass-card p-6 border border-blue-200/65 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-emerald-600" />
                Submit Daily Work Report
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                {new Date().toISOString().split("T")[0]}
              </span>
            </div>

            <form onSubmit={handleDailyReportSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Work Done Today *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={workDone}
                    onChange={(e) => setWorkDone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    placeholder="Details about completed tasks today..."
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Challenges Encountered *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    placeholder="Bugs, resource constraints, delays..."
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Next Day Action Plan *
                </label>
                <textarea
                  rows={2}
                  required
                  value={nextDayPlan}
                  onChange={(e) => setNextDayPlan(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                  placeholder="Steps to complete tomorrow..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Progress updates */}
                <div className="space-y-1 md:col-span-1 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Project Progress ({reportProgress}%) *
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={reportProgress}
                    onChange={(e) => setReportProgress(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600 mt-3"
                  />
                </div>

                {/* Abstract updates */}
                <div className="space-y-1 md:col-span-2 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Active Project Abstract *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={reportAbstract}
                    onChange={(e) => setReportAbstract(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    placeholder="Verify or update current synopsis summary..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDailyReportModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/10"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extension Request Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full glass-card p-6 border border-amber-200/50 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Request Time Extension
              </h3>
              <button
                type="button"
                onClick={() => setShowExtensionModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingExtension(true);
                const ok = await requestProjectExtension(currentProjectId, extensionDaysInput, extensionReasonInput);
                setSubmittingExtension(false);
                if (ok) {
                  setShowExtensionModal(false);
                  setExtensionReasonInput("");
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Requested Additional Days
                </label>
                <select
                  value={extensionDaysInput}
                  onChange={(e) => setExtensionDaysInput(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold cursor-pointer bg-white text-slate-800"
                >
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={21}>21 Days (3 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Reason / Scope for Time Extension <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={extensionReasonInput}
                  onChange={(e) => setExtensionReasonInput(e.target.value)}
                  placeholder="Explain why further time or access is required after 100% completion or deadline..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtensionModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExtension || !extensionReasonInput.trim()}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {submittingExtension ? "Submitting..." : "Submit Extension Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
