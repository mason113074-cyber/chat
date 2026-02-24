/**
 * Webhook helpers for LINE (e.g. rate-limit key by bot/tenant).
 */

export function buildRateLimitIdentifier(args: {
  botId?: string;
  ownerUserId?: string;
  lineUserId: string;
}): string {
  if (args.botId) return `bot:${args.botId}:${args.lineUserId}`;
  if (args.ownerUserId) return `user:${args.ownerUserId}:${args.lineUserId}`;
  return `line:${args.lineUserId}`;
}
