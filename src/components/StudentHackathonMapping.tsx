import React, { useEffect, useState } from "react";
import { useStore, HackathonMappingInfo, HackathonRegistrationInfo, getAuthHeaders } from "../store.ts";
import { Award, Target, Flag, Loader2, Save, Calendar, CheckCircle2, Clock, AlertCircle, Edit3, X, Briefcase, Users, Layers, Shield } from "lucide-react";

export default function StudentHackathonMapping({ studentId, projectId, projectName }: { studentId: string; projectId?: string; projectName?: string }) {
  const { fetchHackathonMappings, updateHackathonMapping, currentUser } = useStore();
  
  const [mappings, setMappings] = useState<HackathonMappingInfo[]>([]);
  const [registrations, setRegistrations] = useState<HackathonRegistrationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HackathonMappingInfo>>({});

  useEffect(() => {
    // Strictly Admin/Coordinator and Master only
    if (currentUser?.role !== 'coordinator' && currentUser?.role !== 'master_admin') {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const fetchedMappings = await fetchHackathonMappings(studentId);
        setMappings(fetchedMappings);
        
        const res = await fetch(`/api/hackathons/registrations?studentId=${studentId}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data.registrations || []);
        }
      } catch (err) {
        console.error("Failed to load hackathon mapping info", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId, currentUser, fetchHackathonMappings]);

  // Frontend Role Restriction: Students never see internal administrative mapping
  if (currentUser?.role !== 'coordinator' && currentUser?.role !== 'master_admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
        <span>Loading internal hackathon tracking...</span>
      </div>
    );
  }

  const approvedRegistrations = registrations.filter(
    r => r.verificationStatus === 'Verified' || (r as any).effectiveStatus === 'Verified'
  );

  // Combine approved registrations and any existing mappings
  const combinedHackathons: { hackathonId: string; hackathonName: string; approvalStatus: string }[] = [];
  
  approvedRegistrations.forEach(reg => {
    combinedHackathons.push({
      hackathonId: reg.hackathonId,
      hackathonName: reg.hackathonName,
      approvalStatus: reg.verificationStatus || "Approved"
    });
  });

  mappings.forEach(m => {
    if (!combinedHackathons.some(item => item.hackathonId === m.hackathonId)) {
      combinedHackathons.push({
        hackathonId: m.hackathonId,
        hackathonName: m.hackathonName || "Hackathon Event",
        approvalStatus: m.approvalStatus || "Approved"
      });
    }
  });

  if (combinedHackathons.length === 0) {
    return null;
  }

  const handleEdit = (hackathonId: string, mapping?: HackathonMappingInfo) => {
    setEditingId(hackathonId);
    setEditForm(mapping ? { ...mapping } : {
      studentId,
      hackathonId,
      projectId: projectId || "",
      projectName: projectName || "",
      teamId: "",
      currentRoundId: "Round 1",
      roundStatus: "In Progress",
      roundDeadline: "",
      internalStatus: "Mapped",
      internalProgress: 0,
      coordinatorFollowUp: "None",
      coordinatorRemarks: "",
      masterRemarks: ""
    });
  };

  const handleSave = async (hackathonId: string) => {
    const success = await updateHackathonMapping({
      ...editForm,
      studentId,
      hackathonId,
      projectId: editForm.projectId || projectId || ""
    });
    if (success) {
      setEditingId(null);
      const fetchedMappings = await fetchHackathonMappings(studentId);
      setMappings(fetchedMappings);
    }
  };

  return (
    <div className="space-y-4 text-left border-t border-purple-100 pt-4 mt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-600" />
          HACKATHON PARTICIPATION &bull; INTERNAL ADMINISTRATIVE TRACKING
        </h4>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
          Admin / Master Only
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {combinedHackathons.map((hackItem) => {
          const mapping = mappings.find(m => m.hackathonId === hackItem.hackathonId);
          const isEditing = editingId === hackItem.hackathonId;

          return (
            <div 
              key={hackItem.hackathonId} 
              className="p-4 bg-gradient-to-br from-purple-50/50 via-white to-slate-50 border border-purple-200/80 rounded-2xl space-y-3.5 shadow-sm"
            >
              <div className="flex justify-between items-start gap-2 border-b border-purple-100 pb-2.5">
                <div>
                  <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>{hackItem.hackathonName}</span>
                  </h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Official Approval:</span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {hackItem.approvalStatus}
                    </span>
                  </div>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => handleEdit(hackItem.hackathonId, mapping)}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-100/80 hover:bg-purple-200 px-3 py-1 rounded-xl transition flex items-center gap-1 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{mapping ? "Edit Tracking" : "Setup Mapping"}</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 text-xs bg-white p-3.5 rounded-xl border border-purple-200 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-extrabold mb-1">Team / Team ID</label>
                      <input 
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
                        value={editForm.teamId || ''} 
                        onChange={e => setEditForm({...editForm, teamId: e.target.value})} 
                        placeholder="e.g. Team Alpha"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-extrabold mb-1">Project Link / Title</label>
                      <input 
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
                        value={editForm.projectName || projectName || ''} 
                        onChange={e => setEditForm({...editForm, projectName: e.target.value})} 
                        placeholder="e.g. AI Campus Assistant"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 font-extrabold mb-1">Current Round</label>
                      <input 
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
                        value={editForm.currentRoundId || ''} 
                        onChange={e => setEditForm({...editForm, currentRoundId: e.target.value})} 
                        placeholder="e.g. Round 3"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-extrabold mb-1">Round Status</label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-white transition"
                        value={editForm.roundStatus || 'In Progress'} 
                        onChange={e => setEditForm({...editForm, roundStatus: e.target.value})}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Eliminated">Eliminated</option>
                        <option value="Won">Won / Awarded</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-extrabold mb-1">Round Deadline</label>
                      <input 
                        type="date"
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
                        value={editForm.roundDeadline || ''} 
                        onChange={e => setEditForm({...editForm, roundDeadline: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 font-extrabold mb-1">Internal Status</label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-white transition"
                        value={editForm.internalStatus || 'Mapped'} 
                        onChange={e => setEditForm({...editForm, internalStatus: e.target.value})}
                      >
                        <option value="Mapped">Mapped</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review Pending">Review Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Eliminated">Eliminated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-extrabold mb-1">Internal Progress (%)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" min="0" max="100"
                          className="flex-1 accent-purple-600 cursor-pointer"
                          value={editForm.internalProgress || 0} 
                          onChange={e => setEditForm({...editForm, internalProgress: parseInt(e.target.value) || 0})} 
                        />
                        <span className="font-extrabold text-slate-800 text-xs w-9 text-right">{editForm.internalProgress || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-extrabold mb-1">Coordinator Follow-up</label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-white transition"
                        value={editForm.coordinatorFollowUp || 'None'} 
                        onChange={e => setEditForm({...editForm, coordinatorFollowUp: e.target.value})}
                      >
                        <option value="None">None</option>
                        <option value="Required">Required</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-extrabold mb-1 flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-slate-400" />
                      Coordinator Remarks
                    </label>
                    <textarea 
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition min-h-[50px]"
                      value={editForm.coordinatorRemarks || ''} 
                      onChange={e => setEditForm({...editForm, coordinatorRemarks: e.target.value})} 
                      placeholder="Administrative follow-up or review remarks..."
                    />
                  </div>

                  {currentUser?.role === 'master_admin' ? (
                    <div>
                      <label className="text-purple-700 font-extrabold mb-1 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-purple-600"/> Master Remarks (Master Only)
                      </label>
                      <textarea 
                        className="w-full border border-purple-200 bg-purple-50/40 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition min-h-[50px]"
                        value={editForm.masterRemarks || ''} 
                        onChange={e => setEditForm({...editForm, masterRemarks: e.target.value})} 
                        placeholder="Master Sathish strategic directives or remarks..."
                      />
                    </div>
                  ) : (
                    mapping?.masterRemarks && (
                      <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                        <span className="text-purple-700 font-bold block mb-0.5 text-[11px]">Master Remark:</span>
                        <p className="text-purple-900 font-medium text-xs">{mapping.masterRemarks}</p>
                      </div>
                    )
                  )}

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <button 
                      onClick={() => setEditingId(null)} 
                      className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSave(hackItem.hackathonId)} 
                      className="px-4 py-1.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Save className="w-3.5 h-3.5"/> Save Tracking
                    </button>
                  </div>
                </div>
              ) : (
                mapping ? (
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs bg-white/70 p-3.5 rounded-xl border border-purple-100/70">
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Project</span>
                      <span className="text-slate-800 font-extrabold flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {mapping.projectName || projectName || <span className="italic opacity-50">Not Linked</span>}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Team</span>
                      <span className="text-slate-800 font-extrabold flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {mapping.teamId || <span className="italic opacity-50">Unassigned</span>}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Current Round</span>
                      <span className="text-slate-800 font-extrabold flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {mapping.currentRoundId || <span className="italic opacity-50">Round 1</span>}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Round Status</span>
                      <span className={`inline-flex px-2 py-0.5 rounded font-extrabold text-[11px] ${
                        mapping.roundStatus === 'Completed' || mapping.roundStatus === 'Won'
                          ? 'bg-emerald-100 text-emerald-700'
                          : mapping.roundStatus === 'Eliminated'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {mapping.roundStatus || 'In Progress'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Round Deadline</span>
                      <span className="text-slate-700 font-medium flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {mapping.roundDeadline || <span className="italic opacity-50">Not Set</span>}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Coordinator Follow-up</span>
                      <span className={`inline-flex px-2 py-0.5 rounded font-extrabold text-[11px] ${
                        mapping.coordinatorFollowUp === 'Required'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : mapping.coordinatorFollowUp === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {mapping.coordinatorFollowUp || 'None'}
                      </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-purple-100/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400 font-bold">Internal Progress</span>
                        <span className="font-extrabold text-purple-700">{mapping.internalProgress || 0}%</span>
                      </div>
                      <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300" 
                          style={{ width: `${mapping.internalProgress || 0}%` }} 
                        />
                      </div>
                    </div>

                    {mapping.coordinatorRemarks && (
                      <div className="col-span-2 pt-2 border-t border-purple-100/50">
                        <span className="text-slate-500 font-bold flex items-center gap-1.5 mb-1">
                          <Flag className="w-3 h-3 text-slate-400" /> Coordinator Remark
                        </span>
                        <p className="text-slate-700 font-medium bg-white p-2.5 border border-slate-200 rounded-lg shadow-sm leading-relaxed">
                          {mapping.coordinatorRemarks}
                        </p>
                      </div>
                    )}

                    {mapping.masterRemarks && (
                      <div className="col-span-2 pt-1">
                        <span className="text-purple-700 font-bold flex items-center gap-1.5 mb-1">
                          <Award className="w-3 h-3 text-purple-600" /> Master Remark
                        </span>
                        <p className="text-purple-900 font-medium bg-purple-50 p-2.5 border border-purple-200 rounded-lg shadow-sm leading-relaxed">
                          {mapping.masterRemarks}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic bg-white/70 p-3 rounded-xl border border-purple-100/60 flex items-center justify-between">
                    <span>No internal tracking setup for this hackathon yet.</span>
                    <button 
                      onClick={() => handleEdit(hackItem.hackathonId)}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 underline ml-2"
                    >
                      Map Now
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
