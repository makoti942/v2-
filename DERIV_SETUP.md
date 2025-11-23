# Deriv OAuth Setup Instructions

## Important: Configure Your Redirect URL

Before the login will work, you must configure your OAuth redirect URL in your Deriv application settings.

### Steps:

1. **Go to Deriv App Registration**
   - Visit: https://app.deriv.com/account/api-token
   - Or navigate to: Account Settings → API Token → Register Application

2. **Update Your App Settings**
   - App ID: `109236`
   - Find your registered application
   - Click "Edit" or "Manage"

3. **Add Redirect URLs**
   You need to add the redirect URL for your application. The URL will depend on where you are running your application. The format is typically `[your-app-url]/callback`.

   For example:
   *   **For GitHub Codespaces:** The URL will be provided to you when you run the application. It will look something like `https://[codespace-name]-[port].preview.app.github.dev/callback`.
   *   **For a custom domain:** `https://yourdomain.com/callback`

4. **Website URL Field**
   Set this to your main domain (without /callback).
    *   **For GitHub Codespaces:** `https://[codespace-name]-[port].preview.app.github.dev`
    *   **For a custom domain:** `https://yourdomain.com`

5. **Save Changes**
   Click "Update" or "Save" to apply the changes

## Testing the Login Flow

1. Open your app
2. Click "Login with Deriv Account"
3. You'll be redirected to Deriv's OAuth page
4. Log in with your Deriv credentials
5. After authorization, you'll be redirected back to your app
6. Your account(s) will be loaded automatically

## Troubleshooting

### "This site can't provide a secure connection"
- Make sure you've added the correct redirect URL in Deriv settings
- The redirect URL must match EXACTLY (including https://)
- Wait a few minutes after updating settings for changes to propagate

### "Unable to complete login request"
- Check browser console for errors
- Verify your App ID is correct (109236)
- Ensure you're using the correct Deriv account
- Try logging out of Deriv completely and logging back in

### No accounts showing up
- Make sure you have both demo and real accounts on Deriv
- Check that your accounts are active and not suspended
- Verify the tokens are being received in the callback URL

## Security Notes

- Tokens are stored in sessionStorage (cleared when browser closes)
- Each account type (demo/real) has its own token
- The app uses secure WebSocket connections (wss://)
- All API calls are made through Deriv's official WebSocket API
