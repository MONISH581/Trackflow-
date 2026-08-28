import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store.ts";
import { Shield, GraduationCap, KeyRound, Cpu } from "lucide-react";

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

  const LAB_VISIONS: Record<string, string[]> = {
    "Artificial Intelligence and Research Lab": [
      "Build practical AI and machine-learning solutions.",
      "Encourage research-driven innovation.",
      "Develop intelligent solutions for real-world problems.",
      "Promote experimentation, research and industry-ready projects."
    ],
    "Cyber Security / Cloud Computing Lab": [
      "Build secure digital systems.",
      "Develop practical cybersecurity capabilities.",
      "Explore scalable cloud infrastructure.",
      "Create secure and reliable computing solutions."
    ],
    "AR/VR Lab": [
      "Develop immersive digital experiences.",
      "Explore augmented and virtual reality.",
      "Build simulation and visualization solutions.",
      "Apply AR/VR to education, industry and real-world applications."
    ],
    "IoT (Internet of Things) Lab": [
      "Connect physical systems with intelligent computing.",
      "Develop smart automation solutions.",
      "Explore sensors, devices and edge computing.",
      "Build real-world connected applications."
    ],
    "PCB Lab": [
      "Develop practical electronic hardware.",
      "Promote PCB design and prototyping.",
      "Build reliable embedded circuits.",
      "Transform ideas into practical hardware."
    ],
    "Robotics Lab": [
      "Build intelligent autonomous systems.",
      "Develop robotic automation.",
      "Integrate sensors, control systems and AI.",
      "Solve real-world industrial and social problems."
    ],
    "VLSI Lab": [
      "Develop advanced digital hardware systems.",
      "Explore VLSI design and semiconductor technologies.",
      "Build efficient digital architectures.",
      "Encourage modern chip-design innovation."
    ]
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
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center text-white px-4">
        <div className="text-center space-y-4 animate-fade-in">
          {splashStage === "siet" && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">Sri Shakthi Institute of Engineering & Technology</span>
              <h1 className="text-4xl md:text-6xl font-black tracking-widest text-white">SIET</h1>
            </div>
          )}

          {splashStage === "innovation" && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Pioneering Excellence</span>
              <h1 className="text-3xl md:text-5xl font-black tracking-wider text-slate-100">CREATION AND INNOVATION</h1>
            </div>
          )}

          {splashStage === "trackflow" && (
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl mb-2">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
                TRACKFLOW <span className="text-blue-500">AI</span>
              </h1>
              <p className="text-sm font-semibold text-slate-400">Student Innovation & Project Tracking Platform</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Landing Page Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">SIET TrackFlow AI</h1>
            <span className="text-[10px] text-slate-500 font-semibold">Student Innovation & Project Tracking Platform</span>
          </div>
        </div>

        <button
          onClick={scrollToAuth}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          LOGIN NOW
        </button>
      </header>

      {/* Hero Intro Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 text-center space-y-4">
        <span className="inline-block px-3.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
          SIET • CREATION AND INNOVATION
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          TrackFlow <span className="text-blue-600">AI</span>
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto font-medium">
          Empowering engineering students and lab coordinators across 7 specialized laboratories with automated project tracking, daily reporting, milestone presentations, and GitHub integration.
        </p>
      </section>

      {/* Seven Labs Vision Section */}
      <section className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">OUR LABS VISION</h2>
          <p className="text-xs text-slate-500 font-semibold">Explore the seven specialized innovation laboratories powering student research and project execution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
          {OFFICIAL_LABS.map((labName) => (
            <div key={labName} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 text-blue-600">{labName}</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {LAB_VISIONS[labName]?.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Authentication Form Section */}
      <section id="auth-section" className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              {mode === "signin" ? "Account Sign In" : "Student Registration"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Select your role to access the TrackFlow AI platform
            </p>
          </div>

          {/* 3 Login Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setRole("student");
                if (!email.includes("@")) setEmail("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${
                role === "student"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("coordinator");
                setMode("signin");
                if (email === "") setEmail("coordinator@srishakthi.ac.in");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${
                role === "coordinator"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
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
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${
                role === "master_admin"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Master Control
            </button>
          </div>

          {/* Student Toggle Sign In vs Sign Up */}
          {role === "student" && (
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-1.5 rounded-md transition ${
                  mode === "signin" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-1.5 rounded-md transition ${
                  mode === "signup" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                }`}
              >
                Create Student Account
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email input */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {role === "student" ? "Sri Shakthi Student Email *" : "Official Email Address *"}
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
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm transition"
              />
              {role === "student" && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">studentname[23|24|25|26]dept@srishakthi.ac.in</code>
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder={role === "master_admin" ? "Sathish" : "Full Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition"
              />
            </div>

            {/* Password Fields for Signup */}
            {mode === "signup" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Student Fields */}
            {role === "student" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Register Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 732724CS001"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Section
                    </label>
                    <input
                      type="text"
                      placeholder="A / B / C"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                {/* Lab Selection */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Assigned Lab (7 Official Labs) *
                  </label>
                  <select
                    value={lab}
                    onChange={(e) => setLab(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white cursor-pointer"
                  >
                    {OFFICIAL_LABS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1 text-left">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 cursor-pointer"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-3 py-2.5 px-4 font-bold rounded-lg text-sm text-white transition-all cursor-pointer ${
                role === "master_admin" ? "bg-slate-900 hover:bg-black" : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50`}
            >
              {loading ? "Processing..." : (role === "master_admin" ? "Sign In to Master Control" : (mode === "signup" ? "Create Student Account" : "Sign In"))}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
