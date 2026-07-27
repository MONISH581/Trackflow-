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
  const [department, setDepartment] = React.useState("Computer Science");
  const [year, setYear] = React.useState("1");
  const [verificationCode, setVerificationCode] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({
      email,
      name,
      role,
      department,
      year: role === "student" ? year : undefined,
      verificationCode: role === "coordinator" ? verificationCode : undefined,
    });
    if (success) {
      navigate("/");
    }
  };



  const departments = [
    "Computer Science",
    "Information Technology",
    "Artificial Intelligence",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden px-4 perspective-1000">
      {/* 3D Hyper Ambient Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-blue-500/25 via-indigo-500/20 to-cyan-400/20 rounded-full filter blur-[100px] floating-3d-orb pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-indigo-600/25 via-blue-400/20 to-teal-400/20 rounded-full filter blur-[100px] floating-3d-orb-delay pointer-events-none" />

      <div className="max-w-md w-full glass-card card-hyper-3d shine-effect p-8 border border-blue-300/40 shadow-2xl relative z-10">
        <div className="text-center space-y-2 mb-8 pop-out-3d">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-500 shadow-2xl shadow-blue-500/40 mb-3 hyper-glow transform hover:rotate-12 hover:scale-110 transition-all duration-300 pop-out-3d-deep">
            <Sparkles className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Welcome to TrackFlow <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-sm text-slate-500">
            Intelligent student project monitoring platform
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
            Student Login
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



        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder={
                role === "student" ? "rollno@srishakthi.ac.in" : "email@example.com"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
            />
            {role === "student" && (
              <p className="text-[10px] text-blue-600 font-medium mt-1">
                * Must be your official college email (@srishakthi.ac.in)
              </p>
            )}
          </div>

          {/* Name input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
            />
          </div>

          {/* Department Selection */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept} className="bg-white">
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Code Selection (Coordinator only) */}
          {role === "coordinator" && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Coordinator Verification Code
              </label>
              <input
                type="password"
                required
                placeholder="Enter coordinator verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          )}

          {/* Year selector (Student only) */}
          {role === "student" && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 glow-btn card-3d-button pop-out-3d disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {loading ? "Authenticating..." : "Sign In / Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
