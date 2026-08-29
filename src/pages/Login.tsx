import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store.ts";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, GraduationCap, KeyRound, Cpu, ArrowDown, Lock, CheckCircle2, ChevronRight, Layers, Sparkles, X, Info, ExternalLink, Eye, EyeOff } from "lucide-react";
import { AppleVisionScroll } from "../components/AppleVisionScroll.tsx";

export default function Login() {
  const { login, loading, addToast } = useStore();
  const navigate = useNavigate();

  const [role, setRole] = React.useState<"student" | "coordinator" | "master_admin">("student");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [registerNumber, setRegisterNumber] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [section, setSection] = React.useState("A");
  const [lab, setLab] = React.useState("Artificial Intelligence and Research Lab");
  const [preferredDomain, setPreferredDomain] = React.useState("Artificial Intelligence");
  const [department, setDepartment] = React.useState("Computer Science");
  const [year, setYear] = React.useState("3");

  const [showSplash, setShowSplash] = React.useState(() => {
    return !sessionStorage.getItem("trackflow_splash_shown");
  });
  const [splashStage, setSplashStage] = React.useState<"siet" | "innovation" | "trackflow">("siet");
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [activeLabModal, setActiveLabModal] = React.useState<string | null>(null);

  const OFFICIAL_LABS = [
    "Artificial Intelligence and Research Lab",
    "Cyber Security / Cloud Computing Lab",
    "AR/VR Lab",
    "IoT (Internet of Things) Lab",
    "PCB Lab",
    "Robotics Lab",
    "VLSI Lab"
  ];

  const LAB_VISIONS: Record<string, { desc: string; points: string[]; iconTag: string; detailedIntro: string }> = {
    "Artificial Intelligence and Research Lab": {
      desc: "Machine Learning & Research Innovation",
      iconTag: "AI & ML",
      detailedIntro: "Dedicated to advancing machine learning architectures, neural network research, and intelligent software engineering.",
      points: [
        "Build practical AI and machine-learning solutions.",
        "Encourage research-driven innovation.",
        "Develop intelligent solutions for real-world problems.",
        "Promote experimentation, research and industry-ready projects."
      ]
    },
    "Cyber Security / Cloud Computing Lab": {
      desc: "Zero-Trust Security & Cloud Scalability",
      iconTag: "SEC & CLOUD",
      detailedIntro: "Focused on cloud infrastructure resilience, penetration testing, cryptographic security, and distributed computing.",
      points: [
        "Build secure digital systems.",
        "Develop practical cybersecurity capabilities.",
        "Explore scalable cloud infrastructure.",
        "Create secure and reliable computing solutions."
      ]
    },
    "AR/VR Lab": {
      desc: "Spatial Computing & Virtual Prototyping",
      iconTag: "SPATIAL VR",
      detailedIntro: "Pioneering augmented reality, virtual spatial rendering, digital twin simulations, and immersive user experiences.",
      points: [
        "Develop immersive digital experiences.",
        "Explore augmented and virtual reality.",
        "Build simulation and visualization solutions.",
        "Apply AR/VR to education, industry and real-world applications."
      ]
    },
    "IoT (Internet of Things) Lab": {
      desc: "Edge Computing & Automation Systems",
      iconTag: "IOT EDGE",
      detailedIntro: "Connecting physical sensors, microcontrollers, and edge AI models to create real-world smart automation platforms.",
      points: [
        "Connect physical systems with intelligent computing.",
        "Develop smart automation solutions.",
        "Explore sensors, devices and edge computing.",
        "Build real-world connected applications."
      ]
    },
    "PCB Lab": {
      desc: "Embedded Hardware & Prototyping",
      iconTag: "HARDWARE",
      detailedIntro: "Specializing in printed circuit board fabrication, surface-mount technology, embedded systems, and hardware design.",
      points: [
        "Develop practical electronic hardware.",
        "Promote PCB design and prototyping.",
        "Build reliable embedded circuits.",
        "Transform ideas into practical hardware."
      ]
    },
    "Robotics Lab": {
      desc: "Autonomous Systems & Controls",
      iconTag: "ROBOTICS",
      detailedIntro: "Engineered for autonomous mobile robots, robotic arm manipulation, ROS2 programming, and industrial control systems.",
      points: [
        "Build intelligent autonomous systems.",
        "Develop robotic automation.",
        "Integrate sensors, control systems and AI.",
        "Solve real-world industrial and social problems."
      ]
    },
    "VLSI Lab": {
      desc: "Silicon Architecture & Microchips",
      iconTag: "VLSI CHIP",
      detailedIntro: "Focused on Very Large Scale Integration, ASIC design, Verilog/VHDL chip simulation, and semiconductor technology.",
      points: [
        "Develop advanced digital hardware systems.",
        "Explore VLSI design and semiconductor technologies.",
        "Build efficient digital architectures.",
        "Encourage modern chip-design innovation."
      ]
    }
  };

  React.useEffect(() => {
    if (!showSplash) return;

    const timer1 = setTimeout(() => setSplashStage("innovation"), 1200);
    const timer2 = setTimeout(() => setSplashStage("trackflow"), 2400);
    const timer3 = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("trackflow_splash_shown", "true");
    }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [showSplash]);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem("trackflow_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateStudentEmail = (emailStr: string) => {
    const lower = emailStr.trim().toLowerCase();
    if (!lower.endsWith("@srishakthi.ac.in")) return false;
    if (lower === "demo.student@srishakthi.ac.in") return true;

    const username = lower.split("@")[0];
    const regex = /^[a-z0-9._]+(23|24|25|26)[a-z]{2,5}$/;
    return regex.test(username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "student" && !validateStudentEmail(email)) {
      addToast("Please use your valid official Sri Shakthi student email address.", "error");
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        addToast("Passwords do not match.", "error");
        return;
      }
      if (password.length < 6) {
        addToast("Password must be at least 6 characters.", "error");
        return;
      }
    }

    if (rememberMe && email) {
      localStorage.setItem("trackflow_remembered_email", email);
    } else {
      localStorage.removeItem("trackflow_remembered_email");
    }

    const success = await login({
      email,
      password,
      name: mode === "signup" ? name : undefined,
      role,
      isSignup: mode === "signup",
      department: role === "master_admin" ? "Master Control" : department,
      registerNumber: role === "student" ? registerNumber : undefined,
      section: role === "student" ? section : undefined,
      lab,
      preferredDomain: role === "student" ? preferredDomain : undefined,
      year: role === "student" ? year : undefined,
    });

    if (success) {
      if (role === "master_admin") {
        navigate("/master-control");
      } else {
        navigate("/");
      }
    }
  };

  const scrollToAuth = () => {
    document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // Cinematic Light Theme Splash Overlay
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f1f5f9] flex flex-col items-center justify-center text-slate-800 px-4 selection:bg-blue-500 selection:text-white overflow-hidden">
        {/* Ambient Blur Blobs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-400/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-400/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <AnimatePresence mode="wait">
          {splashStage === "siet" && (
            <motion.div
              key="siet"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-4 max-w-2xl"
            >
              <span className="inline-block text-xs font-black uppercase tracking-[0.4em] text-blue-600 bg-blue-50 border border-blue-200/60 px-5 py-2 rounded-full shadow-xs">
                Sri Shakthi Institute of Engineering & Technology
              </span>
              <h1 className="text-6xl md:text-8xl font-black tracking-widest text-slate-900 drop-shadow-sm">
                SIET
              </h1>
            </motion.div>
          )}

          {splashStage === "innovation" && (
            <motion.div
              key="innovation"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-4 max-w-3xl"
            >
              <span className="inline-block text-xs font-black uppercase tracking-[0.4em] text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-5 py-2 rounded-full shadow-xs">
                Pioneering Excellence
              </span>
              <h1 className="text-4xl md:text-7xl font-black tracking-wider text-slate-900 drop-shadow-sm">
                CREATION AND INNOVATION
              </h1>
            </motion.div>
          )}

          {splashStage === "trackflow" && (
            <motion.div
              key="trackflow"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-5"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600 text-white font-extrabold shadow-xl shadow-blue-500/30 mb-2">
                <Cpu className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900">
                TRACKFLOW <span className="text-blue-600">AI</span>
              </h1>
              <p className="text-base font-bold text-slate-500 tracking-wide">
                Student Innovation & Project Tracking Platform
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans relative overflow-x-hidden selection:bg-blue-500 selection:text-white">
      
      {/* Ambient Soft Blue Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">SIET TrackFlow AI</h1>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Student Innovation Platform</span>
          </div>
        </div>

        <button
          onClick={scrollToAuth}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 cursor-pointer uppercase tracking-wider flex items-center gap-2"
        >
          <span>Scroll Down to Login</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </header>

      {/* Hero Top Intro Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-20 pb-16 text-center space-y-6">
        <div className="inline-block text-xs font-black uppercase tracking-[0.3em] text-blue-600 bg-blue-50 border border-blue-200/60 px-4 py-1.5 rounded-full shadow-xs">
          SECURE INSTITUTIONAL AUTHENTICATION
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Initialize Your Command Console.
        </h1>

        <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          TrackFlow AI empowers engineering students, lab coordinators, and master administrators across 7 specialized laboratories with automated progress calculation, daily reports, milestone presentation locks, and GitHub synchronization.
        </p>

        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={scrollToAuth}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-blue-500/20 transition duration-300 flex items-center gap-2 cursor-pointer"
          >
            <span>Scroll Down to Login Console</span>
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Apple Vision Pro GSAP Scroll Experience */}
      <AppleVisionScroll
        officialLabs={OFFICIAL_LABS}
        labVisions={LAB_VISIONS}
        onSelectLabModal={setActiveLabModal}
        onScrollToAuth={scrollToAuth}
      />

      {/* Interactive Pop-Up Modal for Lab Details */}
      {activeLabModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200/60 max-w-lg w-full p-8 rounded-3xl shadow-2xl space-y-6 text-left relative animate-scale-up">
            
            <button
              onClick={() => setActiveLabModal(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                {LAB_VISIONS[activeLabModal]?.iconTag} &bull; OFFICIAL VISION
              </span>
              <h2 className="text-2xl font-black text-slate-900">{activeLabModal}</h2>
              <p className="text-xs text-slate-600 font-medium">{LAB_VISIONS[activeLabModal]?.detailedIntro}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">LAB VISION & OBJECTIVES</h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {LAB_VISIONS[activeLabModal]?.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setLab(activeLabModal);
                  setActiveLabModal(null);
                  scrollToAuth();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl cursor-pointer shadow-lg shadow-blue-500/20"
              >
                Select {activeLabModal.split(" ")[0]} Lab & Login ↓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrated Command Console Login Portal STRICTLY AT THE BOTTOM */}
      <section id="auth-section" className="relative z-10 max-w-2xl mx-auto px-8 py-20">
        
        {/* Command Console Box (Matching main page theme) */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-blue-200/60 p-8 md:p-10 rounded-3xl shadow-2xl text-left space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 mb-1 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Command Console Login</h2>
            <p className="text-xs text-slate-500">Log in utilizing your official profile to access student, coordinator, or master studio.</p>
          </div>
          {/* Role Selection Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Select Role *
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRole("student");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setName("");
                  setRegisterNumber("");
                }}
                className={`py-2 rounded-xl transition ${
                  role === "student"
                    ? "bg-blue-600 text-white font-black shadow-md shadow-blue-500/20"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("coordinator");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setName("");
                  setRegisterNumber("");
                }}
                className={`py-2 rounded-xl transition ${
                  role === "coordinator"
                    ? "bg-blue-600 text-white font-black shadow-md shadow-blue-500/20"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Admin / Teacher
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("master_admin");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setName("");
                  setRegisterNumber("");
                  if (mode === "signup") {
                    setMode("signin");
                    addToast("Master Admins cannot self-register. Existing Master Admins add new Masters inside Master Control.", "info");
                  }
                }}
                className={`py-2 rounded-xl transition ${
                  role === "master_admin"
                    ? "bg-purple-600 text-white font-black shadow-md shadow-purple-500/20"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Master
              </button>
            </div>
          </div>

          {/* Login / Register Mode Tabs */}
          {role !== "master_admin" ? (
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setName("");
                  setRegisterNumber("");
                }}
                className={`py-2.5 rounded-xl transition ${
                  mode === "signin"
                    ? "bg-slate-900 text-white font-black shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setName("");
                  setRegisterNumber("");
                }}
                className={`py-2.5 rounded-xl transition ${
                  mode === "signup"
                    ? "bg-slate-900 text-white font-black shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Register
              </button>
            </div>
          ) : (
            <div className="bg-purple-50 border border-purple-200/60 p-3 rounded-2xl text-center">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
                Master Admin Portal — Authorized Login Only
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block">
                {role === "student"
                  ? "College Email (Format: name24cs@srishakthi.ac.in) *"
                  : role === "coordinator"
                  ? "Admin Email Address *"
                  : "Master Email Address *"}
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder={
                  role === "student"
                    ? "e.g. student@srishakthi.ac.in"
                    : role === "coordinator"
                    ? "e.g. coordinator@srishakthi.ac.in"
                    : "e.g. master@srishakthi.ac.in"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            {/* Password Field for Login mode */}
            {mode === "signin" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Registration Fields for Signup mode */}
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder={role === "master_admin" ? "Master Admin Name" : "Full Name"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Student Fields */}
            {role === "student" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block">
                      Register No *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="732724CS001"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block">
                      Assigned Lab *
                    </label>
                    <select
                      value={lab}
                      onChange={(e) => setLab(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[11px] cursor-pointer focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      {OFFICIAL_LABS.map((l) => (
                        <option key={l} value={l} className="bg-white text-slate-900">
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Blue Access Command Console Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? "Authenticating..." : `Access as ${role === "student" ? "Student" : role === "coordinator" ? "Admin" : "Master"}`}</span>
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 bg-white/50 backdrop-blur-md">
        Sri Shakthi Institute of Engineering & Technology &bull; TrackFlow AI Command Console
      </footer>
    </div>
  );
}
