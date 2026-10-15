export type UserRole = 'USER' | 'DEVELOPER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  joinedDate: string;
  developerProfile?: DeveloperProfile;
  favorites: string[]; // app IDs
  downloadHistory: DownloadItem[];
}

export interface DeveloperProfile {
  id: string;
  developerName: string;
  website?: string;
  supportEmail: string;
  verified: boolean;
  totalApps: number;
  totalDownloads: number;
}

export type AppStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TESTING_PHASE'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'DECLINED'
  | 'REJECTED'
  | 'SUSPENDED';

export type AppCategory =
  | 'Games'
  | 'Tools'
  | 'Education'
  | 'Utilities'
  | 'Productivity'
  | 'Social'
  | 'Entertainment'
  | 'Photography'
  | 'Business'
  | 'Health'
  | 'Finance'
  | 'Books';

export interface DataSafetyDeclaration {
  personalInfo: boolean;
  location: boolean;
  financials: boolean;
  media: boolean;
  appUsage: boolean;
  isEncryptedInTransit: boolean;
  canRequestDeletion: boolean;
  details?: string;
}

export interface TesterFeedback {
  id: string;
  testerId: string;
  testerName: string;
  testerEmail?: string;
  rating: number; // 1 to 5
  deviceModel: string;
  comments: string;
  timestamp: string;
}

export interface AppPermission {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

export interface AppVersion {
  id: string;
  versionName: string;
  versionCode: number;
  releaseNotes: string;
  apkFileName: string;
  apkFileSize: string; // e.g. "34.2 MB"
  apkFileSizeBytes: number;
  sha256: string;
  minAndroid: string; // e.g. "Android 10 (API 29)"
  targetAndroid: string; // e.g. "Android 15 (API 35)"
  uploadDate: string;
}

export interface AppReview {
  id: string;
  appId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  date: string;
  helpfulCount: number;
  device?: string;
}

export interface ContentRatingAnswers {
  violence: boolean;
  strongLanguage: boolean;
  gambling: boolean;
  sexualContent: boolean;
  userGeneratedContent: boolean;
  inAppPurchases: boolean;
  ratingTier: '3+' | '7+' | '12+' | '16+' | '18+';
}

export interface AppSubmissionLog {
  id: string;
  timestamp: string;
  reviewer: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'PUBLISHED' | 'DECLINED' | 'SUSPENDED';
  previousStatus: AppStatus;
  newStatus: AppStatus;
  reason?: string;
}

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  developerId: string;
  developerName: string;
  category: AppCategory;
  shortDescription: string;
  fullDescription: string;
  iconUrl: string;
  headerBannerUrl?: string;
  screenshots: string[];
  rating: number;
  ratingCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  downloadCount: number;
  featured: boolean;
  status: AppStatus;
  statusReason?: string;
  tags: string[];
  currentVersion: AppVersion;
  versionHistory: AppVersion[];
  permissions: string[];
  contentRating: ContentRatingAnswers;
  dataSafety: DataSafetyDeclaration;
  
  // 15-Tester Closed Testing System
  testLink?: string;
  testerCount: number;
  requiredTesters: number; // Default 15
  testerFeedback: TesterFeedback[];

  createdAt: string;
  updatedAt: string;
  submissionLogs: AppSubmissionLog[];

  // Purchase & Media Upload System
  mediaType?: 'APP' | 'BOOK';
  price?: number; // 0 = Free, >0 = Premium USD
  isPremium?: boolean;
  bookDetails?: BookDetails;

  // Digital Certificate & Verification Seal
  hasCertificate?: boolean;
  certificate?: DigitalCertificate;

  // Cloud APK Builder & Instant Preview
  isCloudBuilt?: boolean;
  hasInstantPreview?: boolean;
  instantPreviewUrl?: string;
  hasAutoIap?: boolean;

  // Flame Official Promotion & Policy Mesh
  isFlameOfficial?: boolean;
  policyViolationNotice?: PolicyViolationNotice;
}

export type MediaType = 'APP' | 'BOOK';

export interface BookDetails {
  pdfFileName: string;
  pdfFileSize: string; // e.g. "14.8 MB"
  pdfFileSizeBytes: number;
  pageCount: number;
  author: string;
  publisher?: string;
  isbn?: string;
  edition?: string;
  samplePreviewPdfUrl?: string;
  tableOfContents?: string[];
  readingTimeMinutes?: number;
}

