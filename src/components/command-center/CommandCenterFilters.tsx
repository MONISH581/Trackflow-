import React from "react";
import { Search, X, Filter, Building2, Layers, ShieldAlert, Sparkles } from "lucide-react";
import { OFFICIAL_LABS, OFFICIAL_DEPARTMENTS } from "../../constants/departments";

export interface CommandCenterFilterState {
  search: string;
  lab: string;
  department: string;
  roundStatus: string;
  verificationStatus: string;
  internalStatus: string;
  isAtRiskOnly: boolean;
  hasProjectOnly: boolean;
  kpiFilterKey?: string | null;
}

interface CommandCenterFiltersProps {
  filters: CommandCenterFilterState;
  onChangeFilters: (filters: CommandCenterFilterState) => void;
  onResetFilters: () => void;
  isMaster: boolean;
  userLab?: string;
  totalCount: number;
  filteredCount: number;
}

export const CommandCenterFilters: React.FC<CommandCenterFiltersProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
  isMaster,
  userLab,
  totalCount,
  filteredCount
}) => {
  const updateField = (key: keyof CommandCenterFilterState, value: any) => {
    onChangeFilters({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    (isMaster && filters.lab !== "ALL") ||
    filters.department !== "ALL" ||
    filters.roundStatus !== "ALL" ||
    filters.verificationStatus !== "ALL" ||
    filters.internalStatus !== "ALL" ||
    filters.isAtRiskOnly ||
    filters.hasProjectOnly ||
    Boolean(filters.kpiFilterKey);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
      {/* Top Row: Search Bar & Primary Scope */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Global Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateField("search", e.target.value)}
            placeholder="Search student, register no, team, project, hackathon, or round..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          {filters.search && (
            <button
              onClick={() => updateField("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 7-Lab Scope Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 min-w-max">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-400 hidden sm:inline">Lab Scope:</span>
            {isMaster ? (
              <select
                value={filters.lab}
                onChange={(e) => updateField("lab", e.target.value)}
                className="bg-transparent font-black text-slate-800 focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                <option value="ALL">ALL 7 LABS (INSTITUTION)</option>
                {OFFICIAL_LABS.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-black text-indigo-700">{userLab || "Assigned Lab"}</span>
            )}
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition flex items-center gap-1 cursor-pointer min-w-max"
              title="Clear all active filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Second Row: Specific Attribute Filters */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[11px] font-black uppercase text-slate-400 mr-1">
          <Filter className="w-3 h-3" />
          <span>Filters:</span>
        </div>

        {/* Department Filter */}
        <select
          value={filters.department}
          onChange={(e) => updateField("department", e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[170px] truncate"
        >
          <option value="ALL">All Departments</option>
          {OFFICIAL_DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Round Status Filter */}
        <select
          value={filters.roundStatus}
          onChange={(e) => updateField("roundStatus", e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="ALL">All Round Statuses</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="at_risk">At Risk</option>
          <option value="not_started">Not Started</option>
        </select>

        {/* Verification Status Filter */}
        <select
          value={filters.verificationStatus}
          onChange={(e) => updateField("verificationStatus", e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="ALL">All Verifications</option>
          <option value="verified">Verified Proof</option>
          <option value="pending">Pending Proof Verification</option>
          <option value="interested">Expressed Interest Only</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Internal Status Filter */}
        <select
          value={filters.internalStatus}
          onChange={(e) => updateField("internalStatus", e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="ALL">All Internal Statuses</option>
          <option value="on_track">On Track</option>
          <option value="needs_review">Needs Review</option>
          <option value="delayed">Delayed</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
        </select>

        {/* At Risk Only Toggle */}
        <button
          onClick={() => updateField("isAtRiskOnly", !filters.isAtRiskOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            filters.isAtRiskOnly
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-200"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>At-Risk Only</span>
        </button>

        {/* Has Project Only Toggle */}
        <button
          onClick={() => updateField("hasProjectOnly", !filters.hasProjectOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            filters.hasProjectOnly
              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
              : "bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border-slate-200 hover:border-indigo-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Has Project</span>
        </button>

        {/* Result Count Badge */}
        <div className="ml-auto text-[11px] font-bold text-slate-500">
          Showing <span className="text-slate-900 font-black">{filteredCount}</span> of {totalCount} records
        </div>
      </div>
    </div>
  );
};
