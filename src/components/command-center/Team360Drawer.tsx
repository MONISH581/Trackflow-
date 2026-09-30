import React from "react";
import { X, UsersRound, FolderKanban, Trophy, User, ShieldCheck } from "lucide-react";

interface Team360DrawerProps {
  data: any | null;
  loading: boolean;
  onClose: () => void;
  onSelectStudent?: (studentId: string) => void;
  onSelectProject?: (projectId: string) => void;
  onSelectHackathon?: (hackathonId: string) => void;
}

export const Team360Drawer: React.FC<Team360DrawerProps> = ({
  data,
  loading,
  onClose,
  onSelectStudent,
  onSelectProject,
  onSelectHackathon
}) => {
  if (!data && !loading) return null;

  const team = data?.team;
  const project = data?.project;
  const hackathon = data?.hackathon;
  const members = data?.members || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center font-bold">
              <UsersRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                Team 360° Dossier
              </span>
              <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">
                {team?.name || "Team Overview"}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-7 h-7 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Retrieving team structure and member roster...</p>
            </div>
          ) : team ? (
            <>
              {/* Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                    {team.status || "Active Team"}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {members.length} Members Enrolled
                  </span>
                </div>
                <p className="text-xs text-slate-600">{team.description || "Official project team."}</p>
              </div>

              {/* Linked Project & Hackathon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600">Active Project</span>
                  <h4 className="text-xs font-black text-slate-900">{project?.title || "No Project Linked"}</h4>
                  <p className="text-[11px] text-slate-500">Progress: {project?.progress || 0}%</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-600">Associated Hackathon</span>
                  <h4 className="text-xs font-black text-slate-900">{hackathon?.title || "No Hackathon Linked"}</h4>
                  <p className="text-[11px] text-slate-500">{hackathon?.organizer || "Independent"}</p>
                </div>
              </div>

              {/* Team Members List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Roster &amp; Member Roles ({members.length})
                </h3>

                <div className="space-y-2">
                  {members.map((m: any, idx: number) => {
                    const st = m.student || m;
                    return (
                      <div
                        key={idx}
                        onClick={() => onSelectStudent && onSelectStudent(st._id)}
                        className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-cyan-300 transition flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {st.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{st.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">{st.registerNumber} • {st.department}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {m.role || "Team Member"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
