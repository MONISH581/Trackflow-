import React from "react";
import { Link } from "react-router-dom";
import { useStore, OpportunityInfo } from "../store.ts";
import {
  Search,
  Filter,
  Bookmark,
  Share2,
  Calendar,
  MapPin,
  DollarSign,
  Award,
  Clock,
  Sparkles,
  Compass,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  BookmarkCheck,
  Zap,
  Tag,
  Sun,
  Moon,
  Users,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Category Config with Icons and Colors
const CATEGORIES_CONFIG = [
  { name: "Jobs", icon: "🏢", gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20", border: "border-blue-500/20 text-blue-600 dark:text-blue-400" },
  { name: "Hackathons", icon: "💻", gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20", border: "border-blue-500/20 text-blue-600 dark:text-blue-400" },
  { name: "Internships", icon: "💼", gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20", border: "border-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
  { name: "Coding Contests", icon: "🏆", gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20", border: "border-amber-500/20 text-amber-600 dark:text-amber-400" },
  { name: "Scholarships", icon: "🎓", gradient: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20", border: "border-violet-500/20 text-violet-600 dark:text-violet-400" },
  { name: "Workshops", icon: "📚", gradient: "from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20", border: "border-rose-500/20 text-rose-600 dark:text-rose-400" },
  { name: "Webinars", icon: "🎤", gradient: "from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20", border: "border-cyan-500/20 text-cyan-600 dark:text-cyan-400" },
  { name: "Conferences", icon: "🌍", gradient: "from-sky-500/10 to-indigo-500/10 dark:from-sky-500/20 dark:to-indigo-500/20", border: "border-sky-500/20 text-sky-600 dark:text-sky-400" },
  { name: "Open Source", icon: "❤️", gradient: "from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20", border: "border-red-500/20 text-red-600 dark:text-red-400" },
  { name: "Research", icon: "🔬", gradient: "from-teal-500/10 to-emerald-500/10 dark:from-teal-500/20 dark:to-emerald-500/20", border: "border-teal-500/20 text-teal-600 dark:text-teal-400" },
  { name: "Bootcamps", icon: "🚀", gradient: "from-fuchsia-500/10 to-pink-500/10 dark:from-fuchsia-500/20 dark:to-pink-500/20", border: "border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400" },
  { name: "Fellowships", icon: "🏅", gradient: "from-yellow-500/10 to-amber-500/10 dark:from-yellow-500/20 dark:to-amber-500/20", border: "border-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
  { name: "Innovation Challenges", icon: "💡", gradient: "from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20", border: "border-indigo-500/20 text-indigo-600 dark:text-indigo-400" }
];

export default function Opportunities() {
  const {
    currentUser,
    opportunities,
    fetchOpportunities,
    toggleBookmark,
    fetchBookmarks,
    bookmarkedOpportunities,
    fetchRecommendations,
    fetchCategoryCounts,
    syncOpportunities,
    addToast
  } = useStore();

  const [activeTab, setActiveTab] = React.useState<"all" | "bookmarks" | "recommendations">("all");
  const [categoryCounts, setCategoryCounts] = React.useState<any[]>([]);
  const [recommendations, setRecommendations] = React.useState<OpportunityInfo[]>([]);
  
  // Filter States
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [mode, setMode] = React.useState("");
  const [freeOrPaid, setFreeOrPaid] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [showFilters, setShowFilters] = React.useState(false);

  // Dark Mode State - Disabled as per request
  const [darkMode, setDarkMode] = React.useState(false);

  const toggleDarkMode = () => {
    addToast("Dark mode is disabled", "info");
  };

  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
    setDarkMode(false);
  }, []);

  // Fetch initial opportunities with filters
  React.useEffect(() => {
    fetchOpportunities({
      category: selectedCategory,
      mode,
      freeOrPaid,
      difficulty,
      status,
      search,
      sort
    });
  }, [selectedCategory, mode, freeOrPaid, difficulty, status, search, sort, fetchOpportunities]);

  // Load stats and recommendation lists
  React.useEffect(() => {
    fetchCategoryCounts().then(data => setCategoryCounts(data));
    if (currentUser?.userId) {
      fetchRecommendations(currentUser.userId).then(data => setRecommendations(data));
      fetchBookmarks();
    }
  }, [currentUser, fetchCategoryCounts, fetchRecommendations, fetchBookmarks]);

  const handleShare = (opp: OpportunityInfo) => {
    navigator.clipboard.writeText(`${window.location.origin}/opportunities/${opp.id || opp._id}`);
    addToast("Link copied to clipboard!", "success");
  };

  const getLiveOpportunityList = () => {
    if (activeTab === "bookmarks") return bookmarkedOpportunities;
    if (activeTab === "recommendations") return recommendations;
    return opportunities;
  };

  return (
    <div className="space-y-8 text-left pb-16">
      
      {/* Top Action Ribbon / Dark Mode Toggle */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Opportunities Portal</span>
        </div>
        <div className="flex items-center gap-3">
          {currentUser?.role === "coordinator" && (
            <Link
              to="/opportunities/admin"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10"
            >
              Coordinator Control Dashboard
            </Link>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-slate-900 dark:to-indigo-950 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>Updates Automatically Every 6 Hours</span>
          </motion.div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              🚀 Student Opportunities Hub
            </h1>
            <p className="text-sm md:text-base text-blue-100/90 max-w-2xl font-medium leading-relaxed">
              Discover Jobs, Hackathons, Internships, Scholarships, Coding Contests, Workshops, Conferences, Open Source Programs, and many more opportunities updated automatically every day.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedCategory("");
                setMode("");
                setSort("newest");
                setActiveTab("all");
                document.getElementById("opportunities-grid")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-xl text-sm transition-all hover:scale-[1.02] shadow-lg shadow-black/10"
            >
              Explore Opportunities
            </button>
            <button
              onClick={() => document.getElementById("statistics")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/10 text-white font-bold rounded-xl text-sm transition-all"
            >
              Featured Statistics
            </button>
          </div>
        </div>

        {/* Floating tech background bubbles */}
        <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-y-1/4 translate-x-1/4">
          <Compass className="w-96 h-96" />
        </div>
      </div>

      {/* Live Statistics Cards */}
      <div id="statistics" className="space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Hub Analytics & Counts
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categoryCounts.map((stat, idx) => {
            const config = CATEGORIES_CONFIG.find(c => c.name === stat.category) || { icon: "⭐️", gradient: "from-blue-500/10 to-indigo-500/10" };
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCategory(stat.category);
                  setActiveTab("all");
                  document.getElementById("opportunities-grid")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`glass-card p-4 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between items-start text-left hover:scale-[1.02] hover:shadow-md transition-all ${
                  selectedCategory === stat.category ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <span className="text-xl">{config.icon}</span>
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate w-full" title={stat.category}>
                    {stat.category}
                  </span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
                    {stat.count} <span className="text-xs font-semibold text-slate-400">live</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Selection Filter Bar */}
      <div className="flex flex-wrap gap-2 pt-2 overflow-x-auto pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            selectedCategory === ""
              ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950"
          }`}
        >
          All Opportunities
        </button>
        {CATEGORIES_CONFIG.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              selectedCategory === cat.name
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Main Panel & Grid Layout */}
      <div id="opportunities-grid" className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left column Search, Filter Controls & Recommendations */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Tabs for switching views */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50 dark:border-slate-900">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === "bookmarks"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved ({bookmarkedOpportunities.length})
            </button>
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === "recommendations"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Match
            </button>
          </div>

          {/* Filter Panel */}
          <div className="glass-card p-5 border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Refine Search
              </span>
              <button
                onClick={() => {
                  setSearch("");
                  setMode("");
                  setFreeOrPaid("");
                  setDifficulty("");
                  setStatus("");
                  setSelectedCategory("");
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search title, tech, tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs pl-9 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>

            {/* Mode Select */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Event Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
              >
                <option value="">All Modes</option>
                <option value="Online">Online / Virtual</option>
                <option value="Offline">Offline / In-Person</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Price select */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registration Fee</label>
              <select
                value={freeOrPaid}
                onChange={(e) => setFreeOrPaid(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
              >
                <option value="">All Pricing</option>
                <option value="Free">Free Entry</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* Difficulty select */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skill Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
              >
                <option value="">All Difficulty</option>
                <option value="Beginner">Beginner Friendly</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced (Pro)</option>
              </select>
            </div>

            {/* Status select */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
              >
                <option value="">All Timelines</option>
                <option value="Live">Live / Active</option>
                <option value="Upcoming">Upcoming Launch</option>
                <option value="ClosingSoon">Closing in 48 Hours</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Sort select */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full glass-input p-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
              >
                <option value="newest">Recently Added</option>
                <option value="oldest">Oldest First</option>
                <option value="highestPrize">Soonest Deadline</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* AI Recommended Section */}
          {activeTab !== "recommendations" && currentUser?.userId && (
            <div className="glass-card p-5 border border-slate-200/60 dark:border-slate-800 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900/40 space-y-4 shadow-sm text-left">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-indigo-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-pulse text-indigo-500" />
                  Recommended For You
                </h4>
                <button
                  onClick={() => setActiveTab("recommendations")}
                  className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition"
                >
                  View All
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                Curated based on your interests and tech skills matching opportunity tags.
              </p>
              
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((opp, idx) => (
                  <Link
                    key={idx}
                    to={`/opportunities/${opp.id || opp._id}`}
                    className="block p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl hover:border-indigo-400/40 dark:hover:border-blue-400/40 hover:scale-[1.01] transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate flex-1 block">
                        {opp.title}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded font-bold uppercase shrink-0">
                        {opp.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      <span>{opp.organizer}</span>
                      <span className="text-indigo-600 dark:text-blue-400 font-bold">{opp.mode}</span>
                    </div>
                  </Link>
                ))}
                {recommendations.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Add skills to your profile to get matches!
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right column Opportunities Grid */}
        <div className="lg:col-span-3 space-y-6 text-left">
          
          {/* Section Sub-header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                {activeTab === "all" && "All Open Opportunities"}
                {activeTab === "bookmarks" && "Saved Bookmarks"}
                {activeTab === "recommendations" && "AI Recommendations Match"}
                {selectedCategory && ` in ${selectedCategory}`}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Showing {getLiveOpportunityList().length} matching items found
              </p>
            </div>
          </div>

          {/* Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getLiveOpportunityList().map((opp) => (
              <OpportunityCard
                key={opp.id || opp._id}
                opp={opp}
                onBookmark={() => toggleBookmark(opp.id || opp._id || "")}
                onShare={() => handleShare(opp)}
                currentUser={currentUser}
              />
            ))}

            {/* Empty State */}
            {getLiveOpportunityList().length === 0 && (
              <div className="col-span-full py-16 text-center glass-card border border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-3xl max-w-xl mx-auto space-y-4">
                <Compass className="w-12 h-12 text-slate-400 mx-auto" />
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No opportunities match your filter</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                    Try adjusting your filter search criteria or search keyword to find open listings.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearch("");
                    setMode("");
                    setFreeOrPaid("");
                    setDifficulty("");
                    setStatus("");
                    setSelectedCategory("");
                    setActiveTab("all");
                  }}
                  className="px-4 py-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 font-bold rounded-xl text-xs hover:bg-blue-100/50 transition-all shadow-sm"
                >
                  Reset Filter Search
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

// ----------------------------------------------------
// CHILD COMPONENT: OPPORTUNITY CARD
// ----------------------------------------------------

interface OpportunityCardProps {
  opp: OpportunityInfo;
  onBookmark: () => any;
  onShare: () => void;
  currentUser: any;
  key?: any;
}

function OpportunityCard({ opp, onBookmark, onShare, currentUser }: OpportunityCardProps) {
  const isSaved = opp.bookmarks && currentUser ? opp.bookmarks.includes(currentUser.userId) : false;
  
  // State for Countdown
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  React.useEffect(() => {
    const deadline = new Date(opp.registrationDeadline).getTime();
    
    const updateTimer = () => {
      const difference = deadline - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [opp.registrationDeadline]);

  const categoryColor = CATEGORIES_CONFIG.find(c => c.name === opp.category) || { border: "border-blue-500/20 text-blue-600" };

  return (
    <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between overflow-hidden hover:scale-[1.01] hover:shadow-md transition-all duration-300">
      
      {/* Banner & Badges */}
      <div className="relative h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <img
          src={opp.bannerImage || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"}
          alt={opp.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        
        {/* Featured / New / Trending Badge overlays */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {opp.featured && (
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 fill-white" /> Featured
            </span>
          )}
          {opp.trending && (
            <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-white" /> Trending
            </span>
          )}
        </div>

        {/* Floating Category Badge Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white">
          <span className="text-[10px] font-bold tracking-tight uppercase">
            {opp.category}
          </span>
        </div>

        {/* Bookmark Button Overlay */}
        <button
          onClick={onBookmark}
          className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/40 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 border border-white/25 text-white transition hover:scale-110"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </button>
      </div>

      {/* Main Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div className="space-y-2">
          {/* Organizer Logo & Title */}
          <div className="flex gap-3 items-start">
            <img
              src={opp.organizerLogo || `https://avatar.vercel.sh/${opp.organizer.toLowerCase().replace(/[^a-z]/g, '')}`}
              alt={opp.organizer}
              className="w-10 h-10 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-slate-800 bg-white"
            />
            <div className="min-w-0 text-left">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {opp.organizer}
              </span>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5 truncate leading-tight" title={opp.title}>
                {opp.title}
              </h4>
            </div>
          </div>

          {/* Location & Metadata Row */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1 font-semibold">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{opp.location} ({opp.mode})</span>
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{opp.freeOrPaid}</span>
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[130px]">{opp.prizePool}</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed text-left font-medium">
            {opp.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 pt-1.5">
            {opp.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-600 dark:text-slate-400 font-bold rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Panel (Countdown and CTA Actions) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center gap-3">
          
          {/* Countdown Clock */}
          <div className="text-left font-semibold">
            {timeLeft.expired ? (
              <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                <AlertCircle className="w-3 h-3" />
                <span>Expired</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Ends In</span>
                <div className="flex items-center gap-1 text-[10px] text-slate-700 dark:text-slate-300 font-black">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
                </div>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onShare}
              className="p-2 border border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-blue-600 rounded-xl transition"
              title="Share Opportunity"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <Link
              to={`/opportunities/${opp.id || opp._id}`}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100/50 text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-800/80 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 font-bold rounded-xl text-xs transition"
            >
              View Details
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
