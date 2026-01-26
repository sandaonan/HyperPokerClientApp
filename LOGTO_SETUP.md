# Logto Social Login Setup Guide

## Implementation Complete ✅

The following changes have been implemented:

### New Files Created
1. `.env.local` - Environment configuration (needs your Logto credentials)
2. `config/logto.ts` - Logto SDK configuration
3. `services/userSync.ts` - User synchronization between Logto and localStorage
4. `components/views/CallbackView.tsx` - OAuth callback handler

### Modified Files
1. `.gitignore` - Added environment file exclusions
2. `types.ts` - Added 'callback' to ViewState
3. `index.tsx` - Wrapped App with LogtoProvider
4. `App.tsx` - Integrated Logto authentication hooks
5. `components/views/LoginView.tsx` - Replaced with Logto sign-in button
6. `services/mockApi.ts` - Removed login/register/logout methods

## Setup Instructions

### 1. Create Logto Account

1. Go to https://logto.io
2. Click "Get Started" or "Sign Up"
3. Create a new account (free tier available)

### 2. Create Application in Logto Console

1. After login, create a new tenant (or use default)
2. Navigate to **Applications** in the sidebar
3. Click **Create Application**
4. Select **Single Page Application** (SPA)
5. Name it "HyperPoker" or your preferred name
6. Click **Create**

### 3. Configure Redirect URIs

In your application settings:

1. Scroll to **Redirect URIs** section
2. Add the following URIs:
   - **Sign-in redirect URI**: `http://localhost:3000/callback`
   - **Sign-out redirect URI**: `http://localhost:3000/`
3. For production, add your production URLs (e.g., `https://yourdomain.com/callback`)
4. Click **Save changes**

### 4. Configure Authentication Methods

Navigate to **Sign-in experience** in the sidebar:

#### Enable Google Login (Recommended)
1. Go to **Connectors** → **Social**
2. Click **Add social connector**
3. Select **Google**
4. You'll need:
   - **Google OAuth Client ID** (from Google Cloud Console)
   - **Google OAuth Client Secret**
5. Follow Logto's guide to get Google credentials: https://docs.logto.io/docs/recipes/integrate-google/
6. Enable the connector

#### Enable LINE Login (Popular in Taiwan/Asia)
1. Go to **Connectors** → **Social**
2. Click **Add social connector**
3. Select **LINE**
4. You'll need:
   - **LINE Channel ID**
   - **LINE Channel Secret**
5. Get credentials from LINE Developers Console: https://developers.line.biz/
6. Enable the connector

#### Enable Username/Password Login
1. Go to **Sign-in experience** → **Sign-up and sign-in**
2. Enable **Email** or **Username** as identifier
3. Choose authentication method:
   - **Password** - Traditional password login
   - **Verification code** - Passwordless OTP login
4. Save changes

### 5. Copy Credentials to `.env.local`

1. In Logto Console, go to your application
2. Copy the following values:
   - **App ID** (Application ID)
   - **Endpoint** (Your tenant endpoint, e.g., `https://xyz123.logto.app`)
3. Open `.env.local` in your project root
4. Replace the placeholder values:

```env
VITE_LOGTO_ENDPOINT=https://your-actual-tenant.logto.app
VITE_LOGTO_APP_ID=your-actual-app-id
VITE_LOGTO_CALLBACK_URI=http://localhost:3000/callback
VITE_LOGTO_SIGNOUT_URI=http://localhost:3000/
```

### 6. Test the Integration

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000
4. Click "使用 Logto 登入"
5. You should be redirected to Logto's sign-in page
6. Choose your authentication method (Google, LINE, or username/password)
7. After successful login, you'll be redirected back to the app

## Architecture Overview

### Authentication Flow

1. **Login**: User clicks "使用 Logto 登入" → Redirects to Logto
2. **Logto Authentication**: User signs in via Google/LINE/password
3. **Callback**: Logto redirects to `/callback` with auth code
4. **User Sync**: App fetches ID token claims and syncs to localStorage
5. **Session**: User is logged in and can access all features

### Data Persistence

- **Logto**: Handles secure authentication and provides core identity
  - User ID (`sub` claim)
  - Email, phone, name, profile picture
- **localStorage**: Stores extended profile data
  - `nationalId`, `birthday`, `kycUploaded`
  - Tournament registrations, wallet balances
  - Club memberships

### Key Functions (services/userSync.ts)

1. `syncLogtoUserToLocalStorage(claims)` - Creates/updates user from Logto claims
2. `getCurrentUser()` - Gets current user from localStorage
3. `clearCurrentSession()` - Clears session on logout

## Production Deployment

When deploying to production:

1. Update `.env.local` with production values:
   ```env
   VITE_LOGTO_CALLBACK_URI=https://yourdomain.com/callback
   VITE_LOGTO_SIGNOUT_URI=https://yourdomain.com/
   ```

2. Add production redirect URIs in Logto Console:
   - `https://yourdomain.com/callback`
   - `https://yourdomain.com/`

3. Configure allowed origins in Logto Console (CORS settings)

## Troubleshooting

### "Invalid redirect URI" error
- Ensure redirect URIs in `.env.local` exactly match those in Logto Console
- Check for trailing slashes (should match exactly)

### "App ID not found" error
- Verify `VITE_LOGTO_APP_ID` in `.env.local`
- Ensure the app ID is copied correctly from Logto Console

### User not syncing after login
- Check browser console for errors
- Verify ID token claims include expected fields (email, sub, etc.)
- Check localStorage for `hp_users` and `hp_session_user_id`

### Stuck on callback page
- Check CallbackView component for errors
- Verify Logto SDK is handling callback correctly
- Clear browser cache and localStorage, try again

## Support

- Logto Documentation: https://docs.logto.io
- Logto Discord: https://discord.gg/logto
- Logto GitHub: https://github.com/logto-io/logto

## Migration Notes

### Existing Mock Users

The old test user (`player1` / `password`) will no longer work. All users must authenticate via Logto.

### Profile Completion Flow

New users from Logto will have:
- `isProfileComplete: false` (initially)
- Need to complete profile in ProfileView (nationalId, birthday, KYC)
- After profile completion, can join clubs and register for tournaments

### Business Logic Unchanged

All tournament, wallet, and club features continue working as before. Only authentication is replaced.
