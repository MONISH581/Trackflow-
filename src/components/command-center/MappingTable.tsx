import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FolderKanban,
  UsersRound,
  Trophy,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { CommandCenterMappingItem } from "../../store";

interface MappingTableProps {
  mappings: CommandCenterMappingItem[];
  onSelectStudent: (studentId: string) => void;
  onSelectProject: (projectId: string) => void;
  onSelectTeam: (teamId: string) => void;
  onSelectHackathon: (hackathonId: string) => void;
}

type SortField =
  | "studentName"
  | "registerNumber"
  | "lab"
  | "department"
  | "projectName"
  | "hackathonName"
  | "progress"
  | "roundDeadline"
  | "verificationStatus";

export const MappingTable: React.FC<MappingTableProps> = ({
  mappings,
  onSelectStudent,
  onSelectProject,
  onSelectTeam,
  onSelectHackathon
}) => {
  const [sortField, setSortField] = useState<SortField>("studentName");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedMappings = useMemo(() => {
    return [...mappings].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      switch (sortField) {
        case "studentName":
          valA = a.studentName || "";
          valB = b.studentName || "";
          break;
        case "registerNumber":
          valA = a.registerNumber || "";
          valB = b.registerNumber || "";
          break;
        case "lab":
          valA = a.lab || "";
          valB = b.lab || "";
          break;
        case "department":
          valA = a.department || "";
          valB = b.department || "";
          break;
        case "projectName":
          valA = a.projectName || "";
          valB = b.projectName || "";
          break;
        case "hackathonName":
          valA = a.hackathonName || "";
          valB = b.hackathonName || "";
          break;
        case "progress":
          valA = a.projectProgress ?? a.internalProgress ?? 0;
          valB = b.projectProgress ?? b.internalProgress ?? 0;
          break;
        case "roundDeadline":
          valA = a.roundDeadline ? new Date(a.roundDeadline).getTime() : 0;
          valB = b.roundDeadline ? new Date(b.roundDeadline).getTime() : 0;
          break;
        case "verificationStatus":
          valA = a.verificationStatus || "";
          valB = b.verificationStatus || "";
          break;
        default:
          valA = "";
          valB = "";
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [mappings, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedMappings.length / pageSize));
  const currentRecords = sortedMappings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Student &rarr; Project &rarr; Hackathon Detail Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any row to open the complete 360° dossier. Sort, paginate, and track real-time progression.
          </p>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-200/80">
              <th
                onClick={() => handleSort("studentName")}
                className="p-3.5 pl-5 cursor-pointer hover:text-slate-800 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Student</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort("registerNumber")}
                className="p-3.5 cursor-pointer hover:text-slate-800 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Reg No</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort("lab")}
                className="p-3.5 cursor-pointer hover:text-slate-800 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Lab & Dept</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5">Team</th>
              <th
                onClick={() => handleSort("projectName")}
                className="p-3.5 cursor-pointer hover:text-slate-800 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Project</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort("hackathonName")}
                className="p-3.5 cursor-pointer hover:text-slate-800 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Hackathon</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5">Round</th>
              <th
                onClick={() => handleSort("progress")}
                className="p-3.5 cursor-pointer hover:text-slate-800 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Progress</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort("verificationStatus")}
                className="p-3.5 cursor-pointer hover:text-slate-800 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Verification</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort("roundDeadline")}
                className="p-3.5 cursor-pointer hover:text-slate-800 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Deadline</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                  No matching records found for this filter criteria.
                </td>
              </tr>
            ) : (
              currentRecords.map((m, idx) => {
                const progressVal = m.projectProgress ?? m.internalProgress ?? 0;

                return (
                  <tr
                    key={`${m.studentId}-${m.hackathonId}-${idx}`}
                    onClick={() => onSelectStudent(m.studentId)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Student */}
                    <td className="p-3.5 pl-5">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                        <span>{m.studentName || "Unnamed Student"}</span>
                        {m.isAtRisk && (
                          <span title={m.atRiskReason || "At Risk"}>
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {m.studentEmail}
                      </div>
                    </td>

                    {/* Register Number */}
                    <td className="p-3.5 font-mono text-[11px] font-semibold text-slate-600">
                      {m.registerNumber || "—"}
                    </td>

                    {/* Lab & Dept */}
                    <td className="p-3.5 max-w-[180px]">
                      <div className="font-bold text-slate-800 truncate" title={m.lab}>
                        {m.lab || "—"}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate" title={m.department}>
                        {m.department || "—"}
                      </div>
                    </td>

                    {/* Team */}
                    <td className="p-3.5">
                      {m.teamId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTeam(m.teamId!);
                          }}
                          className="font-bold text-cyan-600 hover:text-cyan-800 hover:underline flex items-center gap-1 cursor-pointer truncate max-w-[120px]"
                          title={m.teamName}
                        >
                          <UsersRound className="w-3 h-3 text-cyan-500 shrink-0" />
                          <span className="truncate">{m.teamName || "Team"}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Solo</span>
                      )}
                    </td>

                    {/* Project */}
                    <td className="p-3.5 max-w-[160px]">
                      {m.projectId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(m.projectId!);
                          }}
                          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer truncate text-left"
                          title={m.projectName}
                        >
                          <FolderKanban className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate">{m.projectName}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Hackathon */}
                    <td className="p-3.5 max-w-[160px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectHackathon(m.hackathonId);
                        }}
                        className="font-bold text-amber-600 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer truncate text-left"
                        title={m.hackathonName}
                      >
                        <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{m.hackathonName}</span>
                      </button>
                      <div className="text-[10px] text-slate-400 truncate">
                        {m.hackathonOrganizer || ""}
                      </div>
                    </td>

                    {/* Round */}
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">
                        {m.currentRoundName || "Round 1"}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {m.roundStatus || "pending"}
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="p-3.5 min-w-[100px]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span>{progressVal}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progressVal >= 80
                              ? "bg-emerald-500"
                              : progressVal >= 40
                              ? "bg-indigo-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                        />
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          m.verificationStatus === "verified"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : m.verificationStatus === "rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {m.verificationStatus === "verified" ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{m.verificationStatus}</span>
                      </span>
                    </td>

                    {/* Deadline */}
                    <td className="p-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                      {m.roundDeadline ? new Date(m.roundDeadline).toLocaleDateString() : "TBD"}
                    </td>

                    {/* Row Action */}
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(m.studentId);
                        }}
                        className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition cursor-pointer"
                        title="Open 360° dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, sortedMappings.length)} of {sortedMappings.length} entries
        </div>

        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-slate-800 px-2">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
