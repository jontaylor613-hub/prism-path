// Subscription Management — localStorage-backed (Clerk migration; was Firestore)
// Ready for Stripe integration; returns FREE tier for all users until payment system is enabled

const SUBSCRIPTION_KEY = 'prismpath_subscriptions';

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  INCOMPLETE: 'incomplete'
};

const TIER_FEATURES = {
  [SUBSCRIPTION_TIERS.FREE]: {
    accommodationAssistant: false,
    instantAccommodations: 2,
    studentTracking: false,
    unlimitedChats: false,
    exportToDocs: false
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    accommodationAssistant: true,
    instantAccommodations: 50,
    studentTracking: true,
    unlimitedChats: true,
    exportToDocs: true
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    accommodationAssistant: true,
    instantAccommodations: -1,
    studentTracking: true,
    unlimitedChats: true,
    exportToDocs: true,
    prioritySupport: true,
    advancedAnalytics: true
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    accommodationAssistant: true,
    instantAccommodations: -1,
    studentTracking: true,
    unlimitedChats: true,
    exportToDocs: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customIntegrations: true,
    dedicatedSupport: true
  }
};

const PAYMENT_SYSTEM_ENABLED = false;

function loadSubscriptions() {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSubscriptions(subs) {
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subs));
}

export const SubscriptionService = {
  getUserTier: async (uid) => {
    if (!uid) return SUBSCRIPTION_TIERS.FREE;
    const subs = loadSubscriptions();
    return subs[uid]?.tier || SUBSCRIPTION_TIERS.FREE;
  },

  getUserSubscriptionStatus: async (uid) => {
    if (!uid) return null;
    const subs = loadSubscriptions();
    const s = subs[uid];
    if (!s) return null;
    return {
      tier: s.tier || SUBSCRIPTION_TIERS.FREE,
      status: s.status || SUBSCRIPTION_STATUS.ACTIVE,
      currentPeriodEnd: s.currentPeriodEnd || null,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd || false
    };
  },

  hasFeatureAccess: async (uid, feature) => {
    const tier = await SubscriptionService.getUserTier(uid);
    const features = TIER_FEATURES[tier] || TIER_FEATURES[SUBSCRIPTION_TIERS.FREE];
    return features[feature] !== false && features[feature] !== 0;
  },

  getFeatureLimit: async (uid, feature) => {
    const tier = await SubscriptionService.getUserTier(uid);
    const features = TIER_FEATURES[tier] || TIER_FEATURES[SUBSCRIPTION_TIERS.FREE];
    return features[feature] || 0;
  },

  canUseAccommodationAssistant: async (uid) => {
    if (!PAYMENT_SYSTEM_ENABLED) return true;
    if (!uid) return false;
    const hasAccess = await SubscriptionService.hasFeatureAccess(uid, 'accommodationAssistant');
    if (!hasAccess) return false;
    const subscription = await SubscriptionService.getUserSubscriptionStatus(uid);
    if (!subscription) return false;
    return subscription.status === SUBSCRIPTION_STATUS.ACTIVE || subscription.status === SUBSCRIPTION_STATUS.TRIALING;
  },

  updateSubscription: async (uid, subscriptionData) => {
    const subs = loadSubscriptions();
    subs[uid] = {
      ...subs[uid],
      tier: subscriptionData.tier,
      status: subscriptionData.status,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
      stripeCustomerId: subscriptionData.stripeCustomerId,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      updatedAt: new Date().toISOString()
    };
    saveSubscriptions(subs);
    return true;
  },

  enablePaymentSystem: () => PAYMENT_SYSTEM_ENABLED,

  getPricingTiers: () => ({
    [SUBSCRIPTION_TIERS.BASIC]: { name: 'Basic', price: 9.99, features: TIER_FEATURES[SUBSCRIPTION_TIERS.BASIC] },
    [SUBSCRIPTION_TIERS.PRO]: { name: 'Pro', price: 24.99, features: TIER_FEATURES[SUBSCRIPTION_TIERS.PRO] },
    [SUBSCRIPTION_TIERS.ENTERPRISE]: { name: 'Enterprise', price: 'Custom', features: TIER_FEATURES[SUBSCRIPTION_TIERS.ENTERPRISE] }
  })
};
