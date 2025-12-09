/**
 * Enhanced Mock Store
 * Comprehensive in-memory database for testing all features
 * Supports Schools, Users, Students with schoolId isolation
 */

// In-memory stores
let mockSchools = [];
let mockUsers = [];
let mockStudents = [];
// Wisdom Store: tracks accommodation strategy usage (strategyId -> count)
let wisdomStore = {};

// Initialize with sample data
export function initializeMockStore() {
  if (mockSchools.length === 0) {
    // Create default school
    const defaultSchool = {
      id: 'school-1',
      name: 'Demo School',
      adminIds: ['admin-1']
    };
    mockSchools.push(defaultSchool);

    // Create default admin user
    const defaultAdmin = {
      uid: 'admin-1',
      role: 'admin',
      schoolId: 'school-1',
      name: 'Admin User',
      email: 'admin@demo.school',
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    mockUsers.push(defaultAdmin);

    // Create sample teacher
    const sampleTeacher = {
      uid: 'teacher-1',
      role: 'teacher',
      schoolId: 'school-1',
      name: 'Jane Teacher',
      email: 'teacher@demo.school',
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    mockUsers.push(sampleTeacher);

    // Create sample student
    const sampleStudent = {
      id: 'student-1',
      name: 'Alex',
      diagnosis: 'ADHD',
      schoolId: 'school-1',
      assignedTeacherIds: ['teacher-1'],
      grade: '5',
      learnerProfile: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockStudents.push(sampleStudent);
  }
}

// ============================================================================
// SCHOOL OPERATIONS
// ============================================================================

export function createSchool(schoolData) {
  const newSchool = {
    id: schoolData.id || `school-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: schoolData.name,
    adminIds: schoolData.adminIds || []
  };
  mockSchools.push(newSchool);
  return newSchool;
}

export function getSchoolById(schoolId) {
  return mockSchools.find(s => s.id === schoolId) || null;
}

export function getAllSchools() {
  return [...mockSchools];
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export function createUser(userData) {
  const newUser = {
    uid: userData.uid || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: userData.role || 'teacher',
    schoolId: userData.schoolId || '',
    name: userData.name || '',
    email: userData.email || '',
    isActive: userData.isActive !== false,
    createdAt: userData.createdAt || new Date(),
    lastLogin: userData.lastLogin || new Date()
  };
  mockUsers.push(newUser);
  
  // If admin, add to school adminIds
  if (newUser.role === 'admin' && newUser.schoolId) {
    const school = getSchoolById(newUser.schoolId);
    if (school && !school.adminIds.includes(newUser.uid)) {
      school.adminIds.push(newUser.uid);
    }
  }
  
  return newUser;
}

export function getUserById(uid) {
  initializeMockStore();
  return mockUsers.find(u => u.uid === uid && u.isActive !== false) || null;
}

export function getUsersBySchool(schoolId) {
  initializeMockStore();
  return mockUsers.filter(u => u.schoolId === schoolId && u.isActive !== false);
}

export function updateUser(uid, updates) {
  const index = mockUsers.findIndex(u => u.uid === uid);
  if (index === -1) return null;
  
  mockUsers[index] = {
    ...mockUsers[index],
    ...updates,
    uid // Prevent UID changes
  };
  
  return mockUsers[index];
}

// ============================================================================
// STUDENT OPERATIONS
// ============================================================================

export function createStudent(studentData, userId) {
  initializeMockStore();
  
  const newStudent = {
    id: studentData.id || `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: studentData.name || '',
    diagnosis: studentData.diagnosis || '',
    schoolId: studentData.schoolId || '',
    assignedTeacherIds: studentData.assignedTeacherIds || [userId], // Auto-assign to creator
    grade: studentData.grade || '',
    learnerProfile: studentData.learnerProfile || null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  mockStudents.push(newStudent);
  return newStudent;
}

export function getStudentById(id) {
  initializeMockStore();
  return mockStudents.find(s => s.id === id && s.isActive !== false) || null;
}

export function getStudentsBySchool(schoolId) {
  initializeMockStore();
  return mockStudents.filter(s => s.schoolId === schoolId && s.isActive !== false);
}

export function getStudentsForUser(userId, userRole, schoolId) {
  initializeMockStore();
  
  let filtered = mockStudents.filter(s => s.schoolId === schoolId && s.isActive !== false);
  
  // Admins see all students in their school
  if (userRole === 'admin') {
    return filtered;
  }
  
  // Teachers only see assigned students
  if (userRole === 'teacher') {
    return filtered.filter(s => s.assignedTeacherIds?.includes(userId));
  }
  
  return [];
}

export function updateStudent(id, updates) {
  initializeMockStore();
  
  const index = mockStudents.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  mockStudents[index] = {
    ...mockStudents[index],
    ...updates,
    id, // Prevent ID changes
    updatedAt: new Date()
  };
  
  return mockStudents[index];
}

export function assignStudentToTeacher(studentId, teacherId, adminId) {
  initializeMockStore();
  
  const student = getStudentById(studentId);
  if (!student) return null;
  
  if (!student.assignedTeacherIds) {
    student.assignedTeacherIds = [];
  }
  
  if (!student.assignedTeacherIds.includes(teacherId)) {
    student.assignedTeacherIds.push(teacherId);
  }
  
  return updateStudent(studentId, {
    assignedTeacherIds: student.assignedTeacherIds
  });
}

export function removeStudent(id) {
  initializeMockStore();
  
  const index = mockStudents.findIndex(s => s.id === id);
  if (index === -1) return false;
  
  mockStudents[index].isActive = false;
  mockStudents[index].updatedAt = new Date();
  
  return true;
}

// Legacy compatibility functions
export function getAllStudents() {
  initializeMockStore();
  return mockStudents.filter(s => s.isActive !== false);
}

export function addStudent(student) {
  return createStudent(student, student.createdBy || 'system');
}

export function getStudentCount() {
  initializeMockStore();
  return mockStudents.filter(s => s.isActive !== false).length;
}

export function clearAllStudents() {
  mockStudents = [];
}

export function isFirebaseAvailable() {
  return false; // Mock store assumes Firebase is not available
}

// ============================================================================
// WISDOM STORE OPERATIONS (Crowdsourced Wisdom Tracking)
// ============================================================================

/**
 * Generate a strategy ID from strategy text
 * Creates a normalized, URL-friendly identifier
 */
export function generateStrategyId(strategyText) {
  if (!strategyText) return null;
  
  // Normalize: lowercase, remove special chars, replace spaces with hyphens
  const normalized = strategyText
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 100); // Limit length
  
  return normalized || `strategy-${Date.now()}`;
}

/**
 * Increment usage count for a strategy
 * Called when teacher clicks "Add to IEP"
 */
export function incrementStrategyUsage(strategyId) {
  if (!strategyId) return;
  
  if (!wisdomStore[strategyId]) {
    wisdomStore[strategyId] = 0;
  }
  wisdomStore[strategyId] += 1;
  
  // Persist to localStorage for persistence across sessions
  try {
    localStorage.setItem('wisdomStore', JSON.stringify(wisdomStore));
  } catch (e) {
    console.warn('Failed to persist wisdom store:', e);
  }
  
  return wisdomStore[strategyId];
}

/**
 * Get usage count for a strategy
 */
export function getStrategyUsage(strategyId) {
  if (!strategyId) return 0;
  return wisdomStore[strategyId] || 0;
}

/**
 * Get all strategy usage data
 */
export function getAllStrategyUsage() {
  return { ...wisdomStore };
}

/**
 * Initialize wisdom store from localStorage
 */
export function initializeWisdomStore() {
  try {
    const stored = localStorage.getItem('wisdomStore');
    if (stored) {
      wisdomStore = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load wisdom store from localStorage:', e);
    wisdomStore = {};
  }
}

// Initialize on module load
initializeWisdomStore();

// Export as default object for convenience
const MockStore = {
  // Schools
  createSchool,
  getSchoolById,
  getAllSchools,
  
  // Users
  createUser,
  getUserById,
  getUsersBySchool,
  updateUser,
  
  // Students
  createStudent,
  getStudentById,
  getStudentsBySchool,
  getStudentsForUser,
  updateStudent,
  assignStudentToTeacher,
  removeStudent,
  
  // Legacy
  getAllStudents,
  addStudent,
  getStudentCount,
  clearAllStudents,
  isFirebaseAvailable,
  
  // Wisdom Store
  generateStrategyId,
  incrementStrategyUsage,
  getStrategyUsage,
  getAllStrategyUsage,
  initializeWisdomStore,
  
  // Initialize
  initialize: initializeMockStore
};

export default MockStore;

