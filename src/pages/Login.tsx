import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store.ts";
import { Shield, GraduationCap, KeyRound, Cpu, ArrowDown, Sparkles, CheckCircle2, ChevronRight, Layers, Lock, Mail, User, BookOpen } from "lucide-react";

export default function Login() {
  const { login, loading, addToast } = useStore();
  const navigate = useNavigate();

  const [role, setRole] = React.useState<"student" | "coordinator" | "master_admin">("student");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [registerNumber, setRegisterNumber] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
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

  const OFFICIAL_LABS = [
    "Artificial Intelligence and Research Lab",
    "Cyber Security / Cloud Computing Lab",
    "AR/VR Lab",
    "IoT (Internet of Things) Lab",
    "PCB Lab",
    "Robotics Lab",
    "VLSI Lab"
  ];

  const LAB_VISIONS: Record<string, { desc: string; points: string[]; iconTag: string }> = {
    "Artificial Intelligence and Research Lab": {
      desc: "Spatial & Machine Learning Intelligence",
      iconTag: "AI & ML",
      points: [
        "Build practical AI and machine-learning solutions.",
        "Encourage research-driven innovation.",
        "Develop intelligent solutions for real-world problems.",
        "Promote experimentation, research and industry-ready projects."
      ]
    },
    "Cyber Security / Cloud Computing Lab": {
      desc: "Zero-Trust & Scalable Cloud Ecosystems",
      iconTag: "SEC & CLOUD",
      points: [
        "Build secure digital systems.",
        "Develop practical cybersecurity capabilities.",
        "Explore scalable cloud infrastructure.",
        "Create secure and reliable computing solutions."
      ]
    },
    "AR/VR Lab": {
      desc: "Spatial Computing & Immersive Reality",
      iconTag: "SPATIAL VR",
      points: [
        "Develop immersive digital experiences.",
        "Explore augmented and virtual reality.",
        "Build simulation and visualization solutions.",
        "Apply AR/VR to education, industry and real-world applications."
      ]
    },
    "IoT (Internet of Things) Lab": {
      desc: "Edge Computing & Autonomous Sensors",
      iconTag: "IOT EDGE",
      points: [
        "Connect physical systems with intelligent computing.",
        "Develop smart automation solutions.",
        "Explore sensors, devices and edge computing.",
        "Build real-world connected applications."
      ]
    },
    "PCB Lab": {
      desc: "Embedded Hardware & Micro-Electronics",
      iconTag: "HARDWARE",
      points: [
        "Develop practical electronic hardware.",
        "Promote PCB design and prototyping.",
        "Build reliable embedded circuits.",
        "Transform ideas into practical hardware."
      ]
    },
    "Robotics Lab": {
      desc: "Autonomous Robotics & Control Automation",
      iconTag: "ROBOTICS",
      points: [
        "Build intelligent autonomous systems.",
        "Develop robotic automation.",
        "Integrate sensors, control systems and AI.",
        "Solve real-world industrial and social problems."
      ]
    },
    "VLSI Lab": {
      desc: "Advanced Silicon Architecture & Micro-chips",
      iconTag: "VLSI CHIP",
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
      name,
      role,
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

  // Splash Overlay
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#07090e] flex flex-col items-center justify-center text-white px-4 selection:bg-cyan-500 selection:text-black">
        <div className="text-center space-y-4 animate-fade-in">
          {splashStage === "siet" && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-400">Sri Shakthi Institute of Engineering & Technology</span>
              <h1 className="text-5xl md:text-7xl font-black tracking-widest text-white drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">SIET</h1>
            </div>
          )}

          {splashStage === "innovation" && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-emerald-400">Pioneering Excellence</span>
              <h1 className="text-3xl md:text-6xl font-black tracking-wider text-slate-100 drop-shadow-[0_0_35px_rgba(52,211,153,0.3)]">CREATION AND INNOVATION</h1>
            </div>
          )}

          {splashStage === "trackflow" && (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/30 mb-2">
                <Cpu className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
                TRACKFLOW <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">AI</span>
              </h1>
              <p className="text-sm font-semibold text-slate-400">Spatial Student Innovation & Project Tracking Platform</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-cyan-500 selection:text-black font-sans relative overflow-x-hidden">
      
      {/* Vision Pro Ambient Spatial Glow Grids */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent rounded-full filter blur-[120px]" />
        <div className="absolute top-[35%] right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[140px]" />
        <div className="absolute top-[75%] left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full filter blur-[140px]" />
      </div>

      {/* Spatial Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#07090e]/80 backdrop-blur-2xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Cpu className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight leading-none">SIET TrackFlow AI</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wide">Spatial Innovation & Project Tracking Platform</span>
          </div>
        </div>

        <button
          onClick={scrollToAuth}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-full shadow-lg shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105"
        >
          ENTER PORTAL ↓
        </button>
      </header>

      {/* Hero Intro Section - Vision Pro Style */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-xs font-bold uppercase tracking-widest shadow-inner backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SIET • CREATION AND INNOVATION</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none drop-shadow-sm">
          Welcome to the Next Era of <br />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
            Student Project Innovation
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
          TrackFlow AI unifies engineering students, lab coordinators, and mentors across 7 specialized laboratories with automated progress tracking, daily reports, milestone locking, and GitHub sync.
        </p>

        <div className="pt-4 flex justify-center">
          <button
            onClick={scrollToAuth}
            className="flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-xs rounded-full backdrop-blur-xl transition-all duration-300 group shadow-xl"
          >
            <span>Scroll Down to Login Portal</span>
            <ArrowDown className="w-4 h-4 text-cyan-400 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Seven Labs Spatial Vision Showcase */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">OUR SEVEN LABORATORIES</h2>
          <p className="text-xs text-slate-400 font-semibold max-w-xl mx-auto">
            Discover the specialized engineering environments driving undergraduate research, hardware development, and industrial innovation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {OFFICIAL_LABS.map((labName) => {
            const info = LAB_VISIONS[labName];
            return (
              <div
                key={labName}
                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-6 rounded-3xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full uppercase">
                      {info?.iconTag || "LAB"}
                    </span>
                    <Cpu className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                      {labName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{info?.desc}</p>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300 font-normal">
                    {info?.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Apple Vision Pro Style Spatial Login Portal Section */}
      <section id="auth-section" className="relative z-10 max-w-lg mx-auto px-4 py-20">
        
        {/* Spatial Glass Card Container */}
        <div className="bg-white/[0.04] border border-white/15 p-8 md:p-10 rounded-3xl backdrop-blur-3xl shadow-2xl shadow-black/80 space-y-8 relative overflow-hidden">
          
          {/* Subtle Ambient Light Pill Inside Card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full filter blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {mode === "signin" ? "TrackFlow Spatial Login" : "Create Student Account"}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Select your role tab to access your personalized lab workspace
            </p>
          </div>

          {/* 3 Login Tabs (Vision Pro Pill Switcher) */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRole("student");
                if (!email.includes("@")) setEmail("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all duration-200 ${
                role === "student"
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("coordinator");
                setMode("signin");
                if (email === "") setEmail("coordinator@srishakthi.ac.in");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all duration-200 ${
                role === "coordinator"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              Coordinator
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("master_admin");
                setMode("signin");
                setEmail("sathish@srishakthi.ac.in");
                setName("Sathish");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all duration-200 ${
                role === "master_admin"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Master
            </button>
          </div>

          {/* Student Toggle Sign In vs Sign Up */}
          {role === "student" && (
            <div className="flex bg-black/40 p-1 rounded-xl text-xs font-bold border border-white/10">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === "signin" ? "bg-white/15 text-cyan-300 font-extrabold shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === "signup" ? "bg-white/15 text-cyan-300 font-extrabold shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Create Student Account
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {role === "student" ? "Sri Shakthi Student Email *" : "Official Email Address *"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={
                    role === "student" 
                      ? "e.g. rishis24cs@srishakthi.ac.in" 
                      : (role === "coordinator" ? "coordinator@srishakthi.ac.in" : "sathish@srishakthi.ac.in")
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-xs transition"
                />
              </div>
              {role === "student" && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: <code className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">studentname[23|24|25|26]dept@srishakthi.ac.in</code>
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder={role === "master_admin" ? "Sathish" : "Full Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs transition"
              />
            </div>

            {/* Password Fields for Signup */}
            {mode === "signup" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Student Fields */}
            {role === "student" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Register Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 732724CS001"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Section
                    </label>
                    <input
                      type="text"
                      placeholder="A / B / C"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Lab Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Assigned Lab (7 Official Labs) *
                  </label>
                  <select
                    value={lab}
                    onChange={(e) => setLab(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-white/15 text-white text-xs cursor-pointer focus:outline-none focus:border-cyan-500"
                  >
                    {OFFICIAL_LABS.map((l) => (
                      <option key={l} value={l} className="bg-[#0f172a] text-white">
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-white/10 border-white/20 cursor-pointer accent-cyan-500"
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-4 py-3.5 px-6 font-extrabold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 shadow-xl cursor-pointer ${
                role === "master_admin"
                  ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black shadow-cyan-500/25"
              } disabled:opacity-50 transform hover:scale-[1.02]`}
            >
              {loading ? "Authenticating Spatial Credentials..." : (role === "master_admin" ? "Access Master Control Portal" : (mode === "signup" ? "Submit Registration Request" : "Sign In to Portal"))}
            </button>
          </form>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-slate-500 font-medium">
        Sri Shakthi Institute of Engineering & Technology &bull; TrackFlow AI Spatial Experience
      </footer>
    </div>
  );
}
