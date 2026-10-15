# Flame App Store (FAS) - Backend Architecture & Deployment Guide

This directory (`/backend-root/backend/`) is completely decoupled and isolated so it can run independently on any cloud provider, VPS, or server.

## Folder Contents
- `package.json` - Complete production Node.js package dependencies for the backend.
- `server.js` - Standalone Express server containing all FAS API routes and modules.
- `admin/adminAuth.js` - Isolated Admin File for generating 1-month (30-day) secret authorization codes.
- `shield.js` - 20-AI Security Shield & Flame AI Commander architecture.
- `connectingLink.js` - Encrypted Connecting Link bridge between frontend and backend.
- `geminiTrainer.js` - Gemini Trainer router with Admin Kill-Switch (`DESTROY TRAINER`).
- `infinityAiTranslator.js` - Infinity Language AI Translation engine.
- `.env.example` - Sample environment configuration.

## How to Deploy / Run

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env` and insert your Gemini API Key if desired:
   ```bash
   cp .env.example .env
   ```

3. **Start the Backend Server:**
   ```bash
   npm start
   ```
   The backend will start listening on port `5000` (or your configured `PORT`).

4. **Connecting Frontend to Backend:**
   Point your frontend's `VITE_BACKEND_URL` or proxy to `http://your-server-ip:5000`.
