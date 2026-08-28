import React from "react";
import { useStore } from "../store.ts";
import { Users, FileText, ChevronDown, ChevronUp, Calendar, Github, Link2, ClipboardCheck } from "lucide-react";

interface Record {
  student: {
    id: string;
    name: string;
    email: string;
    department: string;
    year: string;
  };
  project: {
    id: string;
    name: string;
    teamLeader: string;
    teamMembers: string[];
    progress: number;
    abstract: string;
    status: string;
    githubRepo?: string;
  } | null;
  lastReportDate: string;
  dailyReports: Array<{
    date: string;
    workDone: string;
    challenges: string;
    nextDayPlan: string;
    progress: number;
  }>;
  attendanceLogs?: Array<{
    date: string;
    status: string;
  }>;
}

export default function StudentRecords() {
  const { fetchStudentRecords } = useStore();
  const [records, setRecords] = React.useState<Record[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedRecord, setExpandedRecord] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchStudentRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, [fetchStudentRecords]);

  const toggleExpand = (studentId: string) => {
    setExpandedRecord(expandedRecord === studentId ? null : studentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Student Records & Daily Logs</h2>
        <p className="text-sm text-slate-500">
          Track academic standing, project attachments, and daily submissions for all approved students.
        </p>
      </div>

      {records.length === 0 ? (
        <div className="glass-card p-12 text-center border border-blue-200/40 max-w-xl mx-auto space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Student Records Found</h3>
          <p className="text-sm text-slate-500">
            Once students register and are approved by the coordinator, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(({ student, project, lastReportDate, dailyReports, attendanceLogs }) => {
            const isExpanded = expandedRecord === student.id;
            return (
              <div
                key={student.id}
                className="glass-card border border-blue-200/35 overflow-hidden transition-all duration-200 shadow-sm"
              >
                {/* Header Summary Row */}
                <div
                  onClick={() => toggleExpand(student.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/50 flex items-center justify-center text-blue-600 font-extrabold text-sm">
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{student.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-0.5 font-medium">
                        <span>{student.email}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-blue-600 font-bold">{student.department}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span>Year {student.year}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
                    <div className="text-left md:text-right space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Linked Project
                      </span>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                        {project ? project.name : "Unassigned"}
                      </p>
                    </div>

                    <div className="text-left md:text-right space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Last Activity
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lastReportDate}</span>
                      </div>
                    </div>

                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div className="border-t border-blue-200/35 bg-slate-50/20 p-5 space-y-6">
                    {/* Project Status Info Card */}
                    {project ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2 space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Project Abstract Summary
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed bg-white border border-blue-200/30 p-3.5 rounded-xl font-medium">
                            {project.abstract || "No abstract submitted yet."}
                          </p>
                        </div>
                        <div className="glass-card p-4 border border-blue-200/40 flex flex-col justify-between text-left">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Project Health
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  project.status === "Active"
                                    ? "bg-emerald-500"
                                    : project.status === "At Risk"
                                    ? "bg-rose-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <span className="text-sm font-bold text-slate-800">{project.status}</span>
                            </div>
                          </div>

                          <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-500 font-bold">
                              <span>Work Completed</span>
                              <span className="font-bold text-slate-800">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 border border-dashed border-slate-200 p-4 text-center rounded-xl">
                        This student is not currently attached to any project team.
                      </div>
                    )}



                    {/* Attendance Log Section */}
                    {dailyReports && (
                      <div className="space-y-3 text-left">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                          Attendance Dates Present ({attendanceLogs?.length || 0})
                        </h4>
                        {attendanceLogs && attendanceLogs.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {attendanceLogs.map((log, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Calendar className="w-3.5 h-3.5" />
                                {log.date}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No attendance records marked as present.</p>
                        )}
                      </div>
                    )}

                    {/* Grid for Daily Logs vs GitHub commits */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Daily Logs Timeline */}
                      <div className="space-y-4 text-left">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Daily Submission Log ({dailyReports.length})
                        </h4>

                        {dailyReports.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No reports submitted yet.</p>
                        ) : (
                          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {dailyReports.map((report, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-xl bg-white border border-blue-200/30 space-y-3 text-left shadow-sm"
                              >
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {report.date}
                                  </span>
                                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    Progress: {report.progress}%
                                  </span>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div>
                                    <span className="font-bold text-slate-500">Work Done: </span>
                                    <span className="text-slate-600 font-medium">{report.workDone}</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-500">Challenges: </span>
                                    <span className="text-slate-600 font-medium">{report.challenges}</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-500">Next Plan: </span>
                                    <span className="text-slate-600 font-medium">{report.nextDayPlan}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* GitHub Commit logs timeline */}
                      <div className="space-y-4 text-left">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <Github className="w-4 h-4 text-blue-600" />
                            Live GitHub Commits
                          </span>
                          {project?.githubRepo && (
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://github.com/${project.githubRepo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5 lowercase font-bold"
                              >
                                {project.githubRepo}
                                <Link2 className="w-3 h-3" />
                              </a>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://github.com/${project.githubRepo}`);
                                  alert("Student GitHub Repository URL copied to clipboard!");
                                }}
                                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200"
                              >
                                Copy URL
                              </button>
                            </div>
                          )}
                        </h4>


                        {project?.githubRepo ? (
                          <StudentCommitsViewer githubRepo={project.githubRepo} />
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                            No GitHub repository connected to project.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Commits timeline sub-component
function StudentCommitsViewer({ githubRepo }: { githubRepo: string }) {
  const [commits, setCommits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch(`https://api.github.com/repos/${githubRepo}/commits?per_page=6`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCommits(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [githubRepo]);

  if (loading) {
    return <div className="text-xs text-slate-400 italic">Loading commits from GitHub...</div>;
  }

  if (commits.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic py-8 border border-dashed border-slate-200 rounded-xl text-center">
        No commits found or repository is private.
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
      {commits.map((c) => (
        <div
          key={c.sha}
          className="p-3 rounded-xl bg-white border border-blue-200/30 flex justify-between items-center text-xs text-left shadow-sm gap-3"
        >
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-slate-800 truncate block leading-tight">
              {c.commit.message}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              By {c.commit.author.name} &bull; {new Date(c.commit.author.date).toLocaleDateString()}
            </span>
          </div>
          <a
            href={c.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-blue-600 flex-shrink-0"
            title="View Commit on GitHub"
          >
            <Link2 className="w-4 h-4" />
          </a>
        </div>
      ))}
    </div>
  );
}
