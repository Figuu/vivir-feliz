# Deployment Configuration

## Email Redirect URLs

When deploying your application, you need to configure the correct redirect URLs for authentication emails (sign-up confirmation, password reset, etc.).

### Environment Variables

Set the following environment variable in your deployment platform:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Replace `https://your-domain.com` with your actual production URL.

### Deployment Platforms

#### Vercel
1. Go to your project settings
2. Navigate to Environment Variables
3. Add `NEXT_PUBLIC_APP_URL` with your production URL

#### Netlify
1. Go to Site settings → Environment variables
2. Add `NEXT_PUBLIC_APP_URL` with your production URL

#### Other Platforms
Add the environment variable according to your platform's documentation.

### Supabase Configuration

Also ensure your Supabase project is configured with the correct redirect URLs:

1. Go to your Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Add your production URL to:
   - Site URL: `https://your-domain.com`
   - Redirect URLs:
     - `https://your-domain.com/dashboard`
     - `https://your-domain.com/update-password`
     - `https://your-domain.com/api/auth/callback`

### Local Development

For local development, the app will use `http://localhost:3000` by default if `NEXT_PUBLIC_APP_URL` is not set in your `.env.local` file.

### Testing

After deployment, test the following flows:
1. Sign up with a new email - verify the confirmation email links to your production URL
2. Password reset - verify the reset link goes to your production URL
3. Magic link login (if enabled) - verify the link redirects to your production dashboard