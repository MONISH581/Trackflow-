import React, { useState, useMemo } from "react";
import {
  HackathonInfo,
  OpportunityInfo,
  useStore,
  formatPrizePoolToINR
} from "../store.ts";
import {
  Sparkles,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  Building2,
  Layers,
  Calendar,
  X,
  CheckCircle,
  Clock,
  MapPin,
  Tag,
  ArrowUpRight,
  Shield,
  Brain,
  Code2,
  Cpu,
  Trophy,
  Filter,
  Check,
  ChevronRight,
  SlidersHorizontal,
  Info
} from "lucide-react";

export type DomainCategory = "AI" | "ML" | "FSD" | "Cyber" | "Web3" | "Other";

export interface UnifiedHackathon {
  id: string;
  title: string;
  organizer: string;
  sourceType: "Platform" | "Company";
  sourceId: string;
  sourceName: string;
  domain: DomainCategory;
  rawDomain: string;
  description: string;
  registrationLink: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  prizePool?: string;
  mode?: string;
  location?: string;
  tags?: string[];
  status?: string;
  bannerImage?: string;
}

export const MATRIX_DOMAINS: { id: DomainCategory; label: string; fullName: string; color: string; icon: any }[] = [
  { id: "AI", label: "AI", fullName: "Artificial Intelligence & LLMs", color: "indigo", icon: Brain },
  { id: "ML", label: "ML", fullName: "Machine Learning & Data Science", color: "cyan", icon: Cpu },
  { id: "FSD", label: "FSD", fullName: "Full Stack Development & Web/App", color: "emerald", icon: Code2 },
  { id: "Cyber", label: "Cyber", fullName: "Cybersecurity & Cloud Defense", color: "rose", icon: Shield },
  { id: "Web3", label: "Web3 & Other", fullName: "Web3, Blockchain & Open Innovation", color: "amber", icon: Trophy }
];

export const STANDARD_PLATFORMS = [
  { id: "devpost", name: "Devpost", aliases: ["devpost"] },
  { id: "hack2skill", name: "Hack2skill", aliases: ["hack2skill"] },
  { id: "unstop", name: "Unstop", aliases: ["unstop", "dare2compete", "d2c"] },
  { id: "hackerearth", name: "HackerEarth", aliases: ["hackerearth"] },
  { id: "devfolio", name: "Devfolio", aliases: ["devfolio"] },
  { id: "dorahacks", name: "DoraHacks", aliases: ["dorahacks"] },
  { id: "kaggle", name: "Kaggle", aliases: ["kaggle"] },
  { id: "sih", name: "Smart India Hackathon (SIH)", aliases: ["sih", "smart india"] },
  { id: "mlh", name: "Major League Hacking (MLH)", aliases: ["mlh", "major league hacking"] },
  { id: "huggingface", name: "Hugging Face", aliases: ["hugging face", "huggingface"] }
];

export const STANDARD_COMPANIES = [
  { id: "microsoft", name: "Microsoft (MIC)", aliases: ["microsoft", "azure", "imagine cup", "sentinel"] },
  { id: "google", name: "Google (GOOG)", aliases: ["google", "deepmind", "solution challenge", "gemini"] },
  { id: "amazon", name: "Amazon (AWS)", aliases: ["amazon", "aws", "bedrock"] },
  { id: "meta", name: "Meta", aliases: ["meta", "llama", "facebook"] },
  { id: "apple", name: "Apple", aliases: ["apple", "swift student"] },
  { id: "ibm", name: "IBM", aliases: ["ibm", "call for code"] },
  { id: "nvidia", name: "NVIDIA", aliases: ["nvidia"] },
  { id: "intel", name: "Intel", aliases: ["intel"] },
  { id: "infosys_tcs", name: "Infosys / TCS", aliases: ["infosys", "tcs", "tata"] }
];

