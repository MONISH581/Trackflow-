import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
  CheckCircle2,
  ChevronRight,
  Info,
  GraduationCap,
  School,
  Upload,
  Check
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

export type SourceType = "Platform" | "Company" | "University";

export interface UnifiedHackathon {
  id: string;
  title: string;
  organizer: string;
  sourceType: SourceType;
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
  isUnadvertised?: boolean;
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
  { id: "microsoft", name: "Microsoft (MIC)", aliases: ["microsoft", "azure", "imagine cup", "sentinel", "copilot"] },
  { id: "google", name: "Google (GOOG)", aliases: ["google", "deepmind", "solution challenge", "gemini"] },
  { id: "amazon", name: "Amazon (AWS)", aliases: ["amazon", "aws", "bedrock"] },
  { id: "meta", name: "Meta", aliases: ["meta", "llama", "facebook", "pytorch"] },
  { id: "apple", name: "Apple", aliases: ["apple", "swift student", "coreml"] },
  { id: "ibm", name: "IBM", aliases: ["ibm", "call for code", "watsonx", "granite"] },
  { id: "nvidia", name: "NVIDIA", aliases: ["nvidia", "nim", "tensorrt", "rapids"] },
  { id: "intel", name: "Intel", aliases: ["intel", "openvino", "oneapi"] },
  { id: "amd", name: "AMD", aliases: ["amd", "advanced micro devices", "rocm", "instinct", "ryzen", "epyc"] },
  { id: "infosys", name: "Infosys", aliases: ["infosys", "hackwithinfy", "infytq"] },
  { id: "tcs", name: "TCS", aliases: ["tcs", "tata", "codevita", "campuscommune"] }
];

