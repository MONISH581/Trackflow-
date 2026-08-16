import React, { useState, useEffect } from "react";
import { useStore, HackathonInfo, HackathonRegistrationInfo } from "../store.ts";
import { Sparkles, Calendar, Upload, CheckCircle2, Clock, XCircle, ExternalLink, ShieldCheck, Plus, X, Image as ImageIcon } from "lucide-react";

export default function HackathonHub() {
  const { currentUser, hackathons, hackathonRegistrations, fetchHackathons, createHackathon, registerHackathonWithProof, fetchHackathonRegistrations, verifyHackathonRegistration } = useStore();

  const [activeTab, setActiveTab] = useState<"available" | "registrations" | "verification">("available");
  const [selectedHackathon, setSelectedHackathon] = useState<HackathonInfo | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Coordinator Add Hackathon state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHackathon, setNewHackathon] = useState({
    name: "",
    organizer: "",
    description: "",
    domain: "Artificial Intelligence",
    registrationLink: "",
  });

  // Coordinator Verification Reason
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHackathons();
    if (currentUser?.role === "coordinator") {
      fetchHackathonRegistrations();
    } else if (currentUser?.role === "student") {
      fetchHackathonRegistrations(currentUser.userId);
    }
  }, [currentUser, fetchHackathons, fetchHackathonRegistrations]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHackathon || !screenshotFile || !currentUser) return;

    setIsUploading(true);
    const ok = await registerHackathonWithProof(
      selectedHackathon._id || selectedHackathon.id || "",
      currentUser.userId,
      screenshotFile
    );
    setIsUploading(false);

    if (ok) {
      setSelectedHackathon(null);
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setActiveTab("registrations");
    }
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHackathon.name || !newHackathon.registrationLink) return;

    const ok = await createHackathon(newHackathon);
    if (ok) {
      setShowAddModal(false);
      setNewHackathon({ name: "", organizer: "", description: "", domain: "Artificial Intelligence", registrationLink: "" });
    }
  };

  const handleVerify = async (registrationId: string, status: "Verified" | "Rejected") => {
    await verifyHackathonRegistration(registrationId, status, status === "Rejected" ? rejectionReason : undefined);
    setVerifyingId(null);
    setRejectionReason("");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="glass-card p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Hackathons & Competitions</h1>
            <p className="text-sm text-slate-500">Register for tech hackathons, upload mandatory proof screenshots & track coordinator verification</p>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "available" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active Hackathons ({hackathons.length})
            </button>
            <button
              onClick={() => setActiveTab("registrations")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "registrations" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Registrations ({hackathonRegistrations.length})
            </button>
            {currentUser?.role === "coordinator" && (
              <button
                onClick={() => setActiveTab("verification")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all relative ${
                  activeTab === "verification" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Verification Panel
                {hackathonRegistrations.filter(r => r.verificationStatus === 'Pending').length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-bold">
                    {hackathonRegistrations.filter(r => r.verificationStatus === 'Pending').length}
                  </span>
                )}
              </button>
            )}
          </div>

          {currentUser?.role === "coordinator" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Hackathon</span>
            </button>
          )}
        </div>
      </div>

      {/* Available Hackathons Tab */}
      {activeTab === "available" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((h) => {
            const userRegistration = hackathonRegistrations.find(r => r.hackathonId === (h._id || h.id));

            return (
              <div key={h.id || h._id} className="glass-card p-6 border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full text-xs font-bold">
                      {h.domain}
                    </span>
                    {userRegistration && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        userRegistration.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        userRegistration.verificationStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {userRegistration.verificationStatus}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-lg mt-3">{h.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold mb-2">Organizer: {h.organizer}</p>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-4">{h.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <a
                      href={h.registrationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Official Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {currentUser?.role === "student" && (
                    <button
                      onClick={() => setSelectedHackathon(h)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{userRegistration ? "Re-upload Proof Screenshot" : "Register & Upload Proof"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Registrations History Tab */}
      {activeTab === "registrations" && (
        <div className="space-y-4">
          {hackathonRegistrations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Registrations Yet</h3>
              <p className="text-xs text-slate-400 mt-1">Select an active hackathon to register and upload mandatory screenshot proof.</p>
            </div>
          ) : (
            hackathonRegistrations.map((reg) => (
              <div key={reg.id || reg._id} className="glass-card p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-base">{reg.hackathonName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      reg.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      reg.verificationStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {reg.verificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Registered: {new Date(reg.registrationDate).toLocaleString()}</p>
                  {reg.rejectionReason && (
                    <p className="text-xs font-semibold text-rose-600 mt-1">Reason: {reg.rejectionReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <a
                    href={reg.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>View Uploaded Proof</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Coordinator Verification Panel Tab */}
      {activeTab === "verification" && currentUser?.role === "coordinator" && (
        <div className="space-y-4">
          <div className="glass-card p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Hackathon Screenshot Proof Verification</h2>
            <p className="text-xs text-slate-500">Review student uploaded proof screenshots and approve or decline registrations</p>
          </div>

          {hackathonRegistrations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Registrations to Verify</h3>
            </div>
          ) : (
            hackathonRegistrations.map((reg) => (
              <div key={reg.id || reg._id} className="glass-card p-6 border border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-800 text-base">{reg.studentName}</h3>
                      <span className="text-xs font-semibold text-slate-500">Reg: {reg.registerNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        reg.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        reg.verificationStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {reg.verificationStatus}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-indigo-600 mt-1">Hackathon: {reg.hackathonName}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={reg.screenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition"
                    >
                      Inspect Proof Image 🔍
                    </a>

                    {reg.verificationStatus === "Pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerify(reg._id || reg.id || "", "Verified")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                        >
                          Verify Proof ✓
                        </button>
                        <button
                          onClick={() => setVerifyingId(reg._id || reg.id || "")}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                        >
                          Reject ✗
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {verifyingId === (reg._id || reg.id) && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                    <label className="block text-xs font-bold text-rose-800">Specify Rejection Reason for Student *</label>
                    <input
                      type="text"
                      placeholder="e.g. Screenshot unreadable / invalid hackathon registration proof"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-rose-300 rounded-lg text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setVerifyingId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleVerify(reg._id || reg.id || "", "Rejected")}
                        className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Mandatory Screenshot Proof Registration Modal */}
      {selectedHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Hackathon Registration</h3>
                <p className="text-xs text-indigo-600 font-semibold">{selectedHackathon.name}</p>
              </div>
              <button onClick={() => setSelectedHackathon(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              ⚠️ <span className="font-bold">MANDATORY RULE:</span> You must upload a screenshot proof of your official registration. Registrations without screenshots will be automatically rejected.
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Upload Registration Screenshot Proof *</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {screenshotPreview && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48">
                  <img src={screenshotPreview} alt="Screenshot Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedHackathon(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !screenshotFile}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
                >
                  {isUploading ? "Uploading Proof..." : "Submit Registration Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hackathon Modal for Coordinator */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add New Hackathon</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHackathon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hackathon Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Smart India Hackathon 2026"
                  value={newHackathon.name}
                  onChange={(e) => setNewHackathon({ ...newHackathon, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Organizer</label>
                <input
                  type="text"
                  placeholder="AICTE & Ministry of Education"
                  value={newHackathon.organizer}
                  onChange={(e) => setNewHackathon({ ...newHackathon, organizer: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Official Registration Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://sih.gov.in"
                  value={newHackathon.registrationLink}
                  onChange={(e) => setNewHackathon({ ...newHackathon, registrationLink: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short overview of the hackathon event..."
                  value={newHackathon.description}
                  onChange={(e) => setNewHackathon({ ...newHackathon, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg"
                >
                  Create Hackathon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
