import { create } from "zustand";
import { io, Socket } from "socket.io-client";

export interface UserInfo {
  userId: string;
  name: string;
  password?: string;
  isSignup?: boolean;
  registerNumber?: string;
  phone?: string;
  section?: string;
  lab?: string;
  email: string;
  role: "coordinator" | "student" | "master_admin";
  accountStatus?: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED" | "LOCKED";
  lockReason?: string;
  avatar: string;
  department: string;
  preferredDomain?: string;
  year?: string;
  status: "pending" | "approved" | "rejected";
  githubUsername?: string;
  githubToken?: string;
  verificationCode?: string;
  skills?: string[];
  interestedCategories?: string[];
  appliedOpportunities?: string[];
  college?: string;
  notificationPreferences?: {
    newOpportunities: boolean;
    deadlineReminders: boolean;
  };
  createdAt?: string;
}


export interface MentorInfo {
  id?: string;
  _id?: string;
  mentorId: string;
  name: string;
  email: string;
  phone?: string;
  expertise: string;
  status: string;
}

export interface FileData {
  name: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: string;
}

export interface ProjectInfo {
  id: string;
  _id?: string;
  name: string;
  department: string;
  domain?: string;
  mentorId?: string;
  mentorName?: string;
  startDate?: string;
  deadline?: string;
  abstract: string;
  description: string;
  objectives: string;
  methodology: string;
  techStack: string[];
  modules: string;
  references: string;
  futureEnhancements: string;
  teamMembers: string[];
  teamLeader: string;
  progress: number;
  status: "Not Started" | "Planning" | "Development" | "Testing" | "Completed" | "On Hold" | "Active";
  files: FileData[];
  githubRepo?: string;
  createdAt?: string;
}

export interface DailyReportInfo {
  id?: string;
  _id?: string;
  projectId: string;
  studentId: string;
  studentName: string;
  date: string;
  objective?: string;
  workDone: string;
  challenges: string;
  solution?: string;
  technologies?: string[];
  codeCompleted?: string;
  nextDayPlan: string;
  progress: number;
  remarks?: string;
  githubCommitUrl?: string;
  githubCommitMessage?: string;
  attachmentUrl?: string;
  abstract?: string;
  createdAt?: string;
}

export interface HackathonInfo {
  id?: string;
  _id?: string;
  hackathonId: string;
  name: string;
  organizer: string;
  description: string;
  domain: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  registrationLink: string;
  status: string;
  event_type?: string;
  government_level?: string;
  tn_eligibility?: string;
  mode?: string;
  parent_ministry?: string;
  department?: string;
  organization?: string;
  state?: string;
  eligibility?: string[];
  source_info?: {
    url?: string;
    name?: string;
    type?: string;
    last_verified_at?: string;
    confidence?: string;
  };
}

