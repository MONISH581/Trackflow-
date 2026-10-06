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
  Clock,
  MapPin,
  Tag,
  Shield,
  Brain,
  Code2,
  Cpu,
  Trophy,
  Cloud,
  Smartphone,
  Coins,
  Radio,
  Globe,
  Sliders,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Info
} from "lucide-react";

export type DomainCategory =
  | "AI"
  | "ML"
  | "FSD"
  | "Cyber"
  | "Cloud"
  | "Mobile"
  | "Web3"
  | "IoT"
  | "OpenTech";

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

export interface DomainMeta {
  id: DomainCategory;
  label: string;
  shortCode: string;
  fullName: string;
  categoryGroup: "core" | "expanded";
  theme: {
    pill: string;
    iconBg: string;
    text: string;
    glow: string;
    accent: string;
  };
  icon: any;
}

export const ALL_DOMAINS: DomainMeta[] = [
  {
    id: "AI",
    label: "AI",
    shortCode: "AI",
    fullName: "Artificial Intelligence & LLMs",
    categoryGroup: "core",
    theme: {
      pill: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 hover:bg-indigo-500/25 hover:border-indigo-400 shadow-[0_0_14px_rgba(99,102,241,0.25)]",
      iconBg: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
      text: "text-indigo-400",
      glow: "rgba(99,102,241,0.3)",
      accent: "#6366f1"
    },
    icon: Brain
  },
  {
    id: "ML",
    label: "ML",
    shortCode: "ML",
    fullName: "Machine Learning & Data Science",
    categoryGroup: "core",
    theme: {
      pill: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 hover:bg-cyan-500/25 hover:border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.25)]",
      iconBg: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
      text: "text-cyan-400",
      glow: "rgba(6,182,212,0.3)",
      accent: "#06b6d4"
    },
    icon: Cpu
  },
  {
    id: "FSD",
    label: "FSD",
    shortCode: "FSD",
    fullName: "Full Stack Development & Web",
    categoryGroup: "core",
    theme: {
      pill: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25 hover:border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.25)]",
      iconBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      text: "text-emerald-400",
      glow: "rgba(16,185,129,0.3)",
      accent: "#10b981"
    },
    icon: Code2
  },
  {
    id: "Cyber",
    label: "Cyber",
    shortCode: "Cyber",
    fullName: "Cybersecurity & Cloud Defense",
    categoryGroup: "core",
    theme: {
      pill: "bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500/25 hover:border-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.25)]",
      iconBg: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
      text: "text-rose-400",
      glow: "rgba(244,63,94,0.3)",
      accent: "#f43f5e"
    },
    icon: Shield
  },
  {
    id: "Cloud",
    label: "Cloud",
    shortCode: "Cloud",
    fullName: "Cloud Infrastructure & DevOps",
    categoryGroup: "expanded",
    theme: {
      pill: "bg-sky-500/15 text-sky-300 border border-sky-500/35 hover:bg-sky-500/25 hover:border-sky-400 shadow-[0_0_14px_rgba(14,165,233,0.25)]",
      iconBg: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
      text: "text-sky-400",
      glow: "rgba(14,165,233,0.3)",
      accent: "#0ea5e9"
    },
    icon: Cloud
  },
  {
    id: "Mobile",
    label: "Mobile",
    shortCode: "Mobile",
    fullName: "Mobile App Development",
    categoryGroup: "expanded",
    theme: {
      pill: "bg-violet-500/15 text-violet-300 border border-violet-500/35 hover:bg-violet-500/25 hover:border-violet-400 shadow-[0_0_14px_rgba(139,92,246,0.25)]",
      iconBg: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
      text: "text-violet-400",
      glow: "rgba(139,92,246,0.3)",
      accent: "#8b5cf6"
    },
    icon: Smartphone
  },
  {
    id: "Web3",
    label: "Web3",
    shortCode: "Web3",
    fullName: "Blockchain & Decentralized Tech",
    categoryGroup: "expanded",
    theme: {
      pill: "bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 hover:border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.25)]",
      iconBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      text: "text-amber-400",
      glow: "rgba(245,158,11,0.3)",
      accent: "#f59e0b"
    },
    icon: Coins
  },
  {
    id: "IoT",
    label: "IoT",
    shortCode: "IoT",
    fullName: "IoT, Embedded & Robotics",
    categoryGroup: "expanded",
    theme: {
      pill: "bg-teal-500/15 text-teal-300 border border-teal-500/35 hover:bg-teal-500/25 hover:border-teal-400 shadow-[0_0_14px_rgba(20,184,166,0.25)]",
      iconBg: "bg-teal-500/20 text-teal-400 border border-teal-500/30",
      text: "text-teal-400",
      glow: "rgba(20,184,166,0.3)",
      accent: "#14b8a6"
    },
    icon: Radio
  },
  {
    id: "OpenTech",
    label: "Open Tech",
    shortCode: "Open",
    fullName: "Open Innovation & Govt Tech",
    categoryGroup: "expanded",
    theme: {
      pill: "bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/35 hover:bg-fuchsia-500/25 hover:border-fuchsia-400 shadow-[0_0_14px_rgba(217,70,239,0.25)]",
      iconBg: "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30",
      text: "text-fuchsia-400",
      glow: "rgba(217,70,239,0.3)",
      accent: "#d946ef"
    },
    icon: Globe
  }
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
  { id: "9", label: "October", short: "Oct" },
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

  // 1. Cybersecurity & Threat Defense
  if (
    text.includes("cyber") ||
    text.includes("security") ||
    text.includes("ctf") ||
    text.includes("infosec") ||
    text.includes("sentinel") ||
    text.includes("threat") ||
    text.includes("vulnerability") ||
    text.includes("zero-trust") ||
    text.includes("penetration") ||
    text.includes("firewall")
  ) {
    return "Cyber";
  }

  // 2. Artificial Intelligence & LLMs (GenAI, LLMs, Agents, Vision, Prompting)
  if (
    text.includes("genai") ||
    text.includes("generative ai") ||
    text.includes("llm") ||
    text.includes("large language") ||
    text.includes("gemini") ||
    text.includes("gpt") ||
    text.includes("prompt") ||
    text.includes("deep learning") ||
    text.includes("nlp") ||
    text.includes("llama") ||
    text.includes("agent") ||
    text.includes("neural") ||
    text.includes("openai") ||
    text.includes("hugging face") ||
    text.includes("huggingface") ||
    text.includes("computer vision") ||
    text.includes("artificial intelligence") ||
    /\bai\b/.test(text)
  ) {
    return "AI";
  }

  // 3. Machine Learning & Data Science (Kaggle, Predictive, Tabular)
  if (
    text.includes("kaggle") ||
    text.includes("machine learning") ||
    text.includes("data science") ||
    text.includes("predictive") ||
    text.includes("tabular") ||
    text.includes("dataset") ||
    text.includes("analytics") ||
    text.includes("data mining") ||
    /\bml\b/.test(text)
  ) {
    return "ML";
  }

  // 4. Cloud Infrastructure & DevOps
  if (
    text.includes("devops") ||
    text.includes("cloud computing") ||
    text.includes("kubernetes") ||
    text.includes("docker") ||
    text.includes("aws") ||
    text.includes("azure") ||
    text.includes("gcp") ||
    text.includes("serverless") ||
    text.includes("microservice") ||
    text.includes("cloud run") ||
    text.includes("lambda") ||
    text.includes("devnetwork")
  ) {
    return "Cloud";
  }

  // 5. Mobile App Development
  if (
    text.includes("android") ||
    text.includes("ios") ||
    text.includes("swift") ||
    text.includes("flutter") ||
    text.includes("react native") ||
    text.includes("kotlin") ||
    text.includes("mobile app") ||
    text.includes("app sprint") ||
    text.includes("swiftui")
  ) {
    return "Mobile";
  }

  // 6. Web3 & Blockchain
  if (
    text.includes("web3") ||
    text.includes("blockchain") ||
    text.includes("crypto") ||
    text.includes("solana") ||
    text.includes("ethereum") ||
    text.includes("smart contract") ||
    text.includes("defi") ||
    text.includes("depin") ||
    text.includes("dorahacks")
  ) {
    return "Web3";
  }

  // 7. IoT & Robotics
  if (
    text.includes("iot") ||
    text.includes("internet of things") ||
    text.includes("robotics") ||
    text.includes("hardware") ||
    text.includes("embedded") ||
    text.includes("arduino") ||
    text.includes("raspberry") ||
    text.includes("sensor")
  ) {
    return "IoT";
  }

  // 8. Open Innovation & Govt Tech
  if (
    text.includes("sih") ||
    text.includes("smart india") ||
    text.includes("govt") ||
    text.includes("government") ||
    text.includes("nasa") ||
    text.includes("space apps") ||
    text.includes("naan mudhalvan") ||
    text.includes("social good")
  ) {
    return "OpenTech";
  }

  // 9. Full Stack Development & Web/App
  if (
    text.includes("fsd") ||
    text.includes("full stack") ||
    text.includes("fullstack") ||
    text.includes("web development") ||
    text.includes("web dev") ||
    text.includes("frontend") ||
    text.includes("backend") ||
    text.includes("react") ||
    text.includes("node") ||
    text.includes("next.js") ||
    text.includes("software engineering") ||
    text.includes("software development")
  ) {
    return "FSD";
  }

  // Default fallback
  return "FSD";
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
  subtitle = "AI-adapted cross-tabulation mapping hackathon sourcing platforms and corporate tech giants against technical domains."
}: HackathonMatrixViewProps) {
  const store = useStore();
  const hackathons = propHackathons || store.hackathons || [];
  const opportunities = propOpportunities || store.opportunities || [];
  const addToast = store.addToast;

  // View Mode: Core 4 Domains (AI, ML, FSD, Cyber) vs All 9 Domains (Expanded AI Suite)
  const [domainScope, setDomainScope] = useState<"CORE" | "EXPANDED">("EXPANDED");

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>("9"); // October by default (.Oct)
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<"ALL" | "PLATFORMS" | "COMPANIES">("ALL");
  const [isSyncing, setIsSyncing] = useState(false);

  // Cell Detail Modal State
  const [activeCellModal, setActiveCellModal] = useState<{
    sourceName: string;
    sourceType: "Platform" | "Company";
    domain: DomainCategory;
    domainLabel: string;
    domainTheme: DomainMeta["theme"];
    hackathons: UnifiedHackathon[];
  } | null>(null);

  // Active domains list based on scope
  const activeDomains = useMemo(() => {
    if (domainScope === "CORE") {
      return ALL_DOMAINS.filter((d) => d.categoryGroup === "core");
    }
    return ALL_DOMAINS;
  }, [domainScope]);

  // Convert and deduplicate items into UnifiedHackathon
  const unifiedList = useMemo<UnifiedHackathon[]>(() => {
    const map = new Map<string, UnifiedHackathon>();

    // 1. Process HackathonInfo
    for (const h of hackathons) {
      const id = h._id || h.id || h.hackathonId || "";
      const textOrg = `${h.organizer || ""} ${h.name || ""} ${h.registrationLink || ""}`.toLowerCase();

      let sourceType: "Platform" | "Company" = "Platform";
      let sourceId = "other";
      let sourceName = h.organizer || "Independent";

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
          monthMatched = monthNum === 9; // October default active season
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
        AI: [],
        ML: [],
        FSD: [],
        Cyber: [],
        Cloud: [],
        Mobile: [],
        Web3: [],
        IoT: [],
        OpenTech: []
      };

      items.forEach((item) => {
        if (cellItems[item.domain]) {
          cellItems[item.domain].push(item);
        } else {
          cellItems.FSD.push(item);
        }
      });

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
        AI: [],
        ML: [],
        FSD: [],
        Cyber: [],
        Cloud: [],
        Mobile: [],
        Web3: [],
        IoT: [],
        OpenTech: []
      };

      items.forEach((item) => {
        if (cellItems[item.domain]) {
          cellItems[item.domain].push(item);
        } else {
          cellItems.FSD.push(item);
        }
      });

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
      Cloud: 0,
      Mobile: 0,
      Web3: 0,
      IoT: 0,
      OpenTech: 0
    };

    filteredList.forEach((item) => {
      if (totals[item.domain] !== undefined) {
        totals[item.domain] += 1;
      } else {
        totals.FSD += 1;
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
      addToast("AI Hackathon matrix synchronized successfully!", "success");
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
    const domainDef = ALL_DOMAINS.find((d) => d.id === domain) || ALL_DOMAINS[0];
    setActiveCellModal({
      sourceName,
      sourceType,
      domain,
      domainLabel: domainDef.fullName,
      domainTheme: domainDef.theme,
      hackathons: items
    });
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* AI Futuristic Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0c1222] via-[#0f172a] to-[#181135] border border-indigo-500/25 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                TrackFlow AI Adaptive Matrix
              </span>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Active Month: {selectedMonth === "9" ? "October (.Oct)" : MONTH_OPTIONS.find((m) => m.id === selectedMonth)?.label}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 border border-purple-400/30 text-purple-300">
                {domainScope === "CORE" ? "4 Core Domains" : "9 Expanded Domains"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{title}</span>
            </h1>

            <p className="text-xs text-slate-300/80 leading-relaxed font-medium">
              {subtitle}
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-indigo-500/20 text-center min-w-[90px] shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Events</span>
              <span className="text-xl font-black text-white">{grandTotal}</span>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-cyan-500/20 text-center min-w-[95px] shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Top Domain</span>
              <span className="text-base font-black text-cyan-300">
                {grandTotal === 0 ? "-" : Object.entries(columnTotals).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0]}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 active:scale-95 text-indigo-200 border border-indigo-400/30 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.15)] disabled:opacity-50"
              title="Refresh and sync live hackathons"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Live"}</span>
            </button>

            {onAddHackathon && (userRole === "coordinator" || userRole === "master_admin") && (
              <button
                onClick={() => onAddHackathon()}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hackathon</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Futuristic Controls Bar: Month Selector, Domain Scope Switcher, Search */}
      <div className="bg-[#0b101e] p-4 sm:p-5 rounded-3xl border border-indigo-500/20 shadow-xl space-y-4">
        {/* Month Selector Bar (Annotated in sketch with .Oct) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-indigo-500/15">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              Active Period Filter:
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              (Matches handwritten .Oct note)
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.45)] ring-1 ring-indigo-400"
                      : isOct
                      ? "bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900/60 font-bold"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <span>{m.short}</span>
                  {isOct && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Rows: Search, Scope Switcher & Row Types */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-indigo-400/70 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search platforms, companies, Google, AI, Devpost..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900/80 border border-indigo-500/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-100 placeholder-slate-400 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Domain Scope Toggle: 4 Core vs 9 Expanded */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Domains:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-900/90 border border-indigo-500/20">
                <button
                  onClick={() => setDomainScope("CORE")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    domainScope === "CORE"
                      ? "bg-indigo-600 text-white shadow-xs font-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Show original 4 domains (AI, ML, FSD, Cyber)"
                >
                  Core 4 (Handwritten)
                </button>
                <button
                  onClick={() => setDomainScope("EXPANDED")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    domainScope === "EXPANDED"
                      ? "bg-indigo-600 text-white shadow-xs font-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Show all 9 AI engineering domains"
                >
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  All 9 Domains
                </button>
              </div>
            </div>

            {/* Show Rows Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Rows:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-900/90 border border-indigo-500/20">
                <button
                  onClick={() => setSourceTypeFilter("ALL")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    sourceTypeFilter === "ALL"
                      ? "bg-indigo-600/90 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSourceTypeFilter("PLATFORMS")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    sourceTypeFilter === "PLATFORMS"
                      ? "bg-indigo-600/90 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Platforms
                </button>
                <button
                  onClick={() => setSourceTypeFilter("COMPANIES")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    sourceTypeFilter === "COMPANIES"
                      ? "bg-indigo-600/90 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Companies
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE (AI Holographic Glass Layout) */}
      <div className="bg-[#0b101e] rounded-3xl border border-indigo-500/20 shadow-2xl overflow-hidden backdrop-blur-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse text-left text-xs min-w-[840px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-950/90 border-b border-indigo-500/20 text-slate-200">
                {/* Sticky Top-Left Corner Header */}
                <th className="p-4 sm:p-5 w-56 sticky left-0 z-20 bg-[#0b101e] border-r border-indigo-500/20 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                        Source
                      </span>
                      <span className="text-xs font-black text-slate-100">
                        Platform / Company
                      </span>
                    </div>
                    <Layers className="w-4 h-4 text-indigo-400/60" />
                  </div>
                </th>

                {/* Domain Column Headers */}
                {activeDomains.map((domain) => {
                  const Icon = domain.icon;
                  return (
                    <th
                      key={domain.id}
                      className="p-3.5 text-center border-r border-indigo-500/10 min-w-[105px]"
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black ${domain.theme.iconBg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-xs font-black tracking-tight ${domain.theme.text}`}>
                          {domain.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[95px]">
                          {domain.fullName.split(" ")[0]}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* Total Column Header */}
                <th className="p-4 text-center font-black text-slate-200 bg-slate-900/40 min-w-[75px]">
                  <span className="text-xs uppercase tracking-wider block text-indigo-300">Total</span>
                  <span className="text-[10px] text-slate-400 font-normal">Active</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {/* SECTION 1: PLATFORMS */}
              {(sourceTypeFilter === "ALL" || sourceTypeFilter === "PLATFORMS") && (
                <>
                  <tr className="bg-indigo-950/30 border-y border-indigo-500/20">
                    <td
                      colSpan={activeDomains.length + 2}
                      className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-indigo-300"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Platform (Where hackathons are hosted & discovered)</span>
                      </div>
                    </td>
                  </tr>

                  {platformRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Sticky Row Label (Left) */}
                      <td className="p-4 font-bold sticky left-0 z-10 bg-[#0b101e] group-hover:bg-[#10172c] border-r border-indigo-500/20 transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2 font-extrabold text-xs text-slate-100">{row.name}</span>
                          <span className="text-[10px] text-indigo-300 font-bold px-1.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30">
                            {row.total}
                          </span>
                        </div>
                      </td>

                      {/* Domain Cells */}
                      {activeDomains.map((domain) => {
                        const items = row.cellItems[domain.id] || [];
                        const count = items.length;

                        return (
                          <td
                            key={domain.id}
                            className="p-3 text-center border-r border-indigo-500/10"
                          >
                            {count > 0 ? (
                              <button
                                onClick={() => handleOpenCell(row.name, "Platform", domain.id, items)}
                                className={`w-11 h-8 rounded-xl font-black text-xs transition-all transform hover:scale-110 active:scale-95 cursor-pointer inline-flex items-center justify-center ${domain.theme.pill}`}
                                title={`Click to view ${count} ${domain.label} hackathons on ${row.name}`}
                              >
                                {count}
                              </button>
                            ) : (
                              <span className="text-slate-600 font-bold text-sm block select-none">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="p-3 text-center font-extrabold text-xs text-indigo-200 bg-slate-900/30">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* SECTION 2: COMPANIES */}
              {(sourceTypeFilter === "ALL" || sourceTypeFilter === "COMPANIES") && (
                <>
                  <tr className="bg-purple-950/30 border-y border-purple-500/20">
                    <td
                      colSpan={activeDomains.length + 2}
                      className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-purple-300"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Comp / Company (Corporate & Tech Giant Sponsoring Hosts)</span>
                      </div>
                    </td>
                  </tr>

                  {companyRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Sticky Row Label (Left) */}
                      <td className="p-4 font-bold sticky left-0 z-10 bg-[#0b101e] group-hover:bg-[#10172c] border-r border-indigo-500/20 transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2 font-extrabold text-xs text-slate-100">{row.name}</span>
                          <span className="text-[10px] text-purple-300 font-bold px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30">
                            {row.total}
                          </span>
                        </div>
                      </td>

                      {/* Domain Cells */}
                      {activeDomains.map((domain) => {
                        const items = row.cellItems[domain.id] || [];
                        const count = items.length;

                        return (
                          <td
                            key={domain.id}
                            className="p-3 text-center border-r border-indigo-500/10"
                          >
                            {count > 0 ? (
                              <button
                                onClick={() => handleOpenCell(row.name, "Company", domain.id, items)}
                                className={`w-11 h-8 rounded-xl font-black text-xs transition-all transform hover:scale-110 active:scale-95 cursor-pointer inline-flex items-center justify-center ${domain.theme.pill}`}
                                title={`Click to view ${count} ${domain.label} hackathons by ${row.name}`}
                              >
                                {count}
                              </button>
                            ) : (
                              <span className="text-slate-600 font-bold text-sm block select-none">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="p-3 text-center font-extrabold text-xs text-purple-200 bg-slate-900/30">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>

            {/* Bottom Summary Row: Column Totals */}
            <tfoot>
              <tr className="bg-slate-950 font-black border-t-2 border-indigo-500/30 text-slate-100">
                <td className="p-4 sticky left-0 z-10 bg-slate-950 border-r border-indigo-500/20 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between">
                    <span className="uppercase text-xs tracking-wider text-indigo-300">Domain Totals</span>
                    <span className="text-[10px] text-slate-400 font-normal">Cross-matrix</span>
                  </div>
                </td>

                {activeDomains.map((domain) => (
                  <td key={domain.id} className="p-3.5 text-center border-r border-indigo-500/15">
                    <div className="flex flex-col items-center">
                      <span className={`text-base font-black ${domain.theme.text}`}>
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

                <td className="p-4 text-center bg-indigo-950/60 text-indigo-200 border-l border-indigo-500/20">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-black text-white">{grandTotal}</span>
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Total</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* CELL DETAIL MODAL / DRAWER */}
      {activeCellModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b101e] rounded-3xl border border-indigo-500/30 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-indigo-500/20 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${activeCellModal.domainTheme.iconBg}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                      {activeCellModal.sourceType}: {activeCellModal.sourceName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${activeCellModal.domainTheme.pill}`}>
                      Domain: {activeCellModal.domain}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    {activeCellModal.hackathons.length} Tracked Hackathon{activeCellModal.hackathons.length !== 1 ? "s" : ""}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveCellModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Hackathons List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {activeCellModal.hackathons.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Info className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">No hackathons currently found in this intersection.</p>
                </div>
              ) : (
                activeCellModal.hackathons.map((hackathon) => (
                  <div
                    key={hackathon.id}
                    className="p-4 bg-slate-900/80 rounded-2xl border border-indigo-500/20 shadow-xs space-y-3 hover:border-indigo-400/50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-500/30">
                          by {hackathon.organizer}
                        </span>
                        <h4 className="font-extrabold text-sm text-white">
                          {hackathon.title}
                        </h4>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                        {hackathon.mode || "Online"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-medium">
                      {hackathon.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      {hackathon.registrationDeadline && (
                        <span className="flex items-center gap-1 font-semibold text-rose-400">
                          <Clock className="w-3 h-3" />
                          Deadline: {new Date(hackathon.registrationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      {hackathon.prizePool && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
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
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/25"
                        >
                          <span>Register on Platform</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">
                Viewing {activeCellModal.sourceName} × {activeCellModal.domain}
              </span>
              <button
                onClick={() => setActiveCellModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-200 transition cursor-pointer"
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
