# Flame App Store (FAS) — Backend Server

Standalone, decoupled REST API backend for the **Flame App Store (FAS)** ecosystem.
Built with Node.js, Express, Prisma ORM, 20-AI Shield Security Network, and Gemini AI Trainer.

---

## 📁 Architecture & File Structure

```text
backend-root/
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── Dockerfile              # Production container build
├── docker-compose.yml      # Multi-container orchestration (Backend + Postgres)
├── firestore.rules         # Security & verification rules for Firestore
├── package.json            # Backend dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── server.ts               # Express API entry point (CORS enabled)
├── prisma/
│   └── schema.prisma       # Database schema (PostgreSQL)
├── server/
│   ├── admin/              # Admin authorization & secret code engine
│   ├── connectingLink.ts   # Secure link between frontend and backend
│   ├── geminiTrainer.ts    # AI trainer interface with destroy/restore controls
│   ├── infinityAiTranslator.ts # Infinity language translation core
│   └── shield.ts           # 20-AI Shield defense network
└── src/
    ├── lib/mockData.ts     # In-memory fallback and seed data
    └── types/index.ts      # Shared backend data contracts
```

---

## 🚀 Quick Start (Standalone Local Run)

### 1. Prerequisites
- Node.js >= 18.0.0
- npm or bun

### 2. Install Dependencies
```bash
cd backend-root
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY and DATABASE_URL
```

### 4. Run Development Server
```bash
npm run dev
```
The server will start at: `http://localhost:5000`

### 5. Health Check
```bash
curl http://localhost:5000/api/health
```

---

## 🐳 Docker Deployment

To launch the backend along with a PostgreSQL database:
```bash
docker compose up -d
```
Backend will be live on port `5000` with automated health monitoring.

---

## 🔒 Security Features
- **CORS Readiness:** Configured to accept requests from frontend origin via `CORS_ORIGIN` env var.
- **20-AI Shield Security Network:** Continuous monitoring against malicious injections and unverified uploads.
- **Admin Secret Authorization:** 30-day token validation system for verified developer uploads.
