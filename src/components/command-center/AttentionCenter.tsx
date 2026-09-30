import React from "react";
import { AlertTriangle, Clock, ShieldAlert, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { CommandCenterAttention } from "../../store";

interface AttentionCenterProps {
  attention?: CommandCenterAttention;
  onFilterType: (type: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const AttentionCenter: React.FC<AttentionCenterProps> = ({
  attention,
  onFilterType,
  onSelectStudent
}) => {
  if (!attention || attention.items.length === 0) {
    return (
      <div className="bg-emerald-50/60 p-5 rounded-3xl border border-emerald-200/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-900">Zero Critical Attention Alerts</h3>
            <p className="text-xs text-emerald-700">
              All round milestones, proof submissions, and progress indicators are currently within acceptable operational boundaries.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, items } = attention;

  return (
    <div id="attention-center" className="bg-white p-5 rounded-3xl border border-rose-200/80 shadow-xs space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Operational Attention Center</span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {items.length} Action Items
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Items requiring immediate coordinator follow-up, verification clearance, or master intervention.
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {summary.overdueRounds > 0 && (
            <button
              onClick={() => onFilterType("overdue_round")}
              className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition cursor-pointer"
            >
              {summary.overdueRounds} Overdue Rounds
            </button>
          )}
          {summary.approachingDeadlines > 0 && (
            <button
              onClick={() => onFilterType("approaching_deadline")}
              className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 transition cursor-pointer"
            >
              {summary.approachingDeadlines} Approaching Deadlines
            </button>
          )}
          {summary.pendingVerifications > 0 && (
            <button
              onClick={() => onFilterType("pending_verification")}
              className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition cursor-pointer"
            >
              {summary.pendingVerifications} Pending Proofs
            </button>
          )}
          {summary.lowProgress > 0 && (
            <button
              onClick={() => onFilterType("low_progress")}
              className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 transition cursor-pointer"
            >
              {summary.lowProgress} At-Risk Progress
            </button>
          )}
        </div>
      </div>

      {/* Grid of Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.slice(0, 9).map((alert, idx) => {
          const isCritical = alert.severity === "critical";
          const isHigh = alert.severity === "high";

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                isCritical
                  ? "bg-rose-50/50 border-rose-200 hover:border-rose-400"
                  : isHigh
                  ? "bg-amber-50/50 border-amber-200 hover:border-amber-400"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isCritical
                        ? "bg-rose-100 text-rose-700"
                        : isHigh
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  {alert.lab && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {alert.lab}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                  {alert.title}
                </h4>

                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {alert.description}
                </p>
              </div>

              {/* Action Trigger */}
              <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-semibold truncate">
                  {alert.studentName || alert.projectName || "General"}
                </span>

                {alert.studentId && (
                  <button
                    onClick={() => onSelectStudent(alert.studentId!)}
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
