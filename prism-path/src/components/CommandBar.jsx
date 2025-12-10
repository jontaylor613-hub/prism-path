import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { 
  Search, Home, Users, Settings, UserPlus, Mail, 
  ArrowRight, Sparkles, X, Accessibility
} from 'lucide-react';
import { getTheme } from '../utils';

/**
 * Command Bar Component (CMD+K)
 * Global command palette for navigation and quick actions
 */
export default function CommandBar({ 
  students = [], 
  onNavigate, 
  onAddStudent, 
  onDraftEmail,
  onSelectStudent,
  onOpenA11y,
  isDark = true 
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const theme = getTheme(isDark);

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter students by name
  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Navigation actions
  const navigationActions = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: Home, action: () => { onNavigate?.('profile'); setOpen(false); } },
    { id: 'students', label: 'Go to Students', icon: Users, action: () => { onNavigate?.('roster'); setOpen(false); } },
    { id: 'settings', label: 'Go to Settings', icon: Settings, action: () => { onNavigate?.('settings'); setOpen(false); } },
    { id: 'a11y', label: 'Accessibility Settings', icon: Accessibility, action: () => { onOpenA11y?.(); setOpen(false); } },
  ];

  // Quick actions
  const quickActions = [
    { id: 'add-student', label: 'Add Student', icon: UserPlus, action: () => { onAddStudent?.(); setOpen(false); } },
    { id: 'draft-email', label: 'Draft Email', icon: Mail, action: () => { onDraftEmail?.(); setOpen(false); } },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      
      {/* Command Palette */}
      <Command 
        className={`relative z-10 w-full max-w-2xl ${theme.cardBg} border ${theme.cardBorder} rounded-2xl shadow-2xl overflow-hidden`}
        shouldFilter={false}
        data-tour="command-bar"
      >
        <div className={`flex items-center border-b ${theme.cardBorder} px-4`}>
          <Search className={`mr-2 ${theme.textMuted}`} size={20} />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search students..."
            className={`flex h-14 w-full bg-transparent ${theme.text} outline-none placeholder:${theme.textMuted} text-lg`}
            autoFocus
          />
          <button
            onClick={() => setOpen(false)}
            className={`p-2 rounded-lg hover:bg-slate-500/10 ${theme.textMuted} hover:${theme.text}`}
          >
            <X size={20} />
          </button>
        </div>

        <Command.List className={`max-h-[400px] overflow-y-auto p-2 ${theme.bg}`}>
          {/* Navigation Section */}
          {search === '' || search.toLowerCase().includes('go to') || search.toLowerCase().includes('navigate') ? (
            <Command.Group heading="Navigation" className={`px-2 py-1.5 text-xs font-bold uppercase ${theme.textMuted} mb-1`}>
              {navigationActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Command.Item
                    key={action.id}
                    onSelect={action.action}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${theme.text} hover:bg-slate-500/10 transition-colors`}
                  >
                    <Icon size={18} className={theme.textMuted} />
                    <span>{action.label}</span>
                    <ArrowRight size={16} className={`ml-auto ${theme.textMuted}`} />
                  </Command.Item>
                );
              })}
            </Command.Group>
          ) : null}

          {/* Quick Actions Section */}
          {search === '' || search.toLowerCase().includes('add') || search.toLowerCase().includes('draft') || search.toLowerCase().includes('email') ? (
            <Command.Group heading="Quick Actions" className={`px-2 py-1.5 text-xs font-bold uppercase ${theme.textMuted} mb-1 mt-2`}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Command.Item
                    key={action.id}
                    onSelect={action.action}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${theme.text} hover:bg-slate-500/10 transition-colors`}
                  >
                    <Icon size={18} className={theme.textMuted} />
                    <span>{action.label}</span>
                    <ArrowRight size={16} className={`ml-auto ${theme.textMuted}`} />
                  </Command.Item>
                );
              })}
            </Command.Group>
          ) : null}

          {/* Student Search Section */}
          {(search === '' || filteredStudents.length > 0) && (
            <Command.Group heading="Students" className={`px-2 py-1.5 text-xs font-bold uppercase ${theme.textMuted} mb-1 mt-2`}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <Command.Item
                    key={student.id}
                    onSelect={() => {
                      onSelectStudent?.(student.id);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${theme.text} hover:bg-slate-500/10 transition-colors`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-cyan-500/20 text-cyan-400`}>
                      {student.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className={`text-xs ${theme.textMuted}`}>
                        {student.grade} • {student.need || student.primaryNeed || 'N/A'}
                      </div>
                    </div>
                    <ArrowRight size={16} className={`ml-auto ${theme.textMuted}`} />
                  </Command.Item>
                ))
              ) : search !== '' ? (
                <div className={`px-3 py-4 text-center ${theme.textMuted} text-sm`}>
                  No students found matching "{search}"
                </div>
              ) : null}
            </Command.Group>
          )}

          {/* Empty State */}
          {search !== '' && filteredStudents.length === 0 && 
           !search.toLowerCase().includes('go to') && 
           !search.toLowerCase().includes('navigate') &&
           !search.toLowerCase().includes('add') &&
           !search.toLowerCase().includes('draft') && (
            <div className={`px-3 py-8 text-center ${theme.textMuted}`}>
              <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">Try "Go to Dashboard" or search for a student name</p>
            </div>
          )}
        </Command.List>

        {/* Footer Hint */}
        <div className={`border-t ${theme.cardBorder} px-4 py-2 flex items-center justify-between text-xs ${theme.textMuted}`}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'} border ${theme.cardBorder}`}>
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'} border ${theme.cardBorder}`}>
                Enter
              </kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'} border ${theme.cardBorder}`}>
              Esc
            </kbd>
            Close
          </span>
        </div>
      </Command>
    </div>
  );
}

