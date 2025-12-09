/**
 * Unified Student Data Service
 * 
 * File: /lib/studentService.js
 * 
 * Provides a unified interface for student data access that:
 * 1. Tries Firebase first (when available)
 * 2. Falls back to mock store automatically
 * 3. Works seamlessly with existing code
 * 
 * This ensures the app works whether Firebase is connected or not
 */

import { 
  getStudentsForUser as getFirebaseStudents,
  createStudent as createFirebaseStudent,
  getStudent as getFirebaseStudent,
  updateStudent as updateFirebaseStudent,
  removeStudent as removeFirebaseStudent
} from '../src/studentData';
import { 
  getAllStudents as getMockStudents,
  getStudentById as getMockStudentById,
  addStudent as addMockStudent,
  addStudentsFromCSV as addMockStudentsFromCSV,
  updateStudent as updateMockStudent,
  removeStudent as removeMockStudent
} from './mockStore';

/**
 * Check if Firebase is properly configured and available
 * Optimized to avoid unnecessary Firebase calls
 */
let firebaseAvailabilityCache = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30000; // Cache for 30 seconds

async function isFirebaseAvailable() {
  try {
    // Use cached result if recent
    const now = Date.now();
    if (firebaseAvailabilityCache !== null && (now - lastCheckTime) < CACHE_DURATION) {
      return firebaseAvailabilityCache;
    }
    
    // Check if Firebase config is valid (not placeholder values)
    const config = import.meta.env;
    const hasValidConfig = 
      config.VITE_FIREBASE_API_KEY && 
      config.VITE_FIREBASE_API_KEY !== 'your-api-key' &&
      config.VITE_FIREBASE_PROJECT_ID &&
      config.VITE_FIREBASE_PROJECT_ID !== 'your-project-id';
    
    if (!hasValidConfig) {
      firebaseAvailabilityCache = false;
      lastCheckTime = now;
      return false;
    }
    
    // Try a simple Firebase operation with timeout (only if config looks valid)
    try {
      const testPromise = getFirebaseStudents('test', 'admin').catch(() => null);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 2000)
      );
      
      await Promise.race([testPromise, timeoutPromise]);
      firebaseAvailabilityCache = true;
      lastCheckTime = now;
      return true;
    } catch (error) {
      // Firebase not available or connection failed
      firebaseAvailabilityCache = false;
      lastCheckTime = now;
      return false;
    }
  } catch (error) {
    // Firebase not available or not configured
    firebaseAvailabilityCache = false;
    lastCheckTime = Date.now();
    return false;
  }
}

/**
 * Get all students for a user
 * Tries Firebase first, falls back to mock store
 */
export async function getStudents(userId = null, userRole = 'admin') {
  try {
    const firebaseAvailable = await isFirebaseAvailable();
    
    if (firebaseAvailable && userId) {
      try {
        const students = await getFirebaseStudents(userId, userRole);
        return students;
      } catch (error) {
        console.warn('Firebase fetch failed, using mock store:', error.message);
        // Fall through to mock store
      }
    }
    
    // Use mock store
    return getMockStudents();
  } catch (error) {
    console.error('Error getting students:', error);
    // Final fallback to mock store
    return getMockStudents();
  }
}

/**
 * Get a single student by ID
 */
export async function getStudent(studentId, userId = null, userRole = 'admin') {
  try {
    const firebaseAvailable = await isFirebaseAvailable();
    
    if (firebaseAvailable && userId) {
      try {
        const student = await getFirebaseStudent(studentId, userId, userRole);
        return student;
      } catch (error) {
        console.warn('Firebase fetch failed, using mock store:', error.message);
        // Fall through to mock store
      }
    }
    
    // Use mock store
    return getMockStudentById(studentId);
  } catch (error) {
    console.error('Error getting student:', error);
    return getMockStudentById(studentId);
  }
}

/**
 * Create a new student
 * Tries Firebase first, falls back to mock store
 */
