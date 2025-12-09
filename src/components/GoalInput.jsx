import React, { useState, useEffect, useRef } from 'react';
import { Target, Loader2, ChevronDown } from 'lucide-react';
import { GeminiService } from '../utils';
import { getTheme } from '../utils';

/**
 * Smart Goal Autocomplete Component
 * Provides AI-powered autocomplete suggestions for IEP goals
 */
export default function GoalInput({ 
  value, 
  onChange, 
  student, 
  isDark, 
  placeholder = "e.g. Student will decode...",
  className = ""
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimer = useRef(null);
  const theme = getTheme(isDark);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Trigger autocomplete when user types 3+ characters
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce API call
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Get student context
        const grade = student?.grade || 'Not specified';
        const diagnosis = student?.need || student?.primaryNeed || 'Not specified';

        // Call AI to generate goal suggestions
        const systemInstruction = `You are an expert IEP goal writer. Generate exactly 3 specific, SMART-formatted IEP goals related to the input keyword. Each goal should be appropriate for the student's grade level and diagnosis. Return ONLY a JSON array of strings, no markdown, no explanation:
["Goal 1", "Goal 2", "Goal 3"]`;

        const userPrompt = `Generate 3 SMART-formatted IEP goals related to "${value}" for a ${grade} student with ${diagnosis}.`;

        const fullPrompt = `${systemInstruction}\n\n---\n\n${userPrompt}`;
        const resultData = await GeminiService.fetchWithFallback(fullPrompt);
        const rawResult = resultData.candidates?.[0]?.content?.parts?.[0]?.text;

        // Try to parse JSON array from response
        let goalSuggestions = [];
        try {
          // Extract JSON array from response
          const jsonMatch = rawResult.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            goalSuggestions = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: split by lines and take first 3
            const lines = rawResult.split('\n').filter(line => line.trim().length > 0);
            goalSuggestions = lines.slice(0, 3).map(line => line.replace(/^[-*•]\s*/, '').trim());
          }
        } catch (parseError) {
          console.error('Error parsing goal suggestions:', parseError);
          // Fallback: try to extract goals from text
          const lines = rawResult.split('\n').filter(line => line.trim().length > 10);
          goalSuggestions = lines.slice(0, 3).map(line => line.replace(/^[-*•]\s*/, '').trim());
        }

        // Filter out empty suggestions
        goalSuggestions = goalSuggestions.filter(g => g && g.trim().length > 0);

        setSuggestions(goalSuggestions);
        setShowSuggestions(goalSuggestions.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Goal autocomplete error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, student]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSuggestions, suggestions, selectedIndex]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleSelectSuggestion = (suggestion) => {
    onChange({ target: { value: suggestion } });
    setShowSuggestions(false);
    setSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500 pr-10`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 size={16} className="animate-spin text-cyan-400" />
          </div>
        )}
        {!isLoading && suggestions.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronDown size={16} className={`text-cyan-400 ${showSuggestions ? 'rotate-180' : ''} transition-transform`} />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={`absolute z-50 w-full mt-1 ${theme.cardBg} border ${theme.cardBorder} rounded-lg shadow-xl max-h-60 overflow-y-auto`}
        >
          <div className="p-2">
            <div className={`text-xs font-bold ${theme.textMuted} uppercase mb-2 px-2`}>
              AI Suggestions
            </div>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                  selectedIndex === idx
                    ? `${theme.inputBg} border border-cyan-500/50`
                    : `${theme.textMuted} hover:${theme.inputBg} hover:${theme.text}`
                }`}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="flex items-start gap-2">
                  <Target size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

