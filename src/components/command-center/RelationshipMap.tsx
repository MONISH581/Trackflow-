import React, { useState, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Users,
  FolderKanban,
  UsersRound,
  Trophy,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Sparkles,
  LayoutGrid,
  Network
} from "lucide-react";
import { CommandCenterMappingItem } from "../../store";

interface RelationshipMapProps {
  mappings: CommandCenterMappingItem[];
  onSelectStudent: (studentId: string) => void;
  onSelectProject: (projectId: string) => void;
  onSelectTeam: (teamId: string) => void;
  onSelectHackathon: (hackathonId: string) => void;
}

export const RelationshipMap: React.FC<RelationshipMapProps> = ({
  mappings,
  onSelectStudent,
  onSelectProject,
  onSelectTeam,
  onSelectHackathon
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "canvas">("cards");
  const [chainLimit, setChainLimit] = useState(12);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

  const displayedMappings = mappings.slice(0, chainLimit);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.65));
  const handleResetZoom = () => setZoomLevel(1);

  if (mappings.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 text-center space-y-3">
        <Network className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Relationship Chains Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          No active student-to-hackathon mappings match the current filters. Adjust your lab scope or search criteria above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header bar with controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              360° Living Relationship Matrix
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Student &rarr; Team &rarr; Project &rarr; Hackathon &rarr; Round
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click any entity node to inspect its complete 360° dossier. Visualizes real linked paths across the institution.
          </p>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Structured Chain View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Chains</span>
            </button>
            <button
              onClick={() => setViewMode("canvas")}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "canvas"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Deep Flow Canvas"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Flow Canvas</span>
            </button>
          </div>

          {/* Zoom controls */}
          {viewMode === "canvas" && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 hover:bg-white rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Graph Content */}
      {viewMode === "cards" ? (
        /* Structured Flow Chains View (Mobile & Desktop Responsive) */
        <div className="p-4 sm:p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {displayedMappings.map((m, idx) => {
            const chainKey = `${m.studentId}-${m.hackathonId}-${idx}`;
            const isSelected = selectedChainId === chainKey;

            return (
              <div
                key={chainKey}
                onClick={() => setSelectedChainId(isSelected ? null : chainKey)}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                    : "bg-slate-50/70 hover:bg-white border-slate-200/90 text-slate-800 hover:shadow-md"
                }`}
              >
                {/* Horizontal Sequence Node Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-stretch relative">
                  
                  {/* 1. STUDENT NODE */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStudent(m.studentId);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer group relative ${
                      isSelected
                        ? "bg-slate-800 border-slate-700 hover:border-indigo-400"
                        : "bg-white border-blue-200 hover:border-blue-400 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Student
                      </span>
                      {m.verificationStatus === "verified" ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                    <h4 className="text-xs font-black line-clamp-1 group-hover:text-blue-500 transition">
                      {m.studentName || "Unnamed Student"}
                    </h4>
                    <p className={`text-[10px] line-clamp-1 font-mono ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      {m.registerNumber || "Reg No Pending"}
                    </p>
                    <div className="mt-2 text-[10px] line-clamp-1 text-slate-400">
                      {m.lab || "Assigned Lab Pending"}
                    </div>
                  </div>

                  {/* 2. TEAM NODE */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (m.teamId) onSelectTeam(m.teamId);
                    }}
                    className={`p-3 rounded-xl border transition relative ${
                      !m.teamId
                        ? isSelected ? "bg-slate-800/50 border-dashed border-slate-700 text-slate-500" : "bg-slate-100/60 border-dashed border-slate-300 text-slate-400"
                        : isSelected
                        ? "bg-slate-800 border-slate-700 hover:border-cyan-400 cursor-pointer group"
                        : "bg-white border-cyan-200 hover:border-cyan-400 hover:shadow-xs cursor-pointer group"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500 flex items-center gap-1">
                        <UsersRound className="w-3 h-3" />
                        Team
                      </span>
                      {m.teamMembersCount ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                          {m.teamMembersCount} members
                        </span>
                      ) : null}
                    </div>
                    <h4 className="text-xs font-black line-clamp-1 group-hover:text-cyan-500 transition">
                      {m.teamName || "No Team Assigned"}
                    </h4>
                    <p className={`text-[10px] line-clamp-1 ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      {m.teamId ? `ID: ${m.teamId.slice(-6)}` : "Individual / Solo"}
                    </p>
                    <div className="mt-2 text-[10px] line-clamp-1 text-slate-400">
                      {m.department || "General Dept"}
                    </div>
                  </div>

                  {/* 3. PROJECT NODE */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (m.projectId) onSelectProject(m.projectId);
                    }}
                    className={`p-3 rounded-xl border transition relative ${
                      !m.projectId
                        ? isSelected ? "bg-slate-800/50 border-dashed border-slate-700 text-slate-500" : "bg-slate-100/60 border-dashed border-slate-300 text-slate-400"
                        : isSelected
                        ? "bg-slate-800 border-slate-700 hover:border-indigo-400 cursor-pointer group"
                        : "bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-xs cursor-pointer group"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" />
                        Project
                      </span>
                      <span className="text-[10px] font-black text-indigo-600">
                        {m.projectProgress ?? m.internalProgress ?? 0}%
                      </span>
                    </div>
                    <h4 className="text-xs font-black line-clamp-1 group-hover:text-indigo-500 transition">
                      {m.projectName || "No Project Linked"}
                    </h4>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, m.projectProgress ?? m.internalProgress ?? 0))}%` }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] line-clamp-1 text-slate-400 flex items-center justify-between">
                      <span>Status: {m.projectStatus || m.internalStatus || "pending"}</span>
                      {m.isAtRisk && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                    </div>
                  </div>

                  {/* 4. HACKATHON NODE */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectHackathon(m.hackathonId);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer group relative ${
                      isSelected
                        ? "bg-slate-800 border-slate-700 hover:border-amber-400"
                        : "bg-white border-amber-200 hover:border-amber-400 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Hackathon
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        {m.hackathonStatus || "Active"}
                      </span>
                    </div>
                    <h4 className="text-xs font-black line-clamp-1 group-hover:text-amber-500 transition">
                      {m.hackathonName || "Hackathon Event"}
                    </h4>
                    <p className={`text-[10px] line-clamp-1 ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      Org: {m.hackathonOrganizer || "Official Organizer"}
                    </p>
                    <div className="mt-2 text-[10px] line-clamp-1 text-slate-400">
                      Follow-up: {m.coordinatorFollowUp || "Assigned"}
                    </div>
                  </div>

                  {/* 5. ROUND & STATUS NODE */}
                  <div
                    className={`p-3 rounded-xl border transition relative ${
                      isSelected
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-purple-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-500 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Round
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          m.roundStatus === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : m.roundStatus === "in_progress"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {m.roundStatus || "Round 1"}
                      </span>
                    </div>
                    <h4 className="text-xs font-black line-clamp-1">
                      {m.currentRoundName || "Initial Stage"}
                    </h4>
                    <p className={`text-[10px] line-clamp-1 ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      Deadline: {m.roundDeadline ? new Date(m.roundDeadline).toLocaleDateString() : "TBD"}
                    </p>
                    <div className="mt-2 text-[10px] font-medium text-slate-400 flex items-center justify-between">
                      <span>Prog: {m.internalProgress ?? 0}%</span>
                      {m.masterRemarks && (
                        <span className="text-[9px] font-bold text-purple-400 underline">
                          Master Remark
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Sub-bar showing Admin & Master remarks preview if present */}
                {(m.coordinatorRemarks || m.masterRemarks) && (
                  <div className={`mt-3 pt-2 text-xs flex flex-wrap items-center gap-4 border-t ${isSelected ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                    {m.coordinatorRemarks && (
                      <span className="line-clamp-1 text-[11px]">
                        <strong className="text-blue-500">Coord:</strong> {m.coordinatorRemarks}
                      </span>
                    )}
                    {m.masterRemarks && (
                      <span className="line-clamp-1 text-[11px]">
                        <strong className="text-purple-400">Master:</strong> {m.masterRemarks}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {mappings.length > chainLimit && (
            <div className="text-center pt-2">
              <button
                onClick={() => setChainLimit((l) => l + 12)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Load More Relationship Chains ({mappings.length - chainLimit} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Flow Canvas View with zoom/pan and curved connectors */
        <div className="p-6 overflow-x-auto min-h-[480px] bg-slate-900 rounded-b-3xl relative select-none">
          <div
            className="transition-transform duration-150 origin-top-left flex flex-col gap-6"
            style={{ transform: `scale(${zoomLevel})`, width: "max-content" }}
          >
            {displayedMappings.slice(0, 8).map((m, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {/* Student */}
                <div
                  onClick={() => onSelectStudent(m.studentId)}
                  className="w-56 p-3 bg-slate-800 hover:bg-slate-700/80 border border-blue-500/40 rounded-2xl cursor-pointer text-white shadow-md transition"
                >
                  <div className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Student
                  </div>
                  <div className="text-xs font-black truncate">{m.studentName}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{m.registerNumber}</div>
                  <div className="text-[10px] text-slate-400 truncate">{m.lab}</div>
                </div>

                <div className="w-8 flex items-center justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>

                {/* Team */}
                <div
                  onClick={() => m.teamId && onSelectTeam(m.teamId)}
                  className={`w-52 p-3 rounded-2xl border transition ${
                    m.teamId
                      ? "bg-slate-800 hover:bg-slate-700/80 border-cyan-500/40 cursor-pointer text-white shadow-md"
                      : "bg-slate-800/40 border-dashed border-slate-700 text-slate-500"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase text-cyan-400 flex items-center gap-1">
                    <UsersRound className="w-3 h-3" /> Team
                  </div>
                  <div className="text-xs font-black truncate">{m.teamName || "No Team Assigned"}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {m.teamMembersCount ? `${m.teamMembersCount} members` : "Solo"}
                  </div>
                </div>

                <div className="w-8 flex items-center justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>

                {/* Project */}
                <div
                  onClick={() => m.projectId && onSelectProject(m.projectId)}
                  className={`w-56 p-3 rounded-2xl border transition ${
                    m.projectId
                      ? "bg-slate-800 hover:bg-slate-700/80 border-indigo-500/40 cursor-pointer text-white shadow-md"
                      : "bg-slate-800/40 border-dashed border-slate-700 text-slate-500"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" /> Project
                  </div>
                  <div className="text-xs font-black truncate">{m.projectName || "No Project Linked"}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                    <span>Progress: {m.projectProgress ?? m.internalProgress ?? 0}%</span>
                    <span>{m.projectStatus || "pending"}</span>
                  </div>
                </div>

                <div className="w-8 flex items-center justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>

                {/* Hackathon */}
                <div
                  onClick={() => onSelectHackathon(m.hackathonId)}
                  className="w-56 p-3 bg-slate-800 hover:bg-slate-700/80 border border-amber-500/40 rounded-2xl cursor-pointer text-white shadow-md transition"
                >
                  <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Hackathon
                  </div>
                  <div className="text-xs font-black truncate">{m.hackathonName}</div>
                  <div className="text-[10px] text-slate-400 truncate">{m.hackathonOrganizer || "Organizer"}</div>
                </div>

                <div className="w-8 flex items-center justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>

                {/* Round */}
                <div className="w-48 p-3 bg-slate-800 border border-purple-500/40 rounded-2xl text-white shadow-md">
                  <div className="text-[10px] font-black uppercase text-purple-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Round
                  </div>
                  <div className="text-xs font-black truncate">{m.currentRoundName || "Round 1"}</div>
                  <div className="text-[10px] text-slate-400">
                    Deadline: {m.roundDeadline ? new Date(m.roundDeadline).toLocaleDateString() : "TBD"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
