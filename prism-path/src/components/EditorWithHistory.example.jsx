/**
 * Example: Editor with Undo/Redo functionality
 * 
 * This demonstrates how to integrate EditorToolbar with useHistory hook
 * for text areas like Email Drafter or IEP Goal box.
 */

import React from 'react';
import { useHistory } from '../hooks/useHistory';
import EditorToolbar from './EditorToolbar';
import { getTheme } from '../utils';

export default function EditorWithHistory({ isDark, initialValue = '' }) {
  const theme = getTheme(isDark);
  const { value, setValue, undo, redo, canUndo, canRedo } = useHistory(initialValue);

  return (
    <div className="space-y-2">
      {/* Editor Toolbar with Undo/Redo buttons */}
      <div className="flex items-center justify-between">
        <label className={`text-sm font-medium ${theme.text}`}>
          Editor with History
        </label>
        <EditorToolbar
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          isDark={isDark}
        />
      </div>

      {/* Text Area */}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-4 ${theme.text} outline-none min-h-[120px]`}
        placeholder="Type here... Use undo/redo buttons or Ctrl+Z / Ctrl+Y"
      />
    </div>
  );
}

