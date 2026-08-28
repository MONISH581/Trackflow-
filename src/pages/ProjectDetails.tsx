import React from "react";
import { useParams } from "react-router-dom";
import { useStore, ProjectInfo, UserInfo } from "../store.ts";
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
    addToast,
  } = useStore();

  const [project, setProject] = React.useState<ProjectInfo | null>(null);
  const [students, setStudents] = React.useState<UserInfo[]>([]);
  const [abstractHistory, setAbstractHistory] = React.useState<any[]>([]);
  const [showDailyReportModal, setShowDailyReportModal] = React.useState(false);
  const [dailyReportSubmitted, setDailyReportSubmitted] = React.useState(false);

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
  const [teamMembersInput, setTeamMembersInput] = React.useState("");
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
      setTeamMembersInput(p.teamMembers ? p.teamMembers.join(", ") : "");
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
    if (currentUser?.role === "coordinator") {
      fetch("/api/users/students")
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
    if (project?.githubRepo) {
      setLoadingCommits(true);
      const headers: any = {};
      if (currentUser?.githubToken) {
        headers["Authorization"] = `Bearer ${currentUser.githubToken}`;
      }
      fetch(`https://api.github.com/repos/${project.githubRepo}/commits?per_page=8`, { headers })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load repo commits");
          return r.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setCommits(data);
          }
        })
        .catch((err) => {
          console.error("GitHub API Error:", err);
        })
        .finally(() => setLoadingCommits(false));
    } else {
      setCommits([]);
    }
  }, [project?.githubRepo, currentUser?.githubToken]);

  if (!currentProjectId || !project) {
    return (
      <div className="glass-card p-12 text-center border border-slate-200/60 max-w-xl mx-auto space-y-4">
        <Users className="w-10 h-10 text-blue-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Project Workspace Linked</h3>
        <p className="text-sm text-slate-500">
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
        teamMembers: teamMembersInput.split(",").map((s) => s.trim()).filter(Boolean),
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
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/50 px-2.5 py-0.5 rounded">
              {project.department}
            </span>

            {/* Deadline Countdown Badge */}
            {daysRemaining !== null && (
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
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
            <span>Mentor: {project.mentorName || "Unassigned"}</span>
            <span>&bull;</span>
            <span>Leader: {project.teamLeader || "None"}</span>
            <span>&bull;</span>
            <span>Members: {project.teamMembers.join(", ") || "None"}</span>
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
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200"
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

                    {/* Completion Percentage (Student) */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Project Completion Percentage ({progress}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600 mt-3"
                      />
                    </div>
                  </div>

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Team Leader ID
                      </label>
                      <select
                        value={teamLeader}
                        onChange={(e) => setTeamLeader(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                      >
                        <option value="">Choose Leader</option>
                        {students.map((s) => (
                          <option key={s.userId} value={s.userId} className="bg-white">
                            {s.name} ({s.userId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Team Members (Comma separated User IDs)
                      </label>
                      <input
                        type="text"
                        value={teamMembersInput}
                        onChange={(e) => setTeamMembersInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                        placeholder="student-123, student-456"
                      />
                    </div>
                  </div>

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
              <span className="text-[10px] text-slate-500 font-bold uppercase">
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
                      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[10px] font-bold text-blue-600 flex-shrink-0">
                        GH
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-slate-800 truncate leading-snug">
                        {c.commit.message}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
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
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB &bull;{" "}
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg font-bold border border-slate-200"
                    >
                      View
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
                    className="relative pl-5 border-l-2 border-slate-200 space-y-1 text-left text-xs pb-3 last:pb-0"
                  >
                    <div className="absolute -left-[5.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="font-bold text-slate-800">Version {hist.version}</span>
                      <span className="text-[10px] font-semibold">
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
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
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
    </div>
  );
}