export const STANDARD_UNIVERSITIES = [
  { id: "iit_bombay", name: "IIT Bombay (Techfest)", aliases: ["iit bombay", "techfest", "iitb"] },
  { id: "iit_madras", name: "IIT Madras (Shaastra)", aliases: ["iit madras", "shaastra", "iitm"] },
  { id: "iit_delhi", name: "IIT Delhi (Tryst)", aliases: ["iit delhi", "tryst", "iitd"] },
  { id: "iit_kharagpur", name: "IIT Kharagpur (Kshitij)", aliases: ["iit kharagpur", "kshitij", "iitkgp"] },
  { id: "nit_trichy", name: "NIT Trichy (Pragyan)", aliases: ["nit trichy", "pragyan", "nitt"] },
  { id: "nit_surathkal", name: "NIT Surathkal (Engineer)", aliases: ["nit surathkal", "engineer fest", "nitk"] },
  { id: "bits_pilani", name: "BITS Pilani (APOGEE)", aliases: ["bits pilani", "apogee", "bits"] },
  { id: "iiit_hyderabad", name: "IIIT Hyderabad (Megathon)", aliases: ["iiit hyderabad", "megathon", "iiith"] },
  { id: "anna_univ", name: "Anna University (Kurukshetra)", aliases: ["anna university", "kurukshetra", "ceg"] },
  { id: "vit_vellore", name: "VIT Vellore (Devspace)", aliases: ["vit vellore", "devspace", "vit"] },
  { id: "srm_univ", name: "SRM University (HackSRM)", aliases: ["srm university", "hacksrm", "srmist", "srm"] }
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
  const explicit = (raw.domain || "").toLowerCase().trim();
  const titleText = `${raw.name || raw.title || ""}`.toLowerCase();
  const descText = `${raw.description || ""}`.toLowerCase();
  const tagsList = (raw.tags || []).map((t) => String(t).toLowerCase());
  const tagsStr = tagsList.join(" ");
  const fullText = `${titleText} ${descText} ${tagsStr} ${explicit}`;

  // 1. Direct explicit domain matching
  if (explicit === "artificial intelligence (ai)" || explicit === "ai & llm competitions" || explicit === "google ai & cloud") {
    return "AI";
  }
  if (explicit === "machine learning (ml)" || explicit === "kaggle / machine learning") {
    const isGenAI = /\b(genai|llm|llms|gpt|gemini|claude|llama|copilot|watsonx|agentic)\b/.test(fullText);
    if (!isGenAI) return "ML";
    return "AI";
  }
  if (explicit === "cybersecurity & cloud") return "Cyber";
  if (explicit === "cloud infrastructure & devops") return "Cloud";
  if (explicit === "full stack development (fsd)" || explicit === "enterprise & coding") return "FSD";
  if (explicit === "web3 & blockchain" || explicit === "web3 & open-source") return "Web3";
  if (explicit === "mobile app development") return "Mobile";
  if (explicit === "iot, embedded & robotics") return "IoT";
  if (explicit === "open innovation & govt tech" || explicit === "college & tech competition") return "OpenTech";

  // 2. Specific Domain Indicators
  // Web3 & Blockchain
  if (
    /\b(web3|blockchain|crypto|solana|ethereum|smart contract|nft|defi|decentral|dorahacks|token|polygon)\b/.test(titleText) ||
    tagsList.some((t) => ["blockchain", "web3", "crypto", "solana", "ethereum"].includes(t)) ||
    titleText.includes("decentrahack") ||
    titleText.includes("climatechain")
  ) {
    return "Web3";
  }

  // Cybersecurity
  if (
    /\b(cyber|security|ctf|infosec|sentinel|threat|vulnerability|zero-trust|penetration|reverse engineering|kshitij cyber)\b/.test(titleText) ||
    tagsList.some((t) => ["cybersecurity", "security", "infosec"].includes(t))
  ) {
    return "Cyber";
  }

  // Mobile App Development
  if (
    /\b(mobile|android|ios|swift|flutter|react native|app sprint)\b/.test(titleText) ||
    tagsList.some((t) => ["mobile", "android", "ios"].includes(t))
  ) {
    return "Mobile";
  }

  // IoT & Robotics
  if (
    /\b(iot|robotics|hardware|embedded|arduino|raspberry|sensor|nas)\b/.test(titleText) ||
    tagsList.some((t) => ["iot", "robotics", "hardware"].includes(t))
  ) {
    return "IoT";
  }

  // Cloud & DevOps
  if (
    (/\b(cloud|kubernetes|docker|serverless|devops)\b/.test(titleText) || titleText.includes("azure cloud") || titleText.includes("aws cloud")) &&
    !/\b(ai|genai|llm|ml|machine learning)\b/.test(titleText)
  ) {
    return "Cloud";
  }

  // 3. ARTIFICIAL INTELLIGENCE (AI) - STRICT MUTUAL EXCLUSIVITY
  // Any event focused on AI, GenAI, LLMs, Agents, Prompts, GPT, Gemini, Claude, Llama, Copilot, Neural, Deep Learning, Vision, NLP
  const isAI =
    /\b(ai|genai|llm|llms|gpt|gpt-4|gpt-4o|gemini|claude|llama|openai|copilot|qwen|mistral|watsonx|granite|huggingface|hugging face|agentic|agents|multimodal|rag|diffusion|transformers|neural|deep learning|computer vision|nlp)\b/.test(titleText) ||
    titleText.includes("artificial intelligence") ||
    titleText.includes("generative ai") ||
    titleText.includes("ai agent") ||
    titleText.includes("prompt engineering") ||
    tagsList.some((t) => ["artificial intelligence", "generative ai", "ai", "prompt engineering", "large language models (llms)"].includes(t)) ||
    /\b(genai|llm|llms|gpt|gemini|claude|llama|copilot|watsonx|ai agent|agentic|generative ai|prompt engineering)\b/.test(fullText);

  if (isAI) {
    return "AI";
  }

  // 4. MACHINE LEARNING (ML) - STRICT PURE TABULAR / STATISTICAL ML (NO AI, NO GENAI)
  const isPureML =
    /\b(scikit|xgboost|lightgbm|catboost|tabular|regression|auc-roc|rmse|feature engineering)\b/.test(fullText) ||
    /\b(predictive modeling|predictive analytics|predictive model|gradient boosting|random forest)\b/.test(fullText) ||
    (/\b(machine learning|kaggle)\b/.test(titleText) && !/\b(ai|genai|llm|copilot)\b/.test(titleText)) ||
    tagsList.some((t) => ["kaggle", "tabular data", "predictive modeling"].includes(t)) ||
    titleText.includes("machine learning cup") ||
    titleText.includes("predictive ml") ||
    titleText.includes("tabular data");

  if (isPureML) {
    return "ML";
  }

  // 5. Full Stack Development & Coding Contests
  if (
    /\b(full stack|fullstack|frontend|backend|web dev|codevita|hackwithinfy|react|mern|coding contest|kontest|syntax summit|code)\b/.test(titleText) ||
    tagsList.some((t) => ["web", "frontend", "backend", "full stack"].includes(t))
  ) {
    return "FSD";
  }

  // 6. Open Innovation & Govt Tech
  if (
    /\b(sih|smart india|govt|social good|health|healthcare|medical|space apps|naan mudhalvan|sustainability|climate|clean energy)\b/.test(fullText) ||
    tagsList.some((t) => ["social good", "health", "education", "sustainability"].includes(t))
  ) {
    return "OpenTech";
  }

  return "OpenTech";
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
  subtitle = "AI-adapted cross-tabulation mapping hackathon sourcing platforms, companies, premier universities, and campus events against technical domains."
}: HackathonMatrixViewProps) {
  const store = useStore();
  const hackathons = propHackathons || store.hackathons || [];
  const opportunities = propOpportunities || store.opportunities || [];
  const addToast = store.addToast;

  // View Mode: Core 4 Domains (AI, ML, FSD, Cyber) vs All 9 Domains (Expanded AI Suite)
  const [domainScope, setDomainScope] = useState<"CORE" | "EXPANDED">("EXPANDED");

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL"); // Default to All Months so all 102 events are immediately visible
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<"ALL" | "PLATFORMS" | "COMPANIES" | "UNIVERSITIES">("ALL");
  const [isSyncing, setIsSyncing] = useState(false);

  // Manual Addition Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingHack, setIsSubmittingHack] = useState(false);
  const [newHackForm, setNewHackForm] = useState({
    name: "",
    organizer: "",
    sourceType: "Company" as SourceType,
    domain: "ML" as DomainCategory,
    mode: "Online",
    location: "Global Online",
    registrationLink: "",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    prizePool: "Cash Prize + Certificates",
    description: ""
  });

  // Cell Detail Modal State
  const [activeCellModal, setActiveCellModal] = useState<{
    sourceName: string;
    sourceType: SourceType;
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

    // Helper to resolve source
    const resolveSource = (title: string, organizer: string, link: string, desc: string, tags: string[]) => {
      const combined = `${title} ${organizer} ${tags.join(" ")} ${desc}`.toLowerCase();
      const linkLower = (link || "").toLowerCase();

      // 1. Check Tech Enterprises & Companies FIRST
      const matchedCompany = STANDARD_COMPANIES.find((c) =>
        c.aliases.some((alias) => combined.includes(alias))
      );
      if (matchedCompany) {
        return {
          sourceType: "Company" as SourceType,
          sourceId: matchedCompany.id,
          sourceName: matchedCompany.name
        };
      }

      // 2. Check Premier Universities & Institutes SECOND
      const matchedUni = STANDARD_UNIVERSITIES.find((u) =>
        u.aliases.some((alias) => combined.includes(alias))
      );
      const isUniExplicit =
        /university|institute|college|iit|nit|bits|iiit|vit|srm|anna univ/i.test(organizer) ||
        /shaastra|techfest|pragyan|apogee|tryst|kshitij|megathon|kurukshetra/i.test(title);

      if (matchedUni || isUniExplicit) {
        return {
          sourceType: "University" as SourceType,
          sourceId: matchedUni ? matchedUni.id : "iit_bombay",
          sourceName: matchedUni ? matchedUni.name : organizer || "Premier University"
        };
      }


      // 4. Check Platforms FOURTH (Check Kaggle, Hugging Face, etc. before generic Devpost)
      if (linkLower.includes("kaggle.com") || combined.includes("kaggle")) {
        return { sourceType: "Platform" as SourceType, sourceId: "kaggle", sourceName: "Kaggle" };
      }
      if (linkLower.includes("huggingface.co") || combined.includes("hugging face") || combined.includes("huggingface")) {
        return { sourceType: "Platform" as SourceType, sourceId: "huggingface", sourceName: "Hugging Face" };
      }
      if (linkLower.includes("devfolio.co") || combined.includes("devfolio")) {
        return { sourceType: "Platform" as SourceType, sourceId: "devfolio", sourceName: "Devfolio" };
      }
      if (linkLower.includes("unstop.com") || combined.includes("unstop") || combined.includes("dare2compete")) {
        return { sourceType: "Platform" as SourceType, sourceId: "unstop", sourceName: "Unstop" };
      }
      if (linkLower.includes("hackerearth.com") || combined.includes("hackerearth")) {
        return { sourceType: "Platform" as SourceType, sourceId: "hackerearth", sourceName: "HackerEarth" };
      }
      if (linkLower.includes("hack2skill.com") || combined.includes("hack2skill")) {
        return { sourceType: "Platform" as SourceType, sourceId: "hack2skill", sourceName: "Hack2skill" };
      }
      if (linkLower.includes("dorahacks.io") || combined.includes("dorahacks")) {
        return { sourceType: "Platform" as SourceType, sourceId: "dorahacks", sourceName: "DoraHacks" };
      }
      if (linkLower.includes("sih.gov.in") || combined.includes("smart india") || combined.includes("sih")) {
        return { sourceType: "Platform" as SourceType, sourceId: "sih", sourceName: "Smart India Hackathon (SIH)" };
      }
      if (linkLower.includes("mlh.io") || combined.includes("major league hacking") || combined.includes("mlh")) {
        return { sourceType: "Platform" as SourceType, sourceId: "mlh", sourceName: "Major League Hacking (MLH)" };
      }
      if (linkLower.includes("devpost.com") || combined.includes("devpost")) {
        return { sourceType: "Platform" as SourceType, sourceId: "devpost", sourceName: "Devpost" };
      }

      // Default platform fallback
      return { sourceType: "Platform" as SourceType, sourceId: "devpost", sourceName: organizer || "Devpost" };
    };

    // 1. Process HackathonInfo
    for (const h of hackathons) {
      const id = h._id || h.id || h.hackathonId || "";
      const { sourceType, sourceId, sourceName } = resolveSource(
        h.name || "",
        h.organizer || "",
        h.registrationLink || "",
        h.description || "",
        h.tags || []
      );

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
        status: h.status || "Active",
        isUnadvertised: (h.tags || []).some((t) => /unadvertised|internal/i.test(t))
      });
    }

    // 2. Process OpportunityInfo where category == "Hackathons"
    for (const o of opportunities) {
      if ((o.category || "").toLowerCase() !== "hackathons") continue;
      const id = o._id || o.id || o.title;
      if (map.has(id)) continue;

      const { sourceType, sourceId, sourceName } = resolveSource(
        o.title || "",
        o.organizer || "",
        o.registrationLink || o.website || "",
        o.description || "",
        o.tags || []
      );

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
        bannerImage: o.bannerImage,
        isUnadvertised: (o.tags || []).some((t) => /unadvertised|internal/i.test(t))
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
  const buildRows = (standards: { id: string; name: string }[], type: SourceType) => {
    return standards.map((std) => {
      const items = filteredList.filter(
        (item) => item.sourceType === type && item.sourceId === std.id
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
        ...std,
        sourceType: type,
        total: items.length,
        cellItems
      };
    });
  };

  const platformRows = useMemo(() => buildRows(STANDARD_PLATFORMS, "Platform"), [filteredList]);
  const companyRows = useMemo(() => buildRows(STANDARD_COMPANIES, "Company"), [filteredList]);
  const universityRows = useMemo(() => buildRows(STANDARD_UNIVERSITIES, "University"), [filteredList]);

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
    sourceType: SourceType,
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

  // Submit manual hackathon addition
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHackForm.name.trim() || !newHackForm.organizer.trim()) {
      addToast("Please provide Hackathon Name and Organizer", "error");
      return;
    }

    setIsSubmittingHack(true);
    try {
      const now = new Date();
      const sDate = newHackForm.startDate ? new Date(newHackForm.startDate) : now;
      const eDate = newHackForm.endDate ? new Date(newHackForm.endDate) : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const dDate = newHackForm.registrationDeadline ? new Date(newHackForm.registrationDeadline) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const domainFullName = ALL_DOMAINS.find((d) => d.id === newHackForm.domain)?.fullName || newHackForm.domain;

      const success = await store.createHackathon({
        name: newHackForm.name.trim(),
        organizer: newHackForm.organizer.trim(),
        domain: domainFullName,
        description: newHackForm.description.trim() || `${newHackForm.name} organized by ${newHackForm.organizer}`,
        registrationLink: newHackForm.registrationLink.trim() || "https://trackflow.internal/campus-hackathon",
        mode: newHackForm.mode,
        location: newHackForm.location,
        startDate: sDate.toISOString(),
        endDate: eDate.toISOString(),
        registrationDeadline: dDate.toISOString(),
        status: "Active",
        tags: [
          newHackForm.organizer.trim(),
          newHackForm.sourceType,
          newHackForm.domain,
          "Manual Addition"
        ]
      });

      if (success) {
        addToast(`Successfully published "${newHackForm.name}"! Synced to Opportunities Hub & Proofs.`, "success");
        setIsAddModalOpen(false);
        setNewHackForm({
          name: "",
          organizer: "",
          sourceType: "Company",
          domain: "ML",
          mode: "Online",
          location: "Global Online",
          registrationLink: "",
          registrationDeadline: "",
          startDate: "",
          endDate: "",
          prizePool: "Cash Prize + Certificates",
          description: ""
        });
        await store.fetchHackathons();
        await store.fetchOpportunities();
      } else {
        addToast("Failed to create hackathon.", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to add hackathon", "error");
    } finally {
      setIsSubmittingHack(false);
    }
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
                TrackFlow 3-Source Unified Matrix
              </span>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Active Filter: {selectedMonth === "ALL" ? "All Active Hackathons" : MONTH_OPTIONS.find((m) => m.id === selectedMonth)?.label}
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

            <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-indigo-500/20 text-center min-w-[85px] shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">AI Events</span>
              <span className="text-base font-black text-indigo-300">
                {columnTotals.AI || 0}
              </span>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-cyan-500/20 text-center min-w-[85px] shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">ML Events</span>
              <span className="text-base font-black text-cyan-300">
                {columnTotals.ML || 0}
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

            {/* + Add Hackathon Button (Opens manual & unadvertised hackathon addition modal) */}
            <button
              onClick={() => {
                if (onAddHackathon) {
                  onAddHackathon();
                } else {
                  setIsAddModalOpen(true);
                }
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              title="Add a new hackathon (Enterprise Company, Premier University, or Platform)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Hackathon (Company / Uni / Platform)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Futuristic Controls Bar: Month Selector, Domain Scope Switcher, Search */}
      <div className="bg-[#0b101e] p-4 sm:p-5 rounded-3xl border border-indigo-500/20 shadow-xl space-y-4">
        {/* Month Selector Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-indigo-500/15">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              Active Period Filter:
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
              placeholder="Search Devpost, Kaggle, IIT, Dept of CSE, ML, AI..."
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
                  title="Show original 4 core domains (AI, ML, FSD, Cyber)"
                >
                  Core 4 (AI, ML, FSD, Cyber)
                </button>
                <button
                  onClick={() => setDomainScope("EXPANDED")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    domainScope === "EXPANDED"
                      ? "bg-indigo-600 text-white shadow-xs font-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Show all 9 engineering domains"
                >
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  All 9 Domains
                </button>
              </div>
            </div>

            {/* Show Rows Filter: ALL 3 SOURCES */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Source:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-900/90 border border-indigo-500/20 flex-wrap">
                <button
                  onClick={() => setSourceTypeFilter("ALL")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    sourceTypeFilter === "ALL"
                      ? "bg-indigo-600/90 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All (3 Sources)
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
                <button
                  onClick={() => setSourceTypeFilter("UNIVERSITIES")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    sourceTypeFilter === "UNIVERSITIES"
                      ? "bg-indigo-600/90 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Universities (IIT/NIT)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE (AI Holographic Glass Layout with 3 Authoritative Sections) */}
      <div className="bg-[#0b101e] rounded-3xl border border-indigo-500/20 shadow-2xl overflow-hidden backdrop-blur-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse text-left text-xs min-w-[840px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-950/90 border-b border-indigo-500/20 text-slate-200">
                {/* Sticky Top-Left Corner Header */}
                <th className="p-4 sm:p-5 w-60 sticky left-0 z-20 bg-[#0b101e] border-r border-indigo-500/20 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                        Source
                      </span>
                      <span className="text-xs font-black text-slate-100">
                        Platform / Company / Uni
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
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Platform (Where hackathons are hosted & discovered)</span>
                      </div>
                    </td>
                  </tr>

                  {platformRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="p-4 font-bold sticky left-0 z-10 bg-[#0b101e] group-hover:bg-[#10172c] border-r border-indigo-500/20 transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2 font-extrabold text-xs text-slate-100">{row.name}</span>
                          <span className="text-[10px] text-indigo-300 font-bold px-1.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30">
                            {row.total}
                          </span>
                        </div>
                      </td>

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
                              <span className="text-slate-600 font-bold text-sm block select-none">-</span>
                            )}
                          </td>
                        );
                      })}

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
                        <span>Company & Tech Giants (Corporate & Enterprise Organizers)</span>
                      </div>
                    </td>
                  </tr>

                  {companyRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="p-4 font-bold sticky left-0 z-10 bg-[#0b101e] group-hover:bg-[#10172c] border-r border-indigo-500/20 transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2 font-extrabold text-xs text-slate-100">{row.name}</span>
                          <span className="text-[10px] text-purple-300 font-bold px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30">
                            {row.total}
                          </span>
                        </div>
                      </td>

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
                              <span className="text-slate-600 font-bold text-sm block select-none">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-3 text-center font-extrabold text-xs text-purple-200 bg-slate-900/30">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* SECTION 3: PREMIER UNIVERSITIES & INSTITUTES */}
              {(sourceTypeFilter === "ALL" || sourceTypeFilter === "UNIVERSITIES") && (
                <>
                  <tr className="bg-emerald-950/30 border-y border-emerald-500/20">
                    <td
                      colSpan={activeDomains.length + 2}
                      className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-300"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Premier Universities & Institutes (IITs, NITs, BITS, IIITs & Universities)</span>
                      </div>
                    </td>
                  </tr>

                  {universityRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="p-4 font-bold sticky left-0 z-10 bg-[#0b101e] group-hover:bg-[#10172c] border-r border-indigo-500/20 transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2 font-extrabold text-xs text-slate-100">{row.name}</span>
                          <span className="text-[10px] text-emerald-300 font-bold px-1.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30">
                            {row.total}
                          </span>
                        </div>
                      </td>

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
                                onClick={() => handleOpenCell(row.name, "University", domain.id, items)}
                                className={`w-11 h-8 rounded-xl font-black text-xs transition-all transform hover:scale-110 active:scale-95 cursor-pointer inline-flex items-center justify-center ${domain.theme.pill}`}
                                title={`Click to view ${count} ${domain.label} hackathons at ${row.name}`}
                              >
                                {count}
                              </button>
                            ) : (
                              <span className="text-slate-600 font-bold text-sm block select-none">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-3 text-center font-extrabold text-xs text-emerald-200 bg-slate-900/30">
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
        <div className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-500/30">
                            by {hackathon.organizer}
                          </span>
                        </div>
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

                      <div className="flex items-center gap-2">
                        {/* Direct link to Hackathon Proof submission page - STUDENT ONLY */}
                        {store.currentUser?.role === 'student' ? (
                          <Link
                            to={`/hackathons?hackathonId=${hackathon.id}&name=${encodeURIComponent(hackathon.title)}`}
                            onClick={() => setActiveCellModal(null)}
                            className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                            title="Upload and submit registration screenshot proof for this hackathon"
                          >
                            <Upload className="w-3 h-3" />
                            <span>📸 Upload Proof</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/hackathons?search=${encodeURIComponent(hackathon.title)}`}
                            onClick={() => setActiveCellModal(null)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                            title="View this hackathon in Opportunities Hub"
                          >
                            <span>View in Hub</span>
                          </Link>
                        )}

                        {hackathon.registrationLink && (
                          <a
                            href={hackathon.registrationLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/25"
                          >
                            <span>Register / Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
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

      {/* MODAL: MANUAL HACKATHON ADDITION (COMPANY / UNIVERSITY / PLATFORM) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#0b101e] rounded-3xl border border-indigo-500/30 shadow-2xl w-full max-w-xl p-6 sm:p-7 space-y-5 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Add Hackathon (Company / University / Platform)</h3>
                  <p className="text-[11px] text-slate-400">Add an authoritative hackathon from enterprise companies, premier universities & global platforms</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Hackathon Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dept of CSE Intra-College FSD Sprint"
                    value={newHackForm.name}
                    onChange={(e) => setNewHackForm({ ...newHackForm, name: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Organizer / Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dept of CSE / IIT Madras"
                    value={newHackForm.organizer}
                    onChange={(e) => setNewHackForm({ ...newHackForm, organizer: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Source Type</label>
                  <select
                    value={newHackForm.sourceType}
                    onChange={(e) => setNewHackForm({ ...newHackForm, sourceType: e.target.value as SourceType })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  >
                    <option value="Company">Enterprise Company (Google, Microsoft, IBM, Infosys, TCS, etc.)</option>
                    <option value="University">Premier University (IIT, NIT, BITS, IIIT, etc.)</option>
                    <option value="Platform">Hosting Platform (Kaggle, Devpost, Unstop, etc.)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Technical Domain *</label>
                  <select
                    value={newHackForm.domain}
                    onChange={(e) => setNewHackForm({ ...newHackForm, domain: e.target.value as DomainCategory })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white font-bold"
                  >
                    <option value="ML">ML - Machine Learning & Data Science (Tabular/Predictive)</option>
                    <option value="AI">AI - Artificial Intelligence (GenAI & LLMs)</option>
                    <option value="FSD">FSD - Full Stack Development</option>
                    <option value="Cyber">Cyber - Cybersecurity & CTF</option>
                    <option value="Cloud">Cloud - Cloud & DevOps</option>
                    <option value="Mobile">Mobile - Android & iOS</option>
                    <option value="Web3">Web3 - Blockchain</option>
                    <option value="IoT">IoT - Robotics & Hardware</option>
                    <option value="OpenTech">OpenTech - Open Innovation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Mode</label>
                  <select
                    value={newHackForm.mode}
                    onChange={(e) => setNewHackForm({ ...newHackForm, mode: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  >
                    <option value="Offline">Offline (On-Campus)</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Location / Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Campus Lab 3 / Auditorium"
                    value={newHackForm.location}
                    onChange={(e) => setNewHackForm({ ...newHackForm, location: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Registration Link / Internal Form</label>
                  <input
                    type="text"
                    placeholder="Google Form / Portal link (optional)"
                    value={newHackForm.registrationLink}
                    onChange={(e) => setNewHackForm({ ...newHackForm, registrationLink: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Prize Pool / Trophy</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹25,000 + Merit Trophy"
                    value={newHackForm.prizePool}
                    onChange={(e) => setNewHackForm({ ...newHackForm, prizePool: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Registration Deadline</label>
                  <input
                    type="date"
                    value={newHackForm.registrationDeadline}
                    onChange={(e) => setNewHackForm({ ...newHackForm, registrationDeadline: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Event Date</label>
                  <input
                    type="date"
                    value={newHackForm.startDate}
                    onChange={(e) => setNewHackForm({ ...newHackForm, startDate: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Description / Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Official hackathon guidelines, problem statements, and judging parameters..."
                  value={newHackForm.description}
                  onChange={(e) => setNewHackForm({ ...newHackForm, description: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-900 border border-indigo-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-indigo-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHack}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingHack ? "Publishing..." : "Publish & Sync Everywhere"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
