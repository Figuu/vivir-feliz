-- ============================================
-- COMPLETE STORAGE SETUP FOR BORING SKALE NEXT
-- ============================================
-- This script sets up storage buckets and RLS policies
-- Follow the instructions carefully in order

-- ============================================
-- STEP 1: CREATE BUCKETS (Manual in Dashboard)
-- ============================================
-- Since we cannot create buckets via SQL due to permissions,
-- you must create them manually in the Supabase Dashboard:
--
-- 1. Go to Storage → New Bucket
-- 2. Create "avatars" bucket:
--    - Name: avatars
--    - Public: OFF (uncheck the box)
--    - Click "Save"
--
-- 3. Create "files" bucket:
--    - Name: files  
--    - Public: OFF (uncheck the box)
--    - Click "Save"
--
-- After creating buckets, continue with STEP 2 below

-- ============================================
-- STEP 2: RUN THIS SQL TO VERIFY BUCKETS EXIST
-- ============================================
DO $$
BEGIN
  -- Check if buckets exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    RAISE EXCEPTION 'Bucket "avatars" does not exist. Please create it first in the Storage dashboard.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'files') THEN
    RAISE EXCEPTION 'Bucket "files" does not exist. Please create it first in the Storage dashboard.';
  END IF;
  
  RAISE NOTICE 'Buckets verified successfully!';
END $$;

-- Check data types for debugging
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'id';

-- ============================================
-- STEP 3: CHECK RLS STATUS (Cannot enable via SQL)
-- ============================================
-- Note: RLS on storage tables is typically already enabled by Supabase
-- We'll check the status but cannot modify it due to permissions
DO $$
DECLARE
  objects_rls_enabled boolean;
  buckets_rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO objects_rls_enabled
  FROM pg_class
  WHERE oid = 'storage.objects'::regclass;
  
  SELECT relrowsecurity INTO buckets_rls_enabled
  FROM pg_class
  WHERE oid = 'storage.buckets'::regclass;
  
  IF NOT objects_rls_enabled THEN
    RAISE WARNING 'RLS is not enabled on storage.objects. Contact Supabase support if needed.';
  ELSE
    RAISE NOTICE 'RLS is already enabled on storage.objects ✓';
  END IF;
  
  IF NOT buckets_rls_enabled THEN
    RAISE WARNING 'RLS is not enabled on storage.buckets. Contact Supabase support if needed.';
  ELSE
    RAISE NOTICE 'RLS is already enabled on storage.buckets ✓';
  END IF;
END $$;

-- ============================================
-- STEP 4: DROP EXISTING POLICIES (IF ANY)
-- ============================================
-- Clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files or superadmin can view all" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files or superadmin can delete any" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars or superadmin can view all" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars or superadmin can delete any" ON storage.objects;
DROP POLICY IF EXISTS "Users can view bucket info" ON storage.buckets;

-- ============================================
-- STEP 5: CREATE POLICIES FOR AVATARS BUCKET
-- ============================================

-- Policy: Users can upload their own avatars
-- Files must be stored as: {userId}/filename
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own avatars OR superadmins can view all
CREATE POLICY "Users can view their own avatars or superadmin can view all" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'SUPER_ADMIN'
    )
  )
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatars OR superadmins can delete any
CREATE POLICY "Users can delete their own avatars or superadmin can delete any" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'SUPER_ADMIN'
    )
  )
);

-- ============================================
-- STEP 6: CREATE POLICIES FOR FILES BUCKET
-- ============================================

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload their own files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own files OR superadmins can view all
CREATE POLICY "Users can view their own files or superadmin can view all" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'files' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'SUPER_ADMIN'
    )
  )
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files OR superadmins can delete any
CREATE POLICY "Users can delete their own files or superadmin can delete any" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'files' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'SUPER_ADMIN'
    )
  )
);

-- ============================================
-- STEP 7: BUCKET VISIBILITY POLICY
-- ============================================

-- Allow authenticated users to see bucket information
CREATE POLICY "Users can view bucket info" 
ON storage.buckets FOR SELECT 
USING (auth.role() = 'authenticated');

-- ============================================
-- STEP 8: VERIFY SETUP
-- ============================================

-- Show created buckets
SELECT 
    'Bucket' as type,
    id as name,
    CASE WHEN public THEN 'Public' ELSE 'Private' END as visibility,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'files');

-- Show applied policies
SELECT 
    'Policy' as type,
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'INSERT' THEN 'INSERT'
        WHEN cmd = 'SELECT' THEN 'SELECT'
        WHEN cmd = 'UPDATE' THEN 'UPDATE'
        WHEN cmd = 'DELETE' THEN 'DELETE'
        ELSE cmd::text
    END as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename IN ('objects', 'buckets')
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Storage setup completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- Buckets: avatars (private), files (private)';
  RAISE NOTICE '- RLS: Enabled on storage.objects and storage.buckets';
  RAISE NOTICE '- Policies: Applied for user-based access control';
  RAISE NOTICE '';
  RAISE NOTICE 'File Structure Requirements:';
  RAISE NOTICE '- All files must be stored as: {userId}/filename';
  RAISE NOTICE '- Example: abc123-def456/avatar-1234567890.jpg';
  RAISE NOTICE '';
END $$;