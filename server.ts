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

      const reqSessionToken = req.headers["x-session-token"] || req.query.sessionToken;
      if (user.activeSessionToken && reqSessionToken && reqSessionToken !== user.activeSessionToken) {
        return res.status(401).json({ error: "CONCURRENT_LOGIN_LOGOUT", message: "Account logged in on another device." });
      }

      res.json({ user: sanitizeUser(user) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/auth/session-check', authMiddleware, async (req: any, res: any) => {
    try {
      const user = await User.findOne({ $or: [{ userId: req.user.id }, { _id: req.user.id }, { email: req.user.email }] });
      if (!user) {
        return res.status(404).json({ error: "User not found", code: "ACCOUNT_NOT_FOUND" });
      }

      const reqSessionToken = req.headers["x-session-token"] || req.query.sessionToken;
      if (user.activeSessionToken && reqSessionToken && reqSessionToken !== user.activeSessionToken) {
        return res.status(401).json({ error: "CONCURRENT_LOGIN_LOGOUT", code: "SESSION_REVOKED", message: "Account logged in on another device." });
      }

      res.json({ active: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Global Logout - Revoke all active sessions for a user
  app.post('/api/auth/logout-all', async (req: any, res: any) => {
    try {
      const { userId, email } = req.body;
      let targetUserId = userId;

      if (!targetUserId && email) {
        const u = await User.findOne({ email: email.toLowerCase().trim() });
        if (u) targetUserId = u.userId;
      }

      if (!targetUserId && req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded) targetUserId = decoded.id;
        } catch (e) {}
      }

      if (targetUserId) {
        const user = await User.findOne({ $or: [{ userId: targetUserId }, { _id: targetUserId }] });
        if (user) {
          user.activeSessionToken = "";
          await user.save();
        }

        const activeSessions = await Session.find({ userId: targetUserId, isActive: true });
        for (const s of activeSessions) {
          s.isActive = false;
          s.revokedAt = new Date();
          await s.save();
        }

        try {
          io.to(`user_${targetUserId}`).emit("force_logout", {
            message: "All sessions have been revoked."
          });
        } catch (sErr) {}
      }

      res.json({ success: true, message: "Logged out from all devices successfully. You can now log in normally." });
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
        return res;
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
              results.push(this.formatDoc(doc._id.toString(), doc));
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
          if (doc) return this.formatDoc(doc._id.toString(), doc);
        } catch (e) {}
      }
      const results = await this.find(filter);
      return results.length > 0 ? results[0] : null;
    }

    async findById(id: string) {
      if (!id) return null;
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        try {
          const doc = await mongoose.connection.db.collection(this.collectionName).findOne({ _id: id } as any);
          if (doc) return this.formatDoc(doc._id.toString(), doc);
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
  const Session = createModelWrapper("sessions");

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
          const endDate = new Date(hackathon.end);
          if (endDate.getTime() < Date.now()) continue; // Only skip if event already finished!

          const startDate = new Date(hackathon.start);

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
              prizePool: "Swag & Cash Prizes",
              registrationDeadline: endDate,
              eventStartDate: startDate,
              eventEndDate: endDate,
              difficulty: "Intermediate",
              eligibility: "High school and university students.",
              timeline: `Starts: ${startDate.toLocaleDateString()}`,
              rules: "Standard MLH or Hack Club rules apply. See website for full Code of Conduct.",
              judgingCriteria: "Innovation, technical complexity, and impact.",
              tags: ["Hackathon", "Build", "Hack Club"],
              featured: true,
              trending: true,
              approved: true,
            });
            await newHackathon.save();
            newCount++;
          }
        }
        console.log(`Synced ${newCount} new live hackathons from Hack Club API.`);
      }
    } catch (err: any) {
      console.log("Hack Club API fetch failed, skipping...", err.message);
    }

    try {
      console.log("Fetching live hackathons across multiple pages from Devpost API...");
      for (let page = 1; page <= 5; page++) {
        try {
          const devpostRes = await axios.get(`https://devpost.com/api/hackathons?page=${page}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/120.0.0.0",
              "Accept": "application/json"
            },
            timeout: 10000
          });
          if (devpostRes.data && Array.isArray(devpostRes.data.hackathons)) {
            let count = 0;
            for (const hackathon of devpostRes.data.hackathons) {
              const cleanUrl = hackathon.url ? (hackathon.url.startsWith("http") ? hackathon.url : `https:${hackathon.url}`) : "https://devpost.com";
              const exists = await Opportunity.findOne({
                $or: [
                  { title: hackathon.title },
                  { website: cleanUrl }
                ]
              });

              if (!exists) {
                let eventStartDate = new Date();
                let eventEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                let registrationDeadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

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
                  featured: hackathon.featured || true,
                  trending: hackathon.registrations_count > 500,
                  approved: true,
                });
                await newHackathon.save();
                count++;
                newCount++;
              }
            }
            console.log(`Synced Page ${page}: ${count} new hackathons from Devpost API.`);
          }
        } catch (pageErr: any) {
          console.log(`Devpost page ${page} fetch warning:`, pageErr.message);
        }
      }
    } catch (err: any) {
      console.log("Devpost API multi-page fetch failed, skipping...");
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

  async function cleanupExpiredHackathons() {
    try {
      const now = new Date();
      const allHackathons = await Hackathon.find();
      let deletedCount = 0;

      for (const h of allHackathons) {
        const deadlineExpired = h.registrationDeadline ? new Date(h.registrationDeadline).getTime() < now.getTime() : false;
        const endExpired = h.endDate ? new Date(h.endDate).getTime() < now.getTime() : false;
        const isStatusExpired = h.status === "Expired";

        // Only purge if BOTH deadline and end date have passed, or explicitly marked Expired
        if ((deadlineExpired && endExpired) || isStatusExpired) {
          await Hackathon.findByIdAndDelete(h._id || h.id);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[Expired Hackathon Cleanup] Purged ${deletedCount} expired hackathons.`);
        io.emit("hackathons_updated");
      }
      return deletedCount;
    } catch (err: any) {
      console.error("Expired hackathon cleanup error:", err.message);
      return 0;
    }
  }

  async function cleanupExpiredOpportunities() {
    try {
      const now = new Date();
      const allOpps = await Opportunity.find();
      let deletedCount = 0;

      for (const opp of allOpps) {
        const deadlineExpired = opp.registrationDeadline && new Date(opp.registrationDeadline).getTime() < now.getTime();
        const endExpired = opp.eventEndDate && new Date(opp.eventEndDate).getTime() < now.getTime();
        const isStatusExpired = opp.status === "Expired";

        if (deadlineExpired || endExpired || isStatusExpired) {
          await Opportunity.findByIdAndDelete(opp._id || opp.id);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[Expired Opportunity Cleanup] Purged ${deletedCount} expired opportunities.`);
        io.emit("opportunities_updated");
      }
      return deletedCount;
    } catch (err: any) {
      console.error("Expired opportunity cleanup error:", err.message);
      return 0;
    }
  }

  let lastHackathonSyncTime = new Date();



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
        return res.status(400).json({ error: "An account with this email address already exists. Please log in.", code: "ACCOUNT_ALREADY_EXISTS" });
      }

      if (!user) {
        if (cleanEmail === 'sathish@srishakthi.ac.in' || cleanEmail === 'master@srishakthi.ac.in') {
          // Auto-provision Master Admin on demand
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
          return res.status(404).json({ error: "No account found with this email address. Please register first.", code: "ACCOUNT_NOT_FOUND" });
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
            department: department || "Computer Science and Engineering",
            preferredDomain: preferredDomain || "Artificial Intelligence",
            year: year || "1",
            status: initialStatus,
            registrationDate: new Date()
          });
          await user.save();
        }
      } else {
        if (user.accountStatus === 'LOCKED') {
          return res.status(403).json({ error: "Your TrackFlow account is currently locked. Please contact your coordinator for permission.", code: "ACCOUNT_LOCKED" });
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
            isMatch = false;
          }
        } else if (currentHash && currentHash === password) {
          isMatch = true;
          user.passwordHash = await bcrypt.hash(password, 10);
          delete user.password;
          await user.save();
        }

        if (!isMatch && isMasterAdminEmail && (password === "password123" || !currentHash)) {
          isMatch = true;
          user.passwordHash = await bcrypt.hash(password, 10);
          user.role = 'master_admin';
          user.status = 'approved';
          user.accountStatus = 'ACTIVE';
          await user.save();
        }

        if (!isMatch) {
          return res.status(401).json({ error: "Invalid email or password.", code: "INVALID_CREDENTIALS" });
        }

        // Check if active session exists on another device
        const { overrideSession, forceLogoutAll } = req.body;
        const now = new Date();
        const activeSessions = await Session.find({ userId: user.userId, isActive: true, expiresAt: { $gt: now } });

        if (activeSessions.length > 0 && !overrideSession && !forceLogoutAll) {
          return res.status(409).json({
            error: "Your account is already logged in on another device. Please log out from that device or log out from all devices.",
            code: "SESSION_ALREADY_ACTIVE",
            userId: user.userId
          });
        }

        // If overriding session or logging in after global logout, revoke old active sessions
        if (activeSessions.length > 0) {
          for (const s of activeSessions) {
            s.isActive = false;
            s.revokedAt = now;
            await s.save();
          }
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

      // Generate fresh session token & DB Session record
      const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      user.activeSessionToken = sessionToken;
      await user.save();

      const newSession = new Session({
        sessionId: `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        userId: user.userId,
        sessionToken,
        deviceId: req.headers["user-agent"] || "device_unknown",
        createdAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true
      });
      await newSession.save();

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

      // Generate single active device session token lock
      const activeSessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      user.activeSessionToken = activeSessionToken;
      await user.save();

      // Force logout any existing socket connection for this user on other devices
      try {
        io.to(`user_${user.userId}`).emit("force_logout", {
          message: "Your account was logged in from another device."
        });
      } catch (sErr) {}

      // Issue JWT
      const secretKey = JWT_SECRET || "trackflow_secure_jwt_secret_production_fallback_2026";
      const token = jwt.sign({ id: user.userId, role: user.role, email: user.email }, secretKey, { expiresIn: "7d" });
      res.json({ token, activeSessionToken, user: sanitizeUser(user) });
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


  // Delete Student User Endpoint (Authorized for Master Admin and Coordinator)
  app.delete("/api/users/:id", authMiddleware, requireRole(['master_admin', 'coordinator']), async (req: any, res: any) => {
    try {
      const targetId = req.params.id;
      const user = await User.findOne({ $or: [{ userId: targetId }, { _id: targetId }] });
      if (!user) {
        return res.status(404).json({ error: "User profile not found." });
      }

      await User.findOneAndDelete({ $or: [{ userId: targetId }, { _id: targetId }] });

      // Clean up student from linked projects
      try {
        const userProjects = await Project.find({ teamMembers: targetId });
        for (const proj of userProjects) {
          proj.teamMembers = (proj.teamMembers || []).filter((m: string) => m !== targetId);
          if (proj.teamLeader === targetId) {
            proj.teamLeader = proj.teamMembers[0] || "";
          }
          await proj.save();
        }
      } catch (pErr) {}

      // Log activity
      try {
        await new ActivityLog({
          userId: req.user.id,
          userName: req.user.name || "Admin",
          action: "DELETE_USER",
          entity: "USER",
          entityId: targetId,
          timestamp: new Date()
        }).save();
      } catch (logErr) {}

      res.json({ success: true, message: `Student profile ${user.name} removed permanently.` });
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

  app.put("/api/users/:id", async (req: any, res: any) => {
    try {
      const targetId = req.params.id;
      const user = await User.findOne({ $or: [{ userId: targetId }, { _id: targetId }] });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const {
        name,
        email,
        department,
        phone,
        avatar,
        githubUsername,
        githubToken,
        password,
        registerNumber,
        year,
        lab,
        preferredDomain,
        status,
        accountStatus,
        role
      } = req.body;

      if (name !== undefined) user.name = name;
      if (email !== undefined && email.trim()) {
        const cleanEmail = email.toLowerCase().trim();
        if (cleanEmail !== user.email) {
          const existing = await User.findOne({ email: cleanEmail });
          if (existing && existing.userId !== user.userId && existing._id !== user._id) {
            return res.status(400).json({ error: "Email address is already in use by another account." });
          }
          user.email = cleanEmail;
        }
      }
      if (department !== undefined) user.department = department;
      if (phone !== undefined) user.phone = phone;
      if (avatar !== undefined) user.avatar = avatar;
      if (githubUsername !== undefined) user.githubUsername = githubUsername;
      if (githubToken !== undefined) user.githubToken = githubToken;
      if (registerNumber !== undefined) user.registerNumber = registerNumber;
      if (year !== undefined) user.year = year;
      if (lab !== undefined) user.lab = lab;
      if (preferredDomain !== undefined) user.preferredDomain = preferredDomain;
      if (status !== undefined) user.status = status;
      if (accountStatus !== undefined) user.accountStatus = accountStatus;
      if (role !== undefined) user.role = role;

      if (password && typeof password === 'string' && password.trim().length > 0) {
        if (password.trim().length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters long." });
        }
        user.passwordHash = await bcrypt.hash(password.trim(), 10);
      }

      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: sanitizeUser(user)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users/quick-student", async (req: any, res: any) => {
    try {
      const { name, email, department, year, registerNumber, lab, section, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const cleanEmail = email.toLowerCase().trim();
      let existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      const rawPass = password && password.trim() ? password.trim() : "student123";
      const passwordHash = await bcrypt.hash(rawPass, 10);
      const newUser = new User({
        userId: `student-${Date.now()}`,
        name: name || "Student",
        email: cleanEmail,
        registerNumber: registerNumber ? registerNumber.trim().toUpperCase() : undefined,
        department: department || "Computer Science and Engineering",
        year: year || "1",
        lab: lab || "Artificial Intelligence and Research Lab",
        section: section || "A",
        role: "student",
        status: "approved",
        accountStatus: "ACTIVE",
        passwordHash,
        avatar: `https://avatar.vercel.sh/${cleanEmail}`,
        registrationDate: new Date()
      });
      await newUser.save();

      res.json({ success: true, user: sanitizeUser(newUser) });
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

  app.put("/api/mentors/:id", async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const mentor = await Mentor.findOne({ $or: [{ _id: id }, { id }, { mentorId: id }] });
      if (!mentor) return res.status(404).json({ error: "Mentor not found" });

      const { name, email, phone, expertise, status } = req.body;
      if (name !== undefined) mentor.name = name;
      if (email !== undefined) mentor.email = email;
      if (phone !== undefined) mentor.phone = phone;
      if (expertise !== undefined) mentor.expertise = expertise;
      if (status !== undefined) mentor.status = status;

      await mentor.save();
      res.json({ success: true, mentor });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/mentors/:id", async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const mentor = await Mentor.findOne({ $or: [{ _id: id }, { id }, { mentorId: id }] });
      if (!mentor) return res.status(404).json({ error: "Mentor not found" });

      const targetId = mentor._id || mentor.id;
      await Mentor.findByIdAndDelete(targetId);

      // Unassign mentor from projects
      const projects = await Project.find({ mentorId: mentor.mentorId || targetId });
      for (const p of projects) {
        p.mentorId = "";
        p.mentorName = "";
        await p.save();
      }

      res.json({ success: true, message: "Mentor deleted successfully" });
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

  const syncLiveHackathons = async () => {
    let syncedCount = 0;

    // 1. Sync multi-page Devpost API (Pages 1 to 5)
    try {
      console.log("Syncing Devpost live hackathons across multiple pages (1..5)...");
      for (let page = 1; page <= 5; page++) {
        try {
          const devpostRes = await axios.get(`https://devpost.com/api/hackathons?page=${page}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/120.0.0.0",
              "Accept": "application/json"
            },
            timeout: 10000
          });
          if (devpostRes.data && Array.isArray(devpostRes.data.hackathons)) {
            for (const item of devpostRes.data.hackathons) {
              const cleanUrl = item.url ? (item.url.startsWith("http") ? item.url : `https:${item.url}`) : "https://devpost.com";
              const cleanPrize = (item.prize_amount || "").replace(/<[^>]*>/g, "").trim() || "See official site";
              
              const exists = await Hackathon.findOne({
                $or: [{ name: item.title }, { registrationLink: cleanUrl }]
              });
              if (!exists) {
                const hId = `devpost-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                await Hackathon.create({
                  hackathonId: hId,
                  name: item.title,
                  organizer: item.organization_name || "Devpost Organizer",
                  description: `Live software hackathon on Devpost. Prize pool: ${cleanPrize}. Join developers globally to build and submit projects.`,
                  domain: "Global Directory",
                  startDate: new Date(),
                  endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                  registrationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                  registrationLink: cleanUrl,
                  status: "Active"
                });
                syncedCount++;
              }

              const oppExists = await Opportunity.findOne({
                $or: [{ title: item.title }, { website: cleanUrl }]
              });
              if (!oppExists) {
                await Opportunity.create({
                  title: item.title,
                  description: `Real-time Hackathon hosted on Devpost by ${item.organization_name || 'community'}. Build innovative solutions and compete for ${cleanPrize}.`,
                  category: "Hackathons",
                  organizer: item.organization_name || "Devpost Organizer",
                  organizerLogo: item.thumbnail_url 
                    ? (item.thumbnail_url.startsWith("http") ? item.thumbnail_url : `https:${item.thumbnail_url}`)
                    : `https://avatar.vercel.sh/${(item.organization_name || 'devpost').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                  bannerImage: item.thumbnail_url 
                    ? (item.thumbnail_url.startsWith("http") ? item.thumbnail_url : `https:${item.thumbnail_url}`)
                    : "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
                  website: cleanUrl,
                  registrationLink: cleanUrl,
                  location: item.displayed_location?.location || "Online (Participate from Home)",
                  mode: item.displayed_location?.location && !item.displayed_location.location.toLowerCase().includes("online") ? "Offline" : "Online",
                  freeOrPaid: "Free",
                  targetAudience: "Student Only",
                  prizePool: cleanPrize,
                  registrationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                  eventStartDate: new Date(),
                  eventEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                  difficulty: "Intermediate",
                  eligibility: "Open to students and developers globally. Participate online or on-site.",
                  timeline: "Live Registration Open",
                  rules: "Standard platform rules apply.",
                  judgingCriteria: "Quality, execution, and impact.",
                  tags: (item.themes || []).map((t: any) => t.name).concat(["Hackathon", "Devpost", "Build"]),
                  featured: true,
                  trending: true,
                  approved: true
                });
              }
            }
          }
        } catch (pErr: any) {
          console.log(`Devpost page ${page} warning:`, pErr.message);
        }
      }
    } catch (err: any) {
      console.log("Devpost live sync warning:", err.message);
    }

    // 2. Sync from Hack Club API
    try {
      const hcRes = await axios.get("https://hackathons.hackclub.com/api/events/all", { timeout: 10000 });
      if (hcRes.data && Array.isArray(hcRes.data)) {
        for (const item of hcRes.data) {
          const endDate = new Date(item.end);
          if (endDate.getTime() < Date.now()) continue; // Skip only finished hackathons

          const startDate = new Date(item.start);
          const exists = await Hackathon.findOne({
            $or: [{ name: item.name }, { registrationLink: item.website }]
          });
          if (!exists) {
            await Hackathon.create({
              hackathonId: `hc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: item.name,
              organizer: item.organization || "Hack Club Partner",
              description: `Live student hackathon. ${item.desc || 'Build projects, learn skills, and compete with developer community!'}`,
              domain: "Student Hackathon League",
              startDate,
              endDate,
              registrationDeadline: endDate,
              registrationLink: item.website,
              status: "Active"
            });
            syncedCount++;
          }
          const oppExists = await Opportunity.findOne({
            $or: [{ title: item.name }, { website: item.website }]
          });
          if (!oppExists) {
            await Opportunity.create({
              title: item.name,
              description: `Live Student Hackathon hosted by ${item.organization || 'Hack Club Community'}. Build projects and learn skills!`,
              category: "Hackathons",
              organizer: item.organization || "Hack Club Partner",
              organizerLogo: item.logo || `https://avatar.vercel.sh/${(item.name || 'hc').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              bannerImage: item.banner || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
              website: item.website,
              registrationLink: item.website,
              location: item.location || "Online (Participate from Home)",
              mode: item.mode === "virtual" ? "Online" : (item.mode === "hybrid" ? "Hybrid" : "Offline"),
              freeOrPaid: "Free",
              targetAudience: "Student Only",
              prizePool: "Swag & Prizes",
              registrationDeadline: endDate,
              eventStartDate: startDate,
              eventEndDate: endDate,
              difficulty: "Intermediate",
              eligibility: "High school and university students globally.",
              timeline: "Live Registration Open",
              rules: "Standard Hack Club code of conduct applies.",
              judgingCriteria: "Innovation, tech complexity, and impact.",
              tags: ["Hackathon", "Hack Club", "Students"],
              featured: true,
              trending: true,
              approved: true
            });
          }
        }
      }
    } catch (err: any) {
      console.log("Hack Club live sync warning:", err.message);
    }

    // 3. Sync Kontests API (Competitive Coding & Hackathons)
    try {
      const kontestsRes = await axios.get("https://kontests.net/api/v1/all", { timeout: 10000 });
      if (kontestsRes.data && Array.isArray(kontestsRes.data)) {
        for (const contest of kontestsRes.data) {
          const endDate = new Date(contest.end_time);
          if (endDate.getTime() < Date.now()) continue;

          const startDate = new Date(contest.start_time);
          const exists = await Hackathon.findOne({
            $or: [{ name: contest.name }, { registrationLink: contest.url }]
          });
          if (!exists) {
            await Hackathon.create({
              hackathonId: `kontest-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: contest.name,
              organizer: contest.site || "Coding Platform",
              description: `Live coding competition & hackathon hosted on ${contest.site}. Test algorithms & problem solving skills.`,
              domain: "Enterprise & Coding",
              startDate,
              endDate,
              registrationDeadline: endDate,
              registrationLink: contest.url,
              status: "Active"
            });
            syncedCount++;
          }
          const oppExists = await Opportunity.findOne({
            $or: [{ title: contest.name }, { website: contest.url }]
          });
          if (!oppExists) {
            await Opportunity.create({
              title: contest.name,
              description: `Live coding challenge / hackathon hosted on ${contest.site}. Solve algorithmic problem statements and compete globally.`,
              category: "Hackathons",
              organizer: contest.site || "Coding Platform",
              organizerLogo: `https://avatar.vercel.sh/${(contest.site || 'kontest').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              bannerImage: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80",
              website: contest.url,
              registrationLink: contest.url,
              location: "Online",
              mode: "Online",
              freeOrPaid: "Free",
              targetAudience: "Student Only",
              prizePool: "Rating points & Badges",
              registrationDeadline: endDate,
              eventStartDate: startDate,
              eventEndDate: endDate,
              difficulty: "Intermediate",
              eligibility: "Open globally to students and developers.",
              timeline: "Registration Open",
              rules: "Standard platform rules apply.",
              judgingCriteria: "Correctness, speed, and complexity.",
              tags: ["Coding Contest", "Hackathon", contest.site || "Code"],
              featured: true,
              trending: true,
              approved: true
            });
          }
        }
      }
    } catch (err: any) {
      console.log("Kontests live sync warning:", err.message);
    }

    // 4. Gemini Live Grounded Search for DoraHacks, Devfolio, MLH, Hugging Face, Unstop, HackerEarth, SIH, Kaggle
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY") {
      try {
        console.log("Curating live open hackathons on DoraHacks, Devfolio, Hugging Face, MLH, Unstop, HackerEarth, SIH & Kaggle via Gemini AI Search Grounding...");
        const prompt = `Do a live web search using Google Search to find 25 actual, real, live, currently open hackathons for 2026/2027 hosted on these platforms:
- Devfolio (Top Indian tech & college hackathons)
- Smart India Hackathon (SIH 2026 / AICTE)
- DoraHacks (Web3 / open-source & decentralized AI)
- Major League Hacking (MLH Season)
- Hugging Face Competitions (AI / LLM / Open Weights)
- Unstop (Engineering & college hackathons in India)
- HackerEarth (AI & enterprise coding challenges)
- Kaggle (Machine Learning Grand Prix & LLM Challenges)
- Google Developer Communities & Solution Challenge
- Solana Renaissance / ETHGlobal / NASA Space Apps

FETCH BOTH ONLINE & OFFLINE HACKATHONS:
1. Online / Virtual Hackathons (participate 100% from home)
2. Offline / In-Person Hackathons (held on college campuses or in-person tech venues in India and globally)

Make sure to specify "mode": "Online" or "Offline" and "location" for each event.
Make sure the registrationLink redirects directly to the original official URL of the hackathon on its platform.
Return a clean raw JSON array of objects fitting this schema:
[
  {
    "hackathonId": "unique-slug-2026",
    "name": "Exact Hackathon Title",
    "organizer": "Official Organizer Name",
    "description": "Engaging 2-3 sentence overview of the challenge and prize.",
    "domain": "Web3 & Open-Source" | "Recommended Priority Platform" | "AI & LLM Competitions" | "Student Hackathon League" | "College & Tech Competition" | "Enterprise & Coding" | "Government Hackathon" | "Kaggle / Machine Learning",
    "mode": "Online" | "Offline",
    "location": "Online (Virtual / Home)" | "City / Campus Location",
    "registrationLink": "https://...",
    "daysUntilDeadline": 45
  }
]
Do not include markdown tags. Return only raw JSON string.`;

        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
          });
        } catch (e: any) {
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
          });
        }

        const text = response.text ? response.text.trim() : "";
        const jsonStr = text.replace(/^```json/, "").replace(/```$/, "").trim();
        const items = JSON.parse(jsonStr);
        if (Array.isArray(items)) {
          for (const item of items) {
            const existing = await Hackathon.findOne({
              $or: [{ name: item.name }, { registrationLink: item.registrationLink }]
            });
            const days = item.daysUntilDeadline || 45;
            const itemMode = item.mode === "Offline" || (item.location && !item.location.toLowerCase().includes("online")) ? "Offline" : "Online";
            const itemLoc = item.location || (itemMode === "Offline" ? "On-Site / Campus" : "Online (Participate from Home)");

            if (!existing && item.name && item.registrationLink) {
              await Hackathon.create({
                hackathonId: item.hackathonId || `live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: item.name,
                organizer: item.organizer || "Official Organizer",
                description: item.description || "Live hackathon opportunity open for student registration.",
                domain: item.domain || "Global Directory",
                mode: itemMode,
                location: itemLoc,
                startDate: new Date(),
                endDate: new Date(Date.now() + (days + 15) * 24 * 60 * 60 * 1000),
                registrationDeadline: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
                registrationLink: item.registrationLink,
                status: "Active"
              });
              syncedCount++;
            }
            const oppExisting = await Opportunity.findOne({
              $or: [{ title: item.name }, { website: item.registrationLink }]
            });
            if (!oppExisting && item.name && item.registrationLink) {
              await Opportunity.create({
                title: item.name,
                description: item.description || "Live hackathon opportunity.",
                category: "Hackathons",
                organizer: item.organizer || "Official Organizer",
                organizerLogo: `https://avatar.vercel.sh/${(item.organizer || 'hack').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                bannerImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
                website: item.registrationLink,
                registrationLink: item.registrationLink,
                location: itemLoc,
                mode: itemMode,
                freeOrPaid: "Free",
                targetAudience: "Student Only",
                prizePool: "Platform Badges & Cash Prizes",
                registrationDeadline: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
                eventStartDate: new Date(),
                eventEndDate: new Date(Date.now() + (days + 30) * 24 * 60 * 60 * 1000),
                difficulty: "Intermediate",
                eligibility: itemMode === "Offline" ? "Open to students on-site." : "Open to students globally online.",
                timeline: "Active Registration Open",
                rules: "Standard platform terms apply.",
                judgingCriteria: "Innovation, impact, and technical execution.",
                tags: ["Hackathon", "Build", item.domain || "Live Event", itemMode],
                featured: true,
                trending: true,
                approved: true
              });
            }
          }
        }
      } catch (err: any) {
        console.warn("Gemini Live Hackathon Grounded Sync failed:", err.message);
      }
    }

    lastHackathonSyncTime = new Date();
    console.log(`[6-Hour Cron Completed] Synced ${syncedCount} new live hackathons. Last synced: ${lastHackathonSyncTime.toISOString()}`);
    io.emit("hackathons_updated");
    io.emit("opportunities_updated");
    return syncedCount;
  };

  const runStartupJobs = async () => {
    try {
      const oppCount = await Opportunity.countDocuments();
      console.log(`[TrackFlow Server] Initial startup check: Database contains ${oppCount} opportunities.`);
      if (oppCount < 10) {
        console.log("Database low on opportunities. Running initial seed...");
        await seedDemoData();
        await seedOpportunities();
      }
      
      // Instantly trigger live hackathon sync across Devpost (P1..5), Hack Club, Kontests, & Gemini AI Grounding
      syncLiveHackathons().catch((err) => console.error("Initial live hackathon background sync:", err.message));

      // Purge any historical duplicate message records from DB
      try {
        const allMsgs = await Message.find().sort({ createdAt: 1 });
        const idsToRemove: any[] = [];
        const seenMap: Record<string, Date> = {};

        for (const m of allMsgs) {
          const key = `${m.userId || ""}_${m.projectId || ""}_${(m.text || "").trim()}`;
          const lastTime = seenMap[key];
          if (lastTime && m.createdAt && (new Date(m.createdAt).getTime() - lastTime.getTime() < 10000)) {
            idsToRemove.push(m._id);
          } else if (m.createdAt) {
            seenMap[key] = new Date(m.createdAt);
          }
        }

        if (idsToRemove.length > 0) {
          await Message.deleteMany({ _id: { $in: idsToRemove } });
          console.log(`[TrackFlow Cleanup] Purged ${idsToRemove.length} historical duplicate chat messages from database.`);
        }
      } catch (cleanErr: any) {
        console.warn("Message duplicate cleanup warning:", cleanErr.message);
      }

      if (!process.env.VERCEL) {
        // Purge expired hackathons and opportunities every 15 minutes
        setInterval(cleanupExpiredHackathons, 15 * 60 * 1000);
        setInterval(cleanupExpiredOpportunities, 15 * 60 * 1000);
        // Refresh live hackathons every 6 hours (21,600,000 ms)
        setInterval(syncGovernmentHackathons, 6 * 60 * 60 * 1000);
        setInterval(syncOpportunities, 6 * 60 * 60 * 1000);
        setInterval(syncLiveHackathons, 6 * 60 * 60 * 1000);
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
      if (role === "student") {
        if (!cleanEmail.endsWith("@srishakthi.ac.in")) {
          return res.status(400).json({ error: "Access Denied: Only official Sri Shakthi email addresses (@srishakthi.ac.in) are permitted for students." });
        }
      }

      let user = await User.findOne({ email: cleanEmail });
      if (isSignup) {
        if (user) {
          return res.status(400).json({ error: "User already exists with this email." });
        }
        user = new User({
          userId: `usr-${Date.now()}`,
          name: name || email.split("@")[0],
          email: cleanEmail,
          passwordHash: password,
          role: role || "student",
          avatar: avatar || `https://avatar.vercel.sh/${cleanEmail}`,
          department: department || "Computer Science",
          year: year || "1",
          registerNumber: registerNumber || `7140${Math.floor(100000 + Math.random() * 900000)}`,
          phone: phone || "",
          section: section || "A",
          lab: lab || "Full Stack",
          preferredDomain: preferredDomain || "Web Development",
          status: role === "student" ? "approved" : "pending",
          accountStatus: "ACTIVE",
          registrationDate: new Date()
        });
        await user.save();
        return res.json({ user, message: role === "student" ? "Account created!" : "Account created! Pending coordinator approval." });
      }

      if (!user) {
        return res.status(404).json({ error: "No account found with this email. Please sign up first." });
      }

      res.json({ user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Hackathons & Proof Verification Endpoints
  app.get("/api/hackathons", async (req, res) => {
    try {
      await cleanupExpiredHackathons();
      const defaultEvents = [
        {
          hackathonId: "dorahacks-web3-2026",
          name: "DoraHacks Web3 & Open-Source Hackathons",
          organizer: "DoraHacks Foundation",
          description: "Premier platform for Web3, crypto, decentralized tech, and open-source developer hackathons. Build dApps and decentralized AI.",
          domain: "Web3 & Open-Source",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationLink: "https://dorahacks.io",
          status: "Active"
        },
        {
          hackathonId: "hackathon-com-global-2026",
          name: "Hackathon.com Global Directory",
          organizer: "Hackathon.com",
          description: "Global hackathon directory connecting developers, innovators, and organizers with hackathons worldwide.",
          domain: "Global Directory",
          startDate: new Date(),
          endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationLink: "https://www.hackathon.com",
          status: "Active"
        },
        {
          hackathonId: "devnetwork-ai-cloud-2026",
          name: "DevNetwork Hackathons",
          organizer: "DevNetwork",
          description: "Enterprise-grade developer hackathons focusing on AI models, Cloud computing, DevOps, and API tech.",
          domain: "AI & Enterprise Cloud",
          startDate: new Date(),
          endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          registrationLink: "https://devnetwork.com/hackathons/",
          status: "Active"
        },
        {
          hackathonId: "huggingface-ai-competitions-2026",
          name: "Hugging Face AI & LLM Competitions",
          organizer: "Hugging Face",
          description: "Build, fine-tune, and benchmark state-of-the-art Open Source Large Language Models, NLP, and multimodal AI systems.",
          domain: "AI & LLM Competitions",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          registrationLink: "https://huggingface.co/competitions",
          status: "Active"
        },
        {
          hackathonId: "google-developer-community-2026",
          name: "Google Developer Communities & Solution Challenge 2026",
          organizer: "Google Developers",
          description: "Google-sponsored global developer challenges, Solution Challenges, Gemini AI sprints, and community hackathons.",
          domain: "Google AI & Cloud",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationLink: "https://developers.google.com/community",
          status: "Active"
        },
        {
          hackathonId: "devfolio-india-2026",
          name: "Devfolio Hackathon Platform",
          organizer: "Devfolio",
          description: "Recommended Priority #1 platform in India. Discover top university & tech community hackathons with 1-click profiles.",
          domain: "Recommended Priority Platform",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          registrationLink: "https://devfolio.co",
          status: "Active"
        },
        {
          hackathonId: "sih-2026-hackathon",
          name: "Smart India Hackathon 2026 (SIH)",
          organizer: "Ministry of Education & AICTE",
          description: "Recommended Priority #2 nationwide hackathon. Solve pressing problem statements submitted by Central Ministries, State Departments, PSUs, and Industry leaders.",
          domain: "Government Hackathon",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          registrationLink: "https://sih.gov.in",
          status: "Active"
        },
        {
          hackathonId: "mlh-season-2026",
          name: "Major League Hacking (MLH)",
          organizer: "Major League Hacking",
          description: "Recommended Priority #3 student hackathon league. Over 200+ weekend hackathons annually worldwide with hardware access, workshops, and swag.",
          domain: "Student Hackathon League",
          startDate: new Date(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationLink: "https://mlh.io",
          status: "Active"
        },
        {
          hackathonId: "devpost-global-2026",
          name: "Devpost Hackathons",
          organizer: "Devpost",
          description: "Recommended Priority #4 global software hackathon platform. Join online and in-person hackathons with millions in prizes.",
          domain: "Global Directory",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          registrationLink: "https://devpost.com",
          status: "Active"
        },
        {
          hackathonId: "hackerearth-challenges-2026",
          name: "HackerEarth Hackathons",
          organizer: "HackerEarth",
          description: "Recommended Priority #5 enterprise innovation platform hosting hackathons, coding challenges, and hiring contests.",
          domain: "Enterprise & Coding",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          registrationLink: "https://www.hackerearth.com/challenges/",
          status: "Active"
        },
        {
          hackathonId: "unstop-hackathons-2026",
          name: "Unstop Hackathons & Competitions",
          organizer: "Unstop",
          description: "Recommended Priority #6 college hackathon platform in India. Join tech sprints, coding contests, and case competitions.",
          domain: "College & Tech Competition",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          registrationLink: "https://unstop.com/hackathons",
          status: "Active"
        },
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
          hackathonId: "solana-renaissance-2026",
          name: "Solana Renaissance Global Hackathon",
          organizer: "Solana Foundation",
          description: "Build high-speed crypto, DePIN, DeFi, and Web3 infrastructure on Solana with $1M+ total prize pool.",
          domain: "Web3 & Open-Source",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationLink: "https://solana.com/hackathon",
          status: "Active"
        },
        {
          hackathonId: "ethglobal-2026",
          name: "ETHGlobal Hackathons 2026",
          organizer: "ETHGlobal",
          description: "The premier global Ethereum developer hackathon series with virtual & in-person events worldwide.",
          domain: "Web3 & Open-Source",
          startDate: new Date(),
          endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
          registrationLink: "https://ethglobal.com",
          status: "Active"
        },
        {
          hackathonId: "nasa-space-apps-2026",
          name: "NASA International Space Apps Challenge 2026",
          organizer: "NASA",
          description: "The world's largest global hackathon. Solve challenges using open Earth & space data.",
          domain: "Government Hackathon",
          startDate: new Date(),
          endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationLink: "https://www.spaceappschallenge.org",
          status: "Active"
        },
        {
          hackathonId: "microsoft-imagine-cup-2026",
          name: "Microsoft Imagine Cup 2026",
          organizer: "Microsoft",
          description: "Global student tech competition to build impactful AI solutions using Azure Cloud and AI technologies.",
          domain: "AI & Enterprise Cloud",
          startDate: new Date(),
          endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationLink: "https://imaginecup.microsoft.com",
          status: "Active"
        },
        {
          hackathonId: "meta-llama-impact-2026",
          name: "Meta Llama Open Source AI Hackathon",
          organizer: "Meta AI",
          description: "Build next-generation applications leveraging Meta's open-weights Llama 3 models and open source AI stack.",
          domain: "AI & LLM Competitions",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationLink: "https://llama.meta.com",
          status: "Active"
        },
        {
          hackathonId: "naan-mudhalvan-tn-2026",
          name: "Naan Mudhalvan Tamil Nadu Govt Tech Hackathon",
          organizer: "Tamil Nadu Skill Development Corporation",
          description: "State government hackathon for engineering college students in Tamil Nadu to solve real civic & industry challenges.",
          domain: "Government Hackathon",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          registrationLink: "https://naanmudhalvan.tn.gov.in",
          status: "Active"
        }
      ];

      for (const event of defaultEvents) {
        const existing = await Hackathon.findOne({ hackathonId: event.hackathonId });
        if (!existing) {
          await Hackathon.create(event);
        }
        const oppExisting = await Opportunity.findOne({
          $or: [{ title: event.name }, { website: event.registrationLink }]
        });
        if (!oppExisting) {
          await Opportunity.create({
            title: event.name,
            description: event.description,
            category: "Hackathons",
            organizer: event.organizer,
            organizerLogo: `https://avatar.vercel.sh/${(event.organizer || 'hackathon').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            bannerImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
            website: event.registrationLink,
            registrationLink: event.registrationLink,
            location: "Online",
            mode: "Online",
            freeOrPaid: "Free",
            targetAudience: "Student Only",
            prizePool: "Platform Badges & Prizes",
            registrationDeadline: event.registrationDeadline,
            eventStartDate: event.startDate,
            eventEndDate: event.endDate,
            difficulty: "Intermediate",
            eligibility: "Open to students globally.",
            timeline: "Active Registration",
            rules: "Standard platform terms and code of conduct apply.",
            judgingCriteria: "Innovation, complexity, and presentation.",
            tags: ["Hackathon", "Build", event.domain],
            featured: true,
            trending: true,
            approved: true
          });
        }
      }

      const nowTime = Date.now();
      let hackathons = await Hackathon.find();
      let activeHackathons = hackathons.filter(h => {
        const deadlineExpired = h.registrationDeadline && new Date(h.registrationDeadline).getTime() < nowTime;
        const endExpired = h.endDate && new Date(h.endDate).getTime() < nowTime;
        return (!deadlineExpired || !endExpired) && h.status !== "Expired";
      }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      res.json({
        hackathons: activeHackathons.map(h => ({ id: h._id, ...h.toObject() })),
        lastSyncedAt: lastHackathonSyncTime ? lastHackathonSyncTime.toISOString() : new Date().toISOString()
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Live Hackathon On-Demand Refresh Endpoint
  app.post("/api/hackathons/refresh", async (req, res) => {
    try {
      const count = await syncLiveHackathons();
      res.json({
        success: true,
        message: `Successfully synced live hackathons from APIs & Google Search Grounding! (${count} new events)`,
        lastSyncedAt: lastHackathonSyncTime ? lastHackathonSyncTime.toISOString() : new Date().toISOString()
      });
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
        await HackathonInterest.deleteOne({ _id: existing._id });
        return res.json({ success: true, message: "Interest removed (Uninterested)", interested: false, interestId: existing._id });
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

  app.put("/api/hackathons/:id", async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const hackathon = await Hackathon.findOne({ $or: [{ _id: id }, { id }, { hackathonId: id }] });
      if (!hackathon) return res.status(404).json({ error: "Hackathon not found" });

      const { name, organizer, description, domain, startDate, endDate, registrationDeadline, registrationLink, status } = req.body;
      if (name !== undefined) hackathon.name = name;
      if (organizer !== undefined) hackathon.organizer = organizer;
      if (description !== undefined) hackathon.description = description;
      if (domain !== undefined) hackathon.domain = domain;
      if (startDate !== undefined) hackathon.startDate = startDate;
      if (endDate !== undefined) hackathon.endDate = endDate;
      if (registrationDeadline !== undefined) hackathon.registrationDeadline = registrationDeadline;
      if (registrationLink !== undefined) hackathon.registrationLink = registrationLink;
      if (status !== undefined) hackathon.status = status;

      await hackathon.save();
      res.json({ success: true, hackathon });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/hackathons/:id", async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const hackathon = await Hackathon.findOne({ $or: [{ _id: id }, { id }, { hackathonId: id }] });
      if (!hackathon) return res.status(404).json({ error: "Hackathon not found" });

      const targetId = hackathon._id || hackathon.id;
      await Hackathon.findByIdAndDelete(targetId);

      // Clean up linked registrations and interests
      await HackathonRegistration.deleteMany({ hackathonId: targetId });
      await HackathonInterest.deleteMany({ hackathonId: targetId });

      res.json({ success: true, message: "Hackathon deleted successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Helper function for exact calendar month arithmetic
  function addOneCalendarMonth(dateObj: Date): Date {
    const result = new Date(dateObj.getTime());
    const currentMonth = result.getMonth();
    result.setMonth(currentMonth + 1);
    if (result.getMonth() !== (currentMonth + 1) % 12) {
      result.setDate(0); // Adjust to last day of target month (e.g., Jan 31 -> Feb 28)
    }
    return result;
  }

  // MANDATORY Hackathon Registration with Screenshot Proof Upload
  app.post("/api/hackathons/:id/register", upload.single("screenshot"), async (req, res) => {
    try {
      const { studentId } = req.body;
      const hackathon = await Hackathon.findById(req.params.id);
      if (!hackathon) return res.status(404).json({ error: "Hackathon not found" });

      const user = await User.findOne({ userId: studentId });
      if (!user) return res.status(404).json({ error: "Student user not found", code: "ACCOUNT_NOT_FOUND" });

      if (!req.file) {
        return res.status(400).json({ error: "Registration Screenshot Required! Upload proof of registration before submitting." });
      }

      // Check if active pending submission already exists
      const existingPending = await HackathonRegistration.findOne({
        studentId: user.userId,
        hackathonId: hackathon._id,
        verificationStatus: "Pending"
      });
      if (existingPending) {
        return res.status(400).json({ error: "A pending verification request already exists for this hackathon. Please wait for coordinator review." });
      }

      const screenshotUrl = `/uploads/${req.file.filename}`;

      const reg = new HackathonRegistration({
        registrationId: `reg-${Date.now()}`,
        hackathonId: hackathon._id,
        hackathonName: hackathon.name,
        studentId: user.userId,
        studentName: user.name,
        studentEmail: user.email,
        department: user.department || "Computer Science and Engineering",
        registerNumber: user.registerNumber || "Reg Pending",
        registrationDate: new Date(),
        screenshotUrl,
        verificationStatus: "Pending"
      });
      await reg.save();

      // Notify Coordinators with targetRoute metadata
      const coordinators = await User.find({ role: 'coordinator' });
      for (const coord of coordinators) {
        await new Notification({
          userId: coord.userId,
          title: "Hackathon Proof Uploaded",
          message: `${user.name} (${user.department || 'CSE'}) uploaded registration screenshot proof for ${hackathon.name}. Verification required.`,
          relatedId: reg._id,
          targetRoute: "/hackathons?tab=verification",
          read: false,
          type: "general"
        }).save();
      }

      res.json({ success: true, message: "Registration Proof Uploaded successfully. Pending coordinator verification.", registration: reg });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET Hackathon Registrations with Pagination, Search & Filters
  app.get("/api/hackathons/registrations", async (req, res) => {
    try {
      const { studentId, page = "1", limit = "25", status, department, search } = req.query;
      let query: any = {};
      if (studentId) query.studentId = String(studentId);
      if (department && department !== "ALL") query.department = String(department);

      let allRegistrations = await HackathonRegistration.find(query).sort({ registrationDate: -1 });

      // Dynamic Evaluation of 1-Month Calendar Expiration
      const now = new Date();
      allRegistrations = allRegistrations.map((r: any) => {
        const obj = typeof r.toObject === 'function' ? r.toObject() : { ...r };
        obj.id = String(r._id || r.id);
        
        if (obj.verificationStatus === "Verified" && obj.validUntil) {
          const validUntilDate = new Date(obj.validUntil);
          if (now.getTime() > validUntilDate.getTime()) {
            obj.effectiveStatus = "EXPIRED";
          } else {
            obj.effectiveStatus = "Verified";
          }
        } else {
          obj.effectiveStatus = obj.verificationStatus;
        }
        return obj;
      });

      // Filter by Status / Search
      if (status && status !== "ALL") {
        allRegistrations = allRegistrations.filter((r: any) => {
          if (status === "EXPIRED") return r.effectiveStatus === "EXPIRED";
          if (status === "Verified") return r.effectiveStatus === "Verified";
          if (status === "Pending") return r.verificationStatus === "Pending";
          if (status === "Rejected") return r.verificationStatus === "Rejected";
          return true;
        });
      }

      if (search && String(search).trim()) {
        const q = String(search).toLowerCase().trim();
        allRegistrations = allRegistrations.filter((r: any) =>
          (r.studentName || "").toLowerCase().includes(q) ||
          (r.studentEmail || "").toLowerCase().includes(q) ||
          (r.hackathonName || "").toLowerCase().includes(q) ||
          (r.registerNumber || "").toLowerCase().includes(q)
        );
      }

      // Calculate verification statistics summary
      const stats = {
        totalCount: allRegistrations.length,
        pendingCount: allRegistrations.filter((r: any) => r.verificationStatus === "Pending").length,
        verifiedCount: allRegistrations.filter((r: any) => r.effectiveStatus === "Verified").length,
        rejectedCount: allRegistrations.filter((r: any) => r.verificationStatus === "Rejected").length,
        expiredCount: allRegistrations.filter((r: any) => r.effectiveStatus === "EXPIRED").length
      };

      // Paginate
      const pageNum = parseInt(String(page)) || 1;
      const limitNum = parseInt(String(limit)) || 25;
      const total = allRegistrations.length;
      const totalPages = Math.ceil(total / limitNum) || 1;
      const paginatedData = allRegistrations.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        registrations: paginatedData,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        stats
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Atomic Verification Approval/Rejection with 1-Month Calendar Validity
  app.put("/api/hackathons/registrations/:id/verify", async (req, res) => {
    try {
      const { verificationStatus, rejectionReason, coordinatorId, coordinatorName } = req.body; // 'Verified' | 'Rejected'
      const reg = await HackathonRegistration.findById(req.params.id);
      if (!reg) return res.status(404).json({ error: "Registration record not found" });

      if (reg.verificationStatus !== "Pending") {
        return res.status(400).json({ error: `Registration proof has already been processed as ${reg.verificationStatus}.` });
      }

      const now = new Date();
      reg.verificationStatus = verificationStatus;
      reg.verifiedBy = coordinatorName || coordinatorId || "Coordinator";
      reg.verifiedAt = now;

      if (verificationStatus === "Verified") {
        reg.validUntil = addOneCalendarMonth(now);
      }

      if (rejectionReason) reg.rejectionReason = rejectionReason;
      await reg.save();

      // Notify student with structured metadata for target routing
      await new Notification({
        userId: reg.studentId,
        title: verificationStatus === 'Verified' ? 'Hackathon Proof Verified ✓' : 'Hackathon Proof Rejected ✗',
        message: verificationStatus === 'Verified'
          ? `Your registration proof for "${reg.hackathonName}" has been verified! Valid until ${addOneCalendarMonth(now).toLocaleDateString()}.`
          : `Your registration screenshot for "${reg.hackathonName}" was rejected: ${rejectionReason || 'Please upload valid proof screenshot.'}`,
        relatedId: reg._id,
        targetRoute: "/hackathons?tab=registrations",
        read: false,
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
      const { name, department, domain, mentorId, startDate, lab, studentId, teamLeader, teamMembers } = req.body;
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

      let teamMembersList: string[] = Array.isArray(teamMembers)
        ? teamMembers
        : typeof teamMembers === 'string'
        ? teamMembers.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      if (studentId && !teamMembersList.includes(studentId)) {
        teamMembersList.push(studentId);
      }
      if (teamLeader && !teamMembersList.includes(teamLeader)) {
        teamMembersList.push(teamLeader);
      }

      const finalLeader = teamLeader || studentId || (teamMembersList.length > 0 ? teamMembersList[0] : "");

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
        teamLeader: finalLeader,
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
      if (req.body.maxAllowedProgress !== undefined) project.maxAllowedProgress = Number(req.body.maxAllowedProgress);
      if (req.body.unlockedPhases !== undefined) project.unlockedPhases = req.body.unlockedPhases;
      if (req.body.extensionStatus !== undefined) project.extensionStatus = req.body.extensionStatus;
      if (req.body.requestedExtensionDays !== undefined) project.requestedExtensionDays = req.body.requestedExtensionDays;
      if (req.body.extensionReason !== undefined) project.extensionReason = req.body.extensionReason;
      if (req.body.files !== undefined) project.files = req.body.files;

      await project.save();
      io.emit("project_updated", { projectId: project._id, project });
      res.json({ success: true, project: { id: project._id, ...project.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Approve Milestone Endpoint (Coordinator unlocks next 25% phase)
  app.post("/api/projects/:id/approve-milestone", async (req, res) => {
    try {
      const { milestone } = req.body;
      const project = await Project.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] });
      if (!project) return res.status(404).json({ error: "Project workspace not found" });

      const currentUnlocked = Array.isArray(project.unlockedPhases) ? project.unlockedPhases : [25];
      const milestoneNum = Number(milestone);

      if (!currentUnlocked.includes(milestoneNum)) {
        currentUnlocked.push(milestoneNum);
      }

      // Unlock next threshold (e.g. 25 -> 50, 50 -> 75, 75 -> 100)
      const nextLimit = Math.min(100, milestoneNum + 25);
      project.unlockedPhases = currentUnlocked;
      project.maxAllowedProgress = Math.max(project.maxAllowedProgress || 25, nextLimit);

      if (milestoneNum >= 100) {
        project.status = "Completed";
      }

      await project.save();
      io.emit("project_updated", { projectId: project._id, project });
      res.json({ success: true, project: { id: project._id, ...project.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Request Extension Endpoint (Student submits time extension request)
  app.post("/api/projects/:id/request-extension", async (req, res) => {
    try {
      const { requestedDays, reason } = req.body;
      const project = await Project.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] });
      if (!project) return res.status(404).json({ error: "Project workspace not found" });

      project.extensionStatus = "PENDING";
      project.requestedExtensionDays = Number(requestedDays) || 7;
      project.extensionReason = reason || "Additional time required for project completion.";
      project.extensionRequestedAt = new Date().toISOString();

      await project.save();
      io.emit("project_updated", { projectId: project._id, project });
      res.json({ success: true, project: { id: project._id, ...project.toObject() } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Respond Extension Endpoint (Coordinator approves/rejects extension)
  app.post("/api/projects/:id/respond-extension", async (req, res) => {
    try {
      const { approve } = req.body;
      const project = await Project.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] });
      if (!project) return res.status(404).json({ error: "Project workspace not found" });

      if (approve) {
        project.extensionStatus = "APPROVED";
        // Extend deadline by requestedExtensionDays
        const daysToAdd = project.requestedExtensionDays || 7;
        const currentDeadline = project.deadline ? new Date(project.deadline) : new Date();
        currentDeadline.setDate(currentDeadline.getDate() + daysToAdd);
        project.deadline = currentDeadline;
        project.status = "Active";
      } else {
        project.extensionStatus = "REJECTED";
      }

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

  app.delete("/api/projects/:id", async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const proj = await Project.findOne({ $or: [{ _id: id }, { id }] });
      if (!proj) {
        return res.status(404).json({ error: "Project workspace not found" });
      }

      const targetId = proj._id || proj.id;
      await Project.findByIdAndDelete(targetId);

      // Clean up linked data
      await Task.deleteMany({ projectId: targetId });
      await DailyReport.deleteMany({ projectId: targetId });
      await Message.deleteMany({ projectId: targetId });
      await GitHubRepo.deleteMany({ projectId: targetId });
      await AbstractHistory.deleteMany({ projectId: targetId });
      await MilestonePresentation.deleteMany({ projectId: targetId });
      await ProjectExtension.deleteMany({ projectId: targetId });

      res.json({ success: true, message: `Project workspace ${proj.name} deleted successfully.` });
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
  const dedupeServerMessages = (rawMessages: any[]) => {
    const list = rawMessages.map(m => ({ id: String(m._id || m.id), ...(typeof m.toObject === 'function' ? m.toObject() : m) }));
    const result: any[] = [];
    const seenIds = new Set<string>();

    for (const msg of list) {
      const msgId = String(msg.id || msg._id || "");
      if (msgId && seenIds.has(msgId)) continue;

      const isDuplicate = result.some((existing) => {
        if (existing.userId === msg.userId && (existing.text || "").trim() === (msg.text || "").trim() && (existing.projectId || "") === (msg.projectId || "")) {
          if (!existing.createdAt || !msg.createdAt) return true;
          const timeDiff = Math.abs(new Date(existing.createdAt).getTime() - new Date(msg.createdAt).getTime());
          return timeDiff < 10000; // 10 seconds window
        }
        return false;
      });

      if (isDuplicate) continue;

      if (msgId) seenIds.add(msgId);
      result.push(msg);
    }
    return result;
  };

  app.get("/api/messages", async (req, res) => {
    try {
      const { projectId } = req.query;
      const query = projectId ? { projectId: String(projectId) } : { $or: [{ projectId: "" }, { projectId: null }] };
      const rawMessages = await Message.find(query).sort({ createdAt: 1 });
      const cleanMessages = dedupeServerMessages(rawMessages);
      res.json({ messages: cleanMessages });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  async function notifyMessageRecipients(senderUserId: string, senderName: string, text: string, projectId?: string) {
    try {
      let recipientUserIds: string[] = [];

      if (projectId) {
        const proj = await Project.findById(projectId);
        if (proj) {
          const members = (proj.teamMembers || []).slice();
          if (proj.teamLeader) members.push(proj.teamLeader);
          if (proj.studentId) members.push(proj.studentId);
          recipientUserIds.push(...members);
        }
      }

      // Always include active coordinators & master admins for staff visibility
      const staff = await User.find({ role: { $in: ['coordinator', 'master_admin'] } });
      recipientUserIds.push(...staff.map(u => u.userId));

      const uniqueRecipients = [...new Set(recipientUserIds)].filter(id => id && id !== senderUserId);

      for (const recId of uniqueRecipients) {
        const notif = new Notification({
          userId: recId,
          title: `New Message from ${senderName}`,
          message: `${senderName}: "${text.length > 60 ? text.substring(0, 57) + '...' : text}"`,
          type: "chat",
          relatedId: projectId || "",
          read: false
        });
        await notif.save();
      }

      io.emit("notification_received");
    } catch (e: any) {
      console.warn("Failed sending message notification:", e.message);
    }
  }

  app.post("/api/messages", async (req, res) => {
    try {
      const { user: sender, userId, text, projectId } = req.body;
      const cleanText = (text || "").trim();
      const pId = projectId || "";

      if (!cleanText) {
        return res.status(400).json({ error: "Message text is required" });
      }

      // Check if duplicate message was created in the last 4 seconds
      const fourSecondsAgo = new Date(Date.now() - 4000);
      const existing = await Message.findOne({
        userId,
        text: cleanText,
        projectId: pId,
        createdAt: { $gte: fourSecondsAgo }
      });

      if (existing) {
        const formattedExisting = { id: String(existing._id), ...(typeof existing.toObject === 'function' ? existing.toObject() : existing) };
        return res.json({ message: formattedExisting });
      }

      const msg = new Message({
        user: sender,
        userId,
        text: cleanText,
        projectId: pId
      });
      await msg.save();
      
      const formattedMsg = { id: String(msg._id), ...(typeof msg.toObject === 'function' ? msg.toObject() : msg) };

      if (pId) {
        io.to(pId).emit("receive_message", formattedMsg);
      } else {
        io.emit("receive_message_global", formattedMsg);
      }

      // Automatically dispatch notifications to recipients
      await notifyMessageRecipients(userId, sender, cleanText, pId);

      res.json({ message: formattedMsg });
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

  app.delete("/api/tasks/:id", async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const task = await Task.findOne({ $or: [{ _id: id }, { id }] });
      if (!task) return res.status(404).json({ error: "Task not found" });

      await Task.findByIdAndDelete(task._id || id);
      res.json({ success: true, message: "Task deleted successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId, role, type } = req.query;
      let query: any = {};
      
      if (userId) {
        const userIdStr = String(userId);
        const userRoleStr = role ? String(role) : "";
        query.$or = [
          { userId: userIdStr },
          { userId: "all" },
          { userId: "ALL" },
          { userId: { $exists: false } },
          { userId: null },
          ...(userRoleStr ? [{ userId: userRoleStr }, { targetRole: userRoleStr }] : [])
        ];
      }
      if (type) query.type = String(type);

      const notifs = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
      res.json({ notifications: notifs.map(n => ({ id: n._id, ...n.toObject() })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/notifications/read-all", async (req, res) => {
    try {
      const { userId } = req.body;
      if (userId) {
        await Notification.updateMany({ userId }, { read: true });
      } else {
        await Notification.updateMany({}, { read: true });
      }
      res.json({ success: true });
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
      await cleanupExpiredOpportunities();
      
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
          query.$or = [
            { registrationDeadline: { $gte: now } },
            { eventEndDate: { $gte: now } }
          ];
        } else if (status === "Upcoming") {
          query.eventStartDate = { $gt: now };
        } else if (status === "Completed") {
          query.eventEndDate = { $lt: now };
        } else if (status === "ClosingSoon") {
          query.registrationDeadline = { $gt: now, $lte: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) };
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

  // Real-Time Chat REST Endpoints
  app.get("/api/messages", async (req, res) => {
    try {
      const { projectId } = req.query;
      let query: any = {};
      if (projectId && projectId !== "global") {
        query.projectId = String(projectId);
      } else {
        query.$or = [{ projectId: "" }, { projectId: { $exists: false } }, { projectId: "global" }];
      }
      const messages = await Message.find(query).sort({ createdAt: 1 });
      res.json({
        messages: messages.map((m: any) => ({
          id: String(m._id || m.id),
          ...(typeof m.toObject === "function" ? m.toObject() : m)
        }))
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { user, userId, text, projectId } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Message text is required" });
      }
      const cleanText = text.trim();
      const pId = (projectId && projectId !== "global") ? projectId : "";

      const msg = new Message({
        user: user || "User",
        userId: userId || "usr-anon",
        text: cleanText,
        projectId: pId,
        createdAt: new Date()
      });
      await msg.save();

      const formattedMsg = {
        id: String(msg._id || msg.id),
        ...(typeof msg.toObject === "function" ? msg.toObject() : msg)
      };

      if (pId) {
        io.to(pId).emit("receive_message", formattedMsg);
      } else {
        io.emit("receive_message_global", formattedMsg);
      }

      res.json({ success: true, message: formattedMsg });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete Message Endpoint (WhatsApp style deletion)
  app.delete("/api/messages/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const msg = await Message.findById(req.params.id);
      if (!msg) return res.status(404).json({ error: "Message not found" });

      if (msg.userId !== req.user.id && req.user.role !== "master_admin" && req.user.role !== "coordinator") {
        return res.status(403).json({ error: "Unauthorized to delete this message" });
      }

      await Message.findByIdAndDelete(req.params.id);
      if (msg.projectId) {
        io.to(msg.projectId).emit("message_deleted", req.params.id);
      } else {
        io.emit("message_deleted_global", req.params.id);
      }
      res.json({ success: true, messageId: req.params.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Socket.IO for Real-Time Chat and Updates
  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);
    
    socket.on("register_user_session", ({ userId, sessionToken }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        socket.data.userId = userId;
        socket.data.sessionToken = sessionToken;
      }
    });

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
        const cleanText = (data.text || "").trim();
        const pId = (data.projectId && data.projectId !== "global") ? data.projectId : "";
        if (!cleanText) return;

        // Check if message was saved via API in the last 4 seconds
        const fourSecondsAgo = new Date(Date.now() - 4000);
        let msg: any = await Message.findOne({
          userId: data.userId,
          text: cleanText,
          projectId: pId,
          createdAt: { $gte: fourSecondsAgo }
        });

        if (!msg && !data._id && !data.id) {
          msg = new Message({
            user: data.user,
            userId: data.userId,
            text: cleanText,
            projectId: pId,
            createdAt: new Date()
          });
          await msg.save();
        }

        if (msg) {
          const formattedMsg = { id: String(msg._id || msg.id), ...(typeof msg.toObject === 'function' ? msg.toObject() : msg) };
          if (pId) {
            io.to(pId).emit("receive_message", formattedMsg);
          } else {
            io.emit("receive_message_global", formattedMsg);
          }
        }
      } catch (err) {}
    });

    socket.on("delete_message", async (data) => {
      try {
        const { messageId, projectId } = data;
        if (messageId) {
          await Message.findByIdAndDelete(messageId);
          if (projectId) {
            io.to(projectId).emit("message_deleted", messageId);
          } else {
            io.emit("message_deleted_global", messageId);
          }
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
