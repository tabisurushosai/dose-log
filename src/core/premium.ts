export const PREMIUM_PRICE_USD = 3;
export const TRIAL_DAYS = 7;
export const STRIPE_PAYMENT_LINK = "STRIPE_PAYMENT_LINK";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PremiumState {
  firstLaunchAtIso: string;
  purchasedAtIso?: string;
}

export interface PremiumAccess {
  isPremiumActive: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
}

export function createInitialPremiumState(now: Date = new Date()): PremiumState {
  return {
    firstLaunchAtIso: now.toISOString()
  };
}

export function normalizePremiumState(state: unknown, now: Date = new Date()): PremiumState {
  if (!state || typeof state !== "object") {
    return createInitialPremiumState(now);
  }

  const candidate = state as Record<string, unknown>;
  const firstLaunchAtIso =
    typeof candidate.firstLaunchAtIso === "string" && Number.isFinite(Date.parse(candidate.firstLaunchAtIso))
      ? candidate.firstLaunchAtIso
      : now.toISOString();
  const purchasedAtIso =
    typeof candidate.purchasedAtIso === "string" && Number.isFinite(Date.parse(candidate.purchasedAtIso))
      ? candidate.purchasedAtIso
      : undefined;

  return {
    firstLaunchAtIso,
    ...(purchasedAtIso ? { purchasedAtIso } : {})
  };
}

export function getPremiumAccess(state: PremiumState, now: Date = new Date()): PremiumAccess {
  const firstLaunchAtMs = Date.parse(state.firstLaunchAtIso);
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - firstLaunchAtMs) / MS_PER_DAY));
  const trialDaysRemaining = Math.max(0, TRIAL_DAYS - elapsedDays);
  const isPurchased = Boolean(state.purchasedAtIso);

  return {
    isPremiumActive: isPurchased || trialDaysRemaining > 0,
    isTrialActive: !isPurchased && trialDaysRemaining > 0,
    trialDaysRemaining
  };
}
