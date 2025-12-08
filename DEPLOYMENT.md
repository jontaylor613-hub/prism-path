# Deployment Guide: Getting Your Code Back to Vercel

After making edits locally, here's how to get everything back to Vercel.

## 🚀 Quick Deploy (Recommended)

### Option 1: Git Push (Automatic Deploy)
If your Vercel project is connected to GitHub:

1. **Save all your files** in your editor
2. **Open terminal** in your project folder
3. **Check what changed:**
   ```bash
   git status
   ```
4. **Add all changes:**
   ```bash
   git add .
   ```
5. **Commit with a message:**
   ```bash
   git commit -m "Add FERPA-compliant authentication and Firebase integration"
   ```
6. **Push to GitHub:**
   ```bash
   git push
   ```
7. **Vercel will automatically deploy!** 
   - Go to your Vercel dashboard
   - You'll see a new deployment starting
   - Wait 1-2 minutes for it to complete

### Option 2: Vercel CLI (Manual Deploy)
If you prefer to deploy manually:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd prism-path
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project? Yes
   - Select your project
   - Deploy!

## 📋 Before Deploying: Checklist

### ✅ Environment Variables
Make sure these are set in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/verify these variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `GEMINI_API_KEY`

3. **Important**: Make sure they're added to:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### ✅ Firebase Setup
1. Deploy Firestore security rules (see `FERPA_SETUP.md`)
2. Create at least one admin user in Firebase Console
3. Test authentication works

### ✅ Test Locally First
Before deploying, test that:
- [ ] Site builds without errors: `npm run build`
- [ ] Login/signup works
- [ ] You can create students (if SPED/Admin)
- [ ] Data saves to Firebase

## 🔧 Troubleshooting

### Build Fails
**Error: "Module not found"**
- Run `npm install` locally first
- Make sure all new dependencies are in `package.json`

**Error: "Environment variable missing"**
- Check all env vars are set in Vercel
- Redeploy after adding variables

### Authentication Not Working
- Verify Firebase config in environment variables
- Check Firebase Console → Authentication is enabled
- Check browser console for specific errors

### Can't Access Students
- Verify Firestore security rules are deployed
- Check user role in Firebase Console → Firestore → `users` collection
- Check audit logs for permission errors

## 📝 Git Workflow Tips

### If You Don't Have Git Set Up Yet:

1. **Initialize Git:**
   ```bash
   git init
   ```

2. **Create `.gitignore`:**
   ```
   node_modules/
   .env
   .env.local
   dist/
   .DS_Store
   ```

3. **Add files:**
   ```bash
   git add .
   ```

4. **First commit:**
   ```bash
   git commit -m "Initial commit with FERPA compliance"
   ```

5. **Connect to GitHub:**
   - Create a new repository on GitHub
   - Copy the repository URL
   - Run:
     ```bash
     git remote add origin YOUR_REPO_URL
     git push -u origin main
     ```

6. **Connect to Vercel:**
   - Vercel Dashboard → Add New Project
   - Import from GitHub
   - Select your repository
   - Add environment variables
   - Deploy!

## 🎯 After Deployment

1. **Test the live site:**
   - Visit your Vercel URL
   - Try logging in
   - Create a test student
   - Verify data saves

2. **Monitor:**
   - Check Vercel logs for errors
   - Check Firebase Console → Firestore for data
   - Check Firebase Console → Authentication for users

3. **Share with team:**
   - Send login credentials to test users
   - Create accounts for your team
   - Train on FERPA compliance requirements

## 🔄 Updating After Changes

Every time you make changes:

1. **Test locally:** `npm run dev`
2. **Commit:** `git add . && git commit -m "Description"`
3. **Push:** `git push`
4. **Wait:** Vercel auto-deploys in 1-2 minutes
5. **Verify:** Check the new deployment works

That's it! Your changes are live! 🎉


