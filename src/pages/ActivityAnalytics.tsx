import React, { useEffect } from "react";
import { useStore } from "../store.ts";
import { Activity, AlertTriangle, CheckCircle, Clock, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function ActivityAnalytics() {
  const { activityAnalytics, fetchActivityAnalytics, projects, fetchProjects } = useStore();

  useEffect(() => {
    fetchActivityAnalytics();
    fetchProjects();
  }, [fetchActivityAnalytics, fetchProjects]);

  const activeCount = activityAnalytics.filter(a => a.activityStatus === "Active").length;
  const warningCount = activityAnalytics.filter(a => a.activityStatus === "Warning").length;
  const followUpCount = activityAnalytics.filter(a => a.activityStatus === "Needs Follow-up").length;

  // Prepare chart data from active projects
  const chartData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    progress: p.progress,
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="glass-card p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600/10 text-teal-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Project Activity & Workload Analytics</h1>
            <p className="text-sm text-slate-500">Track student daily report frequency, identify inactive projects & evaluate progress velocity</p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 border border-emerald-200/60 bg-emerald-50/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Students</span>
            <h3 className="text-3xl font-extrabold text-emerald-900 mt-1">{activeCount}</h3>
            <p className="text-xs text-emerald-700 mt-1">Regular daily report updates</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 border border-amber-200/60 bg-amber-50/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Warning Level</span>
            <h3 className="text-3xl font-extrabold text-amber-900 mt-1">{warningCount}</h3>
            <p className="text-xs text-amber-700 mt-1">2–5 days without daily report</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 border border-rose-200/60 bg-rose-50/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Needs Follow-up</span>
            <h3 className="text-3xl font-extrabold text-rose-900 mt-1">{followUpCount}</h3>
            <p className="text-xs text-rose-700 mt-1">&gt; 5 days inactive / missing logs</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Progress Trajectory Graph */}
      <div className="glass-card p-6 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Project Progress Trajectory Graph</span>
            </h2>
            <p className="text-xs text-slate-500">Live progress completion percentage across active lab projects</p>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: any) => [`${value}%`, 'Progress']} />
              <Area type="monotone" dataKey="progress" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Activity & Workload Table */}
      <div className="glass-card p-6 border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Student Activity Status Table</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3">Student Name</th>
                <th className="p-3">Reg No</th>
                <th className="p-3">Domain</th>
                <th className="p-3">Project Title</th>
                <th className="p-3">Mentor</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Last Report</th>
                <th className="p-3">Activity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activityAnalytics.map((item) => (
                <tr key={item.studentId} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-bold text-slate-800">{item.studentName}</td>
                  <td className="p-3 font-mono text-slate-500">{item.registerNumber}</td>
                  <td className="p-3 font-medium text-slate-700">{item.preferredDomain}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.projectName}</td>
                  <td className="p-3 text-slate-600">{item.mentorName}</td>
                  <td className="p-3">
                    <span className="font-bold text-blue-600">{item.progress}%</span>
                  </td>
                  <td className="p-3 text-slate-500">{item.lastReportDate}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 ${
                      item.activityStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.activityStatus === 'Warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.activityStatus === 'Active' ? 'bg-emerald-500' :
                        item.activityStatus === 'Warning' ? 'bg-amber-500' :
                        'bg-rose-500 animate-pulse'
                      }`} />
                      {item.activityStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
