# Google OAuth Setup Guide

The error `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` means Google OAuth is not enabled in your Supabase project. Follow these steps to enable it:

## Step 1: Enable Google OAuth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/etwgutkllvhofbrxmkrc/auth/providers

2. Click on "Google" in the providers list

3. Toggle the switch to enable Google OAuth

4. You'll need to add:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

## Step 2: Get Google OAuth Credentials

1. Go to Google Cloud Console: https://console.cloud.google.com/

2. Create a new project or select an existing one

3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "TradeNest" (or your app name)
   - Authorized redirect URIs: Add this URL:
     ```
     https://etwgutkllvhofbrxmkrc.supabase.co/auth/v1/callback
     ```
   - Click "Create"

5. Copy the credentials:
   - **Client ID**: Something like `123456789-abc.apps.googleusercontent.com`
   - **Client Secret**: A long string of random characters

## Step 3: Add Credentials to Supabase

1. Go back to Supabase Dashboard → Authentication → Providers → Google

2. You'll see two main fields:
   - **Client ID (for Google OAuth)**: Paste your Google Client ID here (e.g., `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret (for Google OAuth)**: Paste your Google Client Secret here

3. **Important**: Make sure you're entering the Client ID in the "Client ID (for Google OAuth)" field, NOT in the "Authorized JavaScript origins" field. The Client ID contains special characters like `-` and `.` which are not allowed in the origins field.

4. Click "Save"

## Step 4: Test the Integration

1. Restart your development server (if running)

2. Go to http://localhost:3000/login

3. Click "Continue with Google" button

4. You should be redirected to Google's consent screen

5. After signing in, you'll be redirected back to your app

## Troubleshooting

### Error: "Unsupported provider: provider is not enabled"
- **Solution**: Make sure you've toggled ON the Google provider in Supabase Dashboard

### Error: "redirect_uri_mismatch"
- **Solution**: Ensure the redirect URI in Google Cloud Console exactly matches:
  ```
  https://etwgutkllvhofbrxmkrc.supabase.co/auth/v1/callback
  ```

### Error 401: invalid_client / "The OAuth client was not found"
- **Solution**: This means the credentials in Supabase don't match Google Cloud Console. Follow these steps:

1. **Verify in Google Cloud Console**:
   - Go to https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Verify it's a "Web application" type (not "Desktop app" or "Android")
   - Copy the exact Client ID and Client Secret

2. **Update in Supabase**:
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Delete the current Client ID and Client Secret
   - Paste the new ones exactly as they appear in Google Cloud Console
   - Click "Save"

3. **Verify OAuth Consent Screen**:
   - In Google Cloud Console, go to "APIs & Services" → "OAuth consent screen"
   - Make sure it's configured (even if in testing mode)
   - Add your email as a test user if in testing mode

4. **Check Redirect URI**:
   - In Google Cloud Console, verify this exact URI is added:
     ```
     https://etwgutkllvhofbrxmkrc.supabase.co/auth/v1/callback
     ```
   - No trailing slashes, exact match required

### Button doesn't do anything
- **Solution**: Check browser console for errors. Make sure Google OAuth is enabled in Supabase.

### Redirect loop
- **Solution**: Check that your callback route at `/auth/callback` is working correctly

## Additional Configuration (Optional)

### Add Authorized JavaScript Origins (for local development)

In Google Cloud Console, also add:
- http://localhost:3000
- http://localhost:3001 (if using different port)

### Enable Additional Scopes

If you need additional user information, you can request additional scopes in the `signInWithGoogle` function in `actions/auth.ts`.

## Summary

Once you complete these steps, the "Continue with Google" button will work. The implementation is complete - you just need to enable the Google provider in Supabase and add your Google OAuth credentials.