import React from "react";
import { Database, AlertCircle, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { CommandCenterDataQuality } from "../../store";

interface DataQualityPanelProps {
  dataQuality?: CommandCenterDataQuality;
  onSelectEntity: (type: "student" | "team" | "project", id: string) => void;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({
  dataQuality,
  onSelectEntity
}) => {
  if (!dataQuality || dataQuality.issues.length === 0) {
    return (
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Institutional Data Integrity Score: 100%
            </h3>
            <p className="text-xs text-slate-500">
              Zero orphaned records, unlinked projects, or missing register numbers detected across all 7 labs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, issues } = dataQuality;

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
      {/* Title & Stats */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>Data Quality &amp; Integrity Audit</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {summary.totalIssues} Potential Discrepancies
              </span>
            </h3>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          Non-destructive administrative recommendations
        </div>
      </div>

      {/* Issues List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {issues.slice(0, 6).map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {item.entityType}: {item.entityName}
                </span>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                    item.severity === "high"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.severity}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.issue}</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.suggestion}</p>
            </div>

            {item.entityType !== "mapping" && (
              <button
                onClick={() => onSelectEntity(item.entityType as any, item.entityId)}
                className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Entity</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
