import React, { useState, useEffect } from "react";
import { useStore, HackathonInfo, HackathonRegistrationInfo, API_BASE, getAuthHeaders } from "../store.ts";
import { OFFICIAL_DEPARTMENTS } from "../constants/departments.ts";
import { 
  Sparkles, Calendar, Upload, CheckCircle2, Clock, XCircle, ExternalLink, ShieldCheck, 
  Plus, X, Image as ImageIcon, Star, Heart, UserCheck, Search, Trophy, Globe, Layers, 
  Flame, Zap, RefreshCw, ZoomIn, ZoomOut, RotateCw, Download, Filter, ChevronLeft, ChevronRight 
} from "lucide-react";

const FEATURED_PLATFORMS = [
  {
    name: "DoraHacks",
    link: "https://dorahacks.io",
    why: "Web3 and open-source hackathons.",
    tag: "Web3 & Open-Source"
  },
  {
    name: "Hackathon.com",
    link: "https://www.hackathon.com",
    why: "Global hackathon directory.",
    tag: "Global Directory"
  },
  {
    name: "DevNetwork",
    link: "https://devnetwork.com/hackathons/",
    why: "AI, cloud, and enterprise hackathons.",
    tag: "AI & Enterprise Cloud"
  },
  {
    name: "Hugging Face Competitions",
    link: "https://huggingface.co/competitions",
    why: "AI and LLM competitions.",
    tag: "AI & LLM Competitions"
  },
  {
    name: "Google Developer Communities",
    link: "https://developers.google.com/community",
    why: "Google-sponsored events and challenges.",
    tag: "Google AI & Cloud"
  }
];

const PRIORITY_PLATFORMS = [
  { name: "Devfolio", link: "https://devfolio.co", desc: "India's largest hackathon platform" },
  { name: "Smart India Hackathon", link: "https://sih.gov.in", desc: "Nationwide Govt innovation model" },
  { name: "MLH (Major League Hacking)", link: "https://mlh.io", desc: "Global student hackathon league" },
  { name: "Devpost", link: "https://devpost.com", desc: "Software hackathon platform" },
  { name: "HackerEarth", link: "https://www.hackerearth.com/challenges/", desc: "Enterprise & coding challenges" },
  { name: "Unstop", link: "https://unstop.com/hackathons", desc: "College tech sprints & hackathons" }
];

