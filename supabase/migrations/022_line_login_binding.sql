-- LINE 綁定登入：在 users 表新增 LINE Login 欄位，供「用 LINE 登入」與「綁定 LINE」使用
-- LINE Login 使用 OAuth 2.0，callback 後以 line_login_user_id 辨識使用者

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS line_login_user_id text,
  ADD COLUMN IF NOT EXISTS line_login_display_name text,
  ADD COLUMN IF NOT EXISTS line_login_photo_url text;

-- 同一 LINE 帳號僅能綁定一個平台帳號
CREATE UNIQUE INDEX IF NOT EXISTS users_line_login_user_id_key
  ON public.users (line_login_user_id)
  WHERE line_login_user_id IS NOT NULL;

-- RLS：既有政策已允許使用者讀取/更新自己的 row，無需新增
-- 綁定時由已登入使用者更新自己的 line_login_*；登入時由 API 以 service role 依 line_login_user_id 查詢

COMMENT ON COLUMN public.users.line_login_user_id IS 'LINE Login OAuth 回傳的 user sub (唯一)';
COMMENT ON COLUMN public.users.line_login_display_name IS 'LINE 顯示名稱';
COMMENT ON COLUMN public.users.line_login_photo_url IS 'LINE 頭像 URL';
