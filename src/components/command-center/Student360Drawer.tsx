import React from "react";
import {
  X,
  User,
  Mail,
  Building2,
  Award,
  Layers,
  ShieldCheck,
  Clock,
  FolderKanban,
  UsersRound,
  Trophy,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

interface Student360DrawerProps {
  data: any | null;
  loading: boolean;
  onClose: () => void;
  onSelectProject?: (projectId: string) => void;
  onSelectTeam?: (teamId: string) => void;
  onSelectHackathon?: (hackathonId: string) => void;
}

export const Student360Drawer: React.FC<Student360DrawerProps> = ({
  data,
  loading,
  onClose,
  onSelectProject,
  onSelectTeam,
  onSelectHackathon
}) => {
  if (!data && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                Student 360° Dossier
              </span>
              <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">
                {data?.student?.name || "Student Details"}
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
              <p className="text-xs text-slate-500 font-bold">Assembling complete 360° institutional profile...</p>
            </div>
          ) : data ? (
            <>
              {/* 1. Core Profile Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Institutional Record
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {data.student?.status || "Active Student"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Register Number</span>
                    <span className="font-mono font-bold text-slate-800">
                      {data.student?.registerNumber || "Not Registered"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Official Lab</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {data.student?.lab || "Assigned Lab Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Department</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {data.student?.department || "General Dept"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="font-medium text-slate-700 truncate block">
                      {data.student?.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Year of Study</span>
                    <span className="font-bold text-slate-800">
                      Year {data.student?.year || 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Attendance Rate</span>
                    <span className="font-black text-indigo-600">
                      {data.attendance?.attendanceRate ?? 100}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Hackathons & Round Progression */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <span>Hackathons &amp; Round Progression ({data.hackathonParticipations?.length || 0})</span>
                </h3>

                {data.hackathonParticipations?.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    No hackathon participation records found.
                  </div>
                ) : (
                  data.hackathonParticipations.map((part: any, idx: number) => {
                    const h = part.hackathon;
                    const m = part.mapping;

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                              {h?.organizer || "Official Hackathon"}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">{h?.title || "Hackathon"}</h4>
                          </div>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              part.verified
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {part.verified ? "Verified Proof" : "Pending Proof"}
                          </span>
                        </div>

                        {/* Mapping & Round Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Current Round</span>
                            <span className="font-bold text-slate-800">
                              {m?.currentRoundId || "Round 1"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Round Status</span>
                            <span className="font-bold text-slate-800">
                              {m?.roundStatus || "in_progress"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Internal Progress</span>
                            <span className="font-black text-indigo-600">
                              {m?.internalProgress ?? 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Round Deadline</span>
                            <span className="font-medium text-slate-700">
                              {m?.roundDeadline ? new Date(m.roundDeadline).toLocaleDateString() : "TBD"}
                            </span>
                          </div>
                        </div>

                        {/* Remarks */}
                        {(m?.coordinatorRemarks || m?.masterRemarks) && (
                          <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs">
                            {m.coordinatorRemarks && (
                              <p className="text-[11px] text-slate-600">
                                <strong className="text-blue-600">Coordinator Remark:</strong> {m.coordinatorRemarks}
                              </p>
                            )}
                            {m.masterRemarks && (
                              <p className="text-[11px] text-purple-700">
                                <strong className="text-purple-600">Master Remark:</strong> {m.masterRemarks}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 3. Associated Projects */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Linked Projects ({data.projects?.length || 0})
                </h3>

                {data.projects?.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    No active projects mapped to this student.
                  </div>
                ) : (
                  data.projects.map((proj: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900">{proj.title}</h4>
                        <span className="text-[10px] font-bold text-indigo-600">
                          {proj.progress || 0}% Progress
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{proj.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        <span>Category: {proj.category || "General"}</span>
                        <span>Status: {proj.status || "active"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 4. Teams Membership */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Team Memberships ({data.teams?.length || 0})
                </h3>

                {data.teams?.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    Student has not yet joined or formed a team.
                  </div>
                ) : (
                  data.teams.map((tm: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{tm.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {tm.members?.length || 1} team members
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                        {tm.status || "Active Team"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
