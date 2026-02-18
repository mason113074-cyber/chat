-- Add quick_replies column to users table (settings are stored per-user here)
-- Each item: { "id": string, "text": string, "enabled": boolean }
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS quick_replies JSONB DEFAULT '[]'::jsonb;

-- Set default quick replies for existing records (Taiwan e-commerce examples)
UPDATE public.users
SET quick_replies = '[
  {"id": "1", "text": "📦 查詢訂單狀態", "enabled": true},
  {"id": "2", "text": "💰 運費怎麼計算？", "enabled": true},
  {"id": "3", "text": "🔄 如何退換貨？", "enabled": true}
]'::jsonb
WHERE quick_replies IS NULL OR quick_replies = '[]'::jsonb;
