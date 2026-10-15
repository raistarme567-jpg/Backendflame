import crypto from 'crypto';
import { AdminSecretAuthCode } from '../../src/types/index';

/**
 * FAS Backend Admin Security Center
 * Safely encapsulated on the server-side architecture.
 * Manages secret authorization code generation, developer verification grants,
 * and high-privilege administrative authorization overrides.
 */

class AdminAuthManager {
  private secretCodes: Map<string, AdminSecretAuthCode> = new Map();
  private adminSessionKey: string;

  constructor() {
    this.adminSessionKey = crypto.randomBytes(32).toString('hex');
    // Seed initial official developer authorization codes for immediate dev console use
    this.seedInitialCodes();
  }

  private seedInitialCodes() {
    const defaultCodes = [
      'FAS-SEC-9842-8319',
      'FAS-SEC-7701-4190',
      'FAS-SEC-3329-8812',
      'FAS-SEC-5541-2094'
    ];

    defaultCodes.forEach(code => {
      this.secretCodes.set(code, {
        code,
        createdAt: new Date().toISOString(),
        createdBy: 'FAS Security Command (Root Admin)',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        used: false
      });
    });
  }

  /**
   * Generates a new cryptographic secret authorization code from the Admin File.
   * Required before any developer can upload an App or Book.
   */
  public generateCode(adminId: string = 'FAS-Root-Admin'): AdminSecretAuthCode {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const code = `FAS-SEC-${part1}-${part2}`;

    const record: AdminSecretAuthCode = {
      code,
      createdAt: new Date().toISOString(),
      createdBy: adminId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Exactly 30 days (1 Month) validity
      used: false
    };

    this.secretCodes.set(code, record);
    return record;
  }

  /**
   * Validates if a secret authorization code is authentic and unused.
   */
  public validateAndConsumeCode(code: string, developerId: string, itemId: string): { valid: boolean; message: string; record?: AdminSecretAuthCode } {
    if (!code || typeof code !== 'string') {
      return { valid: false, message: 'Authorization code is missing.' };
    }

    const cleanCode = code.trim().toUpperCase();
    const record = this.secretCodes.get(cleanCode);

    if (!record) {
      return { valid: false, message: 'Invalid Secret Authorization Code. Contact FAS Admin File to generate an authorized code.' };
    }

    if (record.used) {
      return { valid: false, message: `Authorization code ${cleanCode} has already been consumed by developer ${record.usedBy || 'another session'}.` };
    }

    const isExpired = new Date(record.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return { valid: false, message: 'Secret Authorization Code has expired. Request a new code from FAS Admin.' };
    }

    // Mark as consumed
    record.used = true;
    record.usedBy = developerId;
    record.usedForItemId = itemId;
    this.secretCodes.set(cleanCode, record);

    return { valid: true, message: 'Secret Authorization Code verified and bound.', record };
  }

  /**
   * List all generated codes (Admin Only)
   */
  public listCodes(): AdminSecretAuthCode[] {
    return Array.from(this.secretCodes.values()).reverse();
  }

  /**
   * Quick peek check without consuming
   */
  public checkCodeValidity(code: string): boolean {
    const cleanCode = (code || '').trim().toUpperCase();
    const record = this.secretCodes.get(cleanCode);
    return !!(record && !record.used && new Date(record.expiresAt).getTime() > Date.now());
  }
}

export const adminAuth = new AdminAuthManager();
