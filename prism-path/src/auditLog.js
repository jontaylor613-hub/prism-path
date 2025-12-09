// FERPA-Compliant Audit Logging System
// Tracks all access and modifications to student data for compliance
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Log an audit event
export const logAuditEvent = async (eventData) => {
  try {
    const auditEvent = {
      userId: eventData.userId,
      userEmail: eventData.userEmail || '',
      action: eventData.action, // CREATE_STUDENT, VIEW_STUDENT, UPDATE_STUDENT, etc.
      resourceType: eventData.resourceType, // student, goal, behaviorLog, etc.
      resourceId: eventData.resourceId || '',
      resourceParentId: eventData.resourceParentId || '', // For nested resources
      details: eventData.details || {},
      ipAddress: eventData.ipAddress || '',
      userAgent: eventData.userAgent || '',
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'auditLogs'), auditEvent);
  } catch (error) {
    // Don't throw - audit logging should never break the app
    console.error('Error logging audit event:', error);
  }
};

// Get audit logs for a specific student (admin/SPED only)
export const getStudentAuditLogs = async (studentId, userId, userRole) => {
  try {
    if (userRole !== 'admin' && userRole !== 'sped') {
      throw new Error('Unauthorized: Only admins and SPED teachers can view audit logs');
    }

    const logsQuery = query(
      collection(db, 'auditLogs'),
      where('resourceParentId', '==', studentId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

// Get audit logs for a specific user (admin only)
export const getUserAuditLogs = async (targetUserId, requestingUserId, userRole) => {
  try {
    if (userRole !== 'admin') {
      throw new Error('Unauthorized: Only admins can view user audit logs');
    }

    const logsQuery = query(
      collection(db, 'auditLogs'),
      where('userId', '==', targetUserId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    throw error;
  }
};



