import React from "react";
import { useStore } from "../store.ts";
import { User, Mail, Building, GraduationCap, Github, Save, Copy, Check, Camera, Image, Upload, Lock, KeyRound, Phone, Layers, Sparkles } from "lucide-react";

export default function Profile() {
  const { currentUser, updateProfile, addToast } = useStore();

  const [name, setName] = React.useState(currentUser?.name || "");
  const [email, setEmail] = React.useState(currentUser?.email || "");
  const [password, setPassword] = React.useState("");
  const [department, setDepartment] = React.useState(currentUser?.department || "");
  const [phone, setPhone] = React.useState(currentUser?.phone || "");
  const [registerNumber, setRegisterNumber] = React.useState(currentUser?.registerNumber || "");
  const [year, setYear] = React.useState(currentUser?.year || "3");
  const [lab, setLab] = React.useState(currentUser?.lab || "Artificial Intelligence and Research Lab");
  const [preferredDomain, setPreferredDomain] = React.useState(currentUser?.preferredDomain || "Artificial Intelligence");
  const [avatar, setAvatar] = React.useState(currentUser?.avatar || "https://avatar.vercel.sh/user");
  const [githubUsername, setGithubUsername] = React.useState(currentUser?.githubUsername || "");
  const [githubToken, setGithubToken] = React.useState(currentUser?.githubToken || "");

  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const OFFICIAL_LABS = [
    "Artificial Intelligence and Research Lab",
    "Cyber Security / Cloud Computing Lab",
    "AR/VR Lab",
    "IoT (Internet of Things) Lab",
    "PCB Lab",
    "Robotics Lab",
    "VLSI Lab"
  ];

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setDepartment(currentUser.department || "");
      setPhone(currentUser.phone || "");
      setRegisterNumber(currentUser.registerNumber || "");
      setYear(currentUser.year || "3");
      setLab(currentUser.lab || OFFICIAL_LABS[0]);
      setPreferredDomain(currentUser.preferredDomain || "Artificial Intelligence");
      setAvatar(currentUser.avatar || "https://avatar.vercel.sh/user");
      setGithubUsername(currentUser.githubUsername || "");
      setGithubToken(currentUser.githubToken || "");
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      addToast("Profile photo must be less than 3MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        addToast("Profile photo selected! Click Save Profile to apply.", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updateData: any = {
      name,
      email,
      department,
      phone,
      avatar,
      githubUsername,
      githubToken,
    };

    if (password) {
      updateData.password = password;
    }

    if (currentUser.role === "student") {
      updateData.registerNumber = registerNumber;
      updateData.year = year;
      updateData.lab = lab;
      updateData.preferredDomain = preferredDomain;
    }

    const success = await updateProfile(currentUser.userId, updateData);
    if (success) {
      setPassword("");
    }
    setSaving(false);
  };

  const handleCopyGithub = () => {
    if (!githubUsername) {
      addToast("No GitHub username or repository URL configured.", "info");
      return;
    }
    const repoUrl = githubUsername.startsWith("http")
      ? githubUsername
      : `https://github.com/${githubUsername}`;
    navigator.clipboard.writeText(repoUrl);
    setCopied(true);
    addToast("GitHub Repository URL copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const isStudent = currentUser.role === "student";

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left pb-10">
      <div className="glass-card bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-blue-200/60 shadow-xl space-y-6">
        
        {/* Header Profile Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-200">
          <div className="relative group">
            <img
              src={avatar || currentUser.avatar}
              alt={name}
              className="w-24 h-24 rounded-3xl ring-4 ring-blue-500/20 object-cover shadow-md"
            />
            <label className="absolute inset-0 bg-black/60 text-white rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-xs font-black gap-1">
              <Camera className="w-4 h-4" />
              <span>Change</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900">{name}</h2>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200/60">
                {currentUser.role.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold">
              {email} &bull; {department || "Department Unassigned"}
            </p>
            {isStudent && (
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                  Reg: {registerNumber || "Pending"}
                </span>
                <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200/50">
                  Year {year}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Master Form for Profile Editing */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Account & Credentials */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Account Credentials (Email & Password)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Update Account Password (Optional)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="Enter new password to change"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Profile Details */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Personal & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Department *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Academic Details (Student Specific) */}
          {isStudent && (
            <div className="space-y-4 p-5 bg-blue-50/40 rounded-2xl border border-blue-200/60">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                Academic & Lab Assignment Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Register Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Academic Year *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Assigned Research Lab *
                  </label>
                  <select
                    value={lab}
                    onChange={(e) => setLab(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  >
                    {OFFICIAL_LABS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Preferred Specialization Domain
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Artificial Intelligence, Cloud Security"
                    value={preferredDomain}
                    onChange={(e) => setPreferredDomain(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: GitHub Integration & Repository Config */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Github className="w-4 h-4 text-blue-600" />
                GitHub Integration & Commit Syncing
              </h3>

              {githubUsername && (
                <button
                  type="button"
                  onClick={handleCopyGithub}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition border border-blue-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy GitHub URL"}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  GitHub Repository / Username URL *
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/username/project-repo"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  GitHub Personal Access Token (Optional for Private Repos)
                </label>
                <input
                  type="password"
                  placeholder="ghp_********************************"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Profile Avatar Photo */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              Update Profile Avatar Photo
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload Photo File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-slate-400 font-semibold">or Avatar Image URL:</span>

              <input
                type="text"
                placeholder="https://avatar.vercel.sh/yourname"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Updating Profile..." : "Save Profile & Update Account"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
