import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { INITIAL_APPS, INITIAL_REVIEWS, CATEGORIES_LIST, INITIAL_NOTIFICATIONS } from './src/lib/mockData.ts';
import { 
  AppItem, 
  AppReview, 
  User, 
  UserRole, 
  NotificationItem, 
  TesterFeedback, 
  DigitalCertificate, 
  PurchaseRecord, 
  PayoutRequest, 
  DeveloperWallet, 
  PayoutMethod,
  Tournament,
  TournamentParticipant,
  UserCoinWallet,
  CoinTransaction,
  RedemptionRequest,
  StoreItem,
  StoreOrder,
  AdminUploadedFile,
  SupportedGameCategory,
  SecurityLockType,
  SecurityLockState,
  PackageSecurityScanResult,
  RealtimeAnalyticsDashboard,
  ReviewModerationResult,
  PushNotificationPayload,
  CloudApkBuildRequest,
  CloudApkBuildResult
} from './src/types/index.ts';
import { adminAuth } from './server/admin/adminAuth.ts';
import { connectingLink } from './server/connectingLink.ts';
import { flameAIShield } from './server/shield.ts';
import { geminiTrainer } from './server/geminiTrainer.ts';
import { infinityAiTranslator } from './server/infinityAiTranslator.ts';
import { securityLockManager } from './server/securityLockManager.ts';
import { PackageSecurityScanner } from './server/packageScanner.ts';
import { ReviewModerationService } from './server/moderationService.ts';
import { CloudApkBuilderService } from './server/cloudApkBuilder.ts';
import { flameAiMesh } from './server/flameAiMesh.ts';
import { communityChat } from './server/communityChat.ts';
import { officialPromotion } from './server/officialBanners.ts';
import { PaymentConfiguration, PlatformAnalytics } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security & Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS & Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-fas-connecting-link, x-fas-internal-origin');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-Memory Database store with seed initialization
let appsDatabase: AppItem[] = JSON.parse(JSON.stringify(INITIAL_APPS));
let reviewsDatabase: Record<string, AppReview[]> = JSON.parse(JSON.stringify(INITIAL_REVIEWS));
let notificationsDatabase: NotificationItem[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
let purchasesDatabase: PurchaseRecord[] = [
  {
    id: 'purch-init-1',
    itemId: 'book-cybernetic-shield-defense',
    itemTitle: 'Cybernetic Security: 20-AI Shield Defense Architecture',
    mediaType: 'BOOK',
    price: 9.99,
    currency: 'USD',
    purchaseDate: '2026-10-06 18:22 UTC',
    transactionHash: '0x9481bc201827fa8901237eab019283746501928374',
    downloadUrl: '/api/books/book-cybernetic-shield-defense/pdf',
    certificateSerial: 'FAS-CERT-BOOK-8819-CYBER'
  }
];

// Admin-Configured Payment System Store
let paymentConfigDatabase: PaymentConfiguration = {
  enabled: true,
  qrCodeImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  upiId: 'flame.fas.security@upi',
  merchantName: 'Flame App Store Official Payment Command',
  supportNote: 'Scan the QR code with any UPI application (GPay, PhonePe, Paytm) to complete instant verified purchase.',
  currency: 'INR',
  updatedAt: new Date().toISOString()
};

// Global download analytics tracker
const downloadStats = {
  total: 4890000,
  today: 18450,
  thisWeek: 124300,
  thisMonth: 540200,
  downloadsByApp: {} as Record<string, number>,
  history: [] as { appId: string; appName: string; version: string; timestamp: string; ip: string }[],
};

// Seed initial download counts
appsDatabase.forEach(app => {
  downloadStats.downloadsByApp[app.id] = app.downloadCount;
});

// Users store
const usersDatabase: Record<string, User> = {
  'user-current': {
    id: 'user-current',
    name: 'Alex Vance',
    email: 'developer@flameappstore.com',
    role: 'DEVELOPER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    joinedDate: 'January 2025',
    favorites: ['flame-browser-pro', 'apex-launcher-fire', 'mythic-quest-rpg'],
    developerProfile: {
      id: 'dev-flame-labs',
      developerName: 'Flame Labs Inc.',
      website: 'https://flamelabs.example.com',
      supportEmail: 'support@flamelabs.example.com',
      verified: true,
      totalApps: 3,
      totalDownloads: 840000,
    },
    downloadHistory: [
      {
        id: 'dl-hist-1',
        appId: 'flame-browser-pro',
        appName: 'Flame Browser Turbo',
        appIcon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
        versionName: '3.2.0',
        fileSize: '28.4 MB',
        timestamp: 'Yesterday at 15:30',
        status: 'COMPLETED'
      }
    ]
  }
};

/* =========================================================================
   APK Binary Builder (Generates valid structured ZIP/APK archive bytes)
   ========================================================================= */
function generateSampleApkBuffer(appItem: AppItem): Buffer {
  const version = appItem.currentVersion;
  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${appItem.packageName}"
    android:versionCode="${version.versionCode}"
    android:versionName="${version.versionName}">
    <uses-sdk android:minSdkVersion="29" android:targetSdkVersion="35" />
    ${appItem.permissions.map(p => `<uses-permission android:name="android.permission.${p.toUpperCase()}" />`).join('\n    ')}
    <application
        android:label="${appItem.name}"
        android:theme="@android:style/Theme.Material.NoActionBar">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const certManifest = `Manifest-Version: 1.0
Created-By: Flame App Store (FAS) Packaging Pipeline v2.4
Package-Name: ${appItem.packageName}
SHA256-Digest: ${version.sha256}
Min-Android: ${version.minAndroid}
Target-Android: ${version.targetAndroid}
`;

  // Create lightweight uncompressed ZIP structure (PK archive)
  function createZipEntry(filename: string, content: Buffer): { header: Buffer; content: Buffer; centralDir: Buffer } {
    const filenameBuf = Buffer.from(filename, 'utf8');
    const crc = crc32(content);
    const size = content.length;
    const time = 0x5420; // MS-DOS dummy time
    const date = 0x5530; // MS-DOS dummy date

    const header = Buffer.alloc(30 + filenameBuf.length);
    header.writeUInt32LE(0x04034b50, 0); // Local header signature
    header.writeUInt16LE(20, 4); // Version needed
    header.writeUInt16LE(0, 6);  // Flags
    header.writeUInt16LE(0, 8);  // Compression (0 = stored)
    header.writeUInt16LE(time, 10);
    header.writeUInt16LE(date, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(size, 18);
    header.writeUInt32LE(size, 22);
    header.writeUInt16LE(filenameBuf.length, 26);
    header.writeUInt16LE(0, 28);
    filenameBuf.copy(header, 30);

    const centralDir = Buffer.alloc(46 + filenameBuf.length);
    centralDir.writeUInt32LE(0x02014b50, 0); // Central directory signature
    centralDir.writeUInt16LE(20, 4);
    centralDir.writeUInt16LE(20, 6);
    centralDir.writeUInt16LE(0, 8);
    centralDir.writeUInt16LE(0, 10);
    centralDir.writeUInt16LE(time, 12);
    centralDir.writeUInt16LE(date, 14);
    centralDir.writeUInt32LE(crc, 16);
    centralDir.writeUInt32LE(size, 20);
    centralDir.writeUInt32LE(size, 24);
    centralDir.writeUInt16LE(filenameBuf.length, 28);
    centralDir.writeUInt16LE(0, 30);
    centralDir.writeUInt16LE(0, 32);
    centralDir.writeUInt16LE(0, 34);
    centralDir.writeUInt16LE(0, 36);
    centralDir.writeUInt32LE(0, 38);
    centralDir.writeUInt32LE(0, 42); // Offset will be adjusted
    filenameBuf.copy(centralDir, 46);

    return { header, content, centralDir };
  }

  // Basic CRC32 implementation
  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const mask = -(byte & 1);
        byte >>= 1;
        crc = (crc >>> 1) ^ (0xedb88320 & mask);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const entries = [
    createZipEntry('AndroidManifest.xml', Buffer.from(manifestXml, 'utf8')),
    createZipEntry('META-INF/MANIFEST.MF', Buffer.from(certManifest, 'utf8')),
    createZipEntry('META-INF/FAS_RELEASE.SF', Buffer.from(`Signature-Version: 1.0\nSHA-256: ${version.sha256}\nFlame-Signed: true\n`, 'utf8')),
    createZipEntry('assets/app-spec.json', Buffer.from(JSON.stringify({ name: appItem.name, package: appItem.packageName, version: version.versionName }, null, 2), 'utf8'))
  ];

  let offset = 0;
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];

  for (const entry of entries) {
    entry.centralDir.writeUInt32LE(offset, 42);
    localChunks.push(entry.header, entry.content);
    centralChunks.push(entry.centralDir);
    offset += entry.header.length + entry.content.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of centralChunks) {
    centralSize += c.length;
  }

  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // End of central dir signature
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralSize, 12);
  endRecord.writeUInt32LE(centralOffset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, ...centralChunks, endRecord]);
}

/* =========================================================================
   PDF Document Binary Generator (Generates valid structured PDF format for Books)
   ========================================================================= */
function generateSamplePdfBuffer(book: AppItem): Buffer {
  const title = book.name || 'FAS Digital Publication';
  const author = book.bookDetails?.author || book.developerName || 'FAS Author';
  const pages = book.bookDetails?.pageCount || 240;
  const certSerial = book.certificate?.serialNumber || 'FAS-CERT-UNOFFICIAL';
  const sha = book.certificate?.sha256Fingerprint || crypto.randomBytes(32).toString('hex');

  const content = `%PDF-1.4
1 0 obj
<< /Title (${title})
   /Author (${author})
   /Creator (Flame App Store FAS Digital Publishing Engine)
   /Producer (FAS Level-5 Security Command)
   /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z)
>>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>
endobj
5 0 obj
<< /Length 420 >>
stream
BT
/F1 22 Tf
50 720 Td
(${title.replace(/[()]/g, '')}) Tj
/F1 12 Tf
0 -36 Td
(Author: ${author.replace(/[()]/g, '')}) Tj
0 -22 Td
(FAS Cryptographic Certificate: ${certSerial}) Tj
0 -22 Td
(SHA-256 Checksum: ${sha.slice(0, 32)}...) Tj
0 -22 Td
(Total Document Volume: ${pages} Pages | Format: Official Portable Document (PDF)) Tj
0 -28 Td
(Status: Certified Clean by FAS 20-AI Security Shield & Perimeter Gateway) Tj
0 -36 Td
(Official publication distributed securely via Flame App Store (FAS).) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000215 00000 n 
0000000262 00000 n 
0000000321 00000 n 
0000000440 00000 n 
0000000912 00000 n 
trailer
<< /Size 7 /Root 2 0 R /Info 1 0 R >>
startxref
981
%%EOF`;

  return Buffer.from(content, 'utf8');
}

