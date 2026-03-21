// Student Data Management — localStorage-backed (Clerk migration; was Firestore)
import { generateAccessCode } from './utils/accessCodeGenerator';

const STORAGE_KEY = 'prismpath_students';
const TOKENS_KEY = 'prismpath_student_tokens';
const GOALS_KEY = (sid) => `prismpath_goals_${sid}`;
const BEHAVIOR_LOGS_KEY = (sid) => `prismpath_behavior_${sid}`;
const PROGRESS_KEY = (sid) => `prismpath_progress_${sid}`;
const DOCUMENTS_KEY = (sid) => `prismpath_docs_${sid}`;

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function loadJson(key, defaultVal = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadTokenMap() {
  return loadJson(TOKENS_KEY, {});
}

function saveTokenMap(map) {
  saveJson(TOKENS_KEY, map);
}

// No-op audit (was Firestore)
const logAuditEvent = async () => {};

function mapToStudentFormat(s) {
  return {
    id: s.id,
    name: s.name,
    grade: s.grade,
    need: s.primaryNeed || s.need,
    primaryNeed: s.primaryNeed || s.need,
    nextIep: s.nextIepDate || s.nextIep,
    nextIepDate: s.nextIepDate || s.nextIep,
    nextEval: s.nextEvalDate || s.nextEval,
    nextEvalDate: s.nextEvalDate || s.nextEval,
    next504: s.next504Date || s.next504,
    next504Date: s.next504Date || s.next504,
    behaviorPlan: s.behaviorPlan || false,
    summary: s.summary || '',
    accessCode: s.accessCode,
    transitionData: s.transitionData || null,
    ...s
  };
}

export const createStudent = async (studentData, userId, userRole) => {
  if (userRole !== 'admin' && userRole !== 'sped' && userRole !== 'parent') {
    throw new Error('Unauthorized: Only SPED teachers, admins, and parents can create student records');
  }

  const students = loadStudents();
  let accessCode = generateAccessCode();
  let attempts = 0;
  while (attempts < 10) {
    if (!students.some(s => s.accessCode === accessCode)) break;
    accessCode = generateAccessCode();
    attempts++;
  }

  const id = `student-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const student = {
    id,
    name: studentData.name,
    grade: studentData.grade || studentData.gradeLevel,
    gradeLevel: studentData.grade || studentData.gradeLevel,
    primaryNeed: studentData.need,
    nextIepDate: studentData.nextIep || '',
    nextEvalDate: studentData.nextEval || '',
    next504Date: studentData.next504 || '',
    hasIep: !!studentData.nextIep,
    has504: !!studentData.next504,
    accessCode,
    transitionData: studentData.transitionData || null,
    createdBy: userId,
    createdByRole: userRole,
    assignedTeachers: userRole === 'parent' ? [] : [userId],
    parentId: userRole === 'parent' ? userId : null,
    isSpedStudent: userRole === 'sped',
    schoolId: studentData.schoolId || '',
    summary: '',
    behaviorPlan: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  students.push(student);
  saveStudents(students);
  await logAuditEvent({ userId, action: 'CREATE_STUDENT', resourceType: 'student', resourceId: id, details: { name: studentData.name, grade: studentData.grade } });
  return { id, ...student };
};

export const getStudentsForUser = async (userId, userRole) => {
  const students = loadStudents().filter(s => s.isActive !== false);
  let filtered = [];

  if (userRole === 'admin') {
    filtered = students;
  } else if (userRole === 'parent') {
    filtered = students.filter(s => s.parentId === userId);
  } else if (userRole === 'sped') {
    filtered = students.filter(s => s.isSpedStudent);
  } else {
    filtered = students.filter(s => (s.assignedTeachers || []).includes(userId));
  }

  return filtered.map(mapToStudentFormat);
};

export const getStudent = async (studentId, userId, userRole) => {
  const students = loadStudents();
  const student = students.find(s => s.id === studentId && s.isActive !== false);
  if (!student) throw new Error('Student not found');

  const hasAccess = userRole === 'admin' || (userRole === 'sped' && student.isSpedStudent) || (student.assignedTeachers || []).includes(userId);
  if (!hasAccess) throw new Error('Unauthorized: You do not have access to this student');

  await logAuditEvent({ userId, action: 'VIEW_STUDENT', resourceType: 'student', resourceId: studentId });
  return mapToStudentFormat(student);
};

export const updateStudent = async (studentId, updates, userId, userRole) => {
  await getStudent(studentId, userId, userRole);
  const students = loadStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx === -1) throw new Error('Student not found');
  students[idx] = { ...students[idx], ...updates, updatedAt: new Date().toISOString(), updatedBy: userId };
  saveStudents(students);
  await logAuditEvent({ userId, action: 'UPDATE_STUDENT', resourceType: 'student', resourceId: studentId, details: { fields: Object.keys(updates) } });
  return { id: studentId, ...students[idx] };
};

export const saveStudentGoal = async (studentId, goalData, userId) => {
  const goals = loadJson(GOALS_KEY(studentId), []);
  const id = `goal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const goal = { id, studentId, ...goalData, createdBy: userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  goals.unshift(goal);
  saveJson(GOALS_KEY(studentId), goals);
  await logAuditEvent({ userId, action: 'CREATE_GOAL', resourceType: 'goal', resourceId: id, resourceParentId: studentId });
  return goal;
};

export const getStudentGoals = async (studentId, userId) => {
  const goals = loadJson(GOALS_KEY(studentId), []);
  if (userId && userId !== 'system') {
    await logAuditEvent({ userId, action: 'VIEW_GOALS', resourceType: 'goals', resourceParentId: studentId });
  }
  return goals;
};

export const saveBehaviorLog = async (studentId, logEntry, userId) => {
  const logs = loadJson(BEHAVIOR_LOGS_KEY(studentId), []);
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const log = { id, studentId, ...logEntry, createdBy: userId, timestamp: new Date().toISOString() };
  logs.unshift(log);
  saveJson(BEHAVIOR_LOGS_KEY(studentId), logs);
  await logAuditEvent({ userId, action: 'CREATE_BEHAVIOR_LOG', resourceType: 'behaviorLog', resourceId: id, resourceParentId: studentId });
  return log;
};

export const getBehaviorLogs = async (studentId) => {
  return loadJson(BEHAVIOR_LOGS_KEY(studentId), []);
};

export const save504Accommodations = async (studentId, accommodations, userId) => {
  const students = loadStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx === -1) throw new Error('Student not found');
  students[idx]._504Accommodations = accommodations;
  students[idx].updatedAt = new Date().toISOString();
  saveStudents(students);
  await logAuditEvent({ userId, action: 'UPDATE_504_ACCOMMODATIONS', resourceType: '504plan', resourceId: studentId });
  return true;
};

export const get504Accommodations = async (studentId) => {
  const students = loadStudents();
  const s = students.find(x => x.id === studentId);
  return s?._504Accommodations || '';
};

export const saveIepSummary = async (studentId, summary, userId) => {
  const students = loadStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx === -1) throw new Error('Student not found');
  students[idx].summary = summary;
  students[idx].iepSummary = summary;
  students[idx].updatedAt = new Date().toISOString();
  saveStudents(students);
  await logAuditEvent({ userId, action: 'UPDATE_IEP_SUMMARY', resourceType: 'iep', resourceId: studentId });
  return true;
};

