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
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

export default function App() {
  const { currentUser, toasts, removeToast, checkSession, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Inactivity timeout: auto logout after 15 minutes of no activity
  // const navigate = useNavigate(); // removed - not needed
  React.useEffect(() => {
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
      // Reload the page after inactivity
      window.location.reload();
    }, INACTIVITY_LIMIT);
    };

    // Initialize timer and activity listeners
    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [logout]);

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
        <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] p-4">
          <div className="max-w-md w-full glass-card p-8 border border-blue-200/40 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/55 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {currentUser.status === "pending" ? "Registration Pending" : "Registration Rejected"}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {currentUser.status === "pending"
                  ? "Your account registration has been received and is currently waiting for approval from the coordinator."
                  : "Your account request was declined. Please contact your coordinator."}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("trackflow_user");
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-white rounded-xl text-sm font-semibold transition"
            >
              Sign Out / Retry
            </button>
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
        {/* Hyper-3D Animated Grid & Particle Ambient Background */}
        <div className="hyper-3d-bg">
          <div className="hyper-3d-grid" />
        </div>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Content Shell */}
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
              {currentUser.role === "coordinator" ? (
                <>
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
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