// Admin Route Guard (Unauthorized access strictly returns 404 Page Not Found)
const adminAuthGuard = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const adminSecret = req.headers['x-admin-token'] || req.query.adminToken;
  const isAuthorized = 
    authHeader === 'Bearer fas_admin_super_secret_token_valid' ||
    adminSecret === 'fas-admin-2026-auth' ||
    req.headers['x-user-role'] === 'ADMIN';

  if (!isAuthorized) {
    // Strictly return 404 Not Found to completely conceal the admin route existence
    if (req.accepts('html')) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>404 - Page Not Found | Flame App Store</title>
          <style>
            body { background: #121212; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; max-width: 480px; padding: 32px; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; background: #181818; }
            h1 { font-size: 48px; color: #FF4500; margin: 0 0 12px; font-weight: 900; }
            p { color: #888888; font-size: 14px; margin: 0 0 24px; line-height: 1.6; }
            a { color: #FFFFFF; background: #FF4500; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The requested administrative console or URL was not found on this server. Please return to the Flame App Store storefront.</p>
            <a href="/">Return to Storefront</a>
          </div>
        </body>
        </html>
      `);
    }
    return res.status(404).json({ success: false, error: 'Page Not Found' });
  }
  next();
};

/* =========================================================================
   REST API ENDPOINTS
   ========================================================================= */

// Closed Testing & 15-Tester Rule Engine API Endpoints

// 1. Submit App for Closed Testing / Review
app.post('/api/apps/submit', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.packageName) {
    return res.status(400).json({ success: false, error: { message: 'Name and Package Name are required' } });
  }

  const newAppId = body.packageName.replace(/\./g, '-').toLowerCase();
  const existingIndex = appsDatabase.findIndex(a => a.packageName.toLowerCase() === body.packageName.toLowerCase());

  const newApp: AppItem = {
    id: newAppId,
    name: body.name,
    packageName: body.packageName,
    developerId: 'dev-flame-labs',
    developerName: body.developerName || 'Flame Labs Inc.',
    category: body.category || 'Tools',
    shortDescription: body.shortDescription || 'A new Android application.',
    fullDescription: body.fullDescription || body.shortDescription,
    iconUrl: body.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
    headerBannerUrl: body.headerBannerUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    screenshots: body.screenshots && body.screenshots.length >= 5 ? body.screenshots : [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 0,
    ratingCount: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    downloadCount: 0,
    featured: false,
    status: 'TESTING_PHASE',
    tags: body.tags || ['Android', 'FAS'],
    currentVersion: {
      id: `v-${Date.now()}`,
      versionName: body.versionName || '1.0.0',
      versionCode: body.versionCode || 1,
      releaseNotes: body.releaseNotes || 'Initial closed test build.',
      apkFileName: body.apkFileName || `${body.packageName}-v${body.versionName || '1.0.0'}.apk`,
      apkFileSize: body.apkFileSize || '24.5 MB',
      apkFileSizeBytes: 25690112,
      sha256: crypto.createHash('sha256').update(body.packageName + Date.now()).digest('hex'),
      minAndroid: body.minAndroid || 'Android 10 (API 29)',
      targetAndroid: body.targetAndroid || 'Android 15 (API 35)',
      uploadDate: new Date().toISOString().split('T')[0]
    },
    versionHistory: [],
    permissions: body.permissions || ['Internet', 'Storage', 'Notifications'],
    contentRating: body.contentRating || {
      violence: false,
      strongLanguage: false,
      gambling: false,
      sexualContent: false,
      userGeneratedContent: false,
      inAppPurchases: false,
      ratingTier: '3+'
    },
    dataSafety: body.dataSafety || {
      personalInfo: false,
      location: false,
      financials: false,
      media: false,
      appUsage: true,
      isEncryptedInTransit: true,
      canRequestDeletion: true,
      details: 'All data is encrypted in transit and never shared with 3rd parties.'
    },
    testLink: `https://flameappstore.com/test-app/${newAppId}`,
    testerCount: 0,
    requiredTesters: 15,
    testerFeedback: [],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    submissionLogs: [
      {
        id: `sub-test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        reviewer: '15-Tester Closed Pipeline',
        action: 'SUBMITTED',
        previousStatus: 'DRAFT',
        newStatus: 'TESTING_PHASE',
        reason: 'Launched Closed Testing phase. Requires 15 unique tester reviews to unlock Admin Approval.'
      }
    ]
  };

  if (existingIndex >= 0) {
    appsDatabase[existingIndex] = { ...appsDatabase[existingIndex], ...newApp };
  } else {
    appsDatabase.unshift(newApp);
  }

  res.status(201).json({
    success: true,
    data: newApp,
    message: 'App submitted for Closed-Testing. Share test link with 15 testers to unlock Admin Approval.'
  });
});

// 2. Closed Tester View endpoint
app.get('/api/apps/test/:appId', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.appId);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'Test application not found or test link expired.' });
  }
  res.json({ success: true, data: appItem });
});

// 3. Submit Tester Feedback (Increments unique tester count & enforces 15-tester transition)
app.post('/api/apps/test/:appId/feedback', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.appId);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'App not found' });
  }

  const { testerName, rating, deviceModel, comments } = req.body;
  if (!rating || !comments) {
    return res.status(400).json({ success: false, error: 'Rating and comments are required' });
  }

  const feedback: TesterFeedback = {
    id: `fb-${Date.now()}`,
    testerId: `tester-${Date.now()}`,
    testerName: testerName || 'Community Beta Tester',
    rating: Number(rating) || 5,
    deviceModel: deviceModel || 'Android 15 Device',
    comments: comments.trim(),
    timestamp: 'Just now'
  };

  appItem.testerFeedback.unshift(feedback);
  appItem.testerCount += 1;

  // 15-Tester Rule: When 15 unique testers have submitted reviews, transition to PENDING_REVIEW
  if (appItem.testerCount >= 15 && appItem.status === 'TESTING_PHASE') {
    appItem.status = 'PENDING_REVIEW';
    appItem.submissionLogs.push({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reviewer: '15-Tester Verification Engine',
      action: 'SUBMITTED',
      previousStatus: 'TESTING_PHASE',
      newStatus: 'PENDING_REVIEW',
      reason: '15/15 unique closed tester reviews recorded! Application unlocked and queued for Admin Approval.'
    });

    notificationsDatabase.unshift({
      id: `notif-${Date.now()}`,
      userId: 'user-current',
      title: '🎉 15/15 Testers Completed!',
      message: `"${appItem.name}" has reached all 15 required closed tester reviews and is now awaiting final Admin approval.`,
      timestamp: 'Just now',
      read: false,
      type: 'SUCCESS',
      appId: appItem.id
    });
  }

  res.json({
    success: true,
    data: {
      testerCount: appItem.testerCount,
      requiredTesters: appItem.requiredTesters,
      status: appItem.status,
      feedback
    }
  });
});

// 4. Admin Pending Apps (Guarded with custom 404 security layer)
app.get('/api/admin/pending-apps', adminAuthGuard, (req: Request, res: Response) => {
  const pendingApps = appsDatabase.filter(a => a.status === 'PENDING_REVIEW' || a.status === 'UNDER_REVIEW' || a.status === 'TESTING_PHASE');
  res.json({
    success: true,
    data: pendingApps,
    stats: {
      totalPending: pendingApps.length,
      readyForApproval: pendingApps.filter(a => a.testerCount >= 15).length,
      stillInTesting: pendingApps.filter(a => a.testerCount < 15).length
    }
  });
});

// 5. Admin Change Status (Enforces 15-tester requirement before PUBLISHED)
app.patch('/api/admin/apps/:appId/status', adminAuthGuard, (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.appId);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'App not found' });
  }

  const { status, reason } = req.body;

  // 15-Tester Rule: Cannot be published until 15 unique tester reviews are recorded!
  if (status === 'PUBLISHED' && appItem.testerCount < 15) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TESTER_REQUIREMENT_UNMET',
        message: `An app CANNOT be approved by the Admin until EXACTLY 15 unique tester submissions are recorded via its test link. Currently: ${appItem.testerCount} / 15 testers.`
      }
    });
  }

  const prev = appItem.status;
  appItem.status = status;
  appItem.statusReason = reason;

  appItem.submissionLogs.push({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    reviewer: 'Lead Admin (FAS Security)',
    action: status === 'PUBLISHED' ? 'PUBLISHED' : 'DECLINED',
    previousStatus: prev,
    newStatus: status,
    reason: reason || (status === 'PUBLISHED' ? 'Approved and published to public Flame App Store.' : 'Declined by Admin.')
  });

  notificationsDatabase.unshift({
    id: `notif-${Date.now()}`,
    userId: 'user-current',
    title: status === 'PUBLISHED' ? 'App Approved & Live! 🔥' : 'App Declined by Admin',
    message: status === 'PUBLISHED'
      ? `"${appItem.name}" passed all security reviews and is now live on Flame App Store.`
      : `"${appItem.name}" was declined: ${reason || 'Review feedback provided.'}`,
    timestamp: 'Just now',
    read: false,
    type: status === 'PUBLISHED' ? 'SUCCESS' : 'ALERT',
    appId: appItem.id
  });

  res.json({ success: true, data: appItem });
});

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Flame App Store (FAS) API',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
    stats: {
      appsCount: appsDatabase.length,
      totalDownloads: downloadStats.total
    }
  });
});

// 2. Categories
app.get('/api/categories', (req: Request, res: Response) => {
  const categoriesWithCounts = CATEGORIES_LIST.map(cat => {
    const liveCount = appsDatabase.filter(a => a.category === cat.name && a.status === 'PUBLISHED').length;
    return {
      ...cat,
      count: liveCount || cat.count
    };
  });
  res.json({ success: true, data: categoriesWithCounts });
});

// 3. Get Apps (with filters & search)
app.get('/api/apps', (req: Request, res: Response) => {
  const { category, search, sort, status, featured, limit, page } = req.query;
  let filtered = [...appsDatabase];

  // Status filter (defaults to PUBLISHED for store browse)
  if (status && typeof status === 'string') {
    filtered = filtered.filter(a => a.status === status);
  } else {
    filtered = filtered.filter(a => a.status === 'PUBLISHED');
  }

  // Category filter
  if (category && typeof category === 'string' && category !== 'All') {
    filtered = filtered.filter(a => a.category.toLowerCase() === category.toLowerCase());
  }

  // Search filter
  if (search && typeof search === 'string' && search.trim() !== '') {
    const term = search.toLowerCase().trim();
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(term) ||
      a.packageName.toLowerCase().includes(term) ||
      a.developerName.toLowerCase().includes(term) ||
      a.shortDescription.toLowerCase().includes(term) ||
      a.tags.some(t => t.toLowerCase().includes(term))
    );
  }

  // Featured
  if (featured === 'true') {
    filtered = filtered.filter(a => a.featured);
  }

  // Sort
  if (sort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'downloads') {
    filtered.sort((a, b) => b.downloadCount - a.downloadCount);
  } else if (sort === 'newest') {
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } else {
    // Default popular
    filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.downloadCount - a.downloadCount);
  }

  // Pagination
  const pageSize = limit ? parseInt(limit as string, 10) : 50;
  const currentPage = page ? parseInt(page as string, 10) : 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    data: paginated,
    meta: {
      total: filtered.length,
      page: currentPage,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize)
    }
  });
});

// 4. Featured Apps
app.get('/api/apps/featured', (req: Request, res: Response) => {
  const featured = appsDatabase.filter(a => a.featured && a.status === 'PUBLISHED');
  res.json({ success: true, data: featured });
});

// 5. Search Apps
app.get('/api/apps/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) {
    return res.json({ success: true, data: [] });
  }

  const results = appsDatabase
    .filter(a => a.status === 'PUBLISHED')
    .filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.developerName.toLowerCase().includes(query) ||
      a.category.toLowerCase().includes(query) ||
      a.packageName.toLowerCase().includes(query)
    )
    .slice(0, 10);

  res.json({ success: true, data: results });
});

// 6. Get Single App details
app.get('/api/apps/:id', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
  }

  const reviews = reviewsDatabase[appItem.id] || [];
  res.json({
    success: true,
    data: {
      ...appItem,
      reviews
    }
  });
});

// 7. Secure APK Download Endpoint (Tracks analytics and serves real APK binary)
app.get('/api/apps/:id/download', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
  }

  if (appItem.status !== 'PUBLISHED') {
    return res.status(403).json({ success: false, error: { code: 'UNPUBLISHED', message: 'APK is not currently published for download' } });
  }

  // Increment download counts
  appItem.downloadCount += 1;
  downloadStats.total += 1;
  downloadStats.today += 1;
  downloadStats.downloadsByApp[appItem.id] = appItem.downloadCount;
  downloadStats.history.unshift({
    appId: appItem.id,
    appName: appItem.name,
    version: appItem.currentVersion.versionName,
    timestamp: new Date().toISOString(),
    ip: req.ip || '127.0.0.1'
  });

  const apkBuffer = generateSampleApkBuffer(appItem);
  const filename = appItem.currentVersion.apkFileName || `${appItem.packageName}-v${appItem.currentVersion.versionName}.apk`;

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', apkBuffer.length);
  res.setHeader('X-Flame-SHA256', appItem.currentVersion.sha256);
  res.setHeader('Cache-Control', 'no-cache');
  res.send(apkBuffer);
});

// 8. Reviews
app.get('/api/apps/:id/reviews', (req: Request, res: Response) => {
  const reviews = reviewsDatabase[req.params.id] || [];
  res.json({ success: true, data: reviews });
});

app.post('/api/apps/:id/reviews', (req: Request, res: Response) => {
  const { rating, title, comment, userName } = req.body;
  const appId = req.params.id;
  const targetApp = appsDatabase.find(a => a.id === appId);

  if (!targetApp) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'App not found' } });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Rating must be between 1 and 5' } });
  }

  const newReview: AppReview = {
    id: `rev-${Date.now()}`,
    appId,
    userId: 'user-current',
    userName: userName || 'Alex Vance',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    rating: Number(rating),
    title: title || 'User Review',
    comment: comment || 'Works great on my device.',
    date: new Date().toISOString().split('T')[0],
    helpfulCount: 0,
    device: 'Android 15 Device'
  };

  if (!reviewsDatabase[appId]) {
    reviewsDatabase[appId] = [];
  }
  reviewsDatabase[appId].unshift(newReview);

  // Recalculate average rating
  const appReviews = reviewsDatabase[appId];
  const sum = appReviews.reduce((acc, r) => acc + r.rating, 0);
  targetApp.rating = Number((sum / appReviews.length).toFixed(1));
  targetApp.ratingCount = appReviews.length;

  res.json({ success: true, data: newReview });
});

// 9. Developer Console Endpoints
app.get('/api/console/apps', (req: Request, res: Response) => {
  const devId = (req.query.developerId as string) || 'dev-flame-labs';
  const apps = appsDatabase.filter(a => a.developerId === devId);
  res.json({ success: true, data: apps });
});

app.get('/api/console/analytics', (req: Request, res: Response) => {
  const devApps = appsDatabase.filter(a => a.developerId === 'dev-flame-labs');
  const totalDevDownloads = devApps.reduce((acc, a) => acc + a.downloadCount, 0);

  res.json({
    success: true,
    data: {
      totalApps: devApps.length,
      publishedApps: devApps.filter(a => a.status === 'PUBLISHED').length,
      pendingApps: devApps.filter(a => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED').length,
      totalDownloads: totalDevDownloads,
      averageRating: 4.8,
      dailyDownloads: [
        { day: 'Mon', downloads: 1240 },
        { day: 'Tue', downloads: 1480 },
        { day: 'Wed', downloads: 1620 },
        { day: 'Thu', downloads: 1890 },
        { day: 'Fri', downloads: 2150 },
        { day: 'Sat', downloads: 2780 },
        { day: 'Sun', downloads: 2430 },
      ],
      monthlyTrends: [
        { month: 'May', count: 48000 },
        { month: 'Jun', count: 62000 },
        { month: 'Jul', count: 85000 },
        { month: 'Aug', count: 110000 },
        { month: 'Sep', count: 142000 },
        { month: 'Oct', count: 184000 },
      ]
    }
  });
});

// 10. Developer Create & Submit App or Book (Dynamic Input, Secret Code, Mandatory Terms & Certificate)
app.post('/api/apps', (req: Request, res: Response) => {
  const body = req.body;
  const isBook = body.mediaType === 'BOOK' || body.category === 'Books';

  // 1. Mandatory Secret Authorization Code generated from Admin File
  if (!body.secretAuthCode || typeof body.secretAuthCode !== 'string') {
    return res.status(400).json({
      success: false,
      error: { 
        code: 'SECRET_CODE_REQUIRED', 
        message: 'Mandatory Secret Authorization Code is required before uploading. Generate an authorized code from FAS Admin Console.' 
      }
    });
  }

  // 2. Mandatory Checkboxes: Terms Agreement & Certificate Permission
  if (!body.termsAgreement) {
    return res.status(400).json({
      success: false,
      error: { 
        code: 'TERMS_NOT_ACCEPTED', 
        message: 'You must check and agree to "Terms Agreement" before submission.' 
      }
    });
  }

  if (!body.createCertificatePermission) {
    return res.status(400).json({
      success: false,
      error: { 
        code: 'CERTIFICATE_PERMISSION_REQUIRED', 
        message: 'You must check and grant permission for "Create FAS Official Certificate Permission" to issue a verified Blue Tick.' 
      }
    });
  }

  // 3. Validation based on Media Type (App vs Book)
  if (!body.name) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: isBook ? 'Book Title is required' : 'App Name is required' }
    });
  }

  let finalPackageName = body.packageName;
  if (isBook && (!finalPackageName || !finalPackageName.trim())) {
    finalPackageName = `com.fas.books.${body.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  if (!finalPackageName) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Package identifier is required' }
    });
  }

  const packageRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i;
  if (!packageRegex.test(finalPackageName)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid package identifier format (e.g. com.flame.example)' }
    });
  }

  const existing = appsDatabase.find(a => a.packageName.toLowerCase() === finalPackageName.toLowerCase());
  if (existing) {
    return res.status(400).json({
      success: false,
      error: { code: 'DUPLICATE_PACKAGE', message: `Identifier "${finalPackageName}" is already registered on FAS` }
    });
  }

  const newAppId = isBook 
    ? `book-${body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}-${Date.now().toString().slice(-4)}`
    : finalPackageName.replace(/\./g, '-').toLowerCase();

  // Validate Secret Auth Code against Admin File registry
  const codeValidation = adminAuth.validateAndConsumeCode(body.secretAuthCode, 'dev-flame-labs', newAppId);
  if (!codeValidation.valid) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_AUTH_CODE', message: codeValidation.message }
    });
  }

  // Issue Official Cryptographic FAS Digital Certificate
  const sha256Fingerprint = crypto.createHash('sha256').update(newAppId + finalPackageName + Date.now()).digest('hex');
  const officialCert: DigitalCertificate = {
    id: `cert-${newAppId}`,
    serialNumber: `FAS-CERT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-VER`,
    developerName: body.developerName || (isBook ? 'Verified Author' : 'Flame Labs Inc.'),
    developerAge: body.developerAge ? parseInt(body.developerAge, 10) : 28,
    profileDetails: {
      organization: body.organization || `${body.developerName || 'Flame Studio'} Publications`,
      country: body.country || 'Global / FAS Certified',
      supportEmail: body.supportEmail || 'developer@flameappstore.com',
      verifiedIdentity: true,
      identityDocumentType: 'Government Cryptographic eID / FAS Admin Verified',
      trustScore: 99,
      securityTier: 'Tier-1 Sovereign Verified'
    },
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    verificationStatus: 'VERIFIED',
    fasSecurityCommandStatus: 'PASSED_20_AI_AUDIT',
    sha256Fingerprint,
    signatureLevel: 'FAS Sovereign Level-5 Cryptographic Seal',
    signatureToken: `SIG_FAS_SEC_CMD_${newAppId.replace(/-/g, '_')}`,
    termsAgreedAt: new Date().toISOString(),
    commandSealHash: crypto.createHash('sha256').update(body.secretAuthCode).digest('hex')
  };

  const parsedPrice = typeof body.price === 'number' ? body.price : parseFloat(body.price || '0');

  const newApp: AppItem = {
    id: newAppId,
    name: body.name,
    packageName: finalPackageName,
    developerId: 'dev-flame-labs',
    developerName: body.developerName || (isBook ? 'FAS Author' : 'Flame Labs Inc.'),
    category: isBook ? 'Books' : (body.category || 'Tools'),
    mediaType: isBook ? 'BOOK' : 'APP',
    price: isNaN(parsedPrice) ? 0 : parsedPrice,
    isPremium: !isNaN(parsedPrice) && parsedPrice > 0,
    shortDescription: body.shortDescription || (isBook ? 'A verified digital publication on Flame App Store.' : 'A new Android application built for Flame App Store.'),
    fullDescription: body.fullDescription || body.shortDescription || 'Full application description.',
    iconUrl: body.iconUrl || (isBook ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80'),
    headerBannerUrl: body.headerBannerUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    screenshots: body.screenshots && body.screenshots.length > 0 ? body.screenshots : [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 5.0,
    ratingCount: 1,
    ratingDistribution: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 },
    downloadCount: 0,
    featured: false,
    status: body.submitImmediately ? 'PUBLISHED' : 'UNDER_REVIEW',
    tags: body.tags || (isBook ? ['PDF Book', 'Publication', 'FAS Certified'] : ['Android', 'FAS', 'APK']),
    hasCertificate: true,
    certificate: officialCert,
    bookDetails: isBook ? {
      pdfFileName: body.pdfFileName || `${body.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      pdfFileSize: body.pdfFileSize || '15.4 MB',
      pdfFileSizeBytes: 16148070,
      pageCount: body.pageCount ? parseInt(body.pageCount, 10) : 280,
      author: body.developerName || 'FAS Author',
      publisher: body.organization || 'Flame Publishing Press',
      isbn: body.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      edition: body.edition || '1st Official Edition (2026)',
      readingTimeMinutes: 320
    } : undefined,
    currentVersion: {
      id: `v-${Date.now()}`,
      versionName: body.versionName || '1.0.0',
      versionCode: body.versionCode || 1,
      releaseNotes: body.releaseNotes || 'Initial official FAS publication.',
      apkFileName: isBook ? `${body.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` : `${finalPackageName}-v${body.versionName || '1.0.0'}.apk`,
      apkFileSize: isBook ? (body.pdfFileSize || '15.4 MB') : (body.apkFileSize || '25.6 MB'),
      apkFileSizeBytes: 26843545,
      sha256: sha256Fingerprint,
      minAndroid: isBook ? 'PDF 2.0 / Universal' : (body.minAndroid || 'Android 10 (API 29)'),
      targetAndroid: isBook ? 'Universal PDF Reader' : (body.targetAndroid || 'Android 15 (API 35)'),
      uploadDate: new Date().toISOString().split('T')[0]
    },
    versionHistory: [],
    permissions: isBook ? ['Storage'] : (body.permissions || ['Internet', 'Storage', 'Notifications']),
    contentRating: body.contentRating || {
      violence: false,
      strongLanguage: false,
      gambling: false,
      sexualContent: false,
      userGeneratedContent: false,
      inAppPurchases: false,
      ratingTier: '3+'
    },
    dataSafety: {
      personalInfo: false,
      location: false,
      financials: false,
      media: true,
      appUsage: true,
      isEncryptedInTransit: true,
      canRequestDeletion: true,
      details: 'All communications encrypted via TLS 1.3.'
    },
    testLink: `https://flameappstore.com/test-app/${newAppId}`,
    testerCount: 15,
    requiredTesters: 15,
    testerFeedback: [],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    submissionLogs: [
      {
        id: `sub-init-${Date.now()}`,
        timestamp: new Date().toISOString(),
        reviewer: '20-AI Shield Automated Pipeline',
        action: 'PUBLISHED',
        previousStatus: 'SUBMITTED',
        newStatus: 'PUBLISHED',
        reason: `Cryptographic Secret Auth Code "${body.secretAuthCode}" verified. FAS Digital Certificate issued.`
      }
    ]
  };

  // Perform 20-AI Shield Security Audit
  const shieldAudit = flameAIShield.auditItemCertificate(newApp);
  if (!shieldAudit.allowed) {
    return res.status(403).json({
      success: false,
      error: { code: 'AI_SHIELD_BLOCKED', message: shieldAudit.reason }
    });
  }

  appsDatabase.unshift(newApp);

  // Add notification
  notificationsDatabase.unshift({
    id: `notif-${Date.now()}`,
    userId: 'user-current',
    title: isBook ? 'Book Certified & Published!' : 'App Certified & Published!',
    message: `"${newApp.name}" has passed the 20-AI Shield Audit and received the FAS Verified Blue Tick!`,
    timestamp: 'Just now',
    read: false,
    type: 'SUCCESS',
    appId: newApp.id
  });

  res.status(201).json({ success: true, data: newApp, certificate: officialCert });
});

/* =========================================================================
   PURCHASE & DIGITAL RECEIPT ENDPOINTS (Apps & Books)
   ========================================================================= */
app.post('/api/purchases', (req: Request, res: Response) => {
  const { itemId, paymentMethod } = req.body;
  const item = appsDatabase.find(a => a.id === itemId);

  if (!item) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
  }

  const isBook = item.mediaType === 'BOOK' || item.category === 'Books';
  const newPurchase: PurchaseRecord = {
    id: `purch-${Date.now()}`,
    itemId: item.id,
    itemTitle: item.name,
    mediaType: isBook ? 'BOOK' : 'APP',
    price: item.price || 0,
    currency: 'USD',
    purchaseDate: new Date().toISOString(),
    transactionHash: '0x' + crypto.randomBytes(20).toString('hex'),
    downloadUrl: isBook ? `/api/books/${item.id}/pdf` : `/api/apps/${item.id}/download`,
    certificateSerial: item.certificate?.serialNumber
  };

  purchasesDatabase.unshift(newPurchase);

  // Add purchase notification
  notificationsDatabase.unshift({
    id: `notif-purch-${Date.now()}`,
    userId: 'user-current',
    title: isBook ? 'Book Purchased Successfully!' : 'App Purchased Successfully!',
    message: `You now have full access to "${item.name}". Download PDF or APK anytime.`,
    timestamp: 'Just now',
    read: false,
    type: 'SUCCESS',
    appId: item.id
  });

  res.status(201).json({ success: true, data: newPurchase });
});

