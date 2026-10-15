import { FlameOfficialBanner, DeveloperSubscription } from '../src/types/index.ts';

const INITIAL_OFFICIAL_BANNERS: FlameOfficialBanner[] = [
  {
    id: 'banner-off-1',
    appId: 'flame-echo-soundboard',
    appName: 'Flame Echo Soundboard Pro',
    developerName: 'Flame Official Studio',
    bannerImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    headline: 'Official FAS Audio Experience',
    tagline: 'Ultra low-latency spatial SFX generator with Android 15 haptics',
    displayOrder: 1,
    active: true
  },
  {
    id: 'banner-off-2',
    appId: 'flame-cyber-radar',
    appName: 'Flame Cyber Radar Turbo',
    developerName: 'Flame Official Studio',
    bannerImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    headline: 'Certified FAS Tool Suite',
    tagline: 'Offline telemetry & network diagnostic monitor built with Cloud APK Builder',
    displayOrder: 2,
    active: true
  }
];

class OfficialPromotionManager {
  private banners: FlameOfficialBanner[] = [...INITIAL_OFFICIAL_BANNERS];
  private subscriptions: Map<string, DeveloperSubscription> = new Map();

  constructor() {
    // Seed initial 1-month free trial subscription for current developer
    this.subscriptions.set('dev-flame-labs', {
      developerId: 'dev-flame-labs',
      planType: 'FREE_TRIAL_1MONTH',
      priceINR: 0,
      startDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      daysLeft: 30
    });
  }

  // Official Banner Management (Admin Controlled, Non-biased)
  public getOfficialBanners(): FlameOfficialBanner[] {
    return this.banners.filter(b => b.active).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getAllBanners(): FlameOfficialBanner[] {
    return this.banners;
  }

  public setBannerStatus(bannerId: string, active: boolean): boolean {
    const b = this.banners.find(x => x.id === bannerId);
    if (!b) return false;
    b.active = active;
    return true;
  }

  public addOfficialBanner(banner: Omit<FlameOfficialBanner, 'id'>): FlameOfficialBanner {
    const newBanner: FlameOfficialBanner = {
      ...banner,
      id: `banner-off-${Date.now()}`
    };
    this.banners.push(newBanner);
    return newBanner;
  }

  // Developer Pricing & 1-Month Free Subscription Model
  public getSubscription(developerId: string): DeveloperSubscription {
    const sub = this.subscriptions.get(developerId);
    if (!sub) {
      // First publication gets 1-Month Free Subscription automatically!
      const freeTrial: DeveloperSubscription = {
        developerId,
        planType: 'FREE_TRIAL_1MONTH',
        priceINR: 0,
        startDate: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        daysLeft: 30
      };
      this.subscriptions.set(developerId, freeTrial);
      return freeTrial;
    }
    return sub;
  }

  public upgradeSubscription(
    developerId: string, 
    planType: 'BASIC_MONTHLY' | 'STUDIO_MONTHLY' | 'ANNUAL_PASS'
  ): DeveloperSubscription {
    const prices = {
      BASIC_MONTHLY: 199,
      STUDIO_MONTHLY: 499,
      ANNUAL_PASS: 1499
    };
    const durationDays = planType === 'ANNUAL_PASS' ? 365 : 30;

    const updated: DeveloperSubscription = {
      developerId,
      planType,
      priceINR: prices[planType],
      startDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      daysLeft: durationDays
    };

    this.subscriptions.set(developerId, updated);
    return updated;
  }
}

export const officialPromotion = new OfficialPromotionManager();
