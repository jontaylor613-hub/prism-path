# FERPA-Compliant Setup Guide

This guide will walk you through setting up PrismPath with FERPA-compliant authentication and data storage.

## 🔐 What Makes This FERPA Compliant?

✅ **Secure Authentication** - Firebase Auth with email/password  
✅ **Role-Based Access Control** - Regular Ed, SPED, Admin roles  
✅ **Data Encryption** - All data encrypted in transit and at rest (Firebase default)  
✅ **Audit Logging** - Every access and modification is logged  
✅ **Access Controls** - Users can only see students they're authorized to access  
✅ **HTTPS Only** - All connections encrypted  

## 📋 Prerequisites

1. Firebase account (free tier works)
2. Vercel account (for deployment)
3. Google Cloud account (for Firebase)

## 🚀 Step 1: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it (e.g., "PrismPath")
4. Enable Google Analytics (optional)
5. Click "Create Project"

## 🔧 Step 2: Enable Firebase Services

### Enable Authentication
1. In Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Click "Save"

### Enable Firestore Database
1. In Firebase Console → Firestore Database
2. Click "Create Database"
3. Start in **Production mode** (we'll add rules next)
4. Choose a location (closest to your users)
5. Click "Enable"

### Enable Storage (for file uploads)
1. In Firebase Console → Storage
2. Click "Get Started"
3. Start in Production mode
4. Use same location as Firestore
5. Click "Done"

## 🔑 Step 3: Get Firebase Config

1. In Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click the web icon (`</>`)
4. Register app name: "PrismPath Web"
5. Copy the `firebaseConfig` object

## 📝 Step 4: Add Environment Variables

Create a `.env` file in your `prism-path` folder:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

**⚠️ IMPORTANT**: Add `.env` to `.gitignore` to keep your keys safe!

## 🛡️ Step 5: Deploy Firestore Security Rules

1. Copy the contents of `firestore.rules`
2. In Firebase Console → Firestore Database → Rules
3. Paste the rules
4. Click "Publish"

These rules enforce:
- Only authorized users can access student data
- Role-based permissions (Admin > SPED > Regular Ed)
- Audit logs are read-only
- Users can only see their assigned students

## 👥 Step 6: Create Initial Admin User

You'll need to create the first admin user manually:

1. In Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. After creating, go to Firestore Database
5. Create a document in `users` collection with ID = the user's UID
6. Add this data:
```json
{
  "email": "admin@yourschool.edu",
  "name": "Admin User",
  "role": "admin",
  "school": "Your School Name",
  "schoolDistrict": "Your District",
  "isActive": true,
  "createdAt": [timestamp],
  "lastLogin": [timestamp]
}
```

## 🚢 Step 7: Deploy to Vercel

1. Push your code to GitHub
2. In Vercel → Import Project
3. Add environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `GEMINI_API_KEY` (for AI features)
4. Deploy!

## ✅ Step 8: Test the System

1. Visit your deployed site
2. Go to "For Educators"
3. Click "Sign Up" to create a test account
4. Select role: "SPED Teacher" or "Regular Ed Teacher"
5. Log in and verify you can:
   - Create students (SPED/Admin only)
   - View only authorized students
   - Create goals and behavior logs
   - See audit logs (Admin/SPED only)

## 🔍 Monitoring & Compliance

### View Audit Logs
- Admin users can view all audit logs in Firestore
- Go to `auditLogs` collection to see all access events

### Access Reports
- Firebase Console → Firestore → Usage tab shows access patterns
- Audit logs show who accessed what and when

### Data Retention
- Student data is retained per your district's policy
- Set up Firestore data retention rules if needed
- Use `isActive: false` for soft deletes (FERPA requires data retention)

## 🆘 Troubleshooting

**"Permission denied" errors:**
- Check Firestore rules are deployed
- Verify user role in `users` collection
- Check browser console for specific error

**Can't create students:**
- Verify user role is "sped" or "admin"
- Check Firestore rules allow creation

**Can't see students:**
- Verify student has `assignedTeachers` array with your user ID
- Check `isSpedStudent` flag matches your role

## 📚 Additional Resources

- [FERPA Compliance Guide](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## ⚖️ Legal Disclaimer

This system provides technical safeguards for FERPA compliance, but you must:
- Have proper data use agreements with your district
- Train staff on FERPA requirements
- Regularly audit access logs
- Follow your district's specific policies

Consult with your district's legal/compliance team before production use.