export interface DigitalCertificate {
  id: string;
  serialNumber: string;
  developerName: string;
  developerAge: number;
  profileDetails: {
    organization: string;
    country: string;
    supportEmail: string;
    verifiedIdentity: boolean;
    identityDocumentType: string;
    trustScore: number; // 0-100
    securityTier: string;
  };
  issueDate: string;
  expiryDate: string;
  verificationStatus: 'VERIFIED' | 'REVOKED' | 'PENDING';
  fasSecurityCommandStatus: 'PASSED_20_AI_AUDIT' | 'FLAGGED_UNTRUSTED' | 'QUARANTINED';
  sha256Fingerprint: string;
  signatureLevel: string; // "FAS Official Sovereign Level-5"
  signatureArtworkUrl?: string;
  signatureToken: string;
  termsAgreedAt: string;
  commandSealHash: string;
}

export interface PurchaseRecord {
  id: string;
  itemId: string;
  itemTitle: string;
  mediaType: 'APP' | 'BOOK';
  price: number;
  currency: string;
  purchaseDate: string;
  transactionHash: string;
  downloadUrl: string;
  certificateSerial?: string;
}

// 20-AI Security Shield Models
export type AIShieldCategory = 
  | 'STANDARD'          // 15 units
  | 'MOBILE'            // 2 units
  | 'PERIMETER'         // 1 unit
  | 'DEFENSIVE_SHIELD'; // 2 units

export interface AIShieldUnit {
  id: string;
  unitNumber: number;
  name: string;
  category: AIShieldCategory;
  description: string;
  status: 'ONLINE' | 'ACTIVE_SCAN' | 'INTERCEPTED' | 'STANDBY';
  inspectionsCount: number;
  threatsNeutralized: number;
  lastAnomaly?: string;
  healthPercentage: number;
}

export interface FlameAICommanderStatus {
  activeUnitsCount: number; // 20
  totalInspections: number;
  activeThreatsBlocked: number;
  shieldIntegrityPercentage: number;
  is360ShieldEngaged: boolean;
  connectingLinkStatus: 'ENCRYPTED_ONLINE' | 'STANDBY' | 'DEGRADED';
  geminiTrainerStatus: 'ACTIVE_LINKED' | 'DESTROYED_AUTONOMOUS';
  geminiTrainerDestroyedAt?: string;
  lastCommandTimestamp: string;
}

export interface AdminSecretAuthCode {
  code: string; // e.g. "FAS-SEC-9842-8319"
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  used: boolean;
  usedBy?: string;
  usedForItemId?: string;
}

export interface DownloadItem {
  id: string;
  appId: string;
  appName: string;
  appIcon: string;
  versionName: string;
  fileSize: string;
  timestamp: string;
  status: 'COMPLETED' | 'DOWNLOADING' | 'FAILED';
  progress?: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  appId?: string;
}

// Payment System Configuration (Managed by Admin)
export interface PaymentConfiguration {
  enabled: boolean;
  qrCodeImageUrl: string; // Base64 or image URL of payment QR Code
  upiId: string;          // UPI ID or Merchant ID (e.g., flamestore@upi)
  merchantName: string;   // Merchant / Admin display name
  supportNote?: string;
  currency: string;       // INR or USD
  updatedAt: string;
}

// Platform Detailed Analytics for Admin
export interface PlatformAnalytics {
  totalUsers: number;
  onlineUsers: number;
  totalApps: number;
  totalBooks: number;
  totalDownloads: number;
  activeDevelopers: number;
  pendingApprovals: number;
  totalRevenue: number;
  dailyTraffic: number;
  serverUptime: string;
}

// Flame AI Infinity Language Translation Engine
export interface InfinityAiTranslationResponse {
  sourceText: string;
  sourceLang: string;
  infinityScriptText: string;
  wCodes: string[];
  semanticBreakdown: {
    wCode: string;
    symbol: string;
    hindiMeaning: string;
    englishMeaning: string;
    concept: string;
  }[];
  deepExplanation: string;
  routedVia: string[];
  trainerModelUsed: string;
  timestamp: string;
}

