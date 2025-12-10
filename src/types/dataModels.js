/**
 * School Bubble Data Architecture
 * Strict data models for FERPA-compliant multi-school isolation
 */

/**
 * @typedef {Object} School
 * @property {string} id - Unique school identifier
 * @property {string} name - School name
 * @property {string[]} adminIds - Array of user UIDs with admin role for this school
 */

/**
 * @typedef {Object} User
 * @property {string} uid - Firebase Auth UID
 * @property {'admin' | 'teacher' | 'parent'} role - User role (admin, teacher, or parent)
 * @property {string} schoolId - School this user belongs to (null or 'home_school' for parents)
 * @property {string} name - User's display name
 * @property {string} email - User's email
 * @property {boolean} isActive - Whether the user account is active
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} lastLogin - Last login timestamp
 */

/**
 * @typedef {Object} Student
 * @property {string} id - Unique student identifier
 * @property {string} name - Student name (non-PII in context)
 * @property {string} diagnosis - Primary diagnosis/need
 * @property {string} schoolId - School this student belongs to ('home_school' for parent-created students)
 * @property {string[]} assignedTeacherIds - Array of teacher UIDs who can access this student
 * @property {string[]} parentIds - Array of parent UIDs who can access this student
 * @property {string} [learnerProfile] - Optional AI-generated learner profile
 * @property {string} [grade] - Student grade level
 * @property {boolean} isActive - Whether the student record is active
 * @property {Date} createdAt - Record creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Security Logic Helper Functions
 */

/**
 * Check if a user can view a specific student
 * @param {User} user - The current user
 * @param {Student} student - The student to check access for
 * @returns {boolean} True if user has access
 */
export function canUserViewStudent(user, student) {
  if (!user || !student) return false;
  
  // Admins can view all students in their school
  if (user.role === 'admin') {
    return user.schoolId === student.schoolId;
  }
  
  // Teachers can only view assigned students in their school
  if (user.role === 'teacher') {
    return user.schoolId === student.schoolId && 
           (student.assignedTeacherIds?.includes(user.uid) || false);
  }
  
  // Parents can only view their own children (students where parentIds includes their uid)
  if (user.role === 'parent') {
    return student.parentIds?.includes(user.uid) || false;
  }
  
  return false;
}

/**
 * Filter students array by user permissions
 * @param {User} user - The current user
 * @param {Student[]} students - Array of all students
 * @returns {Student[]} Filtered array of accessible students
 */
export function filterStudentsByAccess(user, students) {
  if (!user || !students) return [];
  
  return students.filter(student => canUserViewStudent(user, student));
}

/**
 * Check if user is admin for their school
 * @param {User} user - The current user
 * @param {School} school - The school to check
 * @returns {boolean} True if user is admin
 */
export function isSchoolAdmin(user, school) {
  if (!user || !school) return false;
  return user.role === 'admin' && user.schoolId === school.id && school.adminIds?.includes(user.uid);
}

