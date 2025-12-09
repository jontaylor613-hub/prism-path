/**
 * Mock Student Data Store
 * 
 * File: /lib/mockStore.js
 * 
 * In-memory store for student data when Firebase/Google Classroom integrations are unavailable
 * This is a fallback layer that works seamlessly with the unified studentService
 */

// In-memory store
let mockStudents = [];

/**
 * Initialize with default mock student
 */
export function initializeMockStore() {
  if (mockStudents.length === 0) {
    mockStudents = [
      {
        id: 'mock-1',
        name: 'Alex',
        grade: '5',
        diagnosis: 'ADHD',
        primaryNeed: 'ADHD',
        readingLevel: '3rd grade',
        accommodations: ['Extended time', 'Chunking', 'Movement breaks'],
        strengths: ['Creative problem solving', 'Strong verbal skills'],
        needs: ['Focus support', 'Organization strategies', 'Time management'],
        impact: 'Difficulty maintaining attention during independent work, affecting completion rates',
        iepGoals: [],
        hasIep: true,
        has504: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

/**
 * Get all active students
 */
export function getAllStudents() {
  initializeMockStore();
  return mockStudents.filter(s => s.isActive !== false);
}

/**
 * Get a student by ID
 */
export function getStudentById(id) {
  initializeMockStore();
  return mockStudents.find(s => s.id === id && s.isActive !== false) || null;
}

/**
 * Add a single student to the store
 */
export function addStudent(student) {
  initializeMockStore();
  
  const newStudent = {
    ...student,
    id: student.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: student.createdAt || new Date(),
    updatedAt: new Date(),
    isActive: student.isActive !== false
  };
  
  mockStudents.push(newStudent);
  return newStudent;
}

/**
 * Add multiple students from CSV import
 * Returns array of created student objects
 */
export function addStudentsFromCSV(students) {
  initializeMockStore();
  
  const newStudents = students.map(student => {
    return addStudent({
      name: student.name,
      grade: student.grade,
      diagnosis: student.diagnosis,
      primaryNeed: student.diagnosis,
      accommodations: student.accommodations || [],
      iepGoals: student.iepGoals || [],
      hasIep: (student.iepGoals && student.iepGoals.length > 0),
      has504: false,
      isActive: true
    });
  });
  
  return newStudents;
}

/**
 * Update a student
 */
export function updateStudent(id, updates) {
  initializeMockStore();
  
  const index = mockStudents.findIndex(s => s.id === id);
  if (index === -1) {
    return null;
  }
  
  mockStudents[index] = {
    ...mockStudents[index],
    ...updates,
    id, // Prevent ID changes
    updatedAt: new Date()
  };
  
  return mockStudents[index];
}

/**
 * Remove a student (soft delete)
 */
export function removeStudent(id) {
  initializeMockStore();
  
  const index = mockStudents.findIndex(s => s.id === id);
  if (index === -1) {
    return false;
  }
  
  mockStudents[index].isActive = false;
  mockStudents[index].updatedAt = new Date();
  
  return true;
}

/**
 * Clear all students (for testing/reset)
 */
export function clearAllStudents() {
  mockStudents = [];
}

/**
 * Get student count
 */
export function getStudentCount() {
  initializeMockStore();
  return mockStudents.filter(s => s.isActive !== false).length;
}

/**
 * Check if Firebase is available (used by unified service)
 * This is a simple check - in real implementation, you'd check Firebase connection
 */
export function isFirebaseAvailable() {
  // This will be checked by the unified service
  return false; // Mock store assumes Firebase is not available
}

