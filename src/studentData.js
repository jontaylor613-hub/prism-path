// FERPA-Compliant Student Data Management
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { logAuditEvent } from './auditLog';

// Student data structure (FERPA-compliant)
export const createStudent = async (studentData, userId, userRole) => {
  try {
    // Validate user has permission to create students
    if (userRole !== 'admin' && userRole !== 'sped' && userRole !== 'parent') {
      throw new Error('Unauthorized: Only SPED teachers, admins, and parents can create student records');
    }

    const studentRef = doc(collection(db, 'students'));
    const student = {
      // Basic info (non-PII can be stored)
      name: studentData.name,
      grade: studentData.grade,
      primaryNeed: studentData.need,
      
      // Dates
      nextIepDate: studentData.nextIep || '',
      nextEvalDate: studentData.nextEval || '',
      next504Date: studentData.next504 || '', // 504 plan due date
      
      // Plan types
      hasIep: !!studentData.nextIep,
      has504: !!studentData.next504,
      
      // Access control
      createdBy: userId,
      assignedTeachers: userRole === 'parent' ? [] : [userId], // Teachers who can access this student
      isSpedStudent: userRole === 'sped',
      schoolId: userRole === 'parent' ? 'home_school' : (studentData.schoolId || ''),
      parentId: userRole === 'parent' ? userId : (studentData.parentId || ''), // For parent-created students
      
      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };

    await setDoc(studentRef, student);

    // Log audit event
    await logAuditEvent({
      userId,
      action: 'CREATE_STUDENT',
      resourceType: 'student',
      resourceId: studentRef.id,
      details: { name: studentData.name, grade: studentData.grade }
    });

    return { id: studentRef.id, ...student };
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

// Get students user has access to
export const getStudentsForUser = async (userId, userRole) => {
  try {
    let studentsQuery;
    
    if (userRole === 'admin') {
      // Admins can see all active students
      studentsQuery = query(
        collection(db, 'students'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else if (userRole === 'sped') {
      // SPED teachers see SPED students
      studentsQuery = query(
        collection(db, 'students'),
        where('isActive', '==', true),
        where('isSpedStudent', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else if (userRole === 'parent') {
      // Parents see their own children (students assigned to their userId)
      studentsQuery = query(
        collection(db, 'students'),
        where('isActive', '==', true),
        where('parentId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Regular Ed teachers see only assigned students
      studentsQuery = query(
        collection(db, 'students'),
        where('isActive', '==', true),
        where('assignedTeachers', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(studentsQuery);
    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Log access
    await logAuditEvent({
      userId,
      action: 'VIEW_STUDENTS_LIST',
      resourceType: 'students',
      details: { count: students.length }
    });

    return students;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

// Get single student (with access check)
export const getStudent = async (studentId, userId, userRole) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      throw new Error('Student not found');
    }

    const student = { id: studentSnap.id, ...studentSnap.data() };

    // Check access permissions
    const hasAccess = 
      userRole === 'admin' ||
      (userRole === 'sped' && student.isSpedStudent) ||
      student.assignedTeachers?.includes(userId) ||
      (userRole === 'parent' && (student.parentId === userId || student.assignedParents?.includes(userId)));

    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this student');
    }

    // Log access
    await logAuditEvent({
      userId,
      action: 'VIEW_STUDENT',
      resourceType: 'student',
      resourceId: studentId
    });

    return student;
  } catch (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
};

// Update student data
export const updateStudent = async (studentId, updates, userId, userRole) => {
  try {
    // Verify access first
    const student = await getStudent(studentId, userId, userRole);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    };

    await updateDoc(doc(db, 'students', studentId), updateData);

    // Log audit event
    await logAuditEvent({
      userId,
      action: 'UPDATE_STUDENT',
      resourceType: 'student',
      resourceId: studentId,
      details: { fields: Object.keys(updates) }
    });

    return { id: studentId, ...updateData };
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

// Save student goal
export const saveStudentGoal = async (studentId, goalData, userId) => {
  try {
    const goalRef = doc(collection(db, 'students', studentId, 'goals'));
    const goal = {
      ...goalData,
      studentId,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(goalRef, goal);

    await logAuditEvent({
      userId,
      action: 'CREATE_GOAL',
      resourceType: 'goal',
      resourceId: goalRef.id,
      resourceParentId: studentId
    });

    return { id: goalRef.id, ...goal };
  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
};

// Get student goals
export const getStudentGoals = async (studentId, userId) => {
  try {
    const goalsRef = collection(db, 'students', studentId, 'goals');
    const snapshot = await getDocs(query(goalsRef, orderBy('createdAt', 'desc')));
    
    const goals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Only log audit if userId is provided (skip for public token access)
    if (userId && userId !== 'system') {
      await logAuditEvent({
        userId,
        action: 'VIEW_GOALS',
        resourceType: 'goals',
        resourceParentId: studentId
      });
    }

    return goals;
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
};

// Save behavior log entry
export const saveBehaviorLog = async (studentId, logEntry, userId) => {
  try {
    const logRef = doc(collection(db, 'students', studentId, 'behaviorLogs'));
    const log = {
      ...logEntry,
      studentId,
      createdBy: userId,
      timestamp: serverTimestamp()
    };

    await setDoc(logRef, log);

    await logAuditEvent({
      userId,
      action: 'CREATE_BEHAVIOR_LOG',
      resourceType: 'behaviorLog',
      resourceId: logRef.id,
      resourceParentId: studentId
    });

    return { id: logRef.id, ...log };
  } catch (error) {
    console.error('Error saving behavior log:', error);
    throw error;
  }
};

// Get behavior logs
export const getBehaviorLogs = async (studentId, userId) => {
  try {
    const logsRef = collection(db, 'students', studentId, 'behaviorLogs');
    const snapshot = await getDocs(query(logsRef, orderBy('timestamp', 'desc')));
    
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return logs;
  } catch (error) {
    console.error('Error fetching behavior logs:', error);
    throw error;
  }
};

// Save 504 plan accommodations
export const save504Accommodations = async (studentId, accommodations, userId) => {
  try {
    const planRef = doc(db, 'students', studentId);
    await updateDoc(planRef, {
      '504Accommodations': accommodations,
      '504UpdatedAt': serverTimestamp(),
      '504UpdatedBy': userId,
      updatedAt: serverTimestamp()
    });

    await logAuditEvent({
      userId,
      action: 'UPDATE_504_ACCOMMODATIONS',
      resourceType: '504plan',
      resourceId: studentId
    });

    return true;
  } catch (error) {
    console.error('Error saving 504 accommodations:', error);
    throw error;
  }
};

// Get 504 plan accommodations
export const get504Accommodations = async (studentId, userId) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) {
      throw new Error('Student not found');
    }

    const student = studentSnap.data();
    return student['504Accommodations'] || '';
  } catch (error) {
    console.error('Error fetching 504 accommodations:', error);
    throw error;
  }
};

// Save IEP accommodations/summary
export const saveIepSummary = async (studentId, summary, userId) => {
  try {
    const planRef = doc(db, 'students', studentId);
    await updateDoc(planRef, {
      'iepSummary': summary,
      'iepUpdatedAt': serverTimestamp(),
      'iepUpdatedBy': userId,
      updatedAt: serverTimestamp()
    });

    await logAuditEvent({
      userId,
      action: 'UPDATE_IEP_SUMMARY',
      resourceType: 'iep',
      resourceId: studentId
    });

    return true;
  } catch (error) {
    console.error('Error saving IEP summary:', error);
    throw error;
  }
};

// Get IEP summary
export const getIepSummary = async (studentId, userId) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) {
      throw new Error('Student not found');
    }

    const student = studentSnap.data();
    return student['iepSummary'] || '';
  } catch (error) {
    console.error('Error fetching IEP summary:', error);
    throw error;
  }
};

// Remove student (soft delete)
export const removeStudent = async (studentId, userId, userRole) => {
  try {
    // Verify access first
    const student = await getStudent(studentId, userId, userRole);
    
    // Soft delete by setting isActive to false
    await updateDoc(doc(db, 'students', studentId), {
      isActive: false,
      removedAt: serverTimestamp(),
      removedBy: userId,
      updatedAt: serverTimestamp()
    });

    await logAuditEvent({
      userId,
      action: 'REMOVE_STUDENT',
      resourceType: 'student',
      resourceId: studentId,
      details: { name: student.name }
    });

    return true;
  } catch (error) {
    console.error('Error removing student:', error);
    throw error;
  }
};

// Generate secure token for student QR code
export const generateStudentToken = async (studentId, userId) => {
  try {
    // Generate a secure random token
    let token;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      token = crypto.randomUUID();
    } else {
      // Fallback for older browsers
      const randomPart1 = Math.random().toString(36).substring(2, 15);
      const randomPart2 = Math.random().toString(36).substring(2, 15);
      const randomPart3 = Math.random().toString(36).substring(2, 15);
      token = `${Date.now()}-${randomPart1}-${randomPart2}-${randomPart3}`;
    }
    
    // Store token in student document
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      trackingToken: token,
      tokenGeneratedAt: serverTimestamp(),
      tokenGeneratedBy: userId,
      updatedAt: serverTimestamp()
    });

    await logAuditEvent({
      userId,
      action: 'GENERATE_TRACKING_TOKEN',
      resourceType: 'student',
      resourceId: studentId
    });

    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// Get student by tracking token (public access, no auth required)
export const getStudentByToken = async (token) => {
  try {
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('trackingToken', '==', token), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const studentDoc = snapshot.docs[0];
    return { id: studentDoc.id, ...studentDoc.data() };
  } catch (error) {
    console.error('Error fetching student by token:', error);
    throw error;
  }
};

// Save progress tracking data point
// Uses mock data (localStorage) when Firebase is not available
export const saveProgressData = async (studentId, goalId, value, metadata = {}) => {
  try {
    // Try Firebase first if available
    if (db) {
      try {
        const progressRef = doc(collection(db, 'students', studentId, 'progress'));
        const progressData = {
          goalId,
          value,
          date: serverTimestamp(),
          ...metadata,
          createdAt: serverTimestamp()
        };

        await setDoc(progressRef, progressData);
        return { id: progressRef.id, ...progressData };
      } catch (firebaseError) {
        console.warn('[Progress] Firebase save failed, using mock data:', firebaseError);
        // Fall through to mock data
      }
    }
    
    // Mock data storage - store in localStorage for persistence
    const storageKey = `student_${studentId}_progress`;
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const newEntry = {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      goalId,
      value,
      date: new Date().toISOString(),
      ...metadata,
      createdAt: new Date().toISOString()
    };
    
    existingData.push(newEntry);
    localStorage.setItem(storageKey, JSON.stringify(existingData));
    
    console.log('[Mock Data] Progress saved:', newEntry);
    return newEntry;
  } catch (error) {
    console.error('Error saving progress data:', error);
    throw error;
  }
};

// Get progress history for a goal
export const getGoalProgress = async (studentId, goalId) => {
  try {
    const progressRef = collection(db, 'students', studentId, 'progress');
    const q = query(progressRef, where('goalId', '==', goalId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};


