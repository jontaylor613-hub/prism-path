import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { getTheme } from '../utils';

/**
 * Feedback Collector Component
 * Provides thumbs up/down buttons with comment input for negative feedback
 * 
 * @param {string} responseId - Unique identifier for the AI response
 * @param {Function} onFeedbackSubmit - Callback function(type, comment, responseId)
 * @param {boolean} isDark - Dark mode flag
 * @param {string} className - Additional CSS classes
 */
export default function FeedbackButtons({ 
  responseId, 
  onFeedbackSubmit, 
  isDark, 
  className = '' 
}) {
  const [feedbackType, setFeedbackType] = useState(null); // 'positive' | 'negative' | null
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const theme = getTheme(isDark);

  const handleThumbsUp = () => {
    setFeedbackType('positive');
    setShowCommentInput(false);
    setComment('');
    
    // Submit feedback
    const feedbackData = { type: 'positive' };
    console.log('Feedback submitted:', { responseId, ...feedbackData });
    
    if (onFeedbackSubmit) {
      onFeedbackSubmit('positive', '', responseId);
    }
  };

  const handleThumbsDown = () => {
    setFeedbackType('negative');
    setShowCommentInput(true);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      const feedbackData = { type: 'negative', comment: comment.trim() };
      console.log('Feedback submitted:', { responseId, ...feedbackData });
      
      if (onFeedbackSubmit) {
        onFeedbackSubmit('negative', comment.trim(), responseId);
      }
      
      // Reset after submission
      setComment('');
      setShowCommentInput(false);
    }
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit(e);
    }
    if (e.key === 'Escape') {
      setShowCommentInput(false);
      setComment('');
      setFeedbackType(null);
    }
  };

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {/* Feedback Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleThumbsUp}
          className={`p-2 rounded-lg transition-all duration-200 ${
            feedbackType === 'positive'
              ? 'bg-emerald-500/20 border-2 border-emerald-500'
              : `${theme.cardBg} border ${theme.cardBorder} hover:border-emerald-500/50`
          }`}
          aria-label="Positive feedback"
        >
          <ThumbsUp 
            size={18} 
            className={
              feedbackType === 'positive'
                ? 'text-emerald-400'
                : theme.textMuted
            }
          />
        </button>

        <button
          onClick={handleThumbsDown}
          className={`p-2 rounded-lg transition-all duration-200 ${
            feedbackType === 'negative'
              ? 'bg-red-500/20 border-2 border-red-500'
              : `${theme.cardBg} border ${theme.cardBorder} hover:border-red-500/50`
          }`}
          aria-label="Negative feedback"
        >
          <ThumbsDown 
            size={18} 
            className={
              feedbackType === 'negative'
                ? 'text-red-400'
                : theme.textMuted
            }
          />
        </button>
      </div>

      {/* Comment Input (shown on thumbs down) */}
      {showCommentInput && (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleCommentKeyDown}
            placeholder="How can we improve?"
            className={`flex-1 ${theme.inputBg} border ${theme.inputBorder} rounded-lg px-3 py-2 text-sm ${theme.text} outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20`}
            autoFocus
          />
          <button
            onClick={handleCommentSubmit}
            disabled={!comment.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              comment.trim()
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : `${theme.inputBg} ${theme.textMuted} cursor-not-allowed`
            }`}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

