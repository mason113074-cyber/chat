ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ai_handled';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(20) DEFAULT 'ai';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT true;

UPDATE conversations SET status = 'ai_handled', is_resolved = true, resolved_by = 'ai' WHERE status IS NULL;
