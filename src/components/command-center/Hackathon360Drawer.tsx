import React from "react";
import {
  X,
  Trophy,
  Calendar,
  Building,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  FolderKanban,
  UsersRound,
  ShieldCheck
} from "lucide-react";

interface Hackathon360DrawerProps {
  data: any | null;
  loading: boolean;
  onClose: () => void;
  onSelectProject?: (projectId: string) => void;
  onSelectTeam?: (teamId: string) => void;
}

export const Hackathon360Drawer: React.FC<Hackathon360DrawerProps> = ({
  data,
  loading,
  onClose,
  onSelectProject,
  onSelectTeam
}) => {
  if (!data && !loading) return null;

  const hackathon = data?.hackathon;
  const stats = data?.stats;
  const projects = data?.projects || [];
  const teams = data?.teams || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Hackathon 360° Dossier
              </span>
              <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">
                {hackathon?.title || hackathon?.name || "Hackathon Event"}
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
              <div className="w-7 h-7 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Aggregating hackathon participation funnel...</p>
            </div>
          ) : hackathon ? (
            <>
              {/* Event Overview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700">
                    Organizer: {hackathon.organizer}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {hackathon.mode || "Online"} • {hackathon.category || "Hackathon"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {hackathon.description || "Official hackathon challenge event."}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60">
                  <span>Start: {hackathon.eventDate ? new Date(hackathon.eventDate).toLocaleDateString() : "TBD"}</span>
                  <span>Deadline: {hackathon.registrationDeadline ? new Date(hackathon.registrationDeadline).toLocaleDateString() : "TBD"}</span>
                </div>
              </div>

              {/* 360° Participation Funnel */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Institution Participation &amp; Progression Funnel
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">Total Interested</span>
                    <span className="text-lg font-black text-slate-900">{stats?.interested ?? 0}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">Registered</span>
                    <span className="text-lg font-black text-blue-600">{stats?.registered ?? 0}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">Verified Proofs</span>
                    <span className="text-lg font-black text-emerald-600">{stats?.verified ?? 0}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">Mapped Teams</span>
                    <span className="text-lg font-black text-cyan-600">{teams.length}</span>
                  </div>
                </div>
              </div>

              {/* Round Distribution Breakdown */}
              {stats?.roundDistribution && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Round Progression Distribution
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(stats.roundDistribution).map(([rnd, count]: any) => (
                      <div key={rnd} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{rnd}</span>
                        <span className="text-base font-black text-slate-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Projects */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Participating Projects ({projects.length})
                </h3>

                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                      No projects currently linked to this hackathon.
                    </div>
                  ) : (
                    projects.map((proj: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => onSelectProject && onSelectProject(proj._id)}
                        className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-amber-300 transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{proj.title || proj.name}</h4>
                          <p className="text-[10px] text-slate-400">Progress: {proj.progress || 0}%</p>
                        </div>
                        <span className="text-[10px] text-amber-600 font-bold hover:underline">
                          View Project &rarr;
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
