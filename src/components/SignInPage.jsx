import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/react';
import { getTheme } from '../utils';

export default function SignInPage({ onBack, isDark = true }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = getTheme(isDark);
  const redirect = searchParams.get('redirect') || '/educator';
  const signUpUrl = searchParams.get('type') === 'parent' ? '/signup?type=parent' : '/signup?type=educator';

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4`}>
      <div className="mb-4">
        <button
          onClick={() => (onBack ? onBack() : navigate('/'))}
          className={`text-sm ${theme.textMuted} hover:${theme.text} uppercase font-bold tracking-widest`}
        >
          ← Back to Home
        </button>
      </div>
      <SignIn
        signUpUrl={signUpUrl}
        forceRedirectUrl={redirect}
        appearance={{
          baseTheme: isDark ? undefined : undefined,
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
    </div>
  );
}
