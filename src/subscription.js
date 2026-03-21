// Subscription Management System
// Ready for Stripe integration - just needs activation
// Currently returns "free" tier for all users until payment system is enabled

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// Subscription status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  INCOMPLETE: 'incomplete'
};

// Feature flags per tier
const TIER_FEATURES = {
  [SUBSCRIPTION_TIERS.FREE]: {
    accommodationAssistant: false, // Blocked after 1 use
    instantAccommodations: 2, // 2 free uses
    studentTracking: false,
    unlimitedChats: false,
    exportToDocs: false
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    accommodationAssistant: true,
    instantAccommodations: 50, // 50 per month
    studentTracking: true,
    unlimitedChats: true,
    exportToDocs: true
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    accommodationAssistant: true,
    instantAccommodations: -1, // Unlimited
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

// Payment system enabled flag (set to true when ready to activate)
const PAYMENT_SYSTEM_ENABLED = false;

export const SubscriptionService = {
  // Get user's subscription tier
  getUserTier: async (uid) => {
    try {
      if (!uid) return SUBSCRIPTION_TIERS.FREE;
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
      }
      return SUBSCRIPTION_TIERS.FREE;
    } catch (error) {
      console.error('Error fetching subscription tier:', error);
      return SUBSCRIPTION_TIERS.FREE;
    }
  },

  // Get user's subscription status
  getUserSubscriptionStatus: async (uid) => {
    try {
      if (!uid) return null;
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          tier: userData.subscriptionTier || SUBSCRIPTION_TIERS.FREE,
          status: userData.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE,
          currentPeriodEnd: userData.subscriptionCurrentPeriodEnd || null,
          cancelAtPeriodEnd: userData.subscriptionCancelAtPeriodEnd || false
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }
  },

  // Check if user has access to a feature
  hasFeatureAccess: async (uid, feature) => {
    const tier = await SubscriptionService.getUserTier(uid);
    const features = TIER_FEATURES[tier] || TIER_FEATURES[SUBSCRIPTION_TIERS.FREE];
    return features[feature] !== false && features[feature] !== 0;
  },

  // Get feature limit for user
  getFeatureLimit: async (uid, feature) => {
    const tier = await SubscriptionService.getUserTier(uid);
    const features = TIER_FEATURES[tier] || TIER_FEATURES[SUBSCRIPTION_TIERS.FREE];
    return features[feature] || 0;
  },

  // Check if user can use Accommodation Assistant
  canUseAccommodationAssistant: async (uid) => {
    if (!PAYMENT_SYSTEM_ENABLED) {
      // Before paywall activation, use IP-based free trial
      return true; // Will be checked by GemUsageTracker
    }
    
    if (!uid) return false; // Must be logged in after paywall
    
    const hasAccess = await SubscriptionService.hasFeatureAccess(uid, 'accommodationAssistant');
    if (!hasAccess) return false;
    
    // Check subscription status
    const subscription = await SubscriptionService.getUserSubscriptionStatus(uid);
    if (!subscription) return false;
    
    return subscription.status === SUBSCRIPTION_STATUS.ACTIVE || 
           subscription.status === SUBSCRIPTION_STATUS.TRIALING;
  },

  // Update subscription (called by Stripe webhook)
  updateSubscription: async (uid, subscriptionData) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        subscriptionTier: subscriptionData.tier,
        subscriptionStatus: subscriptionData.status,
        subscriptionCurrentPeriodEnd: subscriptionData.currentPeriodEnd,
        subscriptionCancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
        subscriptionStripeCustomerId: subscriptionData.stripeCustomerId,
        subscriptionStripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
  },

  // Enable payment system (call this when ready to activate)
  enablePaymentSystem: () => {
    // This would be set to true when Stripe is integrated
    // For now, keeping it false so free trial system works
    return PAYMENT_SYSTEM_ENABLED;
  },

  // Get pricing tiers (for display)
  getPricingTiers: () => {
    return {
      [SUBSCRIPTION_TIERS.BASIC]: {
        name: 'Basic',
        price: 9.99, // Monthly
        features: TIER_FEATURES[SUBSCRIPTION_TIERS.BASIC]
      },
      [SUBSCRIPTION_TIERS.PRO]: {
        name: 'Pro',
        price: 24.99, // Monthly
        features: TIER_FEATURES[SUBSCRIPTION_TIERS.PRO]
      },
      [SUBSCRIPTION_TIERS.ENTERPRISE]: {
        name: 'Enterprise',
        price: 'Custom', // Contact for pricing
        features: TIER_FEATURES[SUBSCRIPTION_TIERS.ENTERPRISE]
      }
    };
  }
};


