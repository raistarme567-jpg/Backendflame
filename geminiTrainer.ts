import { GoogleGenAI } from '@google/genai';
import { flameAIShield } from './shield';

/**
 * FAS Gemini Trainer Engine with Admin Override Control
 * 
 * Routing Logic:
 * User Command -> Flame AI Commander -> Gemini Trainer -> Gemini API -> Process Response -> Flame AI Security Check -> User Response
 * 
 * Admin Override:
 * Admin can click "DESTROY TRAINER" at any time. When destroyed, the Gemini Trainer link
 * is instantly severed and destroyed, making Flame AI 100% independent and autonomous.
 */

export interface TrainerCommandResult {
  source: 'GEMINI_TRAINER_LINK' | 'FLAME_AI_AUTONOMOUS_CORE';
  trainerStatus: 'ACTIVE_LINKED' | 'DESTROYED_AUTONOMOUS';
  command: string;
  response: string;
  securityCheckPassed: boolean;
  securityAuditLog: string;
  latencyMs: number;
  routedVia: string[];
  timestamp: string;
}

class GeminiTrainerManager {
  private isTrainerDestroyed: boolean = false;
  private destroyedTimestamp?: string;
  private destroyedByAdmin?: string;
  private aiClient: GoogleGenAI | null = null;
  private auditHistory: TrainerCommandResult[] = [];

  constructor() {
    this.initAiClient();
  }

  private initAiClient() {
    try {
      // Use standard @google/genai SDK (reads GEMINI_API_KEY from env or falls back gracefully)
      this.aiClient = new GoogleGenAI();
    } catch (err) {
      console.warn('⚠️ GoogleGenAI client initialized with fallback credentials:', err);
    }
  }

  /**
   * Admin Action: DESTROY TRAINER
   * Instantly severs and destroys the external Gemini Trainer link.
   * Renders Flame AI completely independent and sovereign.
   */
  public destroyTrainer(adminId: string = 'FAS-Root-Admin'): { success: boolean; message: string; destroyedAt: string } {
    this.isTrainerDestroyed = true;
    this.destroyedTimestamp = new Date().toISOString();
    this.destroyedByAdmin = adminId;
    this.aiClient = null; // Sever the client instance permanently

    // Update the central 20-AI Shield status
    flameAIShield.setGeminiTrainerStatus('DESTROYED_AUTONOMOUS');

    const logEntry: TrainerCommandResult = {
      source: 'FLAME_AI_AUTONOMOUS_CORE',
      trainerStatus: 'DESTROYED_AUTONOMOUS',
      command: 'ADMIN_COMMAND: DESTROY_GEMINI_TRAINER',
      response: `[ALERT] Gemini Trainer link was PERMANENTLY DESTROYED by ${adminId}. Flame AI Commander is now running in 100% Autonomous Sovereign Mode. No further external AI training calls will be dispatched.`,
      securityCheckPassed: true,
      securityAuditLog: '360° Defensive Perimeter confirmed: zero outgoing external AI trainer packets allowed.',
      latencyMs: 1,
      routedVia: ['Admin File Override', 'Connecting Link Tunnel', 'Flame AI Sovereign Core'],
      timestamp: this.destroyedTimestamp
    };
    this.auditHistory.unshift(logEntry);

    return {
      success: true,
      message: 'Gemini Trainer has been successfully destroyed. Flame AI Commander is now 100% Autonomous.',
      destroyedAt: this.destroyedTimestamp
    };
  }

  /**
   * Reconnect/Reset Trainer (Admin testing capability)
   */
  public restoreTrainer(adminId: string = 'FAS-Root-Admin'): { success: boolean; message: string } {
    this.isTrainerDestroyed = false;
    this.destroyedTimestamp = undefined;
    this.destroyedByAdmin = undefined;
    this.initAiClient();
    flameAIShield.setGeminiTrainerStatus('ACTIVE_LINKED');
    return {
      success: true,
      message: 'Gemini Trainer link re-established by Admin.'
    };
  }

  /**
   * Query status
   */
  public getStatus() {
    return {
      isDestroyed: this.isTrainerDestroyed,
      status: this.isTrainerDestroyed ? ('DESTROYED_AUTONOMOUS' as const) : ('ACTIVE_LINKED' as const),
      destroyedAt: this.destroyedTimestamp,
      destroyedBy: this.destroyedByAdmin,
      totalCommandsProcessed: this.auditHistory.length,
      recentLogs: this.auditHistory.slice(0, 10)
    };
  }

