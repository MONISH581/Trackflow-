import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore, OpportunityInfo } from "../store.ts";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Award,
  Clock,
  ExternalLink,
  Bookmark,
  Share2,
  CheckCircle,
  AlertCircle,
  Building2,
  Sparkles,
  ClipboardList,
  Target,
  FileText,
  BadgeAlert,
  Info,
  ChevronDown
} from "lucide-react";

export default function OpportunityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    fetchOpportunityById,
    toggleBookmark,
    toggleApply,
    opportunities,
    fetchOpportunities,
    addToast
  } = useStore();

  const [opp, setOpp] = React.useState<OpportunityInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"details" | "eligibility" | "rules" | "timeline">("details");
  const [faqOpen, setFaqOpen] = React.useState<Record<number, boolean>>({});

  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchOpportunityById(id).then(data => {
      setOpp(data);
      setLoading(false);
    });
    // Prefetch all opportunities for related listings if empty
    if (opportunities.length === 0) {
      fetchOpportunities();
    }
  }, [id, fetchOpportunityById, fetchOpportunities, opportunities.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600 dark:border-blue-400" />
        <p className="text-xs text-slate-500 font-semibold">Retrieving opportunity files...</p>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="glass-card max-w-md mx-auto p-8 text-center border border-slate-200 dark:border-slate-800 space-y-5 my-12">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Opportunity Not Found</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            The opportunity listing might have been removed, expired, or you followed an invalid URL.
          </p>
        </div>
        <button
          onClick={() => navigate("/opportunities")}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
        >
          Back to Opportunities
        </button>
      </div>
    );
  }

  const isSaved = opp.bookmarks && currentUser ? opp.bookmarks.includes(currentUser.userId) : false;
  const isApplied = currentUser ? (currentUser.appliedOpportunities || []).includes(opp.id || opp._id || "") : false;

  const handleBookmarkToggle = async () => {
    const success = await toggleBookmark(opp.id || opp._id || "");
    if (success && currentUser) {
      setOpp(prev => {
        if (!prev) return null;
        const bookmarks = isSaved
          ? prev.bookmarks.filter(uid => uid !== currentUser.userId)
          : [...prev.bookmarks, currentUser.userId];
        return { ...prev, bookmarks };
      });
    }
  };

  const handleApplyToggle = async () => {
    await toggleApply(opp.id || opp._id || "");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast("Link copied to clipboard!", "success");
  };

  // Filter related opportunities of the same category
  const relatedOpp = opportunities
    .filter(o => o.category === opp.category && (o.id !== opp.id && o._id !== opp._id))
    .slice(0, 3);

  // Mock FAQs
  const mockFaqs = [
    { q: "Who is eligible to participate?", a: opp.eligibility || "Open to all undergraduate and graduate college students globally." },
    { q: "Is there any registration fee?", a: opp.freeOrPaid === "Free" ? "No, registration for this opportunity is completely free." : "Yes, there is a fee. Please check the official portal link for payment details." },
    { q: "How do I register for the event?", a: "Click the 'Register Now / Apply Now' button. It will record your interest in our Lab system and provide you the link to submit your profile on the official organizer website." }
  ];

  return (
    <div className="space-y-6 text-left pb-16">
      
      {/* Back Button Action */}
      <div>
        <button
          onClick={() => navigate("/opportunities")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-blue-600 border border-slate-200 dark:border-slate-800 font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Opportunities</span>
        </button>
      </div>

      {/* Detail Showcase Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 h-64 md:h-80 shadow-lg border border-slate-200 dark:border-slate-800">
        <img
          src={opp.bannerImage || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80"}
          alt={opp.title}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        
        {/* Floating overlays in banner */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
          <div className="space-y-2 text-left">
            <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {opp.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight" title={opp.title}>
              {opp.title}
            </h1>
            <p className="text-xs text-slate-300 font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Organized by {opp.organizer}</span>
            </p>
          </div>
          
          <div className="flex gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={handleBookmarkToggle}
              className="p-3 bg-white/10 hover:bg-white/25 border border-white/20 rounded-xl transition backdrop-blur-md"
              title="Bookmark opportunity"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-3 bg-white/10 hover:bg-white/25 border border-white/20 rounded-xl transition backdrop-blur-md"
              title="Share link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout splits details & sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column Detailed Description */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm font-bold bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800">
            {(["details", "eligibility", "rules", "timeline"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-1 px-1 capitalize transition-all relative ${
                  activeTab === tab
                    ? "text-blue-600 dark:text-blue-400 font-extrabold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content renderer */}
          <div className="glass-card p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm text-left">
            {activeTab === "details" && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Opportunity Overview
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {opp.description}
                </p>
                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Skills / Focus Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {opp.tags.map((tag, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-bold rounded-lg border border-slate-200/40 dark:border-slate-700/40">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "eligibility" && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Eligibility Criteria & Requirements
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {opp.eligibility || "No academic or geographical restrictions have been configured. Open to all students pursuing undergraduate, graduate, or engineering programs."}
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3 text-xs">
                  <Info className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                    This opportunity targets **{opp.targetAudience}** students. Ensure your resume and skills dashboard profiles match these specifications.
                  </span>
                </div>
              </div>
            )}

            {activeTab === "rules" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Participation Guidelines & Rules
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    {opp.rules || "General contest and participation rules apply. Plagiarism of pre-existing codes, projects, or papers is strictly prohibited. Teams must submit original work created during the timeline."}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Judging & Evaluation Criteria</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    {opp.judgingCriteria || "Evaluations will be scored based on technical difficulty, originality, presentation, and impact of the solution."}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Important Dates & Schedule
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {opp.timeline || "Dates are subject to organizer adjustments. Please watch the announcements section."}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Registration Ends</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                      {new Date(opp.registrationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-155 dark:border-slate-800 rounded-xl text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Event Starts</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                      {new Date(opp.eventStartDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-155 dark:border-slate-800 rounded-xl text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Event Ends</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                      {new Date(opp.eventEndDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Frequently Asked Questions (FAQs)
            </h3>
            <div className="space-y-2">
              {mockFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                    className="w-full px-5 py-4 flex justify-between items-center text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${faqOpen[index] ? "transform rotate-180" : ""}`} />
                  </button>
                  {faqOpen[index] && (
                    <div className="px-5 pb-4 pt-1 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column Sidebar Metadata & CTA Actions */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Registration Card */}
          <div className="glass-card p-6 border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Milestone Deadline</span>
              <h4 className="text-slate-800 dark:text-slate-100 font-bold text-sm flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Apply Before {new Date(opp.registrationDeadline).toLocaleDateString()}</span>
              </h4>
            </div>

            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Registration Fee</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{opp.freeOrPaid}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Prize Pool / Stipend</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 truncate max-w-[150px]">{opp.prizePool}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Skill Level Req</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{opp.difficulty}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Audience Scope</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{opp.targetAudience}</span>
              </div>
            </div>

            {/* Application CTAs */}
            <div className="space-y-2 pt-4">
              <button
                onClick={handleApplyToggle}
                className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isApplied
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-900"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10"
                }`}
              >
                {isApplied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Applied Internally</span>
                  </>
                ) : (
                  <span>Record Applied Interest</span>
                )}
              </button>

              <a
                href={opp.website}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-3 border border-slate-200 dark:border-slate-800 hover:border-slate-350 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-xs font-bold transition"
              >
                <span>Go to Official Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Related Opportunities list */}
          {relatedOpp.length > 0 && (
            <div className="space-y-3 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Related {opp.category}
              </h3>
              
              <div className="space-y-3.5">
                {relatedOpp.map(item => (
                  <Link
                    key={item.id || item._id}
                    to={`/opportunities/${item.id || item._id}`}
                    className="block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400/50 hover:scale-[1.01] transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase truncate flex-1 block">
                        {item.organizer}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block mt-1 truncate">
                      {item.title}
                    </span>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
                      <span>{item.mode}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{item.freeOrPaid}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
