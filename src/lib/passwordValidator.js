/**
 * Password Validation - NIST 2025 Standard
 * Minimum 12 characters with mix of uppercase, lowercase, numbers, and symbols
 */

/**
 * Validate password against NIST 2025 standard
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, errors: string[], strength: 'weak' | 'fair' | 'good' | 'strong' }}
 */
export function validatePassword(password) {
  const errors = [];
  let strength = 'weak';
  
  if (!password) {
    return { valid: false, errors: ['Password is required'], strength };
  }
  
  // Minimum 12 characters
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  // Check for required character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSymbol) {
    errors.push('Password must contain at least one symbol (!@#$%^&*...)');
  }
  
  // Calculate strength
  const criteriaMet = [
    password.length >= 12,
    password.length >= 16,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSymbol,
    password.length >= 20
  ];
  
  const criteriaCount = criteriaMet.filter(Boolean).length;
  
  if (criteriaCount >= 6) {
    strength = 'strong';
  } else if (criteriaCount >= 4) {
    strength = 'good';
  } else if (criteriaCount >= 2) {
    strength = 'fair';
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Get password strength indicator data
 * @param {string} password - Password to analyze
 * @returns {{ level: number, label: string, color: string, width: string }}
 */
export function getPasswordStrength(password) {
  const validation = validatePassword(password);
  
  if (!password) {
    return { level: 0, label: 'No password', color: 'bg-slate-400', width: '0%' };
  }
  
  const strengthMap = {
    weak: { level: 1, label: 'Weak', color: 'bg-red-500', width: '25%' },
    fair: { level: 2, label: 'Fair', color: 'bg-yellow-500', width: '50%' },
    good: { level: 3, label: 'Good', color: 'bg-blue-500', width: '75%' },
    strong: { level: 4, label: 'Strong', color: 'bg-green-500', width: '100%' }
  };
  
  return strengthMap[validation.strength] || strengthMap.weak;
}


