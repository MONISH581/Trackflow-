# TrackFlow

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` (or update your existing `.env`):
   ```env
   # PostgreSQL Database (Neon, Supabase, Render, Railway, or local Postgres)
   DATABASE_URL="postgresql://username:password@host:5432/trackflow?sslmode=require"
   
   # Security & API Keys
   JWT_SECRET="your-jwt-secret"
   GEMINI_API_KEY="your-gemini-key"
   ```

3. **Migrate Existing Data to PostgreSQL**:
   Run the automated database setup and migration tool:
   ```bash
   npm run db:migrate
   ```
   *(Note: Whenever `DATABASE_URL` is configured, TrackFlow also automatically verifies tables and migrates existing local store records on server boot if the database is newly initialized!)*

4. **Run the Application**:
   ```bash
   npm run dev
   ```