export default function HackathonHub() {
  const {
    currentUser,
    hackathons,
    hackathonRegistrations,
    hackathonInterests,
    fetchHackathons,
    refreshLiveHackathons,
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
  const [isSyncing, setIsSyncing] = useState(false);

  // Lightbox Image Viewer Modal State
  const [lightboxModal, setLightboxModal] = useState<{
    url: string;
    title: string;
    studentName?: string;
    dept?: string;
    validUntil?: string;
  } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // Paginated Verifications History State
  const [paginatedRegistrations, setPaginatedRegistrations] = useState<HackathonRegistrationInfo[]>([]);
  const [paginationMeta, setPaginationMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statsMeta, setStatsMeta] = useState({ totalCount: 0, pendingCount: 0, verifiedCount: 0, rejectedCount: 0, expiredCount: 0 });
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [searchQueryHist, setSearchQueryHist] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoadingHist, setIsLoadingHist] = useState(false);

  const fetchPaginatedVerifications = async () => {
    setIsLoadingHist(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageNumber));
      params.set("limit", "20");
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (filterDept !== "ALL") params.set("department", filterDept);
      if (searchQueryHist.trim()) params.set("search", searchQueryHist.trim());

      const res = await fetch(`${API_BASE}/api/hackathons/registrations?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        setPaginatedRegistrations(json.registrations || json.data || []);
        setPaginationMeta(json.pagination || { page: json.page || 1, limit: json.limit || 20, total: json.total || 0, totalPages: json.totalPages || 1 });
        setStatsMeta(json.stats || { totalCount: 0, pendingCount: 0, verifiedCount: 0, rejectedCount: 0, expiredCount: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch verifications history:", err);
    } finally {
      setIsLoadingHist(false);
    }
  };

  useEffect(() => {
    if (activeTab === "verification") {
      fetchPaginatedVerifications();
    }
  }, [activeTab, pageNumber, filterStatus, filterDept, searchQueryHist]);

  const getAbsoluteImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
      return url;
    }
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${window.location.origin}${cleanPath}`;
  };

  const openLightbox = (url: string, title: string, studentName?: string, dept?: string, validUntil?: string) => {
    const fullUrl = getAbsoluteImageUrl(url);
    setLightboxModal({ url: fullUrl, title, studentName, dept, validUntil });
    setLightboxZoom(1);
    setLightboxRotation(0);
  };

  const handleStatCardClick = (status: string) => {
    setFilterStatus(status);
    setPageNumber(1);
    setTimeout(() => {
      document.getElementById("verification-history-list")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const formatExternalUrl = (url?: string) => {
    if (!url) return "#";
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return `https://${trimmed}`;
  };

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    await refreshLiveHackathons();
    setIsSyncing(false);
  };

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

  const [modeFilter, setModeFilter] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");

  const filteredHackathons = hackathons.filter(h => {
    const now = Date.now();
    const deadlinePassed = h.registrationDeadline ? new Date(h.registrationDeadline).getTime() < now : false;
    const endPassed = h.endDate ? new Date(h.endDate).getTime() < now : false;
    const isExpired = (deadlinePassed && endPassed) || h.status === "Expired";
    if (isExpired) return false;

    const isOffline = h.mode === "Offline" || (h.location && !h.location.toLowerCase().includes("online"));
    const matchesMode = modeFilter === "ALL" ||
      (modeFilter === "ONLINE" && !isOffline) ||
      (modeFilter === "OFFLINE" && isOffline);

    const dom = (h.domain || "").toLowerCase();
    const nam = (h.name || "").toLowerCase();
    const org = (h.organizer || "").toLowerCase();
    const tag = (h.tags || []).join(" ").toLowerCase();

    const matchesDomain = domainFilter === "ALL" ||
      (domainFilter === "DEVPOST" && (nam.includes("devpost") || org.includes("devpost") || dom.includes("devpost") || tag.includes("devpost"))) ||
      (domainFilter === "DEVFOLIO" && (nam.includes("devfolio") || org.includes("devfolio") || dom.includes("devfolio"))) ||
      (domainFilter === "MLH" && (nam.includes("mlh") || org.includes("major league") || org.includes("hack club") || dom.includes("student hackathon"))) ||
      (domainFilter === "SIH" && (nam.includes("sih") || nam.includes("smart india") || org.includes("aicte") || org.includes("ministry"))) ||
      (domainFilter === "UNSTOP" && (nam.includes("unstop") || org.includes("unstop") || dom.includes("college"))) ||
      (domainFilter === "HACKEREARTH" && (nam.includes("hackerearth") || org.includes("hackerearth") || dom.includes("enterprise"))) ||
      (domainFilter === "KAGGLE" && (nam.includes("kaggle") || dom.includes("kaggle") || tag.includes("kaggle") || tag.includes("machine learning"))) ||
      (domainFilter === "AI" && (nam.includes("ai") || nam.includes("llm") || dom.includes("ai") || dom.includes("llm") || org.includes("hugging face") || org.includes("meta"))) ||
      (domainFilter === "WEB3" && (nam.includes("web3") || dom.includes("web3") || org.includes("dorahacks") || org.includes("solana") || org.includes("ethglobal"))) ||
      (domainFilter === "GOOGLE" && (nam.includes("google") || org.includes("google") || org.includes("microsoft") || dom.includes("cloud"))) ||
      (domainFilter === "GOVT" && (nam.includes("govt") || dom.includes("govt") || org.includes("ministry") || org.includes("nasa") || nam.includes("naan mudhalvan") || org.includes("tn"))) ||
      (domainFilter === "PRIORITY" && (dom.includes("priority") || nam.includes("devfolio") || nam.includes("sih") || nam.includes("mlh") || nam.includes("devpost") || nam.includes("hackerearth") || nam.includes("unstop")));
    const matchesSearch = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesDomain && matchesSearch;
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
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-rose-500 text-white rounded-full font-bold">
                    {hackathonRegistrations.filter(r => r.verificationStatus === 'Pending').length}
                  </span>
                )}
              </button>
            )}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
            title="Auto-refreshes live hackathons every 6 hours. Click to sync live data instantly."
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing Live..." : "Refresh Live Data"}</span>
            <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-indigo-100 text-indigo-700 rounded-full font-extrabold">6h Auto</span>
          </button>

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
          {/* Hackathon Platforms & Priority Showcase Banner */}
          <div className="glass-card p-6 border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Hackathon Platforms & Directory Guide</h2>
                  <p className="text-xs text-slate-500">Top recommended platforms & specialized hackathon ecosystems in India & Globally</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                <span>Focus on quality hackathons & keep improving the same project across multiple events</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Featured & AI Focused Platforms */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Featured Platforms & AI Competitions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURED_PLATFORMS.map((platform) => (
                    <a
                      key={platform.name}
                      href={platform.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-white border border-slate-200/90 hover:border-indigo-400 rounded-xl transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition">{platform.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2"><span className="font-semibold text-slate-700">Why use it:</span> {platform.why}</p>
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-full border border-indigo-100">
                        {platform.tag}
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Recommended Priority Rankings (1 to 6) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  Recommended Priority (India & Global)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRIORITY_PLATFORMS.map((item, idx) => (
                    <a
                      key={item.name}
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-white border border-slate-200/90 hover:border-emerald-400 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2.5 group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 text-xs group-hover:text-emerald-700 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Category & Mode Filters & Search */}
          <div className="flex flex-col space-y-3 glass-card p-4 border border-slate-200">
            {/* Mode Selector (Online / Offline / All) */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Participation Mode:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setModeFilter("ALL")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      modeFilter === "ALL" ? "bg-white text-indigo-700 font-extrabold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All Modes
                  </button>
                  <button
                    onClick={() => setModeFilter("ONLINE")}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      modeFilter === "ONLINE" ? "bg-emerald-600 text-white font-extrabold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>🌐 Online (Virtual)</span>
                  </button>
                  <button
                    onClick={() => setModeFilter("OFFLINE")}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      modeFilter === "OFFLINE" ? "bg-purple-600 text-white font-extrabold shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>📍 Offline (In-Person)</span>
                  </button>
                </div>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search platforms, Kaggle, SIH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Platform & Sector Domain Filter */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                onClick={() => setDomainFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "ALL" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                All Platforms ({hackathons.length})
              </button>
              <button
                onClick={() => setDomainFilter("DEVPOST")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "DEVPOST" ? "bg-blue-600 text-white shadow-xs" : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"}`}
              >
                Devpost
              </button>
              <button
                onClick={() => setDomainFilter("DEVFOLIO")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "DEVFOLIO" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}
              >
                Devfolio
              </button>
              <button
                onClick={() => setDomainFilter("SIH")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "SIH" ? "bg-orange-600 text-white shadow-xs" : "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"}`}
              >
                SIH & Govt
              </button>
              <button
                onClick={() => setDomainFilter("MLH")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "MLH" ? "bg-red-600 text-white shadow-xs" : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"}`}
              >
                MLH & Hack Club
              </button>
              <button
                onClick={() => setDomainFilter("UNSTOP")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "UNSTOP" ? "bg-indigo-600 text-white shadow-xs" : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"}`}
              >
                Unstop
              </button>
              <button
                onClick={() => setDomainFilter("HACKEREARTH")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "HACKEREARTH" ? "bg-violet-600 text-white shadow-xs" : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"}`}
              >
                HackerEarth
              </button>
              <button
                onClick={() => setDomainFilter("KAGGLE")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${domainFilter === "KAGGLE" ? "bg-cyan-600 text-white shadow-xs" : "bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100"}`}
              >
                <Trophy className="w-3 h-3" />
                Kaggle ML
              </button>
              <button
                onClick={() => setDomainFilter("AI")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "AI" ? "bg-purple-600 text-white shadow-xs" : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"}`}
              >
                AI & LLM
              </button>
              <button
                onClick={() => setDomainFilter("WEB3")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "WEB3" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"}`}
              >
                Web3 & DoraHacks
              </button>
              <button
                onClick={() => setDomainFilter("GOOGLE")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "GOOGLE" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"}`}
              >
                Google & Cloud
              </button>
              <button
                onClick={() => setDomainFilter("GOVT")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${domainFilter === "GOVT" ? "bg-teal-600 text-white shadow-xs" : "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"}`}
              >
                Govt & NASA
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHackathons.map((h) => {
              const hId = h._id || h.id || "";
              const userRegistration = hackathonRegistrations.find(r => r.hackathonId === hId);
              const userInterested = hackathonInterests.some(i => i.hackathonId === hId && i.studentId === currentUser?.userId);
              const isKaggle = h.domain?.toLowerCase().includes("kaggle") || h.organizer?.toLowerCase().includes("kaggle");
              const isOffline = h.mode === "Offline" || (h.location && !h.location.toLowerCase().includes("online"));

              return (
                <div key={hId} className="glass-card p-6 border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isKaggle ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {h.domain}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${
                          isOffline ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isOffline ? '📍 Offline' : '🌐 Online'}
                        </span>
                      </div>
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
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 group ${
                            userInterested
                              ? "bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-700 border-emerald-200 hover:border-rose-300 shadow-xs"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${userInterested ? "fill-emerald-600 text-emerald-600 group-hover:text-rose-600 group-hover:fill-none" : "text-amber-600"}`} />
                          {userInterested ? (
                            <>
                              <span className="group-hover:hidden">Interested ✓</span>
                              <span className="hidden group-hover:inline">Uninterested</span>
                            </>
                          ) : (
                            <span>Express Interest</span>
                          )}
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
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-xs inline-flex items-center gap-1">
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
            hackathonRegistrations.map((reg) => {
              const fullProofUrl = getAbsoluteImageUrl(reg.screenshotUrl);
              return (
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

                  <div className="flex items-center gap-3">
                    {/* Proof Thumbnail Image */}
                    <div
                      onClick={() => openLightbox(fullProofUrl, reg.hackathonName)}
                      className="relative w-20 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group cursor-pointer shadow-xs hover:border-indigo-400 transition shrink-0"
                      title="Click to inspect uploaded proof image"
                    >
                      <img src={fullProofUrl} alt="Proof Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 flex items-center justify-center text-white transition">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openLightbox(fullProofUrl, reg.hackathonName)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>View Uploaded Proof</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Coordinator Verification Panel & History Tab */}
      {activeTab === "verification" && isTeacher && (
        <div className="space-y-6">
          <div className="glass-card p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Hackathon Proof Verification Console & History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifications done till date with 1-month validity calendar tracking and lightbox proof inspection.
              </p>
            </div>
            <button
              onClick={() => fetchPaginatedVerifications()}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHist ? "animate-spin" : ""}`} />
              <span>Refresh Verifications</span>
            </button>
          </div>

          {/* Interactive Verification Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div
              onClick={() => handleStatCardClick("ALL")}
              className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md ${
                filterStatus === "ALL" ? "bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20" : "bg-white border-slate-200/80 hover:border-slate-300"
              }`}
              title="Click to view all proof submissions"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Proofs</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{statsMeta.totalCount}</p>
            </div>

            <div
              onClick={() => handleStatCardClick("Pending")}
              className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md ${
                filterStatus === "Pending" ? "bg-amber-100 border-amber-400 ring-2 ring-amber-500/20" : "bg-amber-50/70 border-amber-200/80 hover:border-amber-300"
              }`}
              title="Click to filter by Pending Review"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Pending Review</p>
              <p className="text-2xl font-black text-amber-800 mt-1">{statsMeta.pendingCount}</p>
            </div>

            <div
              onClick={() => handleStatCardClick("Verified")}
              className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md ${
                filterStatus === "Verified" ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20" : "bg-emerald-50/70 border-emerald-200/80 hover:border-emerald-300"
              }`}
              title="Click to filter by Approved & Valid"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Approved & Valid</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{statsMeta.verifiedCount}</p>
            </div>

            <div
              onClick={() => handleStatCardClick("Rejected")}
              className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md ${
                filterStatus === "Rejected" ? "bg-rose-100 border-rose-400 ring-2 ring-rose-500/20" : "bg-rose-50/70 border-rose-200/80 hover:border-rose-300"
              }`}
              title="Click to filter by Rejected"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Rejected</p>
              <p className="text-2xl font-black text-rose-800 mt-1">{statsMeta.rejectedCount}</p>
            </div>

            <div
              onClick={() => handleStatCardClick("Expired")}
              className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md col-span-2 sm:col-span-1 ${
                filterStatus === "Expired" ? "bg-slate-200 border-slate-400 ring-2 ring-slate-500/20" : "bg-slate-100/70 border-slate-300/80 hover:border-slate-400"
              }`}
              title="Click to filter by Expired (1-Month)"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Expired (1-Mo)</p>
              <p className="text-2xl font-black text-slate-700 mt-1">{statsMeta.expiredCount}</p>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div id="verification-history-list" className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, email, reg no, or hackathon..."
                value={searchQueryHist}
                onChange={(e) => {
                  setSearchQueryHist(e.target.value);
                  setPageNumber(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPageNumber(1);
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer focus:outline-none focus:border-indigo-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Verified">Approved (Valid)</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>

              <select
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setPageNumber(1);
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer focus:outline-none focus:border-indigo-600 max-w-[220px] truncate"
              >
                <option value="ALL">All SIET Departments</option>
                {OFFICIAL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Verification Cards / History List */}
          {isLoadingHist ? (
            <div className="py-12 text-center text-xs text-slate-500 font-bold bg-white rounded-2xl border border-slate-200">
              Loading verification history records...
            </div>
          ) : paginatedRegistrations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Verification Records Found</h3>
              <p className="text-xs text-slate-400 mt-1">Try resetting your filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedRegistrations.map((reg) => {
                const effStatus = reg.effectiveStatus || reg.verificationStatus;
                const isVerifiedValid = effStatus === "Verified";
                const isExpired = effStatus === "Expired";
                const isRejected = effStatus === "Rejected";

                return (
                  <div
                    key={reg.id || reg._id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-xs transition space-y-4 text-left"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Student & Department Metadata */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">{reg.studentName}</h3>
                          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {reg.registerNumber || "Reg No N/A"}
                          </span>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                            {reg.department || "SIET Department"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{reg.studentEmail}</p>

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">Event: {reg.hackathonName}</span>
                        </div>
                      </div>

                      {/* Middle: Proof Thumbnail */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div
                          onClick={() => openLightbox(reg.screenshotUrl, reg.hackathonName, reg.studentName, reg.department, reg.validUntil)}
                          className="relative w-20 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group cursor-pointer shadow-xs hover:border-indigo-400 transition"
                          title="Click to view full image in lightbox"
                        >
                          <img src={reg.screenshotUrl} alt="Proof Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 flex items-center justify-center text-white transition">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openLightbox(reg.screenshotUrl, reg.hackathonName, reg.studentName, reg.department, reg.validUntil)}
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      </div>

                      {/* Right: Status Badges & Actions */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        {isVerifiedValid && (
                          <div className="text-right">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Approved
                            </span>
                            <p className="text-[11px] font-bold text-slate-500 mt-1">
                              Valid until: {formatDateStr(reg.validUntil)}
                            </p>
                          </div>
                        )}

                        {isExpired && (
                          <div className="text-right">
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full font-bold text-xs inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              Expired
                            </span>
                            <p className="text-[11px] font-bold text-slate-500 mt-1">
                              Expired on: {formatDateStr(reg.validUntil)}
                            </p>
                          </div>
                        )}

                        {isRejected && (
                          <div className="text-right">
                            <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-xs inline-flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Rejected
                            </span>
                            {reg.rejectionReason && (
                              <p className="text-[11px] font-bold text-rose-600 mt-1">
                                {reg.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}

                        {effStatus === "Pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                await handleVerify(reg._id || reg.id || "", "Verified");
                                fetchPaginatedVerifications();
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                            >
                              Approve ✓
                            </button>
                            <button
                              onClick={() => setVerifyingId(reg._id || reg.id || "")}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                            >
                              Decline ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rejection input box */}
                    {verifyingId === (reg._id || reg.id) && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                        <p className="text-xs font-bold text-rose-800">Specify Rejection Reason for Student:</p>
                        <input
                          type="text"
                          placeholder="e.g. Invalid screenshot proof / missing registration ID"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full p-2.5 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setVerifyingId(null)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              await handleVerify(reg._id || reg.id || "", "Rejected");
                              fetchPaginatedVerifications();
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verification Audit Trail */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Submitted: {new Date(reg.registrationDate).toLocaleString()}</span>
                      {reg.verifiedBy && (
                        <span>
                          Verified by <strong className="text-slate-600">{reg.verifiedBy}</strong> on {formatDateStr(reg.verifiedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {paginationMeta.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-bold">
                Showing page {paginationMeta.page} of {paginationMeta.totalPages} ({paginationMeta.total} records)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={paginationMeta.page <= 1}
                  onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={paginationMeta.page >= paginationMeta.totalPages}
                  onClick={() => setPageNumber((p) => Math.min(p + 1, paginationMeta.totalPages))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Proof Screenshot Modal */}
      {selectedHackathon && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-5 border border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Upload Registration Screenshot Proof</h3>
              <button onClick={() => setSelectedHackathon(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-indigo-600">{selectedHackathon.name}</p>
                <p className="text-xs text-slate-500">Organizer: {selectedHackathon.organizer}</p>
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
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 sm:max-h-56 bg-slate-50 flex items-center justify-center">
                  <img src={screenshotPreview} alt="Proof Preview" className="max-h-48 sm:max-h-56 w-auto object-contain" />
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

      {/* Lightbox Image Viewer Modal */}
      {lightboxModal && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxModal(null)}
        >
          {/* Top Toolbar */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between text-white border-b border-slate-800 pb-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5 min-w-0 pr-4">
              <h3 className="text-sm font-bold truncate text-slate-100">{lightboxModal.title}</h3>
              {lightboxModal.studentName && (
                <p className="text-xs text-indigo-400 font-medium truncate">
                  Submitted by: {lightboxModal.studentName} {lightboxModal.dept ? `• ${lightboxModal.dept}` : ""}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setLightboxZoom((z) => Math.min(z + 0.25, 3))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxZoom((z) => Math.max(z - 0.25, 0.5))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <a
                href={lightboxModal.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
                title="Open / Download Full Image"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setLightboxModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition cursor-pointer ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Image Canvas */}
          <div 
            className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto p-2 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxModal.url}
              alt={lightboxModal.title}
              style={{
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: "transform 0.2s ease-out"
              }}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
            />
          </div>

          {/* Bottom Status info */}
          <div 
            className="text-center text-xs text-slate-400 border-t border-slate-800 pt-3 w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            Touch or click background, or tap close button to return
          </div>
        </div>
      )}
    </div>
  );
}
