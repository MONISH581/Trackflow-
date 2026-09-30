import React from "react";
import {
  Users,
  UserCheck,
  FolderKanban,
  Zap,
  UsersRound,
  Trophy,
  Flame,
  UserCheck2,
  Clock,
  ShieldCheck,
  Layers,
  CheckCircle2,
  CalendarClock,
  AlertTriangle
} from "lucide-react";
import { CommandCenterOverview } from "../../store";

interface CommandCenterKPIsProps {
  kpis?: CommandCenterOverview["kpis"];
  activeFilterKey?: string | null;
  onSelectKpiFilter: (filterKey: string, filterValue: any) => void;
}

export const CommandCenterKPIs: React.FC<CommandCenterKPIsProps> = ({
  kpis,
  activeFilterKey,
  onSelectKpiFilter
}) => {
  if (!kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 animate-pulse">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/60 rounded-2xl border border-slate-200" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: "total_students",
      label: "Total Students",
      value: kpis.totalStudents,
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      accent: "from-blue-500 to-indigo-500",
      filterKey: "student_all",
      filterValue: null
    },
    {
      key: "active_students",
      label: "Active Students",
      value: kpis.activeStudents,
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      accent: "from-emerald-500 to-teal-500",
      filterKey: "student_status",
      filterValue: "active"
    },
    {
      key: "total_projects",
      label: "Total Projects",
      value: kpis.totalProjects,
      icon: FolderKanban,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      accent: "from-indigo-500 to-purple-500",
      filterKey: "has_project",
      filterValue: true
    },
    {
      key: "active_projects",
      label: "Active Projects",
      value: kpis.activeProjects,
      icon: Zap,
      color: "text-violet-600 bg-violet-50 border-violet-100",
      accent: "from-violet-500 to-purple-500",
      filterKey: "project_status",
      filterValue: "active"
    },
    {
      key: "total_teams",
      label: "Total Teams",
      value: kpis.totalTeams,
      icon: UsersRound,
      color: "text-cyan-600 bg-cyan-50 border-cyan-100",
      accent: "from-cyan-500 to-blue-500",
      filterKey: "has_team",
      filterValue: true
    },
    {
      key: "total_hackathons",
      label: "Total Hackathons",
      value: kpis.totalHackathons,
      icon: Trophy,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      accent: "from-amber-500 to-yellow-500",
      filterKey: "hackathons_all",
      filterValue: null
    },
    {
      key: "active_hackathons",
      label: "Active Hackathons",
      value: kpis.activeHackathons,
      icon: Flame,
      color: "text-orange-600 bg-orange-50 border-orange-100",
      accent: "from-orange-500 to-amber-500",
      filterKey: "hackathon_active",
      filterValue: true
    },
    {
      key: "total_participants",
      label: "Total Registrations",
      value: kpis.totalParticipants,
      icon: UserCheck2,
      color: "text-teal-600 bg-teal-50 border-teal-100",
      accent: "from-teal-500 to-emerald-500",
      filterKey: "registration_all",
      filterValue: null
    },
    {
      key: "pending_verification",
      label: "Pending Verification",
      value: kpis.pendingVerification,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      accent: "from-amber-500 to-rose-500",
      filterKey: "verification_status",
      filterValue: "pending"
    },
    {
      key: "verified_participants",
      label: "Verified Participants",
      value: kpis.verifiedParticipants,
      icon: ShieldCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      accent: "from-emerald-500 to-green-500",
      filterKey: "verification_status",
      filterValue: "verified"
    },
    {
      key: "active_rounds",
      label: "Active Rounds",
      value: kpis.activeRounds,
      icon: Layers,
      color: "text-sky-600 bg-sky-50 border-sky-100",
      accent: "from-sky-500 to-blue-500",
      filterKey: "round_status",
      filterValue: "in_progress"
    },
    {
      key: "completed_rounds",
      label: "Completed Rounds",
      value: kpis.completedRounds,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50 border-green-100",
      accent: "from-green-500 to-emerald-500",
      filterKey: "round_status",
      filterValue: "completed"
    },
    {
      key: "upcoming_deadlines",
      label: "Upcoming Deadlines",
      value: kpis.upcomingDeadlines,
      icon: CalendarClock,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      accent: "from-indigo-500 to-violet-500",
      filterKey: "has_deadline",
      filterValue: true
    },
    {
      key: "at_risk_items",
      label: "At-Risk Items",
      value: kpis.atRiskItems,
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 border-rose-100",
      accent: "from-rose-500 to-red-500",
      filterKey: "is_at_risk",
      filterValue: true
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Executive KPI Matrix (14 Indicators)
        </h2>
        {activeFilterKey && (
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            Active Filter: {activeFilterKey}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 sm:gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeFilterKey === card.key;

          return (
            <button
              key={card.key}
              onClick={() => onSelectKpiFilter(card.key, card.filterValue)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500 scale-[1.02]"
                  : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 shadow-xs hover:shadow-md hover:border-slate-300"
              }`}
            >
              {/* Top Row: Icon + Value */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
                    isSelected
                      ? "bg-slate-800 text-indigo-400 border-slate-700"
                      : card.color
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-lg sm:text-xl font-black tracking-tight ${
                    isSelected ? "text-white" : "text-slate-900"
                  }`}
                >
                  {card.value.toLocaleString()}
                </span>
              </div>

              {/* Bottom Label */}
              <p
                className={`text-[11px] font-bold line-clamp-1 leading-tight ${
                  isSelected ? "text-slate-300" : "text-slate-500 group-hover:text-slate-700"
                }`}
              >
                {card.label}
              </p>

              {/* Accent Underline */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.accent} opacity-40 group-hover:opacity-100 transition-opacity`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