export const getIepSummary = async (studentId) => {
  const students = loadStudents();
  const s = students.find(x => x.id === studentId);
  return s?.summary || s?.iepSummary || '';
};

export const saveStudentDocument = async (studentId, documentData, userId) => {
  const docs = loadJson(DOCUMENTS_KEY(studentId), []);
  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const doc = { id, ...documentData, uploadedBy: userId, uploadedAt: new Date().toISOString() };
  docs.unshift(doc);
  saveJson(DOCUMENTS_KEY(studentId), docs);
  await logAuditEvent({ userId, action: 'UPLOAD_DOCUMENT', resourceType: 'document', resourceId: id, resourceParentId: studentId });
  return doc;
};

export const getStudentDocuments = async (studentId) => {
  return loadJson(DOCUMENTS_KEY(studentId), []);
};

export const deleteStudentDocument = async (studentId, documentId, userId) => {
  const docs = loadJson(DOCUMENTS_KEY(studentId), []).filter(d => d.id !== documentId);
  saveJson(DOCUMENTS_KEY(studentId), docs);
  await logAuditEvent({ userId, action: 'DELETE_DOCUMENT', resourceType: 'document', resourceId: documentId, resourceParentId: studentId });
  return true;
};

export const removeStudent = async (studentId, userId, userRole) => {
  await getStudent(studentId, userId, userRole);
  const students = loadStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx === -1) throw new Error('Student not found');
  students[idx].isActive = false;
  students[idx].removedAt = new Date().toISOString();
  students[idx].removedBy = userId;
  saveStudents(students);
  await logAuditEvent({ userId, action: 'REMOVE_STUDENT', resourceType: 'student', resourceId: studentId });
  return true;
};

