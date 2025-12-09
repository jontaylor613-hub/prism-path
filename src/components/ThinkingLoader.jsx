import React, { useState, useEffect } from 'react';
import { getTheme } from '../utils';

/**
 * Thinking Stream Loader Component
 * Displays animated skeleton text bars and rotating status messages during AI generation
 */
export default function ThinkingLoader({ isDark, className = '' }) {
  const [statusIndex, setStatusIndex] = useState(0);
  const theme = getTheme(isDark);

  const statusMessages = [
    "Reading Student Profile...",
    "Aligning with Standards...",
    "Drafting Content...",
    "Finalizing Tone..."
  ];

  // Rotate status messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Generate skeleton bars of varying widths (mimicking paragraphs)
  const skeletonBars = [
    { width: '100%', delay: '0ms' },
    { width: '95%', delay: '150ms' },
    { width: '88%', delay: '300ms' },
    { width: '92%', delay: '450ms' },
    { width: '85%', delay: '600ms' },
  ];

  return (
    <div className={`${className} ${theme.cardBg} border ${theme.cardBorder} rounded-lg p-6`}>
      {/* Status Text */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75"></div>
        </div>
        <span className={`text-sm font-medium ${theme.primaryText} transition-opacity duration-500`}>
          {statusMessages[statusIndex]}
        </span>
      </div>

      {/* Skeleton Text Bars */}
      <div className="space-y-3">
        {skeletonBars.map((bar, index) => (
          <div
            key={index}
            className={`h-4 rounded ${
              isDark 
                ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' 
                : 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200'
            } animate-pulse`}
            style={{
              width: bar.width,
              animationDelay: bar.delay,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>

      {/* Additional shorter bars for variation */}
      <div className="space-y-3 mt-4">
        {skeletonBars.slice(0, 3).map((bar, index) => (
          <div
            key={`short-${index}`}
            className={`h-3 rounded ${
              isDark 
                ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800' 
                : 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200'
            } animate-pulse`}
            style={{
              width: bar.width,
              animationDelay: `${parseInt(bar.delay) + 750}ms`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

