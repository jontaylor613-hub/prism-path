import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Plus, Minus, Loader2, AlertCircle } from 'lucide-react';
import { getStudentByToken, getStudentGoals, saveProgressData } from '../studentData';
import { showToast } from '../utils/toast';

/**
 * QuickTrack Page Component
 * Mobile-first page for rapid data collection via QR code
 * No authentication required - protected by secure token
 */
export default function QuickTrack({ isDark = false }) {
  const { token } = useParams();
  const [student, setStudent] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});
  const [counters, setCounters] = useState({});

  // Load student and goals
  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setError('Invalid token');
        setLoading(false);
        return;
      }

      try {
        const studentData = await getStudentByToken(token);
        if (!studentData) {
          setError('Student not found or token invalid');
          setLoading(false);
          return;
        }

        setStudent(studentData);

        // Load goals (using public access - no userId required for token-based access)
        try {
          const studentGoals = await getStudentGoals(studentData.id, 'system');
          const activeGoals = studentGoals.filter(g => !g.isCompleted && !g.isArchived);
          setGoals(activeGoals);
          
          // Initialize counters
          const initialCounters = {};
          activeGoals.forEach(goal => {
            initialCounters[goal.id] = 0;
          });
          setCounters(initialCounters);
        } catch (goalError) {
          console.error('Error loading goals:', goalError);
          // Continue even if goals fail to load
        }
      } catch (err) {
        console.error('Error loading student:', err);
        setError(err.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleYesNo = async (goalId, value) => {
    if (saving[goalId]) return;

    setSaving(prev => ({ ...prev, [goalId]: true }));
    try {
      await saveProgressData(student.id, goalId, value, {
        type: 'yes_no',
        recordedAt: new Date().toISOString()
      });
      showToast('Saved!', 'success');
    } catch (error) {
      console.error('Error saving progress:', error);
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const handleCounter = async (goalId, delta) => {
    if (saving[goalId]) return;

    const newValue = (counters[goalId] || 0) + delta;
    if (newValue < 0) return;

    setCounters(prev => ({ ...prev, [goalId]: newValue }));
    
    setSaving(prev => ({ ...prev, [goalId]: true }));
    try {
      await saveProgressData(student.id, goalId, newValue, {
        type: 'counter',
        recordedAt: new Date().toISOString()
      });
      showToast('Saved!', 'success');
    } catch (error) {
      console.error('Error saving progress:', error);
      showToast('Failed to save. Please try again.', 'error');
      // Revert counter on error
      setCounters(prev => ({ ...prev, [goalId]: (prev[goalId] || 0) - delta }));
    } finally {
      setSaving(prev => ({ ...prev, [goalId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="animate-spin text-cyan-500 mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">{error || 'Student not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Tracking for {student.name}
          </h1>
          {student.grade && (
            <p className="text-sm text-slate-600">Grade {student.grade}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-slate-600">No active goals to track</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const goalText = goal.description || goal.text || goal.title || 'Goal';
              const isSaving = saving[goal.id];
              const counterValue = counters[goal.id] || 0;

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200"
                >
                  {/* Goal Title */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {goalText}
                  </h3>

                  {/* Yes/No Buttons */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-3 font-medium">
                      Quick Check:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleYesNo(goal.id, 1)}
                        disabled={isSaving}
                        className={`
                          flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg
                          transition-all transform active:scale-95
                          ${isSaving
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl'
                          }
                        `}
                      >
                        {isSaving ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            <CheckCircle size={24} />
                            Yes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleYesNo(goal.id, 0)}
                        disabled={isSaving}
                        className={`
                          flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg
                          transition-all transform active:scale-95
                          ${isSaving
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl'
                          }
                        `}
                      >
                        {isSaving ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            <XCircle size={24} />
                            No
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Counter */}
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-3 font-medium">
                      Count:
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleCounter(goal.id, -1)}
                        disabled={isSaving || counterValue === 0}
                        className={`
                          p-3 rounded-xl font-bold text-xl
                          transition-all transform active:scale-95
                          ${isSaving || counterValue === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-600 text-white hover:bg-slate-700 shadow-md'
                          }
                        `}
                      >
                        <Minus size={24} />
                      </button>
                      <div className="min-w-[80px] text-center">
                        <span className="text-3xl font-bold text-slate-900">
                          {counterValue}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCounter(goal.id, 1)}
                        disabled={isSaving}
                        className={`
                          p-3 rounded-xl font-bold text-xl
                          transition-all transform active:scale-95
                          ${isSaving
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-md'
                          }
                        `}
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <p className="text-sm text-slate-600 text-center">
            Data is saved automatically. You can close this page at any time.
          </p>
        </div>
      </div>
    </div>
  );
}

