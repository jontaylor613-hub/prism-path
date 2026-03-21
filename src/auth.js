// Clerk-based authentication — replaces Firebase Auth
import { useUser, useAuth } from '@clerk/react';

// User roles for FERPA compliance
export const ROLES = {
  REGULAR_ED: 'regular_ed',
  SPED: 'sped',
  ADMIN: 'admin'
};

/**
 * Map Clerk user to PrismPath user shape.
 * Role from publicMetadata, or sessionStorage (set during sign-up redirect flow).
 */
function mapClerkToPrismUser(clerkUser) {
  if (!clerkUser) return null;
  const metadata = clerkUser.publicMetadata || {};
  let role = metadata.role;
  if (!role) {
    try {
      role = sessionStorage.getItem('prismpath_signup_role');
      if (role) sessionStorage.removeItem('prismpath_signup_role');
    } catch (_) {}
    role = role || ROLES.SPED;
  }
  const email = clerkUser.primaryEmailAddress?.emailAddress || '';
  const name = clerkUser.fullName || clerkUser.firstName || clerkUser.lastName || email?.split('@')[0] || 'User';
  return {
    uid: clerkUser.id,
    name,
    email,
    role,
    school: metadata.school || '',
    schoolDistrict: metadata.schoolDistrict || '',
    schoolId: metadata.schoolId || 'home_school',
    isDemo: false
  };
}

/**
 * Hook: Get current user in PrismPath shape
 */
export function usePrismAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const prismUser = user ? mapClerkToPrismUser(user) : null;
  return {
    user: prismUser,
    isLoaded,
    signOut: () => signOut()
  };
}

/**
 * Legacy onAuthChange - for components that need callback-style auth.
 * Returns unsubscribe function.
 * Note: Prefer usePrismAuth() in new code.
 */
export function onAuthChange(callback) {
  // Cannot implement callback-based API with Clerk hooks.
  // Components using onAuthChange must be refactored to use usePrismAuth().
  console.warn('onAuthChange is deprecated. Use usePrismAuth() instead.');
  callback(null);
  return () => {};
}

/**
 * Use useAuth().signOut() from @clerk/react in components for sign out.
 * This export is for backwards compat — components should migrate to useAuth().
 */
export const logout = null; // Deprecated: use useAuth().signOut() from @clerk/react

/**
 * Check if user has permission to access student data
 */
export const hasStudentAccess = (userRole, studentData) => {
  if (!userRole) return false;
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SPED) {
    return studentData.isSpedStudent === true;
  }
  if (userRole === ROLES.REGULAR_ED) {
    return studentData.assignedTeachers?.includes(userRole) || false;
  }
  return false;
};