export interface HackathonRegistrationInfo {
  id?: string;
  _id?: string;
  registrationId: string;
  hackathonId: string;
  hackathonName: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  registrationDate: string;
  screenshotUrl: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface ActivityAnalyticsInfo {
  studentId: string;
  studentName: string;
  registerNumber: string;
  department: string;
  preferredDomain: string;
  projectName: string;
  mentorName: string;
  progress: number;
  totalReports: number;
  lastReportDate: string;
  daysSinceLastReport: number | string;
  activityStatus: "Active" | "Warning" | "Needs Follow-up";
}

export interface TaskInfo {
  id: string;
  _id?: string;
  title: string;
  status: "Not Started" | "In Progress" | "Completed" | "Overdue";
  date: string;
  assigneeId: string;
  assigneeName: string;
  projectId: string;
  projectName: string;
  createdBy: string;
  priority: "low" | "medium" | "high";
  estimatedHours: number;
}

export interface NotificationInfo {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  type: "general" | "team";
  createdAt?: string;
}

export interface MessageInfo {
  id: string;
  _id?: string;
  user: string;
  userId: string;
  text: string;
  projectId: string;
  createdAt?: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface OpportunityInfo {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  organizer: string;
  organizerLogo: string;
  bannerImage: string;
  website: string;
  registrationLink: string;
  location: string;
  mode: "Online" | "Offline" | "Hybrid";
  freeOrPaid: "Free" | "Paid";
  targetAudience: "Student Only" | "College" | "International";
  prizePool: string;
  registrationDeadline: string;
  eventStartDate: string;
  eventEndDate: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  eligibility: string;
  timeline: string;
  rules: string;
  judgingCriteria: string;
  tags: string[];
  featured: boolean;
  trending: boolean;
  views: number;
  bookmarks: string[];
  submittedBy?: string;
  submittedByName?: string;
  approved?: boolean;
  event_type?: string;
  government_level?: string;
  tn_eligibility?: string;
  parent_ministry?: string;
  source_info?: {
    url?: string;
    name?: string;
    type?: string;
    last_verified_at?: string;
    confidence?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}


interface AppState {
  currentUser: UserInfo | null;
  activeProject: ProjectInfo | null;
  projects: ProjectInfo[];
  mentors: MentorInfo[];
  hackathons: HackathonInfo[];
  hackathonRegistrations: HackathonRegistrationInfo[];
  activityAnalytics: ActivityAnalyticsInfo[];
  tasks: TaskInfo[];
  notifications: NotificationInfo[];
  messages: MessageInfo[];
  socket: Socket | null;
  toasts: ToastMessage[];
  loading: boolean;

  opportunities: OpportunityInfo[];
  featuredOpportunities: { featured: OpportunityInfo[]; trending: OpportunityInfo[]; newest: OpportunityInfo[] } | null;
  bookmarkedOpportunities: OpportunityInfo[];
  
  // Actions
  addToast: (message: string, type: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;
  setLoading: (loading: boolean) => void;
  
  // Auth
  login: (userData: Partial<UserInfo>) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userId: string, data: Partial<UserInfo>) => Promise<boolean>;
  checkSession: () => void;

  // Coordinator approvals
  fetchApprovals: () => Promise<UserInfo[]>;
  approveStudent: (studentId: string, approve: boolean) => Promise<boolean>;

  // Mentors
  fetchMentors: () => Promise<void>;
  createMentor: (mentorData: Partial<MentorInfo>) => Promise<boolean>;
  assignMentorToProject: (projectId: string, mentorId: string) => Promise<boolean>;

  // GitHub Integration
  connectGithubRepo: (projectId: string, studentId: string, repositoryUrl: string) => Promise<boolean>;
  
  // Student Records
  fetchStudentRecords: () => Promise<any[]>;

  // Attendance & Lab Access
  fetchApprovedStudents: () => Promise<UserInfo[]>;
  quickAddStudent: (studentData: { name: string; email: string; department: string; year: string }) => Promise<boolean>;
  fetchAttendance: (date: string) => Promise<any[]>;
  saveAttendance: (date: string, records: Array<{ studentId: string; status: string }>) => Promise<boolean>;
  fetchActiveLabAccess: () => Promise<any[]>;
  checkInStudent: (studentId: string) => Promise<boolean>;
  checkOutStudent: (studentId: string) => Promise<boolean>;

  // Projects
  fetchProjects: () => Promise<void>;
  createProject: (name: string, department: string, domain?: string, mentorId?: string) => Promise<ProjectInfo | null>;
  updateProject: (projectId: string, updates: Partial<ProjectInfo>) => Promise<boolean>;
  uploadFile: (projectId: string, file: File) => Promise<boolean>;
  fetchAbstractHistory: (projectId: string) => Promise<any[]>;
  fetchDailyReports: (projectId: string) => Promise<DailyReportInfo[]>;
  fetchStudentDailyReportHistory: (studentId: string) => Promise<DailyReportInfo[]>;
  submitDailyReport: (reportData: Partial<DailyReportInfo>) => Promise<boolean>;
  checkDailyReportSubmittedToday: (studentId: string) => Promise<boolean>;
  analyzeProject: (projectData: any, githubStats: any) => Promise<string>;

  // Hackathons & Proof Verification
  fetchHackathons: () => Promise<void>;
  createHackathon: (hackathonData: Partial<HackathonInfo>) => Promise<boolean>;
  registerHackathonWithProof: (hackathonId: string, studentId: string, screenshotFile: File) => Promise<boolean>;
  fetchHackathonRegistrations: (studentId?: string) => Promise<void>;
  verifyHackathonRegistration: (registrationId: string, status: "Verified" | "Rejected", reason?: string) => Promise<boolean>;

  // Student Submitted Opportunities
  submitStudentOpportunity: (oppData: any) => Promise<boolean>;
  fetchPendingOpportunities: () => Promise<OpportunityInfo[]>;
  approveOpportunity: (oppId: string, approve: boolean) => Promise<boolean>;

  // Analytics
  fetchActivityAnalytics: () => Promise<void>;

  // Tasks
  fetchTasks: () => Promise<void>;
  createTask: (taskData: Partial<TaskInfo>) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<TaskInfo>) => Promise<boolean>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;

  // Chat
  fetchMessages: (projectId?: string) => Promise<void>;
  sendMessage: (text: string, projectId?: string) => Promise<void>;

  // Socket
  connectSocket: () => void;
  disconnectSocket: () => void;

  // Opportunities
  fetchOpportunities: (filters?: any) => Promise<void>;
  fetchOpportunityById: (id: string) => Promise<OpportunityInfo | null>;
  createOpportunity: (oppData: Partial<OpportunityInfo>) => Promise<boolean>;
  updateOpportunity: (oppId: string, updates: Partial<OpportunityInfo>) => Promise<boolean>;
  deleteOpportunity: (oppId: string) => Promise<boolean>;
  toggleBookmark: (opportunityId: string) => Promise<boolean>;
  toggleApply: (opportunityId: string) => Promise<boolean>;
  fetchBookmarks: () => Promise<void>;
  fetchRecommendations: (userId: string) => Promise<OpportunityInfo[]>;
  fetchCategoryCounts: () => Promise<any[]>;
  syncOpportunities: () => Promise<boolean>;

  // File Vault
  uploadFile: (projectId: string, file: File) => Promise<boolean>;

  // Master Control & Account Locking
  fetchMasterControlOverview: () => Promise<any>;
  lockStudentUser: (userId: string, reason?: string) => Promise<boolean>;
  unlockStudentUser: (userId: string) => Promise<boolean>;
  fetchMasterUsers: () => Promise<any>;
  addMasterAdmin: (name: string, email: string) => Promise<boolean>;
  approveCoordinator: (userId: string, approve: boolean) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
}


export const API_BASE = "";

export function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("trackflow_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function safeJson(response: Response, defaultFallback: any = {}) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  const text = await response.text();
  console.warn("API response was not JSON:", text.substring(0, 100));
  return defaultFallback;
}


export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  activeProject: null,
  projects: [],
  mentors: [],
  hackathons: [],
  hackathonRegistrations: [],
  activityAnalytics: [],
  tasks: [],
  notifications: [],
  messages: [],
  socket: null,
  toasts: [],
  loading: false,
  opportunities: [],
  featuredOpportunities: null,
  bookmarkedOpportunities: [],

  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setLoading: (loading) => set({ loading }),

