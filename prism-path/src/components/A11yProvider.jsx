/**
 * Accessibility Provider Component
 * Applies accessibility settings globally on app load
 * This ensures settings persist across page reloads
 */

import { useEffect } from 'react';

const A11Y_STORAGE_KEY = 'prismpath_a11y_settings';

/**
 * Global Accessibility Provider
 * Applies font and contrast settings on app load
 * Should be placed at the root of the app
 */
export default function A11yProvider() {
  useEffect(() => {
    // Load settings from localStorage
    try {
      const saved = localStorage.getItem(A11Y_STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        applyFontMode(settings.fontMode || 'default');
        applyContrastMode(settings.contrastMode || 'normal');
      }
    } catch (e) {
      console.error('Failed to load a11y settings:', e);
    }
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Apply font mode globally
 */
function applyFontMode(fontMode) {
  const body = document.body;
  
  if (fontMode === 'dyslexic') {
    // Load OpenDyslexic font if not already loaded
    if (!document.getElementById('opendyslexic-font')) {
      const link = document.createElement('link');
      link.id = 'opendyslexic-font';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/OpenDyslexic.css';
      document.head.appendChild(link);
    }
    
    body.style.fontFamily = 'OpenDyslexic, sans-serif';
  } else {
    body.style.fontFamily = '';
  }
}

/**
 * Apply contrast mode globally
 */
function applyContrastMode(contrastMode) {
  const body = document.body;
  const root = document.documentElement;

  if (contrastMode === 'high') {
    body.style.backgroundColor = '#000000';
    body.style.color = '#FFD700';
    root.style.setProperty('--high-contrast', '1');
    
    // Override common text colors with high contrast
    let style = document.getElementById('high-contrast-override');
    if (!style) {
      style = document.createElement('style');
      style.id = 'high-contrast-override';
      document.head.appendChild(style);
    }
    
    style.textContent = `
      * {
        color: #FFD700 !important;
        background-color: #000000 !important;
      }
      input, textarea, select {
        background-color: #000000 !important;
        color: #FFD700 !important;
        border-color: #FFD700 !important;
      }
      button:not([class*="bg-"]) {
        background-color: #FFD700 !important;
        color: #000000 !important;
      }
      a {
        color: #FFD700 !important;
      }
      /* Preserve some gradient buttons */
      [class*="bg-gradient"] {
        background: linear-gradient(to right, #FFD700, #FFA500) !important;
        color: #000000 !important;
      }
    `;
  } else {
    body.style.backgroundColor = '';
    body.style.color = '';
    root.style.removeProperty('--high-contrast');
    
    const style = document.getElementById('high-contrast-override');
    if (style) {
      style.remove();
    }
  }
}

/**
 * Export functions for use in A11yMenu
 */
export { applyFontMode, applyContrastMode };

