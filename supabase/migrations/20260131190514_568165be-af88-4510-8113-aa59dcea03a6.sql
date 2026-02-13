-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true);

-- Create policy for public to upload profile photos
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

-- Create policy for public to view profile photos
CREATE POLICY "Anyone can view profile photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- Create policy to allow updating profile photos
CREATE POLICY "Anyone can update profile photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'profile-photos');