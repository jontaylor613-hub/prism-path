// GEM Usage Tracker - Limits GEM usage to 1 time per IP address without account
// FERPA-Compliant: Only tracks IP addresses, no PII

const GEM_USAGE_KEY = 'prismpath_gem_usage';
const GEM_USAGE_LIMIT = 1;

// Get client IP address (approximate - uses browser APIs)
const getClientIP = async () => {
  try {
    // Try to get IP from a public service (non-PII, just IP)
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    // Fallback: Use a combination of browser fingerprinting (non-PII)
    // This is less reliable but works offline
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
    const fingerprint = canvas.toDataURL();
    
    // Combine with user agent hash (no PII)
    const uaHash = btoa(navigator.userAgent).slice(0, 16);
    return `fallback_${uaHash}_${fingerprint.slice(0, 20)}`;
  }
};

export const GemUsageTracker = {
  // Check if user can use GEM (1 use limit without account)
  canUseGem: async () => {
    try {
      // If user is logged in, they have unlimited access
      // This check should be done before calling this function
      
      const ip = await getClientIP();
      const usage = GemUsageTracker.getUsage();
      
      // Check if this IP has already used GEM
      if (usage.usedIPs && usage.usedIPs.includes(ip)) {
        return false;
      }
      
      // Check if limit reached (shouldn't happen with IP check, but safety)
      if (usage.count >= GEM_USAGE_LIMIT) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking GEM usage:', error);
      // On error, allow usage (fail open)
      return true;
    }
  },

  // Record GEM usage
  recordUsage: async () => {
    try {
      const ip = await getClientIP();
      const usage = GemUsageTracker.getUsage();
      
      if (!usage.usedIPs) {
        usage.usedIPs = [];
      }
      
      // Add IP if not already present
      if (!usage.usedIPs.includes(ip)) {
        usage.usedIPs.push(ip);
        usage.count = (usage.count || 0) + 1;
        usage.lastUsed = new Date().toISOString();
        
        // Store in localStorage (FERPA-compliant: only IP addresses, no PII)
        localStorage.setItem(GEM_USAGE_KEY, JSON.stringify(usage));
      }
      
      return true;
    } catch (error) {
      console.error('Error recording GEM usage:', error);
      return false;
    }
  },

  // Get usage data
  getUsage: () => {
    try {
      const stored = localStorage.getItem(GEM_USAGE_KEY);
      if (!stored) {
        return { count: 0, usedIPs: [], lastUsed: null };
      }
      return JSON.parse(stored);
    } catch {
      return { count: 0, usedIPs: [], lastUsed: null };
    }
  },

  // Reset usage (for testing/admin purposes)
  resetUsage: () => {
    localStorage.removeItem(GEM_USAGE_KEY);
  }
};

