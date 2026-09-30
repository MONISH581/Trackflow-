import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useStore, CommandCenterOverview, CommandCenterMappingItem, CommandCenterAnalytics, CommandCenterAttention, CommandCenterDataQuality } from "../store";
import { Shield, AlertCircle } from "lucide-react";
import { CommandCenterHeader } from "../components/command-center/CommandCenterHeader";
import { CommandCenterKPIs } from "../components/command-center/CommandCenterKPIs";
import { CommandCenterFilters, CommandCenterFilterState } from "../components/command-center/CommandCenterFilters";
import { RelationshipMap } from "../components/command-center/RelationshipMap";
import { MappingTable } from "../components/command-center/MappingTable";
import { AnalyticsPanel } from "../components/command-center/AnalyticsPanel";
import { AttentionCenter } from "../components/command-center/AttentionCenter";
import { DataQualityPanel } from "../components/command-center/DataQualityPanel";
import { Student360Drawer } from "../components/command-center/Student360Drawer";
import { Project360Drawer } from "../components/command-center/Project360Drawer";
import { Team360Drawer } from "../components/command-center/Team360Drawer";
import { Hackathon360Drawer } from "../components/command-center/Hackathon360Drawer";

export default function CommandCenter() {
  const {
    currentUser,
    fetchCommandCenterOverview,
    fetchCommandCenterMappings,
    fetchCommandCenterAnalytics,
    fetchCommandCenterAttention,
    fetchCommandCenterDataQuality,
    fetchEntity360,
    addToast
  } = useStore();

  const isMaster = currentUser?.role === "master_admin";
  const isCoordinator = currentUser?.role === "coordinator";

  // Data states
  const [overview, setOverview] = useState<CommandCenterOverview | null>(null);
  const [mappings, setMappings] = useState<CommandCenterMappingItem[]>([]);
  const [analytics, setAnalytics] = useState<CommandCenterAnalytics | null>(null);
  const [attention, setAttention] = useState<CommandCenterAttention | null>(null);
  const [dataQuality, setDataQuality] = useState<CommandCenterDataQuality | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Entity Drawer State
  const [activeDrawer, setActiveDrawer] = useState<{
    type: "student" | "project" | "team" | "hackathon";
    id: string;
  } | null>(null);
  const [drawerData, setDrawerData] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);

  // Global Filter State
  const initialLab = isMaster ? "ALL" : currentUser?.lab || "ALL";
  const [filters, setFilters] = useState<CommandCenterFilterState>({
    search: "",
    lab: initialLab,
    department: "ALL",
    roundStatus: "ALL",
    verificationStatus: "ALL",
    internalStatus: "ALL",
    isAtRiskOnly: false,
    hasProjectOnly: false,
    kpiFilterKey: null
  });

  // Strict role check
  if (!currentUser || (!isMaster && !isCoordinator)) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-sm max-w-lg mx-auto mt-12 space-y-3">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-500">
          The TrackFlow 360° Command Center is strictly restricted to authorized Coordinator and Master Admin accounts.
        </p>
      </div>
    );
  }

  // Master Data Loader
  const loadCommandCenterData = useCallback(async () => {
    setLoading(true);
    const labQuery = filters.lab === "ALL" ? undefined : filters.lab;

    try {
      const [ov, mp, an, at, dq] = await Promise.all([
        fetchCommandCenterOverview(labQuery),
        fetchCommandCenterMappings(labQuery),
        fetchCommandCenterAnalytics(labQuery),
        fetchCommandCenterAttention(labQuery),
        fetchCommandCenterDataQuality(labQuery)
      ]);

      if (ov) setOverview(ov);
      if (mp) setMappings(mp);
      if (an) setAnalytics(an);
      if (at) setAttention(at);
      if (dq) setDataQuality(dq);

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load command center dataset:", err);
      addToast("Failed to load some Command Center datasets. Showing available data.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    filters.lab,
    fetchCommandCenterOverview,
    fetchCommandCenterMappings,
    fetchCommandCenterAnalytics,
    fetchCommandCenterAttention,
    fetchCommandCenterDataQuality,
    addToast
  ]);

  // Load when lab filter changes
  useEffect(() => {
    loadCommandCenterData();
  }, [filters.lab]);

  // Load Entity 360 Drawer
  const handleOpenEntity = async (
    type: "student" | "project" | "team" | "hackathon",
    id: string
  ) => {
    setActiveDrawer({ type, id });
    setDrawerLoading(true);
    try {
      const data = await fetchEntity360(type, id);
      setDrawerData(data);
    } catch (err) {
      console.error("Failed to fetch entity 360 dossier:", err);
      addToast("Failed to retrieve complete entity dossier.", "error");
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setActiveDrawer(null);
    setDrawerData(null);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      lab: isMaster ? "ALL" : currentUser?.lab || "ALL",
      department: "ALL",
      roundStatus: "ALL",
      verificationStatus: "ALL",
      internalStatus: "ALL",
      isAtRiskOnly: false,
      hasProjectOnly: false,
      kpiFilterKey: null
    });
  };

  // KPI Filter Trigger
  const handleSelectKpiFilter = (kpiKey: string, filterValue: any) => {
    if (filters.kpiFilterKey === kpiKey) {
      // Toggle off
      setFilters((f) => ({
        ...f,
        kpiFilterKey: null,
        isAtRiskOnly: false,
        hasProjectOnly: false,
        roundStatus: "ALL",
        verificationStatus: "ALL"
      }));
      return;
    }

    setFilters((prev) => {
      const updated: CommandCenterFilterState = {
        ...prev,
        kpiFilterKey: kpiKey
      };

      if (kpiKey === "pending_verification") {
        updated.verificationStatus = "pending";
      } else if (kpiKey === "verified_participants") {
        updated.verificationStatus = "verified";
      } else if (kpiKey === "at_risk_items") {
        updated.isAtRiskOnly = true;
      } else if (kpiKey === "total_projects" || kpiKey === "active_projects") {
        updated.hasProjectOnly = true;
      } else if (kpiKey === "active_rounds") {
        updated.roundStatus = "in_progress";
      } else if (kpiKey === "completed_rounds") {
        updated.roundStatus = "completed";
      }

      return updated;
    });
  };

  // Attention Center Filter Trigger
  const handleAttentionFilter = (type: string) => {
    if (type === "pending_verification") {
      setFilters((f) => ({ ...f, verificationStatus: "pending", kpiFilterKey: "pending_verification" }));
    } else if (type === "overdue_round" || type === "low_progress") {
      setFilters((f) => ({ ...f, isAtRiskOnly: true, kpiFilterKey: "at_risk_items" }));
    } else if (type === "approaching_deadline") {
      setFilters((f) => ({ ...f, roundStatus: "in_progress" }));
    }
  };

  // Filtered Mappings Calculation
  const filteredMappings = useMemo(() => {
    return mappings.filter((m) => {
      // Department filter
      if (filters.department !== "ALL" && m.department !== filters.department) {
        return false;
      }

      // Round status
      if (filters.roundStatus !== "ALL" && m.roundStatus !== filters.roundStatus) {
        return false;
      }

      // Verification status
      if (filters.verificationStatus !== "ALL" && m.verificationStatus !== filters.verificationStatus) {
        return false;
      }

      // Internal status
      if (filters.internalStatus !== "ALL" && m.internalStatus !== filters.internalStatus) {
        return false;
      }

      // At risk only
      if (filters.isAtRiskOnly && !m.isAtRisk) {
        return false;
      }

      // Has project only
      if (filters.hasProjectOnly && !m.projectId) {
        return false;
      }

      // Global Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const match =
          (m.studentName || "").toLowerCase().includes(q) ||
          (m.studentEmail || "").toLowerCase().includes(q) ||
          (m.registerNumber || "").toLowerCase().includes(q) ||
          (m.teamName || "").toLowerCase().includes(q) ||
          (m.projectName || "").toLowerCase().includes(q) ||
          (m.hackathonName || "").toLowerCase().includes(q) ||
          (m.currentRoundName || "").toLowerCase().includes(q) ||
          (m.lab || "").toLowerCase().includes(q) ||
          (m.department || "").toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [mappings, filters]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredMappings.length === 0) {
      addToast("No records available to export.", "error");
      return;
    }

    const headers = [
      "Student Name",
      "Register Number",
      "Email",
      "Lab",
      "Department",
      "Team",
      "Project",
      "Hackathon",
      "Round",
      "Round Status",
      "Progress (%)",
      "Verification Status",
      "Round Deadline",
      "Coordinator Remarks",
      "Master Remarks"
    ];

    const rows = filteredMappings.map((m) => [
      `"${m.studentName || ""}"`,
      `"${m.registerNumber || ""}"`,
      `"${m.studentEmail || ""}"`,
      `"${m.lab || ""}"`,
      `"${m.department || ""}"`,
      `"${m.teamName || ""}"`,
      `"${m.projectName || ""}"`,
      `"${m.hackathonName || ""}"`,
      `"${m.currentRoundName || ""}"`,
      `"${m.roundStatus || ""}"`,
      m.projectProgress ?? m.internalProgress ?? 0,
      `"${m.verificationStatus || ""}"`,
      `"${m.roundDeadline ? new Date(m.roundDeadline).toLocaleDateString() : ""}"`,
      `"${(m.coordinatorRemarks || "").replace(/"/g, '""')}"`,
      `"${(m.masterRemarks || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `TrackFlow_360_CommandCenter_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Exported filtered command center records successfully.", "success");
  };

  const handleScrollToAttention = () => {
    const el = document.getElementById("attention-center");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6 text-left pb-16">
      
      {/* 1. Global Command Header */}
      <CommandCenterHeader
        currentUser={currentUser}
        lastRefresh={lastRefresh}
        onRefresh={loadCommandCenterData}
        loading={loading}
        attentionCount={attention?.items?.length || 0}
        onExportCSV={handleExportCSV}
        onScrollToAttention={handleScrollToAttention}
      />

      {/* 2. Top-Level 14 KPI Cards */}
      <CommandCenterKPIs
        kpis={overview?.kpis}
        activeFilterKey={filters.kpiFilterKey}
        onSelectKpiFilter={handleSelectKpiFilter}
      />

      {/* 3. Global Filters Bar */}
      <CommandCenterFilters
        filters={filters}
        onChangeFilters={setFilters}
        onResetFilters={handleResetFilters}
        isMaster={isMaster}
        userLab={currentUser?.lab}
        totalCount={mappings.length}
        filteredCount={filteredMappings.length}
      />

      {/* 4. Main 360° Relationship Map (Student -> Team -> Project -> Hackathon -> Round) */}
      <RelationshipMap
        mappings={filteredMappings}
        onSelectStudent={(id) => handleOpenEntity("student", id)}
        onSelectProject={(id) => handleOpenEntity("project", id)}
        onSelectTeam={(id) => handleOpenEntity("team", id)}
        onSelectHackathon={(id) => handleOpenEntity("hackathon", id)}
      />

      {/* 5. Operational Attention Center */}
      <AttentionCenter
        attention={attention || undefined}
        onFilterType={handleAttentionFilter}
        onSelectStudent={(id) => handleOpenEntity("student", id)}
      />

      {/* 6. Visual Analytics Section */}
      <AnalyticsPanel analytics={analytics || undefined} />

      {/* 7. Student -> Project -> Hackathon Detailed Table */}
      <MappingTable
        mappings={filteredMappings}
        onSelectStudent={(id) => handleOpenEntity("student", id)}
        onSelectProject={(id) => handleOpenEntity("project", id)}
        onSelectTeam={(id) => handleOpenEntity("team", id)}
        onSelectHackathon={(id) => handleOpenEntity("hackathon", id)}
      />

      {/* 8. Data Quality & Completeness Audit Panel */}
      <DataQualityPanel
        dataQuality={dataQuality || undefined}
        onSelectEntity={(type, id) => handleOpenEntity(type, id)}
      />

      {/* 9. Complete 360° Sliding Detail Drawers */}
      {activeDrawer?.type === "student" && (
        <Student360Drawer
          data={drawerData}
          loading={drawerLoading}
          onClose={handleCloseDrawer}
          onSelectProject={(id) => handleOpenEntity("project", id)}
          onSelectTeam={(id) => handleOpenEntity("team", id)}
          onSelectHackathon={(id) => handleOpenEntity("hackathon", id)}
        />
      )}

      {activeDrawer?.type === "project" && (
        <Project360Drawer
          data={drawerData}
          loading={drawerLoading}
          onClose={handleCloseDrawer}
          onSelectStudent={(id) => handleOpenEntity("student", id)}
        />
      )}

      {activeDrawer?.type === "team" && (
        <Team360Drawer
          data={drawerData}
          loading={drawerLoading}
          onClose={handleCloseDrawer}
          onSelectStudent={(id) => handleOpenEntity("student", id)}
          onSelectProject={(id) => handleOpenEntity("project", id)}
          onSelectHackathon={(id) => handleOpenEntity("hackathon", id)}
        />
      )}

      {activeDrawer?.type === "hackathon" && (
        <Hackathon360Drawer
          data={drawerData}
          loading={drawerLoading}
          onClose={handleCloseDrawer}
          onSelectProject={(id) => handleOpenEntity("project", id)}
          onSelectTeam={(id) => handleOpenEntity("team", id)}
        />
      )}

    </div>
  );
}
