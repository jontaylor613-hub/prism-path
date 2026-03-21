import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, UploadCloud, User, Wand2, Target } from 'lucide-react';
import { getTheme } from '../utils';

export default function LandingPage({ isDark, setIsDark }) {
  const theme = getTheme(isDark);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans`}>
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Nav */}
      <nav className={`relative z-10 border-b ${theme.cardBorder} ${theme.navBg} backdrop-blur-md`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-cyan-400" size={24} />
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-fuchsia-500">
              PrismPath
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/educator"
              className={`text-sm font-medium ${theme.textMuted} hover:${theme.text} transition-colors`}
            >
              Sign In
            </Link>
            <Link
              to="/signup?type=educator"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full text-sm font-bold shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-16 lg:pt-28 lg:pb-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight ${theme.text} mb-6`}>
          IEP Accommodations, Generated in Seconds
        </h1>
        <p className={`text-xl md:text-2xl ${theme.textMuted} leading-relaxed mb-10 max-w-3xl mx-auto`}>
          PrismPath helps special education teachers generate student-specific, FERPA-compliant
          accommodation plans using AI — so you can spend less time on paperwork and more time teaching.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/signup?type=educator"
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full text-base font-bold shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Start Free Trial
          </Link>
          <Link
            to="/educator?demo=true"
            className={`px-8 py-4 rounded-full font-bold border ${theme.cardBorder} hover:bg-slate-500/10 transition-all`}
          >
            Request a Demo
          </Link>
        </div>
      </section>

      {/* 4-Step Workflow */}
      <section className={`relative z-10 py-16 ${isDark ? 'bg-slate-900/50' : 'bg-slate-100/50'} border-y ${theme.cardBorder}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className={`text-2xl font-bold ${theme.text} mb-12 text-center`}>
            Simple 4-Step Workflow
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className={`w-14 h-14 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} flex items-center justify-center mx-auto mb-4`}>
                <UploadCloud className="text-cyan-400" size={28} />
              </div>
              <h3 className={`font-bold ${theme.text} mb-2`}>1. Upload Roster</h3>
              <p className={`text-sm ${theme.textMuted}`}>Import your student roster via CSV or add students individually.</p>
            </div>
            <div className="text-center">
              <div className={`w-14 h-14 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} flex items-center justify-center mx-auto mb-4`}>
                <User className="text-cyan-400" size={28} />
              </div>
              <h3 className={`font-bold ${theme.text} mb-2`}>2. Select Student</h3>
              <p className={`text-sm ${theme.textMuted}`}>Choose a student and view their profile and IEP summary.</p>
            </div>
            <div className="text-center">
              <div className={`w-14 h-14 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} flex items-center justify-center mx-auto mb-4`}>
                <Wand2 className="text-fuchsia-400" size={28} />
              </div>
              <h3 className={`font-bold ${theme.text} mb-2`}>3. Generate Accommodations</h3>
              <p className={`text-sm ${theme.textMuted}`}>AI generates tailored accommodation suggestions in seconds.</p>
            </div>
            <div className="text-center">
              <div className={`w-14 h-14 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} flex items-center justify-center mx-auto mb-4`}>
                <Target className="text-fuchsia-400" size={28} />
              </div>
              <h3 className={`font-bold ${theme.text} mb-2`}>4. Track IEP Goals</h3>
              <p className={`text-sm ${theme.textMuted}`}>Monitor progress and keep goals organized in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FERPA Badge */}
      <section className="relative z-10 py-12 px-4 sm:px-6">
        <div className={`max-w-2xl mx-auto ${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 flex items-center gap-6`}>
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="text-emerald-400" size={32} />
          </div>
          <div>
            <h3 className={`font-bold ${theme.text} mb-2`}>FERPA Compliant</h3>
            <p className={`text-sm ${theme.textMuted}`}>
              PrismPath is designed with student privacy in mind. Data is stored securely and handled
              in compliance with FERPA guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 ${isDark ? 'bg-slate-950 border-t border-slate-900' : 'bg-white border-t border-slate-100'} py-8`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className={`text-sm ${theme.textMuted}`}>&copy; {new Date().getFullYear()} PrismPath. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
