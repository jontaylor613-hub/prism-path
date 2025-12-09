# Security & Usability Armor - Usage Guide

## Overview
This document describes the 4 security modules implemented for the application.

---

## 1. Smart Lock Hook (`useSmartLock`)

**Location:** `src/hooks/useSmartLock.js`

**Status:** ✅ Automatically active in `App.jsx`

**Features:**
- Blocks F12, Ctrl+Shift+I, Ctrl+U (developer tools)
- Allows Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A (productivity)
- Blocks right-click on general UI
- Allows right-click on `<p>`, `<span>`, `<textarea>` for copy/paste
- **Automatically disabled in dev mode** (when dev mode is active)

**Usage:**
Already integrated in `App.jsx`. No additional setup needed.

---

## 2. Copy Button Component

**Location:** `src/components/CopyButton.jsx`

**Usage Example:**
```jsx
import CopyButton from './components/CopyButton';

// In your component:
<div className="relative">
  <div className="flex items-start gap-2">
    <p>{aiGeneratedText}</p>
    <CopyButton textToCopy={aiGeneratedText} />
  </div>
</div>
```

**Props:**
- `textToCopy` (string, required): The text to copy to clipboard
- `className` (string, optional): Additional CSS classes

**Features:**
- One-click copy to clipboard
- Visual feedback: Clipboard icon → Green checkmark (2 seconds)
- Fallback support for older browsers

---

## 3. Security Headers

**Location:** `vercel.json`

**Status:** ✅ Configured and active

**Headers Applied:**
- `X-DNS-Prefetch-Control: off`
- `X-Frame-Options: DENY` (prevents clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Content-Security-Policy`: Strict policy allowing only necessary sources

**Note:** Headers are automatically applied to all routes via Vercel deployment.

---

## 4. API Rate Limiting

**Location:** `api/rateLimit.js`

**Status:** ✅ Integrated into `api/generate.js`

**Features:**
- **Limit:** 20 requests per minute per IP address
- **Response:** Returns `429 Too Many Requests` when exceeded
- **Headers:** Includes `X-RateLimit-*` headers for client awareness
- **Cleanup:** Automatic cleanup of old entries to prevent memory leaks

**Usage:**
Already integrated. The middleware automatically checks all POST requests to `/api/generate`.

**Response Headers (on success):**
- `X-RateLimit-Limit`: 20
- `X-RateLimit-Remaining`: Number of requests left
- `X-RateLimit-Reset`: ISO timestamp when limit resets

**Error Response (429):**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

---

## Toast Notification System

**Location:** `src/utils/toast.js`

**Usage:**
```javascript
import { showToast } from './utils/toast';

showToast('Security Alert: Developer tools are disabled.', 'error');
showToast('Copied to clipboard!', 'success');
showToast('Information message', 'info');
```

**Types:**
- `'error'`: Red background
- `'success'`: Green background  
- `'info'`: Cyan background (default)

---

## Testing

### Test Smart Lock (in production mode):
1. Disable dev mode (if active)
2. Try pressing F12 → Should show security alert
3. Try Ctrl+Shift+I → Should be blocked
4. Try Ctrl+C → Should work normally
5. Right-click on text → Should work
6. Right-click on button → Should be blocked

### Test Copy Button:
1. Add `<CopyButton textToCopy="Test text" />` to any component
2. Click the button → Should show green checkmark
3. Paste → Should paste the copied text

### Test Rate Limiting:
1. Make 21+ requests to `/api/generate` within 1 minute
2. 21st request should return 429 status

---

## Notes

- **Dev Mode:** Smart Lock is automatically disabled when dev mode is active (type "8675309" to toggle)
- **Browser Compatibility:** Copy button includes fallback for older browsers
- **Memory Management:** Rate limiter automatically cleans up old entries
- **Production Ready:** All modules are production-ready and tested

