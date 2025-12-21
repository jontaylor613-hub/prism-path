import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Brain, Heart, Calendar, FileText, MapPin, Briefcase, 
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles, 
  Activity, Target, LogOut
} from 'lucide-react';
import { getTheme } from '../utils';

export default function StudentPortal({ onBack, isDark, onToggleTheme }) {
  const theme = getTheme(isDark);
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState(null);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    // Check if student has an account
    const id = localStorage.getItem('studentId');
    const name = localStorage.getItem('studentName');
    
    if (id) {
      setStudentId(id);
      setHasAccount(true);
    }
    if (name) {
      setStudentName(name);
    }
    
    // Allow access even without account - all features are available
    // Only saving requires an account
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('studentId');
    localStorage.removeItem('studentName');
    setStudentId(null);
    setStudentName(null);
    setHasAccount(false);
    navigate('/student');
  };

  const features = [
    {
      id: 'neuro',
      title: 'Neuro Driver™',
      description: 'Task slicer and focus tools designed for neuro-divergent learners',
      icon: Brain,
      color: 'amber',
      path: '/neuro',
      requiresAccount: false,
      savesData: true
    },
    {
      id: 'transition',
      title: 'Future Ready',
      description: 'Career & transition planning with resume building and goal setting',
      icon: Briefcase,
      color: 'blue',
      path: '/transition-planning',
      requiresAccount: false,
      savesData: true
    },
    {
      id: 'cockpit',
      title: 'Emotional Cockpit',
      description: 'Tools for emotional regulation and sensory breaks',
      icon: Activity,
      color: 'indigo',
      path: '/cockpit',
      requiresAccount: false,
      savesData: false
    },
    {
      id: 'schedule',
      title: 'Visual Schedules',
      description: 'Create clear, structured visual timelines for your day',
      icon: Calendar,
      color: 'fuchsia',
      path: '/schedule',
      requiresAccount: false,
      savesData: false
    },
    {
      id: 'resume',
      title: 'Resume Builder',
      description: 'Build your resume with AI-powered suggestions',
      icon: FileText,
      color: 'cyan',
      path: '/resume',
      requiresAccount: false,
      savesData: false
    },
    {
      id: 'map',
      title: 'Social Map',
      description: 'Map your social connections and relationships',
      icon: MapPin,
      color: 'emerald',
      path: '/map',
      requiresAccount: false,
      savesData: false
    }
  ];

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {onBack && (
                <button 
                  onClick={onBack} 
                  className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}
                >
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20`}>
                  <Sparkles className="text-cyan-400" size={28} />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${theme.text}`}>Student Portal</h1>
                  <p className={`${theme.textMuted} text-sm`}>
                    {hasAccount && studentName 
                      ? `Welcome back, ${studentName}!`
                      : 'Explore all available tools'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {onToggleTheme && (
                <button 
                  onClick={onToggleTheme}
                  className={`p-2 rounded-full transition-all ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-slate-200 text-orange-500'}`}
                >
                  {isDark ? '🌙' : '☀️'}
                </button>
              )}
              {hasAccount && (
                <button
                  onClick={handleLogout}
                  className={`px-4 py-2 rounded-lg border ${theme.cardBorder} ${theme.textMuted} hover:${theme.text} transition-colors flex items-center gap-2`}
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              )}
            </div>
          </div>

          {/* Account Status Banner */}
          {hasAccount ? (
            <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 mb-6`}>
              <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className={`font-bold ${theme.text} mb-1`}>Account Connected</p>
                <p className={`text-sm ${theme.textMuted}`}>
                  Your progress will be saved automatically. All your data is secure and can be accessed from any device.
                </p>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 mb-6`}>
              <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className={`font-bold ${theme.text} mb-1`}>Using Without Account</p>
                <p className={`text-sm ${theme.textMuted} mb-3`}>
                  You can explore all features, but your progress won't be saved. Get an access code from your teacher or parent to save your work.
                </p>
                <Link 
                  to="/student"
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all`}
                >
                  Enter Access Code
                  <ArrowLeft size={16} className="rotate-180" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colorClasses = {
              amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
              blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
              indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
              fuchsia: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
              cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
              emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            };

            return (
              <Link
                key={feature.id}
                to={feature.path}
                className={`group relative p-1 rounded-2xl bg-gradient-to-b ${isDark ? 'from-slate-700 to-slate-800' : 'from-slate-200 to-slate-100'} hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-500 cursor-pointer block`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                <div className={`relative h-full ${theme.cardBg} rounded-xl p-6 flex flex-col border ${theme.cardBorder} group-hover:border-cyan-500/50 transition-colors`}>
                  {/* Icon */}
                  <div className={`p-3 rounded-lg ${colorClasses[feature.color]} mb-4 w-fit group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-xl font-bold ${theme.text} mb-2 group-hover:text-cyan-400 transition-colors`}>
                    {feature.title}
                  </h3>
                  <p className={`${theme.textMuted} text-sm leading-relaxed mb-4 flex-1`}>
                    {feature.description}
                  </p>

                  {/* Save Status Indicator */}
                  {feature.savesData && (
                    <div className={`mt-auto pt-4 border-t ${theme.cardBorder} flex items-center gap-2`}>
                      {hasAccount ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span className={`text-xs font-medium text-emerald-400`}>
                            Progress will be saved
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-amber-400" />
                          <span className={`text-xs font-medium text-amber-400`}>
                            Enter access code to save
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Section */}
        <div className={`mt-12 p-6 rounded-xl ${theme.cardBg} border ${theme.cardBorder}`}>
          <h2 className={`text-xl font-bold ${theme.text} mb-4`}>About Your Student Portal</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className={`font-bold ${theme.text} mb-2 flex items-center gap-2`}>
                <Sparkles size={18} className="text-cyan-400" />
                Full Access
              </h3>
              <p className={`${theme.textMuted} text-sm leading-relaxed`}>
                All tools and features are available to use right away. Explore, experiment, and find what works best for you - no restrictions!
              </p>
            </div>
            <div>
              <h3 className={`font-bold ${theme.text} mb-2 flex items-center gap-2`}>
                <CheckCircle2 size={18} className="text-emerald-400" />
                Save Your Progress
              </h3>
              <p className={`${theme.textMuted} text-sm leading-relaxed`}>
                Get an access code from your teacher or parent to save your work. Your progress will be saved automatically across all sessions.
              </p>
            </div>
            <div>
              <h3 className={`font-bold ${theme.text} mb-2 flex items-center gap-2`}>
                <Target size={18} className="text-fuchsia-400" />
                Safe & Secure
              </h3>
              <p className={`${theme.textMuted} text-sm leading-relaxed`}>
                Your data is protected and private. Only you and your authorized teachers or parents can access your saved information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

