# Integration Guide - Secure Modular Architecture

This guide explains how to integrate the 5 new modules into your application.

## 1. School Bubble Data Architecture

### Import the Types and Security Functions

```javascript
import { canUserViewStudent, filterStudentsByAccess, isSchoolAdmin } from './types/dataModels';
import MockStore from './lib/mockStore';

// Use security checks when displaying students
const accessibleStudents = filterStudentsByAccess(currentUser, allStudents);

// Check access before displaying student details
if (canUserViewStudent(currentUser, selectedStudent)) {
  // Render student data
}
```

### Update User/Student Creation

```javascript
// When creating a user, ensure schoolId is set
const newUser = await MockStore.createUser({
  uid: user.uid,
  role: 'teacher',
  schoolId: user.schoolId, // Auto-set from registration
  name: user.name,
  email: user.email
});

// When creating a student, auto-set schoolId and assignedTeacherIds
const newStudent = await MockStore.createStudent({
  name: studentData.name,
  diagnosis: studentData.diagnosis,
  schoolId: currentUser.schoolId, // Auto-set from current user
  assignedTeacherIds: [currentUser.uid] // Auto-assign to creator
}, currentUser.uid);
```

## 2. AI Router Integration

### Use the AI Router

```javascript
import { routeAIRequest } from './lib/aiRouter';

// Example: Generate learner profile
const profile = await routeAIRequest(
  'instant_help',
  `Student diagnosis: ${diagnosis}. Generate accommodation strategies.`,
  studentName // Will be anonymized automatically
);

// Example: IEP Builder
const goal = await routeAIRequest(
  'iep_builder',
  `Create an IEP goal for a student with ${diagnosis} in ${grade} grade.`,
  studentName
);
```

## 3. Admin Dashboard

### Add Route

```javascript
import AdminDashboard from './components/AdminDashboard';

// In App.jsx or router
<Route 
  path="/admin/dashboard" 
  element={
    <AdminDashboard 
      user={currentUser} 
      isDark={isDark} 
      onBack={() => navigate('/educator')} 
    />
  } 
/>
```

### Add Navigation Link (for admins only)

```javascript
{user?.role === 'admin' && (
  <Link to="/admin/dashboard">Admin Dashboard</Link>
)}
```

## 4. Teacher Quick Add with AI Profile Generation

### Update Add Student Form

Add this to your form state:

```javascript
const [generateProfile, setGenerateProfile] = useState(false);
```

Add checkbox to form:

```jsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="generateProfile"
    checked={generateProfile}
    onChange={(e) => setGenerateProfile(e.target.checked)}
    className="rounded"
  />
  <label htmlFor="generateProfile" className={theme.text}>
    Generate Draft Learner Profile?
  </label>
</div>
```

Update handleAddStudent:

```javascript
const handleAddStudent = async () => {
  // ... existing validation ...
  
  const studentData = {
    name: newStudent.name,
    grade: newStudent.grade,
    diagnosis: newStudent.need,
    schoolId: user.schoolId, // Auto-set
    assignedTeacherIds: [user.uid] // Auto-assign to self
  };
  
  const createdStudent = await MockStore.createStudent(studentData, user.uid);
  
  // Generate learner profile if checkbox was checked
  if (generateProfile && createdStudent.diagnosis) {
    try {
      const profile = await routeAIRequest(
        'instant_help',
        `Generate immediate accommodation strategies for a student with ${createdStudent.diagnosis} in grade ${createdStudent.grade}.`,
        createdStudent.name
      );
      
      // Update student with generated profile
      await MockStore.updateStudent(createdStudent.id, {
        learnerProfile: profile
      });
    } catch (error) {
      console.error('Error generating profile:', error);
      // Don't block student creation if profile generation fails
    }
  }
  
  // ... rest of handler ...
};
```

## 5. Password Validation

### Add to Sign-Up Form

```javascript
import { validatePassword } from './lib/passwordValidator';
import PasswordStrengthIndicator from './components/PasswordStrengthIndicator';

// In component
const [password, setPassword] = useState('');
const [passwordValidation, setPasswordValidation] = useState(null);

const handlePasswordChange = (e) => {
  const value = e.target.value;
  setPassword(value);
  setPasswordValidation(validatePassword(value));
};

// In JSX
<input
  type="password"
  value={password}
  onChange={handlePasswordChange}
  className={/* your styles */}
/>
<PasswordStrengthIndicator password={password} isDark={isDark} />

{passwordValidation && !passwordValidation.valid && (
  <ul className="text-red-400 text-sm mt-2">
    {passwordValidation.errors.map((error, idx) => (
      <li key={idx}>{error}</li>
    ))}
  </ul>
)}
```

### Validate Before Submission

```javascript
const handleSignUp = async () => {
  const validation = validatePassword(password);
  if (!validation.valid) {
    alert('Password does not meet requirements:\n' + validation.errors.join('\n'));
    return;
  }
  
  // Proceed with sign-up
};
```

## 6. Auto-Lock Screen

### Add to App Component

```javascript
import AutoLock from './components/AutoLock';

function App() {
  const [isLocked, setIsLocked] = useState(false);
  
  return (
    <>
      {/* Your app content */}
      
      <AutoLock 
        isDark={isDark}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        onUnlock={() => {
          // Optional: Re-authenticate or refresh session
        }}
      />
    </>
  );
}
```

## Mock Store Setup

### Initialize on App Start

```javascript
import MockStore from './lib/mockStore';

// In App.jsx or main entry point
useEffect(() => {
  MockStore.initialize();
  
  // Create default school if needed
  const defaultSchool = MockStore.getSchoolById('school-1');
  if (!defaultSchool) {
    MockStore.createSchool({
      id: 'school-1',
      name: 'Default School',
      adminIds: []
    });
  }
}, []);
```

## Security Checklist

- ✅ All students are filtered by `schoolId`
- ✅ Teachers only see students where `assignedTeacherIds` includes their `uid`
- ✅ Admins see all students in their school
- ✅ Student names are anonymized before sending to AI
- ✅ Passwords meet NIST 2025 standards
- ✅ Session auto-locks after 15 minutes of inactivity

## Testing

1. **School Isolation**: Create users in different schools, verify they can't see each other's students
2. **Role Permissions**: Create admin and teacher users, verify access restrictions
3. **AI Router**: Test each mode (`neuro_driver`, `accommodation_gem`, `iep_builder`, `instant_help`)
4. **Password Validation**: Test weak passwords, verify strength indicator updates
5. **Auto-Lock**: Wait 15 minutes without activity, verify lock screen appears

