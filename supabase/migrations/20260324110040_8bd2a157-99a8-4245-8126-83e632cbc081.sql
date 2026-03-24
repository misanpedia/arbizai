
-- Support tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support messages table
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'user',
  sender_id uuid,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for support_messages
CREATE POLICY "Users can view messages of own tickets" ON public.support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert messages to own tickets" ON public.support_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all messages" ON public.support_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on tickets
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
