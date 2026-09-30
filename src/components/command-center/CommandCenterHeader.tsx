import React from "react";
import { RefreshCw, Shield, AlertTriangle, Download, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CommandCenterHeaderProps {
  currentUser: any;
  lastRefresh: Date;
  onRefresh: () => void;
  loading: boolean;
  attentionCount: number;
  onExportCSV: () => void;
  onScrollToAttention: () => void;
}

export const CommandCenterHeader: React.FC<CommandCenterHeaderProps> = ({
  currentUser,
  lastRefresh,
  onRefresh,
  loading,
  attentionCount,
  onExportCSV,
  onScrollToAttention
}) => {
  const isMaster = currentUser?.role === "master_admin";

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(lastRefresh);

  return (
    <div className="bg-slate-900 text-white p-5 sm:p-7 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Title & Scope */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[11px] font-black tracking-wider uppercase">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              {isMaster ? "MASTER ADMIN • ALL 7 LABS" : `COORDINATOR • ${currentUser?.lab || "Assigned Lab"}`}
            </span>

            {attentionCount > 0 && (
              <button
                onClick={onScrollToAttention}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold hover:bg-amber-500/30 transition cursor-pointer"
                title="Items requiring administrative attention"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{attentionCount} Action{attentionCount > 1 ? "s" : ""} Required</span>
              </button>
            )}

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Refreshed: {formattedTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            TRACKFLOW 360° COMMAND CENTER
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Institution-wide student, project, team, hackathon, and round progression command matrix.
            Single-pane administrative visibility from individual participants to institution outcomes.
          </p>
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start lg:self-auto">
          {isMaster && (
            <Link
              to="/master-control"
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Return to Master Control Center"
            >
              <span>Master Control</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          )}

          <button
            onClick={onExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh Live Data"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
