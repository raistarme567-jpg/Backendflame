/**
 * Flame App Store (FAS) - Isolated Backend Server Architecture
 * Port: 5000 (or process.env.PORT)
 * Location: /backend-root/backend/server.js
 * 
 * Features:
 * 1. 20-AI Security Shield & Flame AI Commander
 * 2. 1-Month Valid Secret Authorization Code Generator in Admin File
 * 3. Gemini Trainer with "DESTROY TRAINER" Kill-Switch
 * 4. Infinity Language AI Translation Core
 * 5. Developer Earnings Wallet (Free app: ₹100 per unique user download, Premium app: item price)
 * 6. Payout Withdrawal Request & 24-Hour SLA Approval Queue
 * 7. Encrypted Connecting Link Bridge
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

import { adminAuth } from './adminAuth.js';
import { flameAIShield } from './shield.js';
import { geminiTrainer } from './geminiTrainer.js';
import { connectingLink } from './connectingLink.js';
import { infinityAiTranslator } from './infinityAiTranslator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Connecting Link Bridge Middleware
app.use((req, res, next) => {
  const token = req.headers['x-fas-connecting-link'];
  connectingLink.validateToken(token);
  next();
});

/* =========================================================================
   MOCK DATABASES (In-Memory for Standalone Deployment)
   ========================================================================= */
let paymentConfig = {
  enabled: true,
  qrCodeImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  upiId: 'flame.fas.security@upi',
  merchantName: 'Flame App Store Official Payment Command',
  supportNote: 'Scan the QR code with any UPI app (GPay, PhonePe, Paytm).',
  currency: 'INR',
  updatedAt: new Date().toISOString()
};

let payoutsDatabase = [
  {
    id: 'payout-init-1',
    developerId: 'dev-flame-labs',
    developerName: 'Flame Labs Inc.',
    amountINR: 15000,
    amountUSD: 179.64,
    currency: 'INR',
    paymentMethod: 'UPI',
    accountDetails: { upiId: 'alex.flame@okhdfcbank' },
    status: 'APPROVED_PROCESSED',
    requestedAt: '2026-10-08T10:15:00.000Z',
    processedAt: '2026-10-08T16:20:00.000Z',
    etaMessage: 'Approved and transferred via UPI Instant Settlement.',
    adminNotes: 'Verified developer identity & KYC'
  }
];

function getDeveloperWallet(developerId = 'dev-flame-labs') {
  const uniqueFreeDownloads = 380;
  const uniquePaidBuyers = 45;
  const freeRevenueINR = uniqueFreeDownloads * 100; // ₹100 per unique free download
  const paidRevenueINR = uniquePaidBuyers * 5 * 83.5; // ~₹18,787 INR
  const totalEarnedINR = freeRevenueINR + paidRevenueINR;

  const totalWithdrawnINR = payoutsDatabase
    .filter(p => p.status === 'APPROVED_PROCESSED')
    .reduce((sum, p) => sum + p.amountINR, 0);

  const pendingWithdrawalINR = payoutsDatabase
    .filter(p => p.status === 'PENDING_APPROVAL')
    .reduce((sum, p) => sum + p.amountINR, 0);

  const balanceINR = Math.max(0, Math.round(totalEarnedINR - totalWithdrawnINR - pendingWithdrawalINR));
  const balanceUSD = Math.round((balanceINR / 83.5) * 100) / 100;

  return {
    developerId,
    developerName: 'Flame Labs Inc.',
    balanceINR,
    balanceUSD,
    totalEarnedINR: Math.round(totalEarnedINR),
    totalWithdrawnINR,
    pendingWithdrawalINR,
    freeAppsRevenueINR: freeRevenueINR,
    paidAppsRevenueINR: Math.round(paidRevenueINR),
    uniqueFreeDownloadsCount: uniqueFreeDownloads,
    uniquePaidBuyersCount: uniquePaidBuyers,
    payoutHistory: payoutsDatabase,
    lastCalculatedAt: new Date().toISOString()
  };
}

/* =========================================================================
   ROUTES
   ========================================================================= */

// Health & Connecting Link Status
app.get('/api/connecting-link/status', (req, res) => {
  res.json({ success: true, data: connectingLink.getStatus() });
});

