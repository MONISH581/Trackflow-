import React, { useState, useEffect } from "react";
import { useStore, DailyReportInfo } from "../store.ts";
import { ClipboardCheck, History, Send, GitCommit, Link as LinkIcon, Search, Copy, Check } from "lucide-react";

export default function DailyReportSystem() {
  const { currentUser, activeProject, projects, submitDailyReport, fetchDailyReports, fetchStudentDailyReportHistory, connectGithubRepo, addToast } = useStore();
  
  // Coordinators default to viewing history (student reports)
  const [activeTab, setActiveTab] = useState<"submit" | "history">(currentUser?.role === "coordinator" ? "history" : "submit");
  const [reportsHistory, setReportsHistory] = useState<DailyReportInfo[]>([]);
  const [searchStudent, setSearchStudent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // GitHub Repo connection state
  const [githubInput, setGithubInput] = useState(activeProject?.githubRepo || "");
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);

  // Daily Report form state
  const [formData, setFormData] = useState({
    objective: "",
    workDone: "",
    challenges: "",
    solution: "",
    technologies: "",
    codeCompleted: "",
    nextDayPlan: "",
    progress: activeProject?.progress || 0,
    remarks: "",
    githubCommitUrl: "",
    githubCommitMessage: "",
  });

  useEffect(() => {
    if (currentUser?.role === "coordinator") {
      // Load all daily reports across all active projects for Coordinator viewing
      fetchAllDailyReportsForCoordinator();
    } else if (activeProject) {
      setFormData((prev) => ({ ...prev, progress: activeProject.progress }));
      setGithubInput(activeProject.githubRepo || "");
      fetchReportsForProject(activeProject._id || activeProject.id);
    } else if (currentUser?.role === "student") {
      fetchStudentHistory(currentUser.userId);
    }
  }, [activeProject, currentUser]);

  const fetchAllDailyReportsForCoordinator = async () => {
    try {
      const allReports: DailyReportInfo[] = [];
      for (const p of projects) {
        const list = await fetchDailyReports(p._id || p.id);
        allReports.push(...list);
      }
      setReportsHistory(allReports);
    } catch (e) {}
  };

  const fetchReportsForProject = async (projectId: string) => {
    const list = await fetchDailyReports(projectId);
    setReportsHistory(list);
  };

  const fetchStudentHistory = async (studentId: string) => {
    const list = await fetchStudentDailyReportHistory(studentId);
    setReportsHistory(list);
  };

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !githubInput) return;
    setIsConnectingGithub(true);
    await connectGithubRepo(activeProject._id || activeProject.id, currentUser?.userId || "", githubInput);
    setIsConnectingGithub(false);
  };

  const handleCopyGithubUrl = (url: string, idStr: string) => {
    if (!url) return;
    const cleanUrl = url.startsWith("http") ? url : `https://github.com/${url}`;
    navigator.clipboard.writeText(cleanUrl);
    setCopiedId(idStr);
    addToast("Student GitHub Repository URL copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    const todayStr = new Date().toISOString().split("T")[0];

    setIsSubmitting(true);
    const techArray = formData.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const ok = await submitDailyReport({
      projectId: activeProject._id || activeProject.id,
      studentId: currentUser?.userId || "",
      studentName: currentUser?.name || "Student",
      date: todayStr,
      objective: formData.objective,
      workDone: formData.workDone,
      challenges: formData.challenges,
      solution: formData.solution,
      technologies: techArray,
      codeCompleted: formData.codeCompleted,
      nextDayPlan: formData.nextDayPlan,
      progress: Number(formData.progress),
      remarks: formData.remarks,
      githubCommitUrl: formData.githubCommitUrl,
      githubCommitMessage: formData.githubCommitMessage,
      abstract: formData.workDone.slice(0, 150),
    });

    setIsSubmitting(false);
    if (ok) {
      setActiveTab("history");
      fetchReportsForProject(activeProject._id || activeProject.id);
    }
  };

  const filteredReports = reportsHistory.filter((r) =>
    (r.studentName || "").toLowerCase().includes(searchStudent.toLowerCase()) ||
    (r.objective || "").toLowerCase().includes(searchStudent.toLowerCase()) ||
    (r.date || "").includes(searchStudent)
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-left">
      {/* Header Banner */}
      <div className="glass-card p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {currentUser?.role === "coordinator" ? "Student Daily Reports Monitoring" : "Daily Project Report System"}
            </h1>
            <p className="text-sm text-slate-500">
              {currentUser?.role === "coordinator"
                ? "Review student daily logs, inspect progress milestones, and copy GitHub repositories"
                : "Record daily project progress, log challenges & link GitHub commits"}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {currentUser?.role === "student" && (
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "submit" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Submit Today's Report
            </button>
          )}
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {currentUser?.role === "coordinator" ? "Student Daily Reports History" : "Development History"} ({filteredReports.length})
          </button>
        </div>
      </div>

      {/* GitHub Repository Banner for Student */}
      {currentUser?.role === "student" && activeProject && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <GitCommit className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm">My GitHub Repository</h3>
                <p className="text-xs text-slate-300">
                  {activeProject.githubRepo ? (
                    <span className="text-emerald-400 font-medium">✓ Connected: {activeProject.githubRepo}</span>
                  ) : (
                    "No GitHub repository connected yet. Every active project requires a repository."
                  )}
                </p>
              </div>
            </div>

            {activeProject.githubRepo && (
              <button
                onClick={() => handleCopyGithubUrl(activeProject.githubRepo!, "my-repo")}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
              >
                {copiedId === "my-repo" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === "my-repo" ? "Copied!" : "Copy My GitHub Link"}</span>
              </button>
            )}
          </div>

          <form onSubmit={handleConnectGithub} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              placeholder="https://github.com/username/project-repo"
              value={githubInput}
              onChange={(e) => setGithubInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={isConnectingGithub}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{activeProject.githubRepo ? "Update Repo" : "Connect Repo"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === "submit" && currentUser?.role === "student" ? (
        <div className="glass-card p-8 border border-slate-200 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-800">Daily Project Status Form</h2>
            <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Today's Main Objective *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement user authentication and JWT middleware"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Current Project Progress (%) *</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg border border-blue-200/60 min-w-[55px] text-center">
                    {formData.progress}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Work Completed Today *</label>
              <textarea
                rows={3}
                required
                placeholder="Describe specific features built, code modules completed, tests written, UI designed..."
                value={formData.workDone}
                onChange={(e) => setFormData({ ...formData, workDone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Problems / Issues Faced *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State any bugs, blocker errors, API failures, database connection issues..."
                  value={formData.challenges}
                  onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Solution / Approach Taken</label>
                <textarea
                  rows={3}
                  placeholder="How did you resolve or plan to resolve the issue? (e.g. updated env config)"
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Technologies / Tools Used</label>
                <input
                  type="text"
                  placeholder="e.g. React, Express, MongoDB, Socket.IO (comma separated)"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Tomorrow's Plan *</label>
                <input
                  type="text"
                  required
                  placeholder="What will you work on tomorrow?"
                  value={formData.nextDayPlan}
                  onChange={(e) => setFormData({ ...formData, nextDayPlan: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">GitHub Commit URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo/commit/abc1234"
                  value={formData.githubCommitUrl}
                  onChange={(e) => setFormData({ ...formData, githubCommitUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">GitHub Commit Message / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. feat: user authentication module implemented"
                  value={formData.githubCommitMessage}
                  onChange={(e) => setFormData({ ...formData, githubCommitMessage: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Daily Report</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* History / Coordinator Daily Reports Monitoring View */
        <div className="space-y-6">
          <div className="glass-card p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {currentUser?.role === "coordinator" ? "Student Daily Reports Archive" : "Permanent Development History Log"}
              </h2>
              <p className="text-xs text-slate-500">Every daily report submitted is permanently preserved as an official record</p>
            </div>

            {/* Search filter for Coordinator / Students */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or report..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Daily Reports Found</h3>
              <p className="text-xs text-slate-400 mt-1">Submitted reports will appear here automatically.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-blue-500/30 ml-4 space-y-6 pl-6">
              {filteredReports.map((report) => {
                const reportId = report.id || report._id || Math.random().toString();
                const proj = projects.find(p => p.id === report.projectId || p._id === report.projectId);
                const repoUrl = report.githubCommitUrl || proj?.githubRepo;

                return (
                  <div key={reportId} className="glass-card p-6 border border-slate-200 rounded-2xl relative hover:shadow-xl transition-all">
                    <div className="absolute -left-[31px] top-6 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3 mb-4">
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{report.date}</span>
                        <h3 className="font-bold text-slate-800 text-base">{report.objective || "Daily Report Submission"}</h3>
                        <p className="text-xs text-slate-500 font-semibold">
                          Student: <span className="text-slate-800 font-bold">{report.studentName}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {repoUrl && (
                          <button
                            onClick={() => handleCopyGithubUrl(repoUrl, reportId)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                          >
                            {copiedId === reportId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{copiedId === reportId ? "Copied!" : "Copy GitHub URL"}</span>
                          </button>
                        )}
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200/60">
                          {report.progress}% Completed
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Work Completed:</span>
                        <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">{report.workDone}</p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Issues & Solutions:</span>
                        <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                          <span className="font-semibold text-rose-600">Issues:</span> {report.challenges}<br/>
                          {report.solution && <><span className="font-semibold text-emerald-600">Solution:</span> {report.solution}</>}
                        </p>
                      </div>
                    </div>

                    {report.nextDayPlan && (
                      <div className="mt-3 text-xs">
                        <span className="font-bold text-slate-700">Tomorrow's Plan:</span>
                        <span className="text-slate-600 ml-2">{report.nextDayPlan}</span>
                      </div>
                    )}

                    {report.githubCommitUrl && (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-blue-600">
                          <GitCommit className="w-4 h-4" />
                          <a href={report.githubCommitUrl} target="_blank" rel="noreferrer" className="hover:underline font-semibold truncate max-w-xs sm:max-w-md">
                            Commit: {report.githubCommitMessage || report.githubCommitUrl}
                          </a>
                        </div>

                        <button
                          onClick={() => handleCopyGithubUrl(report.githubCommitUrl!, `commit-${reportId}`)}
                          className="text-xs text-slate-500 hover:text-blue-600 font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Commit URL</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
