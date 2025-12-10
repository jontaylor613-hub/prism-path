/**
 * Unified Student Service
 * 
 * Provides a unified interface for importing students from CSV
 * Works with both Firebase (via studentData) and mock store
 */

import { createStudent } from '../studentData';
import { createStudent as createStudentMock } from './mockStore';

/**
 * Import students from CSV data
 * 
 * @param {Array} students - Array of student objects from CSV
 * @param {string} userId - User ID of the person importing
 * @param {string} userRole - Role of the user (admin, teacher, etc.)
 * @returns {Promise<Array>} Array of created student objects
 */
export async function importStudentsFromCSV(students, userId, userRole) {
  if (!students || students.length === 0) {
    throw new Error('No students provided for import');
  }

  // Check if we're using Firebase or mock store
  // Try to use Firebase first, fall back to mock store
  try {
    const importedStudents = [];
    
    for (const studentData of students) {
      try {
        // Map CSV data to student data format
        const mappedData = {
          name: studentData.name || '',
          grade: studentData.grade || '',
          need: studentData.diagnosis || studentData.primaryNeed || '',
          nextIep: studentData.nextIep || '',
          nextEval: studentData.nextEval || '',
          next504: studentData.next504 || '',
          schoolId: studentData.schoolId || ''
        };

        // Create student using Firebase function
        const created = await createStudent(mappedData, userId, userRole);
        importedStudents.push(created);
      } catch (error) {
        console.error(`Error importing student ${studentData.name}:`, error);
        // Continue with next student even if one fails
      }
    }

    return importedStudents;
  } catch (error) {
    // Fallback to mock store if Firebase fails
    console.warn('Firebase import failed, trying mock store:', error);
    
    try {
      const importedStudents = [];
      for (const studentData of students) {
        // Map CSV data to student data format for mock store
        const mappedData = {
          name: studentData.name || '',
          grade: studentData.grade || '',
          diagnosis: studentData.diagnosis || '',
          need: studentData.diagnosis || '', // Also map to 'need' field
          schoolId: studentData.schoolId || ''
        };
        
        const created = createStudentMock(mappedData, userId, userRole);
        importedStudents.push(created);
      }
      
      return importedStudents;
    } catch (mockError) {
      console.error('Mock store import also failed:', mockError);
      throw new Error(`Failed to import students: ${mockError.message}`);
    }
  }
}

