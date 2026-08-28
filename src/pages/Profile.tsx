import React from "react";
import { useStore } from "../store.ts";
import { User, Mail, Building, GraduationCap, Github, Save, Copy, Check } from "lucide-react";

export default function Profile() {
  const { currentUser, updateProfile, addToast } = useStore();

  const [githubUsername, setGithubUsername] = React.useState(currentUser?.githubUsername || "");
  const [githubToken, setGithubToken] = React.useState(currentUser?.githubToken || "");
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setGithubUsername(currentUser.githubUsername || "");
      setGithubToken(currentUser.githubToken || "");
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateProfile(currentUser.userId, {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Header Profile Summary (Read-Only) */}
        <div className="flex items-center gap-5 pb-6 border-b border-slate-200">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-20 h-20 rounded-2xl ring-2 ring-blue-500/20 object-cover"
          />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
              {currentUser.role.replace("_", " ")} &bull; {currentUser.department}
            </p>
            <p className="text-xs text-slate-500 font-semibold">{currentUser.email}</p>
          </div>
        </div>

        {/* Read-Only Student & Coordinator Details */}
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
          {currentUser.year && (
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">Academic Year</span>
              <span className="font-semibold text-slate-800 text-sm">Year {currentUser.year}</span>
            </div>
          )}
        </div>

        {/* GitHub Repository Configuration ONLY */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Github className="w-4.5 h-4.5 text-blue-600" />
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

            <p className="text-xs text-slate-500 font-medium">
              You can only add or update your GitHub Repository URL below. Personal details and photo uploads are managed by administration.
            </p>

            <div className="space-y-4 pt-2">
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
              <span>{saving ? "Saving..." : "Save GitHub Repository"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
