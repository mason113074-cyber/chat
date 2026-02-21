import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';
import { invalidateUserSettingsCache } from '@/lib/supabase';

const MIN_PROMPT_LENGTH = 10;
const MAX_PROMPT_LENGTH = 5000;

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: '伺服器設定不完整，請聯繫管理員' },
        { status: 503 }
      );
    }
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    let supabase;
    try {
      supabase = auth?.supabase ?? await createClient();
    } catch (e) {
      console.error('Settings API createClient error:', e);
      return NextResponse.json(
        { error: '無法連線至資料服務，請稍後再試' },
        { status: 503 }
      );
    }
    if (!user) {
      const { data: { user: u }, error: authError } = await supabase.auth.getUser();
      if (authError || !u) {
        return NextResponse.json({ error: '未授權，請先登入' }, { status: 401 });
      }
      user = u;
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        system_prompt, ai_model, store_name, quick_replies,
        line_login_user_id, line_login_display_name, line_login_photo_url,
        max_reply_length, reply_temperature, reply_format,
        custom_sensitive_words, sensitive_word_reply,
        reply_delay_seconds, show_typing_indicator,
        auto_detect_language, supported_languages, fallback_language
      `)
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({
        systemPrompt: null,
        aiModel: 'gpt-4o-mini',
        storeName: null,
        quickReplies: [],
      });
    }

    const quickReplies = Array.isArray(data?.quick_replies) ? data.quick_replies : [];

    return NextResponse.json({
      systemPrompt: data?.system_prompt ?? null,
      aiModel: data?.ai_model ?? 'gpt-4o-mini',
      storeName: data?.store_name ?? null,
      quickReplies,
      lineLoginBound: !!data?.line_login_user_id,
      lineLoginDisplayName: data?.line_login_display_name ?? null,
      lineLoginPhotoUrl: data?.line_login_photo_url ?? null,
      // Sprint 1–4
      maxReplyLength: data?.max_reply_length ?? 500,
      replyTemperature: Number(data?.reply_temperature ?? 0.2),
      replyFormat: data?.reply_format ?? 'plain',
      customSensitiveWords: Array.isArray(data?.custom_sensitive_words) ? data.custom_sensitive_words : [],
      sensitiveWordReply: data?.sensitive_word_reply ?? '此問題涉及敏感內容，建議聯繫人工客服。',
      replyDelaySeconds: Number(data?.reply_delay_seconds ?? 0),
      showTypingIndicator: Boolean(data?.show_typing_indicator),
      autoDetectLanguage: Boolean(data?.auto_detect_language),
      supportedLanguages: Array.isArray(data?.supported_languages) ? data.supported_languages : ['zh-TW'],
      fallbackLanguage: data?.fallback_language ?? 'zh-TW',
    });
  } catch (error) {
    console.error('Settings GET API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u }, error: authError } = await supabase.auth.getUser();
      if (authError || !u) return NextResponse.json({ error: '未授權，請先登入' }, { status: 401 });
      user = u;
    }

    const body = await request.json();
    const {
      systemPrompt,
      storeName,
      aiModel,
      quickReplies,
      maxReplyLength,
      replyTemperature,
      replyFormat,
      customSensitiveWords,
      sensitiveWordReply,
      replyDelaySeconds,
      showTypingIndicator,
      autoDetectLanguage,
      supportedLanguages,
      fallbackLanguage,
    } = body;

    if (typeof systemPrompt !== 'string') {
      return NextResponse.json(
        { error: '無效的 system_prompt 格式' },
        { status: 400 }
      );
    }

    if (systemPrompt.trim().length < MIN_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `System prompt 至少需要 ${MIN_PROMPT_LENGTH} 個字元` },
        { status: 400 }
      );
    }

    if (systemPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `System prompt 不能超過 ${MAX_PROMPT_LENGTH} 個字元` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { system_prompt: systemPrompt };
    if (typeof storeName === 'string') updates.store_name = storeName.trim().slice(0, 100) || null;
    if (typeof aiModel === 'string' && ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'].includes(aiModel)) {
      updates.ai_model = aiModel;
    }
    if (typeof maxReplyLength === 'number' && maxReplyLength >= 50 && maxReplyLength <= 1000) {
      updates.max_reply_length = Math.round(maxReplyLength);
    }
    if (typeof replyTemperature === 'number' && replyTemperature >= 0 && replyTemperature <= 1) {
      updates.reply_temperature = replyTemperature;
    }
    if (typeof replyFormat === 'string' && ['plain', 'bullet', 'concise'].includes(replyFormat)) {
      updates.reply_format = replyFormat;
    }
    if (Array.isArray(customSensitiveWords)) {
      const valid = customSensitiveWords
        .filter((w: unknown) => typeof w === 'string' && w.trim().length > 0)
        .map((w: string) => w.trim().slice(0, 50))
        .slice(0, 200);
      updates.custom_sensitive_words = valid;
    }
    if (typeof sensitiveWordReply === 'string') {
      updates.sensitive_word_reply = sensitiveWordReply.trim().slice(0, 500) || null;
    }
    if (typeof replyDelaySeconds === 'number' && replyDelaySeconds >= 0 && replyDelaySeconds <= 5) {
      updates.reply_delay_seconds = replyDelaySeconds;
    }
    if (typeof showTypingIndicator === 'boolean') {
      updates.show_typing_indicator = showTypingIndicator;
    }
    if (typeof autoDetectLanguage === 'boolean') {
      updates.auto_detect_language = autoDetectLanguage;
    }
    if (Array.isArray(supportedLanguages)) {
      const valid = supportedLanguages.filter((l: unknown) =>
        typeof l === 'string' && ['zh-TW', 'en', 'ja', 'ko', 'th', 'vi'].includes(l)
      );
      if (valid.length > 0) updates.supported_languages = valid;
    }
    if (typeof fallbackLanguage === 'string' && ['zh-TW', 'en', 'ja', 'ko', 'th', 'vi'].includes(fallbackLanguage)) {
      updates.fallback_language = fallbackLanguage;
    }
    if (Array.isArray(quickReplies)) {
      const valid = quickReplies
        .filter(
          (r: unknown) =>
            r !== null &&
            typeof r === 'object' &&
            'id' in r &&
            'text' in r &&
            'enabled' in r &&
            typeof (r as { id: unknown }).id === 'string' &&
            typeof (r as { text: unknown }).text === 'string' &&
            typeof (r as { enabled: unknown }).enabled === 'boolean'
        )
        .slice(0, 5)
        .map((r: { id: string; text: string; enabled: boolean }) => ({
          id: String(r.id),
          text: String(r.text).slice(0, 100),
          enabled: Boolean(r.enabled),
        }));
      updates.quick_replies = valid;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error saving system_prompt:', error);
      return NextResponse.json(
        { error: '無法儲存設定' },
        { status: 500 }
      );
    }

    await invalidateUserSettingsCache(user.id);

    return NextResponse.json({ 
      success: true,
      message: '設定已儲存' 
    });
  } catch (error) {
    console.error('Settings POST API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
