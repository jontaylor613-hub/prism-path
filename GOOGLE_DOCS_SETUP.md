# Google Docs & Drive Integration Setup

This guide will help you set up Google Docs and Google Drive integration for PrismPath.

## Prerequisites

1. A Google Cloud Project
2. Google Cloud Console access
3. OAuth 2.0 credentials

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Required APIs

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Enable the following APIs:
   - **Google Docs API**
   - **Google Drive API**
   - **Google Picker API**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields (App name, User support email, Developer contact)
   - Add scopes:
     - `https://www.googleapis.com/auth/documents`
     - `https://www.googleapis.com/auth/drive.file`
   - Add test users (your email) if in testing mode
   - Save and continue
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **PrismPath Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for local development)
     - `https://your-vercel-domain.vercel.app` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for local development)
     - `https://your-vercel-domain.vercel.app` (for production)
   - Click **Create**
5. Copy the **Client ID** (you'll need this)

## Step 4: Add Environment Variable

### For Local Development

Create or update `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `VITE_GOOGLE_CLIENT_ID`
   - **Value**: Your OAuth client ID
   - **Environment**: Production, Preview, Development (select all)
4. Save and redeploy

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the Accommodation Gem
3. Generate some differentiated work
4. Click **Google Docs** export button
5. You should be prompted to sign in with Google
6. After authentication, the document should be created automatically

## Troubleshooting

### "Google API not loaded"
- Make sure the Google API scripts are loaded in `index.html`
- Check browser console for script loading errors
- Try refreshing the page

### "OAuth token is required"
- Make sure `VITE_GOOGLE_CLIENT_ID` is set correctly
- Check that the OAuth consent screen is configured
- Verify you're using the correct client ID

### "Failed to create document"
- Check that Google Docs API is enabled in Google Cloud Console
- Verify the OAuth token has the correct scopes
- Check browser console and network tab for detailed errors

### Authentication popup doesn't appear
- Check browser popup blocker settings
- Verify the client ID is correct
- Make sure authorized origins include your current domain

## Security Notes

- Never commit your OAuth client ID to public repositories
- Use environment variables for all sensitive configuration
- The OAuth client ID is safe to expose in frontend code (it's public)
- The access tokens are temporary and scoped to specific permissions

## API Endpoints

The integration uses the following API endpoint:
- `/api/google-docs` - Creates a new Google Doc with provided content

This endpoint requires:
- `content` (string) - The document content
- `title` (string, optional) - Document title
- `accessToken` (string) - Google OAuth access token

## Features

✅ **Export to Google Docs** - Automatically creates a Google Doc with formatted content  
✅ **Import from Google Drive** - Select and import files directly from Google Drive  
✅ **OAuth2 Authentication** - Secure Google account authentication  
✅ **Automatic Formatting** - Preserves basic text structure and formatting  

## Support

If you encounter issues, check:
1. Browser console for errors
2. Network tab for API request/response details
3. Google Cloud Console for API quotas and limits
4. OAuth consent screen configuration

