-- Sprint 1–4: AI 回覆控制、敏感詞、延遲、多語言
-- 設定存於 users 表（專案使用 users 而非獨立 settings 表）

-- Sprint 1: 回覆長度與格式控制
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS max_reply_length INTEGER DEFAULT 500,
  ADD COLUMN IF NOT EXISTS reply_temperature NUMERIC(3,2) DEFAULT 0.2,
  ADD COLUMN IF NOT EXISTS reply_format TEXT DEFAULT 'plain';

-- Sprint 2: 自訂敏感詞
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS custom_sensitive_words TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sensitive_word_reply TEXT DEFAULT '此問題涉及敏感內容，建議聯繫人工客服。';

-- Sprint 3: 回覆延遲
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS reply_delay_seconds NUMERIC(3,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_typing_indicator BOOLEAN DEFAULT false;

-- Sprint 4: 多語言
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auto_detect_language BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS supported_languages TEXT[] DEFAULT '{zh-TW}',
  ADD COLUMN IF NOT EXISTS fallback_language TEXT DEFAULT 'zh-TW';

COMMENT ON COLUMN public.users.max_reply_length IS 'AI 回覆最大 token 數 (50–1000)';
COMMENT ON COLUMN public.users.reply_format IS 'plain | bullet | concise';
