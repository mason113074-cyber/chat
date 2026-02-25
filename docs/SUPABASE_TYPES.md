# Supabase TypeScript 類型生成

專案目前以 `lib/supabase.ts` 內手動維護的型別為主。若需從資料庫 schema 自動產生型別：

## 前置

- 已安裝 [Supabase CLI](https://supabase.com/docs/guides/cli)
- 已登入：`supabase login`
- 專案 ID：`aqnjiyuyopyuklragaau`（chat）

## 產生型別

```bash
npm run supabase:gen-types
```

或手動：

```bash
npx supabase gen types typescript --project-id aqnjiyuyopyuklragaau > types/supabase.ts
```

產生後可將 `types/supabase.ts` 匯入至 `lib/supabase.ts` 或 API 使用，並逐步替換手寫型別。
