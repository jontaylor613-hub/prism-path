// Dev Mode Access System
// Type "8675309" on home screen to unlock full access

const DEV_MODE_KEY = 'prismpath_dev_mode';
const DEV_MODE_CODE = '8675309';

export const DevModeService = {
  // Check if dev mode is active
  isActive: () => {
    try {
      return localStorage.getItem(DEV_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  },

  // Activate dev mode
  activate: () => {
    try {
      localStorage.setItem(DEV_MODE_KEY, 'true');
      return true;
    } catch {
      return false;
    }
  },

  // Deactivate dev mode
  deactivate: () => {
    try {
      localStorage.removeItem(DEV_MODE_KEY);
      return true;
    } catch {
      return false;
    }
  },

  // Check if entered code matches
  checkCode: (code) => {
    return code === DEV_MODE_CODE;
  }
};



