import { PackageSecurityScanResult } from '../src/types/index.ts';

const HIGH_RISK_PERMISSIONS = [
  { name: 'android.permission.SEND_SMS', dangerous: true, description: 'Ability to transmit premium SMS messages silently' },
  { name: 'android.permission.READ_SMS', dangerous: true, description: 'Interception of OTP authentication codes' },
  { name: 'android.permission.SYSTEM_ALERT_WINDOW', dangerous: true, description: 'Displaying floating overlays to hijack user taps (Clickjacking)' },
  { name: 'android.permission.BIND_ACCESSIBILITY_SERVICE', dangerous: true, description: 'Total screen interaction surveillance and keylogging exploit' },
  { name: 'android.permission.REQUEST_INSTALL_PACKAGES', dangerous: true, description: 'Silent installation of untrusted third-party APK payloads' },
  { name: 'android.permission.PROCESS_OUTGOING_CALLS', dangerous: true, description: 'Call interception and redirection' }
];

const STANDARD_PERMISSIONS = [
  { name: 'android.permission.INTERNET', dangerous: false, description: 'Network connectivity for app resources' },
  { name: 'android.permission.ACCESS_NETWORK_STATE', dangerous: false, description: 'Monitoring network status' },
  { name: 'android.permission.VIBRATE', dangerous: false, description: 'Haptic feedback' },
  { name: 'android.permission.WAKE_LOCK', dangerous: false, description: 'Prevents screen sleep during active gaming' }
];

export class PackageSecurityScanner {
  public static scan(input: {
    packageName?: string;
    versionName?: string;
    permissions?: string[];
    hasCertificate?: boolean;
    appCategory?: string;
  }): PackageSecurityScanResult {
    const pkg = input.packageName || 'com.flame.app';
    const ver = input.versionName || '1.0.0';
    const rawPerms = input.permissions || ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'];
    const hasCert = input.hasCertificate ?? true;

    const detectedPerms: { name: string; dangerous: boolean; description: string }[] = [];
    const policyChecks: { name: string; passed: boolean; message: string }[] = [];
    const malwareSigs: string[] = [];
    let safetyScore = 100;

    // 1. Permission Analysis
    rawPerms.forEach(p => {
      const highRisk = HIGH_RISK_PERMISSIONS.find(h => h.name === p || p.includes(h.name.split('.').pop() || ''));
      if (highRisk) {
        detectedPerms.push(highRisk);
        safetyScore -= 20;
      } else {
        const std = STANDARD_PERMISSIONS.find(s => s.name === p);
        detectedPerms.push(std || { name: p, dangerous: false, description: 'Standard platform permission' });
      }
    });

    // 2. Policy Checks
    if (!hasCert) {
      safetyScore -= 30;
      policyChecks.push({
        name: 'FAS Digital Certificate Verification',
        passed: false,
        message: 'Application lacks valid cryptographic FAS digital certificate authority.'
      });
      malwareSigs.push('POLICY_VIOLATION_UNCERTIFIED_BINARY');
    } else {
      policyChecks.push({
        name: 'FAS Digital Certificate Verification',
        passed: true,
        message: 'Signed with authorized FAS Security Command digital certificate.'
      });
    }

    // 3. Package Name Standards
    if (!pkg.includes('.') || pkg.length < 5) {
      safetyScore -= 15;
      policyChecks.push({
        name: 'Package Namespace Validation',
        passed: false,
        message: 'Invalid Android reverse domain name format (e.g. com.developer.app).'
      });
    } else {
      policyChecks.push({
        name: 'Package Namespace Validation',
        passed: true,
        message: 'Valid namespace hierarchy complying with FAS and Play standards.'
      });
    }

    // 4. Determine Risk Level & Verdict
    safetyScore = Math.max(0, Math.min(100, safetyScore));
    let riskLevel: 'CLEAN' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_RISK' = 'CLEAN';
    let verdict: 'APPROVED_FOR_STORE' | 'REQUIRES_MANUAL_REVIEW' | 'REJECTED' = 'APPROVED_FOR_STORE';

    if (safetyScore >= 85) {
      riskLevel = 'CLEAN';
      verdict = 'APPROVED_FOR_STORE';
    } else if (safetyScore >= 65) {
      riskLevel = 'LOW_RISK';
      verdict = 'APPROVED_FOR_STORE';
    } else if (safetyScore >= 45) {
      riskLevel = 'SUSPICIOUS';
      verdict = 'REQUIRES_MANUAL_REVIEW';
    } else {
      riskLevel = 'HIGH_RISK';
      verdict = 'REJECTED';
    }

    return {
      packageName: pkg,
      versionName: ver,
      safetyScore,
      riskLevel,
      scannedAt: new Date().toISOString(),
      permissionsDetected: detectedPerms,
      policyChecks,
      malwareSignaturesFound: malwareSigs,
      certificateStatus: hasCert ? 'VALID_CERTIFIED' : 'UNTRUSTED',
      verdict
    };
  }
}
