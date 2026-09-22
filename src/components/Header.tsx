import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../store.ts";
import { Bell, Menu, Check, Search, Calendar as CalendarIcon } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markNotificationRead, currentUser } = useStore();
  const [showNotifs, setShowNotifs] = React.useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read);

  // Get Page Title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Overview Dashboard";
    if (path === "/master-control") return "Master Control";
    if (path === "/projects") return "Projects Directory";
    if (path === "/project-hub") return "My Project Hub";
    if (path === "/approvals") return "Approvals Console";
    if (path === "/records") return "Student Records";
    if (path === "/tasks") return "Task Management";
    if (path === "/chat") return "Live Messaging";
    if (path === "/profile") return "User Profile";
    if (path === "/opportunities") return "Opportunities Hub";
    if (path === "/daily-reports") return "Daily Reports System";
    if (path === "/hackathons") return "Hackathon Proofs";
    return "TrackFlow AI";
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-[0_2px_15px_rgba(0,0,0,0.02)] gap-2 sm:gap-4">
      {/* Title & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl md:hidden hover:bg-slate-100 min-w-[min(100%,_40px)] min-h-[40px] flex items-center justify-center cursor-pointer transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-left min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 hidden sm:inline" />
            <span className="hidden sm:inline font-semibold text-slate-600">{formattedDate}</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-full text-xs tracking-wide">
              {currentUser?.role === "coordinator" ? "Coordinator Console" : "Learner Workspace"}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Alert Bell & User profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className={`p-2.5 rounded-xl border transition-all min-w-[min(100%,_40px)] min-h-[40px] flex items-center justify-center cursor-pointer ${
              unreadNotifications.length > 0
                ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
                : "bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200/80"
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifs && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifs(false)}
              />
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto mt-2 sm:mt-3 z-50 w-auto sm:w-[340px] rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">Notifications</h3>
                    <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full">
                      {unreadNotifications.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No new notifications right now.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id || notif.id}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          notif.read
                            ? "bg-slate-50 border-slate-200/60 text-slate-500"
                            : "bg-indigo-50/60 border-indigo-100 text-slate-900 font-medium"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-bold ${notif.read ? 'text-slate-600' : 'text-indigo-600'}`}>
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <button
                              onClick={() => markNotificationRead(notif._id || notif.id)}
                              className="p-1 rounded-md bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
                              title="Mark read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar indicator */}
        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 pl-3 border-l border-slate-200/60 cursor-pointer hover:opacity-85 transition group"
          title="Click to view your profile"
        >
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-10 h-10 rounded-xl ring-2 ring-indigo-500/20 group-hover:ring-indigo-500/50 object-cover shadow-xs transition-all"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 truncate transition">{currentUser?.name}</p>
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
              {currentUser?.department || "General Lab"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
