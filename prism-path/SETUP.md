# PrismPath Setup Guide

## 🔐 Security Update
Your API keys are now **secure**! The app uses serverless functions that keep your API key on the server (never exposed in the browser).

## 🚀 Quick Start

### Option 1: Local Development (Recommended for editing)

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **For API to work locally, you have two options:**

   **Option A: Use Vercel Dev (Best for testing API)**
   - Install Vercel CLI: `npm install -g vercel`
   - In a **separate terminal**, run: `vercel dev`
   - This runs your serverless functions locally
   - Keep both terminals running (one for `npm run dev`, one for `vercel dev`)

   **Option B: Test on Vercel deployment**
   - Just deploy to Vercel and test there
   - The API will work automatically when deployed

### Option 2: Deploy to Vercel (Production)

1. **Push your code to GitHub** (if not already)

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Add Environment Variable**:
   - In Vercel dashboard → Your Project → Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your_google_api_key_here`
   - Get your key from: https://makersuite.google.com/app/apikey
   - **Important**: Make sure to add it to **Production**, **Preview**, and **Development** environments

4. **Deploy**: Vercel will automatically deploy!

## ✅ What Changed?

- ✅ API keys are now **server-side only** (secure!)
- ✅ No more `VITE_GOOGLE_API_KEY` needed in frontend
- ✅ Works automatically on Vercel
- ✅ Same code works locally and in production

## 🛠️ Making Edits

- Edit files in `src/` folder
- Changes auto-reload in browser
- Test locally, then push to GitHub
- Vercel auto-deploys on push

## ❓ Troubleshooting

**API not working locally?**
- Make sure you're running `vercel dev` in a separate terminal
- Or test on your Vercel deployment instead

**API not working on Vercel?**
- Check that `GEMINI_API_KEY` is set in Vercel environment variables
- Make sure it's added to all environments (Production, Preview, Development)



