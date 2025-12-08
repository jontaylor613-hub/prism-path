// FERPA-Compliant Authentication System
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// User roles for FERPA compliance
export const ROLES = {
  REGULAR_ED: 'regular_ed',
  SPED: 'sped',
  ADMIN: 'admin'
};

// Create new user account with role assignment
export const signUp = async (email, password, userData) => {
  try {
    // Create auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document with role and school info
    const userDoc = {
      email: user.email,
      name: userData.name || user.email.split('@')[0],
      role: userData.role || ROLES.REGULAR_ED,
      school: userData.school || '',
      schoolDistrict: userData.schoolDistrict || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: true
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);

    // Update auth profile
    if (userData.name) {
      await updateProfile(user, { displayName: userData.name });
    }

    return { user, userDoc };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Sign in existing user
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login timestamp
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp()
    }, { merge: true });

    return userCredential;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Sign out
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get current user's full profile (including role)
export const getCurrentUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Auth state observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await getCurrentUserProfile(user.uid);
      callback(profile);
    } else {
      callback(null);
    }
  });
};

// Check if user has permission to access student data
export const hasStudentAccess = (userRole, studentData) => {
  if (!userRole) return false;
  
  // Admins can access all students
  if (userRole === ROLES.ADMIN) return true;
  
  // SPED teachers can access SPED students
  if (userRole === ROLES.SPED) {
    return studentData.isSpedStudent === true;
  }
  
  // Regular Ed teachers can access their assigned students
  if (userRole === ROLES.REGULAR_ED) {
    return studentData.assignedTeachers?.includes(userRole) || false;
  }
  
  return false;
};


