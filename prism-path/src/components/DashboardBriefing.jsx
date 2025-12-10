import React, { useMemo } from 'react';
import { 
  Calendar, AlertCircle, Users, TrendingUp, 
  ArrowRight, Sparkles, Clock
} from 'lucide-react';
import { getTheme } from '../utils';

/**
 * Morning Briefing Component
 * Smart dashboard widget that scans student data for deadlines and priorities
 */
export default function DashboardBriefing({ students = [], isDark = true, onReviewNow }) {
  const theme = getTheme(isDark);

  // Calculate briefing data
  const briefingData = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    let upcomingIepReviews = 0;
    let unassignedStudents = 0;
    let recentBehaviorLogs = 0;
    const upcomingDeadlines = [];

    students.forEach((student) => {
      // Check IEP Review Dates (within 7 days)
      const iepDate = student.nextIep || student.nextIepDate;
      if (iepDate) {
        const reviewDate = new Date(iepDate);
        if (reviewDate >= now && reviewDate <= sevenDaysFromNow) {
          upcomingIepReviews++;
          upcomingDeadlines.push({
            type: 'IEP Review',
            student: student.name,
            date: iepDate,
            daysUntil: Math.ceil((reviewDate - now) / (1000 * 60 * 60 * 24))
          });
        }
      }

      // Check for unassigned students (no IEP or 504 plan)
      if (!student.nextIep && !student.nextIepDate && !student.next504 && !student.next504Date) {
        unassignedStudents++;
      }

      // Simulate recent behavior logs (mock data - in real app, this would come from behavior logs)
      // For demo purposes, we'll check if student has behaviorPlan flag
      if (student.behaviorPlan) {
        recentBehaviorLogs++;
      }
    });

    // Generate AI-simulated greeting
    const hour = now.getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
    } else if (hour >= 17) {
      greeting = 'Good Evening';
    }

    const greetingMessage = `${greeting}. You have ${upcomingIepReviews} upcoming IEP review${upcomingIepReviews !== 1 ? 's' : ''} and ${unassignedStudents} unassigned student${unassignedStudents !== 1 ? 's' : ''}.`;

    return {
      greeting,
      greetingMessage,
      upcomingIepReviews,
      unassignedStudents,
      recentBehaviorLogs,
      upcomingDeadlines: upcomingDeadlines.slice(0, 3) // Show top 3
    };
  }, [students]);

  const hasPriorityItems = briefingData.upcomingIepReviews > 0 || briefingData.unassignedStudents > 0;

  return (
    <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg relative overflow-hidden`}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-fuchsia-500/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30">
              <Sparkles className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme.text}`}>Morning Briefing</h2>
              <p className={`text-sm ${theme.textMuted}`}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* AI Greeting */}
        <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'} border ${theme.cardBorder}`}>
          <p className={`${theme.text} text-lg leading-relaxed`}>
            {briefingData.greetingMessage}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Upcoming IEP Reviews */}
          <div className={`p-4 rounded-xl border ${theme.cardBorder} ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'} ${briefingData.upcomingIepReviews > 0 ? 'border-amber-500/30' : ''}`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`${briefingData.upcomingIepReviews > 0 ? 'text-amber-400' : theme.textMuted}`} size={20} />
              <span className={`text-sm font-bold uppercase tracking-wider ${theme.textMuted}`}>IEP Reviews</span>
            </div>
            <p className={`text-3xl font-bold ${briefingData.upcomingIepReviews > 0 ? 'text-amber-400' : theme.text}`}>
              {briefingData.upcomingIepReviews}
            </p>
            <p className={`text-xs ${theme.textMuted} mt-1`}>Due in next 7 days</p>
          </div>

          {/* Unassigned Students */}
          <div className={`p-4 rounded-xl border ${theme.cardBorder} ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} ${briefingData.unassignedStudents > 0 ? 'border-blue-500/30' : ''}`}>
            <div className="flex items-center gap-3 mb-2">
              <Users className={`${briefingData.unassignedStudents > 0 ? 'text-blue-400' : theme.textMuted}`} size={20} />
              <span className={`text-sm font-bold uppercase tracking-wider ${theme.textMuted}`}>Unassigned</span>
            </div>
            <p className={`text-3xl font-bold ${briefingData.unassignedStudents > 0 ? 'text-blue-400' : theme.text}`}>
              {briefingData.unassignedStudents}
            </p>
            <p className={`text-xs ${theme.textMuted} mt-1`}>Need plan assignment</p>
          </div>

          {/* Recent Activity */}
          <div className={`p-4 rounded-xl border ${theme.cardBorder} ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className={theme.textMuted} size={20} />
              <span className={`text-sm font-bold uppercase tracking-wider ${theme.textMuted}`}>Activity</span>
            </div>
            <p className={`text-3xl font-bold ${theme.text}`}>
              {briefingData.recentBehaviorLogs}
            </p>
            <p className={`text-xs ${theme.textMuted} mt-1`}>Recent behavior logs</p>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {briefingData.upcomingDeadlines.length > 0 && (
          <div className="mb-6">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textMuted} mb-3`}>Upcoming Deadlines</h3>
            <div className="space-y-2">
              {briefingData.upcomingDeadlines.map((deadline, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${theme.cardBorder} ${isDark ? 'bg-amber-500/5' : 'bg-amber-50/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-amber-400" size={16} />
                    <div>
                      <p className={`text-sm font-medium ${theme.text}`}>{deadline.student}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{deadline.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={theme.textMuted} size={14} />
                    <span className={`text-xs font-bold ${theme.textMuted}`}>
                      {deadline.daysUntil === 0 ? 'Today' : `${deadline.daysUntil} day${deadline.daysUntil !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Button */}
        {hasPriorityItems && (
          <button
            onClick={onReviewNow}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl font-bold shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Review Now</span>
            <ArrowRight size={18} />
          </button>
        )}

        {/* No Priority Items State */}
        {!hasPriorityItems && (
          <div className={`text-center py-4 ${theme.textMuted}`}>
            <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">All caught up! No urgent items.</p>
          </div>
        )}
      </div>
    </div>
  );
}

