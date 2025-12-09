/**
 * API Rate Limiting Middleware - "The Bouncer"
 * Token Bucket implementation to prevent DDoS and API abuse
 * Limits: 20 requests per minute per IP address
 */

// In-memory store for rate limiting (Map-based counter)
// In production, consider using Redis or a persistent store
const rateLimitStore = new Map();

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 20;

/**
 * Clean up old entries to prevent memory leaks
 * Called on each request to avoid needing setInterval (which doesn't work in serverless)
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Get client IP address from request
 * Handles Vercel's proxy headers and various deployment scenarios
 */
function getClientIP(req) {
  // Vercel provides x-forwarded-for
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback to other common headers
  return req.headers['x-real-ip'] || 
         req.headers['cf-connecting-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Check if request exceeds rate limit
 * @param {Object} req - Request object
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(req) {
  // Clean up old entries on each request (serverless-friendly)
  cleanupOldEntries();
  
  const clientIP = getClientIP(req);
  const now = Date.now();

  // Get or create rate limit data for this IP
  let rateLimitData = rateLimitStore.get(clientIP);

  // If no data exists or window has expired, reset
  if (!rateLimitData || (now - rateLimitData.resetTime) > RATE_LIMIT_WINDOW) {
    rateLimitData = {
      count: 0,
      resetTime: now
    };
    rateLimitStore.set(clientIP, rateLimitData);
  }

  // Increment request count
  rateLimitData.count += 1;

  // Check if limit exceeded
  const allowed = rateLimitData.count <= MAX_REQUESTS_PER_WINDOW;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - rateLimitData.count);
  const resetTime = rateLimitData.resetTime + RATE_LIMIT_WINDOW;

  // Update store
  rateLimitStore.set(clientIP, rateLimitData);

  return {
    allowed,
    remaining,
    resetTime,
    limit: MAX_REQUESTS_PER_WINDOW
  };
}

/**
 * Middleware function to use in API routes
 * Returns 429 if rate limit exceeded, otherwise continues
 */
export function rateLimitMiddleware(req, res) {
  const result = checkRateLimit(req);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    res.setHeader('Retry-After', retryAfter);
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: retryAfter
    });
  }

  // Add rate limit headers to successful responses
  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

  return null; // Continue processing
}