export const MONTH_OPTIONS = [
  { id: "ALL", label: "All Months", short: "All" },
  { id: "0", label: "January", short: "Jan" },
  { id: "1", label: "February", short: "Feb" },
  { id: "2", label: "March", short: "Mar" },
  { id: "3", label: "April", short: "Apr" },
  { id: "4", label: "May", short: "May" },
  { id: "5", label: "June", short: "Jun" },
  { id: "6", label: "July", short: "Jul" },
  { id: "7", label: "August", short: "Aug" },
  { id: "8", label: "September", short: "Sep" },
  { id: "9", label: "October (.Oct)", short: "Oct" },
  { id: "10", label: "November", short: "Nov" },
  { id: "11", label: "December", short: "Dec" }
];

export function categorizeDomain(raw: {
  domain?: string;
  name?: string;
  title?: string;
  description?: string;
  tags?: string[];
}): DomainCategory {
  const text = `${raw.domain || ""} ${raw.name || raw.title || ""} ${raw.description || ""} ${(raw.tags || []).join(" ")}`.toLowerCase();

  // Cybersecurity & Cloud
  if (
    text.includes("cyber") ||
    text.includes("security") ||
    text.includes("ctf") ||
    text.includes("infosec") ||
    text.includes("sentinel") ||
    text.includes("threat") ||
    text.includes("vulnerability") ||
    text.includes("cloud security")
  ) {
    return "Cyber";
  }

  // Machine Learning / Kaggle / Data Science
  if (
    text.includes("kaggle") ||
    text.includes("machine learning") ||
    text.includes("data science") ||
    text.includes("predictive") ||
    text.includes("tabular") ||
    text.includes("dataset") ||
    text.includes("analytics")
  ) {
    return "ML";
  }

  // Artificial Intelligence / LLM / GenAI
  if (
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("genai") ||
    text.includes("llm") ||
    text.includes("gemini") ||
    text.includes("gpt") ||
    text.includes("deep learning") ||
    text.includes("prompt") ||
    text.includes("nlp") ||
    text.includes("llama") ||
    text.includes("computer vision")
  ) {
    return "AI";
  }

  // Full Stack Development / Web & App
  if (
    text.includes("fsd") ||
    text.includes("full stack") ||
    text.includes("fullstack") ||
    text.includes("web development") ||
    text.includes("web dev") ||
    text.includes("frontend") ||
    text.includes("backend") ||
    text.includes("mobile") ||
    text.includes("app") ||
    text.includes("swift") ||
    text.includes("flutter") ||
    text.includes("react") ||
    text.includes("node") ||
    text.includes("software engineering")
  ) {
    return "FSD";
  }

  // Web3 / Blockchain
  if (
    text.includes("web3") ||
    text.includes("crypto") ||
    text.includes("blockchain") ||
    text.includes("solana") ||
    text.includes("ethereum") ||
    text.includes("dorahacks")
  ) {
    return "Web3";
  }

  return "Other";
}

interface HackathonMatrixViewProps {
  hackathons?: HackathonInfo[];
  opportunities?: OpportunityInfo[];
  userRole?: string;
  onRefresh?: () => Promise<any> | void;
  onAddHackathon?: (preset?: { domain?: string; organizer?: string }) => void;
  title?: string;
  subtitle?: string;
}

