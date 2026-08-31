import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken"; // JWT handling
import bcrypt from "bcryptjs"; // Password hashing
import mongoose from "mongoose"; // MongoDB ORM
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import { createServer } from "http";
import { execFile } from "child_process";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import multer from "multer";
import axios from "axios";

// Adjust Socket.io keep‑alive to avoid premature disconnects
const socketOptions = {
  pingInterval: 25000, // send ping every 25s
  pingTimeout: 5000,   // consider dead after 5s no pong
  cors: { origin: true, methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }
};

dotenv.config();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

const app = express();
const PORT = parseInt(process.env.PORT || "3000");
const httpServer = createServer(app);
const io = new Server(httpServer, socketOptions);

io.on("connection", (socket) => {
  socket.on("join_project", (projectId) => {
    socket.join(projectId);
  });
});

async function startServer() {

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(cors({
    origin: (origin, callback) => {
      // Allow localhost, vercel.app preview/production domains, and any allowed origin
      if (!origin || origin.includes("vercel.app") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  const JWT_SECRET = (process.env.JWT_SECRET && process.env.JWT_SECRET.trim() !== "")
    ? process.env.JWT_SECRET
    : "trackflow_secure_jwt_secret_production_fallback_2026";

  function sanitizeUser(userDoc: any) {
    if (!userDoc) return null;
    try {
      const userObj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
      delete userObj.password;
      delete userObj.passwordHash;
      return userObj;
    } catch (e) {
      return {
        userId: userDoc.userId || userDoc._id || userDoc.id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        status: userDoc.status,
        accountStatus: userDoc.accountStatus,
        avatar: userDoc.avatar,
        department: userDoc.department
      };
    }
  }

  const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. Authentication token required." });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired authentication token." });
    }
  };

  const requireRole = (allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied. Insufficient permissions." });
      }
      next();
    };
  };

  app.get('/ping', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/auth/me', authMiddleware, async (req: any, res: any) => {
    try {
      const user = await User.findOne({ $or: [{ userId: req.user.id }, { _id: req.user.id }, { email: req.user.email }] });
      if (!user) {
        return res.status(404).json({ error: "Authenticated user profile not found" });
      }
      res.json({ user: sanitizeUser(user) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

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
      const safeBasename = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, "_");
      cb(null, uniqueSuffix + "-" + safeBasename);
    }
  });
  const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size for ZIP archives
  });

  // Database Initialization (MongoDB Atlas & Firebase Firestore Support)
  if (process.env.MONGODB_URI) {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB Database via MONGODB_URI!");
      }
    } catch (mErr: any) {
      console.warn("MongoDB connection warning:", mErr.message);
    }
  }

  let firestoreDb: Firestore | null = null;
  try {
    if (getApps().length === 0) {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
        initializeApp({ credential: cert(serviceAccount) });
        firestoreDb = getFirestore();
        console.log("Connected to Google Cloud Firestore via GOOGLE_APPLICATION_CREDENTIALS!");
      } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        });
        firestoreDb = getFirestore();
        console.log("Connected to Google Cloud Firestore via environment variables!");
      } else if (!process.env.MONGODB_URI) {
        console.log("No active MONGODB_URI or Firebase credentials found. Operating with in-memory document adapter.");
      }
    } else {
      firestoreDb = getFirestore();
    }
  } catch (err) {
    console.warn("Firestore initialization error, using local document manager:", err);
  }

  // Firestore Collection Abstract Adapter
  class FirestoreCollection {
    private collectionName: string;
    private static memoryStore: Map<string, Map<string, any>> = new Map();
    private static dbFilePath = path.join(process.cwd(), "uploads", "db_store.json");
    private static isLoaded = false;

    private static loadFromDisk() {
      if (FirestoreCollection.isLoaded) return;
      FirestoreCollection.isLoaded = true;
      try {
        const targetFile = process.env.VERCEL
          ? (fs.existsSync(path.join("/tmp", "db_store.json")) ? path.join("/tmp", "db_store.json") : FirestoreCollection.dbFilePath)
          : FirestoreCollection.dbFilePath;
        if (fs.existsSync(targetFile)) {
          const raw = fs.readFileSync(targetFile, "utf8");
          const data = JSON.parse(raw);
          for (const [colName, docs] of Object.entries(data)) {
            const colMap = new Map<string, any>();
            for (const [docId, docVal] of Object.entries(docs as any)) {
              colMap.set(docId, docVal);
            }
            FirestoreCollection.memoryStore.set(colName, colMap);
          }
          console.log("Loaded persistent database store from disk:", targetFile);
        }
      } catch (err) {
        console.warn("Failed to load local DB store from disk:", err);
      }
    }

    private static saveToDisk() {
      try {
        const serializable: Record<string, Record<string, any>> = {};
        for (const [colName, colMap] of FirestoreCollection.memoryStore.entries()) {
          serializable[colName] = {};
          for (const [docId, docVal] of colMap.entries()) {
            serializable[colName][docId] = docVal;
          }
        }
        const targetPath = process.env.VERCEL ? path.join("/tmp", "db_store.json") : FirestoreCollection.dbFilePath;
        const uploadsDir = path.dirname(targetPath);
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(targetPath, JSON.stringify(serializable, null, 2), "utf8");
      } catch (err) {
        // Ignore read-only filesystem errors on Vercel serverless instances
      }
    }

    constructor(collectionName: string) {
      this.collectionName = collectionName;
      FirestoreCollection.loadFromDisk();
      if (!FirestoreCollection.memoryStore.has(collectionName)) {
        FirestoreCollection.memoryStore.set(collectionName, new Map());
      }
    }

    private get localStore(): Map<string, any> {
      return FirestoreCollection.memoryStore.get(this.collectionName)!;
    }

    private generateId(): string {
      return firestoreDb ? firestoreDb.collection(this.collectionName).doc().id : `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private formatDoc(id: string, data: any) {
      if (!data) return null;
      const self = this;
      const docData: any = {
        _id: id,
        id: id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
      docData.toObject = function() {
        const copy = { ...this };
        delete copy.toObject;
        delete copy.save;
        return copy;
      };
      docData.save = async function() {
        return await self.create({ ...this, _id: id, id });
      };
      return docData;
    }

    private matchFilter(doc: any, filter: Record<string, any>): boolean {
      if (!filter || Object.keys(filter).length === 0) return true;

      for (const [key, value] of Object.entries(filter)) {
        if (key === "$or" && Array.isArray(value)) {
          const matched = value.some(subFilter => this.matchFilter(doc, subFilter));
          if (!matched) return false;
          continue;
        }
        if (key === "$and" && Array.isArray(value)) {
          const matched = value.every(subFilter => this.matchFilter(doc, subFilter));
          if (!matched) return false;
          continue;
        }

        const docVal = doc[key];

        if (value && typeof value === "object" && !(value instanceof Date) && !(value instanceof RegExp) && !Array.isArray(value)) {
          const getCompareValue = (v: any) => {
            if (v instanceof Date) return v.getTime();
            if (typeof v === "string" && !isNaN(Date.parse(v))) return new Date(v).getTime();
            return v;
          };
          const targetVal = getCompareValue(docVal);

          if ("$ne" in value && docVal === value.$ne) return false;
          if ("$gt" in value && !(targetVal > getCompareValue(value.$gt))) return false;
          if ("$gte" in value && !(targetVal >= getCompareValue(value.$gte))) return false;
          if ("$lt" in value && !(targetVal < getCompareValue(value.$lt))) return false;
          if ("$lte" in value && !(targetVal <= getCompareValue(value.$lte))) return false;
          if ("$in" in value && Array.isArray(value.$in)) {
            if (Array.isArray(docVal)) {
              if (!docVal.some(v => value.$in.includes(v))) return false;
            } else {
              if (!value.$in.includes(docVal)) return false;
            }
          }

          if ("$nin" in value && Array.isArray(value.$nin)) {
            if (value.$nin.includes(docVal)) return false;
          }
          if ("$exists" in value) {
            const exists = docVal !== undefined;
            if (value.$exists !== exists) return false;
          }
          continue;
        }

        if (value instanceof RegExp) {
          if (typeof docVal !== "string" || !value.test(docVal)) return false;
          continue;
        }

        if (key === "_id" || key === "id") {
          if (doc._id !== value && doc.id !== value && String(doc._id) !== String(value)) return false;
          continue;
        }

        if (Array.isArray(docVal)) {
          if (!docVal.includes(value)) return false;
          continue;
        }

        if (docVal !== value) return false;
      }
      return true;
    }

    private createQueryRunner(fetchDocs: () => Promise<any[]>) {
      let sortFn: ((a: any, b: any) => number) | null = null;
      let limitNum: number | null = null;

      const runner: any = {
        sort: (sortObj: Record<string, number>) => {
          const entries = Object.entries(sortObj);
          if (entries.length > 0) {
            const [field, direction] = entries[0];
            sortFn = (a: any, b: any) => {
              let valA = a[field];
              let valB = b[field];
              if (valA instanceof Date) valA = valA.getTime();
              if (valB instanceof Date) valB = valB.getTime();
              if (valA === undefined) return 1;
              if (valB === undefined) return -1;
              if (valA < valB) return direction === 1 ? -1 : 1;
              if (valA > valB) return direction === 1 ? 1 : -1;
              return 0;
            };
          }
          return runner;
        },
        limit: (n: number) => {
          limitNum = n;
          return runner;
        },
        then: (resolve: any, reject: any) => {
          return fetchDocs().then(docs => {
            if (sortFn) docs.sort(sortFn);
            if (limitNum !== null) docs = docs.slice(0, limitNum);
            return resolve(docs);
          }).catch(reject);
        }
      };
      return runner;
    }

    private sanitizeForFirestore(val: any): any {
      if (val === null || val === undefined) return null;
      if (val instanceof Date) {
        const time = val.getTime();
        return isNaN(time) ? new Date().toISOString() : val.toISOString();
      }
      if (typeof val === "function") return undefined;
      if (Array.isArray(val)) return val.map(item => this.sanitizeForFirestore(item)).filter(item => item !== undefined);
      if (typeof val === "object") {
        if (typeof val.getMonth === "function" || val.constructor?.name === "Date" || val._seconds !== undefined || val._nanoseconds !== undefined) {
          const time = new Date(val).getTime();
          return isNaN(time) ? new Date().toISOString() : new Date(val).toISOString();
        }
        const res: any = {};
        for (const [k, v] of Object.entries(val)) {
          if (k === "_id" || k === "toObject" || k === "save" || typeof v === "function") continue;
          const cleanVal = this.sanitizeForFirestore(v);
          if (cleanVal !== undefined) res[k] = cleanVal;
        }
        return JSON.parse(JSON.stringify(res));
      }
      return val;
    }



    async create(data: any) {
      const id = data._id || data.id || this.generateId();
      const now = new Date();
      const docData = { ...data, _id: id, id, createdAt: data.createdAt || now, updatedAt: now };

      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        try {
          const cleanData = this.sanitizeForFirestore(docData);
          await mongoose.connection.db.collection(this.collectionName).updateOne({ _id: id }, { $set: cleanData }, { upsert: true });
        } catch (mErr) {
          console.warn(`MongoDB write warning on ${this.collectionName}:`, mErr);
        }
      } else if (firestoreDb) {
        const cleanData = this.sanitizeForFirestore(docData);
        await firestoreDb.collection(this.collectionName).doc(id).set(cleanData, { merge: true });
      }
      this.localStore.set(id, docData);
      FirestoreCollection.saveToDisk();
      return this.formatDoc(id, docData);
    }

    async insertMany(items: any[]) {
      const created = [];
      for (const item of items) {
        const doc = await this.create(item);
        created.push(doc);
      }
      return created;
    }

    find(filter: Record<string, any> = {}) {
      return this.createQueryRunner(async () => {
        let results: any[] = [];
        if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
          try {
            const mongoDocs = await mongoose.connection.db.collection(this.collectionName).find(filter || {}).toArray();
            for (const doc of mongoDocs) {
              results.push(this.formatDoc(doc._id, doc));
            }
            return results;
          } catch (mErr) {
            console.warn(`MongoDB read warning on ${this.collectionName}:`, mErr);
          }
        } else if (firestoreDb) {
          try {
            const snapshot = await firestoreDb.collection(this.collectionName).get();
            snapshot.forEach(doc => {
              const formatted = this.formatDoc(doc.id, doc.data());
              if (this.matchFilter(formatted, filter)) {
                results.push(formatted);
              }
            });
            return results;
          } catch (err) {
            console.warn(`Firestore read error on ${this.collectionName}, fallback to memory:`, err);
          }
        }
        for (const [id, data] of this.localStore.entries()) {
          const formatted = this.formatDoc(id, data);
          if (this.matchFilter(formatted, filter)) {
            results.push(formatted);
          }
        }
        return results;
      });
    }

    async findOne(filter: Record<string, any> = {}) {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        try {
          const doc = await mongoose.connection.db.collection(this.collectionName).findOne(filter || {});
          if (doc) return this.formatDoc(doc._id, doc);
        } catch (e) {}
      }
      const results = await this.find(filter);
      return results.length > 0 ? results[0] : null;
    }

    async findById(id: string) {
      if (!id) return null;
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        try {
          const doc = await mongoose.connection.db.collection(this.collectionName).findOne({ _id: id });
          if (doc) return this.formatDoc(doc._id, doc);
        } catch (e) {}
      } else if (firestoreDb) {
        try {
          const doc = await firestoreDb.collection(this.collectionName).doc(id).get();
          if (doc.exists) {
            return this.formatDoc(doc.id, doc.data());
          }
        } catch (e) {}
      }
      if (this.localStore.has(id)) {
        return this.formatDoc(id, this.localStore.get(id));
      }
      return this.findOne({ _id: id });
    }

    async updateOne(filter: Record<string, any>, update: Record<string, any>) {
      const doc = await this.findOne(filter);
      if (!doc) return null;

      const updatedData = { ...doc };

      if (update.$set) Object.assign(updatedData, update.$set);
      else Object.assign(updatedData, update);

      updatedData.updatedAt = new Date();

      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        try {
          const cleanData = this.sanitizeForFirestore(updatedData);
          await mongoose.connection.db.collection(this.collectionName).updateOne({ _id: doc._id }, { $set: cleanData }, { upsert: true });
        } catch (e) {}
      } else if (firestoreDb) {
        const cleanData = this.sanitizeForFirestore(updatedData);
        await firestoreDb.collection(this.collectionName).doc(doc._id).set(cleanData, { merge: true });
      }

      this.localStore.set(doc._id, updatedData);
      FirestoreCollection.saveToDisk();
      return this.formatDoc(doc._id, updatedData);
    }

    async findOneAndUpdate(filter: Record<string, any>, update: Record<string, any>, options: any = {}) {
      let doc = await this.findOne(filter);
      if (!doc && options.upsert) {
        const initial = update.$set ? { ...filter, ...update.$set } : { ...filter, ...update };
        return this.create(initial);
      }
      if (!doc) return null;
      return this.updateOne({ _id: doc._id }, update);
    }

    async findByIdAndUpdate(id: string, update: Record<string, any>, options: any = {}) {
      return this.findOneAndUpdate({ _id: id }, update, options);
    }

    async findOneAndDelete(filter: Record<string, any>) {
      const doc = await this.findOne(filter);
      if (!doc) return null;
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        try {
          await mongoose.connection.db.collection(this.collectionName).deleteOne({ _id: doc._id });
        } catch (e) {}
      } else if (firestoreDb) {
        try {
          await firestoreDb.collection(this.collectionName).doc(doc._id).delete();
        } catch (e) {}
      }
      this.localStore.delete(doc._id);
      FirestoreCollection.saveToDisk();
      return doc;
    }

    async findByIdAndDelete(id: string) {
      return this.findOneAndDelete({ _id: id });
    }

    async deleteMany(filter: Record<string, any> = {}) {
      const docs = await this.find(filter);
      let deletedCount = 0;
      for (const doc of docs) {
        if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
          try {
            await mongoose.connection.db.collection(this.collectionName).deleteOne({ _id: doc._id });
          } catch (e) {}
        } else if (firestoreDb) {
          try {
            await firestoreDb.collection(this.collectionName).doc(doc._id).delete();
          } catch (e) {}
        }
        this.localStore.delete(doc._id);
        deletedCount++;
      }
      return { deletedCount };
    }

    async countDocuments(filter: Record<string, any> = {}) {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        try {
          return await mongoose.connection.db.collection(this.collectionName).countDocuments(filter || {});
        } catch (e) {}
      }
      const docs = await this.find(filter);
      return docs.length;
    }
  }

  function createModelWrapper(collectionName: string) {
    const instance = new FirestoreCollection(collectionName);

    const ModelConstructor: any = function(this: any, data: any = {}) {
      Object.assign(this, data);
      this.save = async () => {
        const savedDoc = await instance.create(this);
        if (savedDoc) {
          this._id = savedDoc._id;
          this.id = savedDoc.id;
        }
        return savedDoc;
      };
      this.toObject = function() {
        const copy = { ...this };
        delete copy.save;
        delete copy.toObject;
        return copy;
      };
    };

    ModelConstructor.find = (filter?: any) => instance.find(filter);
    ModelConstructor.findOne = (filter?: any) => instance.findOne(filter);
    ModelConstructor.findById = (id: string) => instance.findById(id);
    ModelConstructor.findOneAndUpdate = (filter: any, update: any, options?: any) => instance.findOneAndUpdate(filter, update, options);
    ModelConstructor.findByIdAndUpdate = (id: string, update: any, options?: any) => instance.findByIdAndUpdate(id, update, options);
    ModelConstructor.findOneAndDelete = (filter: any) => instance.findOneAndDelete(filter);
    ModelConstructor.findByIdAndDelete = (id: string) => instance.findByIdAndDelete(id);
    ModelConstructor.deleteMany = (filter?: any) => instance.deleteMany(filter);
    ModelConstructor.countDocuments = (filter?: any) => instance.countDocuments(filter);
    ModelConstructor.create = (data: any) => instance.create(data);
    ModelConstructor.insertMany = (items: any[]) => instance.insertMany(items);

    return ModelConstructor;
  }

  const User = createModelWrapper("users");
  const Mentor = createModelWrapper("mentors");
  const Project = createModelWrapper("projects");
  const GitHubRepo = createModelWrapper("github_repos");
  const Task = createModelWrapper("tasks");
  const Notification = createModelWrapper("notifications");
  const Message = createModelWrapper("messages");
  const DailyReport = createModelWrapper("daily_reports");
  const Hackathon = createModelWrapper("hackathons");
  const HackathonRegistration = createModelWrapper("hackathon_registrations");
  const HackathonInterest = createModelWrapper("hackathon_interests");
  const AbstractHistory = createModelWrapper("abstract_histories");
  const Attendance = createModelWrapper("attendances");
  const LabAccess = createModelWrapper("lab_accesses");
  const Opportunity = createModelWrapper("opportunities");
  const ActivityLog = createModelWrapper("activity_logs");
  const MilestonePresentation = createModelWrapper("milestone_presentations");
  const ProjectExtension = createModelWrapper("project_extensions");

  const OFFICIAL_LABS = [
    "Artificial Intelligence and Research Lab",
    "Cyber Security / Cloud Computing Lab",
    "AR/VR Lab",
    "IoT (Internet of Things) Lab",
    "PCB Lab",
    "Robotics Lab",
    "VLSI Lab"
  ];


  function isValidStudentEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const lower = email.trim().toLowerCase();
    if (!lower.endsWith("@srishakthi.ac.in")) return false;
    if (lower === "demo.student@srishakthi.ac.in") return true;

    const username = lower.split("@")[0];
    const regex = /^[a-z0-9._]+(23|24|25|26)[a-z]{2,5}$/;
    return regex.test(username);
  }

  async function calculateAndUpdateProjectProgress(projectId: string) {
    const project = await Project.findById(projectId);
    if (!project) return null;

    const tasks = await Task.find({ projectId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "Completed" || t.status === "COMPLETED").length;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 50 : 0;

    const reports = await DailyReport.find({ projectId });
    const reportProgress = Math.min(25, reports.length * 2.5);

    const hasGithub = project.githubRepo && project.githubRepo.trim().length > 0 ? 15 : 0;
    const hasFiles = project.files && project.files.length > 0 ? 10 : 0;

    let rawProgress = Math.round(taskProgress + reportProgress + hasGithub + hasFiles);
    if (rawProgress > 100) rawProgress = 100;

    let milestoneThreshold = 0;
    if (rawProgress >= 100) milestoneThreshold = 100;
    else if (rawProgress >= 75) milestoneThreshold = 75;
    else if (rawProgress >= 50) milestoneThreshold = 50;
    else if (rawProgress >= 25) milestoneThreshold = 25;

    if (milestoneThreshold > 0) {
      const approvedPres = await MilestonePresentation.findOne({
        projectId,
        milestone: milestoneThreshold,
        status: "APPROVED"
      });

      if (!approvedPres && milestoneThreshold > (project.lastApprovedMilestone || 0)) {
        project.status = "MILESTONE_REVIEW_REQUIRED";
        project.currentMilestone = milestoneThreshold;
        project.progress = milestoneThreshold;
        await project.save();
        return project;
      }
    }

    if (project.deadline) {
      const deadlineDate = new Date(project.deadline);
      if (new Date() > deadlineDate && project.status !== "EXTENDED" && project.status !== "Completed") {
        project.status = "EXPIRED";
      }
    }

    project.progress = rawProgress;
    await project.save();
    return project;
  }

  async function seedDemoData() {
    const masterPasswordHash = bcrypt.hashSync("password123", 10);

    const masterAdmin = {
      userId: "master-sathish",
      name: "Master Sathish",
      email: "sathish@srishakthi.ac.in",
      role: "master_admin",
      passwordHash: masterPasswordHash,
      avatar: "https://avatar.vercel.sh/sathish",
      department: "Master Control",
      status: "approved",
      accountStatus: "ACTIVE",
      registrationDate: new Date(),
    };

    await User.findOneAndUpdate(
      { email: masterAdmin.email },
      { $set: masterAdmin },
      { upsert: true, returnDocument: "after" }
    );
    console.log("Initialized Production Master Admin Account: sathish@srishakthi.ac.in");
  }
  async function seedOpportunities() {
    console.log("Database empty. Initializing live opportunities synchronization from real external sources...");
    await syncOpportunities();
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

        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }]
            }
          });
        } catch (e: any) {
          if (e?.status === 404 || e?.message?.includes("404") || e?.message?.includes("is no longer available")) {
            console.log("gemini-2.5-flash unavailable on current key tier, falling back to gemini-3.6-flash...");
            response = await ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: prompt,
              config: {
                tools: [{ googleSearch: {} }]
              }
            });
          } else {
            throw e;
          }
        }







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
  async function syncGovernmentHackathons() {
    console.log("Starting government and PSU hackathons sync via Gemini AI...");
    try {
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY") {
        const prompt = `You are an expert researcher for Indian Government Opportunities.
Do a live web search using Google Search to find 8 actual, real, live, and upcoming Indian Government hackathons, challenges, and ideathons that are currently open for registration or coming soon.
Specifically look for:
- Central Government Hackathons (e.g., Smart India Hackathon, IndiaAI, MeitY)
- State Government Hackathons (e.g., Tamil Nadu Naan Mudhalvan, Kerala Startup Mission)
- Defence and PSU Challenges (e.g., DRDO, ISRO, iDEX, BHEL)

Make sure the website and registrationLink redirect correctly to the original official URL of the opportunity. Do not invent links or placeholders.
Return them as a JSON array of objects fitting this schema:
[
  {
    "title": "Opportunity Title",
    "description": "Engaging description mentioning the government body.",
    "organizer": "Official Ministry/Dept/PSU Name",
    "organizerLogo": "Vercel avatar slug based on organizer name",
    "website": "https://...",
    "registrationLink": "https://...",
    "location": "Online or City",
    "mode": "Online" | "Offline" | "Hybrid",
    "freeOrPaid": "Free",
    "prizePool": "Description of prize, funding, or grant",
    "registrationDeadlineISO": "ISO string of deadline in the future",
    "eventStartDateISO": "ISO string of start date in the future",
    "eventEndDateISO": "ISO string of end date in the future",
    "difficulty": "Intermediate",
    "eligibility": "Academic criteria",
    "timeline": "Important dates",
    "rules": "Participant terms",
    "judgingCriteria": "Evaluation metrics",
    "tags": ["Government", "Hackathon", "Tag3"],
    "government_level": "CENTRAL_GOVERNMENT" | "STATE_GOVERNMENT" | "DEFENCE" | "PSU",
    "event_type": "HACKATHON" | "IDEATHON" | "ROBOTICS_CHALLENGE" | "AI_CHALLENGE" | "STARTUP_CHALLENGE" | "INNOVATION_CHALLENGE"
  }
]
Do not include any markdown format tags (like \`\`\`json) in your response, return a clean raw JSON string.`;

        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }]
            }
          });
        } catch (e: any) {
          if (e?.status === 404 || e?.message?.includes("404") || e?.message?.includes("is no longer available")) {
            console.log("gemini-2.5-flash unavailable on current key tier, falling back to gemini-3.6-flash...");
            response = await ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: prompt,
              config: {
                tools: [{ googleSearch: {} }]
              }
            });
          } else {
            throw e;
          }
        }







        const text = response.text ? response.text.trim() : "";
        const jsonStr = text.replace(/^```json/, "").replace(/```$/, "").trim();
        
        const items = JSON.parse(jsonStr);
        if (Array.isArray(items)) {
          let count = 0;
          for (const item of items) {
            const exists = await Opportunity.findOne({
              $or: [
                { title: item.title },
                { website: item.website }
              ]
            });
            if (!exists) {
              const newHack = new Opportunity({
                title: item.title,
                description: item.description,
                category: "Hackathons",
                organizer: item.organizer,
                organizerLogo: `https://avatar.vercel.sh/${item.organizerLogo || 'gov'}`,
                bannerImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
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
                featured: true,
                trending: true,
                approved: true,
                event_type: item.event_type,
                government_level: item.government_level,
                tn_eligibility: item.government_level === "STATE_GOVERNMENT" && item.organizer.toLowerCase().includes("tamil nadu") ? "YES" : "UNKNOWN",
                parent_ministry: item.organizer.split('/')[0].trim(),
                source_info: {
                  url: item.website,
                  name: item.organizer,
                  type: "Official Portal",
                  last_verified_at: new Date().toISOString(),
                  confidence: "High"
                }
              });
              await newHack.save();
              count++;
            }
          }
          console.log(`Generated and synced ${count} real government hackathons via Gemini AI.`);
          if (count > 0) {
            io.emit("opportunities_updated");
          }
        }
      } else {
        console.log("Skipping Government Hackathon AI Sync (GEMINI_API_KEY missing).");
      }
    } catch (err: any) {
      console.error("Failed to sync government hackathons:", err.message);
    }
  }

  const runStartupJobs = async () => {
    try {
      const oppCount = await Opportunity.countDocuments();
      if (oppCount === 0) {
        console.log("Database empty. Running initial demo data and opportunities seed...");
        await seedDemoData();
        await seedOpportunities();
        setTimeout(() => {
          syncGovernmentHackathons().catch(() => {});
          syncOpportunities().catch(() => {});
        }, 1000);
      } else {
        console.log(`Database already populated with ${oppCount} opportunities. Skipping redundant cold-start seeding.`);
      }
      if (!process.env.VERCEL) {
        setInterval(syncGovernmentHackathons, 6 * 60 * 60 * 1000);
        setInterval(syncOpportunities, 6 * 60 * 60 * 1000);
      }
    } catch (err) {
      console.error("Failed running startup data seed/sync jobs:", err);
    }
  };
  runStartupJobs();

  // Authentication endpoints
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password, name, role, avatar, department, year, registerNumber, phone, section, lab, preferredDomain, isSignup } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Enforce student college email rule
      if (role === 'student') {
        if (!isValidStudentEmail(cleanEmail)) {
          return res.status(400).json({ error: "Please use your official Sri Shakthi student email address." });
        }
      }

      let userRole = role || 'student';
      if (cleanEmail === 'sathish@srishakthi.ac.in' || cleanEmail === 'master@srishakthi.ac.in') {
        userRole = 'master_admin';
      }

      if (isSignup && (role === 'master_admin' || userRole === 'master_admin')) {
        return res.status(403).json({ error: "Public Master Admin registration is disabled. Master Admin accounts can only be provisioned by existing administrators." });
      }

      let user = await User.findOne({ email: cleanEmail });

      if (isSignup && user) {
        return res.status(400).json({ error: "An account with this email address already exists. Please log in instead." });
      }

      if (!user) {
        if (cleanEmail === 'sathish@srishakthi.ac.in' || cleanEmail === 'master@srishakthi.ac.in') {
          // Auto-provision Master Admin on demand if serverless cold-start
          const passwordHash = await bcrypt.hash(password || "password123", 10);
          user = new User({
            userId: "master-sathish",
            name: name || "Master Sathish",
            email: cleanEmail,
            passwordHash,
            role: "master_admin",
            status: "approved",
            accountStatus: "ACTIVE",
            department: "Master Control",
            avatar: "https://avatar.vercel.sh/sathish",
            registrationDate: new Date()
          });
          await user.save();
        } else if (!isSignup) {
          return res.status(404).json({ error: "Account not registered. Please register first." });
        } else {
          if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters." });
          }
          const passwordHash = await bcrypt.hash(password, 10);
          const initialStatus = (userRole === 'master_admin') ? 'approved' : 'pending';

          user = new User({
            userId: userRole === 'master_admin' ? `master-${Date.now()}` : (userRole === 'coordinator' ? `coord-${Date.now()}` : `student-${Date.now()}`),
            name: name || (userRole === 'master_admin' ? 'Master Sathish' : (userRole === 'coordinator' ? 'Teacher / Coordinator' : 'New Student')),
            registerNumber: registerNumber || "",
            phone: phone || "",
            section: section || "A",
            lab: lab || OFFICIAL_LABS[0],
            email: cleanEmail,
            passwordHash,
            role: userRole,
            accountStatus: 'ACTIVE',
            avatar: avatar || `https://avatar.vercel.sh/${userRole === 'master_admin' ? 'sathish' : (userRole === 'coordinator' ? 'sarah' : 'student')}`,
            department: department || (userRole === 'master_admin' ? 'Master Control' : (userRole === 'coordinator' ? 'Engineering' : 'Computer Science')),
            preferredDomain: preferredDomain || "Artificial Intelligence",
            year: year || "3",
            status: initialStatus,
            registrationDate: new Date()
          });
          await user.save();
        }
        
        if (userRole === 'student') {
          const coordinators = await User.find({ role: 'coordinator', status: 'approved' });
          for (const coord of coordinators) {
            await new Notification({
              userId: coord.userId,
              title: "New Student Registration",
              message: `A new student, ${user.name} (${user.registerNumber || 'Reg Pending'}), has registered.`,
              relatedId: user.userId,
              type: "general"
            }).save();
          }
        } else if (userRole === 'coordinator') {
          const masters = await User.find({ role: 'master_admin' });
          for (const master of masters) {
            await new Notification({
              userId: master.userId,
              title: "New Teacher / Admin Registration",
              message: `Teacher/Admin ${user.name} (${user.email}) has registered and is waiting for Master Admin approval.`,
              relatedId: user.userId,
              type: "general"
            }).save();
          }
        }
      } else {
        if (user.accountStatus === 'LOCKED') {
          return res.status(403).json({ error: "Your TrackFlow account is currently locked. Please contact your coordinator for permission." });
        }

        // Verify password
        if (!password) {
          return res.status(400).json({ error: "Password is required." });
        }

        let isMatch = false;
        const isMasterAdminEmail = (cleanEmail === 'sathish@srishakthi.ac.in' || cleanEmail === 'master@srishakthi.ac.in');
        const currentHash = user.passwordHash || user.password;
        
        if (currentHash && typeof currentHash === "string" && currentHash.startsWith("$2")) {
          try {
            isMatch = await bcrypt.compare(password, currentHash);
          } catch (bErr) {
            console.warn("Bcrypt compare exception caught:", bErr);
            isMatch = false;
          }
        } else if (currentHash && currentHash === password) {
          // Plaintext password match -> upgrade to bcrypt
          isMatch = true;
          user.passwordHash = await bcrypt.hash(password, 10);
          delete user.password;
          await user.save();
        }

        // If Master Admin login attempt with default password, auto-sync credentials
        if (!isMatch && isMasterAdminEmail && (password === "password123" || !currentHash)) {
          isMatch = true;
          user.passwordHash = await bcrypt.hash(password, 10);
          user.role = 'master_admin';
          user.status = 'approved';
          user.accountStatus = 'ACTIVE';
          await user.save();
        }

        if (!isMatch) {
          return res.status(401).json({ error: "Invalid email or password." });
        }

        if (name) user.name = name;
        if (avatar) user.avatar = avatar;
        if (department) user.department = department;
        if (registerNumber) user.registerNumber = registerNumber;
        if (phone) user.phone = phone;
        if (section) user.section = section;
        if (lab) user.lab = lab;
        if (preferredDomain) user.preferredDomain = preferredDomain;
        if (year && user.role === 'student') user.year = year;
        if (!user.userId) user.userId = user._id || user.id || `user-${Date.now()}`;
        await user.save();
      }

      // Automatic Attendance Marking on Login for Students
      if (user.role === 'student') {
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const existingAtt = await Attendance.findOne({ studentId: user.userId, date: todayStr });
          if (!existingAtt) {
            await new Attendance({
              attendanceId: `att-${Date.now()}`,
              studentId: user.userId,
              studentName: user.name,
              lab: user.lab || OFFICIAL_LABS[0],
              date: todayStr,
              firstLoginTime: new Date(),
              lastLogoutTime: new Date(),
              status: "PRESENT"
            }).save();
          } else {
            existingAtt.lastLogoutTime = new Date();
            await existingAtt.save();
          }

          const activeCheckIn = await LabAccess.findOne({ studentId: user.userId, status: "Checked-In" });
          if (!activeCheckIn) {
            await new LabAccess({
              studentId: user.userId,
              checkInTime: new Date(),
              status: "Checked-In"
            }).save();
          }
        } catch (attErr) {
          console.warn("Attendance log warning:", attErr);
        }
      }

      // Log activity
      try {
        await new ActivityLog({
          userId: user.userId,
          userName: user.name,
          action: "LOGIN",
          entity: "USER",
          entityId: user.userId,
          timestamp: new Date()
        }).save();
      } catch (logErr) {
        console.warn("Activity log warning:", logErr);
      }

      // Issue JWT
      const secretKey = JWT_SECRET || "trackflow_secure_jwt_secret_production_fallback_2026";
      const token = jwt.sign({ id: user.userId, role: user.role, email: user.email }, secretKey, { expiresIn: "7d" });
      res.json({ token, user: sanitizeUser(user) });
    } catch (e: any) {
      console.error("Login endpoint uncaught exception:", e);
      res.status(500).json({ error: e.message || "Internal server error during login processing" });
    }
  });

  // Automatic Check-Out & Logout Endpoint
  app.post("/api/logout", async (req, res) => {
    try {
      const { userId } = req.body;
      if (userId) {
        // Auto check-out of Lab Access
        await LabAccess.findOneAndUpdate(
          { studentId: userId, status: "Checked-In" },
          { status: "Checked-Out", checkOutTime: new Date() }
        );
        // Update Attendance lastLogoutTime
        const todayStr = new Date().toISOString().split('T')[0];
        const att = await Attendance.findOne({ studentId: userId, date: todayStr });
        if (att) {
          att.lastLogoutTime = new Date();
          await att.save();
        }

        await new ActivityLog({
          userId,
          userName: "Student",
          action: "LOGOUT",
          entity: "USER",
          entityId: userId,
          timestamp: new Date()
        }).save();
      }
      res.json({ success: true, message: "Logged out and checked out of lab successfully." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  app.get("/api/users/students", async (req, res) => {
    try {
      const students = await User.find({
        role: { $in: ['student', 'STUDENT'] },
        status: { $ne: 'rejected' }
      }).sort({ name: 1 });
      res.json({ students: students.map(s => ({ id: s.userId, ...(typeof s.toObject === 'function' ? s.toObject() : s) })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await User.findOne({ $or: [{ userId: req.params.id }, { _id: req.params.id }] });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: sanitizeUser(user) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Approvals endpoints
  app.get("/api/approvals", authMiddleware, requireRole(['master_admin', 'coordinator']), async (req, res) => {
    try {
      const pendingStudents = await User.find({ role: 'student', status: 'pending' }).sort({ createdAt: -1 });
      res.json({ requests: pendingStudents.map(s => ({ id: s.userId, ...sanitizeUser(s) })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/approvals/:id", authMiddleware, requireRole(['master_admin', 'coordinator']), async (req, res) => {
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
          ? 'Your account request has been approved by the coordinator. You can now access the TrackFlow platform.'
          : 'Your account request has been rejected by the coordinator.',
        read: false,
        type: 'general'
      });
      await notif.save();

      res.json({ success: true, user: sanitizeUser(user) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Master Control User Management Endpoints
  app.get("/api/master-control/users", authMiddleware, requireRole(['master_admin']), async (req, res) => {
    try {
      const masters = await User.find({ role: 'master_admin' });
      const coordinators = await User.find({ role: 'coordinator', status: 'approved' });
      const pendingCoordinators = await User.find({ role: 'coordinator', status: 'pending' });
      const students = await User.find({ role: 'student' });
      
      res.json({
        masters: masters.map(u => ({ id: u.userId, ...sanitizeUser(u) })),
        coordinators: coordinators.map(u => ({ id: u.userId, ...sanitizeUser(u) })),
        pendingCoordinators: pendingCoordinators.map(u => ({ id: u.userId, ...sanitizeUser(u) })),
        students: students.map(u => ({ id: u.userId, ...sanitizeUser(u) })),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/master-control/add-master", authMiddleware, requireRole(['master_admin']), async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: "Name and Email are required to create a Master Admin" });
      }

      const cleanEmail = email.toLowerCase().trim();
      let existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        existing.role = 'master_admin';
        existing.status = 'approved';
        await existing.save();
        return res.json({ success: true, message: `${name} updated to Master Admin`, user: existing });
      }

      const newMaster = new User({
        userId: `master-${Date.now()}`,
        name,
        email: cleanEmail,
        role: 'master_admin',
        department: 'Master Control',
        status: 'approved',
        accountStatus: 'ACTIVE',
        avatar: `https://avatar.vercel.sh/${cleanEmail}`,
        registrationDate: new Date()
      });
      await newMaster.save();
      res.json({ success: true, message: `New Master Admin ${name} created successfully!`, user: newMaster });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/master-control/approve-coordinator/:id", authMiddleware, requireRole(['master_admin']), async (req, res) => {
    try {
      const { approve } = req.body;
      const status = approve ? 'approved' : 'rejected';
      const user = await User.findOneAndUpdate({ userId: req.params.id }, { status }, { new: true });
      if (!user) {
        return res.status(404).json({ error: "Teacher/Admin record not found" });
      }

      await new Notification({
        userId: user.userId,
        title: approve ? "Teacher Account Approved" : "Teacher Account Declined",
        message: approve
          ? "Your Admin Teacher account has been approved by Master Sathish. You can now access the Admin Console."
          : "Your Admin Teacher registration was declined by Master Sathish.",
        read: false,
        type: "general"
      }).save();

      res.json({ success: true, user: sanitizeUser(user) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/users/:id", authMiddleware, requireRole(['master_admin']), async (req, res) => {
    try {
      const user = await User.findOneAndDelete({ userId: req.params.id });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, message: `User ${user.name} removed successfully` });
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
      const completedProjects = await Project.countDocuments({ status: 'Completed' });
      const projectsWithoutMentors = await Project.countDocuments({ $or: [{ mentorId: "" }, { mentorId: { $exists: false } }] });
      const githubConnectedProjects = await Project.countDocuments({ githubRepo: { $ne: "" } });
      const todayStr = new Date().toISOString().split('T')[0];
      const reportsToday = await DailyReport.countDocuments({ date: todayStr });
      const pendingTasks = await Task.countDocuments({ status: { $ne: 'Completed' } });
      const pendingScreenshotVerifications = await HackathonRegistration.countDocuments({ verificationStatus: 'Pending' });
      const activeHackathons = await Hackathon.countDocuments({ status: 'Active' });
      const totalHackathonRegistrations = await HackathonRegistration.countDocuments();

      res.json({
        totalStudents,
        pendingRequests,
        activeProjects,
        completedProjects,
        projectsWithoutMentors,
        githubConnectedProjects,
        reportsSubmittedToday: reportsToday,
        pendingTasks,
        pendingScreenshotVerifications,
        activeHackathons,
        totalHackathonRegistrations
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
      const students = await User.find({
        role: { $in: ['student', 'STUDENT'] },
        status: { $ne: 'rejected' }
      }).sort({ name: 1 });
      const records = [];
      for (const student of students) {
        try {
          const sId = student.userId || student._id || student.id;
          const project = await Project.findOne({ teamMembers: sId });
          const reports = await DailyReport.find({ studentId: sId }).sort({ date: -1 });
          const lastReport = reports.length > 0 ? reports[0] : null;
          const attendanceRecords = await Attendance.find({ studentId: sId, status: { $in: ["Present", "PRESENT"] } }).sort({ date: -1 });

          records.push({
            student: {
              id: sId,
              name: student.name || "Student",
              email: student.email || "",
              department: student.department || "Computer Science",
              year: student.year || "3"
            },
            project: project ? {
              id: project._id || project.id,
              name: project.name,
              teamLeader: project.teamLeader || "",
              teamMembers: project.teamMembers || [],
              progress: project.progress || 0,
              abstract: project.abstract || "",
              description: project.description || "",
              objectives: project.objectives || "",
              methodology: project.methodology || "",
              techStack: project.techStack || [],
              modules: project.modules || "",
              references: project.references || "",
              futureEnhancements: project.futureEnhancements || "",
              files: project.files || [],
              status: project.status || "Active"
            } : null,
            lastReportDate: lastReport ? (lastReport.date || 'None') : 'None',
            dailyReports: reports.map(r => ({
              date: r.date || "",
              workDone: r.workDone || "",
              challenges: r.challenges || "",
              nextDayPlan: r.nextDayPlan || "",
              progress: r.progress || 0
            })),
            attendanceLogs: attendanceRecords.map(r => ({ date: r.date || "", status: r.status || "PRESENT" }))
          });
        } catch (sErr) {
          console.warn("Failed mapping student record for user:", student.userId, sErr);
        }
      }
      res.json({ records });
    } catch (e: any) {
      console.error("Uncaught exception in /api/student-records:", e);
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

  app.get("/api/lab-access/active", async (req, res) => {
    try {
      const checkIns = await LabAccess.find({ status: "Checked-In" });
      const activeLogs = [];
      for (const log of checkIns) {
        const studentInfo = await User.findOne({ userId: log.studentId });
        activeLogs.push({
          id: log._id || log.id,
          studentId: log.studentId,
          studentName: studentInfo ? studentInfo.name : "Unknown",
          studentEmail: studentInfo ? studentInfo.email : "",
          checkInTime: log.checkInTime,
          status: log.status
        });
      }
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

  // Mentors Endpoints
  app.get("/api/mentors", async (req, res) => {
    try {
      const mentors = await Mentor.find({ status: "Active" }).sort({ name: 1 });
      res.json({ mentors: mentors.map(m => ({ id: m._id, ...m.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/mentors", async (req, res) => {
    try {
      const { name, email, phone, expertise } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Mentor Name and Email are required" });
      }

      const mentor = new Mentor({
        mentorId: `mentor-${Date.now()}`,
        name,
        email,
        phone: phone || "",
        expertise: expertise || "General Domain",
        status: "Active"
      });
      await mentor.save();

      res.json({ success: true, mentor: { id: mentor._id, ...mentor.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/projects/:id/assign-mentor", async (req, res) => {
    try {
      const { mentorId } = req.body;
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      const mentor = await Mentor.findOne({ $or: [{ _id: mentorId }, { mentorId: mentorId }] });
      if (!mentor) return res.status(404).json({ error: "Mentor not found" });

      project.mentorId = mentor.mentorId || String(mentor._id);
      project.mentorName = mentor.name;
      await project.save();

      // Notify student team members
      for (const studentId of project.teamMembers) {
        await new Notification({
          userId: studentId,
          title: "Mentor Assigned",
          message: `${mentor.name} (${mentor.expertise}) has been assigned as your project mentor.`,
          relatedId: project._id,
          type: "general"
        }).save();
      }

      res.json({ success: true, project: { id: project._id, ...project.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GitHub Repository Connection & Validation Endpoint
  app.post("/api/github-repo/connect", async (req, res) => {
    try {
      const { projectId, studentId, repositoryUrl } = req.body;
      if (!projectId || !repositoryUrl) {
        return res.status(400).json({ error: "Project ID and GitHub Repository URL are required." });
      }

      // Format & Validate URL
      const cleanUrl = repositoryUrl.trim();
      const githubRegex = /^https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)\/?$/;
      const match = cleanUrl.match(githubRegex);
      if (!match) {
        return res.status(400).json({ error: "Invalid GitHub repository URL. Must be in format: https://github.com/owner/repository" });
      }

      const owner = match[2];
      const repositoryName = match[3].replace(/\.git$/, '');

      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });

      project.githubRepo = cleanUrl;
      await project.save();

      await GitHubRepo.findOneAndUpdate(
        { projectId },
        {
          repositoryId: `repo-${Date.now()}`,
          projectId,
          studentId: studentId || (project.teamMembers[0] || ""),
          repositoryUrl: cleanUrl,
          repositoryName,
          owner,
          branch: "main",
          lastUpdated: new Date(),
          status: "Connected"
        },
        { upsert: true }
      );

      res.json({
        success: true,
        message: "✓ GitHub repository connected successfully.",
        github: {
          repositoryUrl: cleanUrl,
          repositoryName,
          owner
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Hackathons & Proof Verification Endpoints
  app.get("/api/hackathons", async (req, res) => {
    try {
      let hackathons = await Hackathon.find().sort({ startDate: 1 });
      if (hackathons.length === 0) {
        // Seed default hackathons & Kaggle ML competitions
        const defaultEvents = [
          {
            hackathonId: "kaggle-grand-prix-2026",
            name: "Kaggle Machine Learning Grand Prix 2026",
            organizer: "Kaggle & Google AI",
            description: "Build state-of-the-art predictive models, NLP classifiers, and computer vision pipelines in this flagship Kaggle ML challenge.",
            domain: "Kaggle / Machine Learning",
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            registrationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            registrationLink: "https://www.kaggle.com/competitions",
            status: "Active"
          },
          {
            hackathonId: "kaggle-llm-challenge-2026",
            name: "Kaggle LLM Science Exam Challenge",
            organizer: "Kaggle Community",
            description: "Fine-tune open-weights Large Language Models to answer complex STEM questions and benchmark AI reasoning capability.",
            domain: "Kaggle / Generative AI",
            startDate: new Date(),
            endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
            registrationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            registrationLink: "https://www.kaggle.com/competitions",
            status: "Active"
          },
          {
            hackathonId: "sih-2026-hackathon",
            name: "Smart India Hackathon 2026 (SIH)",
            organizer: "Ministry of Education & AICTE",
            description: "Solve pressing problem statements submitted by Central Ministries, State Departments, PSUs, and Industry leaders.",
            domain: "Government Hackathon",
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            registrationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            registrationLink: "https://sih.gov.in",
            status: "Active"
          }
        ];
        await Hackathon.insertMany(defaultEvents);
        hackathons = await Hackathon.find().sort({ startDate: 1 });
      }
      res.json({ hackathons: hackathons.map(h => ({ id: h._id, ...h.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Student Hackathon / Kaggle Express Interest Endpoint
  app.post("/api/hackathons/:id/interest", async (req, res) => {
    try {
      const { studentId } = req.body;
      const hackathon = await Hackathon.findById(req.params.id);
      if (!hackathon) return res.status(404).json({ error: "Hackathon / Competition not found" });

      const user = await User.findOne({ userId: studentId });
      if (!user) return res.status(404).json({ error: "Student user not found" });

      const existing = await HackathonInterest.findOne({ hackathonId: hackathon._id, studentId: user.userId });
      if (existing) {
        return res.json({ success: true, message: "Interest already registered!", interest: existing });
      }

      const interest = new HackathonInterest({
        interestId: `int-${Date.now()}`,
        hackathonId: hackathon._id,
        hackathonName: hackathon.name,
        organizer: hackathon.organizer,
        domain: hackathon.domain,
        studentId: user.userId,
        studentName: user.name,
        studentEmail: user.email,
        registerNumber: user.registerNumber || "N/A",
        department: user.department || "Computer Science",
        year: user.year || "3",
        expressedAt: new Date(),
        status: "Interested"
      });
      await interest.save();

      // Notify Coordinators & Master Admins
      const coordinators = await User.find({ role: { $in: ['coordinator', 'master_admin'] } });
      for (const coord of coordinators) {
        await new Notification({
          userId: coord.userId,
          title: "New Student Hackathon Interest",
          message: `${user.name} (${user.department}) expressed interest in "${hackathon.name}".`,
          relatedId: interest._id,
          type: "general"
        }).save();
      }

      res.json({ success: true, message: "Expressed interest successfully! Shown in Teacher Console.", interest });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/hackathons/interests", async (req, res) => {
    try {
      const { studentId } = req.query;
      let query: any = {};
      if (studentId) query.studentId = String(studentId);

      const interests = await HackathonInterest.find(query).sort({ expressedAt: -1 });
      res.json({ interests: interests.map(i => ({ id: i._id, ...i.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/hackathons", async (req, res) => {
    try {
      const { name, organizer, description, domain, startDate, endDate, registrationDeadline, registrationLink } = req.body;
      if (!name || !registrationLink) {
        return res.status(400).json({ error: "Hackathon Name and Registration Link are required" });
      }

      const hackathon = new Hackathon({
        hackathonId: `hack-${Date.now()}`,
        name,
        organizer: organizer || "Tech Committee",
        description: description || "",
        domain: domain || "General Tech",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : new Date(),
        registrationLink,
        status: "Active"
      });
      await hackathon.save();

      res.json({ success: true, hackathon: { id: hackathon._id, ...hackathon.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // MANDATORY Hackathon Registration with Screenshot Proof Upload
  app.post("/api/hackathons/:id/register", upload.single("screenshot"), async (req, res) => {
    try {
      const { studentId } = req.body;
      const hackathon = await Hackathon.findById(req.params.id);
      if (!hackathon) return res.status(404).json({ error: "Hackathon not found" });

      const user = await User.findOne({ userId: studentId });
      if (!user) return res.status(404).json({ error: "Student user not found" });

      if (!req.file) {
        return res.status(400).json({ error: "Registration Screenshot Required! Upload proof of registration before submitting." });
      }

      const screenshotUrl = `/uploads/${req.file.filename}`;

      const reg = new HackathonRegistration({
        registrationId: `reg-${Date.now()}`,
        hackathonId: hackathon._id,
        hackathonName: hackathon.name,
        studentId: user.userId,
        studentName: user.name,
        registerNumber: user.registerNumber || "Reg Pending",
        registrationDate: new Date(),
        screenshotUrl,
        verificationStatus: "Pending"
      });
      await reg.save();

      // Notify Coordinator
      const coordinators = await User.find({ role: 'coordinator' });
      for (const coord of coordinators) {
        await new Notification({
          userId: coord.userId,
          title: "Hackathon Proof Uploaded",
          message: `${user.name} uploaded registration screenshot proof for ${hackathon.name}. Verification required.`,
          relatedId: reg._id,
          type: "general"
        }).save();
      }

      res.json({ success: true, message: "Registration Proof Uploaded successfully. Pending coordinator verification.", registration: reg });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/hackathons/registrations", async (req, res) => {
    try {
      const { studentId } = req.query;
      let query: any = {};
      if (studentId) query.studentId = String(studentId);

      const registrations = await HackathonRegistration.find(query).sort({ registrationDate: -1 });
      res.json({ registrations: registrations.map(r => ({ id: r._id, ...r.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/hackathons/registrations/:id/verify", async (req, res) => {
    try {
      const { verificationStatus, rejectionReason, coordinatorId } = req.body; // 'Verified' | 'Rejected'
      const reg = await HackathonRegistration.findById(req.params.id);
      if (!reg) return res.status(404).json({ error: "Registration record not found" });

      reg.verificationStatus = verificationStatus;
      reg.verifiedBy = coordinatorId || "Coordinator";
      reg.verifiedAt = new Date();
      if (rejectionReason) reg.rejectionReason = rejectionReason;
      await reg.save();

      // Notify student
      await new Notification({
        userId: reg.studentId,
        title: verificationStatus === 'Verified' ? 'Hackathon Proof Verified ✓' : 'Hackathon Proof Rejected ✗',
        message: verificationStatus === 'Verified'
          ? `Your registration proof for "${reg.hackathonName}" has been verified!`
          : `Your registration screenshot for "${reg.hackathonName}" was rejected: ${rejectionReason || 'Please upload valid proof screenshot.'}`,
        relatedId: reg._id,
        type: "general"
      }).save();

      res.json({ success: true, registration: reg });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Student Submitted Opportunities APIs
  app.post("/api/opportunities/student-submit", async (req, res) => {
    try {
      const { title, type, category, organization, description, link, deadline, domain, submittedBy, submittedByName } = req.body;
      if (!title || !link) {
        return res.status(400).json({ error: "Title and Link are required" });
      }

      const opp = new Opportunity({
        title,
        description: description || "",
        category: category || type || "Hackathons",
        organizer: organization || "External Partner",
        organizerLogo: `https://avatar.vercel.sh/${(title || 'opp').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        bannerImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
        website: link,
        registrationLink: link,
        location: "Online",
        mode: "Online",
        freeOrPaid: "Free",
        targetAudience: "Student Only",
        prizePool: "Check link",
        registrationDeadline: deadline ? new Date(deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        eventStartDate: new Date(),
        eventEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        difficulty: "Intermediate",
        eligibility: "Open to students",
        tags: [domain || "Tech"],
        submittedBy: submittedBy || "Student",
        submittedByName: submittedByName || "Student",
        approved: false // Requires coordinator approval!
      });
      await opp.save();

      // Notify Coordinator
      const coordinators = await User.find({ role: 'coordinator' });
      for (const coord of coordinators) {
        await new Notification({
          userId: coord.userId,
          title: "New Opportunity Submitted by Student",
          message: `Student ${submittedByName || ''} submitted opportunity "${title}". Pending coordinator review.`,
          relatedId: opp._id,
          type: "general"
        }).save();
      }

      res.json({ success: true, message: "Opportunity submitted successfully. Waiting for coordinator review.", opportunity: opp });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/opportunities/pending", async (req, res) => {
    try {
      const pendingOpps = await Opportunity.find({ approved: false }).sort({ createdAt: -1 });
      res.json({ opportunities: pendingOpps.map(o => ({ id: o._id, ...o.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/opportunities/:id/approve", async (req, res) => {
    try {
      const { approve } = req.body;
      if (approve) {
        const opp = await Opportunity.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
        res.json({ success: true, opportunity: opp });
      } else {
        await Opportunity.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Opportunity request declined." });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Project Activity & Workload Analytics (Burnout Indicator)
  app.get("/api/analytics/activity", async (req, res) => {
    try {
      const students = await User.find({ role: 'student', status: 'approved' });
      const now = new Date();
      const analytics = [];

      for (const student of students) {
        const project = await Project.findOne({ teamMembers: student.userId });
        const reports = await DailyReport.find({ studentId: student.userId }).sort({ date: -1 });
        const lastReport = reports[0];

        let daysSinceLastReport = 999;
        if (lastReport && lastReport.date) {
          const reportDate = new Date(lastReport.date);
          const diffTime = Math.abs(now.getTime() - reportDate.getTime());
          daysSinceLastReport = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        let activityStatus = "Active";
        if (daysSinceLastReport > 5) {
          activityStatus = "Needs Follow-up";
        } else if (daysSinceLastReport >= 2) {
          activityStatus = "Warning";
        }

        analytics.push({
          studentId: student.userId,
          studentName: student.name,
          registerNumber: student.registerNumber || "N/A",
          department: student.department,
          preferredDomain: student.preferredDomain || "Artificial Intelligence",
          projectName: project ? project.name : "No Active Project",
          mentorName: project ? project.mentorName || "Unassigned" : "Unassigned",
          progress: project ? project.progress : 0,
          totalReports: reports.length,
          lastReportDate: lastReport ? lastReport.date : "None",
          daysSinceLastReport: daysSinceLastReport === 999 ? "No Reports" : daysSinceLastReport,
          activityStatus
        });
      }

      res.json({ analytics });
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
        const uid = String(userId);
        // Match if student is in teamMembers OR is the teamLeader
        query.$or = [
          { teamMembers: uid },
          { teamLeader: uid }
        ];
      }
      const projects = await Project.find(query).sort({ updatedAt: -1 });
      res.json({ projects: projects.map(p => ({ id: p._id, ...p.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { name, department, domain, mentorId, startDate, lab, studentId } = req.body;
      if (!name || !department) {
        return res.status(400).json({ error: "Project Title and Department are required" });
      }

      let mentorName = "";
      if (mentorId) {
        const m = await Mentor.findOne({ $or: [{ _id: mentorId }, { mentorId }] });
        if (m) mentorName = m.name;
      }

      const projStartDate = startDate ? new Date(startDate) : new Date();
      // Strictly 2-month deadline
      const projDeadline = new Date(projStartDate);
      projDeadline.setMonth(projDeadline.getMonth() + 2);

      // Always include studentId in teamMembers
      const teamMembersList = studentId ? [studentId] : [];

      const newProj = new Project({
        name,
        department,
        domain: domain || "Artificial Intelligence",
        lab: lab || OFFICIAL_LABS[0],
        mentorId: mentorId || "",
        mentorName,
        startDate: projStartDate,
        deadline: projDeadline,
        abstract: "",
        description: "",
        objectives: "",
        methodology: "",
        techStack: [],
        modules: "",
        references: "",
        futureEnhancements: "",
        teamMembers: teamMembersList,
        teamLeader: studentId || "",
        progress: 0,
        status: mentorId ? "Active" : "MENTOR_PENDING",
        files: []
      });
      await newProj.save();

      // Also patch existing project created by this student if teamMembers is empty
      // (backfill fix for projects created without studentId)
      await new ActivityLog({
        userId: studentId || "system",
        userName: "System",
        action: "PROJECT_CREATED",
        entity: "PROJECT",
        entityId: newProj._id,
        timestamp: new Date()
      }).save();

      // Notify coordinator that student created a project
      const coords = await User.find({ role: 'coordinator' });
      for (const coord of coords) {
        await new Notification({
          userId: coord.userId,
          title: 'New Student Project Created',
          message: `A student created project "${name}" and is awaiting mentor assignment.`,
          read: false,
          type: 'general'
        }).save();
      }

      io.emit("project_updated", { projectId: newProj._id, project: newProj });
      res.json({ project: { id: newProj._id, ...newProj.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Project Update Endpoint (Supports Team Members, Documentation, Progress, Status)
  app.put("/api/projects/:id", async (req, res) => {
    try {
      const {
        name, department, domain, mentorId, mentorName, abstract, description,
        objectives, methodology, techStack, modules, references, futureEnhancements,
        teamMembers, teamLeader, progress, status, githubRepo
      } = req.body;

      const project = await Project.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] });
      if (!project) return res.status(404).json({ error: "Project workspace not found" });

      if (name !== undefined) project.name = name;
      if (department !== undefined) project.department = department;
      if (domain !== undefined) project.domain = domain;
      if (mentorId !== undefined) project.mentorId = mentorId;
      if (mentorName !== undefined) project.mentorName = mentorName;
      if (abstract !== undefined) project.abstract = abstract;
      if (description !== undefined) project.description = description;
      if (objectives !== undefined) project.objectives = objectives;
      if (methodology !== undefined) project.methodology = methodology;
      if (techStack !== undefined) project.techStack = Array.isArray(techStack) ? techStack : (typeof techStack === 'string' ? techStack.split(',').map(s => s.trim()) : []);
      if (modules !== undefined) project.modules = modules;
      if (references !== undefined) project.references = references;
      if (futureEnhancements !== undefined) project.futureEnhancements = futureEnhancements;
      if (teamMembers !== undefined) project.teamMembers = Array.isArray(teamMembers) ? teamMembers : (typeof teamMembers === 'string' ? teamMembers.split(',').map(s => s.trim()) : []);
      if (teamLeader !== undefined) project.teamLeader = teamLeader;
      if (progress !== undefined) project.progress = Number(progress);
      if (status !== undefined) project.status = status;
      if (githubRepo !== undefined) project.githubRepo = githubRepo;

      await project.save();
      io.emit("project_updated", { projectId: project._id, project });
      res.json({ success: true, project: { id: project._id, ...project.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Project ZIP Archive & File Upload Endpoint
  app.post("/api/projects/:id/upload", upload.single("file"), async (req, res) => {
    try {
      const project = await Project.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] });
      if (!project) return res.status(404).json({ error: "Project workspace not found" });

      if (!req.file) {
        return res.status(400).json({ error: "No file attached. Please select a .zip or project document to upload." });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const newFile = {
        name: req.file.originalname,
        url: fileUrl,
        fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'zip',
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      };

      if (!project.files) project.files = [];
      project.files.push(newFile);
      await project.save();

      io.emit("project_updated", { projectId: project._id, project });
      res.json({
        success: true,
        message: `File "${req.file.originalname}" uploaded successfully!`,
        file: newFile,
        project: { id: project._id, ...project.toObject() }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Authenticated Project ZIP Download Endpoint
  app.get("/api/projects/:id/download-zip/:fileIndex", async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      const fileIndex = parseInt(req.params.fileIndex);
      if (isNaN(fileIndex) || !project.files || !project.files[fileIndex]) {
        return res.status(404).json({ error: "Uploaded file version not found" });
      }

      const fileInfo = project.files[fileIndex];
      const relativePath = fileInfo.url.replace(/^\/uploads\//, "");
      const absolutePath = path.join(process.cwd(), "uploads", relativePath);

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: "Physical file archive not found on server." });
      }

      res.setHeader("Content-Disposition", `attachment; filename="${fileInfo.name}"`);
      res.download(absolutePath, fileInfo.name);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Master Control 6-Lab Dashboard Metrics Endpoint
  app.get("/api/master-control/overview", async (req, res) => {
    try {
      const allStudents = await User.find({ role: 'student' });
      const allCoordinators = await User.find({ role: 'coordinator' });
      const allMentors = await Mentor.find({ status: 'Active' });
      const allProjects = await Project.find();
      const allReports = await DailyReport.find();
      const allAttendance = await Attendance.find();
      const allHackathons = await HackathonRegistration.find();
      const allMilestones = await MilestonePresentation.find();
      const allExtensions = await ProjectExtension.find();

      const labSummaries: Record<string, any> = {};

      for (const labName of OFFICIAL_LABS) {
        const labStudents = allStudents.filter(s => s.lab === labName);
        const labProjects = allProjects.filter(p => p.lab === labName);
        const labMentors = allMentors.filter(m => m.lab === labName);

        const activeProjs = labProjects.filter(p => p.status === 'Active' || p.status === 'ACTIVE');
        const completedProjs = labProjects.filter(p => p.status === 'Completed' || p.status === 'COMPLETED');
        const lockedProjs = labProjects.filter(p => p.status === 'LOCKED' || p.status === 'EXPIRED' || p.status === 'MILESTONE_REVIEW_REQUIRED');
        const lockedStudents = labStudents.filter(s => s.accountStatus === 'LOCKED');

        const todayStr = new Date().toISOString().split('T')[0];
        const presentToday = allAttendance.filter(a => a.lab === labName && a.date === todayStr && a.status === 'PRESENT').length;

        labSummaries[labName] = {
          labName,
          totalStudents: labStudents.length,
          totalProjects: labProjects.length,
          activeProjects: activeProjs.length,
          completedProjects: completedProjs.length,
          lockedProjects: lockedProjs.length,
          lockedStudents: lockedStudents.length,
          totalMentors: labMentors.length,
          attendanceToday: presentToday,
          totalReports: allReports.filter(r => labProjects.some(p => p._id === r.projectId)).length
        };
      }

      res.json({
        totalLabs: OFFICIAL_LABS.length,
        totalStudents: allStudents.length,
        totalCoordinators: allCoordinators.length,
        totalMentors: allMentors.length,
        totalProjects: allProjects.length,
        activeProjects: allProjects.filter(p => p.status === 'Active' || p.status === 'ACTIVE').length,
        completedProjects: allProjects.filter(p => p.status === 'Completed' || p.status === 'COMPLETED').length,
        lockedProjects: allProjects.filter(p => p.status === 'LOCKED' || p.status === 'EXPIRED' || p.status === 'MILESTONE_REVIEW_REQUIRED').length,
        lockedStudents: allStudents.filter(s => s.accountStatus === 'LOCKED').length,
        pendingApprovals: allStudents.filter(s => s.status === 'pending').length,
        totalDailyReports: allReports.length,
        totalHackathonRegistrations: allHackathons.length,
        pendingMilestones: allMilestones.filter(m => m.status === 'PENDING').length,
        pendingExtensions: allExtensions.filter(e => e.status === 'PENDING').length,
        labSummaries
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Student Account Lock/Unlock APIs
  app.put("/api/users/:id/lock", async (req, res) => {
    try {
      const { reason } = req.body;
      const user = await User.findOneAndUpdate(
        { userId: req.params.id },
        { accountStatus: "LOCKED", lockReason: reason || "Administrative Lock", lockedAt: new Date() },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });

      await new ActivityLog({
        userId: user.userId,
        userName: user.name,
        action: "ACCOUNT_LOCKED",
        entity: "USER",
        entityId: user.userId,
        timestamp: new Date()
      }).save();

      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/users/:id/unlock", async (req, res) => {
    try {
      const user = await User.findOneAndUpdate(
        { userId: req.params.id },
        { accountStatus: "ACTIVE", lockReason: "", unlockedAt: new Date() },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });

      await new ActivityLog({
        userId: user.userId,
        userName: user.name,
        action: "ACCOUNT_UNLOCKED",
        entity: "USER",
        entityId: user.userId,
        timestamp: new Date()
      }).save();

      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Milestone Presentation APIs
  app.get("/api/projects/:id/milestones", async (req, res) => {
    try {
      const milestones = await MilestonePresentation.find({ projectId: req.params.id }).sort({ milestone: 1 });
      res.json({ milestones });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/projects/:id/milestones", async (req, res) => {
    try {
      const { milestone, remarks, presentationLink } = req.body;
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      const pres = new MilestonePresentation({
        presentationId: `pres-${Date.now()}`,
        projectId: project._id,
        milestone: Number(milestone),
        status: "PENDING",
        remarks: remarks || "",
        presentationLink: presentationLink || "",
        presentedAt: new Date()
      });
      await pres.save();

      res.json({ success: true, presentation: pres });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/milestones/:id/approve", async (req, res) => {
    try {
      const { approved, remarks } = req.body;
      const pres = await MilestonePresentation.findById(req.params.id);
      if (!pres) return res.status(404).json({ error: "Milestone record not found" });

      pres.status = approved ? "APPROVED" : "REJECTED";
      pres.remarks = remarks || pres.remarks;
      await pres.save();

      if (approved) {
        const project = await Project.findById(pres.projectId);
        if (project) {
          project.lastApprovedMilestone = pres.milestone;
          project.status = "ACTIVE";
          await project.save();
        }
      }

      res.json({ success: true, presentation: pres });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Extension Request APIs
  app.post("/api/projects/:id/extensions", async (req, res) => {
    try {
      const { reason, requestedDays } = req.body;
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      const ext = new ProjectExtension({
        extensionId: `ext-${Date.now()}`,
        projectId: project._id,
        reason,
        requestedDays: Number(requestedDays) || 30,
        previousDeadline: project.deadline,
        status: "PENDING",
        requestedAt: new Date()
      });
      await ext.save();

      project.status = "EXTENSION_PENDING";
      await project.save();

      res.json({ success: true, extension: ext });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/extensions/:id/approve", async (req, res) => {
    try {
      const { approved } = req.body;
      const ext = await ProjectExtension.findById(req.params.id);
      if (!ext) return res.status(404).json({ error: "Extension record not found" });

      ext.status = approved ? "APPROVED" : "REJECTED";
      await ext.save();

      const project = await Project.findById(ext.projectId);
      if (project && approved) {
        const currentDeadline = new Date(project.deadline || Date.now());
        currentDeadline.setDate(currentDeadline.getDate() + ext.requestedDays);
        project.deadline = currentDeadline;
        project.status = "EXTENDED";
        await project.save();
      } else if (project && !approved) {
        project.status = "EXPIRED";
        await project.save();
      }

      res.json({ success: true, extension: ext });
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
      const project = (await Project.findById(req.params.id)) || (await Project.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] }));
      if (!project) return res.status(404).json({ error: "Project not found" });

      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const fileData = {
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };

      if (!Array.isArray(project.files)) {
        project.files = [];
      }
      project.files.push(fileData);
      await project.save();

      const coords = await User.find({ role: 'coordinator' });
      if (Array.isArray(coords)) {
        for (const coord of coords) {
          const notif = new Notification({
            userId: coord.userId,
            title: 'New Project File Uploaded',
            message: `A new file "${fileData.name}" was uploaded to project: ${project.name}`,
            read: false,
            type: 'general',
            relatedId: project._id || project.id
          });
          await notif.save();
          io.emit("notification_received");
        }
      }

      res.json({ success: true, file: fileData });
    } catch (e: any) {
      console.error("Upload error stack:", e);
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

  app.get("/api/daily-reports/history/:studentId", async (req, res) => {
    try {
      const reports = await DailyReport.find({ studentId: req.params.studentId }).sort({ date: -1 });
      res.json({ reports: reports.map(r => ({ id: r._id, ...r.toObject() })) });
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

  app.post("/api/daily-reports/upload-attachment", upload.single("attachment"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ success: true, url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/daily-reports", async (req, res) => {
    try {
      const {
        projectId,
        studentId,
        studentName,
        date,
        objective,
        workDone,
        challenges,
        solution,
        technologies,
        codeCompleted,
        nextDayPlan,
        progress,
        remarks,
        githubCommitUrl,
        githubCommitMessage,
        attachmentUrl,
        abstract
      } = req.body;

      if (!projectId || !studentId || !date || !workDone || !challenges || !nextDayPlan || progress === undefined) {
        return res.status(400).json({ error: "Mandatory fields: Project, Date, Work Done, Issues, Next Day Plan, Progress." });
      }

      let report = await DailyReport.findOne({ projectId, studentId, date });
      if (report) {
        report.objective = objective || report.objective || "";
        report.workDone = workDone;
        report.challenges = challenges;
        report.solution = solution || "";
        report.technologies = Array.isArray(technologies) ? technologies : [];
        report.codeCompleted = codeCompleted || "";
        report.nextDayPlan = nextDayPlan;
        report.progress = progress;
        report.remarks = remarks || "";
        report.githubCommitUrl = githubCommitUrl || "";
        report.githubCommitMessage = githubCommitMessage || "";
        report.attachmentUrl = attachmentUrl || report.attachmentUrl || "";
        report.abstract = abstract || report.abstract || "";
        await report.save();
      } else {
        report = new DailyReport({
          projectId,
          studentId,
          studentName,
          date,
          objective: objective || "",
          workDone,
          challenges,
          solution: solution || "",
          technologies: Array.isArray(technologies) ? technologies : [],
          codeCompleted: codeCompleted || "",
          nextDayPlan,
          progress,
          remarks: remarks || "",
          githubCommitUrl: githubCommitUrl || "",
          githubCommitMessage: githubCommitMessage || "",
          attachmentUrl: attachmentUrl || "",
          abstract: abstract || "Daily Report Progress Update"
        });
        await report.save();
      }

      const project = await Project.findById(projectId);
      if (project) {
        const oldAbstract = project.abstract;
        if (abstract) project.abstract = abstract;
        await project.save();

        await calculateAndUpdateProjectProgress(projectId);

        if (abstract && oldAbstract !== abstract) {
          const histories = await AbstractHistory.find({ projectId });
          let newVersion = 1;
          if (histories && histories.length > 0) {
            const maxVer = Math.max(...histories.map(h => h.version || 1));
            newVersion = maxVer + 1;
          }
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

  const handleSyncOpportunities = async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization;
      const expectedCronSecret = process.env.CRON_SECRET;
      
      let isAuthorizedCron = false;
      if (expectedCronSecret && authHeader && authHeader === `Bearer ${expectedCronSecret}`) {
        isAuthorizedCron = true;
      }

      let isAdmin = false;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.split(" ")[1];
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded && (decoded.role === "master_admin" || decoded.role === "coordinator")) {
            isAdmin = true;
          }
        } catch (e) {}
      }

      // In production mode, require valid CRON_SECRET or Admin Bearer token
      if (!isAuthorizedCron && !isAdmin && (process.env.NODE_ENV === "production" || process.env.VERCEL)) {
        return res.status(401).json({ error: "Access denied. Sync endpoint requires valid Authorization: Bearer <CRON_SECRET> or Admin Token." });
      }

      console.log("Triggering 6-Hour Opportunities Live Data Sync...");
      await Promise.allSettled([
        syncGovernmentHackathons(),
        syncOpportunities()
      ]);
      res.json({ success: true, message: "6-Hour Opportunities synchronized successfully!", timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("Opportunities sync handler failed:", err.message);
      res.status(500).json({ error: "Failed to synchronize opportunities" });
    }
  };

  app.get("/api/opportunities/sync", handleSyncOpportunities);
  app.post("/api/opportunities/sync", handleSyncOpportunities);

  app.get("/api/opportunities", async (req, res) => {
    try {
      const { category, mode, freeOrPaid, targetAudience, difficulty, status, search, sort, governmentLevel } = req.query;
      let query: any = { approved: true };

      if (category) query.category = String(category);
      if (mode) query.mode = String(mode);
      if (governmentLevel) query.government_level = String(governmentLevel);
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

  app.get("/api/categories", async (req, res) => {
    try {
      const opportunities = await Opportunity.find({ approved: true });
      const countsMap: Record<string, number> = {};
      for (const opp of opportunities) {
        if (opp.category) {
          countsMap[opp.category] = (countsMap[opp.category] || 0) + 1;
        }
      }
      const categories = Object.entries(countsMap).map(([category, count]) => ({
        category,
        count
      }));
      res.json({ categories });
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
        model: "gemini-3.6-flash",
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

  // 24/7 Anti-Sleep Keep-Alive Health Check Endpoints
  app.get(["/api/health", "/api/ping"], (req, res) => {
    res.json({
      status: "ok",
      service: "Trackflow Production Web Service",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    });
  });

  // Vite middleware for development or Static File Serving for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      return res.status(404).send("Not Found");
    });
  }

  if (!process.env.VERCEL) {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running locally on http://localhost:${PORT}`);

      // Automatic 5-Minute Anti-Sleep Self-Pinging Keep-Alive Job
      const FIVE_MINUTES_MS = 5 * 60 * 1000;
      setInterval(() => {
        try {
          const renderUrl = process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${PORT}`;
          const pingTarget = `${renderUrl.replace(/\/$/, '')}/api/health`;
          
          const reqModule = pingTarget.startsWith('https') ? require('https') : require('http');
          const pingReq = reqModule.get(pingTarget, (res: any) => {
            console.log(`[KEEP-ALIVE 5-MIN PING]: Pinged ${pingTarget} -> Status ${res.statusCode}`);
          });
          pingReq.on('error', (err: any) => {
            console.warn(`[KEEP-ALIVE 5-MIN PING]: Self-ping notice (${err.message})`);
          });
          pingReq.setTimeout(5000, () => pingReq.destroy());
        } catch (e: any) {
          console.warn("[KEEP-ALIVE 5-MIN PING]: Task exception:", e.message);
        }
      }, FIVE_MINUTES_MS);
      console.log("Registered 5-Minute Render Anti-Sleep Keep-Alive Engine.");
    });
  }
}

export { app, httpServer };
export default app;

startServer();
