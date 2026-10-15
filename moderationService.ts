import { ReviewModerationResult } from '../src/types/index.ts';

const BANNED_PATTERNS = [
  /free\s*fire\s*hack/i,
  /bgmi\s*cheat/i,
  /free\s*diamonds\s*hack/i,
  /unlimited\s*uc\s*generator/i,
  /telegram\s*me/i,
  /t\.me\//i,
  /wa\.me\//i,
  /bit\.ly\//i,
  /fuck/i,
  /scam/i,
  /bitch/i,
  /mc\s*bc/i,
  /gandu/i,
  /chutiya/i
];

export class ReviewModerationService {
  public static moderate(reviewId: string, rating: number, comment: string): ReviewModerationResult {
    const text = comment || '';
    let toxicScore = 0;
    let isSpam = false;
    let moderationReason = 'Automated AI policy check passed.';

    // 1. Repetitive character spam (e.g. "aaaaa", "11111111111")
    if (/(.)\1{5,}/.test(text)) {
      isSpam = true;
      toxicScore += 30;
      moderationReason = 'Spam detected: excessive character repetitions.';
    }

    // 2. URL or external channel promotion spam
    if (/https?:\/\/|\.com|\.xyz|t\.me/i.test(text)) {
      isSpam = true;
      toxicScore += 45;
      moderationReason = 'External link or promotional advertisement detected.';
    }

    // 3. Prohibited keyword matching
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(text)) {
        toxicScore += 50;
        moderationReason = 'Abusive, fraudulent, or policy-violating text detected.';
        break;
      }
    }

    // 4. Sentiment estimation
    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    if (rating >= 4) {
      sentiment = 'POSITIVE';
    } else if (rating <= 2) {
      sentiment = 'NEGATIVE';
    }

    let status: 'APPROVED' | 'AUTO_FLAGGED' | 'REJECTED' = 'APPROVED';
    if (toxicScore >= 50) {
      status = 'REJECTED';
    } else if (toxicScore >= 25 || isSpam) {
      status = 'AUTO_FLAGGED';
    }

    return {
      reviewId,
      rating,
      comment: text,
      sentiment,
      toxicScore,
      isSpam,
      status,
      moderationReason
    };
  }
}
