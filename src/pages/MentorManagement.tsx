import React, { useState, useEffect } from "react";
import { useStore, MentorInfo, ProjectInfo } from "../store.ts";
import { Users, Plus, Award, Mail, Phone, Briefcase, CheckCircle, ShieldAlert, X } from "lucide-react";

export default function MentorManagement() {
  const { currentUser, mentors, projects, fetchMentors, createMentor, assignMentorToProject, fetchProjects } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    expertise: "Artificial Intelligence & ML",
  });

  useEffect(() => {
    fetchMentors();
    fetchProjects();
  }, [fetchMentors, fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    const ok = await createMentor(formData);
    if (ok) {
      setShowAddModal(false);
      setFormData({ name: "", email: "", phone: "", expertise: "Artificial Intelligence & ML" });
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !selectedMentorId) return;
    const ok = await assignMentorToProject(selectedProject._id || selectedProject.id, selectedMentorId);
    if (ok) {
      setShowAssignModal(false);
      setSelectedProject(null);
      setSelectedMentorId("");
    }
  };

  const unassignedProjects = projects.filter(p => !p.mentorId || p.mentorId === "");

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Mentor Management</h1>
              <p className="text-sm text-slate-500">Assign project mentors, manage lab faculty & track mentor workloads</p>
            </div>
          </div>
        </div>

        {currentUser?.role === "coordinator" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Mentor</span>
          </button>
        )}
      </div>

      {/* Unassigned Projects Banner */}
      {unassignedProjects.length > 0 && currentUser?.role === "coordinator" && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {unassignedProjects.length} {unassignedProjects.length === 1 ? 'Project requires' : 'Projects require'} a mentor assignment
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Every active project must have a mentor assigned before student daily reporting begins.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {unassignedProjects.map(p => (
              <button
                key={p.id || p._id}
                onClick={() => {
                  setSelectedProject(p);
                  setShowAssignModal(true);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                Assign Mentor: {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((mentor) => {
          const assignedProjectsList = projects.filter(
            (p) => p.mentorId === mentor.mentorId || p.mentorId === (mentor._id || mentor.id)
          );

          return (
            <div key={mentor.id || mentor._id} className="glass-card p-6 border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://avatar.vercel.sh/${mentor.name.replace(/\s+/g, '').toLowerCase()}`}
                      alt={mentor.name}
                      className="w-12 h-12 rounded-xl ring-2 ring-blue-500/20 object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{mentor.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50 mt-1">
                        {mentor.expertise}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{mentor.email}</span>
                  </div>
                  {mentor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{mentor.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Assigned Projects</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-700 font-semibold">{assignedProjectsList.length}</span>
                  </h4>
                  {assignedProjectsList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No active projects assigned yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {assignedProjectsList.map((p) => (
                        <div key={p.id || p._id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[170px]">{p.name}</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[10px]">{p.progress}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Mentor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add New Mentor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mentor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Robert Vance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="mentor@srishakthi.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Domain Expertise</label>
                <select
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                  <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                  <option value="Mobile App Development">Mobile App Development</option>
                  <option value="Cybersecurity & Cryptography">Cybersecurity & Cryptography</option>
                  <option value="Cloud Computing & DevOps">Cloud Computing & DevOps</option>
                  <option value="Data Science & Analytics">Data Science & Analytics</option>
                  <option value="IoT & Embedded Systems">IoT & Embedded Systems</option>
                  <option value="Blockchain Technology">Blockchain Technology</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition"
                >
                  Add Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Mentor Modal */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Assign Mentor</h3>
                <p className="text-xs text-slate-500">{selectedProject.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Mentor *</label>
                <select
                  required
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Mentor --</option>
                  {mentors.map((m) => (
                    <option key={m.id || m._id} value={m.mentorId || m._id}>
                      {m.name} ({m.expertise})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
