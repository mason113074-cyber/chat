-- P0: Restrict ai_feedback INSERT to service_role only.
-- Previously: WITH CHECK (true) allowed any role to insert.
-- After: Only connections using service_role key can insert (webhook/backend only).

DROP POLICY IF EXISTS "Service role insert feedback" ON public.ai_feedback;

CREATE POLICY "Service role insert feedback" ON public.ai_feedback
  FOR INSERT
  TO service_role
  WITH CHECK (true);
