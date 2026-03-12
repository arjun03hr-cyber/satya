-- Create a custom users table for our JWT-based authentication
CREATE TABLE public.users_custom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We bypass RLS entirely by using the service_role key on the backend
-- Set up simple RLS to deny direct access from anon key (frontend should only hit our API)
ALTER TABLE public.users_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access from anon client"
ON public.users_custom
FOR ALL
TO anon
USING (false);

CREATE POLICY "Allow service_role access"
ON public.users_custom
FOR ALL 
TO service_role
USING (true);