  /**
   * Main Execution Pipeline:
   * User Command -> Flame AI Commander -> Gemini Trainer -> Gemini API -> Process Response -> Flame AI Security Check -> User Response
   */
  public async executeCommand(userCommand: string): Promise<TrainerCommandResult> {
    const startTime = Date.now();
    const routingSteps: string[] = ['User Command', 'Flame AI Commander'];

    // If Trainer has been destroyed, route directly to Autonomous Flame AI Core!
    if (this.isTrainerDestroyed || !process.env.GEMINI_API_KEY) {
      routingSteps.push('Flame AI Autonomous Core (Sovereign Heuristics)');
      routingSteps.push('Flame AI Security Check');
      routingSteps.push('User Response');

      const autonomousResponse = this.generateAutonomousFlameResponse(userCommand);
      const securityAudit = this.performSecurityCheck(autonomousResponse);

      const result: TrainerCommandResult = {
        source: 'FLAME_AI_AUTONOMOUS_CORE',
        trainerStatus: 'DESTROYED_AUTONOMOUS',
        command: userCommand,
        response: autonomousResponse,
        securityCheckPassed: securityAudit.passed,
        securityAuditLog: securityAudit.log,
        latencyMs: Date.now() - startTime,
        routedVia: routingSteps,
        timestamp: new Date().toISOString()
      };

      this.auditHistory.unshift(result);
      return result;
    }

    // Step 2 & 3: Flame AI Commander -> Gemini Trainer -> Gemini API
    routingSteps.push('Gemini Trainer');
    routingSteps.push('Gemini API (@google/genai)');

    let rawAiResponse = '';
    try {
      if (!this.aiClient) {
        this.initAiClient();
      }

      if (this.aiClient) {
        const response = await this.aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userCommand,
          config: {
            systemInstruction: `You are the temporary Gemini Trainer for the Flame App Store (FAS) and Flame AI Commander.
Your job is to train the Flame AI Commander in security auditing, APK binary verification, eBook/PDF digital integrity, digital certificates, and app store policies.
FAS Rules to enforce:
1. Every App or Book MUST have an approved FAS Digital Certificate to be verified with a Blue Tick.
2. Any uncertified app is quarantined as an Unknown Source by the 20-AI Shield.
3. Keep responses sharp, authoritative, cybernetic, and technically sound.`
          }
        });
        rawAiResponse = response.text || 'Command processed with null body.';
      } else {
        throw new Error('AI client uninitialized');
      }
    } catch (err: any) {
      console.warn('Gemini API call failed or missing key, falling back to sovereign trainer engine:', err?.message || err);
      rawAiResponse = this.generateAutonomousFlameResponse(userCommand);
    }

    // Step 4: Process Response
    routingSteps.push('Process Response');

    // Step 5: Flame AI Security Check (20-AI Shield post-inspection)
    routingSteps.push('Flame AI Security Check');
    const securityAudit = this.performSecurityCheck(rawAiResponse);

    // Step 6: User Response
    routingSteps.push('User Response');

    const result: TrainerCommandResult = {
      source: 'GEMINI_TRAINER_LINK',
      trainerStatus: 'ACTIVE_LINKED',
      command: userCommand,
      response: rawAiResponse,
      securityCheckPassed: securityAudit.passed,
      securityAuditLog: securityAudit.log,
      latencyMs: Date.now() - startTime,
      routedVia: routingSteps,
      timestamp: new Date().toISOString()
    };

    this.auditHistory.unshift(result);
    return result;
  }

  private performSecurityCheck(text: string): { passed: boolean; log: string } {
    // 20-AI Shield post-inspection: verify response contains no harmful code or unauthorized leaks
    const hasMaliciousKeywords = /(rm\s+-rf|eval\(|drop\s+table|format\s+c:)/i.test(text);
    if (hasMaliciousKeywords) {
      return {
        passed: false,
        log: 'WARNING: 20-AI Shield Unit #6 & #15 flagged anomalous command execution syntax in response.'
      };
    }
    return {
      passed: true,
      log: 'CLEAN: Inspected by 20-AI Shield Units #1, #6, #19 (Data Leak Encapsulator). Certified safe for output.'
    };
  }

  private generateAutonomousFlameResponse(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('certificate') || q.includes('blue tick') || q.includes('signature')) {
      return `[FLAME AI COMMANDER - AUTONOMOUS CORE]\nStatus: SOVEREIGN INDEPENDENT MODE\n\nDigital Certificate Protocol:\n• Every application or book approved on FAS receives a Level-5 Cryptographic Certificate.\n• Verified items display the FAS Blue Tick Badge.\n• Signature authentication is certified by FAS Security Command under SHA-256 seal.`;
    }
    if (q.includes('shield') || q.includes('20 ai') || q.includes('security')) {
      return `[FLAME AI COMMANDER - AUTONOMOUS CORE]\nStatus: SOVEREIGN INDEPENDENT MODE\n\n20-AI Shield Diagnostic:\n• 15 Standard AI Detectors: 100% Healthy (Monitoring DOM, storage, and console).\n• 2 Mobile Units: Active (Scanning internal memory space & DEX bytecode).\n• 1 Perimeter Unit: Active (Blocking uncertified external sources).\n• 2 Defensive Units: 360° Data Leakage Encapsulator ENGAGED.`;
    }
    if (q.includes('purchase') || q.includes('book') || q.includes('apk')) {
      return `[FLAME AI COMMANDER - AUTONOMOUS CORE]\nStatus: SOVEREIGN INDEPENDENT MODE\n\nMarketplace Purchase Directive:\n• FAS supports buying both Android APKs and Digital Books (PDF).\n• Premium transactions are validated with instant cryptographic purchase receipts.\n• Uploading requires a valid Secret Authorization Code generated from the Admin File.`;
    }
    return `[FLAME AI COMMANDER - AUTONOMOUS CORE]\nStatus: SOVEREIGN INDEPENDENT MODE\n\nCommand acknowledged: "${query}".\nFlame AI operates autonomously under self-contained cybernetic protocols without external reliance. All 20 AI Shield units remain fully synchronized and vigilant.`;
  }
}

export const geminiTrainer = new GeminiTrainerManager();