  login: async (userData) => {
    get().setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      });
      const data = await safeJson(response, {});

      if (!response.ok) {
        throw new Error(data.error || `Server Error (${response.status}): Could not process login.`);
      }
      
      const user = data.user;
      set({ currentUser: user });
      localStorage.setItem("trackflow_user", JSON.stringify(user));
      if (data.token) {
        localStorage.setItem("trackflow_token", data.token);
      }
      
      get().addToast(`Logged in successfully as ${user.name}`, "success");
      
      // Connect to socket and parallelize initial data fetching
      get().connectSocket();
      
      const fetchPromises: Promise<any>[] = [get().fetchNotifications()];
      if (user.role === "student" && user.status === "approved") {
        fetchPromises.push(
          fetch(`${API_BASE}/api/projects?role=student&userId=${user.userId}`, { headers: getAuthHeaders() })
            .then(r => r.json())
            .then(projData => {
              if (projData.projects && projData.projects.length > 0) {
                set({ activeProject: projData.projects[0] });
              }
            })
            .catch(() => {})
        );
      }
      await Promise.all(fetchPromises);
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    } finally {
      get().setLoading(false);
    }
  },

  logout: () => {
    get().disconnectSocket();
    localStorage.removeItem("trackflow_user");
    localStorage.removeItem("trackflow_token");
    set({ currentUser: null, activeProject: null, projects: [], tasks: [], notifications: [], messages: [] });
    get().addToast("Logged out successfully", "info");
  },

  updateProfile: async (userId, data) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Update failed");
      }
      set({ currentUser: resData.user });
      localStorage.setItem("trackflow_user", JSON.stringify(resData.user));
      get().addToast("Profile updated successfully", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  checkSession: () => {
    const saved = localStorage.getItem("trackflow_user");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        set({ currentUser: user });
        get().connectSocket();
        get().fetchNotifications();
        
        if (user.role === "student" && user.status === "approved") {
          // Fetch student project
          fetch(`${API_BASE}/api/projects?role=student&userId=${user.userId}`)
            .then(r => r.json())
            .then(data => {
              if (data.projects && data.projects.length > 0) {
                set({ activeProject: data.projects[0] });
              }
            }).catch(() => {});
        }
      } catch (e) {
        localStorage.removeItem("trackflow_user");
      }
    }
  },

  fetchApprovals: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/approvals`, { headers: getAuthHeaders() });
      const data = await response.json();
      return data.requests || [];
    } catch (e) {
      return [];
    }
  },

  approveStudent: async (studentId, approve) => {
    try {
      const response = await fetch(`${API_BASE}/api/approvals/${studentId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: approve ? "approved" : "rejected" }),
      });
      if (!response.ok) throw new Error("Approval update failed");
      get().addToast(approve ? "Approved student request" : "Rejected student request", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  // Mentors Actions
  fetchMentors: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/mentors`, { headers: getAuthHeaders() });
      const data = await response.json();
      set({ mentors: data.mentors || [] });
    } catch (e) {}
  },

  createMentor: async (mentorData) => {
    try {
      const response = await fetch(`${API_BASE}/api/mentors`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(mentorData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create mentor");
      get().addToast("Mentor created successfully", "success");
      get().fetchMentors();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  assignMentorToProject: async (projectId, mentorId) => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/assign-mentor`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ mentorId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to assign mentor");
      get().addToast("Mentor assigned successfully to project", "success");
      get().fetchProjects();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  // GitHub Actions
  connectGithubRepo: async (projectId, studentId, repositoryUrl) => {
    try {
      const response = await fetch(`${API_BASE}/api/github-repo/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, studentId, repositoryUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to connect GitHub repository");
      get().addToast(data.message || "GitHub repository connected successfully!", "success");
      get().fetchProjects();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  // Hackathon Actions
  fetchHackathons: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/hackathons`);
      const data = await response.json();
      set({ hackathons: data.hackathons || [] });
    } catch (e) {}
  },

  createHackathon: async (hackathonData) => {
    try {
      const response = await fetch(`${API_BASE}/api/hackathons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hackathonData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create hackathon");
      get().addToast("Hackathon created successfully", "success");
      get().fetchHackathons();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  registerHackathonWithProof: async (hackathonId, studentId, screenshotFile) => {
    if (!screenshotFile) {
      get().addToast("Registration Screenshot Required! Upload proof screenshot.", "error");
      return false;
    }

    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("screenshot", screenshotFile);

      const response = await fetch(`${API_BASE}/api/hackathons/${hackathonId}/register`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit hackathon registration proof");
      get().addToast(data.message || "Registration proof uploaded successfully! Pending coordinator verification.", "success");
      get().fetchHackathonRegistrations(studentId);
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  fetchHackathonRegistrations: async (studentId) => {
    try {
      const query = studentId ? `?studentId=${studentId}` : "";
      const response = await fetch(`${API_BASE}/api/hackathons/registrations${query}`);
      const data = await response.json();
      set({ hackathonRegistrations: data.registrations || [] });
    } catch (e) {}
  },

  verifyHackathonRegistration: async (registrationId, status, reason) => {
    const user = get().currentUser;
    try {
      const response = await fetch(`${API_BASE}/api/hackathons/registrations/${registrationId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: status, rejectionReason: reason, coordinatorId: user?.userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed");
      get().addToast(status === "Verified" ? "Registration verified successfully" : "Registration rejected", "success");
      get().fetchHackathonRegistrations();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  // Student Opportunities Actions
  submitStudentOpportunity: async (oppData) => {
    try {
      const response = await fetch(`${API_BASE}/api/opportunities/student-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oppData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit opportunity");
      get().addToast(data.message || "Opportunity submitted for coordinator approval", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  fetchPendingOpportunities: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/opportunities/pending`);
      const data = await response.json();
      return data.opportunities || [];
    } catch (e) {
      return [];
    }
  },

  approveOpportunity: async (oppId, approve) => {
    try {
      const response = await fetch(`${API_BASE}/api/opportunities/${oppId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update opportunity approval");
      get().addToast(approve ? "Opportunity approved and published" : "Opportunity request declined", "info");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  // Analytics Actions
  fetchActivityAnalytics: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/activity`);
      const data = await response.json();
      set({ activityAnalytics: data.analytics || [] });
    } catch (e) {}
  },

  fetchStudentRecords: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/student-records`);
      const data = await response.json();
      return data.records || [];
    } catch (e) {
      return [];
    }
  },

  fetchApprovedStudents: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/students`);
      const data = await response.json();
      return data.students || [];
    } catch (e) {
      return [];
    }
  },

  quickAddStudent: async (studentData) => {
    get().setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/quick-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add student");
      get().addToast("Student profile created and approved successfully", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    } finally {
      get().setLoading(false);
    }
  },

  fetchAttendance: async (date) => {
    try {
      const response = await fetch(`${API_BASE}/api/attendance?date=${date}`);
      const data = await response.json();
      return data.attendance || [];
    } catch (e) {
      return [];
    }
  },

  saveAttendance: async (date, records) => {
    const user = get().currentUser;
    if (!user) {
      get().addToast("Authentication error: You are not logged in.", "error");
      return false;
    }
    try {
      const response = await fetch(`${API_BASE}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records, markedBy: user.userId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save attendance");
      get().addToast("Attendance saved successfully", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  fetchActiveLabAccess: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/lab-access/active`);
      const data = await response.json();
      return data.activeLogs || [];
    } catch (e) {
      return [];
    }
  },

  checkInStudent: async (studentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/lab-access/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to check in");
      get().addToast("Student checked in to lab", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  checkOutStudent: async (studentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/lab-access/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to check out");
      get().addToast("Student checked out of lab", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  fetchProjects: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const query = user.role === "student" ? `?role=student&userId=${user.userId}` : "";
      const response = await fetch(`${API_BASE}/api/projects${query}`);
      const data = await response.json();
      set({ projects: data.projects || [] });
      if (user.role === "student" && data.projects && data.projects.length > 0) {
        set({ activeProject: data.projects[0] });
      }
    } catch (e) {}
  },

  createProject: async (name, department, domain, mentorId) => {
    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department, domain, mentorId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create project");
      get().addToast("Project created successfully", "success");
      get().fetchProjects();
      return data.project;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return null;
    }
  },

  updateProject: async (projectId, updates) => {
    const user = get().currentUser;
    if (!user) return false;
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, role: user.role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      
      get().addToast("Project updated successfully", "success");
      if (get().activeProject?.id === projectId || get().activeProject?._id === projectId) {
        set({ activeProject: data.project });
      }
      get().fetchProjects();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  uploadFile: async (projectId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      get().addToast("File uploaded successfully", "success");
      if (get().activeProject?.id === projectId || get().activeProject?._id === projectId) {
        set((state) => ({
          activeProject: state.activeProject
            ? { ...state.activeProject, files: data.files }
            : null,
        }));
      }
      get().fetchProjects();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  fetchAbstractHistory: async (projectId) => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/abstracts`);
      const data = await response.json();
      return data.history || [];
    } catch (e) {
      return [];
    }
  },

  fetchDailyReports: async (projectId) => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/daily-reports`);
      const data = await response.json();
      return data.reports || [];
    } catch (e) {
      return [];
    }
  },

  fetchStudentDailyReportHistory: async (studentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/daily-reports/history/${studentId}`);
      const data = await response.json();
      return data.reports || [];
    } catch (e) {
      return [];
    }
  },

  submitDailyReport: async (reportData) => {
    try {
      const response = await fetch(`${API_BASE}/api/daily-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit daily report");
      get().addToast("Daily report submitted successfully", "success");
      
      // Update local active project state with new progress and abstract
      if (get().activeProject) {
        set((state) => ({
          activeProject: state.activeProject
            ? {
                ...state.activeProject,
                progress: reportData.progress,
                abstract: reportData.abstract,
              }
            : null,
        }));
      }
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  checkDailyReportSubmittedToday: async (studentId) => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const response = await fetch(`${API_BASE}/api/daily-reports/check-today?studentId=${studentId}&date=${todayStr}`);
      const data = await response.json();
      return !!data.submitted;
    } catch (e) {
      return false;
    }
  },

  analyzeProject: async (projectData, githubStats) => {
    try {
      const response = await fetch(`${API_BASE}/api/ai/analyze-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectData, githubStats }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI analysis failed");
      return data.analysis;
    } catch (e: any) {
      return "Unable to perform AI analysis at this time. Project progress is healthy, ensure you are tracking all tasks on time.";
    }
  },

  fetchTasks: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const query = user.role === "student" ? `?role=student&userId=${user.userId}` : "";
      const response = await fetch(`${API_BASE}/api/tasks${query}`);
      const data = await response.json();
      set({ tasks: data.tasks || [] });
    } catch (e) {}
  },

  createTask: async (taskData) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create task");
      get().addToast("Task created successfully", "success");
      get().fetchTasks();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update task");
      get().addToast("Task updated successfully", "success");
      get().fetchTasks();
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  fetchNotifications: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/api/notifications?userId=${user.userId}`);
      const data = await response.json();
      set({ notifications: data.notifications || [] });
    } catch (e) {}
  },

  markNotificationRead: async (notificationId) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${notificationId}`, { method: "PUT" });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId || n._id === notificationId ? { ...n, read: true } : n
        ),
      }));
    } catch (e) {}
  },

  fetchMessages: async (projectId) => {
    try {
      const query = projectId ? `?projectId=${projectId}` : "";
      const response = await fetch(`${API_BASE}/api/messages${query}`);
      const data = await response.json();
      set({ messages: data.messages || [] });
    } catch (e) {}
  },

  sendMessage: async (text, projectId) => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: user.name,
          userId: user.userId,
          text,
          projectId: projectId || "",
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
    } catch (e: any) {
      get().addToast(e.message, "error");
    }
  },

  connectSocket: () => {
    const socket = io(API_BASE);
    set({ socket });

    socket.on("connect", () => {
      console.log("Socket connected client side");
      const user = get().currentUser;
      if (user && user.role === "student") {
        // Fetch project and join project room
        fetch(`${API_BASE}/api/projects?role=student&userId=${user.userId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.projects && data.projects.length > 0) {
              const projectId = data.projects[0]._id || data.projects[0].id;
              socket.emit("join_project", projectId);
            }
          })
          .catch(() => {});
      }
    });

    socket.on("receive_message", (msg) => {
      set((state) => ({ messages: [...state.messages, msg] }));
    });

    socket.on("receive_message_global", (msg) => {
      // Add global messages only if not in team chat
      set((state) => ({ messages: [...state.messages, msg] }));
    });

    socket.on("project_updated", ({ projectId, project }) => {
      const currentProj = get().activeProject;
      if (currentProj && (currentProj.id === projectId || currentProj._id === projectId)) {
        set({ activeProject: project });
      }
      get().fetchProjects();
    });

    // Background notification fetch on changes
    socket.on("notification_received", () => {
      get().fetchNotifications();
    });

    socket.on("opportunities_updated", () => {
      get().fetchOpportunities();
    });
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (s) {
      s.disconnect();
      set({ socket: null });
    }
  },

  fetchOpportunities: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, String(val));
      });
      const res = await fetch(`${API_BASE}/api/opportunities?${params.toString()}`);
      const data = await res.json();
      if (data.opportunities) {
        set({ opportunities: data.opportunities });
      }
    } catch (err) {}
  },

  fetchOpportunityById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/${id}`);
      const data = await res.json();
      return data.opportunity || null;
    } catch (err) {
      return null;
    }
  },

  createOpportunity: async (oppData) => {
    get().setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oppData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create opportunity");
      get().addToast("Opportunity created successfully", "success");
      get().fetchOpportunities();
      return true;
    } catch (err: any) {
      get().addToast(err.message, "error");
      return false;
    } finally {
      get().setLoading(false);
    }
  },

  updateOpportunity: async (oppId, updates) => {
    get().setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/${oppId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update opportunity");
      get().addToast("Opportunity updated successfully", "success");
      get().fetchOpportunities();
      return true;
    } catch (err: any) {
      get().addToast(err.message, "error");
      return false;
    } finally {
      get().setLoading(false);
    }
  },

  deleteOpportunity: async (oppId) => {
    get().setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/${oppId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete opportunity");
      get().addToast("Opportunity deleted successfully", "success");
      get().fetchOpportunities();
      return true;
    } catch (err: any) {
      get().addToast(err.message, "error");
      return false;
    } finally {
      get().setLoading(false);
    }
  },

  toggleBookmark: async (opportunityId) => {
    const user = get().currentUser;
    if (!user) {
      get().addToast("You must be logged in to bookmark opportunities", "error");
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/api/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, userId: user.userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bookmark");
      
      get().addToast(data.bookmarked ? "Opportunity saved to bookmarks" : "Opportunity removed from bookmarks", "success");
      get().fetchBookmarks();
      
      set((state) => ({
        opportunities: state.opportunities.map((o) => {
          if (o.id === opportunityId || o._id === opportunityId) {
            const bookmarks = data.bookmarked
              ? [...(o.bookmarks || []), user.userId]
              : (o.bookmarks || []).filter((id) => id !== user.userId);
            return { ...o, bookmarks };
          }
          return o;
        }),
      }));
      return true;
    } catch (err: any) {
      get().addToast(err.message, "error");
      return false;
    }
  },

  toggleApply: async (opportunityId) => {
    const user = get().currentUser;
    if (!user) {
      get().addToast("You must be logged in to apply", "error");
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/${opportunityId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply");

      get().addToast(data.applied ? "Successfully applied to opportunity!" : "Application withdrawn", "success");
      
      if (data.user) {
        set({ currentUser: data.user });
        localStorage.setItem("trackflow_user", JSON.stringify(data.user));
      }
      return true;
    } catch (err: any) {
      get().addToast(err.message, "error");
      return false;
    }
  },

  fetchBookmarks: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/bookmarks?userId=${user.userId}`);
      const data = await res.json();
      if (data.bookmarks) {
        set({ bookmarkedOpportunities: data.bookmarks });
      }
    } catch (err) {}
  },

  fetchRecommendations: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/recommendations/${userId}`);
      const data = await res.json();
      return data.recommendations || [];
    } catch (err) {
      return [];
    }
  },

  fetchCategoryCounts: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();
      return data.categories || [];
    } catch (err) {
      return [];
    }
  },

  syncOpportunities: async () => {
    get().setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/opportunities/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      get().addToast("Successfully fetched latest hackathons!", "success");
      get().fetchOpportunities();
      get().fetchCategoryCounts().then(cats => {
        // Also refresh counts
      });
      const user = get().currentUser;
      if (user) {
        get().fetchRecommendations(user.userId);
      }
      return true;
    } catch (err: any) {
      get().addToast("Failed to sync live data: " + err.message, "error");
      return false;
    } finally {
      get().setLoading(false);
    }
  },

  fetchMasterControlOverview: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/master-control/overview`, { headers: getAuthHeaders() });
      const data = await response.json();
      return data;
    } catch (e: any) {
      get().addToast("Failed to fetch Master Control overview", "error");
      return null;
    }
  },

  lockStudentUser: async (userId: string, reason?: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/lock`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lock failed");
      get().addToast("Student account locked successfully", "info");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  fetchMasterUsers: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/master-control/users`, { headers: getAuthHeaders() });
      const data = await response.json();
      return data;
    } catch (e: any) {
      return null;
    }
  },

  addMasterAdmin: async (name: string, email: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/master-control/add-master`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add Master Admin");
      get().addToast(data.message || "Master Admin added successfully", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  approveCoordinator: async (userId: string, approve: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/api/master-control/approve-coordinator/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ approve }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update teacher approval");
      get().addToast(approve ? "Approved Admin Teacher account" : "Declined Teacher registration", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed");
      get().addToast("User removed successfully", "info");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  unlockStudentUser: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/unlock`, {
        method: "PUT",
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unlock failed");
      get().addToast("Student account unlocked successfully", "success");
      return true;
    } catch (e: any) {
      get().addToast(e.message, "error");
      return false;
    }
  },

  uploadFile: async (projectId: string, file: File) => {
    try {
      get().setLoading(true);
      get().addToast(`Uploading "${file.name}" to File Vault...`, "info");
      const formData = new FormData();
      formData.append("file", file);

      const token = typeof window !== "undefined" ? localStorage.getItem("trackflow_token") : null;
      const headers: any = token ? { "Authorization": `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE}/api/projects/${projectId}/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await safeJson(response, {});
      if (!response.ok) {
        throw new Error(data.error || "File upload failed");
      }

      get().addToast(`File "${file.name}" uploaded successfully!`, "success");

      // Refresh active project files in store
      const projRes = await fetch(`${API_BASE}/api/projects`, { headers: getAuthHeaders() });
      const projData = await safeJson(projRes, {});
      if (projData.projects) {
        set({ projects: projData.projects });
        const updated = projData.projects.find((p: any) => p._id === projectId || p.id === projectId);
        if (updated) set({ activeProject: updated });
      }
      return true;
    } catch (e: any) {
      get().addToast(e.message || "File upload failed", "error");
      return false;
    } finally {
      get().setLoading(false);
    }
  },
}));

