import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store.ts";
import { Sparkles, Shield, User, GraduationCap } from "lucide-react";

export default function Login() {
  const { login, loading } = useStore();
  const navigate = useNavigate();

  const [role, setRole] = React.useState<"student" | "coordinator">("student");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [registerNumber, setRegisterNumber] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [section, setSection] = React.useState("A");
  const [lab, setLab] = React.useState("AI Lab");
  const [preferredDomain, setPreferredDomain] = React.useState("Artificial Intelligence");
  const [department, setDepartment] = React.useState("Computer Science");
  const [year, setYear] = React.useState("3");
  const [verificationCode, setVerificationCode] = React.useState("");

  React.useEffect(() => {
    const savedEmail = localStorage.getItem("trackflow_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rememberMe && email) {
      localStorage.setItem("trackflow_remembered_email", email);
    } else {
      localStorage.removeItem("trackflow_remembered_email");
    }
    const success = await login({
      email,
      name,
      role,
      department,
      registerNumber: role === "student" ? registerNumber : undefined,
      section: role === "student" ? section : undefined,
      lab,
      preferredDomain: role === "student" ? preferredDomain : undefined,
      year: role === "student" ? year : undefined,
      verificationCode: role === "coordinator" ? verificationCode : undefined,
    });
    if (success) {
      navigate("/");
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
    "Blockchain",
    "Other",
  ];

  const departments = [
    "Computer Science",
    "Information Technology",
    "Artificial Intelligence",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 py-8">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative z-10">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 mb-2">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            TrackFlow <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-xs text-slate-500">
            Lab Project Management & Progress Platform
          </p>
        </div>

        {/* Role Select Toggles */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 border border-slate-200/70 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
              role === "student"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Sign In
          </button>
          <button
            type="button"
            onClick={() => setRole("coordinator")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
              role === "coordinator"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Shield className="w-4 h-4" />
            Coordinator
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              College Email Address *
            </label>
            <input
              type="email"
              required
              placeholder={
                role === "student" ? "student@srishakthi.ac.in" : "coordinator@trackflow.local"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition"
            />
            {role === "student" && (
              <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                * Must end with @srishakthi.ac.in
              </p>
            )}
          </div>

          {/* Name & Register Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Student Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition"
              />
            </div>

            {role === "student" && (
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Register Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 732721CS001"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition"
                />
              </div>
            )}
          </div>

          {role === "student" && (
            <>
              {/* Section & Preferred Domain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="A / B / C"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Preferred Project Domain *
                  </label>
                  <select
                    value={preferredDomain}
                    onChange={(e) => setPreferredDomain(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white cursor-pointer"
                  >
                    {domains.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Department Selection */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm cursor-pointer bg-white"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Code Selection (Coordinator only) */}
          {role === "coordinator" && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Coordinator Verification Code
              </label>
              <input
                type="password"
                placeholder="Enter coordinator code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm transition"
              />
            </div>
          )}

          {/* Year selector (Student only) */}
          {role === "student" && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Academic Year
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["1", "2", "3", "4"].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`py-2 rounded-lg text-sm font-semibold border transition ${
                      year === y
                        ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    Yr {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1 text-left">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? "Authenticating..." : "Register / Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
