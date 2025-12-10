import React from 'react';
import { getPasswordStrength } from '../lib/passwordValidator';

/**
 * Password Strength Indicator Component
 * Real-time visual feedback for password strength
 */
export default function PasswordStrengthIndicator({ password, isDark }) {
  const strength = getPasswordStrength(password);
  
  if (!password) {
    return null;
  }
  
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: strength.width }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength.level === 4 ? 'text-green-400' :
          strength.level === 3 ? 'text-blue-400' :
          strength.level === 2 ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {strength.label}
        </span>
      </div>
    </div>
  );
}


