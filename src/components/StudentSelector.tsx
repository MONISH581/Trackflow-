import React, { useState } from "react";
import { UserInfo } from "../store.ts";
import { UserCheck, Search, X, Check, Crown, Users } from "lucide-react";

interface StudentSelectorProps {
  students: UserInfo[];
  selectedLeaderId: string;
  onLeaderChange: (leaderId: string) => void;
  selectedMemberIds: string[];
  onMembersChange: (memberIds: string[]) => void;
  disabled?: boolean;
}

export function StudentSelector({
  students,
  selectedLeaderId,
  onLeaderChange,
  selectedMemberIds,
  onMembersChange,
  disabled = false,
}: StudentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Normalize student IDs for matching
  const getStudentId = (s: UserInfo) => s.userId || (s as any).id || (s as any)._id || "";

  const MAX_MEMBERS = 5;
  const [maxLimitReached, setMaxLimitReached] = useState(false);

  // Handle Team Leader Selection
  const handleLeaderSelect = (leaderId: string) => {
    onLeaderChange(leaderId);
    // Automatically include Team Leader in members list if not already present and limit not exceeded
    if (leaderId && !selectedMemberIds.includes(leaderId)) {
      if (selectedMemberIds.length < MAX_MEMBERS) {
        onMembersChange([...selectedMemberIds, leaderId]);
      }
    }
  };

  // Toggle member selection
  const toggleMember = (studentId: string) => {
    if (disabled) return;
    if (selectedMemberIds.includes(studentId)) {
      // Removing member
      setMaxLimitReached(false);
      const updated = selectedMemberIds.filter((id) => id !== studentId);
      onMembersChange(updated);
      // If removing the current leader, reset leader selection
      if (studentId === selectedLeaderId) {
        onLeaderChange(updated.length > 0 ? updated[0] : "");
      }
    } else {
      // Adding member - check max 5 limit
      if (selectedMemberIds.length >= MAX_MEMBERS) {
        setMaxLimitReached(true);
        setTimeout(() => setMaxLimitReached(false), 4000);
        return;
      }
      setMaxLimitReached(false);
      onMembersChange([...selectedMemberIds, studentId]);
    }
  };

  // Remove a specific selected member chip
  const removeMember = (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMember(studentId);
  };

  // Filter student records by search query
  const filteredStudents = students.filter((s) => {
    const sId = getStudentId(s);
    const query = searchTerm.toLowerCase().trim();
    return (
      !query ||
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      (s.registerNumber && s.registerNumber.toLowerCase().includes(query)) ||
      (s.department && s.department.toLowerCase().includes(query)) ||
      sId.toLowerCase().includes(query)
    );
  });

  // Helper to resolve student info from ID
  const findStudent = (id: string) => students.find((s) => getStudentId(s) === id);

  return (
    <div className="space-y-4 text-left">
      {/* 1. Team Leader Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          Select Team Leader <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <select
            disabled={disabled}
            value={selectedLeaderId}
            onChange={(e) => handleLeaderSelect(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold cursor-pointer border border-blue-200/50 bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          >
            <option value="">-- Choose Team Leader from Student Records --</option>
            {students.map((s) => {
              const sId = getStudentId(s);
              const regNo = s.registerNumber || (s as any).rollNo || s.email || sId;
              return (
                <option key={sId} value={sId} className="bg-white text-slate-800 font-medium">
                  {s.name} (Reg: {regNo}) &bull; {s.department || "CS"} - Year {s.year || "3"}
                </option>
              );
            })}
          </select>
        </div>
        {selectedLeaderId && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/80 border border-amber-200/60 px-3 py-1.5 rounded-lg font-semibold">
            <Crown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>
              Designated Leader:{" "}
              <strong>
                {findStudent(selectedLeaderId)?.name || selectedLeaderId}
                {findStudent(selectedLeaderId)?.registerNumber ? ` (${findStudent(selectedLeaderId)?.registerNumber})` : ""}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* 2. Team Members Selector */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Select Team Members ({selectedMemberIds.length} / {MAX_MEMBERS} Max)
          </label>
          <span className="text-xs font-semibold text-slate-400">
            Strict Limit: Max 5 Students
          </span>
        </div>

        {/* Max 5 Limit Warning Banner */}
        {maxLimitReached && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <span>⚠️ Maximum limit of 5 students per team reached! Unselect a student to add another.</span>
          </div>
        )}

        {/* Selected Members Chips Box */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl min-h-[52px] flex flex-wrap items-center gap-2">
          {selectedMemberIds.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              No team members selected. Click &quot;Select Students from Records&quot; below to assign.
            </span>
          ) : (
            selectedMemberIds.map((id) => {
              const s = findStudent(id);
              const isLeader = id === selectedLeaderId;
              const name = s ? s.name : id;
              const dept = s?.department ? `(${s.department})` : "";
              return (
                <span
                  key={id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                    isLeader
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-blue-50 text-blue-800 border border-blue-200/80 hover:bg-blue-100"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-extrabold text-blue-600 border border-blue-200/60 shadow-2xs">
                    {name.substring(0, 2).toUpperCase()}
                  </span>
                  <span>{name}</span>
                  {dept && <span className="text-xs opacity-75 font-normal">{dept}</span>}
                  {isLeader && (
                    <span className="bg-amber-200/80 text-amber-900 text-xs px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5 text-amber-700" /> LEADER
                    </span>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeMember(id, e)}
                      className="ml-1 hover:bg-rose-100 hover:text-rose-600 p-0.5 rounded-full text-slate-400 transition"
                      title="Remove student"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>

        {/* Dropdown Toggle / Search Trigger */}
        {!disabled && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2.5 bg-white hover:bg-slate-50 border border-blue-200/60 rounded-xl text-xs font-bold text-slate-700 flex justify-between items-center transition shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                {isDropdownOpen
                  ? "Hide Student Record Directory"
                  : "+ Add / Remove Students from Record Directory"}
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/50 font-extrabold">
                {students.length} Records Available
              </span>
            </button>

            {/* Student Directory Popup Box */}
            {isDropdownOpen && (
              <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3 z-30 relative animate-in fade-in duration-150">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student name, email, department or ID..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* List of Student Records */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {students.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No approved student records available in system.
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No student records matching &quot;{searchTerm}&quot;.
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const sId = getStudentId(s);
                      const isSelected = selectedMemberIds.includes(sId);
                      const isLeader = sId === selectedLeaderId;

                      return (
                        <div
                          key={sId}
                          onClick={() => toggleMember(sId)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50/70 border-blue-300/80 shadow-2xs"
                              : "bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {s.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800">{s.name}</span>
                                <span className="text-xs text-blue-600 font-bold bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded">
                                  {s.registerNumber || (s as any).rollNo || sId}
                                </span>
                                {isLeader && (
                                  <span className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5 border border-amber-300">
                                    <Crown className="w-2.5 h-2.5 text-amber-700" /> LEADER
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                                <span>{s.department || "Computer Science"}</span>
                                <span>&bull;</span>
                                <span>Year {s.year || "3"}</span>
                                <span>&bull;</span>
                                <span className="truncate max-w-[min(100%,_140px)] text-slate-400">{s.email || sId}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-300 hover:border-blue-500 hover:text-blue-500">
                                +
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing {filteredStudents.length} of {students.length} student records
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
