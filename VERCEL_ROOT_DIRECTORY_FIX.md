# Vercel Root Directory Fix

## Issue
After flattening the directory structure, Vercel build fails with:
```
The specified Root Directory "prism-path" does not exist. Please update your Project Settings.
```

## Solution

Update your Vercel Project Settings:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `prism-path` project
3. Go to **Settings** → **General**
4. Scroll to **Build & Development Settings**
5. Find **Root Directory**
6. **Clear/Remove** the value (it should be empty or set to `.`)
7. Click **Save**

## Why?
After flattening the directory structure, all files are now at the repository root level, not in a `prism-path/` subdirectory. Vercel needs to build from the root directory.

## After Fix
- Redeploy manually, or
- Push a new commit to trigger automatic deployment





