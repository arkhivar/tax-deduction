/*
  # Create storage policies for org-assets bucket

  1. Storage
    - Bucket `org-assets` is public for reading (QR codes, stamps, facsimiles shown on print page)
    - Anon can upload files (org portal uses anon key)
    - Anon can update/delete their own files

  2. Notes
    - Files are organized as: org-assets/{org_id}/qr.png, stamp.png, facsimile.png
    - Max file size controlled by Supabase settings
*/

CREATE POLICY "Public read access for org assets"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'org-assets');

CREATE POLICY "Anon can upload org assets"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'org-assets');

CREATE POLICY "Anon can update org assets"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'org-assets')
  WITH CHECK (bucket_id = 'org-assets');

CREATE POLICY "Anon can delete org assets"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'org-assets');
