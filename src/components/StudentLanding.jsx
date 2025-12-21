import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmilePlus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { getTheme } from '../utils';

export default function StudentLanding({ onBack, isDark }) {
  const theme = getTheme(isDark);
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accessCode.trim() || accessCode.trim().length !== 6) {
      setError('Please enter a valid 6-character access code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate access code via API
      const response = await fetch('/api/validate-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: accessCode.toUpperCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Invalid access code');
      }

      if (data.success && data.studentProfile && data.studentProfile.id) {
        // Store studentId in LocalStorage
        localStorage.setItem('studentId', data.studentProfile.id);
        localStorage.setItem('studentName', data.studentProfile.name || 'Student');
        
        // Redirect to Student Portal
        navigate('/student/portal');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Access code validation error:', err);
      setError(err.message || 'Failed to validate access code. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6 flex items-center justify-center`}>
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          {onBack && (
            <button 
              onClick={onBack} 
              className={`mb-6 flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors mx-auto`}
            >
              ← Back to Home
            </button>
          )}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20`}>
              <SmilePlus className="text-cyan-400" size={48} />
            </div>
          </div>
          <h1 className={`text-4xl font-bold ${theme.text} mb-4`}>
            Student Portal
          </h1>
          <p className={`${theme.textMuted} text-lg`}>
            Enter your access code to get started
          </p>
        </div>

        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 shadow-xl`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className={`block text-sm font-bold ${theme.textMuted} mb-2 uppercase tracking-wider`}>
                Enter your Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                  setAccessCode(value);
                  setError(''); // Clear error on input change
                }}
                placeholder="ABC123"
                className={`w-full p-4 text-center text-2xl font-bold tracking-widest rounded-xl border-2 ${
                  error ? 'border-red-500' : theme.inputBorder
                } ${theme.inputBg} ${theme.text} focus:border-cyan-500 outline-none transition-colors`}
                maxLength={6}
                autoComplete="off"
                autoFocus
                disabled={loading}
              />
              <p className={`text-xs ${theme.textMuted} mt-2 text-center`}>
                Your 6-character access code was provided by your teacher or parent
              </p>
            </div>

            {error && (
              <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3`}>
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !accessCode.trim() || accessCode.trim().length !== 6}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center space-y-3">
          <p className={`text-sm ${theme.textMuted} mb-4`}>
            Need help? Contact your teacher or parent for your access code.
          </p>
          <div className={`p-4 rounded-xl bg-slate-500/10 border ${theme.cardBorder}`}>
            <p className={`text-sm ${theme.textMuted} mb-2`}>
              Don't have an access code yet?
            </p>
            <button
              onClick={() => navigate('/student/portal')}
              className={`text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors`}
            >
              Continue without account →
            </button>
            <p className={`text-xs ${theme.textMuted} mt-2`}>
              You can explore all features, but progress won't be saved until you enter an access code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