// Developer Earnings Wallet & Payout Withdrawal System
export type PayoutMethod = 'UPI' | 'PAYPAL' | 'AADHAAR_PAY' | 'BANK_TRANSFER';
export type PayoutStatus = 'PENDING_APPROVAL' | 'APPROVED_PROCESSED' | 'REJECTED';

export interface PayoutAccountDetails {
  upiId?: string;
  paypalEmail?: string;
  aadhaarNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
}

export interface PayoutRequest {
  id: string;
  developerId: string;
  developerName: string;
  amountINR: number;
  amountUSD: number;
  currency: 'INR' | 'USD';
  paymentMethod: PayoutMethod;
  accountDetails: PayoutAccountDetails;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string;
  etaMessage: string;
  adminNotes?: string;
}

export interface DeveloperWallet {
  developerId: string;
  developerName: string;
  balanceINR: number;
  balanceUSD: number;
  totalEarnedINR: number;
  totalWithdrawnINR: number;
  pendingWithdrawalINR: number;
  freeAppsRevenueINR: number;     // ₹100 per unique user download of free apps/books
  paidAppsRevenueINR: number;     // Price * unique buyers for premium apps/books
  uniqueFreeDownloadsCount: number;
  uniquePaidBuyersCount: number;
  payoutHistory: PayoutRequest[];
  lastCalculatedAt: string;
}

// ==========================================
// TOURNAMENT & E-SPORTS REWARDS ECOSYSTEM
// ==========================================
export type SupportedGameCategory = 
  | 'Free Fire' 
  | 'BGMI' 
  | 'Call of Duty: Mobile' 
  | 'Valorant Mobile' 
  | 'Clash Royale' 
  | 'PUBG: New State' 
  | 'Apex Legends' 
  | 'Other Custom Game';

export type TournamentStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  inGameUid: string;
  ign: string; // In Game Name
  registeredAt: string;
  score?: number;
  rank?: number;
  prizeWonCoins?: number;
  status: 'REGISTERED' | 'CONFIRMED' | 'WINNER' | 'ELIMINATED';
}

export interface Tournament {
  id: string;
  title: string;
  gameCategory: SupportedGameCategory;
  customGameName?: string;
  bannerUrl: string;
  entryFeeCoins: number;
  hostingFeeCoins: number; // Coins organizer spent to create/host (e.g. 50 coins)
  prizePoolCoins: number;
  hostUserId: string;
  hostUserName: string;
  rules: string;
  matchSchedule: string; // e.g. "Today 8:00 PM IST"
  maxSlots: number;
  registeredCount: number;
  status: TournamentStatus;
  participants: TournamentParticipant[];
  winningUserId?: string;
  winnerName?: string;
  winnerInGameUid?: string;
  winnerPrizeCoins?: number;
  winnerProofUrl?: string; // Match screenshot / proof of victory
  adminNotes?: string;
  createdAt: string;
  completedAt?: string;
}

// User Virtual Coin Wallet & Transaction Tracking
export interface UserCoinWallet {
  userId: string;
  coinsBalance: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalCoinsRedeemed: number;
  transactions: CoinTransaction[];
  updatedAt: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number; // positive for earn/credit, negative for spend/debit
  type: 'TOURNAMENT_WIN' | 'HOST_TOURNAMENT_FEE' | 'JOIN_ENTRY_FEE' | 'BUY_COINS_BUNDLE' | 'REDEMPTION' | 'STORE_PURCHASE' | 'DAILY_BONUS';
  title: string;
  description: string;
  timestamp: string;
  referenceId?: string;
}

// Coin Redemption & Payout Options (UPI, In-Game UID Top-ups, etc.)
export type RedemptionPayoutMethod = 
  | 'UPI' 
  | 'FREE_FIRE_UID' 
  | 'BGMI_UID' 
  | 'PAYPAL' 
  | 'BANK_TRANSFER';

export interface RedemptionRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  coins: number;
  payoutMethod: RedemptionPayoutMethod;
  payoutDetails: string; // e.g. UPI ID or bank account
  inGameUid?: string;    // In-game UID for direct top-up / gift bundles
  gameBundleName?: string; // e.g. "Free Fire 520 Diamonds" or "BGMI 360 UC"
  amountINR: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  etaMessage: string;
  adminRemarks?: string;
  createdAt: string;
  processedAt?: string;
}

