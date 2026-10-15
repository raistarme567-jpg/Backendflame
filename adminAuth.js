/**
 * FAS Backend Admin Security File
 * Isolated strictly within /backend-root/backend/admin/
 * Handles 1-Month (30 Days) Secret Code Generation & Verification
 */

import crypto from 'crypto';

class AdminAuthManager {
  constructor() {
    this.secretCodes = new Map();
    this.adminSessionKey = crypto.randomBytes(32).toString('hex');
    this.seedInitialCodes();
  }

  seedInitialCodes() {
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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Exactly 30 days (1 Month)
        used: false
      });
    });
  }

  /**
   * Generates a 1-Month Valid Secret Authorization Code
   */
  generateCode(adminId = 'FAS-Root-Admin') {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const code = `FAS-SEC-${part1}-${part2}`;

    const record = {
      code,
      createdAt: new Date().toISOString(),
      createdBy: adminId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 Days (1 Month) validity
      used: false
    };

    this.secretCodes.set(code, record);
    return record;
  }

  /**
   * Validates code authenticity, 30-day expiration, and single-use status
   */
  validateAndConsumeCode(code, developerId, itemId) {
    if (!code || typeof code !== 'string') {
      return { valid: false, message: 'Authorization code is missing.' };
    }

    const cleanCode = code.trim().toUpperCase();
    const record = this.secretCodes.get(cleanCode);

    if (!record) {
      return { valid: false, message: 'Invalid Secret Authorization Code. Contact FAS Admin File.' };
    }

    if (record.used) {
      return { valid: false, message: `Authorization code ${cleanCode} has already been consumed.` };
    }

    const isExpired = new Date(record.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return { valid: false, message: 'Secret Authorization Code expired after 30 days. Request re-verification from Admin.' };
    }

    record.used = true;
    record.usedBy = developerId;
    record.usedForItemId = itemId;
    this.secretCodes.set(cleanCode, record);

    return { valid: true, message: 'Secret Authorization Code verified and bound.', record };
  }

  listCodes() {
    return Array.from(this.secretCodes.values()).reverse();
  }
}

export const adminAuth = new AdminAuthManager();
