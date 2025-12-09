# Using Existing OAuth Credentials

If you already have OAuth 2.0 Client IDs in your Google Cloud Console, you can use them! Here's how to check and configure them:

## Step 1: Find Your Existing OAuth Client IDs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Look for entries with type **OAuth 2.0 Client ID**
   - They'll show the name you gave them
   - The Client ID will be partially visible (ends with `.apps.googleusercontent.com`)

## Step 2: Check if It's Configured Correctly

Click on an existing OAuth Client ID (or click the edit/pencil icon) and verify:

### ✅ Required Settings:

1. **Application type**: Must be **Web application**
   - If it's "Desktop app" or "Other", you'll need to create a new one

2. **Authorized JavaScript origins**:
   - Must include: `http://localhost:5173` (for local dev)
   - Should include your production URL if deploying (e.g., `https://your-app.vercel.app`)

3. **Authorized redirect URIs**:
   - Must include: `http://localhost:5173` (for local dev)
   - Should include your production URL if deploying

### ✅ Required Scopes (in OAuth Consent Screen):

Go to **APIs & Services** → **OAuth consent screen** and check that these scopes are added:
- `https://www.googleapis.com/auth/documents` (Google Docs API)
- `https://www.googleapis.com/auth/drive.file` (Google Drive API)

## Step 3: Update Existing Client ID (If Needed)

If your existing OAuth Client ID is missing the right origins or redirect URIs:

1. Click on the OAuth Client ID to edit it
2. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `http://localhost:5173`
   - Your production URL (if applicable)
3. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   - `http://localhost:5173`
   - Your production URL (if applicable)
4. Click **SAVE**

## Step 4: Get the Client ID

1. In the OAuth Client ID details, you'll see the **Client ID**
2. Copy it (it looks like: `123456789-abc123.apps.googleusercontent.com`)
3. Add it to your `.env` file:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-existing-client-id.apps.googleusercontent.com
   ```

## If You Only Have API Keys

If you only see **API keys** (not OAuth Client IDs), you'll need to create an OAuth Client ID:

1. In **Credentials** page, click **+ CREATE CREDENTIALS**
2. Select **OAuth client ID**
3. Follow the setup steps (see `QUICK_OAUTH_SETUP.md`)

## Quick Test

After adding the Client ID to your `.env`:
1. Restart your dev server
2. Try the Google Docs export button
3. If you see a Google sign-in popup → ✅ It's working!
4. If you get an error → Check the browser console for details

## Common Issues

**"Redirect URI mismatch"**
- Make sure `http://localhost:5173` is in both Authorized JavaScript origins AND Authorized redirect URIs
- Check that your dev server is actually running on port 5173 (not 3000 or other)

**"Access blocked"**
- Go to OAuth consent screen
- Make sure you're added as a test user (if in testing mode)
- Verify the scopes are added

**"Invalid client"**
- Double-check you copied the Client ID correctly (no extra spaces)
- Make sure it's the Client ID (not Client Secret)
- Verify the environment variable name is exactly `VITE_GOOGLE_CLIENT_ID`

