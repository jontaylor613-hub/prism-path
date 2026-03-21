// Audit Logging — no-op (Clerk migration; was Firestore)
// For production, integrate with your preferred audit backend

export const logAuditEvent = async () => {
  // No-op: was Firestore, now stubbed for Clerk migration
};

export const getStudentAuditLogs = async () => {
  return [];
};

export const getUserAuditLogs = async () => {
  return [];
};
