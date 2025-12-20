/**
 * Student Access Code Generator
 * Generates unique 6-character alphanumeric codes (uppercase) for student profiles
 */

/**
 * Generates a unique 6-character alphanumeric code (uppercase)
 * Format: A-Z, 0-9 (excluding ambiguous characters like 0, O, 1, I, L)
 * 
 * @returns {string} A 6-character uppercase alphanumeric code
 */
export function generateAccessCode() {
  // Use characters that are easy to distinguish (exclude 0, O, 1, I, L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Validates that a code matches the expected format
 * @param {string} code - The code to validate
 * @returns {boolean} True if the code is valid format
 */
export function isValidAccessCodeFormat(code) {
  // Check if it's exactly 6 characters and matches our character set
  const validChars = /^[A-Z0-9]{6}$/;
  return typeof code === 'string' && code.length === 6 && validChars.test(code);
}

/**
 * Formats an access code with a dash for better readability
 * @param {string} code - The 6-character access code
 * @returns {string} Formatted code with dash (e.g., "X7B-29A")
 */
export function formatAccessCode(code) {
  if (!code || typeof code !== 'string') return '';
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Remove any existing dashes/formatting
  if (cleanCode.length !== 6) return code; // Return original if invalid
  return `${cleanCode.substring(0, 3)}-${cleanCode.substring(3)}`;
}

