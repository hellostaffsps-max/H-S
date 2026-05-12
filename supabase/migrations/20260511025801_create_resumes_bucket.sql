INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public resumes are viewable by everyone." ON storage.objects;
CREATE POLICY "Public resumes are viewable by everyone." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'resumes' );

DROP POLICY IF EXISTS "Users can upload their own resumes." ON storage.objects;
CREATE POLICY "Users can upload their own resumes." 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'resumes' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can update their own resumes." ON storage.objects;
CREATE POLICY "Users can update their own resumes." 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'resumes' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own resumes." ON storage.objects;
CREATE POLICY "Users can delete their own resumes." 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'resumes' AND auth.uid() = owner );
