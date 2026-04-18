-- Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'bug', 'suggestion', 'help'
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
    user_email TEXT -- optional: to make it easier for admin to see
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own feedback (though they might not need to read it back)
CREATE POLICY "Users can insert their own feedback" 
ON public.feedbacks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" 
ON public.feedbacks FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Only admins can view all feedback
CREATE POLICY "Admins can view all feedback" 
ON public.feedbacks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
