import React from "react";
import {
  X,
  FolderKanban,
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface Project360DrawerProps {
  data: any | null;
  loading: boolean;
  onClose: () => void;
  onSelectStudent?: (studentId: string) => void;
}

export const Project360Drawer: React.FC<Project360DrawerProps> = ({
  data,
  loading,
  onClose,
  onSelectStudent
}) => {
  if (!data && !loading) return null;

  const project = data?.project;
  const team = data?.team;
  const hackathon = data?.hackathon;
  const students = data?.students || [];

  const timelineSteps = [
    { name: "Registration", status: "completed" },
    { name: "Approval", status: "completed" },
    { name: "Round 1", status: project?.progress >= 25 ? "completed" : "active" },
    { name: "Round 2", status: project?.progress >= 60 ? "completed" : project?.progress >= 25 ? "active" : "pending" },
    { name: "Round 3", status: project?.progress >= 90 ? "completed" : project?.progress >= 60 ? "active" : "pending" },
    { name: "Final", status: project?.progress === 100 ? "completed" : "pending" }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-bold">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                Project 360° Dossier
              </span>
              <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">
                {project?.title || "Project Details"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Loading comprehensive project metrics...</p>
            </div>
          ) : project ? (
            <>
              {/* Project Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {project.status || "active"}
                  </span>
                  <span className="text-xs font-black text-indigo-600">
                    {project.progress || 0}% Complete
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {project.description || "No project description specified."}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}
                  />
                </div>
              </div>

              {/* Visual Project Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Visual Milestone Progression Timeline
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {timelineSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-center text-xs space-y-1 ${
                        step.status === "completed"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : step.status === "active"
                          ? "bg-indigo-50 border-indigo-200 text-indigo-800 font-bold ring-2 ring-indigo-400/40"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      <div className="flex justify-center">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className="text-[10px] block leading-tight">{step.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Associated Team & Hackathon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-cyan-600">Assigned Team</span>
                  <h4 className="text-xs font-black text-slate-900">{team?.name || "No Team Linked"}</h4>
                  <p className="text-[11px] text-slate-500">{team?.members?.length || 0} members enrolled</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-600">Hackathon Alignment</span>
                  <h4 className="text-xs font-black text-slate-900">{hackathon?.title || "Independent Project"}</h4>
                  <p className="text-[11px] text-slate-500">{hackathon?.organizer || "Internal TrackFlow"}</p>
                </div>
              </div>

              {/* Enrolled Students */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Participating Students ({students.length})
                </h3>

                <div className="space-y-2">
                  {students.map((st: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => onSelectStudent && onSelectStudent(st._id)}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{st.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{st.registerNumber} • {st.department}</p>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold hover:underline">
                        View Dossier &rarr;
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
