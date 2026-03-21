import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SignUp } from '@clerk/react';
import { Sparkles, Zap } from 'lucide-react';
import { getTheme } from '../utils';

export default function SignupPage({ onBack, isDark = true }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = getTheme(isDark);
  const userType = searchParams.get('type') || 'educator';
  const isParent = userType === 'parent';
  const afterSignUpUrl = isParent ? '/parent/dashboard' : '/educator';
  // Store intended role so auth can use it before Clerk metadata is set
  React.useEffect(() => {
    try { sessionStorage.setItem('prismpath_signup_role', isParent ? 'parent' : userType === 'educator' ? 'sped' : userType); } catch (_) {}
  }, [isParent, userType]);

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className={`${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-3xl p-8 shadow-2xl`}>
          <div className={`inline-flex items-center justify-center p-3 rounded-2xl ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-slate-200 to-slate-100 border-slate-300'} border mb-6 shadow-lg mx-auto`}>
            <Sparkles className="text-cyan-400" size={40} />
          </div>
          <h1 className={`text-3xl font-extrabold ${theme.text} mb-2 text-center`}>
            Prism<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">Path</span>
          </h1>
          <p className={`${theme.textMuted} font-medium mb-6 text-center`}>
            {isParent ? 'Parent Portal' : 'FERPA-Compliant Educator Portal'}
          </p>

          <SignUp
            signInUrl="/sign-in"
            forceRedirectUrl={afterSignUpUrl}
            appearance={{
              variables: {
                colorPrimary: '#06b6d4',
                colorBackground: isDark ? '#0f172a' : '#ffffff',
                colorText: isDark ? '#f1f5f9' : '#0f172a',
                colorInputBackground: isDark ? '#1e293b' : '#f8fafc',
                colorInputText: isDark ? '#f1f5f9' : '#0f172a',
                borderRadius: '0.75rem'
              }
            }}
          />

          {isParent && (
            <div className={`mt-6 pt-6 border-t ${theme.cardBorder}`}>
              <button
                onClick={() => navigate('/parent/dashboard?demo=true')}
                className={`w-full px-4 py-2 ${theme.inputBg} hover:opacity-80 border ${theme.inputBorder} hover:border-cyan-500/50 ${theme.text} hover:text-cyan-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2`}
              >
                <Zap size={16} className="text-cyan-400" />
                Try Demo Mode (No Account Required)
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(isParent ? '/signup?type=educator' : '/signup?type=parent')}
              className={`text-sm ${theme.textMuted} hover:text-cyan-400`}
            >
              {isParent ? 'Are you an educator? Sign up here' : 'Are you a parent? Sign up here'}
            </button>
          </div>

          <button
            onClick={() => (onBack ? onBack() : navigate('/'))}
            className={`mt-4 text-xs ${theme.textMuted} hover:${theme.text} uppercase font-bold tracking-widest block mx-auto`}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
