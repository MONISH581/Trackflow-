import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store.ts";
import { Shield, GraduationCap, KeyRound, Cpu, ArrowDown, Lock, CheckCircle2, ChevronRight, Layers, Sparkles } from "lucide-react";

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
      desc: "Machine Learning & Research Innovation",
      iconTag: "AI & ML",
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
      <div className="fixed inset-0 z-[9999] bg-[#050811] flex flex-col items-center justify-center text-white px-4 selection:bg-[#00e5ff] selection:text-black">
        <div className="text-center space-y-4 animate-fade-in">
          {splashStage === "siet" && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-[#00e5ff]">Sri Shakthi Institute of Engineering & Technology</span>
              <h1 className="text-5xl md:text-7xl font-black tracking-widest text-white">SIET</h1>
            </div>
          )}

          {splashStage === "innovation" && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-emerald-400">Pioneering Excellence</span>
              <h1 className="text-3xl md:text-6xl font-black tracking-wider text-slate-100">CREATION AND INNOVATION</h1>
            </div>
          )}

          {splashStage === "trackflow" && (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00e5ff] text-black font-extrabold shadow-lg shadow-[#00e5ff]/30 mb-2">
                <Cpu className="w-9 h-9" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
                TRACKFLOW <span className="text-[#00e5ff]">AI</span>
              </h1>
              <p className="text-sm font-semibold text-slate-400">Student Innovation & Project Tracking Platform</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans relative overflow-x-hidden selection:bg-[#00e5ff] selection:text-black">
      
      {/* Background Ambient Stars/Dots */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-[#00e5ff]/40 rounded-full" />
        <div className="absolute top-40 right-1/3 w-1.5 h-1.5 bg-blue-500/30 rounded-full" />
        <div className="absolute top-90 left-10 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute top-1/2 right-10 w-1.5 h-1.5 bg-[#00e5ff]/30 rounded-full" />
        <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-purple-500/20 rounded-full" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#050811]/90 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00e5ff] text-black font-extrabold flex items-center justify-center shadow-lg shadow-[#00e5ff]/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">SIET TrackFlow AI</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Student Innovation Platform</span>
          </div>
        </div>

        <button
          onClick={scrollToAuth}
          className="px-6 py-2.5 bg-[#00e5ff] hover:bg-[#00c8e0] text-black font-extrabold text-xs rounded-xl shadow-lg shadow-[#00e5ff]/20 transition-all duration-300 transform hover:scale-105 cursor-pointer uppercase tracking-wider"
        >
          Initialize Console ↓
        </button>
      </header>

      {/* Hero 2-Column Section Matching Placify Screenshot */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side Hero Content */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-block text-xs font-black uppercase tracking-[0.25em] text-[#00e5ff]">
            SECURE AUTHENTICATION
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
            Initialize Your <br />
            Command Console.
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-xl leading-relaxed font-normal">
            Log in utilizing the official student profile or coordinator access to manage projects, verify daily reports, track GitHub development, and supervise seven laboratories inside the admin studio.
          </p>

          <div className="pt-4 flex items-center gap-4">
            <button
              onClick={scrollToAuth}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md transition flex items-center gap-2"
            >
              <span>Scroll to Login Portal</span>
              <ArrowDown className="w-4 h-4 text-[#00e5ff]" />
            </button>
          </div>
        </div>

        {/* Right Side: Command Console Login Card (Matching Screenshot exactly) */}
        <div className="lg:col-span-5 text-left">
          <div className="bg-[#0b101d] border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
            
            {/* Top Login / Register Pill Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-[#121829] p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`py-2.5 rounded-xl transition ${
                  mode === "signin"
                    ? "bg-[#00e5ff] text-black font-black shadow-md shadow-[#00e5ff]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("student");
                  setMode("signup");
                }}
                className={`py-2.5 rounded-xl transition ${
                  mode === "signup"
                    ? "bg-[#00e5ff] text-black font-black shadow-md shadow-[#00e5ff]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email / Username Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  {role === "student" ? "College Email (Format: name24cs@srishakthi.ac.in) *" : "Official Email Address *"}
                </label>
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
                  className="w-full px-4 py-3 rounded-xl bg-[#131929] border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#00e5ff] transition"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={role === "master_admin" ? "Sathish" : "Full Name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#131929] border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#00e5ff] transition"
                />
              </div>

              {/* Security Pin / Password fields for signup */}
              {mode === "signup" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#131929] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-[#00e5ff]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#131929] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-[#00e5ff]"
                    />
                  </div>
                </div>
              )}

              {/* Student Fields */}
              {role === "student" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                        Register No *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="732724CS001"
                        value={registerNumber}
                        onChange={(e) => setRegisterNumber(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#131929] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-[#00e5ff]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                        Assigned Lab *
                      </label>
                      <select
                        value={lab}
                        onChange={(e) => setLab(e.target.value)}
                        className="w-full px-3 py-3 rounded-xl bg-[#131929] border border-slate-700/80 text-white text-[11px] cursor-pointer focus:outline-none focus:border-[#00e5ff]"
                      >
                        {OFFICIAL_LABS.map((l) => (
                          <option key={l} value={l} className="bg-[#131929] text-white">
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Cyan Access Command Console Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#00e5ff] hover:bg-[#00c8e0] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00e5ff]/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? "Authenticating..." : "Access Command Console"}</span>
              </button>

              {/* Preset Quick Role Selectors */}
              <div className="pt-2 grid grid-cols-3 gap-2 border-t border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setRole("student");
                    setMode("signin");
                    if (!email.includes("@")) setEmail("rishis24cs@srishakthi.ac.in");
                  }}
                  className={`py-2 px-2 rounded-xl border transition ${
                    role === "student"
                      ? "bg-slate-800 text-[#00e5ff] border-[#00e5ff]/40 font-bold"
                      : "bg-[#131929] text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Student Demo
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole("coordinator");
                    setMode("signin");
                    setEmail("coordinator@srishakthi.ac.in");
                  }}
                  className={`py-2 px-2 rounded-xl border transition ${
                    role === "coordinator"
                      ? "bg-slate-800 text-[#00e5ff] border-[#00e5ff]/40 font-bold"
                      : "bg-[#131929] text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Admin Coordinator
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole("master_admin");
                    setMode("signin");
                    setEmail("sathish@srishakthi.ac.in");
                    setName("Sathish");
                  }}
                  className={`py-2 px-2 rounded-xl border transition ${
                    role === "master_admin"
                      ? "bg-slate-800 text-purple-400 border-purple-500/40 font-bold"
                      : "bg-[#131929] text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Master Sathish
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Sequential Lab Pop Section (Left one first, Right one next) */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#00e5ff]">INSTITUTIONAL INNOVATION</span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">OUR SEVEN LABORATORIES</h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Discover our seven state-of-the-art laboratories operating sequentially across research domains.
          </p>
        </div>

        {/* Staggered Alternating Sequential Pop Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {OFFICIAL_LABS.map((labName, index) => {
            const info = LAB_VISIONS[labName];
            const isLeft = index % 2 === 0;
            return (
              <div
                key={labName}
                className={`bg-[#0b101d] border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-[#00e5ff]/40 hover:shadow-2xl hover:shadow-[#00e5ff]/10 transition-all duration-500 transform hover:-translate-y-1 ${
                  isLeft ? "lg:mr-4 animate-fade-in" : "lg:ml-4 animate-fade-in"
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/20 px-3 py-1 rounded-full">
                    Lab {index + 1} &bull; {info?.iconTag}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {isLeft ? "← Left Lab Unit" : "Right Lab Unit →"}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white">{labName}</h3>
                <p className="text-xs text-slate-400 font-medium">{info?.desc}</p>

                <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                  {info?.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00e5ff] flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Integrated Bottom Scroll-Down Login Portal */}
      <section id="auth-section" className="relative z-10 max-w-4xl mx-auto px-8 py-20">
        <div className="bg-[#0b101d] border border-slate-800 p-10 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff]">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">TrackFlow AI Login Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Ready to manage your projects, log daily reports, and access lab resources?</p>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-8 py-3.5 bg-[#00e5ff] hover:bg-[#00c8e0] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#00e5ff]/20 transition cursor-pointer"
            >
              Access Console Top Login ↑
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        Sri Shakthi Institute of Engineering & Technology &bull; TrackFlow AI Command Console
      </footer>
    </div>
  );
}