export async function createStudent(studentData, userId = null, userRole = 'admin') {
  try {
    const firebaseAvailable = await isFirebaseAvailable();
    
    if (firebaseAvailable && userId) {
      try {
        const student = await createFirebaseStudent(studentData, userId, userRole);
        return student;
      } catch (error) {
        console.warn('Firebase create failed, using mock store:', error.message);
        // Fall through to mock store
      }
    }
    
    // Use mock store
    return addMockStudent({
      name: studentData.name,
      grade: studentData.grade,
      diagnosis: studentData.diagnosis || studentData.need,
      primaryNeed: studentData.diagnosis || studentData.need,
      accommodations: studentData.accommodations || [],
      iepGoals: studentData.iepGoals || [],
      hasIep: !!(studentData.nextIep || (studentData.iepGoals && studentData.iepGoals.length > 0)),
      has504: !!studentData.next504,
      nextIepDate: studentData.nextIep || '',
      nextEvalDate: studentData.nextEval || '',
      next504Date: studentData.next504 || ''
    });
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
}

/**
 * Bulk import students from CSV data
 * Tries Firebase first, falls back to mock store
 */
export async function importStudentsFromCSV(students, userId = null, userRole = 'admin') {
  try {
    const firebaseAvailable = await isFirebaseAvailable();
    const importedStudents = [];
    
    if (firebaseAvailable && userId) {
      // Try to create each student in Firebase
      for (const studentData of students) {
        try {
          const student = await createFirebaseStudent({
            name: studentData.name,
            grade: studentData.grade,
            need: studentData.diagnosis,
            // Map IEP goals and accommodations if needed
          }, userId, userRole);
          importedStudents.push(student);
        } catch (error) {
          console.warn(`Failed to create ${studentData.name} in Firebase, using mock store:`, error.message);
          // Fall through to mock store for this student
          const mockStudent = addMockStudent({
            name: studentData.name,
            grade: studentData.grade,
            diagnosis: studentData.diagnosis,
            primaryNeed: studentData.diagnosis,
            accommodations: studentData.accommodations || [],
            iepGoals: studentData.iepGoals || [],
            hasIep: (studentData.iepGoals && studentData.iepGoals.length > 0),
            has504: false
          });
          importedStudents.push(mockStudent);
        }
      }
    } else {
      // Use mock store for all students
      const mockStudents = addMockStudentsFromCSV(students);
      importedStudents.push(...mockStudents);
    }
    
    return importedStudents;
  } catch (error) {
    console.error('Error importing students:', error);
    // Final fallback to mock store
    return addMockStudentsFromCSV(students);
  }
}

/**
 * Update a student
 */
export async function updateStudent(studentId, updates, userId = null, userRole = 'admin') {
  try {
    const firebaseAvailable = await isFirebaseAvailable();
    
    if (firebaseAvailable && userId) {
      try {
        const student = await updateFirebaseStudent(studentId, updates, userId, userRole);
        return student;
      } catch (error) {
        console.warn('Firebase update failed, using mock store:', error.message);
        // Fall through to mock store
      }
    }
    
    // Use mock store
    return updateMockStudent(studentId, updates);
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

/**
 * Remove a student (soft delete)
 */
export async function removeStudent(studentId, userId = null, userRole = 'admin') {
  try {
    const firebaseAvailable = await isFirebaseAvailable();
    
    if (firebaseAvailable && userId) {
      try {
        await removeFirebaseStudent(studentId, userId, userRole);
        return true;
      } catch (error) {
        console.warn('Firebase remove failed, using mock store:', error.message);
        // Fall through to mock store
      }
    }
    
    // Use mock store
    return removeMockStudent(studentId);
  } catch (error) {
    console.error('Error removing student:', error);
    throw error;
  }
}

/**
 * Get student data for API route (used by generate.js)
 * Always returns a student object, using mock data if Firebase fails
 */
export async function getStudentDataForAPI(studentId = null) {
  try {
    const firebaseAvailable = await isFirebaseAvailable();
    
    if (firebaseAvailable && studentId) {
      try {
        // Try to get from Firebase (without auth check for API route)
        // This is a simplified version - in production, you'd want proper auth
        const students = await getFirebaseStudents('system', 'admin');
        const student = students.find(s => s.id === studentId);
        if (student) {
          return {
            name: student.name,
            grade: student.grade,
            diagnosis: student.primaryNeed || student.diagnosis || 'Not specified',
            accommodations: student.accommodations || [],
            strengths: student.strengths || [],
            needs: student.needs || [],
            impact: student.impact || ''
          };
        }
      } catch (error) {
        console.warn('Firebase fetch failed in API, using mock data:', error.message);
      }
    }
    
    // Fallback to mock data
    const mockStudents = getMockStudents();
    if (mockStudents.length > 0) {
      const student = studentId 
        ? mockStudents.find(s => s.id === studentId) 
        : mockStudents[0];
      
      if (student) {
        return {
          name: student.name,
          grade: student.grade,
          diagnosis: student.diagnosis || student.primaryNeed || 'Not specified',
          accommodations: student.accommodations || [],
          strengths: student.strengths || [],
          needs: student.needs || [],
          impact: student.impact || ''
        };
      }
    }
    
    // Final fallback - default mock data
    return {
      name: 'Alex',
      grade: '5',
      diagnosis: 'ADHD',
      accommodations: ['Extended time', 'Chunking', 'Movement breaks'],
      strengths: ['Creative problem solving', 'Strong verbal skills'],
      needs: ['Focus support', 'Organization strategies', 'Time management'],
      impact: 'Difficulty maintaining attention during independent work, affecting completion rates'
    };
  } catch (error) {
    console.error('Error getting student data for API:', error);
    // Return default mock data
    return {
      name: 'Alex',
      grade: '5',
      diagnosis: 'ADHD',
      accommodations: ['Extended time', 'Chunking', 'Movement breaks'],
      strengths: [],
      needs: [],
      impact: ''
    };
  }
}

