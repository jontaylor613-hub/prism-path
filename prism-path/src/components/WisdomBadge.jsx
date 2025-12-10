import React from 'react';

/**
 * WisdomBadge Component
 * Displays social proof badges for accommodation strategies based on usage count
 * 
 * @param {number} usageCount - Number of times this strategy has been used
 * @param {boolean} isDark - Dark mode flag
 */
export default function WisdomBadge({ usageCount = 0, isDark = false }) {
  if (usageCount === 0) return null;

  const getBadgeContent = () => {
    if (usageCount > 500) {
      return {
        text: '🏆 Gold Standard',
        tooltip: `Used by ${usageCount} educators`,
        className: isDark 
          ? 'bg-amber-900/30 text-amber-400 border-amber-500/50' 
          : 'bg-amber-50 text-amber-700 border-amber-300'
      };
    } else if (usageCount > 100) {
      return {
        text: '🔥 Popular Strategy',
        tooltip: `Used by ${usageCount} educators`,
        className: isDark 
          ? 'bg-orange-900/30 text-orange-400 border-orange-500/50' 
          : 'bg-orange-50 text-orange-700 border-orange-300'
      };
    }
    return null;
  };

  const badge = getBadgeContent();
  if (!badge) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className} transition-all`}
      title={badge.tooltip}
    >
      {badge.text}
    </span>
  );
}

