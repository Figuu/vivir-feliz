# Supabase Policies

This directory contains all Row Level Security (RLS) policies that need to be applied to your Supabase database.

## Setup Instructions

### Complete Storage Setup
1. Open your Supabase dashboard
2. Go to **Storage** section and create two buckets:
   - **avatars** (private/unchecked public)
   - **files** (private/unchecked public)
3. Go to **SQL Editor**
4. Run `storage-complete-setup.sql` which will:
   - Verify buckets exist
   - Enable RLS
   - Apply all necessary policies
   - Show verification results

## Policy Files

### `storage-complete-setup.sql`
Complete setup script for storage buckets and RLS policies.

**Features:**
- Verifies bucket existence before applying policies
- Users can only access their own files (stored as `{userId}/filename`)
- SUPER_ADMIN can access all files
- Private buckets with signed URL access
- Automatic cleanup of conflicting policies
- Built-in verification of setup

## Policy Explanation

### File Access Rules
- **Regular Users**: Can only upload, view, update, and delete their own files
- **SUPER_ADMIN**: Can view and delete any user's files
- **File Path Structure**: Files must be stored in paths starting with the user's ID (e.g., `userId/filename.jpg`)

### Security Features
- Files are stored in private buckets
- Access is controlled through signed URLs
- URLs expire after a set time (1 year for users, 1 hour for admin viewing)
- Row Level Security prevents unauthorized access at the database level

## API Endpoints

The following API endpoints work with these policies:

### User Endpoints
- `POST /api/upload/avatar` - Upload avatar to private bucket
- `POST /api/user/refresh-avatar` - Refresh expired avatar URL

### Admin Endpoints (SUPER_ADMIN only)
- `GET /api/admin/files` - List all files in a bucket
- `DELETE /api/admin/files` - Delete any file
- `POST /api/admin/files/signed-url` - Generate signed URL for any file
- `GET /api/admin/users/[id]/avatar` - Get user's avatar (ADMIN & SUPER_ADMIN)

## Testing

After applying the policies, test the following scenarios:

1. **User File Access**: Users should only see their own files
2. **Admin File Access**: SUPER_ADMIN should see all files
3. **File Upload**: Files should be stored with correct path structure
4. **Unauthorized Access**: Direct bucket access should be blocked

## Troubleshooting

If you encounter issues:

1. **Check RLS is enabled**: Verify RLS is enabled on `storage.objects` and `storage.buckets`
2. **Verify bucket settings**: Ensure buckets are set to private
3. **Check user roles**: Verify users have correct roles in the `users` table
4. **Test policies**: Use Supabase's policy testing feature in the dashboard