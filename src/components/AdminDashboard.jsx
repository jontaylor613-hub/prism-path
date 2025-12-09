import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, UserPlus, AlertCircle, X, Check } from 'lucide-react';
import { getTheme } from '../utils';
import { MockStore } from '../lib/mockStore';

/**
 * Admin Dashboard Component
 * Split-view dashboard for managing teachers and students
 * Protected by role === 'admin'
 */
export default function AdminDashboard({ user, isDark, onBack }) {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [loading, setLoading] = useState(true);
  const theme = getTheme(isDark);

  // Security check: only admins can access
  useEffect(() => {
    if (user?.role !== 'admin') {
      console.warn('Unauthorized: Admin access required');
      if (onBack) onBack();
    }
  }, [user, onBack]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user || user.role !== 'admin') return;
    
    setLoading(true);
    try {
      // Load teachers in the same school
      const allTeachers = await MockStore.getUsersBySchool(user.schoolId);
      const teacherList = allTeachers.filter(u => u.role === 'teacher');
      setTeachers(teacherList);

      // Load students in the same school
      const allStudents = await MockStore.getStudentsBySchool(user.schoolId);
      setStudents(allStudents);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedStudent || !selectedTeacherId) return;

    try {
      await MockStore.assignStudentToTeacher(
        selectedStudent.id,
        selectedTeacherId,
        user.uid
      );
      
      // Reload data
      await loadData();
      setShowAssignModal(false);
      setSelectedStudent(null);
      setSelectedTeacherId('');
    } catch (error) {
      console.error('Error assigning student:', error);
      alert('Failed to assign student. Please try again.');
    }
  };

  const getUnassignedStudents = () => {
    return students.filter(s => !s.assignedTeacherIds || s.assignedTeacherIds.length === 0);
  };

  if (user?.role !== 'admin') {
    return null; // Don't render if not admin
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Admin Dashboard</h1>
            <p className={theme.textMuted}>Manage teachers and student assignments</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className={`px-4 py-2 rounded-lg ${theme.cardBg} border ${theme.cardBorder} hover:opacity-80 transition-opacity`}
            >
              Back
            </button>
          )}
        </div>

        {loading ? (
          <div className={`text-center py-12 ${theme.textMuted}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Teachers */}
            <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-lg p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-cyan-400" size={24} />
                <h2 className={`text-xl font-bold ${theme.text}`}>Teachers</h2>
                <span className={`px-2 py-1 rounded text-xs ${theme.textMuted} bg-slate-700/50`}>
                  {teachers.length}
                </span>
              </div>

              {teachers.length === 0 ? (
                <div className={`text-center py-8 ${theme.textMuted}`}>
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No teachers in this school</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.uid}
                      className={`p-3 rounded-lg ${theme.inputBg} border ${theme.inputBorder} flex items-center justify-between`}
                    >
                      <div>
                        <p className={`font-medium ${theme.text}`}>{teacher.name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>{teacher.email}</p>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${theme.textMuted} bg-slate-700/50`}>
                        {students.filter(s => s.assignedTeacherIds?.includes(teacher.uid)).length} students
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Students */}
            <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-lg p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-fuchsia-400" size={24} />
                <h2 className={`text-xl font-bold ${theme.text}`}>Students</h2>
                <span className={`px-2 py-1 rounded text-xs ${theme.textMuted} bg-slate-700/50`}>
                  {students.length}
                </span>
              </div>

              {students.length === 0 ? (
                <div className={`text-center py-8 ${theme.textMuted}`}>
                  <GraduationCap size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No students in this school</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {students.map((student) => {
                    const isUnassigned = !student.assignedTeacherIds || student.assignedTeacherIds.length === 0;
                    return (
                      <div
                        key={student.id}
                        className={`p-3 rounded-lg ${theme.inputBg} border ${isUnassigned ? 'border-amber-500/50' : theme.inputBorder} flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowAssignModal(true);
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${theme.text}`}>{student.name}</p>
                            {isUnassigned && (
                              <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Unassigned
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {student.diagnosis || 'No diagnosis'} • Grade {student.grade || 'N/A'}
                          </p>
                          {student.assignedTeacherIds && student.assignedTeacherIds.length > 0 && (
                            <p className={`text-xs ${theme.textMuted} mt-1`}>
                              Assigned to {student.assignedTeacherIds.length} teacher(s)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Unassigned Badge Summary */}
              {getUnassignedStudents().length > 0 && (
                <div className={`mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2`}>
                  <AlertCircle className="text-amber-400" size={16} />
                  <p className={`text-sm ${theme.text}`}>
                    {getUnassignedStudents().length} student(s) need assignment
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assign Student Modal */}
        {showAssignModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-lg p-6 max-w-md w-full`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${theme.text}`}>Assign Student</h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStudent(null);
                    setSelectedTeacherId('');
                  }}
                  className={`p-1 rounded ${theme.inputBg} hover:opacity-80`}
                >
                  <X size={20} className={theme.text} />
                </button>
              </div>

              <div className="mb-4">
                <p className={`${theme.text} mb-2`}>
                  Assign <strong>{selectedStudent.name}</strong> to a teacher:
                </p>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-2 ${theme.text} outline-none focus:border-cyan-500`}
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.uid} value={teacher.uid}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAssignStudent}
                  disabled={!selectedTeacherId}
                  className={`flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  <Check size={16} />
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStudent(null);
                    setSelectedTeacherId('');
                  }}
                  className={`px-4 py-2 rounded-lg ${theme.inputBg} border ${theme.inputBorder} ${theme.text} hover:opacity-80 transition-opacity`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