// 20-AI Shield Status
app.get('/api/shield/status', (req, res) => {
  res.json({ success: true, data: flameAIShield.getStatus() });
});

// Gemini Trainer Status & Admin Override
app.get('/api/trainer/status', (req, res) => {
  res.json({ success: true, data: geminiTrainer.getStatus() });
});

app.post('/api/trainer/destroy', (req, res) => {
  const result = geminiTrainer.destroyTrainer(req.body.adminId || 'Lead Admin');
  res.json(result);
});

app.post('/api/trainer/restore', (req, res) => {
  const result = geminiTrainer.restoreTrainer(req.body.adminId || 'Lead Admin');
  res.json(result);
});

// Infinity Language Translation AI
app.post('/api/flame-ai/translate-language', async (req, res) => {
  const { text, sourceLang } = req.body;
  const result = await infinityAiTranslator.translate(text, sourceLang);
  res.json({ success: true, data: result });
});

// Admin Secret Authorization Code Generator (1-Month / 30-Day Expiry)
app.post('/api/admin/generate-code', (req, res) => {
  const codeRecord = adminAuth.generateCode(req.body.generatedBy || 'Lead Admin (Root File)');
  res.json({ success: true, data: codeRecord });
});

app.get('/api/admin/codes', (req, res) => {
  res.json({ success: true, data: adminAuth.listCodes() });
});

app.post('/api/admin/verify-code', (req, res) => {
  const result = adminAuth.validateAndConsumeCode(req.body.code, 'developer-test', 'app-test');
  res.json({ success: true, valid: result.valid, message: result.message });
});

// Developer Wallet & Payout System
app.get('/api/developer/wallet', (req, res) => {
  const wallet = getDeveloperWallet(req.query.developerId);
  res.json({ success: true, data: wallet });
});

app.post('/api/developer/payout-request', (req, res) => {
  const { developerId = 'dev-flame-labs', amount, currency = 'INR', paymentMethod, accountDetails } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
  }

  const amountINR = currency === 'USD' ? Math.round(amount * 83.5) : Math.round(amount);
  const amountUSD = currency === 'USD' ? amount : Math.round((amount / 83.5) * 100) / 100;

  const currentWallet = getDeveloperWallet(developerId);
  if (amountINR > currentWallet.balanceINR) {
    return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
  }

  const newPayout = {
    id: `payout-${Date.now()}`,
    developerId,
    developerName: 'Flame Labs Inc.',
    amountINR,
    amountUSD,
    currency,
    paymentMethod,
    accountDetails: accountDetails || {},
    status: 'PENDING_APPROVAL',
    requestedAt: new Date().toISOString(),
    etaMessage: 'आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें'
  };

  payoutsDatabase.unshift(newPayout);
  res.status(201).json({
    success: true,
    data: newPayout,
    wallet: getDeveloperWallet(developerId),
    message: 'आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें'
  });
});

app.get('/api/admin/payouts', (req, res) => {
  res.json({ success: true, data: payoutsDatabase });
});

app.post('/api/admin/payouts/:id/approve', (req, res) => {
  const payout = payoutsDatabase.find(p => p.id === req.params.id);
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
  payout.status = 'APPROVED_PROCESSED';
  payout.processedAt = new Date().toISOString();
  payout.adminNotes = req.body.adminNotes || 'Approved by Lead Admin';
  res.json({ success: true, data: payout });
});

app.post('/api/admin/payouts/:id/reject', (req, res) => {
  const payout = payoutsDatabase.find(p => p.id === req.params.id);
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
  payout.status = 'REJECTED';
  payout.processedAt = new Date().toISOString();
  payout.adminNotes = req.body.reason || 'Verification failed';
  res.json({ success: true, data: payout });
});

// Payment Configuration (QR Code & UPI ID)
app.get('/api/payment-config', (req, res) => {
  res.json({ success: true, data: paymentConfig });
});

app.post('/api/admin/payment-config', (req, res) => {
  paymentConfig = { ...paymentConfig, ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: paymentConfig });
});

app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'Flame Software Suite Backend is Live & Running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 FAS Isolated Backend running on http://0.0.0.0:${PORT}`);
});
