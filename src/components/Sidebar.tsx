import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore, API_BASE, getAuthHeaders } from "../store.ts";
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
    if (currentUser?.role === "coordinator" || currentUser?.role === "master_admin") {
      fetch(`${API_BASE}/api/approvals`, { headers: getAuthHeaders() })
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

  const masterControlMenu: MenuItem[] = [
    { name: "Master Control", path: "/master-control", icon: ShieldCheck },
    { name: "All Projects", path: "/projects", icon: Briefcase },
    { name: "Mentors", path: "/mentors", icon: Users },
    { name: "Approvals", path: "/approvals", icon: ShieldCheck, badge: pendingCount },
    { name: "Daily Reports", path: "/daily-reports", icon: ClipboardCheck },
    { name: "Hackathons", path: "/hackathons", icon: Sparkles },
    { name: "Activity Analytics", path: "/activity-analytics", icon: LayoutDashboard },
    { name: "Student Records", path: "/records", icon: Users },
    { name: "Attendance & Labs", path: "/attendance", icon: ClipboardCheck },
    { name: "Tasks Board", path: "/tasks", icon: CheckSquare },
    { name: "Opportunities Hub", path: "/opportunities", icon: Compass },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const menuItems = currentUser.role === "master_admin" 
    ? masterControlMenu 
    : (currentUser.role === "coordinator" ? coordinatorMenu : studentMenu);


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
        className={`fixed top-0 bottom-0 left-0 z-40 w-[80vw] max-w-64 md:w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-500/20">
              T
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                TrackFlow <span className="text-indigo-600">AI</span>
              </h1>
              <span className="inline-block mt-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Education Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto no-scrollbar">
            <div className="px-3 pb-1.5 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Menu Navigation
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 group ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 font-bold shadow-sm border border-indigo-100/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="flex items-center justify-center px-2 py-0.5 text-xs font-extrabold text-white bg-rose-500 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer User logout card */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 p-2.5 mb-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl ring-2 ring-indigo-500/20 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