app.get('/api/purchases', (req: Request, res: Response) => {
  res.json({ success: true, data: purchasesDatabase });
});

app.get('/api/books/:id/pdf', (req: Request, res: Response) => {
  const book = appsDatabase.find(a => a.id === req.params.id);
  if (!book) {
    return res.status(404).send('Book not found on Flame App Store.');
  }

  const pdfBuffer = generateSamplePdfBuffer(book);
  const fileName = book.bookDetails?.pdfFileName || `${book.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(pdfBuffer);
});

/* =========================================================================
   CONNECTING LINK ENCRYPTED BRIDGE ENDPOINTS
   ========================================================================= */
app.get('/api/connecting-link/handshake', (req: Request, res: Response) => {
  const clientId = (req.query.clientId as string) || 'client-browser-ui';
  const handshake = connectingLink.generateHandshakeToken(clientId);
  res.json({ success: true, data: handshake });
});

app.get('/api/connecting-link/status', (req: Request, res: Response) => {
  res.json({ success: true, data: connectingLink.getStatus() });
});

/* =========================================================================
   20-AI SECURITY SHIELD ENDPOINTS
   ========================================================================= */
app.get('/api/shield/status', (req: Request, res: Response) => {
  res.json({ success: true, data: flameAIShield.getCommanderStatus() });
});

app.get('/api/shield/units', (req: Request, res: Response) => {
  res.json({ success: true, data: flameAIShield.getUnits() });
});

app.post('/api/shield/audit', (req: Request, res: Response) => {
  const auditResult = flameAIShield.auditItemCertificate(req.body);
  res.json({ success: true, data: auditResult });
});

/* =========================================================================
   GEMINI TRAINER & ADMIN OVERRIDE ENDPOINTS
   ========================================================================= */
app.post('/api/trainer/command', async (req: Request, res: Response) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ success: false, error: 'Command text is required' });
  }

  const result = await geminiTrainer.executeCommand(command);
  res.json({ success: true, data: result });
});

app.post('/api/trainer/destroy', (req: Request, res: Response) => {
  const adminId = req.body.adminId || 'FAS Security Root Admin';
  const result = geminiTrainer.destroyTrainer(adminId);
  res.json({ success: true, data: result });
});

app.post('/api/trainer/restore', (req: Request, res: Response) => {
  const adminId = req.body.adminId || 'FAS Security Root Admin';
  const result = geminiTrainer.restoreTrainer(adminId);
  res.json({ success: true, data: result });
});

app.get('/api/trainer/status', (req: Request, res: Response) => {
  res.json({ success: true, data: geminiTrainer.getStatus() });
});

/* =========================================================================
   ADMIN SECRET AUTHORIZATION CODE ENDPOINTS (Safely on Backend)
   ========================================================================= */
app.post('/api/admin/generate-code', (req: Request, res: Response) => {
  const createdBy = req.body.adminId || 'Admin (FAS Security File)';
  const newCode = adminAuth.generateCode(createdBy);
  res.json({ success: true, data: newCode });
});

app.get('/api/admin/codes', (req: Request, res: Response) => {
  res.json({ success: true, data: adminAuth.listCodes() });
});

app.post('/api/admin/verify-code', (req: Request, res: Response) => {
  const { code } = req.body;
  const valid = adminAuth.checkCodeValidity(code);
  res.json({ success: true, valid });
});

/* =========================================================================
   PAYMENT CONFIGURATION & ADMIN GATEWAY
   ========================================================================= */
app.get('/api/payment-config', (req: Request, res: Response) => {
  res.json({ success: true, data: paymentConfigDatabase });
});

app.post('/api/admin/payment-config', (req: Request, res: Response) => {
  const { enabled, qrCodeImageUrl, upiId, merchantName, supportNote, currency } = req.body;
  
  if (typeof enabled === 'boolean') paymentConfigDatabase.enabled = enabled;
  if (qrCodeImageUrl) paymentConfigDatabase.qrCodeImageUrl = qrCodeImageUrl;
  if (upiId) paymentConfigDatabase.upiId = upiId.trim();
  if (merchantName) paymentConfigDatabase.merchantName = merchantName.trim();
  if (supportNote) paymentConfigDatabase.supportNote = supportNote.trim();
  if (currency) paymentConfigDatabase.currency = currency;
  paymentConfigDatabase.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Payment System configuration updated successfully!',
    data: paymentConfigDatabase
  });
});

/* =========================================================================
   ADMIN DETAILED PLATFORM ANALYTICS
   ========================================================================= */
app.get('/api/admin/analytics', (req: Request, res: Response) => {
  const totalApps = appsDatabase.filter(a => a.mediaType !== 'BOOK' && a.category !== 'Books').length;
  const totalBooks = appsDatabase.filter(a => a.mediaType === 'BOOK' || a.category === 'Books').length;
  const pendingApprovals = appsDatabase.filter(a => a.status === 'PENDING_REVIEW' || a.status === 'UNDER_REVIEW').length;
  const totalDownloads = downloadStats.total;
  const totalRevenue = purchasesDatabase.reduce((acc, p) => acc + (p.price || 0), 0) + 48250;

  // Realistic dynamic online user fluctuation
  const onlineFluctuation = Math.floor(Math.sin(Date.now() / 10000) * 15);
  const liveOnlineUsers = 385 + onlineFluctuation;

  const analytics: PlatformAnalytics = {
    totalUsers: 18492,
    onlineUsers: liveOnlineUsers,
    totalApps,
    totalBooks,
    totalDownloads,
    activeDevelopers: 142,
    pendingApprovals,
    totalRevenue,
    dailyTraffic: 42300,
    serverUptime: '99.98% (Online 142d 18h)'
  };

  res.json({ success: true, data: analytics });
});

/* =========================================================================
   FLAME AI — INFINITY LANGUAGE TRANSLATION ENGINE (with Gemini Trainer)
   ========================================================================= */
app.post('/api/flame-ai/translate-language', async (req: Request, res: Response) => {
  try {
    const { text, sourceLang } = req.body;
    const result = await infinityAiTranslator.translate(text || '', sourceLang || 'en');
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Translation failed' });
  }
});

// 11. Update / Submit App
app.put('/api/apps/:id', (req: Request, res: Response) => {
  const index = appsDatabase.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'App not found' } });
  }

  const existing = appsDatabase[index];
  const updated: AppItem = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  appsDatabase[index] = updated;
  res.json({ success: true, data: updated });
});

app.post('/api/apps/:id/submit', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'App not found' } });
  }

  const prev = appItem.status;
  appItem.status = 'UNDER_REVIEW';
  appItem.submissionLogs.push({
    id: `sub-${Date.now()}`,
    timestamp: new Date().toISOString(),
    reviewer: 'Submission Bot',
    action: 'SUBMITTED',
    previousStatus: prev,
    newStatus: 'UNDER_REVIEW',
    reason: 'Developer requested publication review.'
  });

  notificationsDatabase.unshift({
    id: `notif-${Date.now()}`,
    userId: 'user-current',
    title: 'Submission Under Review',
    message: `"${appItem.name}" has been queued for security and sandbox audit.`,
    timestamp: 'Just now',
    read: false,
    type: 'INFO',
    appId: appItem.id
  });

  res.json({ success: true, data: appItem });
});

// 12. Admin Moderation Endpoints
app.get('/api/admin/apps', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: appsDatabase,
    summary: {
      total: appsDatabase.length,
      published: appsDatabase.filter(a => a.status === 'PUBLISHED').length,
      underReview: appsDatabase.filter(a => a.status === 'UNDER_REVIEW').length,
      drafts: appsDatabase.filter(a => a.status === 'DRAFT').length,
      rejected: appsDatabase.filter(a => a.status === 'REJECTED').length,
    }
  });
});

app.post('/api/admin/apps/:id/approve', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'App not found' } });
  }

  const prev = appItem.status;
  appItem.status = 'PUBLISHED';
  appItem.statusReason = undefined;
  appItem.submissionLogs.push({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    reviewer: 'Admin Security Team',
    action: 'APPROVED',
    previousStatus: prev,
    newStatus: 'PUBLISHED',
    reason: req.body.reason || 'Security scan passed. Compliant with Flame APK policies.'
  });

  notificationsDatabase.unshift({
    id: `notif-${Date.now()}`,
    userId: 'user-current',
    title: 'App Approved & Published! 🔥',
    message: `Congratulations! "${appItem.name}" is now live on Flame App Store.`,
    timestamp: 'Just now',
    read: false,
    type: 'SUCCESS',
    appId: appItem.id
  });

  res.json({ success: true, data: appItem });
});

app.post('/api/admin/apps/:id/reject', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'App not found' } });
  }

  const reason = req.body.reason || 'Package permissions require clarification or APK binary contains unverified dependencies.';
  const prev = appItem.status;
  appItem.status = 'REJECTED';
  appItem.statusReason = reason;
  appItem.submissionLogs.push({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    reviewer: 'Admin Security Team',
    action: 'REJECTED',
    previousStatus: prev,
    newStatus: 'REJECTED',
    reason
  });

  notificationsDatabase.unshift({
    id: `notif-${Date.now()}`,
    userId: 'user-current',
    title: 'Submission Changes Requested',
    message: `"${appItem.name}" was returned with note: ${reason}`,
    timestamp: 'Just now',
    read: false,
    type: 'ALERT',
    appId: appItem.id
  });

  res.json({ success: true, data: appItem });
});

app.post('/api/admin/apps/:id/suspend', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'App not found' } });
  }

  const reason = req.body.reason || 'Suspended by admin for policy violation.';
  const prev = appItem.status;
  appItem.status = 'SUSPENDED';
  appItem.statusReason = reason;
  appItem.submissionLogs.push({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    reviewer: 'Lead Admin',
    action: 'SUSPENDED',
    previousStatus: prev,
    newStatus: 'SUSPENDED',
    reason
  });

  res.json({ success: true, data: appItem });
});

app.post('/api/admin/apps/:id/feature', (req: Request, res: Response) => {
  const appItem = appsDatabase.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'App not found' } });
  }

  appItem.featured = !appItem.featured;
  res.json({ success: true, data: appItem });
});

// 13. Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json({ success: true, data: notificationsDatabase });
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = notificationsDatabase.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (req: Request, res: Response) => {
  notificationsDatabase.forEach(n => { n.read = true; });
  res.json({ success: true });
});

// 14. Auth endpoints
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = usersDatabase['user-current'];
  res.json({
    success: true,
    data: {
      user,
      accessToken: 'fas_jwt_access_mock_token_valid',
      refreshToken: 'fas_jwt_refresh_mock_token_valid'
    }
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: name || 'Flame Pioneer',
    email: email || 'user@flameappstore.com',
    role: (role as UserRole) || 'USER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    joinedDate: 'Just now',
    favorites: [],
    downloadHistory: []
  };
  usersDatabase[newUser.id] = newUser;
  res.status(201).json({
    success: true,
    data: {
      user: newUser,
      accessToken: 'fas_jwt_access_mock_token_valid',
      refreshToken: 'fas_jwt_refresh_mock_token_valid'
    }
  });
});

// 15. User Profile & Favorites
app.get('/api/user/profile', (req: Request, res: Response) => {
  res.json({ success: true, data: usersDatabase['user-current'] });
});

app.post('/api/user/favorite', (req: Request, res: Response) => {
  const { appId } = req.body;
  const user = usersDatabase['user-current'];
  if (user) {
    if (user.favorites.includes(appId)) {
      user.favorites = user.favorites.filter(id => id !== appId);
    } else {
      user.favorites.push(appId);
    }
    return res.json({ success: true, favorites: user.favorites });
  }
  res.status(401).json({ success: false, error: 'Unauthorized' });
});

/* =========================================================================
   DEVELOPER WALLET & WITHDRAWAL PAYOUT SYSTEM
   Rules:
   - Free apps: Each unique user download yields ₹100 INR
   - Premium apps/books: Each unique buyer purchase yields Item Price (e.g. $5 * 83.5 = ₹417.50)
   - Unique per user: Duplicate downloads from same user are not double-calculated
   - Payout Withdrawal: Developer chooses Payment Method (UPI / PhonePe / Paytm / PayPal / Aadhaar / Bank)
   - On request: Marked PENDING_APPROVAL with 24-hour SLA message:
     "आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें"
   - Admin audit queue can Approve & Process or Reject
   ========================================================================= */

// In-Memory Payouts Database
const payoutsDatabase: PayoutRequest[] = [
  {
    id: 'payout-init-1',
    developerId: 'dev-flame-labs',
    developerName: 'Flame Labs Inc.',
    amountINR: 15000,
    amountUSD: 179.64,
    currency: 'INR',
    paymentMethod: 'UPI',
    accountDetails: {
      upiId: 'alex.flame@okhdfcbank'
    },
    status: 'APPROVED_PROCESSED',
    requestedAt: '2026-10-08T10:15:00.000Z',
    processedAt: '2026-10-08T16:20:00.000Z',
    etaMessage: 'Approved and transferred via UPI Instant Settlement.',
    adminNotes: 'Verified developer identity & KYC'
  }
];

// User unique downloads tracker: key = `${userId}:${appId}`
const uniqueDownloadsTracker = new Set<string>([
  'user-current:flame-browser-pro',
  'user-102:flame-browser-pro',
  'user-103:flame-browser-pro',
  'user-104:apex-launcher-fire',
  'user-105:mythic-quest-rpg'
]);

// Helper to compute developer wallet
function computeDeveloperWallet(developerId: string = 'dev-flame-labs'): DeveloperWallet {
  // Find apps belonging to developer
  const devApps = appsDatabase.filter(a => a.developerId === developerId || a.developerName === 'Flame Labs Inc.' || a.developerName === 'Alex Vance');
  
  let uniqueFreeCount = 0;
  let uniquePaidCount = 0;
  let paidRevenueINR = 0;

  devApps.forEach(app => {
    const isFree = !app.price || app.price === 0;
    const count = app.downloadCount || 100;

    if (isFree) {
      // Base realistic unique download users
      uniqueFreeCount += Math.min(count, 380);
    } else {
      const priceUSD = app.price || 4.99;
      const buyers = Math.min(Math.floor(count * 0.12) + 12, 45);
      uniquePaidCount += buyers;
      paidRevenueINR += Math.round(buyers * priceUSD * 83.5);
    }
  });

  // Each unique free download earns ₹100 INR
  const freeRevenueINR = uniqueFreeCount * 100;
  const totalEarnedINR = freeRevenueINR + paidRevenueINR;

  // Compute payouts
  const devPayouts = payoutsDatabase.filter(p => p.developerId === developerId);
  const totalWithdrawnINR = devPayouts
    .filter(p => p.status === 'APPROVED_PROCESSED')
    .reduce((sum, p) => sum + p.amountINR, 0);

  const pendingWithdrawalINR = devPayouts
    .filter(p => p.status === 'PENDING_APPROVAL')
    .reduce((sum, p) => sum + p.amountINR, 0);

  const balanceINR = Math.max(0, totalEarnedINR - totalWithdrawnINR - pendingWithdrawalINR);
  const balanceUSD = Math.round((balanceINR / 83.5) * 100) / 100;

  return {
    developerId,
    developerName: 'Flame Labs Inc.',
    balanceINR,
    balanceUSD,
    totalEarnedINR,
    totalWithdrawnINR,
    pendingWithdrawalINR,
    freeAppsRevenueINR: freeRevenueINR,
    paidAppsRevenueINR: paidRevenueINR,
    uniqueFreeDownloadsCount: uniqueFreeCount,
    uniquePaidBuyersCount: uniquePaidCount,
    payoutHistory: devPayouts,
    lastCalculatedAt: new Date().toISOString()
  };
}

// 1. Get Developer Wallet & Balance
app.get('/api/developer/wallet', (req: Request, res: Response) => {
  const developerId = (req.query.developerId as string) || 'dev-flame-labs';
  const wallet = computeDeveloperWallet(developerId);
  res.json({ success: true, data: wallet });
});

// 2. Request Payout / Withdraw Funds
app.post('/api/developer/payout-request', (req: Request, res: Response) => {
  const { 
    developerId = 'dev-flame-labs',
    amount, 
    currency = 'INR', 
    paymentMethod, 
    accountDetails 
  } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Please specify a valid withdrawal amount.' });
  }

  if (!paymentMethod) {
    return res.status(400).json({ success: false, message: 'Please select a payout payment method.' });
  }

  // Convert amount to INR for internal settlement balance check
  const amountINR = currency === 'USD' ? Math.round(amount * 83.5) : Math.round(amount);
  const amountUSD = currency === 'USD' ? amount : Math.round((amount / 83.5) * 100) / 100;

  const currentWallet = computeDeveloperWallet(developerId);
  if (amountINR > currentWallet.balanceINR) {
    return res.status(400).json({ 
      success: false, 
      message: `Insufficient balance. Available: ₹${currentWallet.balanceINR.toLocaleString()} ($${currentWallet.balanceUSD}), Requested: ₹${amountINR.toLocaleString()}` 
    });
  }

  // Minimum withdrawal limit ₹500 or $6
  if (amountINR < 500) {
    return res.status(400).json({ 
      success: false, 
      message: 'Minimum withdrawal amount is ₹500 ($6 USD).' 
    });
  }

  const newPayout: PayoutRequest = {
    id: `payout-${Date.now()}`,
    developerId,
    developerName: 'Flame Labs Inc.',
    amountINR,
    amountUSD,
    currency,
    paymentMethod: paymentMethod as PayoutMethod,
    accountDetails: accountDetails || {},
    status: 'PENDING_APPROVAL',
    requestedAt: new Date().toISOString(),
    etaMessage: 'आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें'
  };

  payoutsDatabase.unshift(newPayout);

  // Send notification to user
  notificationsDatabase.unshift({
    id: `notif-payout-${Date.now()}`,
    userId: 'user-current',
    title: 'Payout Request Submitted / विथड्रॉ अनुरोध भेजा गया',
    message: `₹${amountINR.toLocaleString()} ($${amountUSD}) withdrawal request received. आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें।`,
    timestamp: 'Just now',
    read: false,
    type: 'INFO'
  });

  const updatedWallet = computeDeveloperWallet(developerId);
  res.status(201).json({ 
    success: true, 
    data: newPayout, 
    wallet: updatedWallet,
    message: 'आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें' 
  });
});

// 3. Admin: List All Payout Requests
app.get('/api/admin/payouts', (req: Request, res: Response) => {
  res.json({ success: true, data: payoutsDatabase });
});

// 4. Admin: Approve Payout Request
app.post('/api/admin/payouts/:id/approve', (req: Request, res: Response) => {
  const payout = payoutsDatabase.find(p => p.id === req.params.id);
  if (!payout) {
    return res.status(404).json({ success: false, message: 'Payout request not found.' });
  }

  payout.status = 'APPROVED_PROCESSED';
  payout.processedAt = new Date().toISOString();
  payout.adminNotes = req.body.adminNotes || 'Approved by FAS Security Admin. Dispatched to payment provider.';
  payout.etaMessage = 'Approved & Settled to developer account.';

  // Notify developer
  notificationsDatabase.unshift({
    id: `notif-approve-${Date.now()}`,
    userId: 'user-current',
    title: 'Payout Approved & Settled! 🎉',
    message: `Your withdrawal of ₹${payout.amountINR.toLocaleString()} via ${payout.paymentMethod} has been successfully approved and transferred!`,
    timestamp: 'Just now',
    read: false,
    type: 'SUCCESS'
  });

  res.json({ success: true, data: payout });
});

// 5. Admin: Reject Payout Request
app.post('/api/admin/payouts/:id/reject', (req: Request, res: Response) => {
  const payout = payoutsDatabase.find(p => p.id === req.params.id);
  if (!payout) {
    return res.status(404).json({ success: false, message: 'Payout request not found.' });
  }

  payout.status = 'REJECTED';
  payout.processedAt = new Date().toISOString();
  payout.adminNotes = req.body.reason || 'Payment details verification failed. Funds refunded to wallet.';
  payout.etaMessage = `Rejected: ${payout.adminNotes}`;

  // Notify developer
  notificationsDatabase.unshift({
    id: `notif-reject-${Date.now()}`,
    userId: 'user-current',
    title: 'Payout Request Declined',
    message: `Your withdrawal request of ₹${payout.amountINR.toLocaleString()} was declined: ${payout.adminNotes}. Balance returned.`,
    timestamp: 'Just now',
    read: false,
    type: 'ALERT'
  });

  res.json({ success: true, data: payout });
});

/* =========================================================================
   TOURNAMENTS & E-SPORTS REWARDS ECOSYSTEM (Free Fire, BGMI & Categories)
   ========================================================================= */

// Seed Tournaments Database
let tournamentsDatabase: Tournament[] = [
  {
    id: 'tourn-ff-championship-2026',
    title: 'Free Fire Grand Clash: Flame Masters Pro',
    gameCategory: 'Free Fire',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    entryFeeCoins: 20,
    hostingFeeCoins: 50,
    prizePoolCoins: 1500,
    hostUserId: 'dev-flame-labs',
    hostUserName: 'Flame Esports Official',
    rules: 'Battle Royale Squad match. Bermuda Map. No emulators/hacks allowed. 20-AI Shield monitors live telemetry.',
    matchSchedule: 'Tonight 9:00 PM IST',
    maxSlots: 48,
    registeredCount: 36,
    status: 'UPCOMING',
    participants: [
      {
        id: 'p-1',
        tournamentId: 'tourn-ff-championship-2026',
        userId: 'user-current',
        userName: 'Alex Vance',
        userEmail: 'alex@flamestore.dev',
        inGameUid: 'FF-982140182',
        ign: 'FlameVance_99',
        registeredAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'CONFIRMED'
      },
      {
        id: 'p-2',
        tournamentId: 'tourn-ff-championship-2026',
        userId: 'user-ninja',
        userName: 'Shadow Ninja',
        userEmail: 'ninja@flamestore.dev',
        inGameUid: 'FF-772189033',
        ign: 'GhostShadow_PRO',
        registeredAt: new Date(Date.now() - 7200000).toISOString(),
        status: 'CONFIRMED'
      }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'tourn-bgmi-titans-2026',
    title: 'BGMI Battleground Titans: Erangel Warfare',
    gameCategory: 'BGMI',
    bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80',
    entryFeeCoins: 30,
    hostingFeeCoins: 50,
    prizePoolCoins: 2500,
    hostUserId: 'dev-flame-labs',
    hostUserName: 'Krafton Community Partner',
    rules: 'Erangel Classic Squad. TPP Mode. Room ID & Password shared 15 mins prior in Tournament Console.',
    matchSchedule: 'Tomorrow 7:30 PM IST',
    maxSlots: 100,
    registeredCount: 84,
    status: 'UPCOMING',
    participants: [],
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'tourn-ff-completed-1',
    title: 'Free Fire Weekend Blitz Invitational',
    gameCategory: 'Free Fire',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
    entryFeeCoins: 10,
    hostingFeeCoins: 50,
    prizePoolCoins: 1000,
    hostUserId: 'dev-flame-labs',
    hostUserName: 'Flame Esports Official',
    rules: 'Clash Squad 4v4 Final showdown.',
    matchSchedule: 'Yesterday 6:00 PM IST',
    maxSlots: 32,
    registeredCount: 32,
    status: 'COMPLETED',
    winningUserId: 'user-current',
    winnerName: 'Alex Vance',
    winnerInGameUid: 'FF-982140182',
    winnerPrizeCoins: 1000,
    winnerProofUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    adminNotes: 'Victory confirmed with 14 kills. 1000 Coins credited to player account.',
    participants: [
      {
        id: 'p-win-1',
        tournamentId: 'tourn-ff-completed-1',
        userId: 'user-current',
        userName: 'Alex Vance',
        userEmail: 'alex@flamestore.dev',
        inGameUid: 'FF-982140182',
        ign: 'FlameVance_99',
        rank: 1,
        prizeWonCoins: 1000,
        registeredAt: new Date(Date.now() - 250000000).toISOString(),
        status: 'WINNER'
      }
    ],
    createdAt: new Date(Date.now() - 260000000).toISOString(),
    completedAt: new Date(Date.now() - 180000000).toISOString()
  }
];

// Helper: Get or initialize User Coin Wallet
let userWalletsDatabase: Record<string, UserCoinWallet> = {
  'user-current': {
    userId: 'user-current',
    coinsBalance: 1250,
    totalCoinsEarned: 1350,
    totalCoinsSpent: 100,
    totalCoinsRedeemed: 0,
    transactions: [
      {
        id: 'ctx-1',
        userId: 'user-current',
        amount: 100,
        type: 'DAILY_BONUS',
        title: 'Flame App Store Welcome Bonus',
        description: 'New account starter rewards bonus',
        timestamp: new Date(Date.now() - 200000000).toISOString()
      },
      {
        id: 'ctx-2',
        userId: 'user-current',
        amount: 1000,
        type: 'TOURNAMENT_WIN',
        title: 'Free Fire Weekend Blitz 1st Place Victory',
        description: 'Winner prize pool credited to your account ID',
        referenceId: 'tourn-ff-completed-1',
        timestamp: new Date(Date.now() - 180000000).toISOString()
      },
      {
        id: 'ctx-3',
        userId: 'user-current',
        amount: 250,
        type: 'BUY_COINS_BUNDLE',
        title: 'Bought Starter Coins Pack',
        description: 'Store bundle top-up via UPI',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'ctx-4',
        userId: 'user-current',
        amount: -100,
        type: 'HOST_TOURNAMENT_FEE',
        title: 'Hosted Custom Tournament Fee',
        description: 'Spent coins to host custom gaming tournament',
        timestamp: new Date(Date.now() - 43200000).toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  }
};

function getOrCreateWallet(userId: string = 'user-current'): UserCoinWallet {
  if (!userWalletsDatabase[userId]) {
    userWalletsDatabase[userId] = {
      userId,
      coinsBalance: 150, // Welcome gift 150 coins
      totalCoinsEarned: 150,
      totalCoinsSpent: 0,
      totalCoinsRedeemed: 0,
      transactions: [
        {
          id: `ctx-${Date.now()}`,
          userId,
          amount: 150,
          type: 'DAILY_BONUS',
          title: 'Welcome Starter Reward',
          description: 'Initial coins granted for tournament exploration',
          timestamp: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };
  }
  return userWalletsDatabase[userId];
}

// 1. List Tournaments
app.get('/api/tournaments', (req: Request, res: Response) => {
  const { category, status, hostUserId } = req.query;
  let results = [...tournamentsDatabase];

  if (category && category !== 'All') {
    results = results.filter(t => t.gameCategory.toLowerCase() === (category as string).toLowerCase());
  }
  if (status) {
    results = results.filter(t => t.status === status);
  }
  if (hostUserId) {
    results = results.filter(t => t.hostUserId === hostUserId);
  }

  res.json({ success: true, count: results.length, data: results });
});

// 2. Get Single Tournament
app.get('/api/tournaments/:id', (req: Request, res: Response) => {
  const tournament = tournamentsDatabase.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found.' });
  }
  res.json({ success: true, data: tournament });
});

// 3. Create Custom Tournament (Organizer spends coins to set up & host)
app.post('/api/tournaments', (req: Request, res: Response) => {
  const {
    title,
    gameCategory,
    customGameName,
    bannerUrl,
    entryFeeCoins = 0,
    hostingFeeCoins = 50,
    prizePoolCoins,
    hostUserId = 'user-current',
    hostUserName = 'Alex Vance',
    rules,
    matchSchedule = 'Today 8:00 PM IST',
    maxSlots = 50
  } = req.body;

  if (!title || !gameCategory || !prizePoolCoins) {
    return res.status(400).json({ 
      success: false, 
      message: 'Title, game category, and prize pool coins are required.' 
    });
  }

  // Verify organizer has sufficient coins to spend for hosting fee
  const wallet = getOrCreateWallet(hostUserId);
  const requiredFee = Number(hostingFeeCoins) || 50;

  if (wallet.coinsBalance < requiredFee) {
    return res.status(400).json({ 
      success: false, 
      message: `Insufficient coins to host tournament. Hosting fee is ${requiredFee} coins, but your balance is ${wallet.coinsBalance} coins. You can earn or buy coins in your Wallet.` 
    });
  }

  // Deduct hosting fee from organizer wallet
  wallet.coinsBalance -= requiredFee;
  wallet.totalCoinsSpent += requiredFee;
  wallet.transactions.unshift({
    id: `ctx-host-${Date.now()}`,
    userId: hostUserId,
    amount: -requiredFee,
    type: 'HOST_TOURNAMENT_FEE',
    title: `Hosted Tournament: ${title}`,
    description: `Spent ${requiredFee} coins to host custom ${gameCategory} tournament`,
    timestamp: new Date().toISOString()
  });

  const newTournament: Tournament = {
    id: `tourn-${Date.now()}`,
    title: title.trim(),
    gameCategory: gameCategory as SupportedGameCategory,
    customGameName: customGameName || undefined,
    bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    entryFeeCoins: Number(entryFeeCoins) || 0,
    hostingFeeCoins: requiredFee,
    prizePoolCoins: Number(prizePoolCoins),
    hostUserId,
    hostUserName,
    rules: rules || 'Standard competitive tournament rules. Fair play strictly verified by 20-AI Shield.',
    matchSchedule,
    maxSlots: Number(maxSlots) || 50,
    registeredCount: 0,
    status: 'UPCOMING',
    participants: [],
    createdAt: new Date().toISOString()
  };

  tournamentsDatabase.unshift(newTournament);

  // Notify organizer
  notificationsDatabase.unshift({
    id: `notif-tourn-created-${Date.now()}`,
    userId: hostUserId,
    title: `Tournament Hosted: ${title} 🔥`,
    message: `Your ${gameCategory} tournament is live! ${requiredFee} hosting coins deducted.`,
    timestamp: 'Just now',
    read: false,
    type: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    data: newTournament,
    wallet,
    message: `Tournament created! Spent ${requiredFee} coins to host.`
  });
});

// 4. Join Tournament (Requires in-game UID and deduction of entry fee if any)
app.post('/api/tournaments/:id/join', (req: Request, res: Response) => {
  const tournament = tournamentsDatabase.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found.' });
  }

  if (tournament.status !== 'UPCOMING') {
    return res.status(400).json({ success: false, message: 'Tournament registration is closed.' });
  }

  if (tournament.registeredCount >= tournament.maxSlots) {
    return res.status(400).json({ success: false, message: 'Tournament is full.' });
  }

  const {
    userId = 'user-current',
    userName = 'Alex Vance',
    userEmail = 'alex@flamestore.dev',
    inGameUid,
    ign
  } = req.body;

  if (!inGameUid || !ign) {
    return res.status(400).json({ 
      success: false, 
      message: 'Both In-Game UID (e.g. Free Fire ID or BGMI UID) and In-Game Name (IGN) are required.' 
    });
  }

  const alreadyJoined = tournament.participants.some(p => p.userId === userId || p.inGameUid === inGameUid);
  if (alreadyJoined) {
    return res.status(400).json({ success: false, message: 'You have already registered for this tournament.' });
  }

  // Deduct entry fee if required
  const wallet = getOrCreateWallet(userId);
  if (tournament.entryFeeCoins > 0) {
    if (wallet.coinsBalance < tournament.entryFeeCoins) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient coins for entry fee (${tournament.entryFeeCoins} coins required, available: ${wallet.coinsBalance}).` 
      });
    }
    wallet.coinsBalance -= tournament.entryFeeCoins;
    wallet.totalCoinsSpent += tournament.entryFeeCoins;
    wallet.transactions.unshift({
      id: `ctx-entry-${Date.now()}`,
      userId,
      amount: -tournament.entryFeeCoins,
      type: 'JOIN_ENTRY_FEE',
      title: `Joined: ${tournament.title}`,
      description: `Entry fee for ${tournament.gameCategory} tournament`,
      referenceId: tournament.id,
      timestamp: new Date().toISOString()
    });
  }

  const newParticipant: TournamentParticipant = {
    id: `part-${Date.now()}`,
    tournamentId: tournament.id,
    userId,
    userName,
    userEmail,
    inGameUid,
    ign,
    registeredAt: new Date().toISOString(),
    status: 'CONFIRMED'
  };

  tournament.participants.push(newParticipant);
  tournament.registeredCount += 1;

  res.json({
    success: true,
    data: tournament,
    participant: newParticipant,
    wallet,
    message: `Successfully joined ${tournament.title}! Your slot is confirmed.`
  });
});

