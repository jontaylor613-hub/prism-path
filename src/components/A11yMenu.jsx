/**
 * Accessibility Menu Component
 * Provides font and contrast mode toggles
 */

import { useState, useEffect } from 'react';
import { Settings, Type, Contrast, X } from 'lucide-react';
import { getTheme } from '../utils';
import { applyFontMode, applyContrastMode } from './A11yProvider';

const A11Y_STORAGE_KEY = 'prismpath_a11y_settings';

export default function A11yMenu({ isDark = true, isOpen, onClose }) {
  const [fontMode, setFontMode] = useState('default');
  const [contrastMode, setContrastMode] = useState('normal');

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(A11Y_STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        setFontMode(settings.fontMode || 'default');
        setContrastMode(settings.contrastMode || 'normal');
      }
    } catch (e) {
      console.error('Failed to load a11y settings:', e);
    }
  }, []);

  // Apply font mode when changed
  useEffect(() => {
    applyFontMode(fontMode);
  }, [fontMode]);

  // Apply contrast mode when changed
  useEffect(() => {
    applyContrastMode(contrastMode);
  }, [contrastMode]);

  // Save settings to localStorage
  const saveSettings = (newFontMode, newContrastMode) => {
    try {
      const settings = {
        fontMode: newFontMode,
        contrastMode: newContrastMode
      };
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save a11y settings:', e);
    }
  };

  const handleFontChange = (mode) => {
    setFontMode(mode);
    saveSettings(mode, contrastMode);
  };

  const handleContrastChange = (mode) => {
    setContrastMode(mode);
    saveSettings(fontMode, mode);
  };

  const theme = getTheme(isDark);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className={`relative z-10 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl shadow-2xl p-6 max-w-md w-full`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${theme.text} flex items-center gap-2`}>
            <Settings size={24} className="text-cyan-400" />
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-slate-500/10 ${theme.textMuted} hover:${theme.text} transition-colors`}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Font Mode */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center gap-2`}>
            <Type size={18} className="text-cyan-400" />
            Font Mode
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleFontChange('default')}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                fontMode === 'default'
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white border-transparent'
                  : `${theme.inputBg} border ${theme.inputBorder} ${theme.text} hover:border-cyan-500`
              }`}
            >
              Default
            </button>
            <button
              onClick={() => handleFontChange('dyslexic')}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                fontMode === 'dyslexic'
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white border-transparent'
                  : `${theme.inputBg} border ${theme.inputBorder} ${theme.text} hover:border-cyan-500`
              }`}
            >
              OpenDyslexic
            </button>
          </div>
          <p className={`text-xs ${theme.textMuted} mt-2`}>
            OpenDyslexic font helps improve readability for users with dyslexia.
          </p>
        </div>

        {/* Contrast Mode */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${theme.text} mb-3 flex items-center gap-2`}>
            <Contrast size={18} className="text-cyan-400" />
            Contrast Mode
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleContrastChange('normal')}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                contrastMode === 'normal'
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white border-transparent'
                  : `${theme.inputBg} border ${theme.inputBorder} ${theme.text} hover:border-cyan-500`
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => handleContrastChange('high')}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                contrastMode === 'high'
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white border-transparent'
                  : `${theme.inputBg} border ${theme.inputBorder} ${theme.text} hover:border-cyan-500`
              }`}
            >
              High Contrast
            </button>
          </div>
          <p className={`text-xs ${theme.textMuted} mt-2`}>
            High contrast mode uses black background with yellow text for better visibility.
          </p>
        </div>

        {/* Info */}
        <div className={`${theme.inputBg} border ${theme.cardBorder} rounded-lg p-3`}>
          <p className={`text-xs ${theme.textMuted}`}>
            <strong className={theme.text}>Note:</strong> These settings are saved to your browser and will persist across sessions.
          </p>
        </div>
      </div>
    </div>
  );
}

