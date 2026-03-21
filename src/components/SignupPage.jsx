import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import { signUp, signIn, getCurrentUserProfile } from '../auth';
import { getTheme } from '../utils';
import { validatePassword } from '../lib/passwordValidator';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

// Shared Button component (simplified version)
const Button = ({ children, onClick, disabled, className = '', theme, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export default function SignupPage({ onBack, isDark = true }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userType = searchParams.get('type'); // 'parent' or 'educator'
  const isParent = userType === 'parent';
  const isEducator = userType === 'educator' || !userType; // Default to educator if no type

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: isParent ? 'parent' : 'regular_ed',
    school: '',
    schoolDistrict: ''
  });

  const theme = getTheme(isDark);

  // Real-time password validation
  useEffect(() => {
    if (formData.password) {
      const validation = validatePassword(formData.password);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password before submission
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError('Please fix password requirements before submitting.');
      setPasswordErrors(passwordValidation.errors);
      setLoading(false);
      return;
    }

    try {
      // Prepare signup data
      const signupData = isParent
        ? {
            name: formData.name,
            role: 'parent',
            school: '',
            schoolDistrict: '',
            schoolId: 'home_school' // Hardcoded for parents
          }
        : {
            name: formData.name,
            role: formData.role,
            school: formData.school,
            schoolDistrict: formData.schoolDistrict
          };

      await signUp(formData.email, formData.password, signupData);
      
      // After signup, automatically sign in
      const userCredential = await signIn(formData.email, formData.password);
      const profile = await getCurrentUserProfile(userCredential.user.uid);
      
      // Redirect based on role
      if (profile.role === 'parent') {
        navigate('/parent/dashboard');
      } else {
        navigate('/educator');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]"></div>
      <div className={`relative z-10 w-full max-w-md ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-3xl p-8 shadow-2xl`}>
        <div className={`inline-flex items-center justify-center p-3 rounded-2xl ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-slate-200 to-slate-100 border-slate-300'} border mb-6 shadow-lg mx-auto`}>
          <Sparkles className="text-cyan-400" size={40} />
        </div>
        <h1 className={`text-3xl font-extrabold ${theme.text} mb-2 text-center`}>
          Prism<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">Path</span>
        </h1>
        <p className={`${theme.textMuted} font-medium mb-6 text-center`}>
          {isParent ? 'Parent Portal' : 'FERPA-Compliant Educator Portal'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
              placeholder={isParent ? "Parent Name" : "Jane Doe"}
            />
          </div>

          {/* Role and School fields - only show for educators */}
          {isEducator && (
            <>
              <div>
                <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
                >
                  <option value="regular_ed">Regular Education Teacher</option>
                  <option value="sped">Special Education Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>School</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={e => setFormData({...formData, school: e.target.value})}
                  className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
                  placeholder="Lincoln Elementary"
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>School District</label>
                <input
                  type="text"
                  value={formData.schoolDistrict}
                  onChange={e => setFormData({...formData, schoolDistrict: e.target.value})}
                  className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
                  placeholder="Springfield School District"
                />
              </div>
            </>
          )}

          <div>
            <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
              placeholder={isParent ? "parent@email.com" : "teacher@school.edu"}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              minLength={12}
              className={`w-full ${theme.inputBg} border ${passwordErrors.length > 0 ? 'border-red-500' : theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
              placeholder="••••••••••••"
            />
            <p className={`text-xs ${theme.textMuted} mt-1`}>Minimum 12 characters with uppercase, lowercase, numbers, and symbols</p>
            <PasswordStrengthIndicator password={formData.password} isDark={isDark} />
            {passwordErrors.length > 0 && (
              <ul className={`mt-2 text-xs text-red-400 space-y-1`}>
                {passwordErrors.map((err, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span>•</span> {err}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {error && (
            <div className={`p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm`}>
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading} theme={theme}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
        
        {/* Demo Mode Button - Only show for parents */}
        {isParent && (
          <div className={`mt-6 pt-6 border-t ${theme.cardBorder}`}>
            <button 
              onClick={() => navigate('/parent/dashboard?demo=true')}
              className={`w-full px-4 py-2 ${theme.inputBg} hover:opacity-80 border ${theme.inputBorder} hover:border-cyan-500/50 ${theme.text} hover:text-cyan-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2`}
            >
              <Zap size={16} className="text-cyan-400" />
              Try Demo Mode (No Account Required)
            </button>
            <p className={`text-[10px] ${theme.textMuted} mt-2 text-center`}>Perfect for exploring the platform</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(isParent ? '/educator' : '/signup?type=parent')}
            className={`text-sm ${theme.textMuted} hover:text-cyan-400`}
          >
            {isParent ? "Are you an educator? Sign up here" : "Are you a parent? Sign up here"}
          </button>
        </div>
        
        <button
          onClick={onBack || (() => navigate('/'))}
          className={`mt-4 text-xs ${theme.textMuted} hover:${theme.text} uppercase font-bold tracking-widest block mx-auto`}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