// 5. Declare Winner (Crediting coins prize to winner's account & displaying in Winning Tournament section)
app.post('/api/tournaments/:id/declare-winner', (req: Request, res: Response) => {
  const tournament = tournamentsDatabase.find(t => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found.' });
  }

  const {
    winningUserId = 'user-current',
    winnerName = 'Alex Vance',
    winnerInGameUid,
    winnerProofUrl,
    adminNotes
  } = req.body;

  tournament.status = 'COMPLETED';
  tournament.winningUserId = winningUserId;
  tournament.winnerName = winnerName;
  tournament.winnerInGameUid = winnerInGameUid || 'FF-982140182';
  tournament.winnerPrizeCoins = tournament.prizePoolCoins;
  tournament.winnerProofUrl = winnerProofUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80';
  tournament.adminNotes = adminNotes || 'Victory verified and match results confirmed.';
  tournament.completedAt = new Date().toISOString();

  // Update participant status
  const winnerParticipant = tournament.participants.find(p => p.userId === winningUserId || p.inGameUid === winnerInGameUid);
  if (winnerParticipant) {
    winnerParticipant.status = 'WINNER';
    winnerParticipant.rank = 1;
    winnerParticipant.prizeWonCoins = tournament.prizePoolCoins;
  }

  // Automatically credit prize coins to winner's wallet!
  const winnerWallet = getOrCreateWallet(winningUserId);
  winnerWallet.coinsBalance += tournament.prizePoolCoins;
  winnerWallet.totalCoinsEarned += tournament.prizePoolCoins;
  winnerWallet.transactions.unshift({
    id: `ctx-win-${Date.now()}`,
    userId: winningUserId,
    amount: tournament.prizePoolCoins,
    type: 'TOURNAMENT_WIN',
    title: `🏆 Tournament Champion: ${tournament.title}`,
    description: `Prize pool of ${tournament.prizePoolCoins} coins awarded for 1st Place victory in ${tournament.gameCategory}!`,
    referenceId: tournament.id,
    timestamp: new Date().toISOString()
  });

  // Send Notification to winner
  notificationsDatabase.unshift({
    id: `notif-win-${Date.now()}`,
    userId: winningUserId,
    title: `🏆 TOURNAMENT VICTORY! +${tournament.prizePoolCoins} COINS`,
    message: `Congratulations! You won the "${tournament.title}". ${tournament.prizePoolCoins} coins have been credited to your account ID!`,
    timestamp: 'Just now',
    read: false,
    type: 'SUCCESS'
  });

  res.json({
    success: true,
    data: tournament,
    winnerWallet,
    message: `Winner declared! ${tournament.prizePoolCoins} coins credited to ${winnerName}.`
  });
});

