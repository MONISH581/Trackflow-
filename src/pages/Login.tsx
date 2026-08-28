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

  const OFFICIAL_LABS = [
    "Artificial Intelligence and Research Lab",
    "Cyber Security / Cloud Computing Lab",
    "AR/VR Lab",
    "IoT (Internet of Things) Lab",
    "PCB Lab",
    "Robotics Lab"
  ];

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
      addToast("Please use your official Sri Shakthi student email address.", "error");
      return;
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

  const domains = [
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Web Development",
    "Mobile Development",
    "Cybersecurity",
    "Cloud Computing",
    "IoT",
    "Robotics",
    "AR/VR",
  ];

  const departments = [
    "Computer Science",
    "Information Technology",
    "Artificial Intelligence",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical Engineering",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="max-w-lg w-full bg-white p-8 rounded-xl border border-slate-200 shadow-md">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-2">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            TrackFlow <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sri Shakthi Institute of Engineering & Technology
          </p>
        </div>

        {/* 3 Login Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setRole("student");
              if (!email.includes("@")) setEmail("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition ${
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
              if (email === "") setEmail("coordinator@srishakthi.ac.in");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition ${
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
              setEmail("sathish@srishakthi.ac.in");
              setName("Sathish Sir");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition ${
              role === "master_admin"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Master Control
          </button>
        </div>

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
              placeholder={role === "master_admin" ? "Sathish Sir" : "Full Name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition"
            />
          </div>

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
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition"
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
                  Assigned Lab *
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

              {/* Preferred Domain */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Project Domain *
                </label>
                <select
                  value={preferredDomain}
                  onChange={(e) => setPreferredDomain(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white cursor-pointer"
                >
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Academic Year (Batch)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { yr: "1", batch: "'26" },
                    { yr: "2", batch: "'25" },
                    { yr: "3", batch: "'24" },
                    { yr: "4", batch: "'23" },
                  ].map((item) => (
                    <button
                      key={item.yr}
                      type="button"
                      onClick={() => setYear(item.yr)}
                      className={`py-1.5 rounded-md text-xs font-semibold border transition ${
                        year === item.yr
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      Yr {item.yr} ({item.batch})
                    </button>
                  ))}
                </div>
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
            {loading ? "Authenticating..." : (role === "master_admin" ? "Sign In to Master Control" : "Sign In / Register")}
          </button>
        </form>
      </div>
    </div>
  );
}
