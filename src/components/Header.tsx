import React from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "../store.ts";
import { Bell, Menu, Check } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const { notifications, markNotificationRead, currentUser } = useStore();
  const [showNotifs, setShowNotifs] = React.useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read);

  // Get Page Title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Overview Dashboard";
    if (path === "/projects") return "Projects Directory";
    if (path === "/project-hub") return "Project Hub";
    if (path === "/approvals") return "Approval Queue";
    if (path === "/records") return "Student Records";
    if (path === "/tasks") return "Task Board";
    if (path === "/chat") return "Live Messaging";
    if (path === "/profile") return "User Profile";
    return "TrackFlow AI";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-20 glass-panel border-b border-slate-200/60">
      {/* Title & Hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg md:hidden hover:bg-slate-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{getPageTitle()}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {currentUser?.role === "coordinator" ? "Coordinator Control Center" : "Student Workspaces"}
          </p>
        </div>
      </div>

      {/* Notifications Alert Bell & User profile */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className={`p-2.5 rounded-xl border border-slate-200 transition-all ${
              unreadNotifications.length > 0
                ? "bg-blue-50 text-blue-600 border-blue-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifs && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifs(false)}
              />
              <div className="absolute right-0 mt-3 z-50 w-80 rounded-2xl glass-panel border border-slate-200/80 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
                  <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                  <span className="text-xs text-blue-600 font-bold">
                    {unreadNotifications.length} Unread
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id || notif.id}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          notif.read
                            ? "bg-slate-50 border-slate-200/60 text-slate-500"
                            : "bg-blue-50/50 border-blue-100 text-slate-800 font-medium"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-bold ${notif.read ? 'text-slate-500' : 'text-blue-600'}`}>
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <button
                              onClick={() => markNotificationRead(notif._id || notif.id)}
                              className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                              title="Mark read"
                            >
                              <Check className="w-3.5 h-3.5" />
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
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200/60">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full ring-2 ring-blue-500/10 object-cover"
          />
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wider font-semibold">
              {currentUser?.department || "Dept"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
