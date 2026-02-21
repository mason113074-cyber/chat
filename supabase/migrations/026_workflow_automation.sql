-- Workflow automation: visual flow builder (Crisp-style)
-- user_id maps to tenant; nodes/edges stored as JSON for ReactFlow

CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT false,
  nodes jsonb DEFAULT '[]'::jsonb,
  edges jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_active ON public.workflows(user_id, is_active) WHERE is_active = true;

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own workflows" ON public.workflows;
CREATE POLICY "Users manage own workflows" ON public.workflows
  FOR ALL USING (auth.uid() = user_id);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS public.workflow_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  executed_nodes jsonb DEFAULT '[]'::jsonb,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow ON public.workflow_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_created ON public.workflow_logs(workflow_id, created_at DESC);

ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own workflow logs" ON public.workflow_logs;
CREATE POLICY "Users view own workflow logs" ON public.workflow_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Users insert logs for own workflows" ON public.workflow_logs;
CREATE POLICY "Users insert logs for own workflows" ON public.workflow_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid())
  );

COMMENT ON TABLE public.workflows IS 'Visual automation workflows (ReactFlow nodes/edges)';
COMMENT ON COLUMN public.workflows.nodes IS 'ReactFlow nodes array JSON';
COMMENT ON COLUMN public.workflows.edges IS 'ReactFlow edges array JSON';
