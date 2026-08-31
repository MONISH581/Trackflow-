import React, { useState, useEffect } from "react";
import { useStore, HackathonInfo, HackathonRegistrationInfo } from "../store.ts";
import { Sparkles, Calendar, Upload, CheckCircle2, Clock, XCircle, ExternalLink, ShieldCheck, Plus, X, Image as ImageIcon, Star, Heart, UserCheck, Search, Trophy } from "lucide-react";

export default function HackathonHub() {
  const {
    currentUser,
    hackathons,
    hackathonRegistrations,
    hackathonInterests,
    fetchHackathons,
    createHackathon,
    registerHackathonWithProof,
    fetchHackathonRegistrations,
    verifyHackathonRegistration,
    expressHackathonInterest,
    fetchHackathonInterests
  } = useStore();

  const [activeTab, setActiveTab] = useState<"available" | "registrations" | "interests" | "verification">("available");
  const [domainFilter, setDomainFilter] = useState<string>("ALL");
  const [selectedHackathon, setSelectedHackathon] = useState<HackathonInfo | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Coordinator Add Hackathon state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHackathon, setNewHackathon] = useState({
    name: "",
    organizer: "",
    description: "",
    domain: "Kaggle / Machine Learning",
    registrationLink: "",
  });

  // Coordinator Verification Reason
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHackathons();
    fetchHackathonInterests();
    if (currentUser?.role === "coordinator" || currentUser?.role === "master_admin") {
      fetchHackathonRegistrations();
    } else if (currentUser?.role === "student") {
      fetchHackathonRegistrations(currentUser.userId);
      fetchHackathonInterests(currentUser.userId);
    }
  }, [currentUser, fetchHackathons, fetchHackathonRegistrations, fetchHackathonInterests]);

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
      setNewHackathon({ name: "", organizer: "", description: "", domain: "Kaggle / Machine Learning", registrationLink: "" });
    }
  };

  const handleExpressInterest = async (hackathonId: string) => {
    if (!currentUser) return;
    await expressHackathonInterest(hackathonId, currentUser.userId);
  };

  const handleVerify = async (registrationId: string, status: "Verified" | "Rejected") => {
    await verifyHackathonRegistration(registrationId, status, status === "Rejected" ? rejectionReason : undefined);
    setVerifyingId(null);
    setRejectionReason("");
  };

  const isTeacher = currentUser?.role === "coordinator" || currentUser?.role === "master_admin";

  const filteredHackathons = hackathons.filter(h => {
    const matchesDomain = domainFilter === "ALL" ||
      (domainFilter === "KAGGLE" && h.domain?.toLowerCase().includes("kaggle")) ||
      (domainFilter === "GOVT" && (h.domain?.toLowerCase().includes("govt") || h.domain?.toLowerCase().includes("government"))) ||
      (domainFilter === "AI" && h.domain?.toLowerCase().includes("ai"));
    const matchesSearch = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-left">
      {/* Header Banner */}
      <div className="glass-card p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Hackathons, Kaggle & ML Competitions</h1>
            <p className="text-sm text-slate-500">Explore hackathons & Kaggle ML challenges, express interest, upload registration proofs & monitor verification</p>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "available" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Events ({hackathons.length})
            </button>
            <button
              onClick={() => setActiveTab("registrations")}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "registrations" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Proofs ({hackathonRegistrations.length})
            </button>

            <button
              onClick={() => setActiveTab("interests")}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all relative ${
                activeTab === "interests" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isTeacher ? "Student Interests Console" : "My Interests"} ({hackathonInterests.length})
            </button>

            {isTeacher && (
              <button
                onClick={() => setActiveTab("verification")}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all relative ${
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

          {isTeacher && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event / Kaggle</span>
            </button>
          )}
        </div>
      </div>

      {/* Available Hackathons & Kaggle Competitions Tab */}
      {activeTab === "available" && (
        <div className="space-y-6">
          {/* Category Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={() => setDomainFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "ALL" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                All Platforms
              </button>
              <button
                onClick={() => setDomainFilter("KAGGLE")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${domainFilter === "KAGGLE" ? "bg-cyan-600 text-white" : "bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100"}`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Kaggle ML Competitions
              </button>
              <button
                onClick={() => setDomainFilter("GOVT")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "GOVT" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}
              >
                Government Hackathons
              </button>
              <button
                onClick={() => setDomainFilter("AI")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "AI" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"}`}
              >
                AI & Deep Learning
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Kaggle, Hackathons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHackathons.map((h) => {
              const hId = h._id || h.id || "";
              const userRegistration = hackathonRegistrations.find(r => r.hackathonId === hId);
              const userInterested = hackathonInterests.some(i => i.hackathonId === hId && i.studentId === currentUser?.userId);
              const isKaggle = h.domain?.toLowerCase().includes("kaggle") || h.organizer?.toLowerCase().includes("kaggle");

              return (
                <div key={hId} className="glass-card p-6 border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isKaggle ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
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

                    <h3 className="font-bold text-slate-800 text-base mt-3 leading-snug">{h.name}</h3>
                    <p className="text-xs text-indigo-600 font-bold mt-1 mb-2">Organizer: {h.organizer}</p>
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
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleExpressInterest(hId)}
                          disabled={userInterested}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                            userInterested
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${userInterested ? "fill-emerald-600 text-emerald-600" : "text-amber-600"}`} />
                          <span>{userInterested ? "Interested ✓" : "Express Interest"}</span>
                        </button>

                        <button
                          onClick={() => setSelectedHackathon(h)}
                          className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{userRegistration ? "Re-proof" : "Upload Proof"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDENT INTERESTS TAB (Visible to Teachers and Students) */}
      {activeTab === "interests" && (
        <div className="space-y-4">
          <div className="glass-card p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">
              {isTeacher ? "Student Hackathon & Kaggle Expressed Interests" : "My Expressed Interests"}
            </h2>
            <p className="text-xs text-slate-500">
              {isTeacher
                ? "Live view of all students who clicked interest on Kaggle competitions or hackathons"
                : "Hackathons and Kaggle challenges you expressed interest in"}
            </p>
          </div>

          {hackathonInterests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Expressed Interests Yet</h3>
              <p className="text-xs text-slate-400 mt-1">Students can click "Express Interest" on any Kaggle ML challenge or hackathon to list here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto glass-card border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Reg No</th>
                    <th className="p-3">Department & Year</th>
                    <th className="p-3">Event / Kaggle Title</th>
                    <th className="p-3">Organizer</th>
                    <th className="p-3">Expressed Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hackathonInterests.map((interest) => (
                    <tr key={interest.id || interest._id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-bold text-slate-800">{interest.studentName}</td>
                      <td className="p-3 font-mono text-slate-500">{interest.registerNumber}</td>
                      <td className="p-3 font-medium text-slate-700">{interest.department} (Year {interest.year})</td>
                      <td className="p-3 font-semibold text-indigo-700">{interest.hackathonName}</td>
                      <td className="p-3 text-slate-600">{interest.organizer}</td>
                      <td className="p-3 text-slate-500">{new Date(interest.expressedAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                          Interested
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Student Registrations Proof History Tab */}
      {activeTab === "registrations" && (
        <div className="space-y-4">
          {hackathonRegistrations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Proof Screenshots Uploaded Yet</h3>
              <p className="text-xs text-slate-400 mt-1">Select an active hackathon or Kaggle competition to upload mandatory registration screenshot proof.</p>
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
      {activeTab === "verification" && isTeacher && (
        <div className="space-y-4">
          <div className="glass-card p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Hackathon & Kaggle Proof Verification Console</h2>
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
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Inspect Proof Screenshot 🔍</span>
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
                          Decline ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {verifyingId === (reg._id || reg.id) && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-rose-800">Specify Rejection Reason for Student:</p>
                    <input
                      type="text"
                      placeholder="e.g. Invalid screenshot proof / missing registration ID"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-2 text-xs border border-rose-300 rounded-lg focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setVerifyingId(null)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleVerify(reg._id || reg.id || "", "Rejected")}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-lg"
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

      {/* Upload Proof Screenshot Modal */}
      {selectedHackathon && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Upload Registration Screenshot Proof</h3>
              <button onClick={() => setSelectedHackathon(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-indigo-600">{selectedHackathon.name}</p>
                <p className="text-[11px] text-slate-500">Organizer: {selectedHackathon.organizer}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Select Registration Confirmation Screenshot (PNG/JPG):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {screenshotPreview && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48">
                  <img src={screenshotPreview} alt="Proof Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedHackathon(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !screenshotFile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
                >
                  {isUploading ? "Uploading Proof..." : "Submit Proof Screenshot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hackathon Modal for Coordinators */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Add New Hackathon / Kaggle Challenge</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHackathon} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Event Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Kaggle ML Grand Prix 2026"
                  value={newHackathon.name}
                  onChange={(e) => setNewHackathon({ ...newHackathon, name: e.target.value })}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Organizer / Platform:</label>
                <input
                  type="text"
                  placeholder="e.g. Kaggle / Google AI / Ministry of Education"
                  value={newHackathon.organizer}
                  onChange={(e) => setNewHackathon({ ...newHackathon, organizer: e.target.value })}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Category / Domain:</label>
                <select
                  value={newHackathon.domain}
                  onChange={(e) => setNewHackathon({ ...newHackathon, domain: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Kaggle / Machine Learning">Kaggle / Machine Learning</option>
                  <option value="Kaggle / Generative AI">Kaggle / Generative AI</option>
                  <option value="Government Hackathon">Government Hackathon</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Web & Mobile Dev">Web & Mobile Dev</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Official Link:</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newHackathon.registrationLink}
                  onChange={(e) => setNewHackathon({ ...newHackathon, registrationLink: e.target.value })}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description:</label>
                <textarea
                  placeholder="Event details..."
                  value={newHackathon.description}
                  onChange={(e) => setNewHackathon({ ...newHackathon, description: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
