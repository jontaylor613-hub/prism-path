import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { getTheme } from '../utils';

/**
 * Editor Toolbar Component
 * Provides undo/redo buttons for text editors using the useHistory hook
 * 
 * @param {Function} onUndo - Undo callback function
 * @param {Function} onRedo - Redo callback function
 * @param {boolean} canUndo - Whether undo is available
 * @param {boolean} canRedo - Whether redo is available
 * @param {boolean} isDark - Dark mode flag
 * @param {string} className - Additional CSS classes
 */
export default function EditorToolbar({ 
  onUndo, 
  onRedo, 
  canUndo = false, 
  canRedo = false, 
  isDark, 
  className = '' 
}) {
  const theme = getTheme(isDark);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-1.5 rounded transition-all duration-200 ${
          canUndo
            ? `${theme.cardBg} border ${theme.cardBorder} hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer`
            : `${theme.cardBg} border ${theme.cardBorder} opacity-40 cursor-not-allowed`
        }`}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 
          size={16} 
          className={canUndo ? theme.text : theme.textMuted}
        />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-1.5 rounded transition-all duration-200 ${
          canRedo
            ? `${theme.cardBg} border ${theme.cardBorder} hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer`
            : `${theme.cardBg} border ${theme.cardBorder} opacity-40 cursor-not-allowed`
        }`}
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 
          size={16} 
          className={canRedo ? theme.text : theme.textMuted}
        />
      </button>
    </div>
  );
}

