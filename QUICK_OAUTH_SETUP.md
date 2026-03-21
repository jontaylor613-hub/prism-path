# Quick OAuth 2.0 Setup Guide

Since you've already enabled the APIs, here's how to get your OAuth Client ID:

## Step 1: Configure OAuth Consent Screen (First Time Only)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Choose **External** (unless you have Google Workspace)
5. Fill in the required fields:
   - **App name**: `PrismPath` (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
6. Click **Save and Continue**
7. On **Scopes** page:
   - Click **Add or Remove Scopes**
   - Add these scopes:
     - `https://www.googleapis.com/auth/documents` (Google Docs API)
     - `https://www.googleapis.com/auth/drive.file` (Google Drive API - for file access)
   - Click **Update** → **Save and Continue**
8. On **Test users** page (if in testing mode):
   - Click **Add Users**
   - Add your email address
   - Click **Save and Continue**
9. Review and **Back to Dashboard**

## Step 2: Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**
4. If prompted about OAuth consent screen, click **Configure Consent Screen** and complete Step 1 above
5. In the **Create OAuth client ID** dialog:
   - **Application type**: Select **Web application**
   - **Name**: `PrismPath Web Client` (or any name you prefer)
   - **Authorized JavaScript origins**:
     - Click **+ ADD URI**
     - Add: `http://localhost:5173` (for local development)
     - If deploying to Vercel, also add: `https://your-app-name.vercel.app`
   - **Authorized redirect URIs**:
     - Click **+ ADD URI**  
     - Add: `http://localhost:5173` (for local development)
     - If deploying, also add: `https://your-app-name.vercel.app`
6. Click **CREATE**
7. **IMPORTANT**: A popup will appear with your **Client ID**
   - Copy the **Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
   - ⚠️ You won't be able to see the full Client ID again easily, so copy it now!

## Step 3: Add to Your Project

### For Local Development

1. Create or edit `.env` file in your project root (`prism-path` folder)
2. Add:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
3. Replace `your-client-id-here.apps.googleusercontent.com` with the actual Client ID you copied

### For Vercel (Production)

1. Go to your Vercel project dashboard
2. **Settings** → **Environment Variables**
3. Click **Add New**
4. **Key**: `VITE_GOOGLE_CLIENT_ID`
5. **Value**: Paste your Client ID
6. Select all environments (Production, Preview, Development)
7. Click **Save**
8. Redeploy your app

## Step 4: Test It

1. Restart your dev server if running: `npm run dev`
2. Go to your app
3. Click the **Google Docs** export button
4. You should see a Google sign-in popup
5. Sign in and authorize
6. The document should be created automatically!

## Troubleshooting

**"OAuth client not found"**
- Make sure you copied the Client ID correctly (no extra spaces)
- Verify the environment variable name is exactly `VITE_GOOGLE_CLIENT_ID`

**"Redirect URI mismatch"**
- Check that your current URL matches one of the Authorized JavaScript origins
- For local dev, make sure you're using `http://localhost:5173` (not 3000 or other ports)

**"Access blocked: This app's request is invalid"**
- Make sure you added your email as a test user (if in testing mode)
- Check that the OAuth consent screen is published or you're added as a test user

**Can't find the Client ID again?**
- Go to **APIs & Services** → **Credentials**
- Find your OAuth 2.0 Client ID in the list
- Click the edit/pencil icon to see the Client ID

## What You Need

You only need the **Client ID** (not the Client Secret). The Client ID is safe to use in frontend code - it's meant to be public.

The format looks like:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```






