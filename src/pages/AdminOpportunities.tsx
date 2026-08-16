import React from "react";
import { useStore, OpportunityInfo } from "../store.ts";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Bookmark,
  Sparkles,
  Zap,
  Check,
  X,
  Compass,
  DollarSign,
  MapPin,
  SlidersHorizontal,
  Search,
  Award,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminOpportunities() {
  const navigate = useNavigate();
  const {
    currentUser,
    opportunities,
    fetchOpportunities,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    addToast
  } = useStore();

  // Modal / Form States
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [selectedOppId, setSelectedOppId] = React.useState<string | null>(null);
  
  // Search
  const [search, setSearch] = React.useState("");

  // Form Fields
  const [title, setTitle] = React.useState("");
  const [organizer, setOrganizer] = React.useState("");
  const [category, setCategory] = React.useState("Hackathons");
  const [description, setDescription] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [registrationLink, setRegistrationLink] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [mode, setMode] = React.useState<"Online" | "Offline" | "Hybrid">("Online");
  const [freeOrPaid, setFreeOrPaid] = React.useState<"Free" | "Paid">("Free");
  const [targetAudience, setTargetAudience] = React.useState<"Student Only" | "College" | "International">("Student Only");
  const [prizePool, setPrizePool] = React.useState("");
  const [registrationDeadline, setRegistrationDeadline] = React.useState("");
  const [eventStartDate, setEventStartDate] = React.useState("");
  const [eventEndDate, setEventEndDate] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [eligibility, setEligibility] = React.useState("");
  const [timeline, setTimeline] = React.useState("");
  const [rules, setRules] = React.useState("");
  const [judgingCriteria, setJudgingCriteria] = React.useState("");
  const [tagsStr, setTagsStr] = React.useState("");
  const [featured, setFeatured] = React.useState(false);
  const [trending, setTrending] = React.useState(false);

  React.useEffect(() => {
    // Restrict to Coordinator
    if (currentUser?.role !== "coordinator") {
      navigate("/opportunities");
      return;
    }
    fetchOpportunities({ search });
  }, [currentUser, fetchOpportunities, navigate, search]);

  const resetForm = () => {
    setTitle("");
    setOrganizer("");
    setCategory("Hackathons");
    setDescription("");
    setWebsite("");
    setRegistrationLink("");
    setLocation("");
    setMode("Online");
    setFreeOrPaid("Free");
    setTargetAudience("Student Only");
    setPrizePool("");
    setRegistrationDeadline("");
    setEventStartDate("");
    setEventEndDate("");
    setDifficulty("Beginner");
    setEligibility("");
    setTimeline("");
    setRules("");
    setJudgingCriteria("");
    setTagsStr("");
    setFeatured(false);
    setTrending(false);
    setSelectedOppId(null);
    setEditMode(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditMode(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (opp: OpportunityInfo) => {
    resetForm();
    setEditMode(true);
    setSelectedOppId(opp.id || opp._id || null);
    
    setTitle(opp.title);
    setOrganizer(opp.organizer);
    setCategory(opp.category);
    setDescription(opp.description);
    setWebsite(opp.website);
    setRegistrationLink(opp.registrationLink);
    setLocation(opp.location);
    setMode(opp.mode);
    setFreeOrPaid(opp.freeOrPaid);
    setTargetAudience(opp.targetAudience);
    setPrizePool(opp.prizePool);
    
    // Formatting ISO Dates to string YYYY-MM-DD
    const formatDate = (iso: string) => {
      if (!iso) return "";
      return new Date(iso).toISOString().split("T")[0];
    };
    setRegistrationDeadline(formatDate(opp.registrationDeadline));
    setEventStartDate(formatDate(opp.eventStartDate));
    setEventEndDate(formatDate(opp.eventEndDate));
    
    setDifficulty(opp.difficulty);
    setEligibility(opp.eligibility || "");
    setTimeline(opp.timeline || "");
    setRules(opp.rules || "");
    setJudgingCriteria(opp.judgingCriteria || "");
    setTagsStr((opp.tags || []).join(", "));
    setFeatured(opp.featured || false);
    setTrending(opp.trending || false);

    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !organizer || !description || !registrationDeadline || !eventStartDate || !eventEndDate) {
      addToast("Please fill in all required fields.", "error");
      return;
    }

    const tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
    const oppPayload = {
      title,
      organizer,
      category,
      description,
      website: website || "https://google.com",
      registrationLink: registrationLink || website || "https://google.com",
      location: location || "Online",
      mode,
      freeOrPaid,
      targetAudience,
      prizePool: prizePool || "Bragging rights",
      registrationDeadline: new Date(registrationDeadline).toISOString(),
      eventStartDate: new Date(eventStartDate).toISOString(),
      eventEndDate: new Date(eventEndDate).toISOString(),
      difficulty,
      eligibility,
      timeline,
      rules,
      judgingCriteria,
      tags,
      featured,
      trending
    };

    let success = false;
    if (editMode && selectedOppId) {
      success = await updateOpportunity(selectedOppId, oppPayload);
    } else {
      success = await createOpportunity(oppPayload);
    }

    if (success) {
      setModalOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this opportunity? This cannot be undone.")) {
      await deleteOpportunity(id);
    }
  };

  const handleToggleFeature = async (opp: OpportunityInfo) => {
    const oppId = opp.id || opp._id;
    if (oppId) {
      await updateOpportunity(oppId, { featured: !opp.featured });
    }
  };

  const handleToggleTrending = async (opp: OpportunityInfo) => {
    const oppId = opp.id || opp._id;
    if (oppId) {
      await updateOpportunity(oppId, { trending: !opp.trending });
    }
  };

  // Calculate quick stats
  const totalViews = opportunities.reduce((acc, o) => acc + (o.views || 0), 0);
  const totalBookmarks = opportunities.reduce((acc, o) => acc + (o.bookmarks?.length || 0), 0);
  const featuredCount = opportunities.filter(o => o.featured).length;

  return (
    <div className="space-y-6 text-left pb-16">
      
      {/* Ribbon Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <button
          onClick={() => navigate("/opportunities")}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hub</span>
        </button>
        <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Opportunities Hub Administration</span>
        </h1>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Listings</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block">{opportunities.length}</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative Views</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block">{totalViews}</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Saves</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block">{totalBookmarks}</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-xl">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Featured Items</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block">{featuredCount}</span>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pending Student Opportunity Approvals Section */}
      <div className="glass-card p-6 border border-amber-200/80 bg-amber-50/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-800">Student Submitted Opportunities for Review</h2>
              <p className="text-xs text-slate-500">Approve student submitted hackathons and opportunities to publish them to the hub</p>
            </div>
          </div>
        </div>

        {opportunities.filter(o => o.approved === false).length === 0 ? (
          <p className="text-xs text-slate-400 italic">No pending student opportunities to review.</p>
        ) : (
          <div className="space-y-3">
            {opportunities.filter(o => o.approved === false).map(opp => (
              <div key={opp.id || opp._id} className="p-4 bg-white rounded-xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded">
                      {opp.category}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Submitted by: {opp.submittedByName || "Student"}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{opp.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-1">{opp.description}</p>
                  <a href={opp.registrationLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-bold mt-1 inline-block">
                    Link: {opp.registrationLink}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/opportunities/${opp._id || opp.id}/approve`, { method: "PUT" });
                      if (res.ok) {
                        addToast("Opportunity approved & published!", "success");
                        fetchOpportunities({ search });
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Approve & Publish ✓
                  </button>
                  <button
                    onClick={() => handleDelete(opp.id || opp._id || "")}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Decline ✗
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search records by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input px-3.5 py-2 rounded-xl text-xs pl-9 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Opportunity</span>
        </button>
      </div>

      {/* Main Table Listing */}
      <div className="glass-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 w-1/4">Opportunity Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Parameters</th>
                <th className="p-4">Views / Saves</th>
                <th className="p-4">Highlight Badges</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {opportunities.map((opp) => (
                <tr key={opp.id || opp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[200px]">
                      {opp.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">
                      by {opp.organizer}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold rounded">
                      {opp.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {opp.mode} ({opp.location})
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-slate-400" /> {opp.freeOrPaid}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opp.views || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opp.bookmarks?.length || 0}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFeature(opp)}
                        className={`p-1.5 rounded transition ${
                          opp.featured
                            ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 border border-yellow-200"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200"
                        }`}
                        title="Toggle Featured"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleTrending(opp)}
                        className={`p-1.5 rounded transition ${
                          opp.trending
                            ? "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-200"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200"
                        }`}
                        title="Toggle Trending"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(opp)}
                        className="p-2 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-blue-600 rounded-xl transition"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(opp.id || opp._id || "")}
                        className="p-2 border border-slate-200 dark:border-slate-800 hover:border-rose-250 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-rose-600 rounded-xl transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    No opportunities found in the hub database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {editMode ? "Modify Opportunity Details" : "Publish New Opportunity"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Opportunity Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                    placeholder="e.g. Google Solution Challenge"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organizer Name *</label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                    placeholder="e.g. Google Developers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full glass-input p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
                  >
                    <option value="Jobs">🏢 Jobs</option>
                    <option value="Hackathons">💻 Hackathons</option>
                    <option value="Internships">💼 Internships</option>
                    <option value="Coding Contests">🏆 Coding Contests</option>
                    <option value="Scholarships">🎓 Scholarships</option>
                    <option value="Workshops">📚 Workshops</option>
                    <option value="Webinars">🎤 Webinars</option>
                    <option value="Conferences">🌍 Conferences</option>
                    <option value="Open Source">❤️ Open Source</option>
                    <option value="Research">🔬 Research</option>
                    <option value="Bootcamps">🚀 Bootcamps</option>
                    <option value="Fellowships">🏅 Fellowships</option>
                    <option value="Innovation Challenges">💡 Innovation Challenges</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Event Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full glass-input p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
                  >
                    <option value="Online">Online / Virtual</option>
                    <option value="Offline">Offline / In-person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location (Venue/City)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                    placeholder="e.g. Bangalore, India (or Global)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prize Pool / Stipend Info</label>
                  <input
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                    placeholder="e.g. $10,000 USD / stipend"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Audience Scope</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full glass-input p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
                  >
                    <option value="Student Only">Student Only</option>
                    <option value="College">College</option>
                    <option value="International">International Scope</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Difficulty Rating</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full glass-input p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
                  >
                    <option value="Beginner">Beginner Friendly</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced / Pro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entry Fee Parameter</label>
                  <select
                    value={freeOrPaid}
                    onChange={(e) => setFreeOrPaid(e.target.value as any)}
                    className="w-full glass-input p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950"
                  >
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reg Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Event Start Date *</label>
                  <input
                    type="date"
                    required
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Event End Date *</label>
                  <input
                    type="date"
                    required
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skills / Focus Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                    placeholder="e.g. AI, React, Git, Python"
                  />
                </div>

              </div>

              {/* Text areas */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Summary Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full glass-input p-3 rounded-xl text-xs font-semibold"
                    placeholder="Provide a detailed summary description of the opportunities, focus area, etc..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Eligibility Specifications</label>
                  <textarea
                    rows={2}
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    className="w-full glass-input p-3 rounded-xl text-xs font-semibold"
                    placeholder="Academic prerequisites, departments or year restrictions..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contest Timeline details</label>
                  <textarea
                    rows={2}
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full glass-input p-3 rounded-xl text-xs font-semibold"
                    placeholder="Phase 1 idea submission dates, final presentations, winner schedules..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rules & Evaluation Criteria</label>
                  <textarea
                    rows={2}
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="w-full glass-input p-3 rounded-xl text-xs font-semibold"
                    placeholder="Submission guidelines, plagiarism codes, evaluation weighting parameters..."
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Feature on Hero Carousel</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={trending}
                    onChange={(e) => setTrending(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Mark as Trending / Hot</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/10"
                >
                  {editMode ? "Save Changes" : "Publish Opportunity"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
