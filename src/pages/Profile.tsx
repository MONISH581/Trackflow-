import React from "react";
import { useStore } from "../store.ts";
import { User, Mail, Building, GraduationCap, Github, Save, Copy, Check, Camera, Image, Upload } from "lucide-react";

export default function Profile() {
  const { currentUser, updateProfile, addToast } = useStore();

  const [avatar, setAvatar] = React.useState(currentUser?.avatar || "https://avatar.vercel.sh/user");
  const [githubUsername, setGithubUsername] = React.useState(currentUser?.githubUsername || "");
  const [githubToken, setGithubToken] = React.useState(currentUser?.githubToken || "");
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
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
    const success = await updateProfile(currentUser.userId, {
      avatar,
      githubUsername,
      githubToken,
    });
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
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Header Profile Summary */}
        <div className="flex items-center gap-5 pb-6 border-b border-slate-200">
          <div className="relative group">
            <img
              src={avatar || currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-2xl ring-2 ring-blue-500/20 object-cover shadow-sm"
            />
            <label className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-xs font-bold gap-1">
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

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
              {currentUser.role.replace("_", " ")} &bull; {currentUser.department}
            </p>
            <p className="text-xs text-slate-500 font-semibold">{currentUser.email}</p>
          </div>
        </div>

        {/* Read-Only Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block">Full Name</span>
            <span className="font-semibold text-slate-800 text-sm">{currentUser.name}</span>
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block">Email Address</span>
            <span className="font-semibold text-slate-800 text-sm">{currentUser.email}</span>
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block">Department</span>
            <span className="font-semibold text-slate-800 text-sm">{currentUser.department}</span>
          </div>

          {/* Academic Year ONLY for Students! */}
          {isStudent && currentUser.year && (
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">Academic Year</span>
              <span className="font-semibold text-blue-600 text-sm">Year {currentUser.year}</span>
            </div>
          )}

          {/* Register Number for Students */}
          {isStudent && currentUser.registerNumber && (
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">Register Number</span>
              <span className="font-semibold text-slate-800 text-sm">{currentUser.registerNumber}</span>
            </div>
          )}
        </div>

        {/* Form: Avatar Photo & GitHub Config */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          
          {/* Profile Photo Section */}
          <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              Update Profile Photo
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Upload an image file from your device or specify a custom avatar image URL below.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-slate-400 font-semibold">or Image URL:</span>

              <input
                type="text"
                placeholder="https://avatar.vercel.sh/yourname"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* GitHub Repository Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Github className="w-4 h-4 text-blue-600" />
                GitHub Repository Configuration
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

            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  GitHub Repository / Username URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/username/project-repo"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  GitHub Token (Optional for commit syncing)
                </label>
                <input
                  type="password"
                  placeholder="ghp_********************************"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Profile & Avatar"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
