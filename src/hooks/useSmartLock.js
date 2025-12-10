/**
 * Smart Lock Anti-Tamper Hook
 * Protects against developer tools and tampering while allowing productivity actions
 * Disabled in dev mode for development convenience
 */

import { useEffect } from 'react';
import { DevModeService } from '../devMode';
import { showToast } from '../utils/toast';

export function useSmartLock() {
  useEffect(() => {
    // Skip all protection if dev mode is active
    if (DevModeService.isActive()) {
      return;
    }

    // Block developer tools keyboard shortcuts
    const handleKeyDown = (e) => {
      // Allow productivity keys: Copy, Paste, Cut, Select All
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')
      ) {
        return; // Allow these
      }

      // Block F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        showToast('Security Alert: Developer tools are disabled.', 'error');
        return false;
      }

      // Block Ctrl+Shift+I / Cmd+Opt+I (Inspector)
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.shiftKey || e.altKey) && 
        (e.key === 'I' || e.key === 'i')
      ) {
        e.preventDefault();
        showToast('Security Alert: Developer tools are disabled.', 'error');
        return false;
      }

      // Block Ctrl+U / Cmd+U (View Source)
      if (
        (e.ctrlKey || e.metaKey) && 
        e.key === 'u'
      ) {
        e.preventDefault();
        showToast('Security Alert: View source is disabled.', 'error');
        return false;
      }

      // Block Ctrl+Shift+C / Cmd+Opt+C (Element Inspector)
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.shiftKey || e.altKey) && 
        (e.key === 'C' || e.key === 'c')
      ) {
        e.preventDefault();
        showToast('Security Alert: Developer tools are disabled.', 'error');
        return false;
      }
    };

    // Block right-click context menu (except on text elements)
    const handleContextMenu = (e) => {
      const target = e.target;
      const tagName = target.tagName?.toLowerCase();
      
      // Allow context menu on text elements: p, span, textarea
      if (tagName === 'p' || tagName === 'span' || tagName === 'textarea') {
        return; // Allow right-click for copy/paste
      }

      // Block context menu on everything else
      e.preventDefault();
      showToast('Security Alert: Right-click is restricted. Use Copy buttons for text.', 'error');
      return false;
    };

    // Disable text selection on certain elements (optional, but can help)
    const handleSelectStart = (e) => {
      const target = e.target;
      const tagName = target.tagName?.toLowerCase();
      
      // Allow selection on text elements
      if (tagName === 'p' || tagName === 'span' || tagName === 'textarea' || tagName === 'input') {
        return;
      }
      
      // Allow selection if user is trying to copy (Ctrl/Cmd held)
      if (e.ctrlKey || e.metaKey) {
        return;
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []); // Empty deps - only run once on mount
}