export const generateStudentToken = async (studentId, userId) => {
  const token = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;
  const map = loadTokenMap();
  map[token] = studentId;
  saveTokenMap(map);
  await logAuditEvent({ userId, action: 'GENERATE_TRACKING_TOKEN', resourceType: 'student', resourceId: studentId });
  return token;
};

export const getStudentByToken = async (token) => {
  const map = loadTokenMap();
  const studentId = map[token];
  if (!studentId) return null;
  const students = loadStudents().filter(s => s.isActive !== false);
  const s = students.find(x => x.id === studentId);
  return s ? { id: s.id, ...s } : null;
};

export const saveProgressData = async (studentId, goalId, value, metadata = {}) => {
  const progress = loadJson(PROGRESS_KEY(studentId), []);
  const id = `prog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry = { id, goalId, value, date: new Date().toISOString(), ...metadata, createdAt: new Date().toISOString() };
  progress.unshift(entry);
  saveJson(PROGRESS_KEY(studentId), progress);
  return entry;
};

export const getGoalProgress = async (studentId, goalId) => {
  const progress = loadJson(PROGRESS_KEY(studentId), []);
  return progress.filter(p => p.goalId === goalId).sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getStudentByAccessCode = async (accessCode) => {
  if (!accessCode || typeof accessCode !== 'string' || accessCode.replace(/[^A-Z0-9]/gi, '').length !== 6) return null;
  const code = accessCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const students = loadStudents().filter(s => s.isActive !== false);
  const s = students.find(x => (x.accessCode || '').replace(/[^A-Z0-9]/g, '') === code);
  if (!s) return null;
  return { id: s.id, name: s.name, gradeLevel: s.gradeLevel || s.grade, accessCode: s.accessCode, transitionData: s.transitionData || null };
};

export const updateStudentTransitionData = async (studentId, transitionData, userId) => {
  const students = loadStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx === -1) throw new Error('Student not found');
  students[idx].transitionData = transitionData;
  students[idx].updatedAt = new Date().toISOString();
  saveStudents(students);
  await logAuditEvent({ userId: userId || 'student', action: 'UPDATE_TRANSITION_DATA', resourceType: 'student', resourceId: studentId });
  return true;
};

export const updateStudentProfile = async (studentId, profileData) => {
  const students = loadStudents();
  const idx = students.findIndex(s => s.id === studentId);
  if (idx === -1) throw new Error('Student not found');
  students[idx] = { ...students[idx], ...profileData, updatedAt: new Date().toISOString(), updatedBy: 'student' };
  saveStudents(students);
  await logAuditEvent({ userId: 'student', action: 'UPDATE_STUDENT_PROFILE', resourceType: 'student', resourceId: studentId });
  return true;
};
