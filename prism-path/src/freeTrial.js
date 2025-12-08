// Free Trial Management for Accommodations
// Tracks usage in localStorage (can be upgraded to Firebase later)

import { DevModeService } from './devMode';

const FREE_TRIAL_KEY = 'prismpath_free_trial_uses';
const FREE_TRIAL_LIMIT = 2; // Number of free accommodations

export const FreeTrialService = {
  // Get remaining free uses
  getRemainingUses: () => {
    try {
      // Check for developer mode - unlimited access
      if (DevModeService.isActive()) {
        return 999999; // Unlimited in dev mode
      }
      
      const used = parseInt(localStorage.getItem(FREE_TRIAL_KEY) || '0');
      return Math.max(0, FREE_TRIAL_LIMIT - used);
    } catch {
      return FREE_TRIAL_LIMIT;
    }
  },

  // Check if user has free uses remaining
  hasFreeUses: () => {
    try {
      // Check for developer mode - unlimited access
      if (DevModeService.isActive()) {
        return true;
      }
    } catch {
      // DevModeService might not be available, continue with normal check
    }
    return FreeTrialService.getRemainingUses() > 0;
  },

  // Record a use
  recordUse: () => {
    try {
      const used = parseInt(localStorage.getItem(FREE_TRIAL_KEY) || '0');
      localStorage.setItem(FREE_TRIAL_KEY, (used + 1).toString());
      return FreeTrialService.getRemainingUses();
    } catch {
      return 0;
    }
  },

  // Reset trial (for testing/admin)
  resetTrial: () => {
    try {
      localStorage.removeItem(FREE_TRIAL_KEY);
      return true;
    } catch {
      return false;
    }
  },

  // Get usage stats
  getUsageStats: () => {
    const used = parseInt(localStorage.getItem(FREE_TRIAL_KEY) || '0');
    const remaining = FreeTrialService.getRemainingUses();
    return {
      used,
      remaining,
      limit: FREE_TRIAL_LIMIT,
      hasRemaining: remaining > 0
    };
  }
};


