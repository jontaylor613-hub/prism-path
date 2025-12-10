/**
 * Admin Dashboard Component
 * 
 * Manages staff and students within a school "bubble"
 * Only accessible to users with role === 'admin'
 */

import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, UserPlus, X, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { 
  getUsersBySchool, 
  getStudentsBySchool, 
  assignStudentToTeacher, 
  getUserById 
} from '../lib/mockStore';
import { getTheme } from '../utils';

// Demo data for demo mode
const DEMO_TEACHERS = [
  { uid: 'demo-teacher-1', name: 'Ms. Sarah Johnson', email: 'sarah.johnson@demoschool.edu', role: 'teacher', isActive: true },
  { uid: 'demo-teacher-2', name: 'Mr. Michael Chen', email: 'michael.chen@demoschool.edu', role: 'teacher', isActive: true },
  { uid: 'demo-teacher-3', name: 'Dr. Emily Rodriguez', email: 'emily.rodriguez@demoschool.edu', role: 'sped', isActive: true }
];

const DEMO_STUDENTS = [
  { 
    id: 'demo-student-1', 
    name: 'Alex Martinez', 
    grade: '3rd', 
    diagnosis: 'ADHD', 
    assignedTeacherIds: ['demo-teacher-1'],
    schoolId: 'demo-school'
  },
  { 
    id: 'demo-student-2', 
    name: 'Jordan Kim', 
    grade: '5th', 
    diagnosis: 'Dyslexia', 
    assignedTeacherIds: ['demo-teacher-2'],
    schoolId: 'demo-school'
  },
  { 
    id: 'demo-student-3', 
    name: 'Taylor Smith', 
    grade: '2nd', 
    diagnosis: 'Autism Spectrum', 
    assignedTeacherIds: [],
    schoolId: 'demo-school'
  },
  { 
    id: 'demo-student-4', 
    name: 'Morgan Lee', 
    grade: '4th', 
    diagnosis: 'Learning Disability', 
    assignedTeacherIds: ['demo-teacher-3'],
    schoolId: 'demo-school'
  }
];