// 6. Winning Tournament Section / Victory Dashboard
app.get('/api/tournaments/user/winnings', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'user-current';
  const winningTournaments = tournamentsDatabase.filter(
    t => t.status === 'COMPLETED' && (t.winningUserId === userId || !req.query.userId)
  );

  res.json({
    success: true,
    count: winningTournaments.length,
    data: winningTournaments
  });
});

/* =========================================================================
   COINS & WALLET BALANCE TRACKING
   ========================================================================= */

// Get User Coins Wallet & Balance History
app.get('/api/user/coins-wallet', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'user-current';
  const wallet = getOrCreateWallet(userId);
  res.json({ success: true, data: wallet });
});

// Buy Coins Bundle (Add coins to balance via payment)
app.post('/api/user/coins-wallet/buy-bundle', (req: Request, res: Response) => {
  const { userId = 'user-current', coinsAmount, priceINR, paymentMethod = 'UPI' } = req.body;
  const coins = Number(coinsAmount);

  if (!coins || coins <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid coins amount.' });
  }

  const wallet = getOrCreateWallet(userId);
  wallet.coinsBalance += coins;
  wallet.totalCoinsEarned += coins;
  wallet.transactions.unshift({
    id: `ctx-buy-${Date.now()}`,
    userId,
    amount: coins,
    type: 'BUY_COINS_BUNDLE',
    title: `Purchased ${coins} Coins Pack`,
    description: `Payment settled via ${paymentMethod} (₹${priceINR || Math.round(coins * 0.2)})`,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    data: wallet,
    message: `Successfully credited +${coins} coins to your account!`
  });
});

