import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { GeminiService } from '../utils';
import { getTheme } from '../utils';

/**
 * Sentiment Shield Component
 * Analyzes email draft text for tone issues and provides suggestions
 */
export default function ToneCheck({ text, isDark, onToneUpdate }) {
  const [toneAnalysis, setToneAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debounceTimer = useRef(null);
  const theme = getTheme(isDark);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't analyze if text is too short
    if (!text || text.trim().length < 10) {
      setToneAnalysis(null);
      return;
    }

    // Debounce: wait 1 second after typing stops
    debounceTimer.current = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        // Call AI for tone analysis using the 'tone' type
        const rawResult = await GeminiService.generate(
          { text: text },
          'tone'
        );

        // Try to parse JSON from response
        let analysis;
        try {
          // Extract JSON from response (might have markdown code blocks)
          const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found');
          }
        } catch (parseError) {
          // Fallback: try to extract score from text
          const scoreMatch = rawResult.match(/score["\s:]*(\d+)/i);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
          analysis = {
            score: score,
            flaggedPhrases: [],
            betterAlternatives: []
          };
        }

        setToneAnalysis(analysis);
        if (onToneUpdate) {
          onToneUpdate(analysis);
        }
      } catch (error) {
        console.error('Tone analysis error:', error);
        setToneAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000); // 1 second debounce

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [text, onToneUpdate]);

  if (!text || text.trim().length < 10) {
    return null; // Don't show anything for very short text
  }

  if (isAnalyzing) {
    return (
      <div className={`flex items-center gap-2 text-xs ${theme.textMuted} mt-2`}>
        <Loader2 size={14} className="animate-spin text-cyan-400" />
        <span>Analyzing tone...</span>
      </div>
    );
  }

  if (!toneAnalysis) {
    return null;
  }

  const { score, flaggedPhrases, betterAlternatives } = toneAnalysis;
  const isSafe = score < 3;
  const isRisky = score > 5;

  return (
    <div className={`mt-2 p-3 rounded-lg border ${
      isSafe 
        ? 'bg-emerald-900/20 border-emerald-500/30' 
        : isRisky 
        ? 'bg-red-900/20 border-red-500/30' 
        : 'bg-amber-900/20 border-amber-500/30'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {isSafe ? (
          <>
            <CheckCircle size={16} className="text-emerald-400" />
            <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Tone: Safe ✓
            </span>
          </>
        ) : isRisky ? (
          <>
            <AlertTriangle size={16} className="text-red-400" />
            <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              Tone: Risky (Score: {score}/10)
            </span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} className="text-amber-400" />
            <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              Tone: Caution (Score: {score}/10)
            </span>
          </>
        )}
      </div>

      {flaggedPhrases && flaggedPhrases.length > 0 && (
        <div className="mb-2">
          <p className={`text-xs font-medium ${theme.textMuted} mb-1`}>Flagged Phrases:</p>
          <ul className="list-disc list-inside text-xs space-y-1">
            {flaggedPhrases.map((phrase, idx) => (
              <li key={idx} className={theme.text}>{phrase}</li>
            ))}
          </ul>
        </div>
      )}

      {betterAlternatives && betterAlternatives.length > 0 && (
        <div>
          <p className={`text-xs font-medium ${theme.textMuted} mb-1`}>Suggestions:</p>
          <ul className="list-disc list-inside text-xs space-y-1">
            {betterAlternatives.map((alt, idx) => (
              <li key={idx} className={theme.text}>{alt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