export default function HackathonMatrixView({
  hackathons: propHackathons,
  opportunities: propOpportunities,
  userRole,
  onRefresh,
  onAddHackathon,
  title = "Hackathon Matrix View (Platforms & Companies × Domains)",
  subtitle = "Interactive cross-tabulation mapping hackathons by sourcing platform/company against technical domains."
}: HackathonMatrixViewProps) {
  const store = useStore();
  const hackathons = propHackathons || store.hackathons || [];
  const opportunities = propOpportunities || store.opportunities || [];
  const addToast = store.addToast;

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>("9"); // October by default (.Oct from drawing!)
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<"ALL" | "PLATFORMS" | "COMPANIES">("ALL");
  const [isSyncing, setIsSyncing] = useState(false);

  // Cell Detail Modal State
  const [activeCellModal, setActiveCellModal] = useState<{
    sourceName: string;
    sourceType: "Platform" | "Company";
    domain: DomainCategory;
    domainLabel: string;
    hackathons: UnifiedHackathon[];
  } | null>(null);

  // Convert and deduplicate items into UnifiedHackathon
  const unifiedList = useMemo<UnifiedHackathon[]>(() => {
    const map = new Map<string, UnifiedHackathon>();

    // 1. Process HackathonInfo
    for (const h of hackathons) {
      const id = h._id || h.id || h.hackathonId || "";
      const textOrg = `${h.organizer || ""} ${h.name || ""} ${h.registrationLink || ""}`.toLowerCase();

      // Determine Source
      let sourceType: "Platform" | "Company" = "Platform";
      let sourceId = "other";
      let sourceName = h.organizer || "Independent";

      // Match Company first if company is specific organizer
      const matchedCompany = STANDARD_COMPANIES.find((c) =>
        c.aliases.some((alias) => textOrg.includes(alias))
      );

      if (matchedCompany) {
        sourceType = "Company";
        sourceId = matchedCompany.id;
        sourceName = matchedCompany.name;
      } else {
        const matchedPlatform = STANDARD_PLATFORMS.find((p) =>
          p.aliases.some((alias) => textOrg.includes(alias))
        );
        if (matchedPlatform) {
          sourceType = "Platform";
          sourceId = matchedPlatform.id;
          sourceName = matchedPlatform.name;
        } else {
          sourceType = "Platform";
          sourceId = "other_platform";
          sourceName = h.organizer || "Dev Community";
        }
      }

      const domainCat = categorizeDomain(h);

      map.set(id, {
        id,
        title: h.name,
        organizer: h.organizer,
        sourceType,
        sourceId,
        sourceName,
        domain: domainCat,
        rawDomain: h.domain || "",
        description: h.description,
        registrationLink: h.registrationLink,
        startDate: h.startDate,
        endDate: h.endDate,
        registrationDeadline: h.registrationDeadline,
        prizePool: "Platform Badges & Cash",
        mode: h.mode || "Online",
        location: h.location || "Global",
        tags: h.tags || [],
        status: h.status || "Active"
      });
    }

    // 2. Process OpportunityInfo where category == "Hackathons"
    for (const o of opportunities) {
      if ((o.category || "").toLowerCase() !== "hackathons") continue;
      const id = o._id || o.id || o.title;
      if (map.has(id)) continue;

      const textOrg = `${o.organizer || ""} ${o.title || ""} ${o.website || ""} ${o.registrationLink || ""}`.toLowerCase();

      let sourceType: "Platform" | "Company" = "Platform";
      let sourceId = "other";
      let sourceName = o.organizer || "Independent";

      const matchedCompany = STANDARD_COMPANIES.find((c) =>
        c.aliases.some((alias) => textOrg.includes(alias))
      );

      if (matchedCompany) {
        sourceType = "Company";
        sourceId = matchedCompany.id;
        sourceName = matchedCompany.name;
      } else {
        const matchedPlatform = STANDARD_PLATFORMS.find((p) =>
          p.aliases.some((alias) => textOrg.includes(alias))
        );
        if (matchedPlatform) {
          sourceType = "Platform";
          sourceId = matchedPlatform.id;
          sourceName = matchedPlatform.name;
        } else {
          sourceType = "Platform";
          sourceId = "other_platform";
          sourceName = o.organizer || "Tech Platform";
        }
      }

      const domainCat = categorizeDomain(o);

      map.set(id, {
        id,
        title: o.title,
        organizer: o.organizer,
        sourceType,
        sourceId,
        sourceName,
        domain: domainCat,
        rawDomain: o.category,
        description: o.description,
        registrationLink: o.registrationLink || o.website,
        startDate: o.eventStartDate,
        endDate: o.eventEndDate,
        registrationDeadline: o.registrationDeadline,
        prizePool: formatPrizePoolToINR(o.prizePool),
        mode: o.mode,
        location: o.location,
        tags: o.tags || [],
        status: o.status || "Active",
        bannerImage: o.bannerImage
      });
    }

    return Array.from(map.values());
  }, [hackathons, opportunities]);

  // Apply Month Filter & Search Query
  const filteredList = useMemo(() => {
    return unifiedList.filter((item) => {
      // Month Filter
      if (selectedMonth !== "ALL") {
        const monthNum = parseInt(selectedMonth, 10);
        const checkDates = [item.startDate, item.registrationDeadline, item.endDate].filter(Boolean);
        let monthMatched = false;

        if (checkDates.length > 0) {
          monthMatched = checkDates.some((d) => {
            const dateObj = new Date(d!);
            return !isNaN(dateObj.getTime()) && dateObj.getMonth() === monthNum;
          });
        } else {
          // If date not provided, default active items include current season (Oct)
          monthMatched = monthNum === 9;
        }

        if (!monthMatched) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${item.title} ${item.organizer} ${item.sourceName} ${item.rawDomain} ${item.description} ${(item.tags || []).join(" ")}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [unifiedList, selectedMonth, searchQuery]);

  // Build matrix row groupings
  const platformRows = useMemo(() => {
    return STANDARD_PLATFORMS.map((platform) => {
      const items = filteredList.filter(
        (item) => item.sourceType === "Platform" && item.sourceId === platform.id
      );

      const cellItems: Record<DomainCategory, UnifiedHackathon[]> = {
        AI: items.filter((i) => i.domain === "AI"),
        ML: items.filter((i) => i.domain === "ML"),
        FSD: items.filter((i) => i.domain === "FSD"),
        Cyber: items.filter((i) => i.domain === "Cyber"),
        Web3: items.filter((i) => i.domain === "Web3" || i.domain === "Other"),
        Other: items.filter((i) => i.domain === "Other")
      };

      return {
        ...platform,
        sourceType: "Platform" as const,
        total: items.length,
        cellItems
      };
    });
  }, [filteredList]);

  const companyRows = useMemo(() => {
    return STANDARD_COMPANIES.map((company) => {
      const items = filteredList.filter(
        (item) => item.sourceType === "Company" && item.sourceId === company.id
      );

      const cellItems: Record<DomainCategory, UnifiedHackathon[]> = {
        AI: items.filter((i) => i.domain === "AI"),
        ML: items.filter((i) => i.domain === "ML"),
        FSD: items.filter((i) => i.domain === "FSD"),
        Cyber: items.filter((i) => i.domain === "Cyber"),
        Web3: items.filter((i) => i.domain === "Web3" || i.domain === "Other"),
        Other: items.filter((i) => i.domain === "Other")
      };

      return {
        ...company,
        sourceType: "Company" as const,
        total: items.length,
        cellItems
      };
    });
  }, [filteredList]);

  // Column Totals
  const columnTotals = useMemo(() => {
    const totals: Record<DomainCategory, number> = {
      AI: 0,
      ML: 0,
      FSD: 0,
      Cyber: 0,
      Web3: 0,
      Other: 0
    };

    filteredList.forEach((item) => {
      if (item.domain === "Web3" || item.domain === "Other") {
        totals["Web3"] = (totals["Web3"] || 0) + 1;
      } else {
        totals[item.domain] = (totals[item.domain] || 0) + 1;
      }
    });

    return totals;
  }, [filteredList]);

  const grandTotal = filteredList.length;

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await store.fetchHackathons();
        await store.fetchOpportunities();
      }
      addToast("Hackathon matrix updated successfully!", "success");
    } catch {
      addToast("Failed to refresh hackathon matrix", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenCell = (
    sourceName: string,
    sourceType: "Platform" | "Company",
    domain: DomainCategory,
    items: UnifiedHackathon[]
  ) => {
    const domainDef = MATRIX_DOMAINS.find((d) => d.id === domain);
    setActiveCellModal({
      sourceName,
      sourceType,
      domain,
      domainLabel: domainDef?.label || domain,
      hackathons: items
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                Cross-Domain Matrix Command
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-400/30 text-purple-200">
                {selectedMonth === "9" ? "Month: October Active (.Oct)" : `Month: ${MONTH_OPTIONS.find((m) => m.id === selectedMonth)?.label}`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{title}</span>
            </h1>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">Total Events</span>
              <span className="text-xl font-black text-white">{grandTotal}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">Top Domain</span>
              <span className="text-base font-black text-emerald-300">
                {grandTotal === 0 ? "-" : Object.entries(columnTotals).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0]}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/15 cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh and sync latest hackathons"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Live"}</span>
            </button>

            {onAddHackathon && (userRole === "coordinator" || userRole === "master_admin") && (
              <button
                onClick={() => onAddHackathon()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hackathon</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Month Selector & Search Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        {/* Month Selector Pills (Matches drawing with top-right .Oct) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Active Period Filter:
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              (Filter by month as annotated in sketch)
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {MONTH_OPTIONS.map((m) => {
              const isSelected = selectedMonth === m.id;
              const isOct = m.id === "9";
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMonth(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-400/40"
                      : isOct
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {m.short}
                  {isOct && <span className="ml-1 text-[10px] px-1 bg-white/20 rounded">sketch</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Source Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search hackathons, platforms, Google, Microsoft, domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Show Rows:</span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSourceTypeFilter("ALL")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  sourceTypeFilter === "ALL"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All (Matrix)
              </button>
              <button
                onClick={() => setSourceTypeFilter("PLATFORMS")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  sourceTypeFilter === "PLATFORMS"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Platforms Only
              </button>
              <button
                onClick={() => setSourceTypeFilter("COMPANIES")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  sourceTypeFilter === "COMPANIES"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Companies Only
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE (Handwritten Paper Layout Replication) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[760px]">
            {/* Table Header: Domains across top */}
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                {/* Top-Left Corner Header */}
                <th className="p-4 sm:p-5 w-56 sticky left-0 z-20 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        Source
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        Platform / Company
                      </span>
                    </div>
                    <Layers className="w-4 h-4 text-slate-400" />
                  </div>
                </th>

                {/* Domain Headers: AI, ML, FSD, Cyber, Web3 */}
                {MATRIX_DOMAINS.map((domain) => {
                  const Icon = domain.icon;
                  return (
                    <th
                      key={domain.id}
                      className="p-4 text-center border-r border-slate-100 dark:border-slate-800 min-w-[110px]"
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black ${
                            domain.id === "AI"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                              : domain.id === "ML"
                              ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300"
                              : domain.id === "FSD"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : domain.id === "Cyber"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {domain.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">
                          {domain.fullName.split(" ")[0]}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* Total Column Header */}
                <th className="p-4 text-center font-black text-slate-800 dark:text-slate-200 bg-slate-100/50 dark:bg-slate-900/50 min-w-[80px]">
                  <span className="text-xs uppercase tracking-wider block">Total</span>
                  <span className="text-[10px] text-slate-400 font-normal">Active</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {/* SECTION 1: PLATFORMS */}
              {(sourceTypeFilter === "ALL" || sourceTypeFilter === "PLATFORMS") && (
                <>
                  <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 border-y border-indigo-100 dark:border-indigo-900/40">
                    <td
                      colSpan={MATRIX_DOMAINS.length + 2}
                      className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Platform (Where hackathons are hosted & discovered)</span>
                      </div>
                    </td>
                  </tr>

                  {platformRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Sticky Row Label (Left) */}
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 border-r border-slate-200/80 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2 font-extrabold text-xs">{row.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {row.total}
                          </span>
                        </div>
                      </td>

                      {/* Domain Cells */}
                      {MATRIX_DOMAINS.map((domain) => {
                        const items = row.cellItems[domain.id] || [];
                        const count = items.length;

                        return (
                          <td
                            key={domain.id}
                            className="p-3 text-center border-r border-slate-100 dark:border-slate-800/60"
                          >
                            {count > 0 ? (
                              <button
                                onClick={() => handleOpenCell(row.name, "Platform", domain.id, items)}
                                className={`w-10 h-8 rounded-xl font-black text-xs transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-xs inline-flex items-center justify-center ${
                                  domain.id === "AI"
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
                                    : domain.id === "ML"
                                    ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-500/20"
                                    : domain.id === "FSD"
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                                    : domain.id === "Cyber"
                                    ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20"
                                    : "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20"
                                }`}
                                title={`Click to view ${count} ${domain.label} hackathons on ${row.name}`}
                              >
                                {count}
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700 font-bold text-sm block">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="p-3 text-center font-extrabold text-xs text-slate-700 dark:text-slate-300 bg-slate-50/30 dark:bg-slate-900/30">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* SECTION 2: COMPANIES */}
              {(sourceTypeFilter === "ALL" || sourceTypeFilter === "COMPANIES") && (
                <>
                  <tr className="bg-purple-50/40 dark:bg-purple-950/20 border-y border-purple-100 dark:border-purple-900/40">
                    <td
                      colSpan={MATRIX_DOMAINS.length + 2}
                      className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Comp / Company (Corporate & Tech Giant Sponsoring Hosts)</span>
                      </div>
                    </td>
                  </tr>

                  {companyRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Sticky Row Label (Left) */}
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 border-r border-slate-200/80 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2 font-extrabold text-xs">{row.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {row.total}
                          </span>
                        </div>
                      </td>

                      {/* Domain Cells */}
                      {MATRIX_DOMAINS.map((domain) => {
                        const items = row.cellItems[domain.id] || [];
                        const count = items.length;

                        return (
                          <td
                            key={domain.id}
                            className="p-3 text-center border-r border-slate-100 dark:border-slate-800/60"
                          >
                            {count > 0 ? (
                              <button
                                onClick={() => handleOpenCell(row.name, "Company", domain.id, items)}
                                className={`w-10 h-8 rounded-xl font-black text-xs transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-xs inline-flex items-center justify-center ${
                                  domain.id === "AI"
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
                                    : domain.id === "ML"
                                    ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-500/20"
                                    : domain.id === "FSD"
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                                    : domain.id === "Cyber"
                                    ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20"
                                    : "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20"
                                }`}
                                title={`Click to view ${count} ${domain.label} hackathons by ${row.name}`}
                              >
                                {count}
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700 font-bold text-sm block">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="p-3 text-center font-extrabold text-xs text-slate-700 dark:text-slate-300 bg-slate-50/30 dark:bg-slate-900/30">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>

            {/* Bottom Summary Row: Column Totals */}
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-950 font-black border-t-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                <td className="p-4 sticky left-0 z-10 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="uppercase text-xs tracking-wider">Domain Totals</span>
                    <span className="text-[10px] text-slate-500 font-normal">Cross-matrix</span>
                  </div>
                </td>

                {MATRIX_DOMAINS.map((domain) => (
                  <td key={domain.id} className="p-4 text-center border-r border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-black text-indigo-700 dark:text-indigo-400">
                        {columnTotals[domain.id] || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {grandTotal > 0
                          ? `${Math.round(((columnTotals[domain.id] || 0) / grandTotal) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                  </td>
                ))}

                <td className="p-4 text-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-black">{grandTotal}</span>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Total</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* CELL DETAIL MODAL / DRAWER */}
      {activeCellModal && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {activeCellModal.sourceType}: {activeCellModal.sourceName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Domain: {activeCellModal.domainLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeCellModal.hackathons.length} Tracked Hackathon{activeCellModal.hackathons.length !== 1 ? "s" : ""}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveCellModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Hackathons List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeCellModal.hackathons.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Info className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No hackathons currently found in this intersection.</p>
                </div>
              ) : (
                activeCellModal.hackathons.map((hackathon) => (
                  <div
                    key={hackathon.id}
                    className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3 hover:border-indigo-300 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                          by {hackathon.organizer}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {hackathon.title}
                        </h4>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                        {hackathon.mode || "Online"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {hackathon.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                      {hackathon.registrationDeadline && (
                        <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                          <Clock className="w-3 h-3" />
                          Deadline: {new Date(hackathon.registrationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      {hackathon.prizePool && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Trophy className="w-3 h-3" />
                          Prize: {hackathon.prizePool}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <span className="text-[10px] font-bold text-slate-400">
                        Category: {hackathon.rawDomain || activeCellModal.domainLabel}
                      </span>

                      {hackathon.registrationLink && (
                        <a
                          href={hackathon.registrationLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
                        >
                          <span>Go to Platform Registration</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">
                Viewing {activeCellModal.sourceName} × {activeCellModal.domainLabel}
              </span>
              <button
                onClick={() => setActiveCellModal(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold rounded-xl text-slate-700 dark:text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