// Admin Store Management & User Digital Products Store
export type StoreItemCategory = 
  | 'COINS_PACK' 
  | 'GAME_TOPUP' 
  | 'GIFT_BUNDLE' 
  | 'PREMIUM_PASS' 
  | 'DIGITAL_ASSET' 
  | 'BANNER';

export interface StoreItem {
  id: string;
  title: string;
  category: StoreItemCategory;
  priceCoins: number;
  priceINR: number;
  priceUSD: number;
  image: string;
  description: string;
  inGameItemReward?: string; // e.g. "1000 FF Diamonds" or "660 UC"
  requiresInGameUid: boolean;
  requiresEmail: boolean;
  stock: number;
  isFeatured: boolean;
  createdAt: string;
}

export interface StoreOrder {
  id: string;
  itemId: string;
  itemTitle: string;
  category: StoreItemCategory;
  userId: string;
  userEmail: string;
  inGameUid?: string;
  coinsPaid: number;
  amountPaidINR: number;
  paymentMethod: 'COINS' | 'UPI' | 'GATEWAY';
  status: 'COMPLETED' | 'PENDING_DELIVERY' | 'REFUNDED';
  createdAt: string;
}

export interface AdminUploadedFile {
  id: string;
  title: string;
  fileType: 'IMAGE_BANNER' | 'APP_FILE' | 'DIGITAL_PRODUCT';
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  activeInStore: boolean;
  targetLink?: string;
}

// ==========================================
// ADVANCED SECURITY LOCK & BIOMETRIC SYSTEM
// ==========================================
export type SecurityLockType = 'NUMBER' | 'PATTERN' | 'FINGERPRINT';

export interface SecurityLockState {
  scope: 'console' | 'admin';
  type: SecurityLockType;
  isConfigured: boolean;
  updatedAt: string;
}

// ==========================================
// PACKAGE VERIFICATION & APP SCANNER
// ==========================================
export interface PackageSecurityScanResult {
  packageName: string;
  versionName: string;
  safetyScore: number;
  riskLevel: 'CLEAN' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_RISK';
  scannedAt: string;
  permissionsDetected: { name: string; dangerous: boolean; description: string }[];
  policyChecks: { name: string; passed: boolean; message: string }[];
  malwareSignaturesFound: string[];
  certificateStatus: 'VALID_CERTIFIED' | 'SELF_SIGNED' | 'UNTRUSTED';
  verdict: 'APPROVED_FOR_STORE' | 'REQUIRES_MANUAL_REVIEW' | 'REJECTED';
}

// ==========================================
// REAL-TIME ANALYTICS DASHBOARD
// ==========================================
export interface RealtimeAnalyticsDashboard {
  activeUsersNow: number;
  downloadsPerMinute: number;
  tournamentsActive: number;
  totalCoinsCirculating: number;
  hourlyDownloads: { hour: string; count: number }[];
  topSearchKeywords: { keyword: string; hits: number }[];
  serverHealth: {
    cpuUsage: string;
    memoryUsage: string;
    uptimeSeconds: number;
    shieldNetworkIntegrity: string;
  };
}

// ==========================================
// AUTOMATED REVIEW & RATING MODERATION
// ==========================================
export interface ReviewModerationResult {
  reviewId: string;
  rating: number;
  comment: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  toxicScore: number;
  isSpam: boolean;
  status: 'APPROVED' | 'AUTO_FLAGGED' | 'REJECTED';
  moderationReason?: string;
}

// ==========================================
// PUSH NOTIFICATIONS & ALERTS (FCM)
// ==========================================
export interface PushNotificationPayload {
  id?: string;
  title: string;
  body: string;
  target: 'ALL' | 'DEVELOPERS' | 'GAMERS' | 'USER_ID';
  targetUserId?: string;
  topic?: 'TOURNAMENT_ALERT' | 'COIN_REWARD' | 'PAYOUT_STATUS' | 'STORE_UPDATE';
  actionUrl?: string;
  sentAt?: string;
}

// ==========================================
// CLOUD APK BUILDER & IN-APP UPLOAD PIPELINE
// ==========================================
export interface AdMobConfig {
  enabled: boolean;
  appId: string;
  bannerUnitId?: string;
  interstitialUnitId?: string;
  rewardedUnitId?: string;
}

export interface AdsterraConfig {
  enabled: boolean;
  publisherId: string;
  directLinkId?: string;
}

