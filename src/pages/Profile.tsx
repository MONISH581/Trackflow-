import React from "react";
import { useStore } from "../store.ts";
import { User, Mail, Building, GraduationCap, Github, Save } from "lucide-react";

export default function Profile() {
  const { currentUser, updateProfile } = useStore();

  const [name, setName] = React.useState(currentUser?.name || "");
  const [department, setDepartment] = React.useState(currentUser?.department || "");
  const [year, setYear] = React.useState(currentUser?.year || "1");
  const [avatar, setAvatar] = React.useState(currentUser?.avatar || "");
  const [githubUsername, setGithubUsername] = React.useState(currentUser?.githubUsername || "");
  const [githubToken, setGithubToken] = React.useState(currentUser?.githubToken || "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setDepartment(currentUser.department);
      setYear(currentUser.year || "1");
      setAvatar(currentUser.avatar);
      setGithubUsername(currentUser.githubUsername || "");
      setGithubToken(currentUser.githubToken || "");
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateProfile(currentUser.userId, {
      name,
      department,
      year: currentUser.role === "student" ? year : undefined,
      avatar,
      githubUsername,
      githubToken,
    });
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("userId", currentUser.userId);

      try {
        const res = await fetch("/api/profile/upload-avatar", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.avatar) {
          setAvatar(data.avatar);
          // Also update the store immediately
          updateProfile(currentUser.userId, { avatar: data.avatar });
        }
      } catch (err) {
        console.error("Avatar upload failed:", err);
      }
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

  const avatars = [
    "sarah",
    "monish",
    "rishi",
    "alex",
    "jane",
    "james",
    "luna",
    "leo",
    "sophia",
    "max",
  ].map(name => `https://avatar.vercel.sh/${name}`);

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="glass-card p-6 md:p-8 border border-blue-200/40 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-200/60 mb-6">
          <div className="relative group">
            <img
              src={avatar}
              alt={name}
              className="w-24 h-24 rounded-2xl ring-4 ring-blue-500/20 object-cover"
            />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-slate-800">{currentUser.name}</h2>
            <p className="text-xs text-blue-600 font-bold capitalize tracking-wide">
              {currentUser.role} &bull; {currentUser.department}
            </p>
            <p className="text-xs text-slate-500 font-semibold">{currentUser.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm opacity-55 cursor-not-allowed"
                title="Email cannot be modified"
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-white">
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Year (Student only) */}
            {currentUser.role === "student" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer"
                >
                  <option value="1" className="bg-white">Year 1 (Freshman)</option>
                  <option value="2" className="bg-white">Year 2 (Sophomore)</option>
                  <option value="3" className="bg-white">Year 3 (Junior)</option>
                  <option value="4" className="bg-white">Year 4 (Senior)</option>
                </select>
              </div>
            )}
          </div>

          {/* GitHub Settings */}
          <div className="border-t border-slate-200/60 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Github className="w-4 h-4 text-blue-600" />
              GitHub Analytics Settings
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Provide your GitHub credentials to enable automated commit scanning, pull request monitoring, and repository progress statistics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  GitHub Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. octocat"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  placeholder="ghp_********************************"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            </div>
          </div>

          {/* Avatar Options */}
          <div className="border-t border-slate-200/60 pt-6 space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Upload Profile Photo
            </label>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-slate-500 font-semibold">
                Upload a professional photo. Recommended size is 256x256px.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-500/10"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
