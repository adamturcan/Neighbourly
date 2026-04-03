-- Message reactions (emoji reactions like Messenger)
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id)  -- one reaction per user per message
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone in the conversation can see reactions
CREATE POLICY "Reactions are visible to conversation participants"
  ON public.message_reactions FOR SELECT USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions"
  ON public.message_reactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can delete own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