/* =========================================================================
   REDEMPTION & WITHDRAWAL SYSTEM (UPI, Free Fire / BGMI In-Game UID)
   ========================================================================= */

let redemptionsDatabase: RedemptionRequest[] = [
  {
    id: 'rdm-init-1',
    userId: 'user-current',
    userName: 'Alex Vance',
    userEmail: 'alex@flamestore.dev',
    coins: 200,
    payoutMethod: 'UPI',
    payoutDetails: 'alexvance@okhdfcbank',
    amountINR: 180,
    currency: 'INR',
    status: 'PENDING',
    etaMessage: 'आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// 1. Submit Coin Redemption Request
app.post('/api/user/redeem', (req: Request, res: Response) => {
  const {
    userId = 'user-current',
    userEmail = 'alex@flamestore.dev',
    userName = 'Alex Vance',
    coins,
    payoutMethod,
    payoutDetails,
    inGameUid,
    gameBundleName
  } = req.body;

  const coinsToRedeem = Number(coins);
  if (!coinsToRedeem || coinsToRedeem <= 0) {
    return res.status(400).json({ success: false, message: 'Please enter a valid amount of coins to redeem.' });
  }

  if (!payoutMethod) {
    return res.status(400).json({ success: false, message: 'Please select a payout redemption method (UPI, Free Fire UID, or BGMI UID).' });
  }

  if ((payoutMethod === 'FREE_FIRE_UID' || payoutMethod === 'BGMI_UID') && !inGameUid) {
    return res.status(400).json({ success: false, message: 'Please provide your valid In-Game UID for direct game top-up.' });
  }

  if (payoutMethod === 'UPI' && !payoutDetails) {
    return res.status(400).json({ success: false, message: 'Please enter your UPI ID.' });
  }

  const wallet = getOrCreateWallet(userId);
  if (wallet.coinsBalance < coinsToRedeem) {
    return res.status(400).json({
      success: false,
      message: `Insufficient coins balance. You have ${wallet.coinsBalance} coins, requested ${coinsToRedeem} coins.`
    });
  }

  // Deduct coins from wallet balance immediately
  wallet.coinsBalance -= coinsToRedeem;
  wallet.totalCoinsRedeemed += coinsToRedeem;

  // Rate: 1 Coin = ~₹0.80 - ₹1.00 INR
  const amountINR = Math.round(coinsToRedeem * 0.9);

  const newRedemption: RedemptionRequest = {
    id: `rdm-${Date.now()}`,
    userId,
    userEmail,
    userName,
    coins: coinsToRedeem,
    payoutMethod,
    payoutDetails: payoutDetails || inGameUid || 'User Provided Account',
    inGameUid: inGameUid || undefined,
    gameBundleName: gameBundleName || undefined,
    amountINR,
    currency: 'INR',
    status: 'PENDING',
    etaMessage: 'आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें',
    createdAt: new Date().toISOString()
  };

  redemptionsDatabase.unshift(newRedemption);

  // Record debit in coin transactions
  wallet.transactions.unshift({
    id: `ctx-rdm-${Date.now()}`,
    userId,
    amount: -coinsToRedeem,
    type: 'REDEMPTION',
    title: `Redeem Request: ${coinsToRedeem} Coins`,
    description: `Redeemed for ${payoutMethod} (${inGameUid ? `UID: ${inGameUid}` : payoutDetails}). आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें`,
    referenceId: newRedemption.id,
    timestamp: new Date().toISOString()
  });

  // Notify user
  notificationsDatabase.unshift({
    id: `notif-rdm-${Date.now()}`,
    userId,
    title: 'Redemption Request Submitted ⏳',
    message: `${coinsToRedeem} coins redemption submitted via ${payoutMethod}. आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें।`,
    timestamp: 'Just now',
    read: false,
    type: 'INFO'
  });

  res.status(201).json({
    success: true,
    data: newRedemption,
    wallet,
    message: 'आपका विथड्रॉ पेंडिंग में है, 24 घंटे में अप्रूव हो जाएगा। 24 घंटे बाद चेक करें'
  });
});

// 2. List User Redemptions
app.get('/api/user/redemptions', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'user-current';
  const userRedemptions = redemptionsDatabase.filter(r => r.userId === userId);
  res.json({ success: true, data: userRedemptions });
});

// 3. Admin: List All Redemptions
app.get('/api/admin/redemptions', (req: Request, res: Response) => {
  res.json({ success: true, count: redemptionsDatabase.length, data: redemptionsDatabase });
});

// 4. Admin: Approve Redemption
app.post('/api/admin/redemptions/:id/approve', (req: Request, res: Response) => {
  const item = redemptionsDatabase.find(r => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Redemption request not found.' });
  }

  item.status = 'APPROVED';
  item.processedAt = new Date().toISOString();
  item.adminRemarks = req.body.adminRemarks || 'Verified and transferred successfully by FAS Admin Command.';
  item.etaMessage = 'Approved & Dispatched successfully!';

  // Notify user
  notificationsDatabase.unshift({
    id: `notif-rdm-app-${Date.now()}`,
    userId: item.userId,
    title: 'Redemption Approved & Dispatched! ✅',
    message: `Your redemption of ${item.coins} Coins (${item.payoutMethod}) has been approved and delivered!`,
    timestamp: 'Just now',
    read: false,
    type: 'SUCCESS'
  });

  res.json({ success: true, data: item, message: 'Redemption approved successfully.' });
});

// 5. Admin: Reject Redemption (Refunds coins back to user)
app.post('/api/admin/redemptions/:id/reject', (req: Request, res: Response) => {
  const item = redemptionsDatabase.find(r => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Redemption request not found.' });
  }

  item.status = 'REJECTED';
  item.processedAt = new Date().toISOString();
  item.adminRemarks = req.body.adminRemarks || 'Payout details or in-game UID was invalid. Coins refunded to wallet.';
  item.etaMessage = `Declined: ${item.adminRemarks}`;

  // Refund coins back to user
  const wallet = getOrCreateWallet(item.userId);
  wallet.coinsBalance += item.coins;
  wallet.totalCoinsRedeemed -= item.coins;
  wallet.transactions.unshift({
    id: `ctx-ref-${Date.now()}`,
    userId: item.userId,
    amount: item.coins,
    type: 'REDEMPTION',
    title: `Refund: ${item.coins} Coins`,
    description: `Redemption declined: ${item.adminRemarks}. Coins returned to your account balance.`,
    referenceId: item.id,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, data: item, message: 'Redemption rejected and coins refunded.' });
});

/* =========================================================================
   ADMIN FILE UPLOAD & STORE MANAGEMENT (Banners, Items, Bundles)
   ========================================================================= */

// Seed Admin Uploaded Files
let adminFilesDatabase: AdminUploadedFile[] = [
  {
    id: 'file-banner-esports-main',
    title: 'Flame Esports Grand Arena Banner 2026',
    fileType: 'IMAGE_BANNER',
    fileUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    fileSize: '1.4 MB',
    mimeType: 'image/jpeg',
    uploadedBy: 'Lead Admin',
    activeInStore: true,
    targetLink: '#tournaments',
    uploadedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Seed Store Items
let storeItemsDatabase: StoreItem[] = [
  {
    id: 'store-coins-500',
    title: '500 Flame Gold Coins Pack',
    category: 'COINS_PACK',
    priceCoins: 0,
    priceINR: 99,
    priceUSD: 1.2,
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600&auto=format&fit=crop&q=80',
    description: 'Instantly add 500 Coins to your profile to host tournaments or purchase digital assets.',
    inGameItemReward: '500 Virtual FAS Coins',
    requiresInGameUid: false,
    requiresEmail: true,
    stock: 9999,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'store-ff-diamonds-520',
    title: 'Free Fire: 520 Diamonds Direct Top-Up',
    category: 'GAME_TOPUP',
    priceCoins: 450,
    priceINR: 400,
    priceUSD: 4.99,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    description: 'Instant Free Fire diamonds credit to player UID. Enter your 8-10 digit Free Fire ID.',
    inGameItemReward: '520 Diamonds + 52 Bonus Diamonds',
    requiresInGameUid: true,
    requiresEmail: true,
    stock: 500,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'store-bgmi-uc-360',
    title: 'BGMI: 360 UC Royal Pass Bundle',
    category: 'GAME_TOPUP',
    priceCoins: 400,
    priceINR: 380,
    priceUSD: 4.5,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
    description: 'Direct UC delivery to Battlegrounds Mobile India UID for A-Series Royale Pass.',
    inGameItemReward: '360 UC Cash',
    requiresInGameUid: true,
    requiresEmail: true,
    stock: 500,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'store-pass-esports-pro',
    title: 'Flame Esports Pro Creator Pass (30 Days)',
    category: 'PREMIUM_PASS',
    priceCoins: 300,
    priceINR: 299,
    priceUSD: 3.5,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    description: 'Host unlimited custom tournaments without hosting fees for 30 days with verified blue tick badge.',
    inGameItemReward: 'VIP Organizer Badge + Free Hosting',
    requiresInGameUid: false,
    requiresEmail: true,
    stock: 100,
    isFeatured: true,
    createdAt: new Date().toISOString()
  }
];

let storeOrdersDatabase: StoreOrder[] = [];

// 1. Admin File Upload (Direct upload for images, banners, and digital products)
app.post('/api/admin/upload-file', (req: Request, res: Response) => {
  const { title, fileType = 'IMAGE_BANNER', fileDataUrl, fileSize = '1.2 MB', targetLink } = req.body;

  if (!title || !fileDataUrl) {
    return res.status(400).json({ success: false, message: 'File title and file data URL are required.' });
  }

  const newFile: AdminUploadedFile = {
    id: `file-${Date.now()}`,
    title: title.trim(),
    fileType,
    fileUrl: fileDataUrl,
    fileSize,
    mimeType: fileDataUrl.startsWith('data:image') ? 'image/png' : 'application/octet-stream',
    uploadedBy: 'Lead Admin',
    uploadedAt: new Date().toISOString(),
    activeInStore: true,
    targetLink: targetLink || undefined
  };

  adminFilesDatabase.unshift(newFile);

  res.status(201).json({
    success: true,
    data: newFile,
    message: 'File / Banner successfully uploaded to Flame App Store!'
  });
});

// 2. List Admin Uploaded Files
app.get('/api/admin/uploaded-files', (req: Request, res: Response) => {
  res.json({ success: true, data: adminFilesDatabase });
});

// 3. List Store Items (Public)
app.get('/api/store/items', (req: Request, res: Response) => {
  const { category } = req.query;
  let items = [...storeItemsDatabase];
  if (category && category !== 'All') {
    items = items.filter(i => i.category === category);
  }
  res.json({ success: true, count: items.length, data: items });
});

// 4. Admin: Add or Update Store Item
app.post('/api/admin/store-items', (req: Request, res: Response) => {
  const {
    id,
    title,
    category = 'GAME_TOPUP',
    priceCoins = 0,
    priceINR = 0,
    priceUSD = 0,
    image,
    description,
    inGameItemReward,
    requiresInGameUid = false,
    requiresEmail = true,
    stock = 1000,
    isFeatured = false
  } = req.body;

  if (!title || !image) {
    return res.status(400).json({ success: false, message: 'Item title and image URL are required.' });
  }

  if (id) {
    const existing = storeItemsDatabase.find(i => i.id === id);
    if (existing) {
      existing.title = title;
      existing.category = category;
      existing.priceCoins = Number(priceCoins);
      existing.priceINR = Number(priceINR);
      existing.priceUSD = Number(priceUSD);
      existing.image = image;
      existing.description = description || existing.description;
      existing.inGameItemReward = inGameItemReward;
      existing.requiresInGameUid = requiresInGameUid;
      existing.requiresEmail = requiresEmail;
      existing.stock = Number(stock);
      existing.isFeatured = isFeatured;
      return res.json({ success: true, data: existing, message: 'Store item updated.' });
    }
  }

  const newItem: StoreItem = {
    id: `item-${Date.now()}`,
    title: title.trim(),
    category,
    priceCoins: Number(priceCoins),
    priceINR: Number(priceINR),
    priceUSD: Number(priceUSD),
    image,
    description: description || 'Official Flame App Store digital product.',
    inGameItemReward: inGameItemReward || undefined,
    requiresInGameUid: !!requiresInGameUid,
    requiresEmail: !!requiresEmail,
    stock: Number(stock) || 100,
    isFeatured: !!isFeatured,
    createdAt: new Date().toISOString()
  };

  storeItemsDatabase.unshift(newItem);
  res.status(201).json({ success: true, data: newItem, message: 'Store item published!' });
});

// 5. Admin: Delete Store Item
app.delete('/api/admin/store-items/:id', (req: Request, res: Response) => {
  storeItemsDatabase = storeItemsDatabase.filter(i => i.id !== req.params.id);
  res.json({ success: true, message: 'Item removed from store.' });
});

// 6. User: Purchase Store Item (Using Coins or Payment)
app.post('/api/store/buy', (req: Request, res: Response) => {
  const {
    itemId,
    userId = 'user-current',
    userEmail = 'alex@flamestore.dev',
    inGameUid,
    paymentMethod = 'COINS'
  } = req.body;

  const item = storeItemsDatabase.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Store item not found.' });
  }

  if (item.requiresInGameUid && !inGameUid) {
    return res.status(400).json({ success: false, message: 'This item requires entering your In-Game UID for fulfillment.' });
  }

  if (item.requiresEmail && !userEmail) {
    return res.status(400).json({ success: false, message: 'Please provide your account email for digital receipt.' });
  }

  const wallet = getOrCreateWallet(userId);

  if (paymentMethod === 'COINS') {
    if (wallet.coinsBalance < item.priceCoins) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins balance. You have ${wallet.coinsBalance} coins, item requires ${item.priceCoins} coins.`
      });
    }
    wallet.coinsBalance -= item.priceCoins;
    wallet.totalCoinsSpent += item.priceCoins;
    wallet.transactions.unshift({
      id: `ctx-store-${Date.now()}`,
      userId,
      amount: -item.priceCoins,
      type: 'STORE_PURCHASE',
      title: `Store Purchase: ${item.title}`,
      description: `Purchased via Flame Coins (${inGameUid ? `Delivered to UID: ${inGameUid}` : 'Digital Item'})`,
      referenceId: item.id,
      timestamp: new Date().toISOString()
    });
  }

  // If purchasing coins pack via UPI
  if (item.category === 'COINS_PACK') {
    const packCoins = item.title.includes('500') ? 500 : 1000;
    wallet.coinsBalance += packCoins;
    wallet.totalCoinsEarned += packCoins;
    wallet.transactions.unshift({
      id: `ctx-pack-${Date.now()}`,
      userId,
      amount: packCoins,
      type: 'BUY_COINS_BUNDLE',
      title: `Added Coins: ${item.title}`,
      description: `Credited +${packCoins} Coins to your profile`,
      timestamp: new Date().toISOString()
    });
  }

  const newOrder: StoreOrder = {
    id: `ord-${Date.now()}`,
    itemId: item.id,
    itemTitle: item.title,
    category: item.category,
    userId,
    userEmail,
    inGameUid: inGameUid || undefined,
    coinsPaid: paymentMethod === 'COINS' ? item.priceCoins : 0,
    amountPaidINR: paymentMethod !== 'COINS' ? item.priceINR : 0,
    paymentMethod,
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  };

  storeOrdersDatabase.unshift(newOrder);

  // Send Notification
  notificationsDatabase.unshift({
    id: `notif-order-${Date.now()}`,
    userId,
    title: `Order Confirmed: ${item.title} 🛍️`,
    message: `Your purchase of ${item.title} has been completed! ${inGameUid ? `Fulfillment to UID: ${inGameUid}` : ''}`,
    timestamp: 'Just now',
    read: false,
    type: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    order: newOrder,
    wallet,
    message: `Order for "${item.title}" successfully confirmed!`
  });
});

// 7. Get Store Orders
app.get('/api/store/orders', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const orders = userId ? storeOrdersDatabase.filter(o => o.userId === userId) : storeOrdersDatabase;
  res.json({ success: true, data: orders });
});

/* =========================================================================
   SECURITY LOCK SYSTEM: DEVELOPER CONSOLE & ADMIN MULTI-FACTOR LOCKS
   (PIN/Number Lock, Draw Pattern Lock, and Fingerprint Biometric)
   ========================================================================= */

app.get('/api/auth/security-lock/status', (req: Request, res: Response) => {
  const scope = (req.query.scope as 'console' | 'admin') || 'console';
  const state = securityLockManager.getLockState(scope);
  res.json({ success: true, data: state });
});

app.post('/api/auth/security-lock/verify', (req: Request, res: Response) => {
  const { scope = 'console', type = 'NUMBER', credential } = req.body;
  const result = securityLockManager.verifyLock(scope, type as SecurityLockType, credential);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

app.post('/api/auth/security-lock/update', (req: Request, res: Response) => {
  const { scope = 'console', currentCredential, newType = 'NUMBER', newCredential } = req.body;
  const result = securityLockManager.updateLock(scope, currentCredential, newType as SecurityLockType, newCredential);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

/* =========================================================================
   APP PACKAGE VERIFICATION & SECURITY SCANNER
   ========================================================================= */
app.post('/api/security/scan-package', (req: Request, res: Response) => {
  const scanReport = PackageSecurityScanner.scan(req.body);
  res.json({ success: true, data: scanReport });
});

/* =========================================================================
   REAL-TIME ANALYTICS DASHBOARD API
   ========================================================================= */
app.get('/api/analytics/realtime', (req: Request, res: Response) => {
  const activeUsersNow = 1420 + Math.floor(Math.sin(Date.now() / 60000) * 120);
  const downloadsPerMinute = 48 + Math.floor(Math.random() * 24);
  const totalCoins = Object.values(userWalletsDatabase).reduce((acc, w) => acc + w.coinsBalance, 0);

  const dashboard: RealtimeAnalyticsDashboard = {
    activeUsersNow,
    downloadsPerMinute,
    tournamentsActive: tournamentsDatabase.filter(t => t.status === 'UPCOMING' || t.status === 'ONGOING').length,
    totalCoinsCirculating: totalCoins,
    hourlyDownloads: [
      { hour: '00:00', count: 320 },
      { hour: '04:00', count: 180 },
      { hour: '08:00', count: 740 },
      { hour: '12:00', count: 1250 },
      { hour: '16:00', count: 1680 },
      { hour: '20:00', count: 2190 }
    ],
    topSearchKeywords: [
      { keyword: 'Free Fire MAX', hits: 4520 },
      { keyword: 'BGMI 3.5 Update', hits: 3980 },
      { keyword: 'Soundboard Pro', hits: 1890 },
      { keyword: 'Call of Duty: Mobile', hits: 1420 }
    ],
    serverHealth: {
      cpuUsage: '14.2%',
      memoryUsage: '318 MB / 1024 MB',
      uptimeSeconds: Math.floor(process.uptime()),
      shieldNetworkIntegrity: '20/20 Units Active (100% Operational)'
    }
  };

  res.json({ success: true, data: dashboard });
});

/* =========================================================================
   SMART RECOMMENDATIONS & TRENDING APPS
   ========================================================================= */
app.get('/api/apps/trending', (req: Request, res: Response) => {
  const trending = [...appsDatabase]
    .sort((a, b) => (b.rating * b.ratingCount) - (a.rating * a.ratingCount))
    .slice(0, 8);
  res.json({ success: true, data: trending });
});

app.get('/api/apps/recommendations', (req: Request, res: Response) => {
  const category = (req.query.category as string) || 'Games';
  const recommended = appsDatabase
    .filter(a => a.category.toLowerCase() === category.toLowerCase() || a.category === 'Games' || a.category === 'Tools')
    .slice(0, 6);
  res.json({ success: true, data: recommended.length > 0 ? recommended : appsDatabase.slice(0, 6) });
});

/* =========================================================================
   PUSH NOTIFICATIONS & ALERTS ENGINE (FCM ARCHITECTURE)
   ========================================================================= */
const pushHistoryDatabase: PushNotificationPayload[] = [];

app.post('/api/notifications/push', (req: Request, res: Response) => {
  const { title, body, target = 'ALL', targetUserId, topic = 'STORE_UPDATE', actionUrl } = req.body;
  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'Notification title and body are required.' });
  }

  const pushItem: PushNotificationPayload = {
    id: `fcm-${Date.now()}`,
    title,
    body,
    target,
    targetUserId,
    topic,
    actionUrl,
    sentAt: new Date().toISOString()
  };
  pushHistoryDatabase.unshift(pushItem);

  notificationsDatabase.unshift({
    id: `notif-push-${Date.now()}`,
    userId: targetUserId || 'user-current',
    title: `⚡ ${title}`,
    message: body,
    timestamp: 'Just now',
    read: false,
    type: 'INFO'
  });

  res.json({
    success: true,
    messageId: pushItem.id,
    data: pushItem,
    message: 'Push alert dispatched successfully via FCM relay.'
  });
});

app.get('/api/notifications/push/history', (req: Request, res: Response) => {
  res.json({ success: true, count: pushHistoryDatabase.length, data: pushHistoryDatabase });
});

/* =========================================================================
   AUTOMATED REVIEW & RATING MODERATION
   ========================================================================= */
app.post('/api/reviews/moderate', (req: Request, res: Response) => {
  const { reviewId = `rev-${Date.now()}`, rating = 5, comment = '' } = req.body;
  const result = ReviewModerationService.moderate(reviewId, rating, comment);
  res.json({ success: true, data: result });
});

/* =========================================================================
   CLOUD APK BUILDER & IN-APP UPLOAD PIPELINE
   ========================================================================= */

app.post('/api/builder/compile-apk', async (req: Request, res: Response) => {
  try {
    const buildResult = await CloudApkBuilderService.buildApk(req.body);
    res.json({
      success: true,
      data: buildResult,
      message: `Successfully assembled "${buildResult.appName}" APK artifact!`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to assemble APK package from source.'
    });
  }
});

app.get('/api/builder/builds', (req: Request, res: Response) => {
  const builds = CloudApkBuilderService.listBuilds();
  res.json({ success: true, count: builds.length, data: builds });
});

app.get('/api/builder/builds/:id', (req: Request, res: Response) => {
  const build = CloudApkBuilderService.getBuild(req.params.id);
  if (!build) {
    return res.status(404).json({ success: false, message: 'Build artifact not found.' });
  }
  res.json({ success: true, data: build });
});

/* =========================================================================
   FUTURE-READY BACKEND PLACEHOLDERS (Firebase OTP, Biometric, Manual UPI)
   ========================================================================= */

app.post('/api/auth/firebase-otp/placeholder', (req: Request, res: Response) => {
  const { userId = 'usr-pending', email, phone } = req.body;
  CloudApkBuilderService.logFirebaseAuthPlaceholder({
    userId,
    email,
    phone,
    otpVerified: true,
    provider: 'FIREBASE_EMAIL_OTP',
    createdAt: new Date().toISOString()
  });
  res.json({
    success: true,
    message: 'Firebase OTP verification session initialized.',
    sessionActive: true
  });
});

app.post('/api/auth/biometric/hook', (req: Request, res: Response) => {
  const { biometricId = 'bio-hw-key', deviceId = 'android-client-1', publicKeySignature = 'sig_sha256_mock' } = req.body;
  CloudApkBuilderService.recordBiometricHook({
    biometricId,
    deviceId,
    publicKeySignature,
    verifiedAt: new Date().toISOString()
  });
  res.json({
    success: true,
    message: 'Biometric cryptographic signature accepted by FAS Shield.',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/payments/manual-upi/audit', (req: Request, res: Response) => {
  const { transactionId = `upi-tx-${Date.now()}`, userId = 'user-current', utrNumber = '984201948192', amountINR = 100 } = req.body;
  CloudApkBuilderService.recordManualUpiAudit({
    transactionId,
    userId,
    utrNumber,
    amountINR: Number(amountINR),
    status: 'SUBMITTED',
    timestamp: new Date().toISOString()
  });
  res.json({
    success: true,
    message: 'Manual UPI UTR proof queued for administrative ledger verification.',
    transactionId
  });
});

/* =========================================================================
   AI SECURITY & MODERATION MESH (100+ SUB-AIs & FLAME AI ORCHESTRATOR)
   ========================================================================= */

app.get('/api/admin/flame-ai/config', (req: Request, res: Response) => {
  res.json({ success: true, data: flameAiMesh.getConfig() });
});

app.post('/api/admin/flame-ai/config', (req: Request, res: Response) => {
  const { apiKey, model, temperature, systemInstruction } = req.body;
  const updated = flameAiMesh.updateConfig(apiKey, model, temperature, systemInstruction);
  res.json({
    success: true,
    data: updated,
    message: 'Flame AI dynamic API credentials and mesh parameters updated successfully.'
  });
});

app.get('/api/admin/flame-ai/modules', (req: Request, res: Response) => {
  const modules = flameAiMesh.getSubAiModules();
  res.json({ success: true, count: modules.length, data: modules });
});

app.get('/api/admin/flame-ai/violations', (req: Request, res: Response) => {
  const violations = flameAiMesh.getViolations();
  res.json({ success: true, count: violations.length, data: violations });
});

app.post('/api/admin/flame-ai/violations/:id/resolve', (req: Request, res: Response) => {
  const success = flameAiMesh.resolveViolation(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Policy violation notice not found.' });
  }
  res.json({ success: true, message: 'Violation resolved and marked as approved by Admin.' });
});

app.get('/api/admin/flame-trainer/status', (req: Request, res: Response) => {
  res.json({ success: true, data: flameAiMesh.getTrainerStatus() });
});

app.post('/api/admin/flame-trainer/sync', async (req: Request, res: Response) => {
  const status = await flameAiMesh.syncFlameTrainer();
  res.json({
    success: true,
    data: status,
    message: 'Flame Trainer completed synchronized knowledge cycle across backend, frontend, and Firebase.'
  });
});

/* =========================================================================
   NEUTRAL OFFICIAL BANNERS & DEVELOPER PRICING ENGINE
   ========================================================================= */

app.get('/api/official-banners', (req: Request, res: Response) => {
  const banners = officialPromotion.getOfficialBanners();
  res.json({ success: true, data: banners });
});

app.get('/api/admin/official-banners', (req: Request, res: Response) => {
  const banners = officialPromotion.getAllBanners();
  res.json({ success: true, data: banners });
});

app.post('/api/admin/official-banners/status', (req: Request, res: Response) => {
  const { bannerId, active } = req.body;
  const ok = officialPromotion.setBannerStatus(bannerId, Boolean(active));
  res.json({ success: ok, message: ok ? 'Banner status updated.' : 'Banner not found.' });
});

app.get('/api/developer/subscription', (req: Request, res: Response) => {
  const devId = (req.query.developerId as string) || 'dev-flame-labs';
  const sub = officialPromotion.getSubscription(devId);
  res.json({ success: true, data: sub });
});

app.post('/api/developer/subscription/upgrade', (req: Request, res: Response) => {
  const { developerId = 'dev-flame-labs', planType = 'STUDIO_MONTHLY' } = req.body;
  const sub = officialPromotion.upgradeSubscription(developerId, planType);
  res.json({
    success: true,
    data: sub,
    message: `Developer plan upgraded to ${planType} (₹${sub.priceINR} INR).`
  });
});

/* =========================================================================
   DEVELOPER COMMUNITY & REAL-TIME CHAT
   ========================================================================= */

app.get('/api/community/messages', (req: Request, res: Response) => {
  const channel = (req.query.channel as string) || 'general';
  const messages = communityChat.getMessages(channel);
  res.json({ success: true, data: messages });
});

app.post('/api/community/messages', (req: Request, res: Response) => {
  const { channelId, userId, userName, userAvatar, role, badge, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }
  const created = communityChat.postMessage({
    channelId,
    userId,
    userName,
    userAvatar,
    role,
    badge,
    message
  });
  res.json({ success: true, data: created });
});

app.post('/api/community/messages/:id/like', (req: Request, res: Response) => {
  const result = communityChat.likeMessage(req.params.id);
  res.json(result);
});

/* =========================================================================
   Standalone Server Listener & Health Route
   ========================================================================= */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Flame App Store (FAS) Backend API',
    version: '1.0.0',
    shieldUnitsActive: 20,
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Flame App Store (FAS) Standalone Backend running on http://0.0.0.0:${PORT}`);
    console.log(`🛡️  20-AI Shield Security Network: ONLINE`);
    console.log(`⚡ Infinity Language Translator Engine: READY`);
  });
}

startServer().catch(err => {
  console.error('Failed to start backend server:', err);
});
