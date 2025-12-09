import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, ToggleLeft, ToggleRight, BarChart3 } from 'lucide-react';
import { getTheme } from '../utils';

/**
 * Student Progress Chart Component
 * Visual progress tracking for IEP goals with parent view toggle
 */
export default function StudentProgressChart({ 
  student, 
  isDark = true 
}) {
  const theme = getTheme(isDark);
  const [isParentView, setIsParentView] = useState(false);

  // Generate mock IEP goal progress data
  const progressData = useMemo(() => {
    if (!student) {
      return [];
    }

    // Mock data: 4 weeks of progress for a reading fluency goal
    // In a real app, this would come from actual progress tracking data
    const baseScore = 60; // Starting score
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    
    return weeks.map((week, index) => {
      // Simulate progress with some variance
      const progress = baseScore + (index * 8) + Math.random() * 5 - 2.5;
      return {
        week,
        score: Math.round(progress),
        target: 80, // Target score
      };
    });
  }, [student]);

  // Calculate trend
  const trend = useMemo(() => {
    if (progressData.length < 2) return null;
    const first = progressData[0].score;
    const last = progressData[progressData.length - 1].score;
    return last > first ? 'up' : last < first ? 'down' : 'stable';
  }, [progressData]);

  // Calculate average progress
  const averageProgress = useMemo(() => {
    if (progressData.length === 0) return 0;
    const sum = progressData.reduce((acc, point) => acc + point.score, 0);
    return Math.round(sum / progressData.length);
  }, [progressData]);

  // Parent-friendly labels
  const getParentLabel = (label) => {
    const parentLabels = {
      'Week 1': 'Start',
      'Week 2': '2 Weeks',
      'Week 3': '3 Weeks',
      'Week 4': 'Now',
    };
    return parentLabels[label] || label;
  };

  if (!student) {
    return (
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg`}>
        <p className={`text-center ${theme.textMuted}`}>Select a student to view progress</p>
      </div>
    );
  }

  return (
    <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30">
            <BarChart3 className="text-cyan-400" size={24} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${theme.text}`}>
              {isParentView ? 'Progress Overview' : 'IEP Goal Progress'}
            </h3>
            <p className={`text-sm ${theme.textMuted}`}>
              {student.name} • {isParentView ? 'Reading Skills' : 'Reading Fluency Goal'}
            </p>
          </div>
        </div>

        {/* Parent View Toggle */}
        <button
          onClick={() => setIsParentView(!isParentView)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.cardBorder} ${theme.inputBg} hover:bg-slate-500/10 transition-colors`}
        >
          {isParentView ? <ToggleRight className="text-cyan-400" size={18} /> : <ToggleLeft size={18} />}
          <span className={`text-xs font-bold uppercase ${theme.textMuted}`}>
            {isParentView ? 'Parent View' : 'Teacher View'}
          </span>
        </button>
      </div>

      {/* Trend Badge */}
      {trend && (
        <div className={`mb-4 flex items-center gap-2 ${
          trend === 'up' 
            ? 'text-emerald-400' 
            : trend === 'down' 
            ? 'text-red-400' 
            : 'text-amber-400'
        }`}>
          {trend === 'up' && <TrendingUp size={20} />}
          {trend === 'down' && <TrendingDown size={20} />}
          <span className={`text-sm font-bold ${
            isParentView 
              ? trend === 'up' 
                ? 'text-emerald-400' 
                : trend === 'down'
                ? 'text-red-400'
                : 'text-amber-400'
              : theme.text
          }`}>
            {isParentView 
              ? trend === 'up' 
                ? 'Trending Up! 🎉' 
                : trend === 'down'
                ? 'Needs Support'
                : 'Stable Progress'
              : trend === 'up'
              ? 'Positive Trend'
              : trend === 'down'
              ? 'Declining Trend'
              : 'Stable Trend'
            }
          </span>
        </div>
      )}

      {/* Chart */}
      {progressData.length > 0 ? (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="week" 
                stroke={theme.textMuted}
                tick={{ fill: theme.textMuted, fontSize: 12 }}
                tickFormatter={isParentView ? getParentLabel : undefined}
              />
              <YAxis 
                stroke={theme.textMuted}
                tick={{ fill: theme.textMuted, fontSize: 12 }}
                domain={[0, 100]}
                label={isParentView ? undefined : { value: 'Score (%)', angle: -90, position: 'insideLeft', fill: theme.textMuted }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  color: theme.text,
                }}
                labelStyle={{ color: theme.text, fontWeight: 'bold' }}
                formatter={(value, name) => {
                  if (isParentView) {
                    return name === 'score' ? [`${value}%`, 'Current Level'] : [`${value}%`, 'Goal'];
                  }
                  return [`${value}%`, name === 'score' ? 'Actual Score' : 'Target'];
                }}
              />
              <Legend 
                wrapperStyle={{ color: theme.text }}
                formatter={(value) => {
                  if (isParentView) {
                    return value === 'score' ? 'Current Level' : 'Goal';
                  }
                  return value === 'score' ? 'Actual Score' : 'Target';
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#06b6d4" 
                strokeWidth={3}
                dot={{ fill: '#06b6d4', r: 5 }}
                activeDot={{ r: 7 }}
                name="score"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#a855f7" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#a855f7', r: 4 }}
                name="target"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={`h-64 flex items-center justify-center border ${theme.cardBorder} rounded-xl ${theme.inputBg}`}>
          <p className={theme.textMuted}>No progress data available</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border ${theme.cardBorder} ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
          <p className={`text-xs font-bold uppercase ${theme.textMuted} mb-1`}>
            {isParentView ? 'Average Level' : 'Average Score'}
          </p>
          <p className={`text-2xl font-bold ${theme.text}`}>{averageProgress}%</p>
        </div>
        <div className={`p-4 rounded-xl border ${theme.cardBorder} ${isDark ? 'bg-fuchsia-500/10' : 'bg-fuchsia-50'}`}>
          <p className={`text-xs font-bold uppercase ${theme.textMuted} mb-1`}>
            {isParentView ? 'Goal' : 'Target Score'}
          </p>
          <p className={`text-2xl font-bold ${theme.text}`}>
            {progressData[0]?.target || 80}%
          </p>
        </div>
      </div>

      {/* Parent View Description */}
      {isParentView && (
        <div className={`mt-4 p-4 rounded-xl border ${theme.cardBorder} ${isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
          <p className={`text-sm ${theme.text} leading-relaxed`}>
            This chart shows {student.name}'s progress over the past month. The blue line shows their current level, 
            and the purple dashed line shows the goal we're working toward. 
            {trend === 'up' && ' Great progress! Keep up the excellent work!'}
            {trend === 'down' && ' We're providing additional support to help get back on track.'}
            {trend === 'stable' && ' Steady progress is being made toward the goal.'}
          </p>
        </div>
      )}
    </div>
  );
}

