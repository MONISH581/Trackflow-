import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store.ts";
import Sidebar from "./components/Sidebar.tsx";
import Header from "./components/Header.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Approvals from "./pages/Approvals.tsx";
import StudentRecords from "./pages/StudentRecords.tsx";
import Projects from "./pages/Projects.tsx";
import ProjectDetails from "./pages/ProjectDetails.tsx";
import Tasks from "./pages/Tasks.tsx";
import Chat from "./pages/Chat.tsx";
import Profile from "./pages/Profile.tsx";
import Attendance from "./pages/Attendance.tsx";
import Opportunities from "./pages/Opportunities.tsx";
import OpportunityDetails from "./pages/OpportunityDetails.tsx";
import AdminOpportunities from "./pages/AdminOpportunities.tsx";
import MentorManagement from "./pages/MentorManagement.tsx";
import DailyReportSystem from "./pages/DailyReportSystem.tsx";
import HackathonHub from "./pages/HackathonHub.tsx";
import ActivityAnalytics from "./pages/ActivityAnalytics.tsx";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

import MasterControl from "./pages/MasterControl.tsx";

export default function App() {
  const { currentUser, toasts, removeToast, checkSession, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  // 4-Minute Frontend Keep-Alive Heartbeat for Render Server Warmup
  React.useEffect(() => {
    const keepAliveInterval = setInterval(() => {
      fetch('/api/ping').catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(keepAliveInterval);
  }, []);



  // If not logged in, render the login page
  if (!currentUser) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </BrowserRouter>
    );
  }

  // If logged in but not approved
  if (currentUser.status === "pending" || currentUser.status === "rejected") {
    return (
      <BrowserRouter>
        <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] p-4 text-left">
          <div className="max-w-md w-full glass-card p-8 border border-blue-200/50 shadow-2xl text-center space-y-6 bg-white/90 backdrop-blur-xl rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8 animate-pulse text-blue-600" />
            </div>
            <div className="space-y-2">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                {currentUser.status === "pending" ? "Teacher Approval Required" : "Access Declined"}
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                {currentUser.status === "pending" ? "Student Registration Request Submitted" : "Registration Request Declined"}
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {currentUser.status === "pending"
                  ? "Your student account request has been registered. Please ask your Teacher or Lab Coordinator to grant your login request in their Admin Approvals Console."
                  : "Your registration request was declined by the coordinator. Please contact your department teacher."}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {currentUser.status === "pending" && (
                <button
                  onClick={() => checkSession()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Re-Check Approval Status
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Sign Out / Return to Login
              </button>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </BrowserRouter>
    );
  }

  // Main Dashboard Shell
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f1f5f9] text-slate-800 relative selection:bg-blue-500 selection:text-white overflow-x-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Content Shell */}
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/master-control" element={<MasterControl />} />
              <Route path="/daily-reports" element={<DailyReportSystem />} />
              <Route path="/hackathons" element={<HackathonHub />} />
              
              {currentUser.role === "coordinator" || currentUser.role === "master_admin" ? (
                <>
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/mentors" element={<MentorManagement />} />
                  <Route path="/activity-analytics" element={<ActivityAnalytics />} />
                  <Route path="/approvals" element={<Approvals />} />
                  <Route path="/records" element={<StudentRecords />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/opportunities/admin" element={<AdminOpportunities />} />
                </>
              ) : (
                <>
                  <Route path="/project-hub" element={<ProjectDetails />} />
                </>
              )}

              
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/opportunities/:id" element={<OpportunityDetails />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Toast alerts container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </BrowserRouter>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: any[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-500/20 text-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 border-rose-500/20 text-rose-800"
              : "bg-blue-50 border-blue-500/20 text-blue-800"
          }`}
        >
          <div className="flex gap-2">
            {toast.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />}
            {toast.type === "info" && <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />}
            <span className="text-sm font-semibold leading-tight text-slate-800">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-700 ml-3 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
