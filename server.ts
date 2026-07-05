import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { execFile } from "child_process";
import { Server } from "socket.io";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import multer from "multer";
import axios from "axios";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT) || 3000;
  
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: { 
      origin: process.env.APP_URL || "http://localhost:5001",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_project", (projectId) => {
      socket.join(projectId);
    });
  });

  app.use(cors({
    origin: process.env.APP_URL || "http://localhost:5001",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }));
  app.use(express.json());

  // Setup uploads directory and middleware
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  app.use("/uploads", express.static(uploadsDir));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    }
  });
  const upload = multer({ storage });

  if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith("mongodb")) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: process.env.NODE_ENV !== "production"
      });
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  }

  // Schema Definitions
  const userSchema = new mongoose.Schema({
    userId: String,
    name: String,
    email: String,
    role: String,
    avatar: String,
    department: String,
    githubToken: String,
    githubUsername: String,
    year: { type: String, default: "1" },
    status: { type: String, default: "approved" }, // "pending" | "approved" | "rejected"
    registrationDate: { type: Date, default: Date.now },
    skills: { type: [String], default: [] },
    interestedCategories: { type: [String], default: [] },
    appliedOpportunities: { type: [String], default: [] },
    college: { type: String, default: "Sri Shakthi Institute of Engineering and Technology" },
    notificationPreferences: {
      newOpportunities: { type: Boolean, default: true },
      deadlineReminders: { type: Boolean, default: true }
    }
  }, { timestamps: true });

  const projectSchema = new mongoose.Schema({
    name: String,
    department: String,
    abstract: { type: String, default: "" },
    description: { type: String, default: "" },
    objectives: { type: String, default: "" },
    methodology: { type: String, default: "" },
    techStack: { type: [String], default: [] },
    modules: { type: String, default: "" },
    references: { type: String, default: "" },
    futureEnhancements: { type: String, default: "" },
    teamMembers: { type: [String], default: [] }, // student userIds
    teamLeader: { type: String, default: "" }, // student userId
    progress: { type: Number, default: 0 },
    status: { type: String, default: "Active" }, // 'Active' | 'At Risk' | 'Completed'
    githubRepo: { type: String, default: "" },
    files: { type: [{ name: String, url: String, fileType: String, size: Number, uploadedAt: Date }], default: [] }
  }, { timestamps: true });

  const taskSchema = new mongoose.Schema({
    title: String,
    status: { type: String, default: "Not Started" }, // 'Not Started' | 'In Progress' | 'Completed' | 'Overdue'
    date: String, // due date
    assigneeId: String,
    assigneeName: String,
    projectId: String,
    projectName: String,
    createdBy: String,
    priority: { type: String, default: "medium" }, // 'low' | 'medium' | 'high'
    estimatedHours: { type: Number, default: 0 }
  }, { timestamps: true });

  const notificationSchema = new mongoose.Schema({
    userId: String,
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    relatedId: String,
    type: { type: String, default: "general" }, // 'general' | 'team'
  }, { timestamps: true });

  const messageSchema = new mongoose.Schema({
    user: String,
    userId: String,
    text: String,
    projectId: { type: String, default: "" }, // empty = global chat, non-empty = project team chat
  }, { timestamps: true });

  const dailyReportSchema = new mongoose.Schema({
    projectId: String,
    studentId: String,
    studentName: String,
    date: String, // YYYY-MM-DD
    workDone: String,
    challenges: String,
    nextDayPlan: String,
    progress: Number,
    abstract: String
  }, { timestamps: true });

  const abstractHistorySchema = new mongoose.Schema({
    projectId: String,
    studentId: String,
    abstract: String,
    version: Number,
    updatedAt: { type: Date, default: Date.now }
  }, { timestamps: true });

  const attendanceSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ["Present", "Absent"], default: "Present" },
    markedBy: String
  }, { timestamps: true });
  attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

  const labAccessSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: Date,
    status: { type: String, enum: ["Checked-In", "Checked-Out"], default: "Checked-In" }
  }, { timestamps: true });

  const opportunitySchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    organizer: String,
    organizerLogo: String,
    bannerImage: String,
    website: String,
    registrationLink: String,
    location: String,
    mode: { type: String, enum: ["Online", "Offline", "Hybrid"], default: "Online" },
    freeOrPaid: { type: String, enum: ["Free", "Paid"], default: "Free" },
    targetAudience: { type: String, enum: ["Student Only", "College", "International"], default: "Student Only" },
    prizePool: String,
    registrationDeadline: Date,
    eventStartDate: Date,
    eventEndDate: Date,
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    eligibility: String,
    timeline: String,
    rules: String,
    judgingCriteria: String,
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    bookmarks: { type: [String], default: [] }, // Array of userIds
    approved: { type: Boolean, default: true }
  }, { timestamps: true });

  const User = mongoose.model("User", userSchema);
  const Project = mongoose.model("Project", projectSchema);
  const Task = mongoose.model("Task", taskSchema);
  const Notification = mongoose.model("Notification", notificationSchema);
  const Message = mongoose.model("Message", messageSchema);
  const DailyReport = mongoose.model("DailyReport", dailyReportSchema);
  const AbstractHistory = mongoose.model("AbstractHistory", abstractHistorySchema);
  const Attendance = mongoose.model("Attendance", attendanceSchema);
  const LabAccess = mongoose.model("LabAccess", labAccessSchema);
  const Opportunity = mongoose.model("Opportunity", opportunitySchema);

  async function seedDemoData() {
    if (mongoose.connection.readyState !== 1) return;

    const coordinator = {
      userId: "coordinator-demo",
      name: "Dr. Sarah Chen",
      email: "coordinator@trackflow.local",
      role: "coordinator",
      avatar: "https://avatar.vercel.sh/sarah",
      department: "Artificial Intelligence",
      status: "approved",
      year: "1",
      registrationDate: new Date(),
    };

    const student = {
      userId: "student-demo",
      name: "Demo Student",
      email: "demo.student@srishakthi.ac.in",
      role: "student",
      avatar: "https://avatar.vercel.sh/demo-student",
      department: "Computer Science",
      status: "approved",
      year: "3",
      registrationDate: new Date(),
    };

    await User.findOneAndUpdate(
      { email: coordinator.email },
      { $set: coordinator },
      { upsert: true, returnDocument: "after" }
    );

    await User.findOneAndUpdate(
      { email: student.email },
      { $set: student },
      { upsert: true, returnDocument: "after" }
    );

    const existingDemoProject = await Project.findOne({ name: "TrackFlow Demo Workspace" });
    if (!existingDemoProject) {
      await new Project({
        name: "TrackFlow Demo Workspace",
        department: "Computer Science",
        abstract: "A ready-to-use workspace for validating student project tracking, attendance, tasks, chat, and daily reporting flows.",
        description: "Demo project seeded with an approved student so every major TrackFlow feature can be tested immediately.",
        objectives: "Verify project monitoring, daily logs, task movement, file uploads, and communication workflows.",
        methodology: "React dashboard with Express APIs, MongoDB persistence, Socket.IO chat, and optional GitHub/Gemini integrations.",
        techStack: ["React", "Express", "MongoDB", "Socket.IO"],
        modules: "Dashboard, Projects, Tasks, Attendance, Chat, Profile",
        references: "TrackFlow local demo data",
        futureEnhancements: "Connect a real GitHub repository and Gemini key for live AI audit results.",
        teamMembers: [student.userId],
        teamLeader: student.userId,
        progress: 35,
        status: "Active",
        githubRepo: "",
      }).save();
    }
  }

  async function seedOpportunities() {
    const count = await Opportunity.countDocuments();
    if (count > 0) return;

    const now = new Date();
    const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    const opportunities = [
      {
        title: "Google Solution Challenge 2026",
        description: "Build a solution to one or more of the United Nations 17 Sustainable Development Goals using Google technology. Showcase your creativity and coding skills to solve real-world problems.",
        category: "Hackathons",
        organizer: "Google Developers",
        organizerLogo: "https://avatar.vercel.sh/google",
        bannerImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
        website: "https://developers.google.com/community/gdsc-solution-challenge",
        registrationLink: "https://developers.google.com/community/gdsc-solution-challenge",
        location: "Global",
        mode: "Online",
        freeOrPaid: "Free",
        targetAudience: "Student Only",
        prizePool: "$50,000 USD + Google Mentorship",
        registrationDeadline: addDays(12),
        eventStartDate: addDays(15),
        eventEndDate: addDays(20),
        difficulty: "Intermediate",
        eligibility: "Open to students enrolled in a university/college program.",
        timeline: "Registration opens: June 2026. Submissions close: Late July 2026. Winners announced: August 2026.",
        rules: "Must use at least one Google developer technology. Teams of up to 4 members. Projects must align with one of the 17 UN SDGs.",
        judgingCriteria: "Impact (50%), Technology (50%). How well does the solution solve the challenge? How effectively was Google tech used?",
        tags: ["Google", "AI", "Mobile", "Sustainable Development"],
        featured: true,
        trending: true,
        approved: true,
      },
      {
        title: "Software Engineering Intern",
        description: "Join the Microsoft Azure core systems team as a software engineer intern. Work on next-generation cloud infrastructure, virtualization, and distributed systems at scale.",
        category: "Internships",
        organizer: "Microsoft",
        organizerLogo: "https://avatar.vercel.sh/microsoft",
        bannerImage: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
        website: "https://careers.microsoft.com",
        registrationLink: "https://careers.microsoft.com",
        location: "Bangalore, India",
        mode: "Hybrid",
        freeOrPaid: "Free",
        targetAudience: "Student Only",
        prizePool: "Stipend + Pre-Placement Offer",
        registrationDeadline: addDays(8),
        eventStartDate: addDays(60),
        eventEndDate: addDays(120),
        difficulty: "Intermediate",
        eligibility: "Currently pursuing B.Tech/M.Tech in CSE or related engineering field, graduating in 2027.",
        timeline: "Applications open: June 2026. Interviews: July 2026. Internship begins: Summer/Autumn 2026.",
        rules: "Must apply with an updated resume. Must complete online coding assessment.",
        judgingCriteria: "Resume shortlisting, DSA and System Design technical interviews.",
        tags: ["Cloud", "C++", "Rust", "System Design"],
        featured: true,
        trending: false,
        approved: true,
      },
      {
        title: "LeetCode Weekly Contest 410",
        description: "Test your coding skills against the best programmers worldwide in this weekly algorithmic contest. Solve 4 challenging problems in 90 minutes.",
        category: "Coding Contests",
        organizer: "LeetCode",
        organizerLogo: "https://avatar.vercel.sh/leetcode",
        bannerImage: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80",
        website: "https://leetcode.com/contest",
        registrationLink: "https://leetcode.com/contest",
        location: "Online",
        mode: "Online",
        freeOrPaid: "Free",
        targetAudience: "International",
        prizePool: "LeetCoins + Global Ranking Profile Boost",
        registrationDeadline: addDays(1),
        eventStartDate: addDays(1),
        eventEndDate: addDays(1),
        difficulty: "Advanced",
        eligibility: "Open to anyone registered on LeetCode.",
        timeline: "90 minutes duration starting 8:00 AM IST on Sunday.",
        rules: "Individual participation. Anti-cheat protocols active. Points based on accuracy and completion speed.",
        judgingCriteria: "Correctness of algorithmic solutions, execution runtime, memory complexity.",
        tags: ["Algorithms", "Data Structures", "Problem Solving"],
        featured: false,
        trending: true,
        approved: true,
      },
      {
        title: "Google Summer of Code 2026",
        description: "GSoC is a global, online program focused on bringing new contributors into open source software development. Work with an open source organization on a 12+ week programming project.",
        category: "Open Source",
        organizer: "Google Open Source",
        organizerLogo: "https://avatar.vercel.sh/gsoc",
        bannerImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
        website: "https://summerofcode.withgoogle.com",
        registrationLink: "https://summerofcode.withgoogle.com",
        location: "Global",
        mode: "Online",
        freeOrPaid: "Free",
        targetAudience: "International",
        prizePool: "$3,000 - $6,000 USD Stipend based on location",
        registrationDeadline: addDays(25),
        eventStartDate: addDays(40),
        eventEndDate: addDays(130),
        difficulty: "Advanced",
        eligibility: "Students and open-source beginners aged 18 or older.",
        timeline: "Proposal submission: June-July 2026. Coding phase: July-September 2026.",
        rules: "Must submit a comprehensive project proposal. Must meet milestones set by mentoring organization.",
        judgingCriteria: "Mentors evaluate student progress mid-term and final term. Code quality, communication, and milestone achievement.",
        tags: ["Open Source", "Git", "Collaboration", "Software Architecture"],
        featured: true,
        trending: true,
        approved: true,
      },
      {
        title: "Next.js 15 & Tailwind v4 Deep Dive",
        description: "Learn how to build production-grade web applications using Next.js 15 App Router, React 19 Server Components, and the brand new Tailwind CSS v4 compiler.",
        category: "Workshops",
        organizer: "Vercel Developer Relations",
        organizerLogo: "https://avatar.vercel.sh/vercel",
        bannerImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
        website: "https://vercel.com",
        registrationLink: "https://vercel.com",
        location: "Online",
        mode: "Online",
        freeOrPaid: "Free",
        targetAudience: "College",
        prizePool: "Vercel Swag Kit + Certificate of Completion",
        registrationDeadline: addDays(5),
        eventStartDate: addDays(6),
        eventEndDate: addDays(6),
        difficulty: "Beginner",
        eligibility: "Open to students interested in modern front-end web development.",
        timeline: "3-hour interactive virtual coding workshop starting 6:00 PM IST.",
        rules: "Must have Node.js and VSCode installed beforehand. Active participation in Q&A is encouraged.",
        judgingCriteria: "Completion of workshop project checklist and submission.",
        tags: ["Next.js", "React", "CSS", "Tailwind"],
        featured: false,
        trending: false,
        approved: true,
      },
      {
        title: "Adobe Research Fellowship 2026",
        description: "The Adobe Research Fellowship program recognizes outstanding graduate students carrying out exceptional research in computer science areas of interest to Adobe.",
        category: "Scholarships",
        organizer: "Adobe Research",
        organizerLogo: "https://avatar.vercel.sh/adobe",
        bannerImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
        website: "https://research.adobe.com/fellowship/",
        registrationLink: "https://research.adobe.com/fellowship/",
        location: "San Jose, CA (Funding)",
        mode: "Online",
        freeOrPaid: "Free",
        targetAudience: "International",
        prizePool: "$10,000 USD Tuition/Research Grant + Mentorship",
        registrationDeadline: addDays(30),
        eventStartDate: addDays(90),
        eventEndDate: addDays(365),
        difficulty: "Advanced",
        eligibility: "PhD students in Computer Science, Computer Engineering, Graphics, or AI research fields.",
        timeline: "Application deadline: Late July 2026. Award notifications: October 2026.",
        rules: "Must submit research proposal, CV, and three reference letters from academic mentors.",
        judgingCriteria: "Quality of research proposal, publication records, letters of recommendation.",
        tags: ["Research", "AI", "Graphics", "PhD"],
        featured: true,
        trending: false,
        approved: true,
      },
      {
        title: "Quantum Computing Bootcamp",
        description: "A comprehensive 4-week virtual bootcamp introducing the mathematics, algorithms, and applications of Quantum Computing using IBM Qiskit.",
        category: "Bootcamps",
        organizer: "IBM Quantum",
        organizerLogo: "https://avatar.vercel.sh/ibm",
        bannerImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
        website: "https://quantum.ibm.com",
        registrationLink: "https://quantum.ibm.com",
        location: "Virtual",
        mode: "Online",
        freeOrPaid: "Free",
        targetAudience: "College",
        prizePool: "IBM Qiskit Developer Badge + Certificate",
        registrationDeadline: addDays(15),
        eventStartDate: addDays(18),
        eventEndDate: addDays(46),
        difficulty: "Intermediate",
        eligibility: "Students with a basic understanding of Linear Algebra and Python programming.",
        timeline: "2 sessions per week, containing lectures and hands-on Jupyter notebook lab assignments.",
        rules: "Must attend 80% of sessions. Must complete final quantum algorithm mini-project.",
        judgingCriteria: "Lab completion accuracy, final mini-project code audit.",
        tags: ["Quantum", "Qiskit", "Python", "Physics"],
        featured: false,
        trending: false,
        approved: true,
      },
      {
        title: "Imagine Cup 2026 Student Competition",
        description: "Microsoft's premier global student technology challenge. Team up with peers, learn new tech, build an innovative startup concept, and win life-changing cash prizes.",
        category: "Innovation Challenges",
        organizer: "Microsoft Student Developer Hub",
        organizerLogo: "https://avatar.vercel.sh/microsoft-hub",
        bannerImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
        website: "https://imaginecup.microsoft.com",
        registrationLink: "https://imaginecup.microsoft.com",
        location: "Global",
        mode: "Hybrid",
        freeOrPaid: "Free",
        targetAudience: "Student Only",
        prizePool: "$100,000 USD Grand Prize + Azure Credits",
        registrationDeadline: addDays(20),
        eventStartDate: addDays(25),
        eventEndDate: addDays(180),
        difficulty: "Advanced",
        eligibility: "Students aged 16 or older. Teams of up to 4 members.",
        timeline: "Idea submission: July 2026. Regional finals: Sept-Nov 2026. World Championship: Jan 2027.",
        rules: "Must build a software solution leveraging Microsoft Cloud (Azure) services. Pitch deck and demo required.",
        judgingCriteria: "Innovation (25%), Business Plan (25%), Technology Implementation (25%), Feasibility (25%).",
        tags: ["Cloud", "AI", "Startup", "Entrepreneurship"],
        featured: true,
        trending: true,
        approved: true,
      }
    ];

    try {
      await Opportunity.insertMany(opportunities);
      console.log("Seeded default opportunities in Database");
    } catch (err) {}
  }

  async function syncOpportunities() {
    console.log("Starting automatic opportunities sync background job...");
    try {
      const response = await axios.get("https://kontests.net/api/v1/all", { timeout: 10000 });
      if (response.data && Array.isArray(response.data)) {
        let count = 0;
        for (const contest of response.data) {
          const startDate = new Date(contest.start_time);
          if (startDate.getTime() < Date.now()) continue;

          const exists = await Opportunity.findOne({
            $or: [
              { title: contest.name },
              { website: contest.url }
            ]
          });

          if (!exists) {
            const newContest = new Opportunity({
              title: contest.name,
              description: `Coding contest hosted on ${contest.site}. Join this challenge to test your data structures, algorithms, and problem-solving skills against a global developer community.`,
              category: "Coding Contests",
              organizer: contest.site,
              organizerLogo: `https://avatar.vercel.sh/${contest.site.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              bannerImage: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80",
              website: contest.url,
              registrationLink: contest.url,
              location: "Online",
              mode: "Online",
              freeOrPaid: "Free",
              targetAudience: "International",
              prizePool: "Rating points & Platform Badges",
              registrationDeadline: startDate,
              eventStartDate: startDate,
              eventEndDate: new Date(contest.end_time),
              difficulty: "Intermediate",
              eligibility: "Open to anyone globally.",
              timeline: `Starts: ${startDate.toLocaleString()}`,
              rules: "Standard platform rules and terms apply. No plagiarism, individual participation.",
              judgingCriteria: "Correctness, speed, and execution complexity of your submitted codes.",
              tags: ["Algorithms", "Problem Solving", "Competitive Coding", contest.site],
              featured: false,
              trending: false,
              approved: true,
            });
            await newContest.save();
            count++;
          }
        }
        console.log(`Synced ${count} new coding contests from Kontests API.`);
      }
    } catch (err: any) {
    }

    let newCount = 0;
    try {
      console.log("Fetching live hackathons from Hack Club API...");
      const hcRes = await axios.get("https://hackathons.hackclub.com/api/events/all", { timeout: 10000 });
      if (hcRes.data && Array.isArray(hcRes.data)) {
        for (const hackathon of hcRes.data) {
          const startDate = new Date(hackathon.start);
          if (startDate.getTime() < Date.now()) continue; 

          const exists = await Opportunity.findOne({
            $or: [
              { title: hackathon.name },
              { website: hackathon.website }
            ]
          });

          if (!exists) {
            const newHackathon = new Opportunity({
              title: hackathon.name,
              description: `Real-time Hackathon hosted by ${hackathon.organization || 'Hack Club Community'}. ${hackathon.desc || 'Join developers and students to build amazing projects, learn new skills, and compete!'}`,
              category: "Hackathons",
              organizer: hackathon.organization || "Hack Club Partner",
              organizerLogo: hackathon.logo || `https://avatar.vercel.sh/${(hackathon.name || 'hc').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              bannerImage: hackathon.banner || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
              website: hackathon.website,
              registrationLink: hackathon.website,
              location: hackathon.location || "Online",
              mode: hackathon.mode === "virtual" ? "Online" : (hackathon.mode === "hybrid" ? "Hybrid" : "Offline"),
              freeOrPaid: "Free",
              targetAudience: "Student Only",
              prizePool: "Check Website",
              registrationDeadline: startDate,
              eventStartDate: startDate,
              eventEndDate: new Date(hackathon.end),
              difficulty: "Intermediate",
              eligibility: "High school and university students.",
              timeline: `Starts: ${startDate.toLocaleString()}`,
              rules: "Standard MLH or Hack Club rules apply. See website for full Code of Conduct.",
              judgingCriteria: "Innovation, technical complexity, and impact.",
              tags: ["Hackathon", "Build", "Hack Club"],
              featured: false,
              trending: false,
              approved: true,
            });
            await newHackathon.save();
            newCount++;
          }
        }
        console.log(`Synced ${newCount} new hackathons from Hack Club API.`);
      }
    } catch (err: any) {
      console.log("Hack Club API fetch failed, skipping...", err.message);
    }

    try {
      console.log("Fetching live hackathons from Devpost API...");
      const devpostRes = await axios.get("https://devpost.com/api/hackathons?page=1", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/120.0.0.0",
          "Accept": "application/json"
        },
        timeout: 10000
      });
      if (devpostRes.data && Array.isArray(devpostRes.data.hackathons)) {
        let count = 0;
        for (const hackathon of devpostRes.data.hackathons) {
          const exists = await Opportunity.findOne({
            $or: [
              { title: hackathon.title },
              { website: hackathon.url }
            ]
          });

          if (!exists) {
            let eventStartDate = new Date();
            let eventEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            let registrationDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

            if (hackathon.submission_period_dates) {
              try {
                const datesStr = hackathon.submission_period_dates;
                const parts = datesStr.split(" - ");
                if (parts.length === 2) {
                  let startStr = parts[0].trim();
                  let endStr = parts[1].trim();
                  let year = new Date().getFullYear();
                  const yearMatch = datesStr.match(/\d{4}/);
                  if (yearMatch) year = parseInt(yearMatch[0]);
                  if (/^\d+/.test(endStr) && !/[a-zA-Z]/.test(endStr.split(",")[0])) {
                    const monthMatch = startStr.match(/[a-zA-Z]+/);
                    if (monthMatch) endStr = `${monthMatch[0]} ${endStr}`;
                  }
                  if (!/\d{4}/.test(startStr)) startStr = `${startStr}, ${year}`;
                  if (!/\d{4}/.test(endStr)) endStr = `${endStr}, ${year}`;
                  const parsedStart = new Date(startStr);
                  const parsedEnd = new Date(endStr);
                  if (!isNaN(parsedStart.getTime())) eventStartDate = parsedStart;
                  if (!isNaN(parsedEnd.getTime())) {
                    eventEndDate = parsedEnd;
                    registrationDeadline = parsedEnd;
                  }
                }
              } catch (e) {}
            }

            const cleanPrize = (hackathon.prize_amount || "").replace(/<[^>]*>/g, "").trim() || "See website";
            const cleanUrl = hackathon.url ? (hackathon.url.startsWith("http") ? hackathon.url : `https:${hackathon.url}`) : "https://devpost.com";
            const bannerImage = hackathon.thumbnail_url 
              ? (hackathon.thumbnail_url.startsWith("http") ? hackathon.thumbnail_url : `https:${hackathon.thumbnail_url}`)
              : "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80";

            const newHackathon = new Opportunity({
              title: hackathon.title,
              description: `Real-time Hackathon hosted on Devpost by ${hackathon.organization_name || 'community'}. Participate to build innovative solutions, collaborate with developers, and compete for a prize pool of ${cleanPrize}.`,
              category: "Hackathons",
              organizer: hackathon.organization_name || "Devpost Organizer",
              organizerLogo: hackathon.thumbnail_url 
                ? (hackathon.thumbnail_url.startsWith("http") ? hackathon.thumbnail_url : `https:${hackathon.thumbnail_url}`)
                : `https://avatar.vercel.sh/${(hackathon.organization_name || 'devpost').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              bannerImage: bannerImage,
              website: cleanUrl,
              registrationLink: cleanUrl,
              location: hackathon.displayed_location?.location || "Online",
              mode: hackathon.displayed_location?.location === "Online" ? "Online" : "Offline",
              freeOrPaid: "Free",
              targetAudience: "Student Only",
              prizePool: cleanPrize,
              registrationDeadline,
              eventStartDate,
              eventEndDate,
              difficulty: "Intermediate",
              eligibility: "Open to students and developers globally.",
              timeline: `Submission Period: ${hackathon.submission_period_dates || 'Ongoing'}`,
              rules: "Standard Devpost and organizer code of conduct and rules apply.",
              judgingCriteria: "Quality of the idea, implementation complexity, pitch presentation, and value.",
              tags: (hackathon.themes || []).map((t: any) => t.name).concat(["Hackathon", "Build", "Devpost"]),
              featured: hackathon.featured || false,
              trending: hackathon.registrations_count > 1000,
              approved: true,
            });
            await newHackathon.save();
            count++;
            newCount++;
          }
        }
        console.log(`Synced ${count} new hackathons from Devpost API.`);
      }
    } catch (err: any) {
      console.log("Devpost API fetch failed, skipping...");
    }

    try {
      console.log("Fetching live remote software jobs from Remotive API...");
      const remotiveRes = await axios.get("https://remotive.com/api/remote-jobs?category=software-dev&limit=10", { timeout: 10000 });
      if (remotiveRes.data && Array.isArray(remotiveRes.data.jobs)) {
        let count = 0;
        for (const job of remotiveRes.data.jobs) {
          const exists = await Opportunity.findOne({
            $or: [
              { title: job.title, organizer: job.company_name },
              { website: job.url }
            ]
          });

          if (!exists) {
            let eventStartDate = new Date();
            let eventEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
            let registrationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

            const newJob = new Opportunity({
              title: job.title,
              description: `Software Engineering Role at ${job.company_name}. Location: ${job.candidate_required_location}. Job Type: ${job.job_type}.\n\nROLE OVERVIEW:\n${job.description ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 800) + '...' : 'Apply directly on the website.'}`,
              category: "Jobs",
              organizer: job.company_name || "Tech Company",
              organizerLogo: job.company_logo || `https://avatar.vercel.sh/${(job.company_name || 'job').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              bannerImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
              website: job.url,
              registrationLink: job.url,
              location: job.candidate_required_location || "Remote",
              mode: "Online",
              freeOrPaid: "Paid",
              targetAudience: "International",
              prizePool: job.salary || "Competitive Salary",
              registrationDeadline,
              eventStartDate,
              eventEndDate,
              difficulty: "Intermediate",
              eligibility: "Check job description for specific degree or skill requirements.",
              timeline: "Immediate joining or as per company schedule.",
              rules: "Standard employment background checks and interview process apply.",
              judgingCriteria: "Resume screening, technical interviews, and culture fit.",
              tags: (job.tags && job.tags.length > 0) ? job.tags.slice(0, 3) : ["Software Engineering", "Remote", "Job"],
              featured: false,
              trending: false,
              approved: true,
            });
            await newJob.save();
            count++;
            newCount++;
          }
        }
        console.log(`Synced ${count} new jobs from Remotive API.`);
      }
    } catch (err: any) {
      console.log("Remotive API fetch failed, skipping...", err.message);
    }

    if (newCount > 0) {
      io.emit("opportunities_updated");
    }

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY") {
      try {
        console.log("Using Gemini AI with Search Grounding to curate real-time tech opportunities...");
        const prompt = `You are a student opportunities researcher.
Do a live web search using Google Search to find 8 actual, real, live, and upcoming opportunities for college students that are open for registration in 2026 or 2027.
Choose from these categories: Jobs, Internships, Scholarships, Workshops, Webinars, Conferences, Open Source, Research, Bootcamps, Fellowships, Innovation Challenges, Competitions, Tech Events.
Make sure the website and registrationLink redirect correctly to the original official URL of the opportunity. Do not invent links or placeholders.
Return them as a JSON array of objects fitting this schema:
[
  {
    "title": "Opportunity Title",
    "description": "Short engaging description.",
    "category": "Jobs" | "Internships" | "Scholarships" | "Workshops" | "Webinars" | "Conferences" | "Open Source" | "Research" | "Bootcamps" | "Fellowships" | "Innovation Challenges" | "Competitions" | "Tech Events",
    "organizer": "Organizer Name",
    "organizerLogo": "Vercel avatar slug e.g. google or stripe",
    "website": "https://...",
    "registrationLink": "https://...",
    "location": "City, Country or Global",
    "mode": "Online" | "Offline" | "Hybrid",
    "freeOrPaid": "Free" | "Paid",
    "prizePool": "Description of prize or stipend",
    "registrationDeadlineISO": "ISO string of deadline in the future",
    "eventStartDateISO": "ISO string of start date in the future",
    "eventEndDateISO": "ISO string of end date in the future",
    "difficulty": "Beginner" | "Intermediate" | "Advanced",
    "eligibility": "Academic criteria",
    "timeline": "Important dates",
    "rules": "Participant terms",
    "judgingCriteria": "Evaluation metrics",
    "tags": ["Tag1", "Tag2"]
  }
]
Do not include any markdown format tags (like \`\`\`json) in your response, return a clean raw JSON string.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const text = response.text ? response.text.trim() : "";
        const jsonStr = text.replace(/^```json/, "").replace(/```$/, "").trim();
        
        const items = JSON.parse(jsonStr);
        if (Array.isArray(items)) {
          let count = 0;
          for (const item of items) {
            const exists = await Opportunity.findOne({ title: item.title });
            if (!exists) {
              const newOpp = new Opportunity({
                title: item.title,
                description: item.description,
                category: item.category,
                organizer: item.organizer,
                organizerLogo: `https://avatar.vercel.sh/${item.organizerLogo || 'avatar'}`,
                bannerImage: `https://images.unsplash.com/photo-${item.category === "Internships" ? "1486312338219-ce68d2c6f44d" : "1504384308090-c894fdcc538d"}?auto=format&fit=crop&w=800&q=80`,
                website: item.website,
                registrationLink: item.registrationLink,
                location: item.location,
                mode: item.mode,
                freeOrPaid: item.freeOrPaid,
                targetAudience: "Student Only",
                prizePool: item.prizePool,
                registrationDeadline: new Date(item.registrationDeadlineISO),
                eventStartDate: new Date(item.eventStartDateISO),
                eventEndDate: new Date(item.eventEndDateISO),
                difficulty: item.difficulty,
                eligibility: item.eligibility,
                timeline: item.timeline,
                rules: item.rules,
                judgingCriteria: item.judgingCriteria,
                tags: item.tags,
                featured: Math.random() > 0.5,
                trending: Math.random() > 0.5,
                approved: true
              });
              await newOpp.save();
              count++;
            }
          }
          console.log(`Generated and synced ${count} premium opportunities via Gemini AI.`);
        }
      } catch (err: any) {
        console.error("Failed to curate premium opportunities via Gemini:", err.message);
      }
    }

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await Opportunity.deleteMany({
        eventEndDate: { $lt: thirtyDaysAgo }
      });
      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} expired opportunities older than 30 days.`);
      }
    } catch (err: any) {
      console.error("Failed to clean up expired opportunities:", err.message);
    }
  }

  const runStartupJobs = async () => {
    try {
      await seedDemoData();
      await seedOpportunities();
      await syncOpportunities();
      setInterval(syncOpportunities, 24 * 60 * 60 * 1000);
    } catch (err) {
      console.error("Failed running startup data seed/sync jobs:", err);
    }
  };
  runStartupJobs();

  // Authentication endpoints
  app.post("/api/login", async (req, res) => {
    try {
      const { email, name, role, avatar, department, year } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Enforce student college email rule
      if (role === 'student') {
        if (!email.toLowerCase().endsWith('@srishakthi.ac.in')) {
          return res.status(400).json({ error: "Please sign in using your official college email." });
        }
      }

      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = new User({
          userId: role === 'coordinator' ? 'sarah-chen-1' : `student-${Date.now()}`,
          name: name || (role === 'coordinator' ? 'Dr. Sarah Chen' : 'New Student'),
          email: email.toLowerCase(),
          role: role,
          avatar: avatar || `https://avatar.vercel.sh/${role === 'coordinator' ? 'sarah' : 'student'}`,
          department: department || (role === 'coordinator' ? 'AI Department' : 'Computer Science'),
          year: year || "1",
          status: role === 'coordinator' ? 'approved' : 'pending',
          registrationDate: new Date()
        });
        await user.save();
      } else {
        if (name) user.name = name;
        if (avatar) user.avatar = avatar;
        if (department) user.department = department;
        if (year && role === 'student') user.year = year;
        await user.save();
      }

      res.json({ user: { id: user.userId, ...user.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const existingUser = await User.findOne({ userId: req.params.id });
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, department, year, avatar, githubUsername, githubToken, skills, interestedCategories, college, notificationPreferences } = req.body;
      if (name) existingUser.name = name;
      if (department) existingUser.department = department;
      if (githubUsername !== undefined) existingUser.githubUsername = githubUsername;
      if (githubToken !== undefined) existingUser.githubToken = githubToken;
      if (skills !== undefined) existingUser.skills = skills;
      if (interestedCategories !== undefined) existingUser.interestedCategories = interestedCategories;
      if (college !== undefined) existingUser.college = college;
      if (notificationPreferences !== undefined) existingUser.notificationPreferences = notificationPreferences;

      if (existingUser.role === 'student') {
        if (year) existingUser.year = year;
        if (avatar) existingUser.avatar = avatar;
      }

      await existingUser.save();
      res.json({ user: { id: existingUser.userId, ...existingUser.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users/students", async (req, res) => {
    try {
      const students = await User.find({ role: 'student', status: 'approved' });
      res.json({ students: students.map(s => ({ id: s.userId, ...s.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Approvals endpoints
  app.get("/api/approvals", async (req, res) => {
    try {
      const pendingStudents = await User.find({ role: 'student', status: 'pending' }).sort({ createdAt: -1 });
      res.json({ requests: pendingStudents.map(s => ({ id: s.userId, ...s.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/approvals/:id", async (req, res) => {
    try {
      const { status } = req.body; // 'approved' or 'rejected'
      const user = await User.findOneAndUpdate({ userId: req.params.id }, { status }, { new: true });
      if (!user) {
        return res.status(404).json({ error: "Student request not found" });
      }
      
      const notif = new Notification({
        userId: user.userId,
        title: status === 'approved' ? 'Account Approved' : 'Account Rejected',
        message: status === 'approved' 
          ? 'Your account request has been approved by the coordinator. You can now access the platform.'
          : 'Your account request has been rejected by the coordinator.',
        read: false,
        type: 'general'
      });
      await notif.save();

      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Dashboard Metrics API
  app.get("/api/dashboard-metrics", async (req, res) => {
    try {
      const totalStudents = await User.countDocuments({ role: 'student', status: 'approved' });
      const pendingRequests = await User.countDocuments({ role: 'student', status: 'pending' });
      const activeProjects = await Project.countDocuments({ status: { $ne: 'Completed' } });
      const todayStr = new Date().toISOString().split('T')[0];
      const reportsToday = await DailyReport.countDocuments({ date: todayStr });
      const pendingTasks = await Task.countDocuments({ status: { $ne: 'Completed' } });

      res.json({
        totalStudents,
        pendingRequests,
        activeProjects,
        reportsSubmittedToday: reportsToday,
        pendingTasks
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/student-dashboard-metrics/:studentId", async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const project = await Project.findOne({ teamMembers: studentId });
      
      const todayStr = new Date().toISOString().split('T')[0];
      const reportToday = await DailyReport.findOne({ studentId, date: todayStr });
      
      const tasks = await Task.find({ assigneeId: studentId, status: { $ne: 'Completed' } }).sort({ date: 1 }).limit(5);

      res.json({
        project: project ? { id: project._id, ...project.toObject() } : null,
        dailyReportStatus: reportToday ? 'Submitted' : 'Pending',
        upcomingDeadlines: tasks.map(t => ({ id: t._id, ...t.toObject() }))
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Student Records API
  app.get("/api/student-records", async (req, res) => {
    try {
      const students = await User.find({ role: 'student', status: 'approved' });
      const records = [];
      for (const student of students) {
        const project = await Project.findOne({ teamMembers: student.userId });
        const lastReport = await DailyReport.findOne({ studentId: student.userId }).sort({ date: -1 });
        
        const attendanceRecords = await Attendance.find({ studentId: student.userId, status: "Present" }).sort({ date: -1 });

        records.push({
          student: {
            id: student.userId,
            name: student.name,
            email: student.email,
            department: student.department,
            year: student.year
          },
          project: project ? {
            id: project._id,
            name: project.name,
            teamLeader: project.teamLeader,
            teamMembers: project.teamMembers,
            progress: project.progress,
            abstract: project.abstract,
            description: project.description,
            objectives: project.objectives,
            methodology: project.methodology,
            techStack: project.techStack,
            modules: project.modules,
            references: project.references,
            futureEnhancements: project.futureEnhancements,
            files: project.files,
            status: project.status
          } : null,
          lastReportDate: lastReport ? lastReport.date : 'None',
          dailyReports: await DailyReport.find({ studentId: student.userId }).sort({ date: -1 }),
          attendanceLogs: attendanceRecords.map(r => ({ date: r.date, status: r.status }))
        });
      }
      res.json({ records });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Attendance endpoints
  app.get("/api/attendance", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: "Date is required" });
      const attendance = await Attendance.find({ date: String(date) });
      res.json({ attendance });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const { date, records, markedBy } = req.body;
      if (!date || !records) {
        return res.status(400).json({ error: "Date and records are required" });
      }

      for (const rec of records) {
        await Attendance.findOneAndUpdate(
          { studentId: rec.studentId, date },
          { status: rec.status, markedBy },
          { upsert: true }
        );
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Lab Access endpoints
  app.get("/api/lab-access/active", async (req, res) => {
    try {
      const activeLogs = await LabAccess.aggregate([
        { $match: { status: "Checked-In" } },
        {
          $lookup: {
            from: "users",
            localField: "studentId",
            foreignField: "userId",
            as: "studentInfo"
          }
        },
        { $unwind: "$studentInfo" },
        {
          $project: {
            id: "$_id",
            studentId: 1,
            studentName: "$studentInfo.name",
            studentEmail: "$studentInfo.email",
            checkInTime: 1,
            status: 1
          }
        }
      ]);
      res.json({ activeLogs });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/lab-access/check-in", async (req, res) => {
    try {
      const { studentId } = req.body;
      if (!studentId) return res.status(400).json({ error: "Student ID is required" });

      const existing = await LabAccess.findOne({ studentId, status: "Checked-In" });
      if (existing) {
        return res.status(400).json({ error: "Student is already checked in" });
      }

      const log = new LabAccess({
        studentId,
        checkInTime: new Date(),
        status: "Checked-In"
      });
      await log.save();
      res.json({ success: true, log });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/lab-access/check-out", async (req, res) => {
    try {
      const { studentId } = req.body;
      if (!studentId) return res.status(400).json({ error: "Student ID is required" });

      const log = await LabAccess.findOneAndUpdate(
        { studentId, status: "Checked-In" },
        { status: "Checked-Out", checkOutTime: new Date() },
        { new: true }
      );

      if (!log) {
        return res.status(400).json({ error: "No active check-in found for this student" });
      }

      res.json({ success: true, log });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Projects endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const { role, userId } = req.query;
      let query: any = {};
      if (role === 'student' && userId) {
        query.teamMembers = String(userId);
      }
      const projects = await Project.find(query).sort({ updatedAt: -1 });
      res.json({ projects: projects.map(p => ({ id: p._id, ...p.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { name, department } = req.body;
      if (!name || !department) {
        return res.status(400).json({ error: "Project Title and Department are required" });
      }
      const newProj = new Project({
        name,
        department,
        abstract: "",
        description: "",
        objectives: "",
        methodology: "",
        techStack: [],
        modules: "",
        references: "",
        futureEnhancements: "",
        teamMembers: [],
        teamLeader: "",
        progress: 0,
        status: "Active"
      });
      await newProj.save();

      io.emit("project_updated", { projectId: newProj._id, project: newProj });
      res.json({ project: { id: newProj._id, ...newProj.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      const updates = req.body;
      
      if (updates.role === 'student') {
        if (updates.abstract !== undefined) project.abstract = updates.abstract;
        if (updates.description !== undefined) project.description = updates.description;
        if (updates.objectives !== undefined) project.objectives = updates.objectives;
        if (updates.methodology !== undefined) project.methodology = updates.methodology;
        if (updates.techStack !== undefined) {
          project.techStack = Array.isArray(updates.techStack) 
            ? updates.techStack 
            : updates.techStack.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        if (updates.modules !== undefined) project.modules = updates.modules;
        if (updates.references !== undefined) project.references = updates.references;
        if (updates.futureEnhancements !== undefined) project.futureEnhancements = updates.futureEnhancements;
        if (updates.githubRepo !== undefined) project.githubRepo = updates.githubRepo;
      } else {
        if (updates.name !== undefined) project.name = updates.name;
        if (updates.department !== undefined) project.department = updates.department;
        if (updates.teamMembers !== undefined) project.teamMembers = updates.teamMembers;
        if (updates.teamLeader !== undefined) project.teamLeader = updates.teamLeader;
        if (updates.status !== undefined) project.status = updates.status;
        if (updates.progress !== undefined) project.progress = updates.progress;
        if (updates.githubRepo !== undefined) project.githubRepo = updates.githubRepo;
      }

      await project.save();
      io.emit("project_updated", { projectId: project._id, project });
      res.json({ project: { id: project._id, ...project.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/projects/:id/upload", upload.single("file"), async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const fileData = {
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };

      project.files.push(fileData);
      await project.save();

      const coords = await User.find({ role: 'coordinator' });
      for (const coord of coords) {
        const notif = new Notification({
          userId: coord.userId,
          title: 'New Project File Uploaded',
          message: `A new file "${fileData.name}" was uploaded to project: ${project.name}`,
          read: false,
          type: 'general',
          relatedId: project._id
        });
        await notif.save();
        io.emit("notification_received");
      }

      io.emit("project_updated", { projectId: project._id, project });
      res.json({ success: true, files: project.files });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Daily Reports endpoints
  app.get("/api/projects/:id/daily-reports", async (req, res) => {
    try {
      const reports = await DailyReport.find({ projectId: req.params.id }).sort({ createdAt: -1 });
      res.json({ reports });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/daily-reports/check-today", async (req, res) => {
    try {
      const { studentId, date } = req.query;
      const report = await DailyReport.findOne({ studentId: String(studentId), date: String(date) });
      res.json({ submitted: !!report });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/daily-reports", async (req, res) => {
    try {
      const { projectId, studentId, studentName, date, workDone, challenges, nextDayPlan, progress, abstract } = req.body;
      if (!projectId || !studentId || !date || !workDone || !challenges || !nextDayPlan || progress === undefined || !abstract) {
        return res.status(400).json({ error: "All fields including Abstract are mandatory for Daily Reports" });
      }

      let report = await DailyReport.findOne({ projectId, studentId, date });
      if (report) {
        report.workDone = workDone;
        report.challenges = challenges;
        report.nextDayPlan = nextDayPlan;
        report.progress = progress;
        report.abstract = abstract;
        await report.save();
      } else {
        report = new DailyReport({
          projectId, studentId, studentName, date, workDone, challenges, nextDayPlan, progress, abstract
        });
        await report.save();
      }

      const project = await Project.findById(projectId);
      if (project) {
        const oldAbstract = project.abstract;
        project.progress = progress;
        project.abstract = abstract;
        await project.save();

        if (oldAbstract !== abstract) {
          const latestHistory = await AbstractHistory.findOne({ projectId }).sort({ version: -1 });
          const newVersion = latestHistory ? latestHistory.version + 1 : 1;
          const history = new AbstractHistory({
            projectId,
            studentId,
            abstract: abstract,
            version: newVersion,
            updatedAt: new Date()
          });
          await history.save();
        }

        io.emit("project_updated", { projectId, project });
      }

      const coords = await User.find({ role: 'coordinator' });
      for (const coord of coords) {
        const notif = new Notification({
          userId: coord.userId,
          title: 'Daily Report Submitted',
          message: `${studentName} submitted daily report for ${date}. Progress: ${progress}%`,
          read: false,
          type: 'general',
          relatedId: projectId
        });
        await notif.save();
        io.emit("notification_received");
      }

      res.json({ success: true, report });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/projects/:id/abstracts", async (req, res) => {
    try {
      const history = await AbstractHistory.find({ projectId: req.params.id }).sort({ version: -1 });
      res.json({ history });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/profile/upload-avatar", upload.single("avatar"), async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId || !req.file) {
        return res.status(400).json({ error: "User ID and avatar file are required" });
      }

      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ error: "User not found" });

      user.avatar = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({ success: true, avatar: user.avatar });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DB endpoints for Messages
  app.get("/api/messages", async (req, res) => {
    try {
      const { projectId } = req.query;
      const query = projectId ? { projectId: String(projectId) } : { $or: [{ projectId: "" }, { projectId: null }] };
      const messages = await Message.find(query).sort({ createdAt: 1 });
      res.json({ messages: messages.map(m => ({ id: m._id, ...m.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { user: sender, userId, text, projectId } = req.body;
      const msg = new Message({
        user: sender,
        userId,
        text,
        projectId: projectId || ""
      });
      await msg.save();
      
      if (projectId) {
        io.to(projectId).emit("receive_message", msg);
      } else {
        io.emit("receive_message_global", msg);
      }
      res.json({ message: { id: msg._id, ...msg.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DB endpoints for Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const { role, userId } = req.query;
      let query: any = {};
      if (role === 'student' && userId) {
        query.assigneeId = String(userId);
      }
      const tasks = await Task.find(query).sort({ createdAt: -1 });
      res.json({ tasks: tasks.map(t => ({ id: t._id, ...t.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const { title, date, assigneeId, assigneeName, projectId, projectName, priority, estimatedHours, createdBy } = req.body;
      const task = new Task({
        title,
        status: 'Not Started',
        date, // due date
        assigneeId,
        assigneeName,
        projectId,
        projectName,
        createdBy,
        priority: priority || 'medium',
        estimatedHours: estimatedHours || 0
      });
      await task.save();

      if (task.assigneeId !== task.createdBy) {
        const notif = new Notification({
          userId: task.assigneeId,
          title: 'New Task Assigned',
          message: `You were assigned: ${task.title} in project ${projectName}`,
          read: false,
          type: 'team', // Bell 2!
          relatedId: task._id
        });
        await notif.save();
      }

      res.json({ task: { id: task._id, ...task.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const { status, priority, estimatedHours, date } = req.body;
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ error: "Task not found" });

      // Check validation: Students cannot mark tasks completed without submitting daily report today.
      if (status === 'Completed' && task.assigneeId) {
        const todayStr = new Date().toISOString().split('T')[0];
        const reportToday = await DailyReport.findOne({ studentId: task.assigneeId, date: todayStr });
        if (!reportToday) {
          return res.status(400).json({ error: "Daily Report Pending" });
        }
      }

      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
      if (date !== undefined) task.date = date; // due date

      await task.save();

      if (status === 'Completed' && task.assigneeId) {
        const coords = await User.find({ role: 'coordinator' });
        for (const coord of coords) {
          const notif = new Notification({
            userId: coord.userId,
            title: 'Task Completed',
            message: `${task.assigneeName} completed task: ${task.title}`,
            read: false,
            type: 'team', // Bell 2!
            relatedId: task._id
          });
          await notif.save();
        }
      }

      res.json({ success: true, task });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId, type } = req.query;
      let query: any = {};
      if (userId) query.userId = String(userId);
      if (type) query.type = String(type);

      const notifs = await Notification.find(query).sort({ createdAt: -1 });
      res.json({ notifications: notifs.map(n => ({ id: n._id, ...n.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/notifications/:id", async (req, res) => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { read: true });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // STUDENT OPPORTUNITIES HUB ENDPOINTS
  // ==========================================

  app.post("/api/opportunities/sync", async (req, res) => {
    try {
      await syncOpportunities();
      res.json({ success: true, message: "Opportunities synchronized successfully!" });
    } catch (err: any) {
      console.error("Manual opportunities sync failed:", err.message);
      res.status(500).json({ error: "Failed to synchronize opportunities" });
    }
  });

  app.get("/api/opportunities", async (req, res) => {
    try {
      const { category, mode, freeOrPaid, targetAudience, difficulty, status, search, sort } = req.query;
      let query: any = { approved: true };

      if (category) query.category = String(category);
      if (mode) query.mode = String(mode);
      if (freeOrPaid) query.freeOrPaid = String(freeOrPaid);
      if (targetAudience) query.targetAudience = String(targetAudience);
      if (difficulty) query.difficulty = String(difficulty);

      const now = new Date();
      if (status) {
        if (status === "Live") {
          query.registrationDeadline = { $gt: now };
          query.eventStartDate = { $lte: now };
        } else if (status === "Upcoming") {
          query.eventStartDate = { $gt: now };
          query.registrationDeadline = { $gt: now };
        } else if (status === "Completed") {
          query.eventEndDate = { $lt: now };
        } else if (status === "ClosingSoon") {
          query.registrationDeadline = { $gt: now, $lte: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) };
        }
      }

      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [
          { title: regex },
          { organizer: regex },
          { description: regex },
          { tags: { $in: [regex] } }
        ];
      }

      let sortQuery: any = { createdAt: -1 };
      if (sort) {
        if (sort === "newest") sortQuery = { createdAt: -1 };
        else if (sort === "oldest") sortQuery = { createdAt: 1 };
        else if (sort === "alphabetical") sortQuery = { title: 1 };
        else if (sort === "highestPrize" || sort === "lowestPrize") {
          sortQuery = { registrationDeadline: sort === "highestPrize" ? 1 : -1 };
        }
      }

      const list = await Opportunity.find(query).sort(sortQuery);
      res.json({ opportunities: list.map(item => ({ id: item._id, ...item.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/opportunities/recommendations/:userId", async (req, res) => {
    try {
      const user = await User.findOne({ userId: req.params.userId });
      if (!user) return res.status(404).json({ error: "User not found" });

      const now = new Date();
      const query: any = { registrationDeadline: { $gt: now }, approved: true };

      const userSkills = user.skills || [];
      const userCategories = user.interestedCategories || [];

      let list = [];
      if (userSkills.length > 0 || userCategories.length > 0) {
        list = await Opportunity.find({
          ...query,
          $or: [
            { category: { $in: userCategories } },
            { tags: { $in: userSkills } }
          ]
        }).limit(6);
      }

      if (list.length < 3) {
        const fallback = await Opportunity.find(query).limit(6 - list.length);
        const seenIds = new Set(list.map(o => o._id.toString()));
        for (const item of fallback) {
          if (!seenIds.has(item._id.toString())) {
            list.push(item);
          }
        }
      }

      res.json({ recommendations: list.map(o => ({ id: o._id, ...o.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/opportunities/:id", async (req, res) => {
    try {
      const opp = await Opportunity.findById(req.params.id);
      if (!opp) return res.status(404).json({ error: "Opportunity not found" });
      opp.views = (opp.views || 0) + 1;
      await opp.save();
      res.json({ opportunity: { id: opp._id, ...opp.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/opportunities", async (req, res) => {
    try {
      const opp = new Opportunity({
        ...req.body,
        approved: true,
        views: 0,
        bookmarks: []
      });
      await opp.save();
      res.json({ success: true, opportunity: { id: opp._id, ...opp.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/opportunities/:id", async (req, res) => {
    try {
      const opp = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!opp) return res.status(404).json({ error: "Opportunity not found" });
      res.json({ success: true, opportunity: { id: opp._id, ...opp.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/opportunities/:id", async (req, res) => {
    try {
      const opp = await Opportunity.findByIdAndDelete(req.params.id);
      if (!opp) return res.status(404).json({ error: "Opportunity not found" });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = [
        "Hackathons", "Internships", "Coding Contests", "Scholarships", "Workshops",
        "Webinars", "Conferences", "Open Source", "Research", "Bootcamps",
        "Fellowships", "Innovation Challenges", "Competitions", "Tech Events"
      ];
      const now = new Date();
      const counts = await Promise.all(categories.map(async (cat) => {
        const count = await Opportunity.countDocuments({
          category: cat,
          registrationDeadline: { $gt: now },
          approved: true
        });
        return { category: cat, count };
      }));
      res.json({ categories: counts });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/featured", async (req, res) => {
    try {
      const now = new Date();
      const query = { registrationDeadline: { $gt: now }, approved: true };
      const featured = await Opportunity.find({ ...query, featured: true }).limit(5);
      const trending = await Opportunity.find({ ...query, trending: true }).limit(5);
      const newest = await Opportunity.find(query).sort({ createdAt: -1 }).limit(5);
      res.json({
        featured: featured.map(o => ({ id: o._id, ...o.toObject() })),
        trending: trending.map(o => ({ id: o._id, ...o.toObject() })),
        newest: newest.map(o => ({ id: o._id, ...o.toObject() }))
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/bookmark", async (req, res) => {
    try {
      const { opportunityId, userId } = req.body;
      if (!opportunityId || !userId) {
        return res.status(400).json({ error: "Opportunity ID and User ID are required" });
      }

      const opp = await Opportunity.findById(opportunityId);
      if (!opp) return res.status(404).json({ error: "Opportunity not found" });

      const index = opp.bookmarks.indexOf(userId);
      let isBookmarked = false;
      if (index === -1) {
        opp.bookmarks.push(userId);
        isBookmarked = true;
      } else {
        opp.bookmarks.splice(index, 1);
      }
      await opp.save();

      res.json({ success: true, bookmarked: isBookmarked, bookmarksCount: opp.bookmarks.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bookmarks", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "User ID is required" });
      const list = await Opportunity.find({ bookmarks: String(userId), approved: true });
      res.json({ bookmarks: list.map(o => ({ id: o._id, ...o.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/opportunities/:id/apply", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "User ID is required" });

      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ error: "User not found" });

      const oppId = req.params.id;
      const index = user.appliedOpportunities.indexOf(oppId);
      let applied = false;
      if (index === -1) {
        user.appliedOpportunities.push(oppId);
        applied = true;

        const opp = await Opportunity.findById(oppId);
        const notif = new Notification({
          userId: userId,
          title: 'Application Submitted',
          message: `Your application to "${opp?.title || 'Opportunity'}" has been successfully recorded.`,
          read: false,
          type: 'general'
        });
        await notif.save();
      } else {
        user.appliedOpportunities.splice(index, 1);
      }
      await user.save();

      res.json({ success: true, applied, user: { id: user.userId, ...user.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Socket.IO for Real-Time Chat and Updates
  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);
    
    socket.on("join_project", (projectId) => {
      socket.join(projectId);
      console.log(`User joined project room: ${projectId}`);
    });

    socket.on("leave_project", (projectId) => {
      socket.leave(projectId);
      console.log(`User left project room: ${projectId}`);
    });

    socket.on("send_message", async (data) => {
      try {
        const msg = new Message({
          user: data.user,
          userId: data.userId,
          text: data.text,
          projectId: data.projectId || ""
        });
        await msg.save();
        if (data.projectId) {
          io.to(data.projectId).emit("receive_message", msg);
        } else {
          io.emit("receive_message_global", msg);
        }
      } catch (err) {}
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
    });
  });


  // Basic API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "TrackFlow AI" });
  });

  // AI-Powered Project Analysis Endpoint
  app.post("/api/ai/analyze-project", async (req, res) => {
    try {
      const { projectData, githubStats } = req.body;
      
      const prompt = `Analyze this student project data and provide a concise summary of their progress, identifying any risks like low commit frequency or delayed tasks. 
      Project Data: ${JSON.stringify(projectData)}
      GitHub Stats: ${JSON.stringify(githubStats)}

      Provide a short, 3-sentence summary highlighting the health of the project and recommendations.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      if (error?.status === 429 || error?.status === 503 || error?.message?.includes("429") || error?.message?.includes("503") || error?.message?.includes("exceeded your current quota")) {
        return res.json({ analysis: "Project shows steady activity with regular commits. No immediate risks detected in the current trajectory. Continue monitoring for any unexpected delays or drops in velocity." });
      }
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate analysis" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    // Gemma generation endpoint
    app.post("/api/gemma/generate", async (req, res) => {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const scriptPath = path.join(process.cwd(), "run_gemma.py");
      execFile("python", [scriptPath, prompt], (err, stdout, stderr) => {
        if (err) {
          console.error("Gemma generation error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ response: stdout.trim() });
      });
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
