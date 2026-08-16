import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../store.ts";
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  MessageSquare,
  Users,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  ClipboardCheck,
  Compass,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { currentUser, logout } = useStore();
  const location = useLocation();
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    if (currentUser?.role === "coordinator") {
      fetch("/api/approvals")
        .then((r) => r.json())
        .then((data) => {
          if (data.requests) {
            setPendingCount(data.requests.length);
          }
        })
        .catch(() => {});
    }
  }, [currentUser, location]);

  if (!currentUser) return null;

  interface MenuItem {
    name: string;
    path: string;
    icon: React.ComponentType<any>;
    badge?: number;
  }

  const coordinatorMenu: MenuItem[] = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Projects", path: "/projects", icon: Briefcase },
    { name: "Mentors", path: "/mentors", icon: Users },
    { name: "Approvals", path: "/approvals", icon: ShieldCheck, badge: pendingCount },
    { name: "Daily Reports", path: "/daily-reports", icon: ClipboardCheck },
    { name: "Hackathons Proofs", path: "/hackathons", icon: Sparkles },
    { name: "Activity Analytics", path: "/activity-analytics", icon: LayoutDashboard },
    { name: "Student Records", path: "/records", icon: Users },
    { name: "Attendance & Lab", path: "/attendance", icon: ClipboardCheck },
    { name: "Tasks Board", path: "/tasks", icon: CheckSquare },
    { name: "Live Chat", path: "/chat", icon: MessageSquare },
    { name: "Opportunities Hub", path: "/opportunities", icon: Compass },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const studentMenu: MenuItem[] = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "My Project & Domain", path: "/project-hub", icon: Briefcase },
    { name: "Daily Reports", path: "/daily-reports", icon: ClipboardCheck },
    { name: "Hackathons", path: "/hackathons", icon: Sparkles },
    { name: "My Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Chat Rooms", path: "/chat", icon: MessageSquare },
    { name: "Opportunities Hub", path: "/opportunities", icon: Compass },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const menuItems = currentUser.role === "coordinator" ? coordinatorMenu : studentMenu;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-slate-200 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-200/60">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">
                TrackFlow <span className="text-blue-600">AI</span>
              </h1>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Project Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-50/80 text-blue-600 border-l-4 border-blue-600 font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? "text-blue-600" : "text-slate-500 group-hover:text-blue-600"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-rose-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer User logout card */}
          <div className="p-4 border-t border-slate-200/60">
            <div className="flex items-center gap-3 p-2 mb-3 rounded-lg bg-slate-50 border border-slate-200/60">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full ring-2 ring-blue-500/30 object-cover"
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize truncate">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