export interface FirebaseBuildConfig {
  enabled: boolean;
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export interface SourceCodeFilePayload {
  name: string;
  size: number;
  type: string;
  content?: string;
}

export interface CloudApkBuildRequest {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  iconUrl: string;
  sourceType: 'HTML_ZIP' | 'WEB_FOLDER' | 'DIRECT_FILES';
  sourceFiles?: SourceCodeFilePayload[];
  admobConfig?: AdMobConfig;
  adsterraConfig?: AdsterraConfig;
  firebaseConfig?: FirebaseBuildConfig;
  minSdkVersion?: number;
  targetSdkVersion?: number;
  developerId?: string;
}

export interface CloudApkBuildResult {
  buildId: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  apkFileName: string;
  apkFileUrl: string;
  apkFileSize: string;
  apkFileSizeBytes: number;
  sha256: string;
  status: 'SUCCESS' | 'FAILED' | 'BUILDING';
  buildLogs: { step: string; message: string; timestamp: string }[];
  securityScan: PackageSecurityScanResult;
  completedAt: string;
}

// ==========================================
// FUTURE-READY BACKEND PLACEHOLDERS
// ==========================================
export interface FirebaseAuthPlaceholder {
  userId: string;
  email?: string;
  phone?: string;
  otpVerified: boolean;
  provider: 'FIREBASE_EMAIL_OTP' | 'GOOGLE' | 'GUEST';
  createdAt: string;
}

export interface BiometricHookPayload {
  biometricId: string;
  deviceId: string;
  publicKeySignature: string;
  verifiedAt: string;
}

export interface ManualUpiAuditLog {
  transactionId: string;
  userId: string;
  utrNumber: string;
  amountINR: number;
  verifiedByAdminId?: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  timestamp: string;
}

// ==========================================
// 100+ SUB-AI SECURITY MESH & FLAME AI ORCHESTRATOR
// ==========================================
export interface SubAiModuleInfo {
  id: string;
  name: string;
  cluster: string;
  specialization: string;
  status: 'ACTIVE' | 'AUDITING' | 'STANDBY';
  scansCompleted: number;
  threatsBlocked: number;
}

export interface PolicyViolationNotice {
  violationId: string;
  appId: string;
  appName: string;
  developerId: string;
  issuesDetected: { rule: string; description: string; subAiSource: string }[];
  severity: 'WARNING' | 'CRITICAL';
  issuedAt: string;
  resolutionDeadline: string; // 7 to 14 days
  daysRemaining: number;
  status: 'GRACE_PERIOD_ACTIVE' | 'RESOLVED' | 'RESTRICTED';
  adminReviewed: boolean;
}

export interface FlameAiConfig {
  customApiKey?: string;
  hasCustomApiKey: boolean;
  activeModel: string;
  temperature: number;
  systemInstruction: string;
  subAiAgentsCount: number;
  subAgentsActive: boolean;
  lastUpdated: string;
}

export interface FlameTrainerSyncStatus {
  lastSyncAt: string;
  totalBackendRecordsIngested: number;
  totalFirebaseDocumentsIndexed: number;
  totalFrontendComponentsTrained: number;
  apkDecompileHeuristicsCount: number;
  status: 'SYNCHRONIZED' | 'SYNCING' | 'IDLE';
  aiKnowledgeVersion: string;
}

// ==========================================
// DEVELOPER SUBSCRIPTION & NEUTRAL OFFICIAL BANNER
// ==========================================
export interface DeveloperSubscription {
  developerId: string;
  planType: 'FREE_TRIAL_1MONTH' | 'BASIC_MONTHLY' | 'STUDIO_MONTHLY' | 'ANNUAL_PASS';
  priceINR: number;
  startDate: string;
  expiresAt: string;
  isActive: boolean;
  daysLeft: number;
}

export interface FlameOfficialBanner {
  id: string;
  appId: string;
  appName: string;
  developerName: string;
  bannerImageUrl: string;
  headline: string;
  tagline: string;
  displayOrder: number;
  active: boolean;
}

// ==========================================
// DEVELOPER COMMUNITY & REAL-TIME CHAT
// ==========================================
export interface CommunityChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  role: UserRole;
  badge?: string;
  message: string;
  timestamp: string;
  likesCount: number;
  likedByUser?: boolean;
}



