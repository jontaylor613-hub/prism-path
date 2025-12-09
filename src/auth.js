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
  ADMIN: 'admin',
  PARENT: 'parent'
};

// Create new user account with role assignment
export const signUp = async (email, password, userData) => {
  try {
    // Validate Firebase auth is properly configured
    if (!auth) {
      throw new Error('Firebase Authentication is not properly configured. Please check your Firebase settings.');
    }
    
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
      schoolId: userData.schoolId || '', // For parents, this will be 'home_school'
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
    // Provide more helpful error messages for common Firebase errors
    let errorMessage = error.message;
    
    if (error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      errorMessage = 'Firebase configuration error. Please ensure all Firebase environment variables are set correctly.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address. Please check your email format.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    throw new Error(errorMessage);
  }
};

// Sign in existing user
export const signIn = async (email, password) => {
  try {
    // Validate Firebase auth is properly configured
    if (!auth) {
      throw new Error('Firebase Authentication is not properly configured. Please check your Firebase settings.');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login timestamp
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp()
    }, { merge: true });

    return userCredential;
  } catch (error) {
    // Provide more helpful error messages for common Firebase errors
    let errorMessage = error.message;
    
    if (error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      errorMessage = 'Firebase configuration error. Please ensure all Firebase environment variables are set correctly.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please sign up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address. Please check your email format.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    }
    
    throw new Error(errorMessage);
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
export const hasStudentAccess = (userRole, studentData, userId) => {
  if (!userRole) return false;
  
  // Admins can access all students
  if (userRole === ROLES.ADMIN) return true;
  
  // SPED teachers can access SPED students
  if (userRole === ROLES.SPED) {
    return studentData.isSpedStudent === true;
  }
  
  // Regular Ed teachers can access their assigned students
  if (userRole === ROLES.REGULAR_ED) {
    return studentData.assignedTeachers?.includes(userId) || false;
  }
  
  // Parents can access their own children (students assigned to their userId)
  if (userRole === ROLES.PARENT) {
    return studentData.parentId === userId || studentData.assignedParents?.includes(userId) || false;
  }
  
  return false;
};