export default function AdminDashboard({ user, theme, onBack }) {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Use theme from props or default
  const safeTheme = theme || getTheme(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [user, demoMode]);

  const loadData = () => {
    // Demo mode: show demo data
    if (demoMode) {
      setTeachers(DEMO_TEACHERS);
      setStudents(DEMO_STUDENTS);
      setLoading(false);
      return;
    }

    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    try {
      // Get all teachers in the school
      const schoolTeachers = getUsersBySchool(user.schoolId).filter(
        u => u.role === 'teacher' && u.isActive !== false
      );
      setTeachers(schoolTeachers);

      // Get all students in the school (admins can see all)
      const schoolStudents = getStudentsBySchool(user.schoolId);
      setStudents(schoolStudents);

      setLoading(false);
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      setLoading(false);
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedStudent || !selectedTeacherId) {
      return;
    }

    setIsAssigning(true);
    try {
      // Demo mode: simulate assignment
      if (demoMode) {
        setTimeout(() => {
          // Update demo students
          const updatedStudents = students.map(s => 
            s.id === selectedStudent.id
              ? { ...s, assignedTeacherIds: [...(s.assignedTeacherIds || []), selectedTeacherId] }
              : s
          );
          setStudents(updatedStudents);
          setSelectedStudent(null);
          setSelectedTeacherId('');
          alert(`Student "${selectedStudent.name}" has been assigned to teacher. (Demo Mode)`);
          setIsAssigning(false);
        }, 500);
        return;
      }

      // Use the assignStudentToTeacher function from mockStore
      const updatedStudent = assignStudentToTeacher(
        selectedStudent.id,
        selectedTeacherId,
        user.uid
      );

      if (updatedStudent) {
        // Refresh the students list
        loadData();
        
        // Close modal
        setSelectedStudent(null);
        setSelectedTeacherId('');
        
        // Show success feedback
        alert(`Student "${selectedStudent.name}" has been assigned to teacher.`);
      } else {
        alert('Failed to assign student. Please try again.');
      }
    } catch (error) {
      console.error('Error assigning student:', error);
      alert('Error assigning student. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const getAssignedTeachers = (student) => {
    if (!student.assignedTeacherIds || student.assignedTeacherIds.length === 0) {
      return [];
    }
    
    return student.assignedTeacherIds
      .map(teacherId => {
        const teacher = teachers.find(t => t.uid === teacherId);
        return teacher ? teacher.name : null;
      })
      .filter(name => name !== null);
  };

  if (loading) {
    return (
      <div className={`w-full ${safeTheme.cardBg} ${safeTheme.cardBorder} rounded-lg p-8 shadow-lg`}>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-cyan-600" size={24} />
          <p className={safeTheme.textMuted}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${safeTheme.cardBg} ${safeTheme.cardBorder} rounded-lg p-6 shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl font-bold ${safeTheme.text} flex items-center gap-2`}>
              <GraduationCap className="text-cyan-400" size={28} />
              Admin Dashboard
            </h2>
            {demoMode && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-xs font-bold uppercase tracking-widest">
                Demo Mode
              </span>
            )}
          </div>
          <p className={`text-sm ${safeTheme.textMuted} mt-1`}>
            Manage staff and student assignments for {demoMode ? 'Demo School' : (user?.schoolId || 'your school')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              demoMode
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg'
                : `${safeTheme.inputBg} ${safeTheme.text} border ${safeTheme.inputBorder} hover:opacity-80`
            }`}
          >
            <Zap size={16} />
            {demoMode ? 'Exit Demo' : 'Try Demo Mode'}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className={`px-4 py-2 rounded-lg ${safeTheme.textMuted} hover:${safeTheme.text} transition-colors`}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Staff (Teachers) */}
        <div className={`${safeTheme.cardBg} border ${safeTheme.cardBorder} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-cyan-400" size={20} />
            <h3 className={`font-semibold ${safeTheme.text}`}>Staff ({teachers.length})</h3>
          </div>
          
          {teachers.length === 0 ? (
            <div className={`text-center py-8 ${safeTheme.textMuted}`}>
              <UserPlus size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No teachers found in this school</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.uid}
                  className={`p-3 rounded-lg border ${safeTheme.cardBorder} ${safeTheme.inputBg} hover:border-cyan-400 transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${safeTheme.text}`}>{teacher.name}</p>
                      <p className={`text-xs ${safeTheme.textMuted}`}>{teacher.email || 'No email'}</p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${safeTheme.inputBg} ${safeTheme.textMuted}`}>
                      Teacher
                    </div>
                  </div>
                  {/* Count students assigned to this teacher */}
                  <div className={`text-xs mt-2 ${safeTheme.textMuted}`}>
                    {students.filter(s => s.assignedTeacherIds?.includes(teacher.uid)).length} student(s) assigned
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Students */}
        <div className={`${safeTheme.cardBg} border ${safeTheme.cardBorder} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="text-fuchsia-400" size={20} />
            <h3 className={`font-semibold ${safeTheme.text}`}>Students ({students.length})</h3>
          </div>
          
          {students.length === 0 ? (
            <div className={`text-center py-8 ${safeTheme.textMuted}`}>
              <GraduationCap size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No students in this school</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {students.map((student) => {
                const isUnassigned = !student.assignedTeacherIds || student.assignedTeacherIds.length === 0;
                const assignedTeachers = getAssignedTeachers(student);
                
                return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border ${safeTheme.cardBorder} ${safeTheme.inputBg} hover:border-cyan-400 transition-colors cursor-pointer`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${safeTheme.text}`}>{student.name}</p>
                          {isUnassigned && (
                            <span className={`text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200`}>
                              Unassigned
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${safeTheme.textMuted}`}>
                          Grade: {student.grade || 'N/A'} • {student.diagnosis || 'No diagnosis'}
                        </p>
                        {assignedTeachers.length > 0 && (
                          <p className={`text-xs mt-1 ${safeTheme.textMuted}`}>
                            Assigned to: {assignedTeachers.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Student Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md ${safeTheme.cardBg} border ${safeTheme.cardBorder} rounded-lg p-6 shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${safeTheme.text}`}>
                Assign Student
              </h3>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedTeacherId('');
                }}
                className={`${safeTheme.textMuted} hover:${safeTheme.text}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className={`${safeTheme.text} mb-2`}>
                Assign <span className="font-semibold">{selectedStudent.name}</span> to a teacher:
              </p>
              
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className={`w-full ${safeTheme.inputBg} border ${safeTheme.inputBorder} rounded-lg p-3 ${safeTheme.text} outline-none focus:border-cyan-500`}
              >
                <option value="">Select a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.uid} value={teacher.uid}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent.assignedTeacherIds && selectedStudent.assignedTeacherIds.length > 0 && (
              <div className={`mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200`}>
                <p className={`text-sm text-amber-800`}>
                  <AlertCircle size={16} className="inline mr-1" />
                  This student is currently assigned to other teachers. 
                  This action will add an additional assignment.
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedTeacherId('');
                }}
                className={`px-4 py-2 rounded-lg ${safeTheme.textMuted} hover:${safeTheme.text} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStudent}
                disabled={!selectedTeacherId || isAssigning}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  !selectedTeacherId || isAssigning
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-95'
                }`}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="inline animate-spin mr-2" size={16} />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="inline mr-2" />
                    Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
