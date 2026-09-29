import React, { useEffect, useState } from "react";
import { useStore, HackathonMappingInfo, HackathonRegistrationInfo } from "../store.ts";
import { Award, Target, Flag, Loader2, Save } from "lucide-react";

export default function StudentHackathonMapping({ studentId, projectId }: { studentId: string, projectId?: string }) {
  const { fetchHackathonMappings, updateHackathonMapping, currentUser } = useStore();
  
  const [mappings, setMappings] = useState<HackathonMappingInfo[]>([]);
  const [registrations, setRegistrations] = useState<HackathonRegistrationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HackathonMappingInfo>>({});

  useEffect(() => {
    if (currentUser?.role !== 'coordinator' && currentUser?.role !== 'master_admin') {
      return;
    }

    const load = async () => {
      setLoading(true);
      const fetchedMappings = await fetchHackathonMappings(studentId);
      setMappings(fetchedMappings);
      
      const res = await fetch(`/api/hackathons/registrations?studentId=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
      }
      setLoading(false);
    };
    load();
  }, [studentId, currentUser, fetchHackathonMappings]);

  if (currentUser?.role !== 'coordinator' && currentUser?.role !== 'master_admin') {
    return null;
  }

  if (loading) {
    return <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>;
  }

  const approvedRegistrations = registrations.filter(r => r.verificationStatus === 'Verified');

  if (approvedRegistrations.length === 0 && mappings.length === 0) {
    return null;
  }

  const handleEdit = (hackathonId: string, mapping?: HackathonMappingInfo) => {
    setEditingId(hackathonId);
    setEditForm(mapping || { studentId, hackathonId, projectId, internalStatus: 'Mapped', internalProgress: 0 });
  };

  const handleSave = async (hackathonId: string) => {
    const success = await updateHackathonMapping({
      ...editForm,
      studentId,
      hackathonId
    });
    if (success) {
      setEditingId(null);
      const fetchedMappings = await fetchHackathonMappings(studentId);
      setMappings(fetchedMappings);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
        <Target className="w-4 h-4 text-purple-600" />
        INTERNAL HACKATHON MAPPING (ADMIN ONLY)
      </h4>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {approvedRegistrations.map((reg) => {
          const mapping = mappings.find(m => m.hackathonId === reg.hackathonId);
          const isEditing = editingId === reg.hackathonId;

          return (
            <div key={reg.hackathonId} className="p-4 bg-purple-50/30 border border-purple-200/50 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">{reg.hackathonName}</h5>
                  <p className="text-xs text-slate-500">Official Approval: <span className="text-emerald-600 font-bold">{reg.verificationStatus}</span></p>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => handleEdit(reg.hackathonId, mapping)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded transition"
                  >
                    Edit Mapping
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 text-xs bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Team / Team ID</label>
                    <input 
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                      value={editForm.teamId || ''} 
                      onChange={e => setEditForm({...editForm, teamId: e.target.value})} 
                      placeholder="e.g. Team Alpha"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Current Round</label>
                    <input 
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                      value={editForm.currentRoundId || ''} 
                      onChange={e => setEditForm({...editForm, currentRoundId: e.target.value})} 
                      placeholder="e.g. Round 3"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Internal Status</label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-white transition-all"
                        value={editForm.internalStatus || 'Mapped'} 
                        onChange={e => setEditForm({...editForm, internalStatus: e.target.value})}
                      >
                        <option value="Mapped">Mapped</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Eliminated">Eliminated</option>
                        <option value="Won">Won</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Progress (%)</label>
                      <input 
                        type="number" min="0" max="100"
                        className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                        value={editForm.internalProgress || 0} 
                        onChange={e => setEditForm({...editForm, internalProgress: parseInt(e.target.value) || 0})} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Coordinator Remarks</label>
                    <textarea 
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all min-h-[60px]"
                      value={editForm.coordinatorRemarks || ''} 
                      onChange={e => setEditForm({...editForm, coordinatorRemarks: e.target.value})} 
                      placeholder="Follow-up needed..."
                    />
                  </div>
                  {currentUser?.role === 'master_admin' && (
                    <div>
                      <label className="text-purple-700 font-bold mb-1 flex items-center gap-1"><Award className="w-3 h-3"/> Master Remarks</label>
                      <textarea 
                        className="w-full border border-purple-200 bg-purple-50/30 rounded-lg p-2 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all min-h-[60px]"
                        value={editForm.masterRemarks || ''} 
                        onChange={e => setEditForm({...editForm, masterRemarks: e.target.value})} 
                      />
                    </div>
                  )}
                  <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-2">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition">Cancel</button>
                    <button onClick={() => handleSave(reg.hackathonId)} className="px-4 py-1.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center gap-1.5 shadow-sm transition">
                      <Save className="w-3.5 h-3.5"/> Save
                    </button>
                  </div>
                </div>
              ) : (
                mapping ? (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs bg-white/50 p-3 rounded-lg border border-purple-100/50">
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Team</span>
                      <span className="text-slate-700 font-medium">{mapping.teamId || <span className="italic opacity-50">Unassigned</span>}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Round</span>
                      <span className="text-slate-700 font-medium">{mapping.currentRoundId || <span className="italic opacity-50">Not Set</span>}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Internal Status</span>
                      <span className="inline-flex px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-700">{mapping.internalStatus || 'Mapped'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Progress</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-20 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${mapping.internalProgress || 0}%` }} />
                        </div>
                        <span className="font-bold text-slate-600">{mapping.internalProgress || 0}%</span>
                      </div>
                    </div>
                    {mapping.coordinatorRemarks && (
                      <div className="col-span-2 pt-2 border-t border-purple-100/50">
                        <span className="text-slate-400 font-bold flex items-center gap-1.5 mb-1"><Flag className="w-3.5 h-3.5"/> Coordinator Remark</span>
                        <p className="text-slate-600 font-medium bg-white p-2.5 border border-slate-100 rounded-lg shadow-sm leading-relaxed">{mapping.coordinatorRemarks}</p>
                      </div>
                    )}
                    {mapping.masterRemarks && (
                      <div className="col-span-2 pt-2">
                        <span className="text-purple-500 font-bold flex items-center gap-1.5 mb-1"><Award className="w-3.5 h-3.5"/> Master Remark</span>
                        <p className="text-purple-700 font-medium bg-purple-50 p-2.5 border border-purple-200 rounded-lg shadow-sm leading-relaxed">{mapping.masterRemarks}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic bg-white/50 p-3 rounded-lg border border-purple-100/50">No internal mapping data set. Click edit to map this hackathon.</div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
