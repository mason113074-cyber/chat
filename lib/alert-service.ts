/**
 * 告警服務 - 支援 Discord 和 Slack Webhook
 * 當健康檢查失敗時自動發送通知
 */

export interface AlertPayload {
  type: 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  details?: unknown;
  timestamp?: string;
}

/**
 * 發送告警到 Discord 或 Slack
 */
export async function sendAlert(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('⚠️ No webhook URL configured for alerts');
    return false;
  }

  try {
    const isDiscord = webhookUrl.includes('discord.com');
    const body = isDiscord
      ? formatDiscordMessage(payload)
      : formatSlackMessage(payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`✅ Alert sent successfully (${isDiscord ? 'Discord' : 'Slack'})`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send alert:', error);
    return false;
  }
}

/**
 * Discord 訊息格式
 */
function formatDiscordMessage(payload: AlertPayload): Record<string, unknown> {
  const colorMap = {
    warning: 16776960, // 黃色
    error: 16711680, // 紅色
    critical: 10038562, // 深紅色
  };

  return {
    content: payload.message,
    embeds: [
      {
        title: payload.title,
        description: payload.details
          ? `\`\`\`json\n${JSON.stringify(payload.details, null, 2)}\n\`\`\``
          : undefined,
        color: colorMap[payload.type],
        timestamp: payload.timestamp || new Date().toISOString(),
        footer: {
          text: 'CustomerAI Pro Health Monitor',
        },
      },
    ],
  };
}

/**
 * Slack 訊息格式
 */
function formatSlackMessage(payload: AlertPayload): Record<string, unknown> {
  const emojiMap = {
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  return {
    text: `${emojiMap[payload.type]} ${payload.message}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: payload.title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: payload.message,
        },
      },
      ...(payload.details
        ? [
            {
              type: 'section' as const,
              text: {
                type: 'mrkdwn' as const,
                text: `\`\`\`${JSON.stringify(payload.details, null, 2)}\`\`\``,
              },
            },
          ]
        : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn' as const,
            text: `CustomerAI Pro | ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
          },
        ],
      },
    ],
  };
}

interface HealthCheckSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
}

interface FailedTest {
  category: string;
  test: string;
  status: string;
  duration: number;
  message?: string;
}

/**
 * 為健康檢查結果生成告警
 */
export async function sendHealthCheckAlert(
  summary: HealthCheckSummary,
  failedTests: FailedTest[]
): Promise<void> {
  if (summary.failed === 0) return;

  const severity = summary.failed >= 3 ? 'critical' : 'error';

  await sendAlert({
    type: severity,
    title: '🚨 CustomerAI Pro Health Check Failed',
    message: `${summary.failed} out of ${summary.total} tests failed`,
    details: {
      summary,
      failedTests: failedTests.map((t) => ({
        category: t.category,
        test: t.test,
        error: t.message,
      })),
    },
  });
}
